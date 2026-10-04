import { NextResponse } from 'next/server';
import type { PaymentMethod } from '@/generated/prisma/client';
import crypto from 'node:crypto';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { addCalendarMonths, INITIAL_SUBSCRIPTION_AMOUNT } from '@/lib/subscription-lifecycle';
import { requireSuperAdminApi } from '@/lib/super-admin-server';
import { readJsonBody } from '@/lib/request-json';

const ACTIONS = new Set(['suspend', 'reactivate', 'archive', 'renew']);
const METHODS = new Set(['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'WAVE', 'CARD', 'OTHER']);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdminApi();
    const { id } = await params;
    const body = await readJsonBody(request, 8 * 1024);
    const action = typeof body.action === 'string' ? body.action : '';
    if (!ACTIONS.has(action)) return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

    const organization = await db.organization.findUnique({ where: { id }, select: { id: true, name: true, status: true } });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });

    if (action === 'suspend' || action === 'reactivate' || action === 'archive') {
      const status = action === 'suspend' ? 'SUSPENDED' : action === 'reactivate' ? 'ACTIVE' : 'ARCHIVED';
      if (organization.status === status) return NextResponse.json({ ok: true, status });
      await db.$transaction(async (tx) => {
        await tx.organization.update({ where: { id }, data: { status } });
        if (action === 'suspend' || action === 'archive') {
          await tx.session.deleteMany({ where: { user: { organizationId: id } } });
        }
        await tx.auditLog.create({ data: {
          userId: actor.id,
          organizationId: id,
          action: `ORGANIZATION_${action === 'suspend' ? 'SUSPENDED' : action === 'reactivate' ? 'REACTIVATED' : 'ARCHIVED'}`,
          entity: 'Organization',
          entityId: id,
          metadata: { previousStatus: organization.status, nextStatus: status },
        } });
      });
      return NextResponse.json({ ok: true, status });
    }

    const amount = body.amount === undefined ? INITIAL_SUBSCRIPTION_AMOUNT : Number(body.amount);
    const months = body.months === undefined ? 1 : Number(body.months);
    const method = typeof body.method === 'string' ? body.method : 'CASH';
    const reference = typeof body.reference === 'string' && body.reference.trim() ? body.reference.trim() : `SUB-${crypto.randomUUID()}`;
    if (!Number.isInteger(months) || months < 1 || months > 12) return NextResponse.json({ error: 'Durée invalide' }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    if (!METHODS.has(method)) return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 });
    if (organization.status === 'ARCHIVED') return NextResponse.json({ error: 'Une organisation archivée ne peut pas être renouvelée' }, { status: 409 });

    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      const latest = await tx.subscription.findFirst({ where: { organizationId: id }, orderBy: [{ expiresAt: 'desc' }, { createdAt: 'desc' }] });
      const startsAt = latest && latest.expiresAt > now && latest.status === 'ACTIVE' ? latest.expiresAt : now;
      const expiresAt = addCalendarMonths(startsAt, months);
      const subscription = await tx.subscription.create({ data: { organizationId: id, amount, currency: 'XOF', startsAt, expiresAt, status: 'ACTIVE' } });
      const payment = await tx.payment.create({ data: { organizationId: id, subscriptionId: subscription.id, amount, currency: 'XOF', status: 'PAID', reference, method: method as PaymentMethod, paidAt: now } });
      await tx.organization.update({ where: { id }, data: { status: 'ACTIVE' } });
      await tx.auditLog.create({ data: {
        userId: actor.id,
        organizationId: id,
        action: 'SUBSCRIPTION_RENEWED',
        entity: 'Subscription',
        entityId: subscription.id,
        metadata: { paymentId: payment.id, amount, currency: 'XOF', months, startsAt, expiresAt, method, reference },
      } });
      return { subscription, payment };
    });

    return NextResponse.json({
      ok: true,
      subscription: { id: result.subscription.id, amount: Number(result.subscription.amount), currency: result.subscription.currency, status: result.subscription.status, startsAt: result.subscription.startsAt, expiresAt: result.subscription.expiresAt },
      payment: { id: result.payment.id, amount: Number(result.payment.amount), currency: result.payment.currency, status: result.payment.status, reference: result.payment.reference, paidAt: result.payment.paidAt },
    });
  } catch (error) {
    return apiError(error);
  }
}
