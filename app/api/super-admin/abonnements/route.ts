import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const now = new Date();
    const rows = await db.subscription.findMany({ include: { organization: { select: { id: true, name: true, slug: true, status: true } } }, orderBy: { expiresAt: 'asc' } });
    return NextResponse.json(rows.map((row) => ({ id: row.id, organization: row.organization, amount: Number(row.amount), currency: row.currency, status: row.status === 'ACTIVE' && row.expiresAt <= now ? 'EXPIRED' : row.status, startsAt: row.startsAt, expiresAt: row.expiresAt, expired: row.status === 'ACTIVE' && row.expiresAt <= now })));
  } catch (error) { return apiError(error); }
}
