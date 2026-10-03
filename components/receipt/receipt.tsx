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

export function Receipt({
  data,
}: ReceiptProps) {
  const change =
    data.change ??
    (data.cashGiven != null
      ? Math.max(
          0,
          data.cashGiven - data.total,
        )
      : null);

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
              <Image
                src={data.company.logo}
                alt={data.company.name}
                width={80}
                height={80}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-cyan-500 text-xl font-black text-white">
                {data.company.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
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
                  <p>
                    Tél. : {data.company.phone}
                  </p>
                )}

                {data.company.whatsapp && (
                  <p>
                    WhatsApp :{" "}
                    {data.company.whatsapp}
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

      {/* CLIENT */}

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
                WhatsApp :{" "}
                {data.client.whatsapp}
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
            {paymentLabel(
              data.payment.method,
            )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Montant enregistré :{" "}
            <strong>
              {fcfa(data.payment.amount)}
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
              {data.lines.map(
                (line, index) => (
                  <tr
                    key={`${line.service}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {line.service}
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600">
                      {line.quantity}{" "}
                      {line.unit}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-600">
                      {fcfa(line.price)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {fcfa(line.total)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TOTALS */}

      <section className="px-6 pb-6 sm:px-8">
        <div className="ml-auto w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Total
            </span>

            <strong>
              {fcfa(data.total)}
            </strong>
          </div>

          {data.cashGiven != null && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Somme remise
              </span>

              <strong>
                {fcfa(data.cashGiven)}
              </strong>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Montant encaissé
            </span>

            <strong className="text-emerald-600">
              {fcfa(data.paid)}
            </strong>
          </div>

          {change != null &&
            change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Monnaie à rendre
                </span>

                <strong className="text-emerald-600">
                  {fcfa(change)}
                </strong>
              </div>
            )}

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
          Conservez ce reçu pour toute
          demande concernant cette prestation.
        </p>
      </footer>
    </article>
  );
}import Image from "next/image";
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

export function Receipt({
  data,
}: ReceiptProps) {
  const change =
    data.change ??
    (data.cashGiven != null
      ? Math.max(
          0,
          data.cashGiven - data.total,
        )
      : null);

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
              <Image
                src={data.company.logo}
                alt={data.company.name}
                width={80}
                height={80}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-cyan-500 text-xl font-black text-white">
                {data.company.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
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
                  <p>
                    Tél. : {data.company.phone}
                  </p>
                )}

                {data.company.whatsapp && (
                  <p>
                    WhatsApp :{" "}
                    {data.company.whatsapp}
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

      {/* CLIENT */}

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
                WhatsApp :{" "}
                {data.client.whatsapp}
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
            {paymentLabel(
              data.payment.method,
            )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Montant enregistré :{" "}
            <strong>
              {fcfa(data.payment.amount)}
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
              {data.lines.map(
                (line, index) => (
                  <tr
                    key={`${line.service}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {line.service}
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600">
                      {line.quantity}{" "}
                      {line.unit}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-600">
                      {fcfa(line.price)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {fcfa(line.total)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TOTALS */}

      <section className="px-6 pb-6 sm:px-8">
        <div className="ml-auto w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Total
            </span>

            <strong>
              {fcfa(data.total)}
            </strong>
          </div>

          {data.cashGiven != null && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Somme remise
              </span>

              <strong>
                {fcfa(data.cashGiven)}
              </strong>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Montant encaissé
            </span>

            <strong className="text-emerald-600">
              {fcfa(data.paid)}
            </strong>
          </div>

          {change != null &&
            change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Monnaie à rendre
                </span>

                <strong className="text-emerald-600">
                  {fcfa(change)}
                </strong>
              </div>
            )}

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
          Conservez ce reçu pour toute
          demande concernant cette prestation.
        </p>
      </footer>
    </article>
  );
}