import { NextRequest, NextResponse } from 'next/server';

import {
  ADMIN_OAUTH_STATE_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminCookieOptions,
} from '@/lib/adminAuth';

interface GitHubTokenres {
  access_token?: string;
  error?: string;
}

interface GitHubUserres {
  login?: string;
}

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const redirectHome = (request: NextRequest) => NextResponse.redirect(new URL('/', request.url));

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(ADMIN_OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    const res = redirectHome(request);
    res.cookies.delete(ADMIN_OAUTH_STATE_COOKIE);
    return res;
  }

  try {
    const tokenres = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getRequiredEnv('GITHUB_OAUTH_CLIENT_ID'),
        client_secret: getRequiredEnv('GITHUB_OAUTH_CLIENT_SECRET'),
        code,
        redirect_uri: new URL('/api/auth/github/callback', request.nextUrl.origin).toString(),
      }),
    });

    if (!tokenres.ok) throw new Error('GitHub token request failed');

    const tokenData = (await tokenres.json()) as GitHubTokenres;
    if (!tokenData.access_token || tokenData.error) throw new Error('GitHub token denied');

    const userres = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenData.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!userres.ok) throw new Error('GitHub user request failed');

    const userData = (await userres.json()) as GitHubUserres;
    if (userData.login !== getRequiredEnv('ADMIN_GITHUB_USERNAME')) {
      const res = redirectHome(request);
      res.cookies.delete(ADMIN_OAUTH_STATE_COOKIE);
      res.cookies.delete(ADMIN_SESSION_COOKIE);
      return res;
    }

    const res = NextResponse.redirect(new URL('/admin', request.url));
    res.cookies.delete(ADMIN_OAUTH_STATE_COOKIE);
    res.cookies.set(
      ADMIN_SESSION_COOKIE,
      await createAdminSession(userData.login),
      getAdminCookieOptions(request)
    );
    return res;
  } catch {
    const res = redirectHome(request);
    res.cookies.delete(ADMIN_OAUTH_STATE_COOKIE);
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }
}
