export function isAdminRole(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function canEditEmployeePrivileges(actorId: string, actorRole: string, targetId: string) {
  return actorId !== targetId && isAdminRole(actorRole);
}

export function canResetEmployeePassword(actorId: string, actorRole: string, targetId: string) {
  return actorId === targetId || isAdminRole(actorRole);
}

export function canEditEmployeeTarget(actorRole: string, targetRole: string) {
  if (targetRole === 'SUPER_ADMIN') return actorRole === 'SUPER_ADMIN';
  if (targetRole === 'ADMIN') return isAdminRole(actorRole);
  return true;
}

export function canAssignEmployeeRole(actorRole: string, requestedRole: string) {
  if (!['ADMIN', 'OFFICER', 'SECRETARY'].includes(requestedRole)) return false;
  return requestedRole !== 'ADMIN' || isAdminRole(actorRole);
}

export function employeeAuditMetadata(update: Record<string, unknown>, passwordChanged: boolean, permissionCount?: number) {
  const { passwordHash: _passwordHash, ...safeUpdate } = update;
  return {
    ...safeUpdate,
    passwordChanged,
    ...(permissionCount === undefined ? {} : { permissions: permissionCount }),
  };
}

export async function revokeEmployeeSessions(
  transaction: { session: { deleteMany(args: { where: { userId: string } }): Promise<unknown> } },
  userId: string,
) {
  await transaction.session.deleteMany({ where: { userId } });
}
