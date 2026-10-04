import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const users = await db.user.findMany({
      where: { role: { not: 'SUPER_ADMIN' } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        mustChangePassword: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users.map(({ role, active, mustChangePassword, _count, ...user }) => ({ ...user, platformRole: role, isActive: active, mustChangePassword, sessionsCount: _count.sessions })));
  } catch (error) {
    return apiError(error);
  }
}
