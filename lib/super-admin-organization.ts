import crypto from 'node:crypto';
import { db } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { blindIndex, encrypt, randomKey, wrapKey } from '@/lib/security';
import { deleteStoredImage, uploadImage } from '@/lib/images/service';
import { sendOrganizationWelcomeEmail } from '@/lib/mail/service';
import { addCalendarMonths, INITIAL_SUBSCRIPTION_AMOUNT } from '@/lib/subscription-lifecycle';

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  logo: File;
};

export async function createSuperAdminOrganization(actorId: string, input: CreateOrganizationInput) {
  if (input.password.length < 10 || input.password.length > 128 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) throw new Error('INVALID_PASSWORD');
  if (await db.organization.findUnique({ where: { slug: input.slug }, select: { id: true } })) throw new Error('SLUG_EXISTS');
  if (await db.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new Error('EMAIL_EXISTS');

  const storedLogo = await uploadImage(input.logo, 'logo');
  const dataKey = randomKey();
  const startsAt = new Date();
  const expiresAt = addCalendarMonths(startsAt, 1);
  const reference = `SUB-${crypto.randomUUID()}`;

  try {
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: {
        name: input.name, slug: input.slug, logoUrl: storedLogo.url, wrappedDataKey: wrapKey(dataKey),
        phoneEncrypted: encrypt(input.phone, dataKey), emailEncrypted: encrypt(input.email, dataKey), addressEncrypted: encrypt(input.address, dataKey),
      } });
      await tx.organization.update({ where: { id: organization.id }, data: {
        phoneBlindIndex: blindIndex(input.phone, 'organization.phone', organization.id),
        emailBlindIndex: blindIndex(input.email, 'organization.email', organization.id),
      } });
      const administrator = await tx.user.create({ data: {
        organizationId: organization.id, name: input.name, email: input.email, passwordHash: hashPassword(input.password), role: 'ADMIN', mustChangePassword: true,
        emailBlindIndex: blindIndex(input.email, 'user.email', organization.id),
      } });
      const subscription = await tx.subscription.create({ data: {
        organizationId: organization.id, amount: INITIAL_SUBSCRIPTION_AMOUNT, currency: 'XOF', startsAt, expiresAt, status: 'ACTIVE',
      } });
      const payment = await tx.payment.create({ data: {
        organizationId: organization.id, subscriptionId: subscription.id, amount: INITIAL_SUBSCRIPTION_AMOUNT, currency: 'XOF', status: 'PAID', reference, method: 'CASH', paidAt: startsAt,
      } });
      await tx.auditLog.create({ data: {
        userId: actorId, organizationId: organization.id, action: 'ORGANIZATION_CREATED', entity: 'Organization', entityId: organization.id,
        metadata: { slug: input.slug, administratorId: administrator.id, subscriptionId: subscription.id, paymentId: payment.id, amount: INITIAL_SUBSCRIPTION_AMOUNT, currency: 'XOF' },
      } });
      return { organization, administrator, subscription, payment };
    });
    const emailStatus = await sendOrganizationWelcomeEmail(input.email, {
      organizationName: input.name, loginEmail: input.email, initialPassword: input.password, startsAt, expiresAt,
    });
    return {
      organization: { id: result.organization.id, name: input.name, slug: input.slug, logoUrl: storedLogo.url, createdAt: result.organization.createdAt },
      administrator: { id: result.administrator.id, email: input.email, role: result.administrator.role },
      subscription: { id: result.subscription.id, amount: INITIAL_SUBSCRIPTION_AMOUNT, currency: 'XOF', status: result.subscription.status, startsAt, expiresAt },
      payment: { id: result.payment.id, amount: INITIAL_SUBSCRIPTION_AMOUNT, currency: 'XOF', status: result.payment.status, reference, paidAt: startsAt },
      email: { status: emailStatus },
    };
  } catch (error) {
    await deleteStoredImage(storedLogo.url).catch(() => undefined);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const target = 'meta' in error && error.meta && typeof error.meta === 'object' && 'target' in error.meta ? error.meta.target : null;
      const fields = Array.isArray(target) ? target.map(String) : [];
      if (fields.includes('slug')) throw new Error('SLUG_EXISTS');
      if (fields.includes('email')) throw new Error('EMAIL_EXISTS');
    }
    throw error;
  }
}
