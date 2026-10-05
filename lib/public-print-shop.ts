import { db } from '@/lib/prisma';
import { decrypt } from '@/lib/security';
import { organizationKey } from '@/lib/domain';

export type PublicOpeningHour = {
  dayOfWeek: number;
  open: string | null;
  close: string | null;
  closed: boolean;
};

export type PublicPrintShop = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string;
  city: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  isOpen: boolean;
  todayHours: string | null;
  services: { id: string; name: string; category: string | null; unit: string }[];
  openingHours: PublicOpeningHour[];
};

function minutesToTime(value: number | null) {
  if (value === null) return null;
  const hours = Math.floor(value / 60).toString().padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function currentDayAndMinute(timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dayOfWeek: dayMap[values.weekday] ?? 0, minute: Number(values.hour) * 60 + Number(values.minute) };
}

export function openingStatus(hours: PublicOpeningHour[], timezone: string) {
  try {
    const { dayOfWeek, minute } = currentDayAndMinute(timezone);
    const today = hours.find((item) => item.dayOfWeek === dayOfWeek);
    if (!today || today.closed || today.open === null || today.close === null) return { isOpen: false, todayHours: null };
    const [openH, openM] = today.open.split(':').map(Number);
    const [closeH, closeM] = today.close.split(':').map(Number);
    const openMinute = openH * 60 + openM;
    const closeMinute = closeH * 60 + closeM;
    return { isOpen: minute >= openMinute && minute < closeMinute, todayHours: `${today.open} – ${today.close}` };
  } catch {
    return { isOpen: false, todayHours: null };
  }
}

export async function getPublicPrintShopBySlug(slug: string): Promise<PublicPrintShop | null> {
  const organization = await db.organization.findFirst({
    where: { slug, status: 'ACTIVE', publicProfileEnabled: true, subscriptions: { some: { status: 'ACTIVE', expiresAt: { gt: new Date() } } } },
    select: {
      id: true, slug: true, name: true, logoUrl: true, publicDescription: true,
      city: true, neighborhood: true, latitude: true, longitude: true, timezone: true,
      phoneEncrypted: true, whatsappEncrypted: true, emailEncrypted: true, addressEncrypted: true,
      openingHours: { orderBy: { dayOfWeek: 'asc' }, select: { dayOfWeek: true, openMinute: true, closeMinute: true, closed: true } },
      services: { where: { active: true }, select: { id: true, name: true, category: true, unit: true }, orderBy: { name: 'asc' }, take: 100 },
    },
  });
  if (!organization) return null;

  const key = await organizationKey(organization.id);
  const [phone, whatsapp, email, address] = await Promise.all([
    decrypt(organization.phoneEncrypted, key),
    decrypt(organization.whatsappEncrypted, key),
    decrypt(organization.emailEncrypted, key),
    decrypt(organization.addressEncrypted, key),
  ]);

  const openingHours = organization.openingHours.map((hour) => ({
    dayOfWeek: hour.dayOfWeek,
    open: minutesToTime(hour.openMinute),
    close: minutesToTime(hour.closeMinute),
    closed: hour.closed,
  }));
  const status = openingStatus(openingHours, organization.timezone);

  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    logoUrl: organization.logoUrl,
    description: normalizeText(organization.publicDescription) || 'Imprimerie et services d’impression.',
    city: organization.city,
    neighborhood: organization.neighborhood,
    latitude: organization.latitude === null ? null : Number(organization.latitude),
    longitude: organization.longitude === null ? null : Number(organization.longitude),
    timezone: organization.timezone,
    phone,
    whatsapp,
    email,
    address,
    isOpen: status.isOpen,
    todayHours: status.todayHours,
    services: organization.services,
    openingHours,
  };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
