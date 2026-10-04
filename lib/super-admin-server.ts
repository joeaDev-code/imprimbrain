import { requireSuperAdmin } from '@/lib/security';

export async function requireSuperAdminApi() {
  try {
    return await requireSuperAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') {
      throw new Error('FORBIDDEN');
    }
    throw error;
  }
}
