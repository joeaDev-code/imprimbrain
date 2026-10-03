import type { Permission } from '@/generated/prisma/client';

export function hasPermission(permissions: readonly Permission[], permission: Permission) {
  return permissions.includes(permission);
}
