import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [organizations, users, payments, activeSubscriptions, subscriptionRevenue, expiredSubscriptions, suspendedOrganizations, expiringSoon] = await Promise.all([
      db.organization.count({ where: { status: { not: 'ARCHIVED' } } }),
      db.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      db.payment.count({ where: { subscriptionId: { not: null }, status: 'PAID' } }),
      db.subscription.count({ where: { status: 'ACTIVE', expiresAt: { gt: now }, organization: { status: 'ACTIVE' } } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { subscriptionId: { not: null }, status: 'PAID' } }),
      db.subscription.count({ where: { OR: [{ status: 'EXPIRED' }, { status: 'ACTIVE', expiresAt: { lte: now } }] } }),
      db.organization.count({ where: { status: 'SUSPENDED' } }),
      db.subscription.count({ where: { status: 'ACTIVE', expiresAt: { gt: now, lte: sevenDays }, organization: { status: 'ACTIVE' } } }),
    ]);
    return NextResponse.json({ organizations, users, payments, activeSubscriptions, subscriptionRevenue: Number(subscriptionRevenue._sum.amount ?? 0), expiredSubscriptions, suspendedOrganizations, expiringSoon });
  } catch (error) {
    return apiError(error);
  }
}
