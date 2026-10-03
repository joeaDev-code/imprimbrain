import type { CTRole } from '@/lib/ct-access';
import { canonicalCTPath } from '@/lib/ct-access';

/** Builds a UI route for an already verified CT role. It performs no authorization. */
export function ctPath(role: CTRole, path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `${canonicalCTPath(role)}${normalizedPath}`;
}
