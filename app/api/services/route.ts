import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { serviceDto } from '@/lib/api-dto';
import { db } from '@/lib/prisma';
import { writeAudit } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';
import { requireOrgUser } from '@/lib/security';

const serviceSelect = {
  id: true,
  name: true,
  category: true,
  unit: true,
  price: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const user = await requireOrgUser('SERVICES_VIEW');
    const rows = await db.service.findMany({
      where: { organizationId: user.organizationId! },
      select: serviceSelect,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(rows.map(serviceDto));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOrgUser('SERVICES_CREATE');
    const input = await readJsonBody(request, 16 * 1024);
    const price = Number(input.price);
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160 || !Number.isFinite(price) || price < 0 || price > 1e12) {
      return NextResponse.json({ error: 'Nom et prix valides requis' }, { status: 400 });
    }
    if (input.category !== undefined && input.category !== null && (typeof input.category !== 'string' || input.category.length > 80)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }
    if (input.unit !== undefined && (typeof input.unit !== 'string' || input.unit.length > 40)) {
      return NextResponse.json({ error: 'Unité invalide' }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        organizationId: user.organizationId!,
        name: input.name.trim(),
        category: typeof input.category === 'string' ? input.category.trim() || null : null,
        unit: typeof input.unit === 'string' ? input.unit.trim() || 'unité' : 'unité',
        price,
      },
      select: serviceSelect,
    });
    await writeAudit(user.id, user.organizationId, 'SERVICE_CREATED', 'Service', service.id);
    return NextResponse.json(serviceDto(service));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireOrgUser('SERVICES_UPDATE');
    const input = await readJsonBody(request, 16 * 1024);
    if (typeof input.id !== 'string') return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const target = await db.service.findFirst({
      where: { id: input.id, organizationId: user.organizationId! },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });

    const update: { name?: string; category?: string | null; unit?: string; price?: number; active?: boolean } = {};
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
      update.name = input.name.trim();
    }
    if (input.category !== undefined) {
      if (input.category !== null && (typeof input.category !== 'string' || input.category.length > 80)) return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
      update.category = typeof input.category === 'string' ? input.category.trim() || null : null;
    }
    if (input.unit !== undefined) {
      if (typeof input.unit !== 'string' || input.unit.length > 40) return NextResponse.json({ error: 'Unité invalide' }, { status: 400 });
      update.unit = input.unit.trim() || 'unité';
    }
    if (input.price !== undefined) {
      const price = Number(input.price);
      if (!Number.isFinite(price) || price < 0 || price > 1e12) return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
      update.price = price;
    }
    if (input.active !== undefined) {
      if (typeof input.active !== 'boolean') return NextResponse.json({ error: 'État invalide' }, { status: 400 });
      update.active = input.active;
    }

    await db.service.update({ where: { id: target.id, organizationId: user.organizationId! }, data: update });
    await writeAudit(user.id, user.organizationId, 'SERVICE_UPDATED', 'Service', target.id, { changedFields: Object.keys(update) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireOrgUser('SERVICES_DELETE');
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const archived = await db.service.updateMany({ where: { id, organizationId: user.organizationId! }, data: { active: false } });
    if (!archived.count) return NextResponse.json({ error: 'Service introuvable' }, { status: 404 });
    await writeAudit(user.id, user.organizationId, 'SERVICE_ARCHIVED', 'Service', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}