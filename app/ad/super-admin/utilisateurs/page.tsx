"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Copy,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { superAdminApi } from "@/lib/super-admin-api";
import {
  ErrorBox,
  Loading,
  PageTitle,
  useApi,
} from "@/components/super-admin/ui";

function getInitials(name?: string | null) {
  const value = (name || "Utilisateur").trim();

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrateur",
    OFFICER: "Opérateur",
    SECRETARY: "Secrétaire",
    USER: "Utilisateur",
  };

  return labels[role] ?? role;
}

function roleBadge(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-violet-50 text-violet-700 ring-violet-200";

    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "OFFICER":
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";

    case "SECRETARY":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
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

export default function Users() {
  const { data, error, loading, reload } = useApi(superAdminApi.users);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copied, setCopied] = useState<string | null>(null);

  const users = data ?? [];

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" || user.platformRole === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "INACTIVE" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    const admins = users.filter(
      (user) =>
        user.platformRole === "ADMIN" ||
        user.platformRole === "SUPER_ADMIN",
    ).length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      admins,
    };
  }, [users]);

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);

      window.setTimeout(() => {
        setCopied(null);
      }, 1500);
    } catch {
      // Clipboard unavailable.
    }
  }

  if (loading) return <Loading />;

  if (error) {
    return <ErrorBox message={error} retry={reload} />;
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Utilisateurs"
        description="Gérez et consultez les comptes présents sur la plateforme."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={UsersRound}
          description="Comptes enregistrés"
        />

        <StatCard
          label="Actifs"
          value={stats.active}
          icon={CheckCircle2}
          description="Comptes actuellement actifs"
        />

        <StatCard
          label="Inactifs"
          value={stats.inactive}
          icon={XCircle}
          description="Comptes désactivés"
        />

        <StatCard
          label="Administrateurs"
          value={stats.admins}
          icon={ShieldCheck}
          description="Accès administratifs"
        />
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:w-48"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Administrateur</option>
                <option value="OFFICER">Opérateur</option>
                <option value="SECRETARY">Secrétaire</option>
                <option value="USER">Utilisateur</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:w-44"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actifs</option>
                <option value="INACTIVE">Inactifs</option>
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
      </section>

      {/* Results */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserRound className="h-6 w-6" />
          </div>

          <h2 className="mt-4 font-semibold text-slate-900">
            {users.length === 0
              ? "Aucun utilisateur"
              : "Aucun résultat"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {users.length === 0
              ? "Aucun compte utilisateur n'est actuellement disponible sur la plateforme."
              : "Aucun utilisateur ne correspond aux critères de recherche sélectionnés."}
          </p>

          {users.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Desktop header */}
          <div className="hidden border-b border-slate-200 px-5 py-4 md:block">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Comptes utilisateurs
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {filteredUsers.length} résultat
                  {filteredUsers.length > 1 ? "s" : ""}
                  {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                    ? " correspondant aux filtres"
                    : ""}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                <Activity className="h-3.5 w-3.5" />
                Données en temps réel
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">Utilisateur</th>
                  <th className="px-5 py-4">Rôle</th>
                  <th className="px-5 py-4">Organisation</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4">Création</th>
                  <th className="px-5 py-4 text-right">ID</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-xs font-bold text-cyan-700">
                          {getInitials(user.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {user.name || "Utilisateur sans nom"}
                          </p>

                          <button
                            type="button"
                            onClick={() => copyEmail(user.email)}
                            className="group mt-0.5 flex max-w-full items-center gap-1 text-xs text-slate-400 transition hover:text-cyan-600"
                            title="Copier l'adresse e-mail"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {user.email}
                            </span>

                            {copied === user.email ? (
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadge(
                          user.platformRole,
                        )}`}
                      >
                        {roleLabel(user.platformRole)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {user.organization ? (
                        <div>
                          <p className="font-medium text-slate-700">{user.organization.name}</p>
                          <p className="text-xs text-slate-400">{user.organization.slug}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Plateforme</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {user.mustChangePassword ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600"><span className="h-2 w-2 rounded-full bg-amber-500" />Mot de passe à changer</span>
                      ) : user.isActive ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-slate-300" />
                          Inactif
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-block max-w-32 truncate rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-[10px] text-slate-400"
                        title={user.id}
                      >
                        {user.id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="p-4 transition hover:bg-slate-50/70"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-xs font-bold text-cyan-700">
                    {getInitials(user.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {user.name || "Utilisateur sans nom"}
                        </h3>

                        <button
                          type="button"
                          onClick={() => copyEmail(user.email)}
                          className="mt-1 flex max-w-full items-center gap-1 text-xs text-slate-400"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />

                          <span className="truncate">
                            {user.email}
                          </span>
                        </button>
                      </div>

                      {user.mustChangePassword ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600"><span className="h-2 w-2 rounded-full bg-amber-500" />Mot de passe à changer</span>
                      ) : user.isActive ? (
                        <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                      ) : (
                        <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleBadge(
                          user.platformRole,
                        )}`}
                      >
                        {roleLabel(user.platformRole)}
                      </span>

                      {user.mustChangePassword && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Mot de passe à changer</span>}

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(user.createdAt)}
                      </span>

                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        {user.organization?.name ?? "Plateforme"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              Affichage de{" "}
              <span className="font-semibold text-slate-600">
                {filteredUsers.length}
              </span>{" "}
              utilisateur
              {filteredUsers.length > 1 ? "s" : ""} sur{" "}
              <span className="font-semibold text-slate-600">
                {users.length}
              </span>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
