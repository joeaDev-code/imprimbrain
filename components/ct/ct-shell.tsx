"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  UserPlus,
  PackagePlus,
  Receipt,
  Boxes,
  User,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { filterCTNavigation } from "@/components/ct/navigation";
import { useCTStore } from "@/components/ct/ct-provider";
import { CTOnboardingModal } from "@/components/ct/ct-onboarding-modal";

export function CTShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const role = useCTStore((state) => state.role);
  const user = useCTStore((state) => state.user);
  const organization = useCTStore((state) => state.organization);
  const permissions = useCTStore((state) => state.permissions);
  const collapsed = useCTStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useCTStore((state) => state.toggleSidebar);
  const clearAuth = useCTStore((state) => state.clearAuth);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigation = filterCTNavigation(permissions);
  const base = `/ct/${role.toLowerCase()}`;

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    clearAuth();
    router.replace("/login");
    router.refresh();
  }

  const quickActions = [
    {
      href: `${base}/prestations/nouveau`,
      label: "Prestation",
      icon: Plus,
      primary: true,
    },
    {
      href: `${base}/clients`,
      label: "Client",
      icon: UserPlus,
    },
    {
      href: `${base}/services`,
      label: "Service",
      icon: PackagePlus,
    },
    {
      href: `${base}/depenses`,
      label: "Dépense",
      icon: Receipt,
    },
    {
      href: `${base}/stock`,
      label: "Stock",
      icon: Boxes,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================================================
          SIDEBAR MOBILE
      ========================================================= */}

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col bg-[#173b68] text-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
        aria-label="Navigation mobile"
      >
        {/* Header mobile */}
        <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Logo
            variant="full"
            width={150}
            height={44}
            priority
          />

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="grid size-9 place-items-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Organisation */}
        <div className="mx-5 border-b border-white/10 py-5">
          <p className="truncate text-[13px] font-black">
            {organization.name}
          </p>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
            {role}
          </p>
        </div>

        {/* Navigation mobile */}
        <nav
          aria-label="Navigation mobile"
          className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          <div className="space-y-1.5">
            {navigation.map(
              ({ href, label, icon: Icon }) => {
                const target = href
                  ? `${base}/${href}`
                  : base;

                const active = href
                  ? pathname === target ||
                    pathname.startsWith(`${target}/`)
                  : pathname === base;

                return (
                  <Link
                    key={href || "home"}
                    href={target}
                    onClick={() =>
                      setMobileSidebarOpen(false)
                    }
                    className={`flex h-11 items-center gap-3.5 rounded-2xl px-4 transition-all duration-200 active:scale-[0.98] ${
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

                    <span className="truncate text-[13px]">
                      {label}
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        </nav>

        {/* Utilisateur */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <Link
            href={`${base}/profil`}
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="mb-3 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
          >
            <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10">
              <User size={18} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white">
                {user.name}
              </p>

              <p className="truncate text-[10px] font-medium text-white/50">
                {user.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-[13px] font-semibold text-white/70 transition-all hover:bg-red-500/20 hover:text-red-200 active:scale-95"
          >
            <LogOut
              size={18}
              strokeWidth={2.5}
            />

            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          SIDEBAR DESKTOP
      ========================================================= */}

      <aside
        className={`group fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col bg-[#173b68] text-white shadow-2xl transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        {/* Bouton réduction */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed
              ? "Déployer la navigation"
              : "Réduire la navigation"
          }
          className="absolute -right-3.5 top-9 z-50 flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:border-[#173b68] hover:text-[#173b68]"
        >
          {collapsed ? (
            <ChevronRight
              size={14}
              strokeWidth={3}
            />
          ) : (
            <ChevronLeft
              size={14}
              strokeWidth={3}
            />
          )}
        </button>

        {/* Logo */}
        <div
          className={`flex h-[88px] shrink-0 items-center transition-all ${
            collapsed
              ? "justify-center px-2"
              : "px-7"
          }`}
        >
          <Logo
            variant={collapsed ? "icon" : "full"}
            width={collapsed ? 42 : 150}
            height={44}
            priority
          />
        </div>

        {/* Organisation */}
        <div
          className={`mx-5 mb-4 border-b border-white/10 pb-5 transition-all ${
            collapsed
              ? "hidden opacity-0"
              : "block opacity-100"
          }`}
        >
          <p className="truncate text-[13px] font-black">
            {organization.name}
          </p>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
            {role}
          </p>
        </div>

        {collapsed && (
          <div className="mx-auto mb-4 h-px w-8 bg-white/10" />
        )}

        {/* Navigation */}
        <nav
          aria-label="Navigation principale"
          className="flex-1 overflow-y-auto px-4 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          <div className="space-y-1.5">
            {navigation.map(
              ({ href, label, icon: Icon }) => {
                const target = href
                  ? `${base}/${href}`
                  : base;

                const active = href
                  ? pathname === target ||
                    pathname.startsWith(`${target}/`)
                  : pathname === base;

                return (
                  <Link
                    key={href || "home"}
                    href={target}
                    title={
                      collapsed
                        ? label
                        : undefined
                    }
                    className={`flex h-11 items-center rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                      collapsed
                        ? "mx-auto w-11 justify-center px-0"
                        : "gap-3.5 px-4"
                    } ${
                      active
                        ? "bg-white font-bold text-[#173b68] shadow-md"
                        : "font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={
                        active ? 2.5 : 2
                      }
                      className="shrink-0"
                    />

                    {!collapsed && (
                      <span className="truncate text-[13px]">
                        {label}
                      </span>
                    )}
                  </Link>
                );
              },
            )}
          </div>
        </nav>

        {/* Utilisateur */}
        <div className="shrink-0 p-4">
          <Link
            href={`${base}/profil`}
            className={`mb-3 flex items-center rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10 ${
              collapsed
                ? "justify-center"
                : "gap-3.5"
            }`}
          >
            <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/10">
              <User size={18} />
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
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Déconnexion"
            className={`flex h-11 w-full items-center rounded-2xl text-[13px] font-semibold text-white/70 transition-all hover:bg-red-500/20 hover:text-red-200 active:scale-95 ${
              collapsed
                ? "justify-center"
                : "gap-3 px-4"
            }`}
          >
            <LogOut
              size={18}
              strokeWidth={2.5}
            />

            {!collapsed && (
              <span>Déconnexion</span>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================
          CONTENU
      ========================================================= */}

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed
            ? "md:pl-[88px]"
            : "md:pl-[280px]"
        }`}
      >
        {/* =======================================================
            HEADER GLOBAL
        ======================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-50/95 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#173b68]/30 to-transparent" />

          <div className="relative px-4 py-3 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              {/* Logo mobile */}
              <div className="flex items-center md:hidden">
                <Logo
                  variant="full"
                  width={120}
                  height={36}
                  priority
                />
              </div>

              {/* Actions rapides */}
              <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {quickActions.map(
                  ({
                    href,
                    label,
                    icon: Icon,
                    primary,
                  }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-bold transition-all active:scale-95 ${
                        primary
                          ? "bg-[#173b68] text-white shadow-sm hover:bg-[#122f54]"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </Link>
                  ),
                )}
              </div>

              {/* Actions compte */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Notifications */}
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <Bell size={18} />

                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-transparent" />
                </button>

                {/* Profil */}
                <Link
                  href={`${base}/profil`}
                  className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:border-slate-300 hover:bg-slate-100 sm:size-auto sm:gap-2 sm:px-2"
                >
                  <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-white">
                    {user.name
                      ?.trim()
                      .charAt(0)
                      .toUpperCase() || "U"}
                  </div>

                  <div className="hidden max-w-[130px] text-left sm:block">
                    <p className="truncate text-[11px] font-bold text-slate-800">
                      {user.name}
                    </p>

                    <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      {role}
                    </p>
                  </div>
                </Link>

                {/* Déconnexion */}
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Déconnexion"
                  className="hidden size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 sm:grid"
                >
                  <LogOut size={18} />
                </button>

                {/* Menu mobile */}
                <button
                  type="button"
                  onClick={() =>
                    setMobileSidebarOpen(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    mobileSidebarOpen
                      ? "Fermer le menu"
                      : "Ouvrir le menu"
                  }
                  aria-expanded={mobileSidebarOpen}
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 active:scale-95 md:hidden"
                >
                  {mobileSidebarOpen ? (
                    <X size={19} />
                  ) : (
                    <Menu size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Actions rapides mobile */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 md:hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {quickActions.map(
                ({
                  href,
                  label,
                  icon: Icon,
                  primary,
                }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[10px] font-bold ${
                      primary
                        ? "bg-[#173b68] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </header>

        {/* =======================================================
            MAIN
        ======================================================= */}

        <main className="min-w-0 p-4 md:p-8 lg:p-10">
          {children}
        </main>
      </div>

      <CTOnboardingModal />
    </div>
  );
}