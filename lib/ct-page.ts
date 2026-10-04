import { notFound, redirect } from 'next/navigation';
import type { Permission } from '@/generated/prisma/client';
import { requireCTPermission } from '@/lib/security';

export async function requireCTPagePermission(permission: Permission) {
  try {
    return await requireCTPermission(permission);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') redirect('/login');
    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') redirect('/ad/super-admin');
    if (error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'NO_ORGANIZATION')) notFound();
    throw error;
  }
}
