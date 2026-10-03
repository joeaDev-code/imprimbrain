import type { CTRole } from '@/lib/ct-access';
import { canonicalCTPath, isCTRole } from '@/lib/ct-access';

export function workspaceHref(pathname: string, legacyHref: string, ctPath: string) {
  const match = pathname.match(/^\/ct\/([^/]+)(?:\/|$)/);
  const role = match?.[1].toUpperCase();
  if (!role || !isCTRole(role)) return legacyHref;
  return `${canonicalCTPath(role)}${ctPath ? `/${ctPath.replace(/^\/+/, '')}` : ''}`;
}

export function ctPrestationsBase(role: CTRole) {
  return `${canonicalCTPath(role)}/prestations`;
}