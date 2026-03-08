import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const nodeEnv = process.env.NEXT_PUBLIC_NODE_ENV || 'production';

  if (nodeEnv !== 'development') return NextResponse.redirect(new URL('/', req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
