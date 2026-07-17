import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}
