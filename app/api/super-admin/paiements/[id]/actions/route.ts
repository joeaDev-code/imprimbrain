import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';
import { readJsonBody } from '@/lib/request-json';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdminApi();
    const { id } = await params;
    const body = await readJsonBody(request, 4 * 1024);
    const action = typeof body.action === 'string' ? body.action : '';
    if (!['verify', 'reject'].includes(action)) return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

    const payment = await db.payment.findUnique({ where: { id }, select: { id: true, status: true, organizationId: true, subscriptionId: true } });
    if (!payment) return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
    if (!payment.subscriptionId) return NextResponse.json({ error: 'Ce paiement n’est pas un paiement d’abonnement.' }, { status: 403 });
    if (payment.status !== 'PENDING') return NextResponse.json({ error: 'Seuls les paiements en attente peuvent être traités.' }, { status: 409 });

    const nextStatus = action === 'verify' ? 'PAID' : 'FAILED';
    await db.$transaction(async (tx) => {
      await tx.payment.update({ where: { id }, data: { status: nextStatus } });
      await tx.auditLog.create({ data: { userId: actor.id, organizationId: payment.organizationId, action: action === 'verify' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED', entity: 'Payment', entityId: id, metadata: { previousStatus: payment.status, nextStatus, subscriptionId: payment.subscriptionId } } });
    });
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    return apiError(error);
  }
}
