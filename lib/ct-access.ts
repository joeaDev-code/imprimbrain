import type { Permission, Role } from '@/generated/prisma/client';

export const CT_ROLES = ['ADMIN', 'OFFICER', 'SECRETARY'] as const;
export type CTRole = (typeof CT_ROLES)[number];

export function isCTRole(role: string): role is CTRole {
  return CT_ROLES.some((allowedRole) => allowedRole === role);
}

export function canonicalCTPath(role: CTRole) {
  return `/ct/${role.toLowerCase()}`;
}

export function authenticatedHomePath(role: Role | null, organizationId: string | null) {
  if (role === 'SUPER_ADMIN') return '/super-admin';
  if (role && isCTRole(role) && organizationId) return canonicalCTPath(role);
  return '/login';
}

export type CTRouteDecision =
  | { kind: 'allow'; role: CTRole }
  | { kind: 'redirect'; href: string }
  | { kind: 'deny'; href: '/login' };

export function decideCTRoute(role: Role | null, organizationId: string | null, requestedRole: string): CTRouteDecision {
  if (!role) return { kind: 'deny', href: '/login' };
  if (role === 'SUPER_ADMIN') return { kind: 'redirect', href: '/super-admin' };
  if (!organizationId || !isCTRole(role)) return { kind: 'deny', href: '/login' };
  const canonical = canonicalCTPath(role);
  if (requestedRole !== role.toLowerCase()) return { kind: 'redirect', href: canonical };
  return { kind: 'allow', role };
}

export function decideSuperAdminRoute(role: Role | null): { kind: 'allow' } | { kind: 'deny'; href: string } {
  if (role === 'SUPER_ADMIN') return { kind: 'allow' };
  if (role && isCTRole(role)) return { kind: 'deny', href: canonicalCTPath(role) };
  return { kind: 'deny', href: '/login' };
}

export function canRenderPermission(userPermissions: readonly Permission[], permission: Permission) {
  return userPermissions.includes(permission);
}
