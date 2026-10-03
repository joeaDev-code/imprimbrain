"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fcfa } from "@/lib/money";

type PaymentFormProps = {
  orderId: string;
  remaining: number;
};

export function PaymentForm({
  orderId,
  remaining,
}: PaymentFormProps) {
  const [givenAmount, setGivenAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const given =
    givenAmount.trim() === "" ? 0 : Number(givenAmount);

  const paymentAmount = Math.min(
    Math.max(Number.isFinite(given) ? given : 0, 0),
    remaining,
  );

  const change =
    method === "CASH"
      ? Math.max(0, given - remaining)
      : 0;

  const newRemaining = Math.max(
    0,
    remaining - paymentAmount,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!Number.isFinite(given) || given <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: paymentAmount,
          method,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ||
            "Impossible d'enregistrer le paiement.",
        );
        return;
      }

      setGivenAmount("");
      router.refresh();
    } catch {
      setError(
        "Une erreur est survenue lors de l'enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (remaining <= 0) {
    return <span className="badge badge-ok">Soldé</span>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 print:hidden">
      <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_180px_auto] md:items-end">
        <div>
          <label className="label">Somme remise</label>
          <div className="relative">
            <input
              className="input h-11 pr-16 text-base font-bold"
              type="number"
              min="0"
              step="1"
              value={givenAmount}
              onChange={(e) => setGivenAmount(e.target.value)}
              placeholder={String(remaining)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              FCFA
            </span>
          </div>
        </div>

        <div>
          <label className="label">Mode</label>
          <select
            className="input h-11"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
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

        <button
          type="submit"
          disabled={saving || given <= 0}
          className="btn btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Encaisser"}
        </button>
      </div>

      {given > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Reste avant paiement
            </p>
            <p className="mt-1 text-sm font-black text-slate-800">
              {fcfa(remaining)}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-wide text-cyan-600">
              Montant encaissé
            </p>
            <p className="mt-1 text-sm font-black text-cyan-700">
              {fcfa(paymentAmount)}
            </p>
          </div>

          <div
            className={
              change > 0
                ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            }
          >
            <p
              className={
                change > 0
                  ? "text-[9px] font-black uppercase tracking-wide text-emerald-600"
                  : "text-[9px] font-black uppercase tracking-wide text-slate-400"
              }
            >
              {change > 0
                ? "Monnaie à rendre"
                : "Reste après paiement"}
            </p>
            <p
              className={
                change > 0
                  ? "mt-1 text-sm font-black text-emerald-700"
                  : "mt-1 text-sm font-black text-slate-800"
              }
            >
              {change > 0
                ? fcfa(change)
                : fcfa(newRemaining)}
            </p>
          </div>
        </div>
      )}

      {given > 0 && given < remaining && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-black text-amber-800">
            Paiement partiel
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            Il restera <strong>{fcfa(newRemaining)}</strong> à payer après cet encaissement.
          </p>
        </div>
      )}

      {change > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black text-emerald-800">
            Monnaie à rendre au client
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Le client a remis <strong>{fcfa(given)}</strong> pour un reste de{" "}
            <strong>{fcfa(remaining)}</strong>. Vous devez lui rendre{" "}
            <strong>{fcfa(change)}</strong>.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}
    </form>
  );
}
