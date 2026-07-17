interface GitHubContentFileResponse {
  content?: string;
  encoding?: string;
  sha?: string;
}

interface GitHubErrorResponse {
  message?: string;
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
