import { notFound, redirect } from 'next/navigation';
import { resolveCTLegacyRoute } from '@/lib/ct-route';
import { requireCTPermission } from '@/lib/security';

export default async function CTLegacyModulePage({
  params,
}: {
  params: Promise<{ role: string; segments: string[] }>;
}) {
  const { segments } = await params;
  const route = resolveCTLegacyRoute(segments);
  if (!route) notFound();

  try {
    await requireCTPermission(route.permission);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') redirect('/login');
    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') redirect('/super-admin');
    if (error instanceof Error && error.message === 'FORBIDDEN') notFound();
    throw error;
  }

  redirect(route.href);
}
