import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/same-origin';
import { redirectPrivatePageWithoutSession, requiresSameOriginMutation } from '@/lib/request-boundary';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'imprimbrain_session';

/**
 * Public pages, including /, /discover and /imp/*, stay outside the authentication boundary.
 * This proxy is only an early routing/CSRF boundary; real authentication and RBAC remain server-side.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (redirectPrivatePageWithoutSession(pathname, request.headers.get('cookie'), SESSION_COOKIE_NAME)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (!requiresSameOriginMutation(request.method, pathname)) return NextResponse.next();

  if (!isSameOriginRequest(
    request.headers.get('origin'),
    request.headers.get('referer'),
    request.nextUrl.origin,
  )) {
    return NextResponse.json({ error: 'Origine de requête invalide' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/ct',
    '/ct/:path*',
    '/super-admin',
    '/super-admin/:path*',
    '/ad/super-admin',
    '/ad/super-admin/:path*',
  ],
};
