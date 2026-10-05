import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireOrgUser } from '@/lib/security';
import { writeAudit } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';

export async function GET() {
  try {
    const user = await requireOrgUser('SERVICES_VIEW');
    const rows = await db.consumptionRule.findMany({
      where: { service: { organizationId: user.organizationId! }, stockItem: { organizationId: user.organizationId! } },
      select: {
        id: true,
        serviceId: true,
        stockItemId: true,
        qtyPerUnit: true,
        service: { select: { name: true } },
        stockItem: { select: { name: true, unit: true } },
      },
      orderBy: { service: { name: 'asc' } },
      take: 500,
    });
    return NextResponse.json(rows.map((row) => ({
      id: row.id,
      serviceId: row.serviceId,
      serviceName: row.service.name,
      stockItemId: row.stockItemId,
      stockItemName: row.stockItem.name,
      stockUnit: row.stockItem.unit,
      qtyPerUnit: Number(row.qtyPerUnit),
    })));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireOrgUser('SERVICES_UPDATE');
    const data = await readJsonBody(req, 16 * 1024);
    const quantity = Number(data.qtyPerUnit);
    if (!data.serviceId || !data.stockItemId || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Règle invalide' }, { status: 400 });
    }
    const [service, item] = await Promise.all([
      db.service.findFirst({ where: { id: data.serviceId, organizationId: user.organizationId!, active: true } }),
      db.stockItem.findFirst({ where: { id: data.stockItemId, organizationId: user.organizationId!, active: true } }),
    ]);
    if (!service || !item) return NextResponse.json({ error: 'Service ou article invalide' }, { status: 400 });
    const row = await db.consumptionRule.upsert({
      where: { serviceId_stockItemId: { serviceId: service.id, stockItemId: item.id } },
      update: { qtyPerUnit: quantity },
      create: { serviceId: service.id, stockItemId: item.id, qtyPerUnit: quantity },
    });
    await writeAudit(user.id, user.organizationId, 'CONSUMPTION_RULE_UPSERTED', 'ConsumptionRule', row.id, {
      serviceId: service.id,
      stockItemId: item.id,
      qtyPerUnit: quantity,
    });
    return NextResponse.json({ id: row.id, serviceId: row.serviceId, stockItemId: row.stockItemId, qtyPerUnit: Number(row.qtyPerUnit) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireOrgUser('SERVICES_UPDATE');
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const rule = await db.consumptionRule.findFirst({ where: { id, service: { organizationId: user.organizationId! } } });
    if (!rule) return NextResponse.json({ error: 'Règle introuvable' }, { status: 404 });
    await db.consumptionRule.deleteMany({ where: { id, service: { organizationId: user.organizationId! } } });
    await writeAudit(user.id, user.organizationId, 'CONSUMPTION_RULE_DELETED', 'ConsumptionRule', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
