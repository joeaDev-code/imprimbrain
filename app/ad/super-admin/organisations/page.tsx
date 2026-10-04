"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { superAdminApi } from "@/lib/super-admin-api";
import {
  ErrorBox,
  Loading,
  PageTitle,
  SearchBox,
} from "@/components/super-admin/ui";

type Organization = Awaited<
  ReturnType<typeof superAdminApi.organizations>
>[number];

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("fr-FR").format(Number(value));
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "O"
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
          <Icon size={21} strokeWidth={2.2} />
        </div>

        <ArrowUpRight
          size={17}
          className="text-slate-300 transition-colors group-hover:text-cyan-500"
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {formatNumber(value)}
        </p>

        <p className="mt-2 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function OrganizationActions({
  organization,
  onArchive,
}: {
  organization: Organization;
  onArchive: (organization: Organization) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  });

  function toggleMenu(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 8,
      right: Math.max(
        12,
        window.innerWidth - rect.right,
      ),
    });

    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleMenu}
        className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95"
        title="Actions"
        aria-label={`Actions pour ${organization.name}`}
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-[90] cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed z-[100] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15"
            style={{
              top: position.top,
              right: position.right,
            }}
          >
            <Link
              href={`/ad/super-admin/organisations/${organization.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
            >
              <Eye
                size={16}
                className="text-slate-400"
              />

              <span>Voir les détails</span>
            </Link>

            <Link
              href={`/ad/super-admin/organisations/${organization.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Pencil
                size={16}
                className="text-slate-400"
              />

              <span>Modifier</span>
            </Link>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onArchive(organization);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />

              <span>Archiver</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
function DeleteModal({
  organization,
  deleting,
  onClose,
  onConfirm,
}: {
  organization: Organization | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!organization) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Trash2 size={20} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-950">
            Archiver l'organisation ?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vous êtes sur le point d’archiver l’organisation{" "}
            <span className="font-semibold text-slate-800">
              {organization.name}
            </span>
            .
          </p>

          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Attention
            </p>

            <p className="mt-1 text-sm leading-5 text-red-700">
              L’organisation restera conservée avec son historique, mais son accès sera désactivé. Vous pourrez la consulter depuis le Super Admin.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Archivage…
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Archiver
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-5 px-6 py-5"
        >
          <div className="size-11 shrink-0 rounded-2xl bg-slate-100" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-44 rounded bg-slate-100" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>

          <div className="hidden h-7 w-20 rounded-xl bg-slate-100 sm:block" />
          <div className="hidden h-7 w-20 rounded-xl bg-slate-100 md:block" />
          <div className="hidden h-7 w-20 rounded-xl bg-slate-100 lg:block" />
          <div className="size-9 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasSearch,
  onReset,
}: {
  hasSearch: boolean;
  onReset: () => void;
}) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Building2 size={28} />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">
        {hasSearch
          ? "Aucune organisation trouvée"
          : "Aucune organisation enregistrée"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {hasSearch
          ? "Aucune organisation ne correspond à votre recherche. Essayez avec un autre nom ou slug."
          : "Commencez par créer votre première organisation."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <X size={16} />
          Effacer la recherche
        </button>
      )}
    </div>
  );
}

export default function OrganisationsPage() {
  const [q, setQ] = useState("");

  const [data, setData] = useState<
    Awaited<ReturnType<typeof superAdminApi.organizations>>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await superAdminApi.organizations(q);

      setData(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de charger les organisations.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  const statistics = useMemo(() => {
    const organizations = data.length;

    const users = data.reduce(
      (total, organization) =>
        total + Number(organization.membersCount ?? 0),
      0,
    );

    const events = data.reduce(
      (total, organization) =>
        total + Number(organization.auditLogsCount ?? 0),
      0,
    );

    return {
      organizations,
      users,
      events,
    };
  }, [data]);

  async function handleDelete() {
    if (!selectedOrganization) return;
    setDeleting(true);
    try {
      await superAdminApi.organizationAction(selectedOrganization.id, "archive");
      setSelectedOrganization(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d’archiver cette organisation.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageTitle
          title="Organisations"
          description="Gérez les organisations enregistrées sur la plateforme Imprim’Brain."
          action={
            <Link
              href="/ad/super-admin/organisations/nouvelle"
              className="group inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-cyan-600/20 transition-all hover:bg-cyan-700 hover:shadow-md hover:shadow-cyan-600/30 active:scale-95"
            >
              <Plus
                size={18}
                strokeWidth={2.5}
                className="transition-transform group-hover:rotate-90"
              />

              <span>Nouvelle organisation</span>
            </Link>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Organisations"
            value={statistics.organizations}
            icon={Building2}
            description="Organisations correspondant à la vue actuelle"
          />

          <StatCard
            label="Utilisateurs"
            value={statistics.users}
            icon={Users}
            description="Membres des organisations affichées"
          />

          <StatCard
            label="Événements"
            value={statistics.events}
            icon={CalendarDays}
            description="Événements associés aux organisations affichées"
          />
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2
                    size={18}
                    className="text-cyan-600"
                    strokeWidth={2.3}
                  />

                  <h2 className="font-bold text-slate-950">
                    Toutes les organisations
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Consultez, modifiez ou administrez les organisations de la
                  plateforme.
                </p>
              </div>

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Actualiser
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <SearchBox
                  value={q}
                  onChange={setQ}
                  placeholder="Rechercher par nom ou slug…"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="flex size-2 items-center justify-center">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                </span>

                {loading
                  ? "Actualisation…"
                  : `${formatNumber(data.length)} organisation${
                      data.length > 1 ? "s" : ""
                    }`}
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-6">
              <ErrorBox message={error} retry={load} />
            </div>
          ) : loading ? (
            <LoadingTable />
          ) : data.length === 0 ? (
            <EmptyState
              hasSearch={Boolean(q.trim())}
              onReset={() => setQ("")}
            />
          ) : (
            <>
              <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Organisation</th>
                      <th className="px-6 py-4">Utilisateurs</th>
                      <th className="px-6 py-4">Événements</th>
                      <th className="px-6 py-4">Création</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100/80">
                    {data.map((organization) => (
                      <tr
                        key={organization.id}
                        className="group transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-sm font-bold text-cyan-700 transition-all group-hover:bg-cyan-600 group-hover:text-white">
                              {initials(organization.name)}
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/ad/super-admin/organisations/${organization.id}`}
                                className="block truncate font-bold text-slate-900 transition-colors hover:text-cyan-600"
                              >
                                {organization.name}
                              </Link>

                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                <span className="truncate">
                                  {organization.slug}
                                </span>

                                <span className="text-slate-300">•</span>

                                <span className="font-mono">
                                  {organization.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                            <UserRound
                              size={13}
                              className="text-slate-400"
                            />
                            {formatNumber(organization.membersCount)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                            <CalendarDays
                              size={13}
                              className="text-slate-400"
                            />
                            {formatNumber(organization.auditLogsCount)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Clock3 size={14} className="text-slate-400" />

                            {formatDate(
                              (organization as Organization & {
                                createdAt?: string;
                              }).createdAt,
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <OrganizationActions
                            organization={organization}
                            onArchive={setSelectedOrganization}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-400">
                  {formatNumber(data.length)} organisation
                  {data.length > 1 ? "s" : ""} affichée
                  {data.length > 1 ? "s" : ""}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Check size={14} className="text-emerald-500" />
                  Données chargées depuis l’API Super Admin
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <DeleteModal
        organization={selectedOrganization}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setSelectedOrganization(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}