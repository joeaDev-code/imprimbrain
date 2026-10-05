"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { filterCTNavigation } from "@/components/ct/navigation";
import { useCTStore } from "@/components/ct/ct-provider";
import { CTOnboardingModal } from "@/components/ct/ct-onboarding-modal";

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
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuth();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`group relative sticky top-0 hidden h-dvh shrink-0 flex-col bg-[#173b68] text-white shadow-2xl transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        {/* Bouton de réduction flottant */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"}
          className="absolute -right-3.5 top-9 z-50 flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:border-[#173b68] hover:text-[#173b68]"
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={3} />
          ) : (
            <ChevronLeft size={14} strokeWidth={3} />
          )}
        </button>

        {/* Logo */}
        <div
          className={`flex h-[88px] shrink-0 items-center transition-all ${
            collapsed ? "justify-center px-2" : "px-7"
          }`}
        >
          <Logo
            variant={collapsed ? "icon" : "full"}
            width={collapsed ? 42 : 150}
            height={44}
            priority
          />
        </div>

        {/* Infos Organisation */}
        <div
          className={`mx-5 mb-4 border-b border-white/10 pb-5 transition-all ${
            collapsed ? "hidden opacity-0" : "block opacity-100"
          }`}
        >
          <p className="truncate text-[13px] font-black">{organization.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
            {role}
          </p>
        </div>
        
        {/* Indicateur minimaliste d'organisation quand réduit */}
        {collapsed && (
          <div className="mx-auto mb-4 h-px w-8 bg-white/10" />
        )}

        {/* Navigation */}
        <nav
          aria-label="Navigation principale"
          className="flex-1 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          <div className="space-y-1.5">
            {navigation.map(({ href, label, icon: Icon }) => {
              const target = href ? `${base}/${href}` : base;
              const active = href
                ? pathname === target || pathname.startsWith(`${target}/`)
                : pathname === base;

              return (
                <Link
                  key={href || "home"}
                  href={target}
                  title={collapsed ? label : undefined}
                  className={`flex h-11 items-center rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                    collapsed ? "mx-auto w-11 justify-center px-0" : "gap-3.5 px-4"
                  } ${
                    active
                      ? "bg-white font-bold text-[#173b68] shadow-md"
                      : "font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    className="shrink-0"
                  />
                  {!collapsed && (
                    <span className="truncate text-[13px]">{label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Espace Utilisateur & Déconnexion */}
        <div className="shrink-0 p-4">
          <div
            className={`mb-3 flex items-center rounded-2xl border border-white/10 bg-white/5 p-3 transition-all ${
              collapsed ? "justify-center" : "gap-3.5"
            }`}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-[13px] font-black text-white shadow-inner">
              {user.name.trim().charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">
                  {user.name}
                </p>
                <p className="truncate text-[10px] font-medium text-white/50">
                  {user.email}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            aria-label="Déconnexion"
            className={`flex h-11 w-full items-center rounded-2xl text-[13px] font-semibold text-white/70 transition-all hover:bg-red-500/20 hover:text-red-200 active:scale-95 ${
              collapsed ? "justify-center" : "gap-3 px-4"
            }`}
          >
            <LogOut size={18} strokeWidth={2.5} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col h-dvh overflow-y-auto p-4 md:p-8 lg:p-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#173b68]/70">
              Imprim’Brain · Espace CT
            </p>
            <h1 className="mt-1 text-lg font-black text-slate-900">
              {organization.name}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold text-slate-900">
              {user.name}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {role}
            </p>
          </div>
        </header>
        
        {children}
      </main>
      <CTOnboardingModal />
    </div>
  );
}