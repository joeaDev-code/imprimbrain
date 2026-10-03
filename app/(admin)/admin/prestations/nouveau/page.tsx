"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  Mail,
  Minus,
  Plus,
  UserPlus,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";
import { ReceiptModal } from "@/components/receipt/receipt-modal";
import type { ReceiptData } from "@/components/receipt/receipt.types";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number | string;
  unit?: string | null;
  active?: boolean;
};

type Line = {
  serviceId: string;
  quantity: number;
};

type NewClientForm = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
};


const emptyClient: NewClientForm = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
};

function paymentLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: "Espèces",
    ORANGE_MONEY: "Orange Money",
    MTN_MONEY: "MTN Money",
    MOOV_MONEY: "Moov Money",
    WAVE: "Wave",
    CARD: "Carte",
    OTHER: "Autre",
  };

  return labels[method] ?? method;
}

export default function NewOrder() {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState("");

  const [lines, setLines] = useState<Line[]>([
    {
      serviceId: "",
      quantity: 1,
    },
  ]);

  const [payment, setPayment] = useState("");
  const [method, setMethod] = useState("CASH");

  const [saving, setSaving] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientForm, setClientForm] =
    useState<NewClientForm>(emptyClient);
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);


  useEffect(() => {
    Promise.all([
      fetch("/api/clients"),
      fetch("/api/services"),
    ])
      .then(async ([clientsResponse, servicesResponse]) => {
        if (!clientsResponse.ok || !servicesResponse.ok) {
          throw new Error();
        }

        const [clientsData, servicesData] = await Promise.all([
          clientsResponse.json(),
          servicesResponse.json(),
        ]);

        setClients(
          Array.isArray(clientsData) ? clientsData : [],
        );

        setServices(
          Array.isArray(servicesData) ? servicesData : [],
        );
      })
      .catch(() => {
        toast.error("Impossible de charger les données.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const service = services.find(
          (item) => item.id === line.serviceId,
        );

        return (
          sum +
          (service
            ? Number(service.price) *
              Number(line.quantity || 0)
            : 0)
        );
      }, 0),
    [lines, services],
  );

  /*
   * SOMME REMISE
   *
   * Vide = 0
   *
   * Total 93 000
   * Remis 60 000
   * Encaissé 60 000
   * Reste 33 000
   *
   * Total 93 000
   * Remis 100 000
   * Encaissé 93 000
   * Reste 0
   * Monnaie 7 000
   */
  const given =
    payment.trim() === ""
      ? 0
      : Math.max(0, Number(payment));

  const paid = Math.min(given, total);

  const remaining = Math.max(0, total - paid);

  const change =
    method === "CASH"
      ? Math.max(0, given - total)
      : 0;

  function update(
    index: number,
    patch: Partial<Line>,
  ) {
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? {
              ...line,
              ...patch,
            }
          : line,
      ),
    );
  }

  function updateClient(
    field: keyof NewClientForm,
    value: string,
  ) {
    setClientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openClientForm() {
    setClientForm(emptyClient);
    setCreatingClient(true);
  }

  function closeClientForm() {
    if (clientSaving) return;

    setCreatingClient(false);
    setClientForm(emptyClient);
  }


  async function createClient(e: React.FormEvent) {
    e.preventDefault();

    if (!clientForm.name.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    try {
      setClientSaving(true);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: clientForm.name.trim(),
          phone: clientForm.phone.trim() || null,
          whatsapp:
            clientForm.whatsapp.trim() || null,
          email: clientForm.email.trim() || null,
        }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de créer le client.",
        );
      }

      const newClient: Client =
        data?.client || data;

      if (!newClient?.id) {
        throw new Error(
          "Le client a été créé mais sa référence est introuvable.",
        );
      }

      setClients((current) => [
        newClient,
        ...current,
      ]);

      setClientId(newClient.id);

      setCreatingClient(false);
      setClientForm(emptyClient);

      toast.success(
        "Client ajouté et sélectionné.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de créer le client.",
      );
    } finally {
      setClientSaving(false);
    }
  }

  async function loadReceipt(orderId: unknown) {
    if (typeof orderId !== "string" || !orderId) {
      throw new Error("La prestation a été créée mais son reçu est introuvable.");
    }

    const response = await fetch(`/api/receipts/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "Impossible de charger le reçu.");
    }

    setReceiptData(data as ReceiptData);
    setReceiptOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const valid = lines.filter(
      (line) =>
        line.serviceId &&
        line.quantity > 0,
    );

    if (!clientId) {
      toast.error(
        "Veuillez sélectionner un client.",
      );
      return;
    }

    if (!valid.length || total <= 0) {
      toast.error(
        "Ajoutez au moins un service valide.",
      );
      return;
    }

    if (
      payment.trim() !== "" &&
      (!Number.isFinite(Number(payment)) ||
        Number(payment) < 0)
    ) {
      toast.error(
        "La somme remise doit être un montant valide.",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            lines: valid,
            payment: paid,
            method,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'enregistrer la prestation.",
        );
      }

      toast.success(
        "Prestation enregistrée.",
      );

      /*
       * IMPORTANT :
       * aucune redirection vers /recu.
       *
       * Le reçu s'ouvre directement dans le modal.
       */
      await loadReceipt(data?.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedClient = clients.find(
    (client) => client.id === clientId,
  );

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Nouvelle prestation"
          subtitle="Regroupez plusieurs services sur une même commande et accédez au reçu après enregistrement."
        />

        <form
          onSubmit={submit}
          className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"
        >
          <div className="space-y-5">
            {/* CLIENT */}

            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                    <UserRound size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-black">
                      Client
                    </h2>

                    <p className="text-[10px] text-slate-400">
                      Sélectionnez un client ou créez-en un directement.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openClientForm}
                  className="btn inline-flex items-center gap-1.5 border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                >
                  <UserPlus size={14} />
                  Nouveau client
                </button>
              </div>

              <div className="p-5">
                <label
                  htmlFor="client"
                  className="label"
                >
                  Client{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="client"
                  className="input"
                  value={clientId}
                  onChange={(e) =>
                    setClientId(e.target.value)
                  }
                  disabled={loading}
                  required
                >
                  <option value="">
                    Sélectionner un client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                      {client.whatsapp ||
                      client.phone
                        ? ` — ${
                            client.whatsapp ||
                            client.phone
                          }`
                        : ""}
                    </option>
                  ))}
                </select>

                {selectedClient && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3.5 py-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-500 text-xs font-black text-white">
                      {(selectedClient.name ||
                        "Client")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((part) =>
                          part.charAt(0),
                        )
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "C"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-800">
                        {selectedClient.name ||
                          "Client"}
                      </p>

                      <p className="truncate text-[10px] text-slate-500">
                        {selectedClient.phone ||
                          selectedClient.whatsapp ||
                          selectedClient.email ||
                          "Client enregistré"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SERVICES */}

            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <ClipboardList size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-black">
                      Services
                    </h2>

                    <p className="text-[10px] text-slate-400">
                      Ajoutez les prestations demandées.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn inline-flex items-center gap-1.5"
                  onClick={() =>
                    setLines((current) => [
                      ...current,
                      {
                        serviceId: "",
                        quantity: 1,
                      },
                    ])
                  }
                >
                  <Plus size={14} />
                  Ajouter une ligne
                </button>
              </div>

              <div className="space-y-3 p-5">
                {lines.map((line, index) => {
                  const service =
                    services.find(
                      (item) =>
                        item.id ===
                        line.serviceId,
                    );

                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_150px_40px] md:items-end">
                        <div>
                          <label className="label">
                            Service {index + 1}
                          </label>

                          <select
                            className="input bg-white"
                            value={
                              line.serviceId
                            }
                            onChange={(e) =>
                              update(index, {
                                serviceId:
                                  e.target.value,
                              })
                            }
                            required
                          >
                            <option value="">
                              Choisir un service
                            </option>

                            {services
                              .filter(
                                (item) =>
                                  item.active,
                              )
                              .map(
                                (item) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                  >
                                    {item.name} —{" "}
                                    {fcfa(
                                      Number(
                                        item.price,
                                      ),
                                    )}
                                    /
                                    {item.unit}
                                  </option>
                                ),
                              )}
                          </select>
                        </div>

                        <div>
                          <label className="label">
                            Quantité
                          </label>

                          <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <button
                              type="button"
                              className="grid w-9 place-items-center text-slate-500 hover:bg-slate-50"
                              onClick={() =>
                                update(
                                  index,
                                  {
                                    quantity:
                                      Math.max(
                                        0.001,
                                        line.quantity -
                                          1,
                                      ),
                                  },
                                )
                              }
                            >
                              <Minus size={13} />
                            </button>

                            <input
                              className="min-w-0 flex-1 text-center text-sm font-bold outline-none"
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={
                                line.quantity
                              }
                              onChange={(e) =>
                                update(
                                  index,
                                  {
                                    quantity:
                                      Number(
                                        e.target
                                          .value,
                                      ),
                                  },
                                )
                              }
                            />

                            <button
                              type="button"
                              className="grid w-9 place-items-center text-slate-500 hover:bg-slate-50"
                              onClick={() =>
                                update(
                                  index,
                                  {
                                    quantity:
                                      line.quantity +
                                      1,
                                  },
                                )
                              }
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="label">
                            Sous-total
                          </label>

                          <div className="input flex items-center bg-white font-black text-slate-800">
                            {fcfa(
                              service
                                ? Number(
                                    service.price,
                                  ) *
                                    line.quantity
                                : 0,
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                          disabled={
                            lines.length === 1
                          }
                          onClick={() =>
                            setLines(
                              (current) =>
                                current.filter(
                                  (_, n) =>
                                    n !== index,
                                ),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PAIEMENT */}

            <section className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <CreditCard size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-black">
                    Paiement
                  </h2>

                  <p className="text-[10px] text-slate-400">
                    Indiquez la somme réellement remise par le client.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">
                      Somme remise{" "}
                      <span className="text-[9px] font-normal normal-case text-slate-400">
                        (facultatif)
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        className="input h-11 pr-16 text-base font-bold"
                        type="number"
                        min="0"
                        step="1"
                        value={payment}
                        onChange={(e) =>
                          setPayment(
                            e.target.value,
                          )
                        }
                        placeholder="0"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        FCFA
                      </span>
                    </div>

                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Vous pouvez laisser ce champ vide si aucun paiement n'a encore été enregistré.
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      Mode de paiement
                    </label>

                    <select
                      className="input h-11"
                      value={method}
                      onChange={(e) =>
                        setMethod(
                          e.target.value,
                        )
                      }
                    >
                      <option value="CASH">
                        Espèces
                      </option>
                      <option value="ORANGE_MONEY">
                        Orange Money
                      </option>
                      <option value="MTN_MONEY">
                        MTN Money
                      </option>
                      <option value="MOOV_MONEY">
                        Moov Money
                      </option>
                      <option value="WAVE">
                        Wave
                      </option>
                      <option value="CARD">
                        Carte
                      </option>
                      <option value="OTHER">
                        Autre
                      </option>
                    </select>
                  </div>
                </div>

                {given > 0 &&
                  given < total && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-black text-amber-700">
                        Paiement partiel
                      </p>

                      <p className="mt-1 text-[11px] text-amber-700">
                        Le client a remis{" "}
                        <strong>
                          {fcfa(given)}
                        </strong>
                        . Il reste{" "}
                        <strong>
                          {fcfa(remaining)}
                        </strong>{" "}
                        à payer.
                      </p>
                    </div>
                  )}

                {given >= total &&
                  total > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                            Monnaie à rendre
                          </p>

                          <p className="mt-1 text-[11px] text-emerald-600">
                            {change > 0
                              ? "Le client a remis plus que le total."
                              : "Le montant remis correspond exactement au total."}
                          </p>
                        </div>

                        <strong className="text-lg font-black text-emerald-700">
                          {fcfa(change)}
                        </strong>
                      </div>
                    </div>
                  )}
              </div>
            </section>
          </div>

          {/* SUMMARY */}

          <aside className="xl:sticky xl:top-5 xl:self-start">
            <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 shadow-sm">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-cyan-500 text-white">
                    <WalletCards size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-cyan-700">
                      Résumé
                    </p>

                    <h2 className="text-sm font-black text-slate-900">
                      Total prestation
                    </h2>
                  </div>
                </div>

                <div className="mt-7 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Total
                    </span>

                    <b>{fcfa(total)}</b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Somme remise
                    </span>

                    <b>
                      {fcfa(given)}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Montant encaissé
                    </span>

                    <b className="text-green-600">
                      {fcfa(paid)}
                    </b>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Reste à payer
                    </span>

                    <b
                      className={
                        remaining > 0
                          ? "text-amber-600"
                          : "text-green-600"
                      }
                    >
                      {fcfa(remaining)}
                    </b>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="font-bold text-slate-700">
                      Monnaie à rendre
                    </span>

                    <b
                      className={
                        change > 0
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {fcfa(change)}
                    </b>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    total <= 0 ||
                    loading ||
                    !clientId
                  }
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-black text-white shadow-sm transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement…"
                    : "Enregistrer et générer le reçu"}

                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>

      {/* MODAL NOUVEAU CLIENT */}

      {creatingClient && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-client-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeClientForm();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                  <UserPlus size={18} />
                </div>

                <div>
                  <h2
                    id="new-client-title"
                    className="text-sm font-black text-slate-900"
                  >
                    Ajouter un client
                  </h2>

                  <p className="text-[10px] text-slate-400">
                    Le client sera automatiquement sélectionné.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeClientForm}
                disabled={clientSaving}
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={createClient}
              className="space-y-4 p-5"
            >
              <div>
                <label className="label">
                  Nom complet{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  className="input h-11"
                  value={clientForm.name}
                  onChange={(e) =>
                    updateClient(
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Ex. Kouassi Jean"
                  autoFocus
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    Téléphone{" "}
                    <span className="text-[9px] font-normal normal-case text-slate-400">
                      (facultatif)
                    </span>
                  </label>

                  <input
                    className="input h-11"
                    type="tel"
                    value={clientForm.phone}
                    onChange={(e) =>
                      updateClient(
                        "phone",
                        e.target.value,
                      )
                    }
                    placeholder="07 00 00 00 00"
                  />
                </div>

                <div>
                  <label className="label">
                    WhatsApp{" "}
                    <span className="text-[9px] font-normal normal-case text-slate-400">
                      (facultatif)
                    </span>
                  </label>

                  <input
                    className="input h-11"
                    type="tel"
                    value={clientForm.whatsapp}
                    onChange={(e) =>
                      updateClient(
                        "whatsapp",
                        e.target.value,
                      )
                    }
                    placeholder="07 00 00 00 00"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  E-mail{" "}
                  <span className="text-[9px] font-normal normal-case text-slate-400">
                    (facultatif)
                  </span>
                </label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    className="input h-11 pl-9"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) =>
                      updateClient(
                        "email",
                        e.target.value,
                      )
                    }
                    placeholder="client@exemple.com"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3.5 py-3 text-[10px] leading-5 text-slate-500">
                <span className="font-bold text-cyan-700">
                  *
                </span>{" "}
                Le nom complet est obligatoire.
                Les autres informations peuvent
                être ajoutées plus tard.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeClientForm}
                  disabled={clientSaving}
                  className="btn"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    clientSaving ||
                    !clientForm.name.trim()
                  }
                  className="btn btn-primary min-w-[140px]"
                >
                  {clientSaving
                    ? "Création…"
                    : "Créer le client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptData && (
        <ReceiptModal
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          data={receiptData}
        />
      )}
    </>
  );
}