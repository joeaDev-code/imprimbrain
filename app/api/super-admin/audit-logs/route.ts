import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { db } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/super-admin-server';

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/(password|token|secret|authorization|encrypted|blind.?index)/i.test(key))
      .map(([key, entry]) => [key, sanitizeMetadata(entry)]));
  }
  return value;
}

export async function GET() {
  try {
    await requireSuperAdminApi();
    const rows = await db.auditLog.findMany({
      select: { id: true, action: true, entity: true, entityId: true, metadata: true, createdAt: true, user: { select: { name: true, email: true } }, organization: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(rows.map(({ metadata, ...row }) => ({ ...row, metadata: sanitizeMetadata(metadata) })));
  } catch (error) {
    return apiError(error);
  }
}
