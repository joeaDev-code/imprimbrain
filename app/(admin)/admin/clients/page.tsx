"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  createdAt: string;
};

const emptyForm = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
};

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setLoadingRows(true);

      const response = await fetch("/api/clients");

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Impossible de charger les clients.");
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          email: form.email.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Impossible de créer le client.";

        try {
          const data = await response.json();

          if (typeof data?.error === "string") {
            message = data.error;
          }

          if (typeof data?.message === "string") {
            message = data.message;
          }
        } catch {
          // Réponse non JSON.
        }

        throw new Error(message);
      }

      const clientName = form.name.trim();

      setForm(emptyForm);
      await load();

      toast.success("Client ajouté avec succès.", {
        description: `${clientName} a été ajouté à votre base clients.`,
      });
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

  const filteredRows = rows.filter((client) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      client.name,
      client.phone,
      client.whatsapp,
      client.email,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(query),
      );
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        subtitle={`${rows.length} client${rows.length > 1 ? "s" : ""} enregistré${rows.length > 1 ? "s" : ""}`}
      />

      {/* Statistiques */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
            <Users size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {rows.length}
          </p>

          <p className="text-[10px] text-slate-500">
            Clients enregistrés
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-green-50 text-green-600">
            <Phone size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {rows.filter((client) => client.phone).length}
          </p>

          <p className="text-[10px] text-slate-500">
            Avec téléphone
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <MessageCircle size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {rows.filter((client) => client.whatsapp).length}
          </p>

          <p className="text-[10px] text-slate-500">
            Avec WhatsApp
          </p>
        </div>
      </section>

      {/* Nouveau client */}
      <form
        onSubmit={add}
        className="card overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
            <UserPlus size={17} />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-900">
              Nouveau client
            </h2>

            <p className="text-[10px] text-slate-400">
              Ajoutez un client à votre base
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {/* Nom */}
          <div>
            <label className="label">
              Nom complet{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ex. Jean Kouassi"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Téléphone */}
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
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />
          </div>

          {/* WhatsApp */}
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
              onChange={(e) =>
                setForm({
                  ...form,
                  whatsapp: e.target.value,
                })
              }
            />
          </div>

          {/* Email */}
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
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[10px] text-slate-400">
            <span className="font-bold text-red-500">*</span>{" "}
            Champ obligatoire
          </p>

          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-[11px] font-bold text-white shadow-sm transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            <Plus size={15} />
            {loading ? "Ajout..." : "Ajouter le client"}
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Tous les clients
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Consultez les clients enregistrés
            </p>
          </div>

          <div className="flex h-9 min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400">
            <Search size={15} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table min-w-[800px]">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Créé le</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingRows ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    Chargement des clients...
                  </td>
                </tr>
              ) : filteredRows.length ? (
                filteredRows.map((client) => (
                  <tr
                    key={client.id}
                    className="group"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[10px] font-black text-white">
                          {client.name
                            .split(" ")
                            .filter(Boolean)
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">
                            {client.name}
                          </p>

                          <p className="text-[9px] text-slate-400">
                            Client
                          </p>
                        </div>
                      </div>
                    </td>

                    <td>
                      {client.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone
                            size={12}
                            className="text-slate-400"
                          />
                          {client.phone}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td>
                      {client.whatsapp ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                          <MessageCircle size={12} />
                          {client.whatsapp}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td>
                      {client.email ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail
                            size={12}
                            className="text-slate-400"
                          />
                          {client.email}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="text-xs text-slate-500">
                      {new Date(
                        client.createdAt,
                      ).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td>
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          title="Voir le client"
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-0 transition group-hover:opacity-100 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <ArrowDownUp size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center"
                  >
                    <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-500">
                      <Users size={22} />
                    </div>

                    <h3 className="mt-4 text-sm font-black text-slate-800">
                      {search
                        ? "Aucun résultat"
                        : "Aucun client"}
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                      {search
                        ? "Aucun client ne correspond à votre recherche."
                        : "Commencez par ajouter votre premier client."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}