'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { filterCTNavigation } from '@/components/ct/navigation';
import { useCTStore } from '@/components/ct/ct-provider';

export function CTShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useCTStore((state) => state.role);
  const user = useCTStore((state) => state.user);
  const organization = useCTStore((state) => state.organization);
  const permissions = useCTStore((state) => state.permissions);
  const collapsed = useCTStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useCTStore((state) => state.toggleSidebar);
  const clearAuth = useCTStore((state) => state.clearAuth);
  const navigation = filterCTNavigation(permissions);
  const base = `/ct/${role.toLowerCase()}`;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearAuth();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f9fc] md:flex">
      <aside className={[
        'relative sticky top-0 hidden h-dvh shrink-0 flex-col overflow-x-hidden bg-[#173b68] text-white shadow-2xl transition-[width] duration-300 md:flex',
        collapsed ? 'w-20' : 'w-[260px]',
      ].join(' ')}>
        <div className={['flex h-[88px] shrink-0 items-center', collapsed ? 'justify-center px-2' : 'px-6'].join(' ')}>
          <Logo variant={collapsed ? 'icon' : 'full'} width={collapsed ? 40 : 150} height={44} priority />
        </div>

        <div className={['mx-3 mb-2 border-b border-white/10 pb-4', collapsed ? 'text-center' : ''].join(' ')}>
          {!collapsed && <p className="truncate text-xs font-bold">{organization.name}</p>}
          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/55">{role}</p>
        </div>

        <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3.5 py-3">
          <div className="space-y-2">
            {navigation.map(({ href, label, icon: Icon }) => {
              const target = href ? `${base}/${href}` : base;
              const active = href ? pathname === target || pathname.startsWith(`${target}/`) : pathname === base;
              return (
                <Link
                  key={href || 'home'}
                  href={target}
                  title={collapsed ? label : undefined}
                  className={[
                    'group flex h-11 items-center rounded-2xl font-medium transition-colors',
                    collapsed ? 'mx-auto w-11 justify-center px-0' : 'gap-3.5 px-4',
                    active ? 'bg-white font-bold text-[#173b68] shadow-lg' : 'text-white/80 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span className="truncate text-[13px]">{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 p-3.5">
          <div className={['mb-2 flex items-center rounded-2xl border border-white/10 bg-white/10 p-3', collapsed ? 'justify-center' : 'gap-3'].join(' ')}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-500 text-xs font-black">
              {user.name.trim().charAt(0).toUpperCase() || 'U'}
            </div>
            {!collapsed && <div className="min-w-0"><p className="truncate text-xs font-bold">{user.name}</p><p className="truncate text-[10px] text-white/60">{user.email}</p></div>}
          </div>
          <button type="button" onClick={logout} className={['flex h-11 w-full items-center rounded-2xl text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-200', collapsed ? 'justify-center' : 'gap-3 px-4'].join(' ')} aria-label="Déconnexion">
            <LogOut size={18} />
            {!collapsed && <span className="text-xs font-semibold">Déconnexion</span>}
          </button>
        </div>

        <button type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Déployer la navigation' : 'Réduire la navigation'} className="absolute right-2 top-7 grid size-7 place-items-center rounded-full border border-white/20 bg-[#173b68] text-white hover:bg-white hover:text-[#173b68]">
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8 lg:p-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Imprim’Brain · Espace CT</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{organization.name}</p>
          </div>
          <p className="text-xs text-slate-500">{user.name} · {role}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
