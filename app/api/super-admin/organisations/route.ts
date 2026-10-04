import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { ImageUploadError } from '@/lib/images/service';
import { createSuperAdminOrganization } from '@/lib/super-admin-organization';
import { writeAudit } from '@/lib/domain';
import { hashPassword } from '@/lib/password';
import { readJsonBody } from '@/lib/request-json';
import { blindIndex, encrypt, randomKey, wrapKey } from '@/lib/security';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

function toOrganization(row: { id: string; name: string; slug: string; logoUrl: string | null; createdAt: Date; _count: { users: number; auditLogs: number; subscriptions: number } }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    createdAt: row.createdAt,
    membersCount: row._count.users,
    eventsCount: row._count.auditLogs,
    subscriptionsCount: row._count.subscriptions,
  };
}

function normalizedSlug(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminApi();
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const rows = await db.organization.findMany({
      where: query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { slug: { contains: query, mode: 'insensitive' } }] } : undefined,
      select: { id: true, name: true, slug: true, logoUrl: true, createdAt: true, _count: { select: { users: true, auditLogs: true, subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rows.map(toOrganization));
  } catch (error) {
    return apiError(error);
  }
}

async function legacyPost(request: Request) {
  try {
    const user = await requireSuperAdminApi();
    const body = await readJsonBody(request, 16 * 1024);
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120 || (body.slug !== undefined && (typeof body.slug !== 'string' || body.slug.length > 120))) {
      return NextResponse.json({ error: 'Nom ou slug invalide' }, { status: 400 });
    }
    if (typeof body.phone !== 'string' || !body.phone.trim() || body.phone.trim().length > 80 || typeof body.address !== 'string' || !body.address.trim() || body.address.trim().length > 500) {
      return NextResponse.json({ error: 'Téléphone ou adresse invalide' }, { status: 400 });
    }
    if (typeof body.adminEmail !== 'string' || !body.adminEmail.trim() || body.adminEmail.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.adminEmail.trim())) {
      return NextResponse.json({ error: 'E-mail administrateur invalide' }, { status: 400 });
    }
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 1024) {
      return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 400 });
    }

    const slug = normalizedSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : body.name);
    if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
    if (await db.organization.findUnique({ where: { slug }, select: { id: true } })) {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
    }

    const email = body.adminEmail.trim().toLowerCase();
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: 'Cet e-mail est déjà utilisé' }, { status: 409 });
    }

    const dataKey = randomKey();
    const organization = await db.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: body.name.trim(),
          slug,
          wrappedDataKey: wrapKey(dataKey),
          phoneEncrypted: encrypt(body.phone.trim(), dataKey),
          emailEncrypted: encrypt(email, dataKey),
          addressEncrypted: encrypt(body.address.trim(), dataKey),
        },
      });
      await tx.organization.update({
        where: { id: created.id },
        data: {
          phoneBlindIndex: blindIndex(body.phone, 'organization.phone', created.id),
          emailBlindIndex: blindIndex(email, 'organization.email', created.id),
        },
      });
      await tx.user.create({
        data: {
          organizationId: created.id,
          name: created.name,
          email,
          passwordHash: hashPassword(body.password),
          role: 'ADMIN',
          emailBlindIndex: blindIndex(email, 'user.email', created.id),
        },
      });
      return created;
    });
    await writeAudit(user.id, organization.id, 'ORGANIZATION_CREATED', 'Organization', organization.id, { slug });
    return NextResponse.json({ id: organization.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

function formValue(form: FormData, name: string, maxLength: number) {
  const value = form.get(name);
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new ImageUploadError(`${name} invalide`);
  }
  return value.trim();
}

export async function POST(request: Request) {
  try {
    const actor = await requireSuperAdminApi();
    const form = await request.formData();
    const name = formValue(form, 'name', 120);
    const slug = normalizedSlug(formValue(form, 'slug', 120));
    const email = formValue(form, 'email', 254).toLowerCase();
    const phone = formValue(form, 'phone', 80);
    const address = formValue(form, 'address', 500);
    const password = formValue(form, 'password', 1024);
    const logo = form.get('logo');
    if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'E-mail invalide' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 400 });
    if (!(logo instanceof File)) return NextResponse.json({ error: 'Logo requis' }, { status: 400 });

    const result = await createSuperAdminOrganization(actor.id, { name, slug, email, phone, address, password, logo });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ImageUploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error ? error.message : '';
    if (message === 'SLUG_EXISTS') return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
    if (message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'Cet e-mail est déjà utilisé' }, { status: 409 });
    return apiError(error);
  }
}
