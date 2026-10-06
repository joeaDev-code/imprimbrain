import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Eye,
  Plus,
  Receipt,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireOrgUser } from "@/lib/security";
import { db } from "@/lib/prisma";
import { fcfa } from "@/lib/money";
import type { CTRole } from "@/lib/ct-access";

export default async function Prestations({ baseHref, ctRole }: { baseHref: string; ctRole: CTRole }) {
  const u = await requireOrgUser("ORDERS_VIEW");

  const rows = await db.order.findMany({
    where: {
      organizationId: u.organizationId!,
    },
    include: {
      client: true,
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  const totalAmount = rows.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  const totalPaid = rows.reduce(
    (sum, order) =>
      sum +
      order.payments.reduce(
        (paymentSum, payment) =>
          paymentSum + Number(payment.amount),
        0,
      ),
    0,
  );

  const totalRemaining = Math.max(0, totalAmount - totalPaid);

  const pendingCount = rows.filter(
    (order) => {
      const paid = order.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      return (
        order.status !== "CANCELLED" &&
        Number(order.total) - paid > 0
      );
    },
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        ctRole={ctRole}
        title="Prestations"
        subtitle={`${rows.length} prestation${rows.length > 1 ? "s" : ""} enregistrée${rows.length > 1 ? "s" : ""}`}
      />

      {/* Résumé */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
              <ClipboardList size={17} />
            </div>

            <span className="text-[9px] font-bold uppercase text-slate-400">
              Total
            </span>
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {rows.length}
          </p>

          <p className="text-[10px] text-slate-500">
            Prestations enregistrées
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <Receipt size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {fcfa(totalAmount)}
          </p>

          <p className="text-[10px] text-slate-500">
            Montant total
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-green-50 text-green-600">
            <ArrowUpRight size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {fcfa(totalPaid)}
          </p>

          <p className="text-[10px] text-slate-500">
            Montant encaissé
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <ArrowDownRight size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {fcfa(totalRemaining)}
          </p>

          <p className="text-[10px] text-slate-500">
            Reste à percevoir · {pendingCount}
          </p>
        </div>
      </section>

      {/* Barre d'outils */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400">
          <Search size={16} />

          <span className="text-[11px]">
            Rechercher une prestation, une référence ou un client...
          </span>
        </div>

        <Link
          href={`${baseHref}/prestations/nouveau`}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-[11px] font-bold text-white shadow-sm transition hover:bg-cyan-600"
        >
          <Plus size={16} />
          Nouvelle prestation
        </Link>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Toutes les prestations
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Historique des prestations de votre imprimerie
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
            {rows.length} résultat{rows.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table min-w-[850px]">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Total</th>
                <th>Payé</th>
                <th>Reste</th>
                <th>Statut</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((order) => {
                const paid = order.payments.reduce(
                  (sum, payment) =>
                    sum + Number(payment.amount),
                  0,
                );

                const total = Number(order.total);
                const remaining = Math.max(0, total - paid);

                const cancelled =
                  order.status === "CANCELLED";

                const fullyPaid =
                  !cancelled && remaining === 0;

                return (
                  <tr
                    key={order.id}
                    className="group"
                  >
                    {/* Référence */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "grid size-8 shrink-0 place-items-center rounded-lg",
                            cancelled
                              ? "bg-red-50 text-red-500"
                              : "bg-cyan-50 text-cyan-600",
                          ].join(" ")}
                        >
                          <ClipboardList size={14} />
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {order.ref}
                          </p>

                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {new Date(
                              order.createdAt,
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td>
                      <div className="max-w-[180px]">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {order.client?.name ||
                            "Client comptoir"}
                        </p>

                        {order.client?.phoneEncrypted && (
                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {order.client.phoneEncrypted}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td>
                      <span className="text-xs font-black text-slate-800">
                        {fcfa(total)}
                      </span>
                    </td>

                    {/* Payé */}
                    <td>
                      <span className="text-xs font-semibold text-green-600">
                        {fcfa(paid)}
                      </span>
                    </td>

                    {/* Reste */}
                    <td>
                      <span
                        className={[
                          "text-xs font-bold",
                          remaining > 0
                            ? "text-amber-600"
                            : "text-slate-400",
                        ].join(" ")}
                      >
                        {fcfa(remaining)}
                      </span>
                    </td>

                    {/* Statut */}
                    <td>
                      {cancelled ? (
                        <span className="inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-600">
                          Annulée
                        </span>
                      ) : fullyPaid ? (
                        <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[9px] font-bold text-green-600">
                          Payée
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-600">
                          En attente
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`${baseHref}/prestations/${order.id}`}
                          title="Voir le reçu"
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <Eye size={14} />
                        </Link>

                        <Link
                          href={`${baseHref}/prestations/${order.id}/recu`}
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!rows.length && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-500">
              <ClipboardList size={22} />
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-800">
              Aucune prestation
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              Commencez par enregistrer votre première
              prestation.
            </p>

            <Link
              href={`${baseHref}/prestations/nouveau`}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-[11px] font-bold text-white hover:bg-cyan-600"
            >
              <Plus size={15} />
              Nouvelle prestation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
