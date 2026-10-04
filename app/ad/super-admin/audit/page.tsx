"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clipboard,
  Clock3,
  Database,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { superAdminApi } from "@/lib/super-admin-api";
import {
  ErrorBox,
  Loading,
  PageTitle,
  useApi,
} from "@/components/super-admin/ui";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name?: string | null) {
  const value = (name || "Système").trim();

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "SY"
  );
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    ORGANIZATION_CREATED: "Organisation créée",
    ORGANIZATION_UPDATED: "Organisation modifiée",
    ORGANIZATION_DELETED: "Organisation supprimée",
    USER_CREATED: "Utilisateur créé",
    USER_UPDATED: "Utilisateur modifié",
    USER_DELETED: "Utilisateur supprimé",
    LOGIN: "Connexion",
    LOGOUT: "Déconnexion",
  };

  return labels[action] ?? action;
}

function actionBadge(action: string) {
  const value = action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("supprim") ||
    value.includes("revoke")
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (
    value.includes("create") ||
    value.includes("cré") ||
    value.includes("add")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (
    value.includes("update") ||
    value.includes("modif") ||
    value.includes("edit")
  ) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (
    value.includes("login") ||
    value.includes("connexion") ||
    value.includes("auth")
  ) {
    return "bg-violet-50 text-violet-700 ring-violet-200";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Audit() {
  const { data, error, loading, reload } = useApi(superAdminApi.audit);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [organizationFilter, setOrganizationFilter] = useState("ALL");
  const [copied, setCopied] = useState<string | null>(null);

  const logs = data ?? [];

  const actionOptions = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.action)),
    ).sort();
  }, [logs]);

  const organizationOptions = useMemo(() => {
    const organizations = logs
      .map((log) => log.organization?.name)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(organizations)).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.action.toLowerCase().includes(query) ||
        log.user?.name?.toLowerCase().includes(query) ||
        log.organization?.name?.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query);

      const matchesAction =
        actionFilter === "ALL" || log.action === actionFilter;

      const matchesOrganization =
        organizationFilter === "ALL" ||
        (log.organization?.name ?? "Plateforme") ===
          organizationFilter;

      return (
        matchesSearch &&
        matchesAction &&
        matchesOrganization
      );
    });
  }, [logs, search, actionFilter, organizationFilter]);

  const stats = useMemo(() => {
    const organizations = new Set(
      logs
        .map((log) => log.organization?.name)
        .filter(Boolean),
    );

    const users = new Set(
      logs.map((log) => log.user?.name).filter(Boolean),
    );

    const today = new Date();

    const todayCount = logs.filter((log) => {
      const date = new Date(log.createdAt);

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length;

    return {
      total: logs.length,
      today: todayCount,
      users: users.size,
      organizations: organizations.size,
    };
  }, [logs]);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);

      setCopied(id);

      window.setTimeout(() => {
        setCopied(null);
      }, 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  function resetFilters() {
    setSearch("");
    setActionFilter("ALL");
    setOrganizationFilter("ALL");
  }

  if (loading) return <Loading />;

  if (error) {
    return <ErrorBox message={error} retry={reload} />;
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Journal d’audit"
        description="Traçabilité des opérations d’administration et des activités de la plateforme."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Événements"
          value={stats.total}
          icon={Activity}
          description="Actions enregistrées"
        />

        <StatCard
          label="Aujourd’hui"
          value={stats.today}
          icon={Clock3}
          description="Activités du jour"
        />

        <StatCard
          label="Utilisateurs"
          value={stats.users}
          icon={UserRound}
          description="Acteurs enregistrés"
        />

        <StatCard
          label="Organisations"
          value={stats.organizations}
          icon={Database}
          description="Organisations concernées"
        />
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher une action, un utilisateur..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <select
                  value={actionFilter}
                  onChange={(event) =>
                    setActionFilter(event.target.value)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:w-52"
                >
                  <option value="ALL">Toutes les actions</option>

                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {actionLabel(action)}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={organizationFilter}
                  onChange={(event) =>
                    setOrganizationFilter(event.target.value)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:w-52"
                >
                  <option value="ALL">
                    Toutes les organisations
                  </option>

                  {organizationOptions.map((organization) => (
                    <option
                      key={organization}
                      value={organization}
                    >
                      {organization}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={reload}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          </div>

          {(search ||
            actionFilter !== "ALL" ||
            organizationFilter !== "ALL") && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />

                <span>
                  {filteredLogs.length} résultat
                  {filteredLogs.length > 1 ? "s" : ""} trouvé
                  {filteredLogs.length > 1 ? "s" : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-cyan-600 transition hover:text-cyan-700"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Empty state */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileSearch className="h-6 w-6" />
          </div>

          <h2 className="mt-4 font-semibold text-slate-900">
            {logs.length === 0
              ? "Aucune activité enregistrée"
              : "Aucun résultat"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {logs.length === 0
              ? "Les opérations d’administration apparaîtront ici lorsqu’elles seront enregistrées."
              : "Aucune activité ne correspond aux critères de recherche sélectionnés."}
          </p>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />

                  <h2 className="font-semibold text-slate-900">
                    Activité de la plateforme
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredLogs.length} événement
                  {filteredLogs.length > 1 ? "s" : ""} affiché
                  {filteredLogs.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Journal actif
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Utilisateur</th>
                  <th className="px-5 py-4">Organisation</th>
                  <th className="px-5 py-4 text-right">
                    Référence
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionBadge(
                          log.action,
                        )}`}
                      >
                        {actionLabel(log.action)}
                      </span>

                      {actionLabel(log.action) !== log.action && (
                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                          {log.action}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-600">
                          {getInitials(log.user?.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {log.user?.name ?? "Système"}
                          </p>

                          <p className="text-xs text-slate-400">
                            {log.user
                              ? "Utilisateur"
                              : "Action système"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {log.organization?.name ? (
                        <div>
                          <p className="font-medium text-slate-700">
                            {log.organization.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            Organisation
                          </p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Plateforme
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => copyId(log.id)}
                        className="group inline-flex max-w-32 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        title="Copier l'identifiant"
                      >
                        <span className="truncate">
                          {log.id}
                        </span>

                        {copied === log.id ? (
                          <Clipboard className="h-3 w-3 shrink-0 text-emerald-500" />
                        ) : (
                          <Clipboard className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredLogs.map((log) => (
              <article
                key={log.id}
                className="p-4 transition hover:bg-slate-50/60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Activity className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionBadge(
                          log.action,
                        )}`}
                      >
                        {actionLabel(log.action)}
                      </span>

                      <span className="shrink-0 text-[11px] text-slate-400">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        }).format(new Date(log.createdAt))}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-600">
                          {getInitials(log.user?.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700">
                            {log.user?.name ?? "Système"}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            {log.organization?.name ?? "Plateforme"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(log.createdAt)}
                        </div>

                        <button
                          type="button"
                          onClick={() => copyId(log.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-400"
                        >
                          {copied === log.id ? (
                            <>
                              <Clipboard className="h-3 w-3 text-emerald-500" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Clipboard className="h-3 w-3" />
                              ID
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              Affichage de{" "}
              <span className="font-semibold text-slate-600">
                {filteredLogs.length}
              </span>{" "}
              événement
              {filteredLogs.length > 1 ? "s" : ""} sur{" "}
              <span className="font-semibold text-slate-600">
                {logs.length}
              </span>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}