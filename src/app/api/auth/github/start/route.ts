import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_OAUTH_STATE_COOKIE, createRandomToken } from '@/lib/adminAuth';

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

export async function GET(request: NextRequest) {
  try {
    const state = createRandomToken();
    const authorizationUrl = new URL('https://github.com/login/oauth/authorize');
    authorizationUrl.searchParams.set('client_id', getRequiredEnv('GITHUB_OAUTH_CLIENT_ID'));
    authorizationUrl.searchParams.set(
      'redirect_uri',
      new URL('/api/auth/github/callback', request.nextUrl.origin).toString()
    );
    authorizationUrl.searchParams.set('scope', 'read:user');
    authorizationUrl.searchParams.set('state', state);

    const res = NextResponse.redirect(authorizationUrl);
    res.cookies.set(ADMIN_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Admin auth is not configured' }, { status: 500 });
  }
}
