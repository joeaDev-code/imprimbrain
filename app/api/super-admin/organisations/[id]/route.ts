import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { writeAudit } from '@/lib/domain';
import { db } from '@/lib/prisma';
import { readJsonBody } from '@/lib/request-json';
import { decrypt, unwrapKey } from '@/lib/security';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdminApi();
    const { id } = await params;
    const organization = await db.organization.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, logoUrl: true, createdAt: true, wrappedDataKey: true, emailEncrypted: true, phoneEncrypted: true, addressEncrypted: true,
        _count: { select: { users: true, auditLogs: true } },
        users: { select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        subscriptions: { select: { id: true, amount: true, currency: true, status: true, startsAt: true, expiresAt: true }, orderBy: { createdAt: 'desc' } },
        payments: { select: { id: true, amount: true, currency: true, status: true, reference: true, method: true, paidAt: true }, orderBy: { paidAt: 'desc' } },
      },
    });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    const key = unwrapKey(organization.wrappedDataKey);
    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      email: decrypt(organization.emailEncrypted, key),
      phone: decrypt(organization.phoneEncrypted, key),
      address: decrypt(organization.addressEncrypted, key),
      createdAt: organization.createdAt,
      membersCount: organization._count.users,
      eventsCount: organization._count.auditLogs,
      users: organization.users,
      subscriptions: organization.subscriptions,
      payments: organization.payments,
    });
  } catch (error) {
    return apiError(error);
  }
}

function normalizedSlug(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSuperAdminApi();
    const { id } = await params;
    const body = await readJsonBody(request, 16 * 1024);
    const data: { name?: string; slug?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) {
        return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
      }
      data.name = body.name.trim();
    }
    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || body.slug.length > 120) {
        return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
      }
      const slug = normalizedSlug(body.slug);
      if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
      data.slug = slug;
    }
    if (!data.name && !data.slug) return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 });

    const organization = await db.organization.findUnique({ where: { id }, select: { id: true } });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    if (data.slug) {
      const existing = await db.organization.findUnique({ where: { slug: data.slug }, select: { id: true } });
      if (existing && existing.id !== id) return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
    }

    await db.organization.update({ where: { id }, data });
    await writeAudit(user.id, id, 'ORGANIZATION_UPDATED', 'Organization', id, Object.keys(data));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
