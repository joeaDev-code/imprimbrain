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
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";
import { ReceiptModal } from "@/components/receipt/receipt-modal";
import type { ReceiptData } from "@/components/receipt/receipt.types";
import type { CTRole } from "@/lib/ct-access";

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

export default function NewOrder({ ctRole }: { ctRole: CTRole }) {
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
  const [changeReturned, setChangeReturned] = useState("");
  const [method, setMethod] = useState("CASH");

  const [saving, setSaving] = useState(false);
  const [newClientMode, setNewClientMode] = useState(false);
  const [clientForm, setClientForm] =
    useState<NewClientForm>(emptyClient);
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);


  async function loadData() {
    setLoading(true);
    try {
      const [clientsResponse, servicesResponse] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/services", { cache: "no-store" }),
      ]);

      if (!clientsResponse.ok || !servicesResponse.ok) {
        throw new Error("Impossible de charger les données.");
      }

      const [clientsData, servicesData] = await Promise.all([
        clientsResponse.json(),
        servicesResponse.json(),
      ]);

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch {
      toast.error("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
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
   * Paiement et monnaie.
   *
   * La somme remise représente ce que le client donne réellement.
   * Le montant encaissé est plafonné au total de la prestation.
   * La monnaie due est la différence entre la somme remise et le total.
   * La monnaie remise permet d'indiquer ce qui a réellement été rendu.
   */
  const given =
    payment.trim() === ""
      ? 0
      : Math.max(0, Number(payment));

  const paid = Math.min(given, total);
  const remaining = Math.max(0, total - paid);

  const changeDue =
    method === "CASH"
      ? Math.max(0, given - total)
      : 0;

  const returned =
    method === "CASH"
      ? Math.min(
          changeDue,
          Math.max(0, Number(changeReturned || 0)),
        )
      : 0;

  const changeRemaining = Math.max(0, changeDue - returned);

  function update(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? { ...line, ...patch }
          : line,
      ),
    );
  }

  function updateClient(field: keyof NewClientForm, value: string) {
    setClientForm((current) => ({
      ...current,
      [field]: value,
    }));
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
      (line) => line.serviceId && line.quantity > 0,
    );

    if (!clientId && !newClientMode) {
      toast.error("Sélectionnez un client ou activez l'ajout d'un nouveau client.");
      return;
    }

    if (newClientMode && !clientForm.name.trim()) {
      toast.error("Le nom du nouveau client est obligatoire.");
      return;
    }

    if (!valid.length || total <= 0) {
      toast.error("Ajoutez au moins un service valide.");
      return;
    }

    if (!Number.isFinite(given) || given < 0) {
      toast.error("La somme remise doit être un montant valide.");
      return;
    }

    if (!Number.isFinite(returned) || returned < 0 || returned > changeDue) {
      toast.error("La monnaie remise doit être comprise entre 0 et la monnaie due.");
      return;
    }

    if (method !== "CASH" && (given > total || changeReturned.trim() !== "")) {
      if (given > total) {
        toast.error("Une monnaie ne peut être calculée que pour un paiement en espèces.");
      } else {
        toast.error("La monnaie remise ne concerne que les paiements en espèces.");
      }
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          clientId: newClientMode ? null : clientId || null,
          newClient: newClientMode
            ? {
                name: clientForm.name.trim(),
                phone: clientForm.phone.trim() || null,
                whatsapp: clientForm.whatsapp.trim() || null,
                email: clientForm.email.trim() || null,
              }
            : null,
          lines: valid,
          payment: paid,
          method,
          cashGiven: method === "CASH" ? given : 0,
          changeDue,
          changeReturned: returned,
          changeRemaining,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Impossible d'enregistrer la prestation.",
        );
      }

      await loadData();
      toast.success("Prestation enregistrée.");
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
          ctRole={ctRole}
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
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                    <UserRound size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black">Client</h2>
                    <p className="text-[10px] text-slate-400">
                      Choisissez un client existant ou créez-le directement dans cette prestation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setNewClientMode(false)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      !newClientMode
                        ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-black">Client existant</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Sélectionner dans la base clients
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewClientMode(true);
                      setClientId("");
                    }}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      newClientMode
                        ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-black">
                      <UserPlus size={14} /> Nouveau client
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Les informations seront envoyées avec la prestation
                    </span>
                  </button>
                </div>

                {!newClientMode ? (
                  <div>
                    <label htmlFor="client" className="label">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="client"
                      className="input"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      disabled={loading}
                      required={!newClientMode}
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                          {client.whatsapp || client.phone
                            ? ` — ${client.whatsapp || client.phone}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {selectedClient && (
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3.5 py-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-500 text-xs font-black text-white">
                          {selectedClient.name
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((part) => part.charAt(0))
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-800">
                            {selectedClient.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {selectedClient.phone || selectedClient.whatsapp || selectedClient.email || "Client enregistré"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                    <div className="flex items-center gap-2">
                      <div className="grid size-8 place-items-center rounded-lg bg-cyan-500 text-white">
                        <UserPlus size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">Nouveau client</p>
                        <p className="text-[10px] text-slate-500">
                          Aucun enregistrement séparé : les données partent avec la prestation.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="input h-11"
                        value={clientForm.name}
                        onChange={(e) => updateClient("name", e.target.value)}
                        placeholder="Ex. Kouassi Jean"
                        required={newClientMode}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">Téléphone</label>
                        <input
                          className="input h-11"
                          type="tel"
                          value={clientForm.phone}
                          onChange={(e) => updateClient("phone", e.target.value)}
                          placeholder="07 00 00 00 00"
                        />
                      </div>
                      <div>
                        <label className="label">WhatsApp</label>
                        <input
                          className="input h-11"
                          type="tel"
                          value={clientForm.whatsapp}
                          onChange={(e) => updateClient("whatsapp", e.target.value)}
                          placeholder="07 00 00 00 00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">E-mail</label>
                      <input
                        className="input h-11"
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => updateClient("email", e.target.value)}
                        placeholder="client@exemple.com"
                      />
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
                  <h2 className="text-sm font-black">Paiement</h2>
                  <p className="text-[10px] text-slate-400">
                    Enregistrez ce que le client remet et, en espèces, ce qui lui est réellement rendu.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Somme remise</label>
                    <div className="relative">
                      <input
                        className="input h-11 pr-16 text-base font-bold"
                        type="number"
                        min="0"
                        step="1"
                        value={payment}
                        onChange={(e) => setPayment(e.target.value)}
                        placeholder="0"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        FCFA
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Montant réellement remis par le client.
                    </p>
                  </div>

                  <div>
                    <label className="label">Mode de paiement</label>
                    <select
                      className="input h-11"
                      value={method}
                      onChange={(e) => {
                        setMethod(e.target.value);
                        if (e.target.value !== "CASH") setChangeReturned("");
                      }}
                    >
                      <option value="CASH">Espèces</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="MTN_MONEY">MTN Money</option>
                      <option value="MOOV_MONEY">Moov Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="CARD">Carte</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>

                {given > 0 && given < total && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-black text-amber-700">Paiement partiel</p>
                    <p className="mt-1 text-[11px] text-amber-700">
                      Encaissé : <strong>{fcfa(paid)}</strong> · Reste à payer : <strong>{fcfa(remaining)}</strong>.
                    </p>
                  </div>
                )}

                {method === "CASH" && changeDue > 0 && (
                  <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                          Monnaie totale due
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-700">
                          Le client doit recevoir {fcfa(changeDue)}.
                        </p>
                      </div>
                      <strong className="text-lg font-black text-emerald-700">
                        {fcfa(changeDue)}
                      </strong>
                    </div>

                    <div>
                      <label className="label">Monnaie remise au client</label>
                      <div className="relative">
                        <input
                          className="input h-11 pr-16 text-base font-bold"
                          type="number"
                          min="0"
                          max={changeDue}
                          step="1"
                          value={changeReturned}
                          onChange={(e) => setChangeReturned(e.target.value)}
                          placeholder="0"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          FCFA
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setChangeReturned(String(changeDue))}
                        >
                          Remettre toute la monnaie
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                          onClick={() => setChangeReturned("0")}
                        >
                          Ne rien remettre
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white/80 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Remise effectuée</p>
                        <p className="mt-1 text-sm font-black text-slate-800">{fcfa(returned)}</p>
                      </div>
                      <div className={`rounded-xl border bg-white/80 px-3 py-2.5 ${changeRemaining > 0 ? "border-amber-200" : "border-white"}`}>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Reste à remettre</p>
                        <p className={`mt-1 text-sm font-black ${changeRemaining > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                          {fcfa(changeRemaining)}
                        </p>
                      </div>
                    </div>

                    {changeRemaining > 0 && (
                      <p className="text-[10px] leading-5 text-amber-700">
                        Une partie de la monnaie reste due au client. Elle devra être suivie comme montant à remettre, et non comme dépense.
                      </p>
                    )}
                  </div>
                )}

                {given === 0 && total > 0 && (
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                    <p className="text-xs font-black text-cyan-800">Aucun paiement enregistré</p>
                    <p className="mt-1 text-[11px] text-cyan-700">
                      Le total reste à payer : <strong>{fcfa(total)}</strong>.
                    </p>
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
                    <span className="font-bold text-slate-700">Monnaie totale due</span>
                    <b className={changeDue > 0 ? "text-emerald-600" : "text-slate-400"}>
                      {fcfa(changeDue)}
                    </b>
                  </div>

                  {changeDue > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monnaie remise</span>
                        <b>{fcfa(returned)}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reste à remettre</span>
                        <b className={changeRemaining > 0 ? "text-amber-600" : "text-green-600"}>
                          {fcfa(changeRemaining)}
                        </b>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    total <= 0 ||
                    loading ||
                    (!clientId && !newClientMode)
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
