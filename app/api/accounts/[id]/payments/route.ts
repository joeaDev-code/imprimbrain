import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireOrgUser, encrypt } from '@/lib/security';
import { organizationKey } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';
import { recordDebtPaymentEntry } from '@/lib/accounts';
import { writeAudit } from '@/lib/domain';
import type { PaymentMethod } from '@/generated/prisma/client';

const methods: PaymentMethod[] = ['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'WAVE', 'CARD', 'OTHER'];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireOrgUser('ACCOUNTS_PAY');
    const { id } = await context.params;
    const data = await readJsonBody(request, 12 * 1024);
    const amount = Number(data.amount);
    const method = data.method || 'CASH';
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12 || !methods.includes(method)) return NextResponse.json({ error: 'Paiement invalide' }, { status: 400 });
    if (data.note !== undefined && data.note !== null && (typeof data.note !== 'string' || data.note.length > 2000)) return NextResponse.json({ error: 'Note trop longue' }, { status: 400 });
    const key = await organizationKey(user.organizationId!);
    const result = await db.$transaction(async (tx) => {
      const payment = await recordDebtPaymentEntry(tx, { organizationId: user.organizationId!, debtAccountId: id, amount, userId: user.id, method, noteEncrypted: encrypt(data.note, key) });
      return payment;
    });
    await writeAudit(user.id, user.organizationId, 'ACCOUNT_PAYMENT_CREATED', 'DebtAccount', id, { amount, method });
    return NextResponse.json({ ok: true, paymentId: result?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ACCOUNT_NOT_FOUND') return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    if (message === 'ACCOUNT_SETTLED') return NextResponse.json({ error: 'Cette dette est déjà réglée' }, { status: 409 });
    if (message === 'ACCOUNT_PAYMENT_INVALID') return NextResponse.json({ error: 'Montant supérieur au solde restant' }, { status: 400 });
    if (message === 'ORDER_NOT_FOUND') return NextResponse.json({ error: 'Prestation liée introuvable' }, { status: 404 });
    return apiError(error);
  }
}
