import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { blindIndex, decrypt, encrypt, requireUser } from '@/lib/security';
import { organizationKey } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';

const DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

function validateHours(value: unknown) {
  if (!Array.isArray(value) || value.length > 7) throw new Error('OPENING_HOURS_INVALID');
  const seen = new Set<number>();
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('OPENING_HOURS_INVALID');
    const item = entry as Record<string, unknown>;
    const dayOfWeek = item.dayOfWeek;
    const closed = item.closed;
    if (typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek) || !DAYS.has(dayOfWeek) || seen.has(dayOfWeek) || typeof closed !== 'boolean') throw new Error('OPENING_HOURS_INVALID');
    seen.add(dayOfWeek);
    if (closed) return { dayOfWeek, closed: true, openMinute: null, closeMinute: null };
    if (typeof item.openMinute !== 'number' || typeof item.closeMinute !== 'number' || !Number.isInteger(item.openMinute) || !Number.isInteger(item.closeMinute) || item.openMinute < 0 || item.openMinute > 1439 || item.closeMinute < 1 || item.closeMinute > 1439 || item.closeMinute <= item.openMinute) throw new Error('OPENING_HOURS_INVALID');
    return { dayOfWeek, closed: false, openMinute: item.openMinute, closeMinute: item.closeMinute };
  });
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.organizationId || user.role !== 'ADMIN') return NextResponse.json({ error: 'Interdit' }, { status: 403 });
    const organization = await db.organization.findUnique({
      where: { id: user.organizationId },
      include: { openingHours: { orderBy: { dayOfWeek: 'asc' } }, services: { where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, category: true, unit: true, price: true } } },
    });
    if (!organization) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
    const key = await organizationKey(organization.id);
    return NextResponse.json({
      completed: user.onboardingCompleted,
      name: organization.name,
      phone: decrypt(organization.phoneEncrypted, key),
      whatsapp: decrypt(organization.whatsappEncrypted, key),
      address: decrypt(organization.addressEncrypted, key),
      bio: organization.publicDescription ?? '',
      city: organization.city ?? '',
      neighborhood: organization.neighborhood ?? '',
      openingHours: organization.openingHours.map((h) => ({ dayOfWeek: h.dayOfWeek, openMinute: h.openMinute, closeMinute: h.closeMinute, closed: h.closed })),
      services: organization.services.map((s) => ({ id: s.id, name: s.name, category: s.category, unit: s.unit, price: Number(s.price) })),
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.organizationId || user.role !== 'ADMIN') return NextResponse.json({ error: 'Interdit' }, { status: 403 });
    if (user.onboardingCompleted) return NextResponse.json({ error: 'Configuration initiale déjà terminée. Utilisez Paramètres et Services pour les modifications.' }, { status: 409 });
    const input = await readJsonBody(request, 32 * 1024);
    const organizationId = user.organizationId;
    const key = await organizationKey(organizationId);
    const bio = input.bio === undefined ? undefined : input.bio === null ? null : typeof input.bio === 'string' && input.bio.length <= 1000 ? input.bio.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const phone = input.phone === undefined ? undefined : input.phone === null ? null : typeof input.phone === 'string' && input.phone.length <= 50 ? input.phone.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const whatsapp = input.whatsapp === undefined ? undefined : input.whatsapp === null ? null : typeof input.whatsapp === 'string' && input.whatsapp.length <= 50 ? input.whatsapp.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const city = input.city === undefined ? undefined : input.city === null ? null : typeof input.city === 'string' && input.city.length <= 100 ? input.city.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const neighborhood = input.neighborhood === undefined ? undefined : input.neighborhood === null ? null : typeof input.neighborhood === 'string' && input.neighborhood.length <= 120 ? input.neighborhood.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const address = input.address === undefined ? undefined : input.address === null ? null : typeof input.address === 'string' && input.address.length <= 500 ? input.address.trim() || null : (() => { throw new Error('INVALID_INPUT'); })();
    const openingHours = input.openingHours === undefined ? undefined : validateHours(input.openingHours);
    const services = input.services === undefined ? [] : input.services;
    if (!Array.isArray(services) || services.length > 30) throw new Error('INVALID_INPUT');
    const normalizedServices = services.map((service: unknown) => {
      if (!service || typeof service !== 'object') throw new Error('INVALID_INPUT');
      const item = service as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const category = item.category == null ? null : typeof item.category === 'string' ? item.category.trim() || null : null;
      const unit = item.unit == null ? 'unité' : typeof item.unit === 'string' ? item.unit.trim() || 'unité' : null;
      const price = Number(item.price);
      const id = item.id === undefined ? undefined : typeof item.id === 'string' && /^[0-9a-fA-F-]{36}$/.test(item.id) ? item.id : null;
      if (item.id !== undefined && !id) throw new Error('INVALID_INPUT');
      if (!name || name.length > 160 || (category && category.length > 80) || !unit || unit.length > 40 || !Number.isFinite(price) || price < 0 || price > 99_999_999_999.99) throw new Error('INVALID_INPUT');
      return { id, name, category, unit, price };
    });

    await db.$transaction(async (tx) => {
      await tx.organization.update({ where: { id: organizationId }, data: {
        phoneEncrypted: phone === undefined ? undefined : encrypt(phone, key),
        phoneBlindIndex: phone === undefined ? undefined : blindIndex(phone, 'organization.phone', organizationId),
        whatsappEncrypted: whatsapp === undefined ? undefined : encrypt(whatsapp, key),
        whatsappBlindIndex: whatsapp === undefined ? undefined : blindIndex(whatsapp, 'organization.whatsapp', organizationId),
        publicDescription: bio,
        city,
        neighborhood,
        addressEncrypted: address === undefined ? undefined : encrypt(address, key),
      }});
      if (openingHours !== undefined) {
        await tx.organizationOpeningHour.deleteMany({ where: { organizationId } });
        if (openingHours.length) await tx.organizationOpeningHour.createMany({ data: openingHours.map((h) => ({ ...h, organizationId })) });
      }
      for (const service of normalizedServices) {
        if (service.id) {
          const existing = await tx.service.findFirst({ where: { id: service.id, organizationId }, select: { id: true } });
          if (!existing) throw new Error('INVALID_INPUT');
          await tx.service.update({ where: { id: existing.id }, data: { name: service.name, category: service.category, unit: service.unit, price: service.price, active: true } });
        } else {
          await tx.service.create({ data: { organizationId, name: service.name, category: service.category, unit: service.unit, price: service.price } });
        }
      }
      await tx.user.update({ where: { id: user.id }, data: { onboardingCompleted: true } });
      await tx.auditLog.create({ data: { userId: user.id, organizationId, action: 'ONBOARDING_COMPLETED', entity: 'User', entityId: user.id, metadata: { fields: ['profile', 'openingHours', 'services'] } } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && ['INVALID_INPUT', 'OPENING_HOURS_INVALID'].includes(error.message)) return NextResponse.json({ error: error.message === 'OPENING_HOURS_INVALID' ? 'Horaires invalides.' : 'Informations invalides.' }, { status: 400 });
    return apiError(error);
  }
}
