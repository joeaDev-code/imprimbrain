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
    const email = input.email as string | null | undefined;
    await db.organization.update({
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
    await writeAudit(user.id, organizationId, 'SETTINGS_UPDATED', 'Organization', organizationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
