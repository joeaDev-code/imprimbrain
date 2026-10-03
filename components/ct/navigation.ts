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
  { href: '', label: 'Accueil', permission: 'DASHBOARD_VIEW', icon: LayoutDashboard },
  { href: 'prestations', label: 'Prestations', permission: 'ORDERS_VIEW', icon: ClipboardList },
  { href: 'clients', label: 'Clients', permission: 'CLIENTS_VIEW', icon: Users },
  { href: 'services', label: 'Services', permission: 'SERVICES_VIEW', icon: Tags },
  { href: 'depenses', label: 'Dépenses', permission: 'EXPENSES_VIEW', icon: Receipt },
  { href: 'stock', label: 'Stock', permission: 'STOCK_VIEW', icon: Boxes },
  { href: 'employes', label: 'Employés', permission: 'EMPLOYEES_VIEW', icon: UserCog },
  { href: 'audit', label: 'Journal', permission: 'AUDIT_VIEW', icon: ShieldCheck },
  { href: 'parametres', label: 'Paramètres', permission: 'SETTINGS_VIEW', icon: Settings },
] as const satisfies readonly {
  href: string;
  label: string;
  permission: Permission;
  icon: typeof LayoutDashboard;
}[];

export function filterCTNavigation(userPermissions: readonly Permission[]) {
  return ctNavigation.filter((entry) => hasPermission(userPermissions, entry.permission));
}
