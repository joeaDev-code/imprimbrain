import { redirect } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { decideSuperAdminRoute } from '@/lib/ct-access';
import { currentUser } from '@/lib/security';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const decision = decideSuperAdminRoute(user?.role ?? null);
  if (decision.kind === 'deny') redirect(decision.href);

  return (
    <div className="min-h-screen bg-[#0d1e33] text-white">
      <header className="flex min-h-20 items-center justify-between border-b border-white/10 px-5 sm:px-8">
        <Logo variant="full" width={150} height={44} priority />
        <div className="text-right">
          <p className="text-xs font-bold">Console Super Admin</p>
          <p className="text-[10px] text-white/55">{user?.email}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
