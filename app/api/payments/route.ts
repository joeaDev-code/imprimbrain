import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { writeAudit } from '@/lib/domain';
import { requireOrgUser } from '@/lib/security';
import { canAcceptPayment } from '@/lib/order-invariants';
import { lockTenantOrder } from '@/lib/order-lock';
import { syncOrderReceivable } from '@/lib/accounts';
import { readJsonBody } from '@/lib/request-json';

const paymentMethods = ['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'WAVE', 'CARD', 'OTHER'];

export async function POST(request: Request) {
  try {
    const user = await requireOrgUser('PAYMENTS_CREATE');
    const data = await readJsonBody(request, 16 * 1024);
    const amount = Number(data.amount);
    const method = data.method ?? 'CASH';
    if (typeof data.orderId !== 'string' || !Number.isFinite(amount) || amount <= 0 || amount > 1e12 || !paymentMethods.includes(method)) {
      return NextResponse.json({ error: 'Paiement invalide' }, { status: 400 });
    }

    const payment = await db.$transaction(async (tx) => {
      if (!await lockTenantOrder(tx, data.orderId, user.organizationId!)) throw new Error('ORDER_NOT_FOUND');

      const order = await tx.order.findFirst({
        where: { id: data.orderId, organizationId: user.organizationId! },
        include: { payments: true },
      });
      if (!order || order.status === 'CANCELLED') throw new Error('ORDER_NOT_FOUND');

      const paid = order.payments.reduce((sum, item) => sum + Number(item.amount), 0);
      if (!canAcceptPayment(amount, Number(order.total), paid)) throw new Error('PAYMENT_EXCEEDS_BALANCE');

      const created = await tx.payment.create({
        data: { organizationId: user.organizationId!, orderId: order.id, amount, method },
        select: { id: true, amount: true, method: true },
      });
      if (Math.abs(Number(order.total) - paid - amount) < 0.01) {
        await tx.order.update({
          where: { id: order.id, organizationId: user.organizationId! },
          data: { status: 'DELIVERED' },
        });
      }
      await syncOrderReceivable(tx, { organizationId: user.organizationId!, orderId: order.id, userId: user.id });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId!,
          action: 'PAYMENT_CREATED',
          entity: 'Payment',
          entityId: created.id,
          metadata: { amount, method },
        },
      });
      return created;
    });
    return NextResponse.json({ id: payment.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ORDER_NOT_FOUND') return NextResponse.json({ error: 'Prestation introuvable' }, { status: 404 });
    if (message === 'PAYMENT_EXCEEDS_BALANCE') return NextResponse.json({ error: 'Le montant dépasse le reste à payer' }, { status: 400 });
    return apiError(error);
  }
}