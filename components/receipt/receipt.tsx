import Image from "next/image";
import { fcfa } from "@/lib/money";
import type { ReceiptData } from "./receipt.types";

type ReceiptProps = {
  data: ReceiptData;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function paymentLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: "Espèces",
    ORANGE_MONEY: "Orange Money",
    MTN_MONEY: "MTN Money",
    MOOV_MONEY: "Moov Money",
    WAVE: "Wave",
    CARD: "Carte bancaire",
    OTHER: "Autre",
  };

  return labels[method] || method;
}

export function Receipt({ data }: ReceiptProps) {
  const cashGiven = data.cashGiven ?? null;

  const changeDue =
    data.changeDue ??
    data.change ??
    (cashGiven != null
      ? Math.max(0, cashGiven - data.total)
      : 0);

  const changeReturned =
    data.changeReturned ??
    (data.change != null ? data.change : 0);

  const changeRemaining =
    data.changeRemaining ??
    Math.max(0, changeDue - changeReturned);

  return (
    <article
      id="print-receipt"
      className="mx-auto w-full max-w-[820px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* HEADER */}
      <header className="border-b border-slate-200 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {data.company.logo ? (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <Image
                  src={data.company.logo}
                  alt={`Logo ${data.company.name}`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-cyan-500 text-2xl font-black text-white">
                {data.company.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900">
                {data.company.name}
              </h1>

              {data.company.tagline && (
                <p className="mt-1 text-xs text-cyan-600">
                  {data.company.tagline}
                </p>
              )}

              <div className="mt-3 space-y-1 text-[10px] text-slate-500">
                {data.company.address && (
                  <p>{data.company.address}</p>
                )}

                {data.company.phone && (
                  <p>Tél. : {data.company.phone}</p>
                )}

                {data.company.whatsapp && (
                  <p>
                    WhatsApp : {data.company.whatsapp}
                  </p>
                )}

                {data.company.email && (
                  <p>{data.company.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-600">
              Reçu
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
              #{data.reference}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
      </header>

      {/* CLIENT / PAIEMENT */}
      <section className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Client
          </p>

          <p className="mt-1 text-sm font-black text-slate-900">
            {data.client.name}
          </p>

          <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
            {data.client.phone && (
              <p>{data.client.phone}</p>
            )}

            {data.client.whatsapp && (
              <p>
                WhatsApp : {data.client.whatsapp}
              </p>
            )}

            {data.client.email && (
              <p>{data.client.email}</p>
            )}
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Paiement
          </p>

          <p className="mt-1 text-sm font-black text-slate-900">
            {paymentLabel(data.payment.method)}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Mode :{" "}
            <strong>
              {paymentLabel(data.payment.method)}
            </strong>
          </p>
        </div>
      </section>

      {/* SERVICES */}
      <section className="px-6 py-5 sm:px-8">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Service
                </th>

                <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Qté
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Prix
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wide text-slate-500">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {data.lines.map((line, index) => (
                <tr
                  key={`${line.service}-${index}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {line.service}
                  </td>

                  <td className="px-4 py-3 text-center text-slate-600">
                    {line.quantity} {line.unit}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    {fcfa(line.price)}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {fcfa(line.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAIEMENT / ACOMPTE / MONNAIE */}
      <section className="px-6 pb-6 sm:px-8">
        <div className="ml-auto w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Total prestation
            </span>

            <strong>
              {fcfa(data.total)}
            </strong>
          </div>

          {/* Somme réellement remise */}
          {cashGiven != null && cashGiven > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Somme remise
              </span>

              <strong>
                {fcfa(cashGiven)}
              </strong>
            </div>
          )}

          {/* Montant encaissé */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Montant encaissé
            </span>

            <strong className="text-emerald-600">
              {fcfa(data.paid)}
            </strong>
          </div>

          {/* ACOMPTE / reste */}
          {data.paid > 0 && data.paid < data.total && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wide text-amber-700">
                    Acompte enregistré
                  </p>

                  <p className="mt-1 text-[10px] text-amber-700">
                    Une partie de la prestation a été réglée.
                  </p>
                </div>

                <strong className="text-sm font-black text-amber-700">
                  {fcfa(data.paid)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between border-t border-amber-200 pt-2 text-xs">
                <span className="font-semibold text-amber-700">
                  Reste à payer
                </span>

                <strong className="text-amber-700">
                  {fcfa(data.remaining)}
                </strong>
              </div>
            </div>
          )}

          {/* MONNAIE */}
          {changeDue > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-wide text-emerald-700">
                Monnaie
              </p>

              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">
                    Monnaie totale due
                  </span>

                  <strong className="text-emerald-700">
                    {fcfa(changeDue)}
                  </strong>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">
                    Monnaie remise
                  </span>

                  <strong>
                    {fcfa(changeReturned)}
                  </strong>
                </div>

                {changeRemaining > 0 && (
                  <div className="flex justify-between border-t border-emerald-200 pt-2 text-xs">
                    <span className="font-semibold text-amber-700">
                      Reste à remettre
                    </span>

                    <strong className="text-amber-700">
                      {fcfa(changeRemaining)}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SOLDE */}
          <div className="flex justify-between border-t border-slate-200 pt-3">
            <span className="font-black text-slate-800">
              Reste à payer
            </span>

            <strong
              className={
                data.remaining > 0
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            >
              {fcfa(data.remaining)}
            </strong>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-center sm:px-8">
        <p className="text-xs font-bold text-slate-700">
          Merci pour votre confiance.
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          Conservez ce reçu pour toute demande concernant cette prestation.
        </p>
      </footer>
    </article>
  );
}