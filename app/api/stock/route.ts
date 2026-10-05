import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { stockItemDto } from '@/lib/api-dto';
import { db } from '@/lib/prisma';
import { writeAudit } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';
import { requireOrgUser } from '@/lib/security';

const stockSelect = {
  id: true,
  name: true,
  barcode: true,
  unit: true,
  quantity: true,
  minThreshold: true,
  unitCost: true,
  packageUnit: true,
  packageQuantity: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const user = await requireOrgUser('STOCK_VIEW');
    const rows = await db.stockItem.findMany({
      where: { organizationId: user.organizationId! },
      select: stockSelect,
      orderBy: { name: 'asc' },
      take: 500,
    });
    return NextResponse.json(rows.map(stockItemDto));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrgUser('STOCK_CREATE');
    const input = await readJsonBody(request, 16 * 1024);
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160) {
      return NextResponse.json({ error: 'Article invalide' }, { status: 400 });
    }
    if (input.barcode !== undefined && input.barcode !== null && (typeof input.barcode !== 'string' || input.barcode.length > 120)) {
      return NextResponse.json({ error: 'Code-barres invalide' }, { status: 400 });
    }
    if (input.unit !== undefined && (typeof input.unit !== 'string' || input.unit.length > 40)) {
      return NextResponse.json({ error: 'Unité invalide' }, { status: 400 });
    }
    if (input.packageUnit !== undefined && input.packageUnit !== null && (typeof input.packageUnit !== 'string' || input.packageUnit.length > 40)) {
      return NextResponse.json({ error: 'Unité de conditionnement invalide' }, { status: 400 });
    }

    const quantity = Number(input.quantity ?? 0);
    const minThreshold = Number(input.minThreshold ?? 0);
    const unitCost = Number(input.unitCost ?? 0);
    const packageQuantity = input.packageQuantity == null ? null : Number(input.packageQuantity);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity >= 1e11 ||
        !Number.isFinite(minThreshold) || minThreshold < 0 || minThreshold >= 1e11 ||
        !Number.isFinite(unitCost) || unitCost < 0 || unitCost >= 1e12 ||
        (packageQuantity !== null && (!Number.isFinite(packageQuantity) || packageQuantity < 0 || packageQuantity >= 1e11))) {
      return NextResponse.json({ error: 'Quantités ou coûts invalides' }, { status: 400 });
    }

    const item = await db.stockItem.create({
      data: {
        organizationId: user.organizationId!,
        name: input.name.trim(),
        barcode: typeof input.barcode === 'string' ? input.barcode.trim() || null : null,
        unit: typeof input.unit === 'string' ? input.unit.trim() || 'unité' : 'unité',
        quantity,
        minThreshold,
        unitCost,
        packageUnit: typeof input.packageUnit === 'string' ? input.packageUnit.trim() || null : null,
        packageQuantity,
      },
      select: stockSelect,
    });
    if (quantity > 0) {
      await db.stockMovement.create({ data: { stockItemId: item.id, kind: 'IN', quantity, reason: 'Stock initial' } });
    }
    await writeAudit(user.id, user.organizationId, 'STOCK_CREATED', 'StockItem', item.id);
    return NextResponse.json(stockItemDto(item));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireOrgUser('STOCK_UPDATE');
    const input = await readJsonBody(request, 16 * 1024);
    if (typeof input.id !== 'string') return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const target = await db.stockItem.findFirst({
      where: { id: input.id, organizationId: user.organizationId! },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

    const update: { name?: string; barcode?: string | null; unit?: string; packageUnit?: string | null; minThreshold?: number; unitCost?: number; packageQuantity?: number | null; active?: boolean } = {};
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
      update.name = input.name.trim();
    }
    if (input.barcode !== undefined) {
      if (input.barcode !== null && (typeof input.barcode !== 'string' || input.barcode.length > 120)) return NextResponse.json({ error: 'Code-barres invalide' }, { status: 400 });
      update.barcode = typeof input.barcode === 'string' ? input.barcode.trim() || null : null;
    }
    if (input.unit !== undefined) {
      if (typeof input.unit !== 'string' || input.unit.length > 40) return NextResponse.json({ error: 'Unité invalide' }, { status: 400 });
      update.unit = input.unit.trim() || 'unité';
    }
    if (input.packageUnit !== undefined) {
      if (input.packageUnit !== null && (typeof input.packageUnit !== 'string' || input.packageUnit.length > 40)) return NextResponse.json({ error: 'Unité de conditionnement invalide' }, { status: 400 });
      update.packageUnit = typeof input.packageUnit === 'string' ? input.packageUnit.trim() || null : null;
    }
    for (const field of ['minThreshold', 'unitCost', 'packageQuantity'] as const) {
      if (input[field] === undefined) continue;
      const value = input[field] === null && field === 'packageQuantity' ? null : Number(input[field]);
      const maximum = field === 'unitCost' ? 1e12 : 1e11;
      if (value !== null && (!Number.isFinite(value) || value < 0 || value >= maximum)) {
        return NextResponse.json({ error: `${field} invalide` }, { status: 400 });
      }
      update[field] = value as never;
    }
    if (input.active !== undefined) {
      if (typeof input.active !== 'boolean') return NextResponse.json({ error: 'État invalide' }, { status: 400 });
      update.active = input.active;
    }

    await db.stockItem.update({ where: { id: target.id, organizationId: user.organizationId! }, data: update });
    await writeAudit(user.id, user.organizationId, 'STOCK_UPDATED', 'StockItem', target.id, { changedFields: Object.keys(update) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireOrgUser('STOCK_UPDATE');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const archived = await db.stockItem.updateMany({ where: { id, organizationId: user.organizationId! }, data: { active: false } });
    if (!archived.count) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    await writeAudit(user.id, user.organizationId, 'STOCK_ARCHIVED', 'StockItem', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}