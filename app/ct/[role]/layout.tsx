import { redirect } from 'next/navigation';
import { CTShell } from '@/components/ct/ct-shell';
import { CTProvider } from '@/components/ct/ct-provider';
import { db } from '@/lib/prisma';
import { decideCTRoute } from '@/lib/ct-access';
import { requireCTUser } from '@/lib/security';

export default async function CTLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role: requestedRole } = await params;
  let user;
  try {
    user = await requireCTUser();
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') redirect('/ad/super-admin');
    if (error instanceof Error && error.message === 'PASSWORD_CHANGE_REQUIRED') redirect('/change-password');
    if (error instanceof Error && (error.message === 'SUBSCRIPTION_EXPIRED' || error.message === 'ORGANIZATION_SUSPENDED')) redirect('/abonnement-expire');
    redirect('/login');
  }

  const decision = decideCTRoute(user.role, user.organizationId, requestedRole);
  if (decision.kind === 'deny') redirect(decision.href);
  if (decision.kind === 'redirect') redirect(decision.href);
  const organizationId = user.organizationId;
  if (!organizationId) redirect('/login');

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, logoUrl: true },
  });
  if (!organization) redirect('/login');

  const initialState = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: decision.role,
      organizationId,
      permissions: user.permissions,
    },
    organization: { id: organization.id, name: organization.name, logo: organization.logoUrl },
  };

  return (
    <CTProvider initialState={initialState}>
      <CTShell>{children}</CTShell>
    </CTProvider>
  );
}
