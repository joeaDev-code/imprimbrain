"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Settings,
  LogOut,
  Plus,
  UserPlus,
  PackagePlus,
  Receipt,
  Boxes,
  Sparkles,
} from "lucide-react";
import type { CTRole } from "@/lib/ct-access";
import { ctPath } from "@/lib/ct-paths";

export type UserType = {
  name?: string;
  email?: string;
  role?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  user?: UserType;
  ctRole: CTRole;
};

const quickActions = [
  {
    path: "/prestations/nouveau",
    label: "Prestation",
    icon: Plus,
    primary: true,
  },
  {
    path: "/clients",
    label: "Client",
    icon: UserPlus,
  },
  {
    path: "/services",
    label: "Service",
    icon: PackagePlus,
  },
  {
    path: "/depenses",
    label: "Dépense",
    icon: Receipt,
  },
  {
    path: "/stock",
    label: "Stock",
    icon: Boxes,
  },
] as const;

export function PageHeader({
  title,
  subtitle,
  action,
  user,
  ctRole,
}: PageHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isSettings = pathname.includes("/parametres");
  const isProfile = pathname.includes("/profil");

  function buildPath(path: string) {
    return ctPath(ctRole, path);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  const profileHref = ctPath(ctRole, "/profil");

  const settingsHref = buildPath("/parametres");

  return (
    <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all md:p-6">
      {/* Barre supérieure : Actions rapides + Utilisateur */}
      <div className="flex flex-col-reverse justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center">
        {/* Actions rapides */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {quickActions.map((item) => {
            const { label, icon: Icon } = item;
            const href = buildPath(item.path);
            const primary = "primary" in item && item.primary;

            return (
              <Link
                key={href}
                href={href}
                className={[
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-semibold transition-all duration-200 active:scale-95",
                  primary
                    ? "bg-[#173b68] text-white shadow-md shadow-[#173b68]/20 hover:bg-[#122f54]"
                    : "border border-slate-200/80 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
                ].join(" ")}
              >
                <Icon size={16} strokeWidth={primary ? 2.2 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}

          {action && (
            <div className="ml-1 shrink-0 border-l border-slate-200 pl-3">
              {action}
            </div>
          )}
        </div>

        {/* Profil & Actions compte */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          {/* Profil */}
          <Link
            href={profileHref}
            title="Voir le profil"
            className={[
              "flex h-10 items-center gap-2.5 rounded-2xl border px-3 transition-all duration-200 active:scale-95",
              isProfile
                ? "border-[#173b68]/30 bg-[#173b68]/10"
                : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100",
            ].join(" ")}
          >
            <div className="grid size-7 place-items-center rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-[10px] font-black text-white shadow-sm">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-[11px] font-bold leading-tight text-slate-800">
                {user?.name || "Administrateur"}
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {user?.role || "ADMIN"}
              </p>
            </div>
          </Link>

          {/* Paramètres */}
          <Link
            href={settingsHref}
            title="Paramètres"
            className={[
              "grid size-10 place-items-center rounded-2xl border transition-all duration-200 active:scale-95",
              isSettings
                ? "border-[#173b68] bg-[#173b68] text-white shadow-sm"
                : "border-slate-200/80 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            <Settings size={18} />
          </Link>

          {/* Déconnexion */}
          <button
            type="button"
            onClick={logout}
            title="Déconnexion"
            className="grid size-10 place-items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Section Titre & Sous-titre */}
      <div className="pt-4">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#173b68]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#173b68]">
            <Sparkles size={11} className="text-[#173b68]" />
            Imprim&apos;Brain
          </span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-slate-500 md:text-sm">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
