import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { blindIndex, decrypt, encrypt, requireOrgUser } from '@/lib/security';
import { organizationKey, writeAudit } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    const user = await requireOrgUser('SETTINGS_VIEW');
    const organization = await db.organization.findUnique({ where: { id: user.organizationId! } });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    const key = await organizationKey(organization.id);
    return NextResponse.json({
      name: organization.name,
      slug: organization.slug,
      phone: decrypt(organization.phoneEncrypted, key),
      email: decrypt(organization.emailEncrypted, key),
      address: decrypt(organization.addressEncrypted, key),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireOrgUser('SETTINGS_UPDATE');
    const input = await readJsonBody(req, 16 * 1024);
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160) return NextResponse.json({ error: 'Nom requis ou trop long' }, { status: 400 });
    for (const field of ['phone', 'email', 'address']) {
      const maximum = field === 'email' ? 254 : field === 'phone' ? 50 : 500;
      if (input[field] !== undefined && input[field] !== null && (typeof input[field] !== 'string' || input[field].length > maximum)) {
        return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 });
      }
    }

    const organizationId = user.organizationId!;
    const key = await organizationKey(organizationId);
    const phone = input.phone as string | null | undefined;
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : input.email as string | null | undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'E-mail invalide' }, { status: 400 });

    await db.$transaction(async (tx) => {
      if (email) {
        const existing = await tx.user.findFirst({ where: { email, id: { not: user.id } }, select: { id: true } });
        if (existing) throw new Error('EMAIL_EXISTS');
      }

      await tx.organization.update({
        where: { id: organizationId },
        data: {
          name: input.name.trim(),
          phoneEncrypted: encrypt(phone, key),
          phoneBlindIndex: blindIndex(phone, 'organization.phone', organizationId),
          emailEncrypted: encrypt(email, key),
          emailBlindIndex: blindIndex(email, 'organization.email', organizationId),
          addressEncrypted: encrypt(input.address as string | null | undefined, key),
        },
      });

      if (email && user.role === 'ADMIN' && email !== user.email) {
        await tx.user.update({ where: { id: user.id }, data: { email, emailBlindIndex: blindIndex(email, 'user.email', organizationId) } });
        await tx.session.deleteMany({ where: { userId: user.id } });
      }

      await tx.auditLog.create({ data: { userId: user.id, organizationId, action: 'SETTINGS_UPDATED', entity: 'Organization', entityId: organizationId, metadata: { fields: ['name', 'phone', 'email', 'address'] } } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'Cet e-mail est déjà utilisé.' }, { status: 409 });
    return apiError(error);
  }
}
