interface GitHubContentFileResponse {
  content?: string;
  encoding?: string;
  sha?: string;
}

interface GitHubErrorResponse {
  message?: string;
}

interface GitHubRefResponse {
  object?: {
    sha?: string;
  };
}

interface GitHubCommitResponse {
  sha?: string;
  tree?: {
    sha?: string;
  };
}

interface GitHubBlobResponse {
  sha?: string;
}

interface GitHubTreeResponse {
  sha?: string;
}

export interface GitHubTextFileWrite {
  path: string;
  content: string | null;
}

const GITHUB_API_VERSION = '2022-11-28';

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const getRepoConfig = () => ({
  owner: getRequiredEnv('GITHUB_CONTENTS_OWNER'),
  repo: getRequiredEnv('GITHUB_CONTENTS_REPO'),
  branch: process.env.GITHUB_CONTENTS_BRANCH?.trim() || 'main',
  token: getRequiredEnv('GITHUB_CONTENTS_TOKEN'),
});

const getContentUrl = (filePath: string) => {
  const { owner, repo } = getRepoConfig();
  return `https://api.github.com/repos/${owner}/${repo}/contents/${filePath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
};

const getRepoUrl = (pathName: string) => {
  const { owner, repo } = getRepoConfig();
  return `https://api.github.com/repos/${owner}/${repo}/${pathName}`;
};

const getHeaders = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${getRepoConfig().token}`,
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': GITHUB_API_VERSION,
});

const parseGitHubError = async (res: Response) => {
  const data = (await res.json().catch(() => ({}))) as GitHubErrorResponse;
  return data.message || `GitHub request failed with ${res.status}`;
};

export const isGitHubContentsEnabled = () =>
  process.env.NODE_ENV === 'production' && Boolean(process.env.GITHUB_CONTENTS_TOKEN?.trim());

export const readGitHubTextFile = async (filePath: string): Promise<string | null> => {
  const { branch } = getRepoConfig();
  const url = new URL(getContentUrl(filePath));
  url.searchParams.set('ref', branch);

  const res = await fetch(url, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await parseGitHubError(res));

  const data = (await res.json()) as GitHubContentFileResponse;
  if (!data.content || data.encoding !== 'base64') return null;

  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
};

export const writeGitHubTextFile = async (
  filePath: string,
  content: string,
  message: string
): Promise<void> => {
  const { branch } = getRepoConfig();
  const current = await getGitHubFileSha(filePath);

  const res = await fetch(getContentUrl(filePath), {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      branch,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      message,
      ...(current ? { sha: current } : {}),
    }),
  });

  if (!res.ok) throw new Error(await parseGitHubError(res));
};

export const writeGitHubTextFiles = async (
  files: GitHubTextFileWrite[],
  message: string
): Promise<void> => {
  if (files.length === 0) return;

  const { branch } = getRepoConfig();
  const refName = `heads/${branch}`;

  const refRes = await fetch(getRepoUrl(`git/ref/${refName}`), {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!refRes.ok) throw new Error(await parseGitHubError(refRes));

  const refData = (await refRes.json()) as GitHubRefResponse;
  const baseCommitSha = refData.object?.sha;
  if (!baseCommitSha) throw new Error('GitHub ref response did not include a commit SHA');

  const commitRes = await fetch(getRepoUrl(`git/commits/${baseCommitSha}`), {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!commitRes.ok) throw new Error(await parseGitHubError(commitRes));

  const commitData = (await commitRes.json()) as GitHubCommitResponse;
  const baseTreeSha = commitData.tree?.sha;
  if (!baseTreeSha) throw new Error('GitHub commit response did not include a tree SHA');

  const blobs = await Promise.all(
    files.map(async (file) => {
      if (file.content === null) return { path: file.path, sha: null };

      const blobRes = await fetch(getRepoUrl('git/blobs'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      });
      if (!blobRes.ok) throw new Error(await parseGitHubError(blobRes));

      const blobData = (await blobRes.json()) as GitHubBlobResponse;
      if (!blobData.sha)
        throw new Error(`GitHub blob response did not include a SHA: ${file.path}`);
      return { path: file.path, sha: blobData.sha };
    })
  );

  const treeRes = await fetch(getRepoUrl('git/trees'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      })),
    }),
  });
  if (!treeRes.ok) throw new Error(await parseGitHubError(treeRes));

  const treeData = (await treeRes.json()) as GitHubTreeResponse;
  if (!treeData.sha) throw new Error('GitHub tree response did not include a SHA');

  const newCommitRes = await fetch(getRepoUrl('git/commits'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [baseCommitSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(await parseGitHubError(newCommitRes));

  const newCommitData = (await newCommitRes.json()) as GitHubCommitResponse;
  if (!newCommitData.sha) throw new Error('GitHub commit response did not include a SHA');

  const updateRefRes = await fetch(getRepoUrl(`git/refs/${refName}`), {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: false,
    }),
  });
  if (!updateRefRes.ok) throw new Error(await parseGitHubError(updateRefRes));
};

export const deleteGitHubFile = async (filePath: string, message: string): Promise<void> => {
  const { branch } = getRepoConfig();
  const sha = await getGitHubFileSha(filePath);
  if (!sha) return;

  const res = await fetch(getContentUrl(filePath), {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({
      branch,
      message,
      sha,
    }),
  });

  if (!res.ok) throw new Error(await parseGitHubError(res));
};

const getGitHubFileSha = async (filePath: string): Promise<string | null> => {
  const { branch } = getRepoConfig();
  const url = new URL(getContentUrl(filePath));
  url.searchParams.set('ref', branch);

  const res = await fetch(url, {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await parseGitHubError(res));

  const data = (await res.json()) as GitHubContentFileResponse;
  return data.sha || null;
};
