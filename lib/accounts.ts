import type { PaymentMethod, Prisma } from '@/generated/prisma/client';
import { lockTenantOrder, lockTenantDebtAccount } from '@/lib/order-lock';

export function debtStatus(originalAmount: number, balance: number) {
  if (balance <= 0.009) return 'SETTLED' as const;
  if (balance < originalAmount - 0.009) return 'PARTIAL' as const;
  return 'OPEN' as const;
}

export async function syncOrderReceivable(
  tx: Prisma.TransactionClient,
  params: { organizationId: string; orderId: string; userId?: string | null },
) {
  const order = await tx.order.findFirst({
    where: { id: params.orderId, organizationId: params.organizationId },
    select: {
      id: true,
      ref: true,
      total: true,
      clientId: true,
      client: { select: { name: true } },
      payments: { select: { amount: true } },
    },
  });
  if (!order || !order.clientId) return null;

  const paid = order.payments.reduce((sum, item) => sum + Number(item.amount), 0);
  const originalAmount = Number(order.total);
  const balance = Math.max(0, originalAmount - paid);
  const status = debtStatus(originalAmount, balance);

  const existing = await tx.debtAccount.findUnique({ where: { orderId: order.id } });

  if (balance <= 0.009) {
    if (!existing) return null;
    return tx.debtAccount.update({
      where: { id: existing.id, organizationId: params.organizationId },
      data: { balance: 0, status: 'SETTLED' },
    });
  }

  if (existing) {
    return tx.debtAccount.update({
      where: { id: existing.id, organizationId: params.organizationId },
      data: {
        clientId: order.clientId,
        counterpartyName: order.client?.name || 'Client',
        originalAmount,
        balance,
        status,
      },
    });
  }

  return tx.debtAccount.create({
    data: {
      organizationId: params.organizationId,
      type: 'RECEIVABLE',
      status,
      clientId: order.clientId,
      orderId: order.id,
      counterpartyName: order.client?.name || 'Client',
      label: `Solde de la prestation ${order.ref}`,
      originalAmount,
      balance,
      createdById: params.userId ?? null,
      entries: {
        create: {
          kind: 'DEBT',
          amount: balance,
          createdById: params.userId ?? null,
        },
      },
    },
  });
}

export async function recordDebtPaymentEntry(
  tx: Prisma.TransactionClient,
  params: { organizationId: string; debtAccountId: string; amount: number; userId: string; method?: PaymentMethod; noteEncrypted?: string | null },
) {
  const initial = await tx.debtAccount.findFirst({
    where: { id: params.debtAccountId, organizationId: params.organizationId },
    select: { id: true, orderId: true },
  });
  if (!initial) throw new Error('ACCOUNT_NOT_FOUND');

  // Keep lock order consistent with the normal payment flow: Order -> DebtAccount.
  // This prevents concurrent settlement operations from overwriting each other's balance.
  if (initial.orderId) {
    if (!await lockTenantOrder(tx, initial.orderId, params.organizationId)) throw new Error('ORDER_NOT_FOUND');
  }
  if (!await lockTenantDebtAccount(tx, initial.id, params.organizationId)) throw new Error('ACCOUNT_NOT_FOUND');

  const debt = await tx.debtAccount.findFirst({
    where: { id: params.debtAccountId, organizationId: params.organizationId },
    select: { id: true, type: true, originalAmount: true, balance: true, status: true, orderId: true },
  });
  if (!debt) throw new Error('ACCOUNT_NOT_FOUND');
  if (debt.status === 'CANCELLED' || Number(debt.balance) <= 0.009) throw new Error('ACCOUNT_SETTLED');
  if (!Number.isFinite(params.amount) || params.amount <= 0 || params.amount > Number(debt.balance) + 0.009) throw new Error('ACCOUNT_PAYMENT_INVALID');

  if (debt.orderId) {
    // The linked order was already locked above and remains locked for this transaction.
    const order = await tx.order.findFirst({
      where: { id: debt.orderId, organizationId: params.organizationId },
      select: { id: true, total: true, status: true, payments: { select: { amount: true } } },
    });
    if (!order || order.status === 'CANCELLED') throw new Error('ORDER_NOT_FOUND');
    const paid = order.payments.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = Number(order.total) - paid;
    if (params.amount > remaining + 0.009) throw new Error('ACCOUNT_PAYMENT_INVALID');
    const payment = await tx.payment.create({
      data: {
        organizationId: params.organizationId,
        orderId: order.id,
        amount: params.amount,
        method: params.method || 'CASH',
      },
      select: { id: true },
    });
    const nextBalance = Math.max(0, remaining - params.amount);
    await tx.debtAccount.update({
      where: { id: debt.id, organizationId: params.organizationId },
      data: { balance: nextBalance, status: debtStatus(Number(debt.originalAmount), nextBalance) },
    });
    await tx.debtEntry.create({
      data: { debtAccountId: debt.id, kind: 'PAYMENT', amount: params.amount, method: params.method || 'CASH', noteEncrypted: params.noteEncrypted ?? null, createdById: params.userId },
    });
    if (nextBalance <= 0.009) {
      await tx.order.update({ where: { id: order.id, organizationId: params.organizationId }, data: { status: 'DELIVERED' } });
    }
    return payment;
  }

  const nextBalance = Math.max(0, Number(debt.balance) - params.amount);
  await tx.debtAccount.update({
    where: { id: debt.id, organizationId: params.organizationId },
    data: { balance: nextBalance, status: debtStatus(Number(debt.originalAmount), nextBalance) },
  });
  await tx.debtEntry.create({
    data: { debtAccountId: debt.id, kind: 'PAYMENT', amount: params.amount, method: params.method || 'CASH', noteEncrypted: params.noteEncrypted ?? null, createdById: params.userId },
  });
  return null;
}
