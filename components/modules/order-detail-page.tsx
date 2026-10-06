
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  Clock3,
  CreditCard,
  FileText,
  History,
  Package,
  Pencil,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  ShoppingBag,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ReceiptModal } from "@/components/receipt/receipt-modal";
import type { ReceiptData } from "@/components/receipt/receipt.types";

type PaymentMethod =
  | "CASH"
  | "ORANGE_MONEY"
  | "MTN_MONEY"
  | "MOOV_MONEY"
  | "WAVE"
  | "CARD"
  | "OTHER"
  | string;

type OrderLine = {
  id: string;
  serviceId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type OrderPayment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
};

type StockMovement = {
  id: string;
  stockItemId: string;
  kind: string;
  quantity: number;
  reason: string | null;
};

type DebtEntry = {
  id: string;
  kind: string;
  amount: number;
  method: PaymentMethod | null;
};

type DebtAccount = {
  id: string;
  type: string;
  status: string;
  originalAmount: number;
  balance: number;
  orderId: string | null;
  clientId: string | null;
  counterpartyName: string | null;
  label: string;
  entries: DebtEntry[];
};

type Audit = {
  action: string;
  metadata: unknown;
};

type OrderDetail = {
  id: string;
  ref: string;
  status: string;
  createdAt: string;

  client: {
    id: string | null;
    name: string;
  };

  totals: {
    total: number;
    paid: number;
    remaining: number;
  };

  payment: {
    method: PaymentMethod | null;
    tendered: number | null;
    cashGiven: number | null;
    change: number | null;
    changeDue: number | null;
    changeReturned: number | null;
    changeRemaining: number | null;
    payments: OrderPayment[];
  };

  lines: OrderLine[];

  stock: {
    movements: StockMovement[];
  };

  accounts: {
    receivable: DebtAccount | null;
    changePayable: DebtAccount | null;
  };

  audits: Audit[];
};

type DetailOrderPageProps = {
  orderId: string;
  backHref: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Espèces",
  ORANGE_MONEY: "Orange Money",
  MTN_MONEY: "MTN Money",
  MOOV_MONEY: "Moov Money",
  WAVE: "Wave",
  CARD: "Carte bancaire",
  OTHER: "Autre",
};

const DEBT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  PARTIAL: "Partiel",
  SETTLED: "Soldé",
  CANCELLED: "Annulé",
};

function formatMoney(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${new Intl.NumberFormat("fr-FR").format(value)} F CFA`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function getStatusClass(status: string) {
  switch (status) {
    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "PENDING":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getPaymentLabel(method: PaymentMethod | null) {
  if (!method) {
    return "Non renseigné";
  }

  return PAYMENT_LABELS[method] ?? method;
}

function getMovementLabel(kind: string) {
  switch (kind) {
    case "OUT":
      return "Sortie";

    case "IN":
      return "Entrée";

    default:
      return kind;
  }
}

function getDebtStatusLabel(status: string) {
  return DEBT_STATUS_LABELS[status] ?? status;
}

function getMetadataValue(
  metadata: unknown,
  key: string,
) {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  const value = (
    metadata as Record<string, unknown>
  )[key];

  return value ?? null;
}

function MetadataValue({
  value,
}: {
  value: unknown;
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return <span>—</span>;
  }

  if (typeof value === "number") {
    return <span>{formatMoney(value)}</span>;
  }

  if (typeof value === "boolean") {
    return <span>{value ? "Oui" : "Non"}</span>;
  }

  if (typeof value === "string") {
    return <span>{value}</span>;
  }

  return (
    <span className="break-all">
      {JSON.stringify(value)}
    </span>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#173b68]">
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 text-sm font-black text-slate-800">
        {value}
      </div>
    </div>
  );
}

export default function DetailOrderPage({
  orderId,
  backHref,
}: DetailOrderPageProps) {
  const router = useRouter();

  const [order, setOrder] =
    useState<OrderDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [receiptLoading, setReceiptLoading] =
    useState(false);

  const [receiptOpen, setReceiptOpen] =
    useState(false);

  const [receiptData, setReceiptData] =
    useState<ReceiptData | null>(null);

  const [showAudits, setShowAudits] =
    useState(false);

  const [showStock, setShowStock] =
    useState(false);

  async function loadOrder(
    silent = false,
  ) {
    if (!orderId) {
      toast.error(
        "Identifiant de prestation invalide.",
      );
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de charger la prestation.",
        );
      }

      setOrder(data as OrderDetail);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger la prestation.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const paymentProgress = useMemo(() => {
    if (!order || order.totals.total <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (order.totals.paid /
          order.totals.total) *
          100,
      ),
    );
  }, [order]);

  async function openReceipt() {
    if (!order) {
      return;
    }

    try {
      setReceiptLoading(true);

      const response = await fetch(
        `/api/receipts/${encodeURIComponent(
          order.id,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de charger le reçu.",
        );
      }

      setReceiptData(data as ReceiptData);
      setReceiptOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger le reçu.",
      );
    } finally {
      setReceiptLoading(false);
    }
  }

  async function cancelOrder() {
    if (!order) {
      return;
    }

    if (order.status === "CANCELLED") {
      toast.info(
        "Cette prestation est déjà annulée.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment annuler la prestation ${order.ref} ?\n\nCette action modifiera le statut de la commande et restaurera les mouvements de stock concernés.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      const response = await fetch(
        "/api/orders",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: order.id,
            status: "CANCELLED",
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'annuler la prestation.",
        );
      }

      toast.success(
        "Prestation annulée avec succès.",
      );

      await loadOrder(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'annuler la prestation.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-5">
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-60 animate-pulse rounded-2xl bg-slate-100" />
          </div>

          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-500">
            <CircleAlert size={24} />
          </div>

          <h2 className="mt-4 text-base font-black text-slate-900">
            Prestation introuvable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            La prestation demandée n'existe pas ou
            n'est plus accessible.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(backHref)
            }
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#173b68] px-4 text-sm font-bold text-white transition hover:bg-[#123055]"
          >
            <ArrowLeft size={16} />
            Retour aux prestations
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* =====================================================
            EN-TÊTE
        ====================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() =>
                  router.push(backHref)
                }
                className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-[#173b68]"
              >
                <ArrowLeft size={15} />
                Retour aux prestations
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#173b68] text-white shadow-sm">
                  <ClipboardList size={21} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      {order.ref}
                    </h1>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      {getStatusLabel(
                        order.status,
                      )}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {formatDate(
                        order.createdAt,
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={13} />
                      ID : {order.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadOrder(true)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Actualiser
            </button>
          </div>
        </div>

        {/* =====================================================
            GRILLE PRINCIPALE
        ====================================================== */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <main className="min-w-0 space-y-5">
            {/* =================================================
                CLIENT
            ================================================== */}
            <Section
              icon={<UserRound size={17} />}
              title="Client"
              description="Informations associées à cette prestation"
            >
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <InfoItem
                  label="Nom"
                  value={order.client.name}
                />

                <InfoItem
                  label="Identifiant client"
                  value={
                    order.client.id ?? (
                      <span className="text-slate-400">
                        Client comptoir
                      </span>
                    )
                  }
                />
              </div>
            </Section>

            {/* =================================================
                PRESTATIONS
            ================================================== */}
            <Section
              icon={<ShoppingBag size={17} />}
              title="Prestations"
              description={`${order.lines.length} ligne${
                order.lines.length > 1
                  ? "s"
                  : ""
              } dans cette commande`}
            >
              <div className="divide-y divide-slate-100">
                {order.lines.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Aucune ligne de prestation.
                  </div>
                ) : (
                  order.lines.map(
                    (line, index) => (
                      <div
                        key={line.id}
                        className="p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800">
                                {line.label}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                <span>
                                  Service :{" "}
                                  <strong className="text-slate-600">
                                    {
                                      line.serviceId
                                    }
                                  </strong>
                                </span>

                                <span>
                                  Quantité :{" "}
                                  <strong className="text-slate-600">
                                    {
                                      line.quantity
                                    }
                                  </strong>
                                </span>

                                <span>
                                  Prix unitaire :{" "}
                                  <strong className="text-slate-600">
                                    {formatMoney(
                                      line.unitPrice,
                                    )}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-base font-black text-slate-900">
                              {formatMoney(
                                line.total,
                              )}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              Total de la ligne
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">
                    Total de la commande
                  </span>

                  <span className="text-xl font-black text-[#173b68]">
                    {formatMoney(
                      order.totals.total,
                    )}
                  </span>
                </div>
              </div>
            </Section>

            {/* =================================================
                SYNTHÈSE FINANCIÈRE
            ================================================== */}
            <Section
              icon={<WalletCards size={17} />}
              title="Situation financière"
              description="État global du paiement de la commande"
            >
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoItem
                    label="Total"
                    value={formatMoney(
                      order.totals.total,
                    )}
                  />

                  <InfoItem
                    label="Payé"
                    value={
                      <span className="text-emerald-700">
                        {formatMoney(
                          order.totals.paid,
                        )}
                      </span>
                    }
                  />

                  <InfoItem
                    label="Reste à payer"
                    value={
                      <span
                        className={
                          order.totals.remaining >
                          0
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }
                      >
                        {formatMoney(
                          order.totals.remaining,
                        )}
                      </span>
                    }
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Progression du paiement
                    </span>

                    <span className="text-xs font-black text-slate-700">
                      {paymentProgress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${paymentProgress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* =================================================
                PAIEMENT
            ================================================== */}
            <Section
              icon={<CreditCard size={17} />}
              title="Paiement"
              description="Détails du paiement et de la monnaie"
            >
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem
                    label="Mode de paiement"
                    value={getPaymentLabel(
                      order.payment.method,
                    )}
                  />

                  <InfoItem
                    label="Montant remis"
                    value={formatMoney(
                      order.payment.tendered,
                    )}
                  />

                  <InfoItem
                    label="Montant payé"
                    value={formatMoney(
                      order.totals.paid,
                    )}
                  />

                  <InfoItem
                    label="Monnaie"
                    value={formatMoney(
                      order.payment.change,
                    )}
                  />

                  <InfoItem
                    label="Monnaie due"
                    value={formatMoney(
                      order.payment.changeDue,
                    )}
                  />

                  <InfoItem
                    label="Monnaie rendue"
                    value={formatMoney(
                      order.payment.changeReturned,
                    )}
                  />

                  <InfoItem
                    label="Monnaie restante"
                    value={formatMoney(
                      order.payment.changeRemaining,
                    )}
                  />

                  <InfoItem
                    label="Cash donné"
                    value={formatMoney(
                      order.payment.cashGiven,
                    )}
                  />
                </div>
              </div>

              {/* HISTORIQUE PAIEMENTS */}
              <div className="border-t border-slate-100">
                <div className="px-5 py-4">
                  <h3 className="text-xs font-black text-slate-800">
                    Historique des paiements
                  </h3>
                </div>

                {order.payment.payments.length ===
                0 ? (
                  <div className="px-5 pb-5 text-sm text-slate-400">
                    Aucun paiement enregistré.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left">
                      <thead>
                        <tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-3 font-bold">
                            Date
                          </th>
                          <th className="px-5 py-3 font-bold">
                            Méthode
                          </th>
                          <th className="px-5 py-3 text-right font-bold">
                            Montant
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {order.payment.payments.map(
                          (payment) => (
                            <tr
                              key={payment.id}
                              className="border-b border-slate-50 last:border-0"
                            >
                              <td className="px-5 py-3 text-xs text-slate-600">
                                {formatDate(
                                  payment.paidAt,
                                )}
                              </td>

                              <td className="px-5 py-3 text-xs font-bold text-slate-700">
                                {
                                  getPaymentLabel(
                                    payment.method,
                                  )
                                }
                              </td>

                              <td className="px-5 py-3 text-right text-xs font-black text-slate-900">
                                {formatMoney(
                                  payment.amount,
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Section>

            {/* =================================================
                ORO
            ================================================== */}
            <Section
              icon={<Banknote size={17} />}
              title="Comptes ORO"
              description="Créances et monnaie à remettre associées à la commande"
            >
              <div className="grid gap-4 p-5 lg:grid-cols-2">
                {/* RECEIVABLE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        Créance client
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        RECEIVABLE
                      </p>
                    </div>

                    {order.accounts
                      .receivable && (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-black text-slate-600">
                        {getDebtStatusLabel(
                          order.accounts
                            .receivable.status,
                        )}
                      </span>
                    )}
                  </div>

                  {order.accounts
                    .receivable ? (
                    <div className="mt-4 space-y-3">
                      <InfoItem
                        label="Montant initial"
                        value={formatMoney(
                          order.accounts
                            .receivable
                            .originalAmount,
                        )}
                      />

                      <InfoItem
                        label="Solde"
                        value={formatMoney(
                          order.accounts
                            .receivable
                            .balance,
                        )}
                      />

                      {order.accounts
                        .receivable
                        .entries.length >
                        0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Écritures
                          </p>

                          <div className="space-y-2">
                            {order.accounts.receivable.entries.map(
                              (entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                                >
                                  <span className="text-[10px] font-bold text-slate-600">
                                    {
                                      entry.kind
                                    }
                                  </span>

                                  <span className="text-xs font-black text-slate-800">
                                    {formatMoney(
                                      entry.amount,
                                    )}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">
                      Aucun compte de créance associé.
                    </p>
                  )}
                </div>

                {/* PAYABLE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        Monnaie à remettre
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        PAYABLE
                      </p>
                    </div>

                    {order.accounts
                      .changePayable && (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-black text-slate-600">
                        {getDebtStatusLabel(
                          order.accounts
                            .changePayable.status,
                        )}
                      </span>
                    )}
                  </div>

                  {order.accounts
                    .changePayable ? (
                    <div className="mt-4 space-y-3">
                      <InfoItem
                        label="Montant initial"
                        value={formatMoney(
                          order.accounts
                            .changePayable
                            .originalAmount,
                        )}
                      />

                      <InfoItem
                        label="Solde à remettre"
                        value={formatMoney(
                          order.accounts
                            .changePayable
                            .balance,
                        )}
                      />

                      {order.accounts
                        .changePayable
                        .entries.length >
                        0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Écritures
                          </p>

                          <div className="space-y-2">
                            {order.accounts.changePayable.entries.map(
                              (entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                                >
                                  <span className="text-[10px] font-bold text-slate-600">
                                    {
                                      entry.kind
                                    }
                                  </span>

                                  <span className="text-xs font-black text-slate-800">
                                    {formatMoney(
                                      entry.amount,
                                    )}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">
                      Aucune monnaie à remettre enregistrée.
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* =================================================
                STOCK
            ================================================== */}
            <Section
              icon={<Package size={17} />}
              title="Mouvements de stock"
              description={`${order.stock.movements.length} mouvement${
                order.stock.movements.length >
                1
                  ? "s"
                  : ""
              } associé${
                order.stock.movements.length >
                1
                  ? "s"
                  : ""
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setShowStock(
                    (value) => !value,
                  )
                }
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="text-xs font-bold text-slate-600">
                  {showStock
                    ? "Masquer les mouvements"
                    : "Afficher les mouvements"}
                </span>

                {showStock ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {showStock && (
                <div className="border-t border-slate-100">
                  {order.stock.movements.length ===
                  0 ? (
                    <div className="p-5 text-sm text-slate-400">
                      Aucun mouvement de stock.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 font-bold">
                              Article
                            </th>
                            <th className="px-5 py-3 font-bold">
                              Mouvement
                            </th>
                            <th className="px-5 py-3 font-bold">
                              Quantité
                            </th>
                            <th className="px-5 py-3 font-bold">
                              Motif
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {order.stock.movements.map(
                            (movement) => (
                              <tr
                                key={
                                  movement.id
                                }
                                className="border-b border-slate-50 last:border-0"
                              >
                                <td className="px-5 py-3 text-xs font-bold text-slate-700">
                                  {
                                    movement.stockItemId
                                  }
                                </td>

                                <td className="px-5 py-3">
                                  <span
                                    className={`rounded-full border px-2 py-1 text-[9px] font-black ${
                                      movement.kind ===
                                      "OUT"
                                        ? "border-orange-200 bg-orange-50 text-orange-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {getMovementLabel(
                                      movement.kind,
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-3 text-xs font-black text-slate-800">
                                  {
                                    movement.quantity
                                  }
                                </td>

                                <td className="px-5 py-3 text-xs text-slate-500">
                                  {movement.reason ??
                                    "—"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* =================================================
                AUDITS
            ================================================== */}
            <Section
              icon={<History size={17} />}
              title="Historique technique"
              description="Événements enregistrés pour cette commande"
            >
              <button
                type="button"
                onClick={() =>
                  setShowAudits(
                    (value) => !value,
                  )
                }
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="text-xs font-bold text-slate-600">
                  {showAudits
                    ? "Masquer l'historique"
                    : `Afficher ${order.audits.length} événement${
                        order.audits.length >
                        1
                          ? "s"
                          : ""
                      }`}
                </span>

                {showAudits ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {showAudits && (
                <div className="border-t border-slate-100">
                  {order.audits.length ===
                  0 ? (
                    <div className="p-5 text-sm text-slate-400">
                      Aucun événement enregistré.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {order.audits.map(
                        (audit, index) => (
                          <div
                            key={`${audit.action}-${index}`}
                            className="p-5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                <Clock3
                                  size={15}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800">
                                  {
                                    audit.action
                                  }
                                </p>

                                <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                                  {[
                                    "amount",
                                    "tendered",
                                    "cashGiven",
                                    "change",
                                    "changeDue",
                                    "changeReturned",
                                    "changeRemaining",
                                    "method",
                                    "orderId",
                                  ].map(
                                    (key) => {
                                      const value =
                                        getMetadataValue(
                                          audit.metadata,
                                          key,
                                        );

                                      if (
                                        value ===
                                        null
                                      ) {
                                        return null;
                                      }

                                      return (
                                        <div
                                          key={
                                            key
                                          }
                                          className="flex flex-wrap gap-2"
                                        >
                                          <span className="font-bold text-slate-400">
                                            {
                                              key
                                            }
                                            :
                                          </span>

                                          <MetadataValue
                                            value={
                                              value
                                            }
                                          />
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </Section>
          </main>

          {/* ===================================================
              SIDEBAR ACTIONS
          ==================================================== */}
          <aside className="h-fit xl:sticky xl:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black text-slate-900">
                  Actions
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Gestion de cette prestation
                </p>
              </div>

              <div className="space-y-2 p-4">
                {/* REÇU */}
                <button
                  type="button"
                  onClick={() =>
                    void openReceipt()
                  }
                  disabled={receiptLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-left transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-cyan-600 shadow-sm">
                    <ReceiptText size={17} />
                  </span>

                  <span>
                    <span className="block text-xs font-black text-cyan-800">
                      {receiptLoading
                        ? "Chargement..."
                        : "Voir le reçu"}
                    </span>

                    <span className="mt-0.5 block text-[10px] text-cyan-600">
                      Afficher le reçu complet
                    </span>
                  </span>
                </button>

                {/* MODIFIER */}
                <button
                  type="button"
                  disabled={
                    order.status ===
                    "CANCELLED"
                  }
                  onClick={() =>
                    router.push(
                      `${backHref}/modifier/${encodeURIComponent(
                        order.id,
                      )}`,
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Pencil size={16} />
                  </span>

                  <span>
                    <span className="block text-xs font-black text-slate-800">
                      Modifier
                    </span>

                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Modifier la prestation
                    </span>
                  </span>
                </button>

                {/* ANNULER */}
                <button
                  type="button"
                  disabled={
                    cancelling ||
                    order.status ===
                      "CANCELLED"
                  }
                  onClick={() =>
                    void cancelOrder()
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-red-600 shadow-sm">
                    <XCircle size={17} />
                  </span>

                  <span>
                    <span className="block text-xs font-black text-red-700">
                      {cancelling
                        ? "Annulation..."
                        : order.status ===
                            "CANCELLED"
                          ? "Prestation annulée"
                          : "Annuler la prestation"}
                    </span>

                    <span className="mt-0.5 block text-[10px] text-red-500">
                      {order.status ===
                      "CANCELLED"
                        ? "Déjà annulée"
                        : "Confirmation requise"}
                    </span>
                  </span>
                </button>
              </div>

              {/* RÉSUMÉ */}
              <div className="border-t border-slate-100 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Total
                    </span>

                    <span className="font-black text-slate-800">
                      {formatMoney(
                        order.totals.total,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Payé
                    </span>

                    <span className="font-black text-emerald-600">
                      {formatMoney(
                        order.totals.paid,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="font-bold text-slate-500">
                      Reste
                    </span>

                    <span className="font-black text-amber-600">
                      {formatMoney(
                        order.totals.remaining,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* STATUT */}
              <div className="border-t border-slate-100 p-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  {order.status ===
                  "CANCELLED" ? (
                    <XCircle
                      size={18}
                      className="shrink-0 text-red-500"
                    />
                  ) : (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-500"
                    />
                  )}

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      État actuel
                    </p>

                    <p className="mt-0.5 text-xs font-black text-slate-700">
                      {getStatusLabel(
                        order.status,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* =====================================================
          MODAL REÇU
      ====================================================== */}
      {receiptData && (
        <ReceiptModal
          open={receiptOpen}
          onClose={() =>
            setReceiptOpen(false)
          }
          data={receiptData}
        />
      )}
    </>
  );
}