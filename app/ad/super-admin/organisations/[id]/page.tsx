"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Hash,
  RefreshCw,
  Save,
} from "lucide-react";

import { superAdminApi } from "@/lib/super-admin-api";
import {
  ErrorBox,
  Loading,
  PageTitle,
  useApi,
} from "@/components/super-admin/ui";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR").format(Number(value));
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string) {
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

export default function ModifierOrganisationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data,
    error,
    loading,
    reload,
  } = useApi(() => superAdminApi.organization(id));

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setName(data.name);
    setSlug(data.slug);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Loading />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-[420px] animate-pulse rounded-3xl bg-slate-100 lg:col-span-2" />
          <div className="h-[420px] animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBox
        message={error}
        retry={reload}
      />
    );
  }

  if (!data) {
    return (
      <ErrorBox
        message="Organisation introuvable."
        retry={reload}
      />
    );
  }

  const organization = data;

  const initials = getInitials(name || organization.name);

  const hasChanges =
    name.trim() !== organization.name ||
    slug.trim() !== organization.slug;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = name.trim();
    const nextSlug = slug.trim();

    if (!nextName) {
      setSaveError("Le nom de l’organisation est obligatoire.");
      return;
    }

    if (!nextSlug) {
      setSaveError("Le slug de l’organisation est obligatoire.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      await superAdminApi.updateOrganization(id, {
        name: nextName,
        slug: nextSlug,
      });

      setSaved(true);

      await reload();

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (requestError) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de modifier cette organisation.",
      );
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setName(organization.name);
    setSlug(organization.slug);
    setSaveError("");
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div>
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyan-700"
        >
          <ArrowLeft size={16} />
          Retour à l’organisation
        </button>
      </div>

      {/* Title */}
      <PageTitle
        title="Modifier l’organisation"
        description={`Mettez à jour les informations de ${organization.name}.`}
      />

      {/* Organization header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-600 to-blue-700 px-6 py-7 sm:px-8">
          <div className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Building2
                  size={16}
                  className="text-cyan-100"
                />

                <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">
                  Organisation
                </span>
              </div>

              <h2 className="mt-1 truncate text-xl font-bold text-white">
                {organization.name}
              </h2>

              <p className="mt-1 font-mono text-xs text-cyan-100">
                {organization.slug}
              </p>
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Membres
            </p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatNumber(organization.membersCount)}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Événements
            </p>

            <p className="mt-1 text-xl font-bold text-slate-950">
              {formatNumber(organization.eventsCount)}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Création
            </p>

            <p className="mt-1 text-sm font-bold text-slate-950">
              {formatDate(organization.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <section className="lg:col-span-2">
          <form
            onSubmit={submit}
            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Building2 size={18} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-950">
                    Informations générales
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Modifiez les informations principales de
                    l’organisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-7">
              {/* Name */}
              <div>
                <label
                  htmlFor="organization-name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Nom de l’organisation
                </label>

                <div className="relative mt-2">
                  <Building2
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="organization-name"
                    type="text"
                    required
                    autoComplete="organization"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="Ex. Imprimerie ABC"
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="organization-slug"
                  className="text-sm font-semibold text-slate-700"
                >
                  Slug
                </label>

                <div className="relative mt-2">
                  <Hash
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="organization-slug"
                    type="text"
                    required
                    value={slug}
                    onChange={(event) =>
                      setSlug(event.target.value)
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="imprimerie-abc"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Utilisez un identifiant court et lisible,
                  généralement en minuscules avec des tirets.
                </p>
              </div>

              {/* Error */}
              {saveError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
                  <p className="text-sm font-semibold text-red-700">
                    {saveError}
                  </p>
                </div>
              )}

              {/* Success */}
              {saved && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={15} />
                  </div>

                  <p className="text-sm font-semibold text-emerald-700">
                    Organisation mise à jour avec succès.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={saving || !hasChanges}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Annuler les modifications
                </button>

                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white shadow-sm shadow-cyan-600/20 transition hover:bg-cyan-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Side information */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Hash
                size={18}
                className="text-cyan-600"
              />

              <h2 className="font-bold text-slate-950">
                Identifiant
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Identifiant interne de l’organisation.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <code className="break-all font-mono text-xs leading-5 text-slate-600">
                {organization.id}
              </code>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6">
            <div className="flex items-center gap-2">
              <Check
                size={18}
                className="text-emerald-600"
              />

              <h2 className="font-bold text-slate-900">
                Modification sécurisée
              </h2>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Les modifications sont envoyées directement à
              l’API Super Admin existante.
            </p>

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-xs font-medium leading-5 text-emerald-700">
              Seuls le nom et le slug sont modifiés depuis cette
              interface.
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}