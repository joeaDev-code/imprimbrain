import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const payments = await db.payment.findMany({
      where: { subscriptionId: { not: null } },
      select: {
        id: true, amount: true, currency: true, status: true, reference: true, method: true, paidAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        subscription: { select: { id: true } },
        order: { select: { id: true, ref: true, organization: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { paidAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(payments);
  } catch (error) {
    return apiError(error);
  }
}
