const PRIVATE_PAGE_PREFIXES = ['/ct/', '/super-admin'];

export function isPrivatePagePath(pathname: string) {
  return PRIVATE_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function requiresSameOriginMutation(method: string, pathname: string) {
  return pathname.startsWith('/api/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

export function hasSessionCookie(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((entry) => {
    const [name, ...value] = entry.trim().split('=');
    return name === cookieName && value.join('=').length > 0;
  });
}

export function redirectPrivatePageWithoutSession(pathname: string, cookieHeader: string | null, cookieName: string) {
  return isPrivatePagePath(pathname) && !hasSessionCookie(cookieHeader, cookieName);
}
