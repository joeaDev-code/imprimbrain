import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/same-origin';
import { redirectPrivatePageWithoutSession, requiresSameOriginMutation } from '@/lib/request-boundary';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'imprimbrain_session';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Cookie presence is only an early routing boundary; server layouts verify the DB session and all RBAC.
  if (redirectPrivatePageWithoutSession(pathname, request.headers.get('cookie'), SESSION_COOKIE_NAME)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (!requiresSameOriginMutation(request.method, pathname)) return NextResponse.next();

  const allowed = isSameOriginRequest(
    request.headers.get('origin'),
    request.headers.get('referer'),
    request.nextUrl.origin,
  );
  if (!allowed) {
    return NextResponse.json({ error: 'Origine de requête invalide' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/ct', '/ct/:path*', '/admin', '/admin/:path*', '/super-admin', '/super-admin/:path*'],
};
