"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { CTRole } from "@/lib/ct-access";

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

export function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all md:p-6">
      {/* Section Titre & Sous-titre */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#173b68]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#173b68]">
            <Sparkles size={11} className="text-[#173b68]" />
            Imprim&apos;Brain
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-slate-500 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}