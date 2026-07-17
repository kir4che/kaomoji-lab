import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/adminAuth';

export const proxy = async (req: NextRequest) => {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();

  if (await isAdminRequest(req)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/api/admin/'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.redirect(new URL('/api/auth/github/start', req.url));
};

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
