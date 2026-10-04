import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const [organizations, users, payments, activeSubscriptions, subscriptionRevenue] = await Promise.all([
      db.organization.count(),
      db.user.count(),
      db.payment.count(),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.subscription.aggregate({ _sum: { amount: true }, where: { status: 'ACTIVE' } }),
    ]);
    return NextResponse.json({ organizations, users, payments, activeSubscriptions, subscriptionRevenue: Number(subscriptionRevenue._sum.amount ?? 0) });
  } catch (error) {
    return apiError(error);
  }
}
