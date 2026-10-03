import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";
import { requireOrgUser } from "@/lib/security";
import { db } from "@/lib/prisma";

export default async function Dashboard() {
  const u = await requireOrgUser("DASHBOARD_VIEW");

  const organizationId = u.organizationId!;

  const now = new Date();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  );

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const [
    payments,
    expenses,
    orders,
    monthOrders,
    todayOrders,
    stock,
    clientsCount,
    servicesCount,
  ] = await Promise.all([
    db.payment.findMany({
      where: {
        order: {
          organizationId,
        },
        paidAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),

    db.expense.findMany({
      where: {
        organizationId,
        spentAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),

    db.order.findMany({
      where: {
        organizationId,
      },
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),

    db.order.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      include: {
        payments: true,
      },
    }),

    db.order.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    }),

    db.stockItem.findMany({
      where: {
        organizationId,
        active: true,
      },
      orderBy: {
        quantity: "asc",
      },
    }),

    db.client.count({
      where: {
        organizationId,
      },
    }),

    db.service.count({
      where: {
        organizationId,
        active: true,
      },
    }),
  ]);

  const encaissé = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const dépenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  const résultat = encaissé - dépenses;

  const resteAPercevoir = monthOrders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => {
      const total = Number(order.total);

      const paid = order.payments.reduce(
        (paymentSum, payment) =>
          paymentSum + Number(payment.amount),
        0,
      );

      return sum + Math.max(0, total - paid);
    }, 0);

  const activeOrders = monthOrders.filter(
    (order) => order.status !== "CANCELLED",
  );

  const cancelledOrders = monthOrders.filter(
    (order) => order.status === "CANCELLED",
  );

  const lowStock = stock.filter(
    (item) =>
      Number(item.quantity) <= Number(item.minThreshold),
  );

  const totalStockValue = stock.reduce(
    (sum, item) =>
      sum + Number(item.quantity) * Number(item.unitCost),
    0,
  );

  const monthLabel = now.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const todayLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const metrics = [
    {
      label: "Encaissé ce mois",
      value: fcfa(encaissé),
      icon: CreditCard,
      description: `${payments.length} paiement(s)`,
      tone: "cyan",
    },
    {
      label: "Dépenses du mois",
      value: fcfa(dépenses),
      icon: Receipt,
      description: `${expenses.length} dépense(s)`,
      tone: "orange",
    },
    {
      label: "Résultat",
      value: fcfa(résultat),
      icon: Wallet,
      description:
        résultat >= 0 ? "Solde positif" : "Solde négatif",
      tone: résultat >= 0 ? "green" : "red",
    },
    {
      label: "Reste à percevoir",
      value: fcfa(resteAPercevoir),
      icon: ArrowDownRight,
      description: "Commandes du mois",
      tone: "blue",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue opérationnelle de votre imprimerie"
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f4c81] via-[#096e9f] to-cyan-600 p-5 text-white shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-blue-900/20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-100">
                  Activité de l'imprimerie
                </span>
              </div>

              <h2 className="text-xl font-black md:text-2xl">
                Bonjour, administrateur 👋
              </h2>

              <p className="mt-1 text-sm text-white/70">
                Voici l'état de votre activité pour{" "}
                {monthLabel}.
              </p>
            </div>

            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur">
              {todayLabel}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(
              ({
                label,
                value,
                icon: Icon,
                description,
              }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.10] p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white/65">
                      {label}
                    </span>

                    <Icon
                      size={15}
                      className="text-white/70"
                    />
                  </div>

                  <p className="mt-2 text-lg font-black">
                    {value}
                  </p>

                  <p className="mt-1 text-[9px] text-white/50">
                    {description}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* KPI secondaires */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
              <ShoppingCart size={17} />
            </div>

            <span className="text-[10px] font-bold text-green-600">
              +{activeOrders.length}
            </span>
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {activeOrders.length}
          </p>

          <p className="text-[10px] text-slate-500">
            Prestations ce mois
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <Users size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {clientsCount}
          </p>

          <p className="text-[10px] text-slate-500">
            Clients enregistrés
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <Package size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {servicesCount}
          </p>

          <p className="text-[10px] text-slate-500">
            Services actifs
          </p>
        </div>

        <div className="card p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <Boxes size={17} />
          </div>

          <p className="mt-3 text-xl font-black text-slate-900">
            {lowStock.length}
          </p>

          <p className="text-[10px] text-slate-500">
            Articles sous le seuil
          </p>
        </div>
      </section>

      {/* Activité + stock */}
      <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        {/* Activité récente */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Activité récente
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Dernières prestations enregistrées
              </p>
            </div>

            <Link
              href="/admin/prestations"
              className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"
            >
              Voir tout →
            </Link>
          </div>

          {orders.length ? (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => {
                const total = Number(order.total);

                const paid = order.payments.reduce(
                  (sum, payment) =>
                    sum + Number(payment.amount),
                  0,
                );

                const remaining = Math.max(0, total - paid);

                const cancelled =
                  order.status === "CANCELLED";

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          cancelled
                            ? "bg-red-50 text-red-500"
                            : "bg-cyan-50 text-cyan-600",
                        ].join(" ")}
                      >
                        <ClipboardList size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">
                          Prestation #{order.id.slice(-6)}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {new Date(
                            order.createdAt,
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800">
                        {fcfa(total)}
                      </p>

                      <span
                        className={[
                          "text-[9px] font-bold",
                          cancelled
                            ? "text-red-500"
                            : remaining > 0
                              ? "text-amber-600"
                              : "text-green-600",
                        ].join(" ")}
                      >
                        {cancelled
                          ? "Annulée"
                          : remaining > 0
                            ? `Reste ${fcfa(remaining)}`
                            : "Payée"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <ClipboardList
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Aucune prestation récente
              </p>
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Stock à surveiller
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Articles proches ou sous le seuil
              </p>
            </div>

            <Link
              href="/admin/stock"
              className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"
            >
              Gérer →
            </Link>
          </div>

          <div className="p-4">
            {lowStock.length ? (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((item) => {
                  const quantity = Number(item.quantity);
                  const threshold = Number(
                    item.minThreshold,
                  );

                  const critical = quantity <= threshold;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-amber-600 shadow-sm">
                            <Boxes size={14} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-800">
                              {item.name}
                            </p>

                            <p className="text-[9px] text-slate-400">
                              Seuil : {threshold} {item.unit}
                            </p>
                          </div>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-1 text-[9px] font-bold",
                            critical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600",
                          ].join(" ")}
                        >
                          {quantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-green-50 p-5 text-center">
                <div className="mx-auto grid size-9 place-items-center rounded-full bg-white text-green-600 shadow-sm">
                  <ArrowUpRight size={17} />
                </div>

                <p className="mt-2 text-xs font-bold text-green-800">
                  Stock sous contrôle
                </p>

                <p className="mt-1 text-[10px] text-green-600">
                  Aucun article sous le seuil défini.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  Valeur du stock
                </p>

                <p className="mt-1 text-sm font-black text-slate-800">
                  {fcfa(totalStockValue)}
                </p>
              </div>

              <Boxes
                size={18}
                className="text-slate-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Résumé opérationnel */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
              <ShoppingCart size={17} />
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-900">
                Aujourd'hui
              </h3>

              <p className="text-[10px] text-slate-400">
                Prestations enregistrées
              </p>
            </div>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-900">
            {todayOrders.length}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-green-50 text-green-600">
              <Wallet size={17} />
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-900">
                Performance
              </h3>

              <p className="text-[10px] text-slate-400">
                Résultat du mois
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-xl font-black text-slate-900">
              {fcfa(résultat)}
            </p>

            {résultat >= 0 ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-green-600">
                <ArrowUpRight size={12} />
                Positif
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-600">
                <ArrowDownRight size={12} />
                Négatif
              </span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600">
              <Receipt size={17} />
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-900">
                Annulations
              </h3>

              <p className="text-[10px] text-slate-400">
                Ce mois
              </p>
            </div>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-900">
            {cancelledOrders.length}
          </p>
        </div>
      </section>
    </div>
  );
}