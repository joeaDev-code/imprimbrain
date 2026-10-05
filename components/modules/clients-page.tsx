"use client";

import {
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import type { CTRole } from "@/lib/ct-access";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  createdAt: string;
};

type ClientForm = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
};

const emptyForm: ClientForm = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizePhone(phone?: string | null) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

function normalizeWhatsApp(phone?: string | null) {
  if (!phone) return "";

  const normalized = phone.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) {
    return normalized.slice(1);
  }

  return normalized;
}

async function getApiError(
  response: Response,
  fallback: string,
) {
  try {
    const data = await response.json();

    if (typeof data?.error === "string") {
      return data.error;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch {
    // Réponse non JSON.
  }

  return fallback;
}

export default function Clients({
  ctRole,
}: {
  ctRole: CTRole;
}) {
  const [rows, setRows] = useState<Client[]>([]);
  const [form, setForm] =
    useState<ClientForm>(emptyForm);

  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] =
    useState(true);

  const [search, setSearch] = useState("");

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [editForm, setEditForm] =
    useState<ClientForm>(emptyForm);

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [deletingClient, setDeletingClient] =
    useState<Client | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function load() {
    try {
      setLoadingRows(true);

      const response = await fetch(
        "/api/clients",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Impossible de charger les clients.",
          ),
        );
      }

      const data = await response.json();

      setRows(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les clients.",
      );
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      toast.error(
        "Le nom du client est obligatoire.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/clients",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name,
            phone: form.phone.trim(),
            whatsapp: form.whatsapp.trim(),
            email: form.email.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Impossible de créer le client.",
          ),
        );
      }

      setForm(emptyForm);

      await load();

      toast.success(
        "Client ajouté avec succès.",
        {
          description: `${name} a été ajouté à votre base clients.`,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de créer le client.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openEdit(client: Client) {
    setEditingClient(client);

    setEditForm({
      name: client.name,
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      email: client.email || "",
    });
  }

  function closeEdit() {
    if (savingEdit) return;

    setEditingClient(null);
    setEditForm(emptyForm);
  }

  async function updateClient(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!editingClient) return;

    const name = editForm.name.trim();

    if (!name) {
      toast.error(
        "Le nom du client est obligatoire.",
      );
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        "/api/clients",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: editingClient.id,
            name,
            phone: editForm.phone.trim(),
            whatsapp: editForm.whatsapp.trim(),
            email: editForm.email.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Impossible de modifier le client.",
          ),
        );
      }

      closeEdit();

      await load();

      toast.success(
        "Client modifié avec succès.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le client.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  function askDelete(client: Client) {
    setDeletingClient(client);
  }

  function closeDelete() {
    if (deleting) return;

    setDeletingClient(null);
  }

  async function deleteClient() {
    if (!deletingClient) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/clients?id=${encodeURIComponent(
          deletingClient.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Impossible de supprimer le client.",
          ),
        );
      }

      const deletedName =
        deletingClient.name;

      setDeletingClient(null);

      await load();

      toast.success(
        "Client supprimé.",
        {
          description: `${deletedName} a été supprimé de votre base clients.`,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le client.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredRows = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((client) =>
      [
        client.name,
        client.phone,
        client.whatsapp,
        client.email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        ),
    );
  }, [rows, search]);

  const phoneCount = useMemo(
    () =>
      rows.filter(
        (client) => client.phone,
      ).length,
    [rows],
  );

  const whatsappCount = useMemo(
    () =>
      rows.filter(
        (client) => client.whatsapp,
      ).length,
    [rows],
  );

  const emailCount = useMemo(
    () =>
      rows.filter(
        (client) => client.email,
      ).length,
    [rows],
  );

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          ctRole={ctRole}
          title="Clients"
          subtitle={`${rows.length} client${
            rows.length > 1 ? "s" : ""
          } enregistré${
            rows.length > 1 ? "s" : ""
          }`}
        />

        {/* Statistiques */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Users size={18} />
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Base clients
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {rows.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Clients enregistrés
            </p>
          </div>

          <div className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-green-50 text-green-600">
                <Phone size={18} />
              </div>

              <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-green-600">
                Contact
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {phoneCount}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Avec téléphone
            </p>
          </div>

          <div className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <MessageCircle size={18} />
              </div>

              <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600">
                WhatsApp
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {whatsappCount}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Avec WhatsApp
            </p>
          </div>

          <div className="card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail size={18} />
              </div>

              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-600">
                Email
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {emailCount}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Avec adresse email
            </p>
          </div>
        </section>

        {/* Nouveau client */}
        <form
          onSubmit={add}
          className="card overflow-hidden"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Nouveau client
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Ajoutez un client à votre base.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="label">
                Nom complet{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                className="input"
                placeholder="Ex. Jean Kouassi"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                maxLength={160}
              />
            </div>

            <div>
              <label className="label">
                Téléphone{" "}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  (facultatif)
                </span>
              </label>

              <input
                className="input"
                type="tel"
                placeholder="+225 07..."
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">
                WhatsApp{" "}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  (facultatif)
                </span>
              </label>

              <input
                className="input"
                type="tel"
                placeholder="+225 07..."
                value={form.whatsapp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    whatsapp:
                      event.target.value,
                  }))
                }
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">
                Email{" "}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  (facultatif)
                </span>
              </label>

              <input
                className="input"
                type="email"
                placeholder="client@email.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                maxLength={254}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-400">
              <span className="font-bold text-red-500">
                *
              </span>{" "}
              Champ obligatoire
            </p>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-[11px] font-bold text-white shadow-sm shadow-cyan-500/20 transition-all hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Plus size={15} />
              )}

              {loading
                ? "Ajout..."
                : "Ajouter le client"}
            </button>
          </div>
        </form>

        {/* Liste */}
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Tous les clients
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  {filteredRows.length} résultat
                  {filteredRows.length > 1
                    ? "s"
                    : ""}{" "}
                  sur {rows.length} client
                  {rows.length > 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="relative w-full xl:w-80">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Rechercher nom, téléphone, WhatsApp, email..."
                  className="input pl-9 pr-9"
                />

                {search && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>WhatsApp</th>
                  <th>Email</th>
                  <th>Créé le</th>
                  <th className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingRows ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                        <Loader2
                          size={17}
                          className="animate-spin text-cyan-500"
                        />
                        Chargement des clients...
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map(
                    (client) => (
                      <tr
                        key={client.id}
                        className="group"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-[10px] font-black text-white shadow-sm">
                              {getInitials(
                                client.name,
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-800">
                                {client.name}
                              </p>

                              <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                Client
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          {client.phone ? (
                            <a
                              href={`tel:${normalizePhone(
                                client.phone,
                              )}`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-cyan-600"
                            >
                              <Phone
                                size={13}
                                className="text-slate-400"
                              />
                              {client.phone}
                            </a>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          {client.whatsapp ? (
                            <a
                              href={`https://wa.me/${normalizeWhatsApp(
                                client.whatsapp,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 transition-colors hover:text-green-700"
                            >
                              <MessageCircle
                                size={13}
                              />
                              {client.whatsapp}
                            </a>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          {client.email ? (
                            <a
                              href={`mailto:${client.email}`}
                              className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-slate-600 transition-colors hover:text-cyan-600"
                            >
                              <Mail
                                size={13}
                                className="shrink-0 text-slate-400"
                              />
                              <span className="truncate">
                                {client.email}
                              </span>
                            </a>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </td>

                        <td className="text-xs font-medium text-slate-500">
                          {new Date(
                            client.createdAt,
                          ).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>

                        <td>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                              onClick={() =>
                                openEdit(client)
                              }
                              title="Modifier le client"
                            >
                              <Edit3 size={13} />
                              Modifier
                            </button>

                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-bold text-red-600 transition-all hover:bg-red-100"
                              onClick={() =>
                                askDelete(client)
                              }
                              title="Supprimer le client"
                            >
                              <Trash2 size={13} />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-500">
                          <Users size={22} />
                        </div>

                        <h3 className="mt-4 text-sm font-black text-slate-800">
                          {search
                            ? "Aucun résultat"
                            : "Aucun client"}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {search
                            ? "Aucun client ne correspond à votre recherche."
                            : "Commencez par ajouter votre premier client."}
                        </p>

                        {search && (
                          <button
                            type="button"
                            className="mt-4 text-[11px] font-bold text-cyan-600 hover:text-cyan-700"
                            onClick={() =>
                              setSearch("")
                            }
                          >
                            Effacer la recherche
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal modification */}
      {editingClient && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                  <Edit3 size={18} />
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Modifier le client
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Modifiez les coordonnées de{" "}
                    {editingClient.name}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                onClick={closeEdit}
                disabled={savingEdit}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={updateClient}
              className="p-5 sm:p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="label">
                    Nom complet{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          name: event.target.value,
                        }),
                      )
                    }
                    required
                    maxLength={160}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">
                    Téléphone
                  </label>

                  <input
                    className="input"
                    type="tel"
                    placeholder="+225 07..."
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          phone: event.target.value,
                        }),
                      )
                    }
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="label">
                    WhatsApp
                  </label>

                  <input
                    className="input"
                    type="tel"
                    placeholder="+225 07..."
                    value={
                      editForm.whatsapp
                    }
                    onChange={(event) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          whatsapp:
                            event.target.value,
                        }),
                      )
                    }
                    maxLength={50}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    Email
                  </label>

                  <input
                    className="input"
                    type="email"
                    placeholder="client@email.com"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          email: event.target.value,
                        }),
                      )
                    }
                    maxLength={254}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn"
                  onClick={closeEdit}
                  disabled={savingEdit}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 transition-all hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={15} />
                  )}

                  {savingEdit
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deletingClient && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDelete();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
            <div className="p-6">
              <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-900">
                Supprimer ce client ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vous êtes sur le point de supprimer{" "}
                <strong className="text-slate-800">
                  {deletingClient.name}
                </strong>{" "}
                de votre base clients.
              </p>

              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-3.5">
                <p className="text-[11px] font-semibold leading-5 text-red-700">
                  Cette opération est définitive. Vérifiez
                  que ce client ne doit plus être utilisé
                  dans vos opérations avant de confirmer.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn"
                onClick={closeDelete}
                disabled={deleting}
              >
                Annuler
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={deleteClient}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={15} />
                )}

                {deleting
                  ? "Suppression..."
                  : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}