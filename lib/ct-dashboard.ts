import type { CTRole } from '@/lib/ct-access';
import { canonicalCTPath } from '@/lib/ct-access';

export function dashboardTenantScopes(
  organizationId: string,
  monthStart: Date,
  monthEnd: Date,
  todayStart: Date,
  todayEnd: Date,
) {
  return {
    payments: { order: { organizationId }, paidAt: { gte: monthStart, lt: monthEnd } },
    expenses: { organizationId, spentAt: { gte: monthStart, lt: monthEnd } },
    recentOrders: { organizationId },
    monthOrders: { organizationId, createdAt: { gte: monthStart, lt: monthEnd } },
    todayOrders: { organizationId, createdAt: { gte: todayStart, lt: todayEnd } },
    stock: { organizationId, active: true },
    clients: { organizationId },
    services: { organizationId, active: true },
  };
}

export function ctDashboardLinks(role: CTRole) {
  const base = canonicalCTPath(role);
  return {
    prestations: `${base}/prestations`,
    stock: `${base}/stock`,
  };
}
