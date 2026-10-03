import type { CTRole } from '@/lib/ct-access';
import { isCTRole } from '@/lib/ct-access';

export function legacyHrefInCTContext(pathname: string, legacyHref: string) {
  const match = pathname.match(/^\/ct\/([^/]+)(?:\/|$)/);
  const role = match?.[1].toUpperCase();
  if (!role || !isCTRole(role)) return legacyHref;

  const moduleRoutes: Record<string, string> = {
    prestations: 'prestations',
    clients: 'clients',
    services: 'services',
    stock: 'stock',
    depenses: 'depenses',
    employes: 'employes',
    audit: 'audit',
    parametres: 'parametres',
  };
  const matchLegacy = legacyHref.match(/^\/admin\/([^/]+)(?:\/(.*))?$/);
  if (!matchLegacy) return legacyHref;

  const ctModule = moduleRoutes[matchLegacy[1]];
  if (!ctModule) return legacyHref;
  const suffix = matchLegacy[2];

  if (ctModule === 'prestations') return `/ct/${role.toLowerCase()}/prestations${suffix ? `/${suffix}` : ''}`;
  if (suffix === 'nouveau') return `/ct/${role.toLowerCase()}/${ctModule}`;
  if (suffix) return legacyHref;
  return `/ct/${role.toLowerCase()}/${ctModule}`;
}

export function ctPrestationsBase(role: CTRole) {
  return `/ct/${role.toLowerCase()}/prestations`;
}
