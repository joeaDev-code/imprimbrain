import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { readJsonBody } from '@/lib/request-json';
import { blindIndex, decrypt, encrypt, unwrapKey } from '@/lib/security';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdminApi();
    const { id } = await params;
    const organization = await db.organization.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, status: true, logoUrl: true, createdAt: true, wrappedDataKey: true, emailEncrypted: true, phoneEncrypted: true, addressEncrypted: true,
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
      status: organization.status,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
      email: decrypt(organization.emailEncrypted, key),
      phone: decrypt(organization.phoneEncrypted, key),
      address: decrypt(organization.addressEncrypted, key),
      createdAt: organization.createdAt,
      membersCount: organization._count.users,
      auditLogsCount: organization._count.auditLogs,
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
    const organization = await db.organization.findUnique({ where: { id }, select: { id: true, wrappedDataKey: true } });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });

    const data: { name?: string; slug?: string; phoneEncrypted?: string | null; emailEncrypted?: string | null; addressEncrypted?: string | null; phoneBlindIndex?: string | null; emailBlindIndex?: string | null } = {};
    const changes: string[] = [];
    const key = unwrapKey(organization.wrappedDataKey);

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
      data.name = body.name.trim(); changes.push('name');
    }
    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || body.slug.length > 120) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
      const slug = normalizedSlug(body.slug);
      if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
      const existing = await db.organization.findUnique({ where: { slug }, select: { id: true } });
      if (existing && existing.id !== id) return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
      data.slug = slug; changes.push('slug');
    }
    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || body.phone.trim().length > 80) return NextResponse.json({ error: 'Téléphone invalide' }, { status: 400 });
      data.phoneEncrypted = encrypt(body.phone.trim(), key); data.phoneBlindIndex = blindIndex(body.phone.trim(), 'organization.phone', id); changes.push('phone');
    }
    let nextEmail: string | undefined;
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || body.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return NextResponse.json({ error: 'E-mail invalide' }, { status: 400 });
      nextEmail = body.email.trim().toLowerCase();
      const existingUser = await db.user.findUnique({ where: { email: nextEmail }, select: { id: true, organizationId: true } });
      if (existingUser && existingUser.organizationId !== id) return NextResponse.json({ error: 'Cet e-mail est déjà utilisé' }, { status: 409 });
      data.emailEncrypted = encrypt(nextEmail, key); data.emailBlindIndex = blindIndex(nextEmail, 'organization.email', id); changes.push('email');
    }
    if (body.address !== undefined) {
      if (typeof body.address !== 'string' || body.address.trim().length > 500) return NextResponse.json({ error: 'Adresse invalide' }, { status: 400 });
      data.addressEncrypted = encrypt(body.address.trim(), key); changes.push('address');
    }
    if (!changes.length) return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 });

    await db.$transaction(async (tx) => {
      await tx.organization.update({ where: { id }, data });
      if (nextEmail) {
        const admin = await tx.user.findFirst({ where: { organizationId: id, role: 'ADMIN', active: true }, orderBy: { createdAt: 'asc' }, select: { id: true } });
        if (admin) {
          await tx.user.update({ where: { id: admin.id }, data: { email: nextEmail, emailBlindIndex: blindIndex(nextEmail, 'user.email', id) } });
          await tx.session.deleteMany({ where: { userId: admin.id } });
        }
      }
      await tx.auditLog.create({ data: { userId: user.id, organizationId: id, action: 'ORGANIZATION_UPDATED', entity: 'Organization', entityId: id, metadata: { changes } } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
