import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'kaomoji_admin_session';
export const ADMIN_OAUTH_STATE_COOKIE = 'kaomoji_admin_oauth_state';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface AdminSessionPayload {
  login: string;
  exp: number;
}

const encoder = new TextEncoder();

const getAdminUsername = () => process.env.ADMIN_GITHUB_USERNAME?.trim() || '';
const getAuthSecret = () => process.env.ADMIN_AUTH_SECRET?.trim() || '';

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlEncodeString = (value: string) => base64UrlEncode(encoder.encode(value));

const base64UrlDecodeString = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Array.from(binary, (char) => char.charCodeAt(0));
};

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};

const sign = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
};

export const createRandomToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

export const createAdminSession = async (login: string) => {
  const secret = getAuthSecret();
  if (!secret) throw new Error('Missing ADMIN_AUTH_SECRET');

  const payload: AdminSessionPayload = {
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

export const verifyAdminSession = async (sessionCookie?: string) => {
  const secret = getAuthSecret();
  const allowedLogin = getAdminUsername();
  if (!sessionCookie || !secret || !allowedLogin) return false;

  const [encodedPayload, signature] = sessionCookie.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = await sign(encodedPayload, secret);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payloadText = new TextDecoder().decode(
      new Uint8Array(base64UrlDecodeString(encodedPayload))
    );
    const payload = JSON.parse(payloadText) as Partial<AdminSessionPayload>;
    return (
      payload.login === allowedLogin &&
      typeof payload.exp === 'number' &&
      payload.exp > Date.now() / 1000
    );
  } catch {
    return false;
  }
};

export const isAdminRequest = async (request: NextRequest) =>
  verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

export const getAdminCookieOptions = (request: NextRequest) => ({
  httpOnly: true,
  secure: request.nextUrl.protocol === 'https:',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
});
