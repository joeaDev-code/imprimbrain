"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Users,
  Boxes,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/prestations/nouveau", label: "Nouvelle", icon: Plus, isPrimary: true },
  { href: "/admin/stock", label: "Stock", icon: Boxes },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 inset-x-4 z-40 md:hidden">
      <div className="flex items-center justify-around rounded-3xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
        {navItems.map(({ href, label, icon: Icon, isPrimary }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(href + "/");

          if (isPrimary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="grid size-12 place-items-center rounded-full bg-[#173b68] text-white shadow-lg shadow-[#173b68]/30 ring-4 ring-white transition-transform active:scale-90">
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <span className="mt-1 text-[10px] font-bold text-[#173b68]">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 active:scale-95",
                active
                  ? "font-bold text-[#173b68]"
                  : "font-medium text-slate-400 hover:text-slate-600",
              ].join(" ")}
            >
              <div
                className={[
                  "grid size-8 place-items-center rounded-2xl transition-all",
                  active ? "bg-[#173b68]/10 text-[#173b68]" : "bg-transparent",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}