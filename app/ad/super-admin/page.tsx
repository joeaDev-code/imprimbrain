"use client";

import {
  Activity,
  ArrowUpRight,
  Building2,
  CreditCard,
  CalendarClock,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { superAdminApi } from "@/lib/super-admin-api";
import {
  ErrorBox,
  PageTitle,
  useApi,
} from "@/components/super-admin/ui";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  description: string;
  accent: {
    bg: string;
    text: string;
    hoverBg: string;
  };
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="flex items-center justify-between gap-4">
        <div
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accent.bg} ${accent.text} transition-all duration-300 group-hover:scale-110 ${accent.hoverBg}`}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>

        <div className="grid size-8 place-items-center rounded-xl border border-slate-100 bg-slate-50/80 text-slate-400 transition-colors group-hover:border-cyan-100 group-hover:bg-cyan-50 group-hover:text-cyan-600">
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          {formatNumber(value)}
        </p>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function PlatformOverview({
  organizations,
  users,
  payments,
}: {
  organizations: number;
  users: number;
  payments: number;
}) {
  const total = organizations + users + payments;

  const items = [
    {
      label: "Organisations",
      value: organizations,
      color: "bg-cyan-500",
      lightBg: "bg-cyan-500/10",
    },
    {
      label: "Utilisateurs",
      value: users,
      color: "bg-blue-500",
      lightBg: "bg-blue-500/10",
    },
    {
      label: "Paiements",
      value: payments,
      color: "bg-violet-500",
      lightBg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Vue de la plateforme
            </h2>
            <p className="text-xs font-medium text-slate-400">
              Répartition globale des entités enregistrées
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          {items.map((item) => {
            const percentage =
              total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.label} className="group">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2.5 rounded-full ${item.color} ring-4 ring-slate-50`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {formatNumber(item.value)}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlatformHealth({ organizations, users, payments, activeSubscriptions, expiringSoon, expiredSubscriptions }: { organizations: number; users: number; payments: number; activeSubscriptions: number; expiringSoon: number; expiredSubscriptions: number; }) {
  const indicators = [
    { label: "Organisations enregistrées", value: organizations, icon: Building2 },
    { label: "Utilisateurs enregistrés", value: users, icon: Users },
    { label: "Paiements enregistrés", value: payments, icon: CreditCard },
    { label: "Abonnements actifs", value: activeSubscriptions, icon: CalendarClock },
    { label: "Expirations sous 7 jours", value: expiringSoon, icon: AlertTriangle },
    { label: "Abonnements expirés", value: expiredSubscriptions, icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600"><ShieldCheck size={20} strokeWidth={2.5}/></div><div><h2 className="text-base font-bold text-slate-900">État de la plateforme</h2><p className="text-xs font-medium text-slate-400">Données calculées par l’API Super Admin</p></div></div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500 animate-pulse"/>API connectée</span>
        </div>
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {indicators.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3"><div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm border border-slate-200/60"><Icon size={17}/></div><span className="truncate text-xs font-bold text-slate-700">{label}</span></div><span className="shrink-0 rounded-xl bg-white px-2.5 py-1 text-xs font-black text-slate-900 border border-slate-200/60">{formatNumber(value)}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-2xl bg-slate-200" />
        <div className="h-4 w-80 rounded-xl bg-slate-100" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-3xl border border-slate-200/80 bg-white"
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl border border-slate-200/80 bg-white" />
        <div className="h-72 rounded-3xl border border-slate-200/80 bg-white" />
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data, error, loading, reload } = useApi(superAdminApi.dashboard);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorBox message={error} retry={reload} />;
  }

  if (!data) {
    return (
      <ErrorBox
        message="Aucune donnée de tableau de bord disponible."
        retry={reload}
      />
    );
  }

  const organizations = Number(data.organizations ?? 0);
  const users = Number(data.users ?? 0);
  const payments = Number(data.payments ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Tableau de bord"
          description="Vue globale et métriques de la plateforme Imprim’Brain."
        />

        <button
          type="button"
          onClick={reload}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50/50 hover:text-cyan-600 active:scale-95"
        >
          <RefreshCw
            size={15}
            strokeWidth={2.5}
            className="transition-transform duration-500 group-hover:rotate-180 text-slate-400 group-hover:text-cyan-600"
          />
          <span>Actualiser les données</span>
        </button>
      </div>

      {/* Cartes de métriques clés */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Organisations"
          value={organizations}
          icon={Building2}
          description="Organisations enregistrées"
          accent={{
            bg: "bg-cyan-50",
            text: "text-cyan-600",
            hoverBg: "group-hover:bg-cyan-600 group-hover:text-white",
          }}
        />

        <StatCard
          label="Utilisateurs"
          value={users}
          icon={Users}
          description="Comptes utilisateurs actifs"
          accent={{
            bg: "bg-blue-50",
            text: "text-blue-600",
            hoverBg: "group-hover:bg-blue-600 group-hover:text-white",
          }}
        />

        <StatCard
          label="Paiements"
          value={payments}
          icon={CreditCard}
          description="Transactions enregistrées"
          accent={{
            bg: "bg-violet-50",
            text: "text-violet-600",
            hoverBg: "group-hover:bg-violet-600 group-hover:text-white",
          }}
        />
      </section>

      {/* Graphiques / Vues d'ensemble */}
      <section className="grid gap-6 lg:grid-cols-2">
        <PlatformOverview
          organizations={organizations}
          users={users}
          payments={payments}
        />

        <PlatformHealth
          organizations={organizations}
          users={users}
          payments={payments}
          activeSubscriptions={Number(data.activeSubscriptions ?? 0)}
          expiringSoon={Number(data.expiringSoon ?? 0)}
          expiredSubscriptions={Number(data.expiredSubscriptions ?? 0)}
        />
      </section>

      {/* Synchronisation API en direct */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Données en temps réel
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              Dernière mise à jour effectuée via le point de terminaison Super Admin.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/60 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-700">
            <span className="size-2 rounded-full bg-cyan-500 animate-ping" />
            Flux de données actif
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Organisations", organizations],
            ["Utilisateurs", users],
            ["Paiements", payments],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {formatNumber(Number(value))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}