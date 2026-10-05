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

function toOrganization(row: { id: string; name: string; slug: string; status: string; logoUrl: string | null; createdAt: Date; _count: { users: number; auditLogs: number; subscriptions: number } }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    logoUrl: row.logoUrl,
    createdAt: row.createdAt,
    membersCount: row._count.users,
    auditLogsCount: row._count.auditLogs,
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
      select: { id: true, name: true, slug: true, status: true, logoUrl: true, createdAt: true, _count: { select: { users: true, auditLogs: true, subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(rows.map(toOrganization));
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
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > 7 * 1024 * 1024) return NextResponse.json({ error: 'Requête trop volumineuse' }, { status: 413 });
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
    if (password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 10 caractères, une lettre et un chiffre.' }, { status: 400 });
    if (!(logo instanceof File)) return NextResponse.json({ error: 'Logo requis' }, { status: 400 });

    const result = await createSuperAdminOrganization(actor.id, { name, slug, email, phone, address, password, logo });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ImageUploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Error && error.message === 'INVALID_PASSWORD') return NextResponse.json({ error: 'Mot de passe invalide.' }, { status: 400 });
    const message = error instanceof Error ? error.message : '';
    if (message === 'SLUG_EXISTS') return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
    if (message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'Cet e-mail est déjà utilisé' }, { status: 409 });
    return apiError(error);
  }
}
