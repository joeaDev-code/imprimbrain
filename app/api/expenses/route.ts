import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { expenseDto } from '@/lib/api-dto';
import { db } from '@/lib/prisma';
import { writeAudit } from '@/lib/domain';
import { requireOrgUser } from '@/lib/security';
import { readJsonBody } from '@/lib/request-json';

const expenseSelect = {
  id: true,
  label: true,
  category: true,
  amount: true,
  spentAt: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    const user = await requireOrgUser('EXPENSES_VIEW');
    const rows = await db.expense.findMany({
      where: { organizationId: user.organizationId! },
      select: expenseSelect,
      orderBy: { spentAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(rows.map(expenseDto));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrgUser('EXPENSES_CREATE');
    const data = await readJsonBody(request, 16 * 1024);
    if (typeof data.label !== 'string' || !data.label.trim() || data.label.length > 180) {
      return NextResponse.json({ error: 'Libellé invalide' }, { status: 400 });
    }
    if (data.category !== undefined && data.category !== null && (typeof data.category !== 'string' || data.category.length > 80)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }
    const amount = Number(data.amount);
    const spentAt = data.spentAt === undefined ? new Date() : new Date(data.spentAt);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(spentAt.getTime())) {
      return NextResponse.json({ error: 'Dépense invalide' }, { status: 400 });
    }

    const row = await db.expense.create({
      data: {
        organizationId: user.organizationId!,
        label: data.label.trim(),
        category: typeof data.category === 'string' ? data.category.trim().slice(0, 80) || 'Divers' : 'Divers',
        amount,
        spentAt,
      },
      select: expenseSelect,
    });
    await writeAudit(user.id, user.organizationId, 'EXPENSE_CREATED', 'Expense', row.id, { amount });
    return NextResponse.json(expenseDto(row));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireOrgUser('EXPENSES_UPDATE');
    const input = await readJsonBody(request, 16 * 1024);
    const target = await db.expense.findFirst({
      where: { id: input.id, organizationId: user.organizationId! },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 });

    const data: { label?: string; category?: string; amount?: number; spentAt?: Date } = {};
    if (input.label !== undefined) {
      if (typeof input.label !== 'string' || !input.label.trim() || input.label.length > 180) {
        return NextResponse.json({ error: 'Libellé invalide' }, { status: 400 });
      }
      data.label = input.label.trim();
    }
    if (input.category !== undefined) {
      if (input.category !== null && (typeof input.category !== 'string' || input.category.length > 80)) {
        return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
      }
      data.category = typeof input.category === 'string' ? input.category.trim().slice(0, 80) || 'Divers' : 'Divers';
    }
    if (input.amount !== undefined) {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
      data.amount = amount;
    }
    if (input.spentAt !== undefined) {
      const spentAt = new Date(input.spentAt);
      if (!Number.isFinite(spentAt.getTime())) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
      data.spentAt = spentAt;
    }

    await db.expense.update({
      where: { id: target.id, organizationId: user.organizationId! },
      data,
    });
    await writeAudit(user.id, user.organizationId, 'EXPENSE_UPDATED', 'Expense', target.id, {
      changedFields: Object.keys(data),
      amount: data.amount,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireOrgUser('EXPENSES_UPDATE');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const deleted = await db.expense.deleteMany({ where: { id, organizationId: user.organizationId! } });
    if (!deleted.count) return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 });
    await writeAudit(user.id, user.organizationId, 'EXPENSE_DELETED', 'Expense', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}