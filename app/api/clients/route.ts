import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireOrgUser, blindIndex, encrypt } from '@/lib/security';
import { organizationKey, toClient, clientEncrypted, writeAudit } from '@/lib/domain';
import { readJsonBody } from '@/lib/request-json';
import { apiError } from '@/lib/api-error';

export async function GET(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_VIEW');
    const key = await organizationKey(u.organizationId!);
    const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 120);
    const where: any = { organizationId: u.organizationId! };
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phoneBlindIndex: blindIndex(q, 'client.phone', u.organizationId!) },
      { whatsappBlindIndex: blindIndex(q, 'client.whatsapp', u.organizationId!) },
      { emailBlindIndex: blindIndex(q, 'client.email', u.organizationId!) },
    ];
    const rows = await db.client.findMany({ where, orderBy: { name: 'asc' }, take: 500 });
    return NextResponse.json(rows.map(r => toClient(u.organizationId!, key, r)));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_CREATE');
    const data = await readJsonBody(req, 16 * 1024);
    if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 160) return NextResponse.json({ error: 'Le nom est obligatoire ou trop long' }, { status: 400 });
    for (const [field, maximum] of [['phone', 50], ['whatsapp', 50], ['email', 254], ['city', 120], ['notes', 2000]] as const) {
      if (data[field] !== undefined && data[field] !== null && (typeof data[field] !== 'string' || data[field].length > maximum)) {
        return NextResponse.json({ error: 'Coordonnées client invalides' }, { status: 400 });
      }
    }
    const key = await organizationKey(u.organizationId!);
    const row = await db.client.create({ data: { organizationId: u.organizationId!, ...clientEncrypted(u.organizationId!, key, data) } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_CREATED', 'Client', row.id);
    return NextResponse.json({ id: row.id });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_UPDATE');
    const d = await readJsonBody(req, 16 * 1024);
    if (typeof d.id !== 'string' || typeof d.name !== 'string' || !d.name.trim() || d.name.length > 160) return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 });
    for (const [field, maximum] of [['phone', 50], ['whatsapp', 50], ['email', 254], ['city', 120], ['notes', 2000]] as const) {
      if (d[field] !== undefined && d[field] !== null && (typeof d[field] !== 'string' || d[field].length > maximum)) {
        return NextResponse.json({ error: 'Coordonnées client invalides' }, { status: 400 });
      }
    }
    const key = await organizationKey(u.organizationId!);
    const target = await db.client.findFirst({ where: { id: d.id, organizationId: u.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    const row = await db.client.update({ where: { id: target.id, organizationId: u.organizationId! }, data: { ...clientEncrypted(u.organizationId!, key, d) } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_UPDATED', 'Client', row.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_DELETE');
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const target = await db.client.findFirst({ where: { id, organizationId: u.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    await db.client.delete({ where: { id, organizationId: u.organizationId! } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_DELETED', 'Client', id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
