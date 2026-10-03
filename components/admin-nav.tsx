"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Tags,
  Package,
  Receipt,
  Boxes,
  Settings,
  LogOut,
  UserCog,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/ui/Logo";

const items = [
  ["/admin", "Tableau de bord", LayoutDashboard],
  ["/admin/prestations", "Prestations", Package],
  ["/admin/clients", "Clients", Users],
  ["/admin/services", "Services", Tags],
  ["/admin/depenses", "Dépenses", Receipt],
  ["/admin/stock", "Stock", Boxes],
  ["/admin/employes", "Employés", UserCog],
  ["/admin/audit", "Journal", ShieldCheck],
  ["/admin/parametres", "Paramètres", Settings],
] as const;

export function AdminNav({ user }: { user: any }) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={[
        "relative hidden md:flex sticky top-0 h-dvh shrink-0 flex-col select-none",
        "bg-[#173b68] text-white overflow-x-hidden",
        "border-r border-white/10 shadow-2xl",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[80px]" : "w-[260px]",
      ].join(" ")}
    >
      {/* Header / Logo */}
      <div
        className={[
          "flex h-[88px] items-center shrink-0 transition-all duration-300",
          collapsed ? "justify-center px-2" : "px-6",
        ].join(" ")}
      >
        <div className="flex items-center justify-center">
          {collapsed ? (
            <Logo
              variant="icon"
              width={40}
              height={40}
              priority
            />
          ) : (
            <Logo
              variant="full"
              width={150}
              height={44}
              priority
            />
          )}
        </div>
      </div>

      {/* Navigation - Sans aucune scrollbar visible */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        <div className="space-y-2">
          {items.map(([href, label, Icon]) => {
            const active =
              href === "/admin"
                ? path === "/admin"
                : path === href || path.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={[
                  "group relative flex h-11 items-center rounded-2xl font-medium",
                  "transition-all duration-200 ease-out",
                  collapsed
                    ? "justify-center px-0 w-11 mx-auto"
                    : "gap-3.5 px-4",
                  active
                    ? "bg-white text-[#173b68] font-bold shadow-lg shadow-black/10 scale-[1.02]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                />

                {!collapsed && (
                  <span className="truncate text-[13px] tracking-wide">
                    {label}
                  </span>
                )}

                {/* Tooltip au survol en mode réduit */}
                {collapsed && (
                  <span
                    className={[
                      "pointer-events-none absolute left-[calc(100%+14px)] z-50",
                      "whitespace-nowrap rounded-xl bg-[#0f294a] border border-white/10",
                      "px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xl",
                      "opacity-0 -translate-x-2 transition-all duration-200",
                      "group-hover:opacity-100 group-hover:translate-x-0",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Section Utilisateur et Déconnexion */}
      <div className="shrink-0 p-3.5 space-y-2">
        {/* Card Profil */}
        <div
          className={[
            "flex items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-all duration-300",
            collapsed ? "justify-center p-2.5" : "gap-3 p-3",
          ].join(" ")}
        >
          <div className="relative flex shrink-0">
            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-tr from-cyan-400 via-blue-400 to-indigo-500 text-[12px] font-extrabold text-white shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#173b68]" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-bold text-white tracking-wide">
                {user?.name ?? "Administrateur"}
              </div>
              <div className="truncate text-[10px] font-medium text-white/60">
                {user?.role ?? "ADMINISTRATEUR"}
              </div>
            </div>
          )}
        </div>

        {/* Bouton Déconnexion */}
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Déconnexion" : undefined}
          className={[
            "flex h-11 w-full items-center rounded-2xl font-semibold",
            "text-white/70 transition-all duration-200",
            "hover:bg-red-500/20 hover:text-red-200 active:scale-[0.98]",
            collapsed ? "justify-center" : "gap-3 px-4",
          ].join(" ")}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-[12px]">Déconnexion</span>}
        </button>
      </div>

      {/* Bouton pour Réduire/Agrandir */}
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        className={[
          "absolute right-[-14px] top-10 z-30",
          "grid size-7 place-items-center rounded-full",
          "border border-white/20 bg-[#173b68] text-white shadow-lg",
          "transition-all duration-200 hover:scale-110 hover:bg-white hover:text-[#173b68]",
        ].join(" ")}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </aside>
  );
}