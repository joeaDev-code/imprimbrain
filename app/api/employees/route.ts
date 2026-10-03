import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { can, blindIndex, requireOrgUser } from '@/lib/security';
import { hashPassword } from '@/lib/password';
import { writeAudit } from '@/lib/domain';
import { permissions } from '@/lib/permissions';
import { readJsonBody } from '@/lib/request-json';
import { canAssignEmployeeRole, canEditEmployeePrivileges, canEditEmployeeTarget, canResetEmployeePassword, employeeAuditMetadata, revokeEmployeeSessions } from '@/lib/employee-access';
import { apiError } from '@/lib/api-error';

function allowed(role: string) {
  return ['ADMIN', 'OFFICER', 'SECRETARY'].includes(role);
}

export async function GET() {
  try {
    const user = await requireOrgUser('EMPLOYEES_VIEW');
    const rows = await db.user.findMany({
      where: { organizationId: user.organizationId! },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, permissions: { select: { permission: true, allowed: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireOrgUser('EMPLOYEES_CREATE');
    const data = await readJsonBody(req, 16 * 1024);
    if (data.role === 'ADMIN' && !canAssignEmployeeRole(user.role, data.role)) return NextResponse.json({ error: 'Seul un administrateur peut créer un administrateur' }, { status: 403 });
    const role = allowed(data.role) ? data.role : 'SECRETARY';
    if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 120 || typeof data.email !== 'string' || !data.email.trim() || data.email.length > 254 || typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 1024) {
      return NextResponse.json({ error: 'Nom, e-mail et mot de passe (8 caractères minimum) requis' }, { status: 400 });
    }
    const email = data.email.trim().toLowerCase();
    const employee = await db.user.create({
      data: { organizationId: user.organizationId!, name: data.name.trim(), email, passwordHash: hashPassword(data.password), role, emailBlindIndex: blindIndex(email, 'user.email', user.organizationId!) },
    });
    await writeAudit(user.id, user.organizationId, 'EMPLOYEE_CREATED', 'User', employee.id, { role });
    return NextResponse.json({ id: employee.id });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireOrgUser('EMPLOYEES_UPDATE');
    const data = await readJsonBody(req, 16 * 1024);
    const target = await db.user.findFirst({ where: { id: data.id, organizationId: user.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 });
    if (!canEditEmployeeTarget(user.role, target.role)) return NextResponse.json({ error: 'Modification interdite' }, { status: 403 });

    const hasPrivilegeChanges = data.role !== undefined || data.permissions !== undefined;
    if (hasPrivilegeChanges && !canEditEmployeePrivileges(user.id, user.role, target.id)) {
      return NextResponse.json({ error: 'Seul un administrateur peut modifier les privilèges d’un autre employé' }, { status: 403 });
    }
    const passwordChanged = data.password !== undefined;
    if (passwordChanged && !canResetEmployeePassword(user.id, user.role, target.id)) {
      return NextResponse.json({ error: 'Seul un administrateur peut réinitialiser le mot de passe d’un autre employé' }, { status: 403 });
    }
    if (data.active !== undefined && typeof data.active === 'boolean' && !can(user, 'EMPLOYEES_DISABLE')) {
      return NextResponse.json({ error: 'Permission de désactivation requise' }, { status: 403 });
    }
    if (data.role !== undefined && (typeof data.role !== 'string' || !allowed(data.role) || !canAssignEmployeeRole(user.role, data.role))) return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    if (data.permissions !== undefined && (!Array.isArray(data.permissions) || data.permissions.some((permission: any) => !permission || !permissions.includes(permission.permission) || typeof permission.allowed !== 'boolean'))) {
      return NextResponse.json({ error: 'Permissions invalides' }, { status: 400 });
    }
    if (target.id === user.id && data.active === false) return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte' }, { status: 400 });

    const update: any = {};
    if (typeof data.active === 'boolean') update.active = data.active;
    if (data.role !== undefined) update.role = data.role;
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 120) return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
      update.name = data.name.trim();
    }
    if (data.password !== undefined) {
      if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 1024) return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 400 });
      update.passwordHash = hashPassword(data.password);
    }
    const metadata = employeeAuditMetadata(update, passwordChanged, Array.isArray(data.permissions) ? data.permissions.length : undefined);

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: target.id, organizationId: user.organizationId! }, data: update });
      if (passwordChanged) await revokeEmployeeSessions(tx, target.id);
      if (Array.isArray(data.permissions)) {
        for (const permission of data.permissions) {
          await tx.userPermission.upsert({
            where: { userId_permission: { userId: target.id, permission: permission.permission } },
            update: { allowed: permission.allowed },
            create: { userId: target.id, permission: permission.permission, allowed: permission.allowed },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId!,
          action: 'EMPLOYEE_UPDATED',
          entity: 'User',
          entityId: target.id,
          metadata,
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
