import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireOrgUser, blindIndex, encrypt } from '@/lib/security';
import { organizationKey, toClient, clientEncrypted, writeAudit } from '@/lib/domain';

export async function GET(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_VIEW');
    const key = await organizationKey(u.organizationId!);
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const where: any = { organizationId: u.organizationId! };
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phoneBlindIndex: blindIndex(q, 'client.phone', u.organizationId!) },
      { whatsappBlindIndex: blindIndex(q, 'client.whatsapp', u.organizationId!) },
      { emailBlindIndex: blindIndex(q, 'client.email', u.organizationId!) },
    ];
    const rows = await db.client.findMany({ where, orderBy: { name: 'asc' }, take: 500 });
    return NextResponse.json(rows.map(r => toClient(u.organizationId!, key, r)));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && e.message === 'FORBIDDEN' ? 'Interdit' : 'Non autorisé' }, { status: e instanceof Error && e.message === 'FORBIDDEN' ? 403 : 401 });
  }
}

export async function POST(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_CREATE');
    const data = await req.json();
    if (!data.name?.trim()) return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
    const key = await organizationKey(u.organizationId!);
    const row = await db.client.create({ data: { organizationId: u.organizationId!, ...clientEncrypted(u.organizationId!, key, data) } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_CREATED', 'Client', row.id);
    return NextResponse.json({ id: row.id });
  } catch (e) {
    const status = e instanceof Error && e.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_UPDATE');
    const d = await req.json();
    if (!d.id || !d.name?.trim()) return NextResponse.json({ error: 'ID et nom requis' }, { status: 400 });
    const key = await organizationKey(u.organizationId!);
    const target = await db.client.findFirst({ where: { id: d.id, organizationId: u.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    const row = await db.client.update({ where: { id: target.id }, data: { ...clientEncrypted(u.organizationId!, key, d) } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_UPDATED', 'Client', row.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status: e instanceof Error && e.message === 'FORBIDDEN' ? 403 : 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const u = await requireOrgUser('CLIENTS_DELETE');
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const target = await db.client.findFirst({ where: { id, organizationId: u.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    await db.client.delete({ where: { id } });
    await writeAudit(u.id, u.organizationId, 'CLIENT_DELETED', 'Client', id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status: e instanceof Error && e.message === 'FORBIDDEN' ? 403 : 400 });
  }
}
