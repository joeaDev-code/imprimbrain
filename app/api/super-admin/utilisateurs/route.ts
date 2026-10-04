import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

export async function GET() {
  try {
    await requireSuperAdminApi();
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users.map(({ role, active, _count, ...user }) => ({ ...user, platformRole: role, isActive: active, membershipsCount: _count.sessions })));
  } catch (error) {
    return apiError(error);
  }
}
