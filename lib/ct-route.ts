import type { Permission } from '@/generated/prisma/client';
import { ctNavigation } from '@/components/ct/navigation';

export type CTLegacyRoute = { permission: Permission; href: string };

export function resolveCTLegacyRoute(segments: string[]): CTLegacyRoute | null {
  if (segments.length === 2 && segments[0] === 'prestations' && segments[1] === 'nouveau') {
    return { permission: 'ORDERS_CREATE', href: '/admin/prestations/nouveau' };
  }
  if (segments.length === 3 && segments[0] === 'prestations' && segments[2] === 'recu' && /^[0-9a-f-]{36}$/i.test(segments[1])) {
    return { permission: 'ORDERS_VIEW', href: `/admin/prestations/${segments[1]}/recu` };
  }
  if (segments.length === 2 && segments[0] === 'prestations' && /^[0-9a-f-]{36}$/i.test(segments[1])) {
    return { permission: 'ORDERS_VIEW', href: `/admin/prestations/${segments[1]}` };
  }

  if (segments.length !== 1) return null;
  const entry = ctNavigation.find((item) => item.href === segments[0]);
  return entry ? { permission: entry.permission, href: entry.legacyHref } : null;
}
