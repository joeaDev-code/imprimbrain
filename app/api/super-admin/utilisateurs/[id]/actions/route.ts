import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { requireSuperAdminApi } from '@/lib/super-admin-server';
import { readJsonBody } from '@/lib/request-json';

function generatePassword() {
  return `${crypto.randomBytes(5).toString('base64url')}-A7`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdminApi();
    const { id } = await params;
    const body = await readJsonBody(request, 4 * 1024);
    const action = typeof body.action === 'string' ? body.action : '';
    if (!['activate', 'deactivate', 'reset-password'].includes(action)) return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

    const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, active: true, organizationId: true } });
    if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    if (target.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Le compte Super Admin ne peut pas être modifié depuis cette action.' }, { status: 403 });

    if (action === 'reset-password') {
      const temporaryPassword = generatePassword();
      await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { passwordHash: hashPassword(temporaryPassword), active: true, mustChangePassword: true } });
        await tx.session.deleteMany({ where: { userId: id } });
        await tx.auditLog.create({ data: { userId: actor.id, organizationId: target.organizationId, action: 'USER_PASSWORD_RESET_BY_SUPER_ADMIN', entity: 'User', entityId: id, metadata: { targetUserId: id } } });
      });
      return NextResponse.json({ ok: true, temporaryPassword });
    }

    const active = action === 'activate';
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { active } });
      if (!active) await tx.session.deleteMany({ where: { userId: id } });
      await tx.auditLog.create({ data: { userId: actor.id, organizationId: target.organizationId, action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', entity: 'User', entityId: id, metadata: { previousActive: target.active, nextActive: active } } });
    });
    return NextResponse.json({ ok: true, active });
  } catch (error) {
    return apiError(error);
  }
}
