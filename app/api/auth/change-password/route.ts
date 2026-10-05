import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { createSession, requireUser } from '@/lib/security';
import { readJsonBody } from '@/lib/request-json';

function validPassword(value: string) {
  return value.length >= 10 && value.length <= 128 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export async function POST(request: Request) {
  try {
    const user = await requireUser({ allowPasswordChange: true });
    const body = await readJsonBody(request, 8 * 1024);
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' }, { status: 400 });
    if (!validPassword(newPassword)) return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 10 caractères, une lettre et un chiffre.' }, { status: 400 });
    if (currentPassword === newPassword) return NextResponse.json({ error: 'Le nouveau mot de passe doit être différent.' }, { status: 400 });
    if (!verifyPassword(currentPassword, user.passwordHash)) return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword), mustChangePassword: false } });
      await tx.auditLog.create({ data: { userId: user.id, organizationId: user.organizationId, action: 'PASSWORD_CHANGED', entity: 'User', entityId: user.id } });
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
