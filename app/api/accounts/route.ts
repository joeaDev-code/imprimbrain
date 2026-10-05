import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { requireOrgUser } from '@/lib/security';
import { organizationKey } from '@/lib/domain';
import { blindIndex, encrypt, decrypt } from '@/lib/security';
import { readJsonBody } from '@/lib/request-json';
import { writeAudit } from '@/lib/domain';

const accountTypes = ['RECEIVABLE', 'PAYABLE'] as const;

export async function GET(request: Request) {
  try {
    const user = await requireOrgUser('ACCOUNTS_VIEW');
    const params = new URL(request.url).searchParams;
    const q = params.get('q')?.trim().slice(0, 120) || '';
    const type = accountTypes.includes(params.get('type') as (typeof accountTypes)[number]) ? params.get('type') as (typeof accountTypes)[number] : undefined;
    const status = ['OPEN', 'PARTIAL', 'SETTLED', 'CANCELLED'].includes(params.get('status') || '') ? params.get('status') as any : undefined;
    const requestedTake = Number(params.get('limit') || 100);
    const take = Number.isFinite(requestedTake) ? Math.min(200, Math.max(1, Math.trunc(requestedTake))) : 100;
    const key = await organizationKey(user.organizationId!);
    const where: any = { organizationId: user.organizationId!, ...(type ? { type } : {}), ...(status ? { status } : {}) };
    if (q) where.OR = [{ counterpartyName: { contains: q, mode: 'insensitive' } }, { label: { contains: q, mode: 'insensitive' } }, { client: { name: { contains: q, mode: 'insensitive' } } }];
    const rows = await db.debtAccount.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      take,
      include: { client: { select: { id: true, name: true } }, order: { select: { id: true, ref: true } }, entries: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, kind: true, amount: true, method: true, noteEncrypted: true, createdAt: true } } },
    });
    const summary = await db.debtAccount.groupBy({ where: { organizationId: user.organizationId!, status: { in: ['OPEN', 'PARTIAL'] } }, by: ['type'], _sum: { balance: true }, _count: { _all: true } });
    return NextResponse.json({
      summary: { receivable: Number(summary.find((x) => x.type === 'RECEIVABLE')?._sum.balance || 0), payable: Number(summary.find((x) => x.type === 'PAYABLE')?._sum.balance || 0), receivableCount: summary.find((x) => x.type === 'RECEIVABLE')?._count._all || 0, payableCount: summary.find((x) => x.type === 'PAYABLE')?._count._all || 0 },
      rows: rows.map((row) => ({
        id: row.id, type: row.type, status: row.status, clientId: row.clientId, clientName: row.client?.name || null, orderId: row.orderId, orderRef: row.order?.ref || null,
        counterpartyName: row.counterpartyName, phone: decrypt(row.counterpartyPhoneEncrypted, key), note: decrypt(row.noteEncrypted, key), label: row.label, originalAmount: Number(row.originalAmount), balance: Number(row.balance), dueAt: row.dueAt, createdAt: row.createdAt,
        entries: row.entries.map((entry) => ({ id: entry.id, kind: entry.kind, amount: Number(entry.amount), method: entry.method, note: decrypt(entry.noteEncrypted, key), createdAt: entry.createdAt })),
      })),
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrgUser('ACCOUNTS_CREATE');
    const data = await readJsonBody(request, 24 * 1024);
    const type = data.type;
    if (!accountTypes.includes(type)) return NextResponse.json({ error: 'Type de compte invalide' }, { status: 400 });
    if (typeof data.label !== 'string' || !data.label.trim() || data.label.length > 180) return NextResponse.json({ error: 'Libellé requis ou trop long' }, { status: 400 });
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    if (data.clientId !== undefined && data.clientId !== null && typeof data.clientId !== 'string') return NextResponse.json({ error: 'Client invalide' }, { status: 400 });
    if (data.counterpartyName !== undefined && (typeof data.counterpartyName !== 'string' || data.counterpartyName.length > 160)) return NextResponse.json({ error: 'Nom du débiteur ou créancier invalide' }, { status: 400 });
    if (data.phone !== undefined && data.phone !== null && (typeof data.phone !== 'string' || data.phone.length > 50)) return NextResponse.json({ error: 'Téléphone invalide' }, { status: 400 });
    if (data.note !== undefined && data.note !== null && (typeof data.note !== 'string' || data.note.length > 2000)) return NextResponse.json({ error: 'Note trop longue' }, { status: 400 });
    const dueAt = data.dueAt ? new Date(data.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Échéance invalide' }, { status: 400 });
    const key = await organizationKey(user.organizationId!);
    let clientName = '';
    if (data.clientId !== undefined && data.clientId !== null) {
      if (type !== 'RECEIVABLE') return NextResponse.json({ error: 'Une dette fournisseur ne peut pas être liée à un client' }, { status: 400 });
      const client = await db.client.findFirst({ where: { id: data.clientId, organizationId: user.organizationId! }, select: { id: true, name: true } });
      if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
      clientName = client.name;
    }
    if (type === 'RECEIVABLE' && !clientName) return NextResponse.json({ error: 'Un client est requis pour une créance' }, { status: 400 });
    const counterpartyName = String(data.counterpartyName || clientName || '').trim();
    if (!counterpartyName) return NextResponse.json({ error: 'Nom du débiteur ou créancier requis' }, { status: 400 });
    const row = await db.debtAccount.create({
      data: {
        organizationId: user.organizationId!, type, status: 'OPEN', clientId: data.clientId || null, counterpartyName, label: data.label.trim(), originalAmount: amount, balance: amount, dueAt,
        counterpartyPhoneEncrypted: encrypt(data.phone, key), counterpartyPhoneBlindIndex: blindIndex(data.phone, 'account.phone', user.organizationId!), noteEncrypted: encrypt(data.note, key), createdById: user.id,
        entries: { create: { kind: 'DEBT', amount, noteEncrypted: encrypt(data.note, key), createdById: user.id } },
      },
      select: { id: true },
    });
    await writeAudit(user.id, user.organizationId, 'ACCOUNT_CREATED', 'DebtAccount', row.id, { type, amount });
    return NextResponse.json({ id: row.id });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireOrgUser('ACCOUNTS_UPDATE');
    const data = await readJsonBody(request, 12 * 1024);
    if (typeof data.id !== 'string') return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const target = await db.debtAccount.findFirst({
      where: { id: data.id, organizationId: user.organizationId! },
      include: { entries: { where: { kind: 'PAYMENT' }, select: { id: true }, take: 1 } },
    });
    if (!target) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    if (target.status === 'SETTLED' && data.status !== 'CANCELLED') return NextResponse.json({ error: 'Une dette réglée ne peut plus être modifiée' }, { status: 409 });
    if (data.status === 'CANCELLED' && target.orderId) return NextResponse.json({ error: 'La créance liée à une prestation ne peut pas être annulée ici' }, { status: 409 });
    if (data.status === 'CANCELLED' && target.entries.length) return NextResponse.json({ error: 'Un compte ayant déjà reçu un règlement ne peut pas être annulé' }, { status: 409 });
    if (data.status !== undefined && data.status !== 'CANCELLED') return NextResponse.json({ error: 'Le statut est géré automatiquement par les règlements' }, { status: 400 });
    const key = await organizationKey(user.organizationId!);
    const update: any = {};
    if (typeof data.label === 'string' && data.label.trim()) update.label = data.label.trim().slice(0, 180);
    if (data.dueAt !== undefined) { const dueAt = data.dueAt ? new Date(data.dueAt) : null; if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Échéance invalide' }, { status: 400 }); update.dueAt = dueAt; }
    if (data.phone !== undefined) { if (data.phone !== null && (typeof data.phone !== 'string' || data.phone.length > 50)) return NextResponse.json({ error: 'Téléphone invalide' }, { status: 400 }); update.counterpartyPhoneEncrypted = encrypt(data.phone, key); update.counterpartyPhoneBlindIndex = blindIndex(data.phone, 'account.phone', user.organizationId!); }
    if (data.note !== undefined) { if (data.note !== null && (typeof data.note !== 'string' || data.note.length > 2000)) return NextResponse.json({ error: 'Note trop longue' }, { status: 400 }); update.noteEncrypted = encrypt(data.note, key); }
    if (data.status === 'CANCELLED') update.status = 'CANCELLED';
    const row = await db.debtAccount.update({ where: { id: target.id, organizationId: user.organizationId! }, data: update, select: { id: true, status: true } });
    await writeAudit(user.id, user.organizationId, 'ACCOUNT_UPDATED', 'DebtAccount', row.id, { status: row.status });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
