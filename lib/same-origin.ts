export function isSameOriginRequest(origin: string | null, referer: string | null, expectedOrigin: string) {
  const source = origin || referer;
  if (!source) return false;
  try {
    return new URL(source).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}
