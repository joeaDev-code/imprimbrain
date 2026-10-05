import type { Permission, Role } from '@/generated/prisma/client';

export const ROLE_DEFAULTS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [],
  ADMIN: [],
  OFFICER: [
    'DASHBOARD_VIEW', 'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_UPDATE',
    'SERVICES_VIEW', 'ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_UPDATE',
    'PAYMENTS_VIEW', 'PAYMENTS_CREATE', 'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_PAY', 'STOCK_VIEW', 'STOCK_UPDATE', 'STOCK_RESTOCK',
  ],
  SECRETARY: [
    'DASHBOARD_VIEW', 'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_UPDATE',
    'SERVICES_VIEW', 'ORDERS_VIEW', 'ORDERS_CREATE', 'PAYMENTS_VIEW', 'PAYMENTS_CREATE', 'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_PAY',
  ],
};

export type PermissionOverride = { permission: Permission; allowed: boolean };

export function can(
  user: { role: Role; permissions?: PermissionOverride[] },
  permission: Permission,
) {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return !user.permissions?.some((entry) => entry.permission === permission && !entry.allowed);
  }
  const override = user.permissions?.find((entry) => entry.permission === permission);
  if (override) return override.allowed;
  return ROLE_DEFAULTS[user.role]?.includes(permission) ?? false;
}

export function effectivePermissions(
  user: { role: Role; permissions?: PermissionOverride[] },
  permissionList: readonly Permission[],
) {
  return permissionList.filter((permission) => can(user, permission));
}
