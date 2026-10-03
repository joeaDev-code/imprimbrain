import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  UserCog,
} from 'lucide-react';
import type { Permission } from '@/generated/prisma/client';
import { hasPermission } from '@/lib/ct-permissions';

export const ctNavigation = [
  { href: '', label: 'Accueil', permission: 'DASHBOARD_VIEW', legacyHref: '/admin', icon: LayoutDashboard },
  { href: 'prestations', label: 'Prestations', permission: 'ORDERS_VIEW', legacyHref: '/admin/prestations', icon: ClipboardList },
  { href: 'clients', label: 'Clients', permission: 'CLIENTS_VIEW', legacyHref: '/admin/clients', icon: Users },
  { href: 'services', label: 'Services', permission: 'SERVICES_VIEW', legacyHref: '/admin/services', icon: Tags },
  { href: 'depenses', label: 'Dépenses', permission: 'EXPENSES_VIEW', legacyHref: '/admin/depenses', icon: Receipt },
  { href: 'stock', label: 'Stock', permission: 'STOCK_VIEW', legacyHref: '/admin/stock', icon: Boxes },
  { href: 'employes', label: 'Employés', permission: 'EMPLOYEES_VIEW', legacyHref: '/admin/employes', icon: UserCog },
  { href: 'audit', label: 'Journal', permission: 'AUDIT_VIEW', legacyHref: '/admin/audit', icon: ShieldCheck },
  { href: 'parametres', label: 'Paramètres', permission: 'SETTINGS_VIEW', legacyHref: '/admin/parametres', icon: Settings },
] as const satisfies readonly {
  href: string;
  label: string;
  permission: Permission;
  legacyHref: string;
  icon: typeof LayoutDashboard;
}[];

export function filterCTNavigation(userPermissions: readonly Permission[]) {
  return ctNavigation.filter((entry) => hasPermission(userPermissions, entry.permission));
}
