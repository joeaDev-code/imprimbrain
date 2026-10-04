"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Users,
  X,
} from "lucide-react";

// Importation du logo
import Logo from "@/components/ui/Logo";

const items = [
  ["/ad/super-admin", "Tableau de bord", LayoutDashboard],
  ["/ad/super-admin/organisations", "Organisations", Building2],
  ["/ad/super-admin/utilisateurs", "Utilisateurs", Users],
  ["/ad/super-admin/paiements", "Paiements", CreditCard],
  ["/ad/super-admin/abonnements", "Abonnements", CalendarClock],
  ["/ad/super-admin/audit", "Journal d’audit", ScrollText],
] as const;

type SuperAdminIdentity = { name: string; email: string; role: string };

export function SuperAdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SuperAdminIdentity;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0b1f3a] text-white shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* En-tête Sidebar avec Logo */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/ad/super-admin"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <Logo className="h-8 w-auto text-white" />
            <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
              Super Admin
            </span>
          </Link>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Navigation Super Admin"
          className="flex-1 space-y-1.5 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {items.map(([href, label, Icon]) => {
            const active =
              pathname === href ||
              (href !== "/ad/super-admin" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex h-11 items-center gap-3.5 rounded-2xl px-4 text-[13px] transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-cyan-500 font-bold text-white shadow-md shadow-cyan-500/25"
                    : "font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.5 : 2}
                  className="shrink-0"
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profil & Déconnexion */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-white shadow-inner">
              {user.name.trim().charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-white">
                {user.name}
              </p>
              <p className="truncate text-[10px] font-medium text-white/50">
                {user.email}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                {user.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-[13px] font-semibold text-slate-300 transition-all hover:bg-red-500/20 hover:text-red-200 active:scale-95"
          >
            <LogOut size={18} strokeWidth={2.5} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col md:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            <div className="text-sm font-black tracking-tight text-slate-900 md:text-base">
              Administration de la plateforme
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Super Admin Active
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}