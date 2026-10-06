import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { db } from '@/lib/prisma';
import { fcfa } from '@/lib/money';
import { requireCTPermission } from '@/lib/security';
import type { Permission } from '@/generated/prisma/client';
import { ctDashboardLinks, dashboardTenantScopes } from '@/lib/ct-dashboard';

export default async function CTHomePage() {
  let user;

  try {
    user = await requireCTPermission('DASHBOARD_VIEW');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      notFound();
    }

    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') {
      notFound();
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      notFound();
    }

    throw error;
  }

  const organizationId = user.organizationId;

  const canView = (permission: Permission) =>
    user.permissions.includes(permission);

  const canViewPayments = canView('PAYMENTS_VIEW');
  const canViewExpenses = canView('EXPENSES_VIEW');
  const canViewOrders = canView('ORDERS_VIEW');
  const canViewStock = canView('STOCK_VIEW');
  const canViewClients = canView('CLIENTS_VIEW');
  const canViewServices = canView('SERVICES_VIEW');

  const links = ctDashboardLinks(user.role);

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

  const scopes = dashboardTenantScopes(
    organizationId,
    monthStart,
    monthEnd,
    todayStart,
    todayEnd,
  );

  const [
    payments,
    expenses,
    recentRows,
    monthRows,
    todayOrders,
    stock,
    clientsCount,
    servicesCount,
  ] = await Promise.all([
    canViewPayments
      ? db.payment.findMany({
          where: scopes.payments,
          select: {
            amount: true,
          },
        })
      : Promise.resolve([]),

    canViewExpenses
      ? db.expense.findMany({
          where: scopes.expenses,
          select: {
            amount: true,
          },
        })
      : Promise.resolve([]),

    canViewOrders
      ? db.order.findMany({
          where: scopes.recentOrders,
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            ...(canViewPayments
              ? {
                  payments: {
                    select: {
                      amount: true,
                    },
                  },
                }
              : {}),
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
        })
      : Promise.resolve([]),

    canViewOrders
      ? db.order.findMany({
          where: scopes.monthOrders,
          select: {
            total: true,
            status: true,
            createdAt: true,
            ...(canViewPayments
              ? {
                  payments: {
                    select: {
                      amount: true,
                    },
                  },
                }
              : {}),
          },
        })
      : Promise.resolve([]),

    canViewOrders
      ? db.order.findMany({
          where: scopes.todayOrders,
          select: {
            id: true,
          },
        })
      : Promise.resolve([]),

    canViewStock
      ? db.stockItem.findMany({
          where: scopes.stock,
          select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
            minThreshold: true,
            unitCost: true,
          },
          orderBy: {
            quantity: 'asc',
          },
        })
      : Promise.resolve([]),

    canViewClients
      ? db.client.count({
          where: scopes.clients,
        })
      : Promise.resolve(null),

    canViewServices
      ? db.service.count({
          where: scopes.services,
        })
      : Promise.resolve(null),
  ]);

  /* =========================================================
     FINANCIAL CALCULATIONS
     ========================================================= */

  const encaissé = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const dépenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  const résultat = encaissé - dépenses;

  const hasPaymentRows = (
    order: object,
  ): order is {
    payments: {
      amount: unknown;
    }[];
  } => 'payments' in order;

  const orders = recentRows.map((order) => ({
    ...order,
    paid: hasPaymentRows(order)
      ? order.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        )
      : null,
  }));

  const monthOrders = monthRows.map((order) => ({
    ...order,
    paid: hasPaymentRows(order)
      ? order.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        )
      : null,
  }));

  const resteAPercevoir = canViewPayments
    ? monthOrders
        .filter((order) => order.status !== 'CANCELLED')
        .reduce(
          (sum, order) =>
            sum +
            Math.max(
              0,
              Number(order.total) - (order.paid ?? 0),
            ),
          0,
        )
    : 0;

  const activeOrders = monthOrders.filter(
    (order) => order.status !== 'CANCELLED',
  );

  const cancelledOrders = monthOrders.filter(
    (order) => order.status === 'CANCELLED',
  );

  const lowStock = stock.filter(
    (item) =>
      Number(item.quantity) <= Number(item.minThreshold),
  );

  const totalStockValue = stock.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) * Number(item.unitCost),
    0,
  );

  const monthLabel = now.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const todayLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /* =========================================================
     PRIMARY METRICS
     ========================================================= */

  const metrics: {
    label: string;
    value: string;
    icon: LucideIcon;
    description: string;
  }[] = [];

  if (canViewPayments) {
    metrics.push({
      label: 'Encaissé ce mois',
      value: fcfa(encaissé),
      icon: CreditCard,
      description: `${payments.length} paiement(s)`,
    });
  }

  if (canViewExpenses) {
    metrics.push({
      label: 'Dépenses du mois',
      value: fcfa(dépenses),
      icon: Receipt,
      description: `${expenses.length} dépense(s)`,
    });
  }

  if (canViewPayments && canViewExpenses) {
    metrics.push({
      label: 'Résultat',
      value: fcfa(résultat),
      icon: Wallet,
      description:
        résultat >= 0 ? 'Solde positif' : 'Solde négatif',
    });
  }

  if (canViewOrders && canViewPayments) {
    metrics.push({
      label: 'Reste à percevoir',
      value: fcfa(resteAPercevoir),
      icon: ArrowDownRight,
      description: 'Commandes du mois',
    });
  }

  /* =========================================================
     SECONDARY CARDS
     ========================================================= */

  const secondaryCards: {
    label: string;
    value: number | null;
    icon: LucideIcon;
    iconClass: string;
    badge?: string;
  }[] = [];

  if (canViewOrders) {
    secondaryCards.push({
      label: 'Prestations ce mois',
      value: activeOrders.length,
      icon: ShoppingCart,
      iconClass: 'bg-cyan-50 text-cyan-600',
      badge: `+${activeOrders.length}`,
    });
  }

  if (canViewClients) {
    secondaryCards.push({
      label: 'Clients enregistrés',
      value: clientsCount,
      icon: Users,
      iconClass: 'bg-blue-50 text-blue-600',
    });
  }

  if (canViewServices) {
    secondaryCards.push({
      label: 'Services actifs',
      value: servicesCount,
      icon: Package,
      iconClass: 'bg-violet-50 text-violet-600',
    });
  }

  if (canViewStock) {
    secondaryCards.push({
      label: 'Articles sous le seuil',
      value: lowStock.length,
      icon: Boxes,
      iconClass: 'bg-amber-50 text-amber-600',
    });
  }

  /* =========================================================
     FINANCIAL CHART
     ========================================================= */

  const financialChart = [
    {
      label: 'Encaissé',
      value: encaissé,
      color: 'bg-cyan-500',
      light: 'bg-cyan-50',
      text: 'text-cyan-600',
    },
    {
      label: 'Dépenses',
      value: dépenses,
      color: 'bg-orange-500',
      light: 'bg-orange-50',
      text: 'text-orange-600',
    },
    {
      label: 'Résultat',
      value: Math.abs(résultat),
      color:
        résultat >= 0
          ? 'bg-emerald-500'
          : 'bg-red-500',
      light:
        résultat >= 0
          ? 'bg-emerald-50'
          : 'bg-red-50',
      text:
        résultat >= 0
          ? 'text-emerald-600'
          : 'text-red-600',
    },
  ];

  const financialMax = Math.max(
    ...financialChart.map((item) => item.value),
    1,
  );

  /* =========================================================
     ORDER STATUS CHART
     ========================================================= */

  const orderStatusChart = [
    {
      label: 'Actives',
      value: activeOrders.length,
      color: 'bg-cyan-500',
      text: 'text-cyan-600',
    },
    {
      label: 'Annulées',
      value: cancelledOrders.length,
      color: 'bg-red-500',
      text: 'text-red-600',
    },
  ];

  const totalOrderStatuses = Math.max(
    orderStatusChart.reduce(
      (sum, item) => sum + item.value,
      0,
    ),
    1,
  );

  /* =========================================================
     WEEKLY ACTIVITY
     ========================================================= */

  const weeklyActivity = [
    {
      label: 'S1',
      value: 0,
    },
    {
      label: 'S2',
      value: 0,
    },
    {
      label: 'S3',
      value: 0,
    },
    {
      label: 'S4',
      value: 0,
    },
    {
      label: 'S5',
      value: 0,
    },
  ];

  monthRows.forEach((order) => {
    const day = new Date(order.createdAt).getDate();

    if (day <= 7) {
      weeklyActivity[0].value += 1;
    } else if (day <= 14) {
      weeklyActivity[1].value += 1;
    } else if (day <= 21) {
      weeklyActivity[2].value += 1;
    } else if (day <= 28) {
      weeklyActivity[3].value += 1;
    } else {
      weeklyActivity[4].value += 1;
    }
  });

  const weeklyMax = Math.max(
    ...weeklyActivity.map((item) => item.value),
    1,
  );

  /* =========================================================
     STOCK CHART
     ========================================================= */

  const stockChart = [...stock]
    .sort(
      (a, b) =>
        Number(a.quantity) - Number(b.quantity),
    )
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      threshold: Number(item.minThreshold),
      unit: item.unit,
      percentage: Math.min(
        100,
        (Number(item.quantity) /
          Math.max(Number(item.minThreshold), 1)) *
          100,
      ),
    }));

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER
          ========================================================= */}


      <div>
        
        <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
          Vue opérationnelle de votre imprimerie
        </p>
      </div>

      {/* =========================================================
          HERO / MAIN KPIS
          ========================================================= */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1f3a] via-[var(--blue)] to-[var(--primary)] p-5 text-white shadow-xl shadow-cyan-900/10 md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-blue-900/30 blur-3xl" />

        <div className="pointer-events-none absolute right-1/4 top-1/3 size-32 rounded-full border-[20px] border-white/5" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-200 shadow-[0_0_0_5px_rgba(103,232,249,0.12)]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-100">
                  Activité de l'imprimerie
                </span>
              </div>

              <h2 className="text-xl font-black md:text-2xl">
                Bonjour, {user.name} 👋
              </h2>

              <p className="mt-1 text-sm text-white/70">
                Voici l'état de votre activité pour {monthLabel}.
              </p>
            </div>

            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur">
              {todayLabel}
            </div>
          </div>

          {metrics.length > 0 && (
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
                    className="rounded-xl border border-white/10 bg-white/[0.10] p-4 backdrop-blur-sm transition hover:bg-white/[0.15]"
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
          )}
        </div>
      </section>

      {/* =========================================================
          SECONDARY KPIs
          ========================================================= */}

      {secondaryCards.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {secondaryCards.map(
            ({
              label,
              value,
              icon: Icon,
              iconClass,
              badge,
            }) => (
              <div
                key={label}
                className="card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`grid size-9 place-items-center rounded-lg ${iconClass}`}
                  >
                    <Icon size={17} />
                  </div>

                  {badge && (
                    <span className="text-[10px] font-bold text-green-600">
                      {badge}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xl font-black text-slate-900">
                  {value}
                </p>

                <p className="text-[10px] text-slate-500">
                  {label}
                </p>
              </div>
            ),
          )}
        </section>
      )}

      {/* =========================================================
          RECENT ACTIVITY + STOCK
          ========================================================= */}

      {(canViewOrders || canViewStock) && (
        <section
          className={`grid gap-5 ${
            canViewOrders && canViewStock
              ? 'lg:grid-cols-[1.55fr_1fr]'
              : 'lg:grid-cols-1'
          }`}
        >
          {/* Recent orders */}
          {canViewOrders && (
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
                  href={links.prestations}
                  className="text-[10px] font-bold text-cyan-600 transition hover:text-cyan-700"
                >
                  Voir tout →
                </Link>
              </div>

              {orders.length ? (
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const total = Number(order.total);

                    const remaining =
                      order.paid === null
                        ? null
                        : Math.max(
                            0,
                            total - order.paid,
                          );

                    const cancelled =
                      order.status === 'CANCELLED';

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                              cancelled
                                ? 'bg-red-50 text-red-500'
                                : 'bg-cyan-50 text-cyan-600'
                            }`}
                          >
                            <ClipboardList size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              Prestation #
                              {order.id.slice(-6)}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {new Date(
                                order.createdAt,
                              ).toLocaleDateString(
                                'fr-FR',
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">
                            {fcfa(total)}
                          </p>

                          <span
                            className={`text-[9px] font-bold ${
                              cancelled
                                ? 'text-red-500'
                                : remaining === null
                                  ? 'text-slate-500'
                                  : remaining > 0
                                    ? 'text-amber-600'
                                    : 'text-green-600'
                            }`}
                          >
                            {cancelled
                              ? 'Annulée'
                              : remaining === null
                                ? 'Enregistrée'
                                : remaining > 0
                                  ? `Reste ${fcfa(
                                      remaining,
                                    )}`
                                  : 'Payée'}
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
          )}

          {/* Stock */}
          {canViewStock && (
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
                  href={links.stock}
                  className="text-[10px] font-bold text-cyan-600 transition hover:text-cyan-700"
                >
                  Gérer →
                </Link>
              </div>

              <div className="p-4">
                {lowStock.length ? (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((item) => {
                      const quantity = Number(
                        item.quantity,
                      );

                      const threshold = Number(
                        item.minThreshold,
                      );

                      const critical =
                        quantity <= threshold;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                                  critical
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-amber-50 text-amber-600'
                                }`}
                              >
                                {critical ? (
                                  <AlertTriangle size={14} />
                                ) : (
                                  <Boxes size={14} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-bold text-slate-800">
                                  {item.name}
                                </p>

                                <p className="text-[9px] text-slate-400">
                                  Seuil : {threshold}{' '}
                                  {item.unit}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                                critical
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-cyan-50 p-5 text-center">
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

                <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      Valeur du stock
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-800">
                      {fcfa(totalStockValue)}
                    </p>
                  </div>

                  <div className="grid size-9 place-items-center rounded-xl bg-white text-[var(--blue)] shadow-sm">
                    <Boxes size={18} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          ANALYTICS
          ========================================================= */}

      {(canViewOrders ||
        (canViewPayments && canViewExpenses) ||
        canViewStock) && (
        <section className="space-y-5">
          {/* Analytics header */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-blue-50 text-[var(--blue)]">
                  <BarChart3 size={16} />
                </div>

                <h2 className="text-sm font-black text-slate-900">
                  Analyse de l'activité
                </h2>
              </div>

              <p className="mt-1 text-[10px] text-slate-400">
                Vue synthétique de votre activité pour{' '}
                {monthLabel}.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Données en temps réel
            </span>
          </div>

          {/* =====================================================
              FINANCIAL + ORDERS
              ===================================================== */}

          <div className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
            {/* Financial performance */}
            {canViewPayments && canViewExpenses && (
              <div className="card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        Performance financière
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Encaissements, dépenses et résultat
                      </p>
                    </div>

                    <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                      <TrendingUp size={17} />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Résultat du mois
                      </p>

                      <p
                        className={`mt-1 text-3xl font-black tracking-tight ${
                          résultat >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {fcfa(résultat)}
                      </p>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                        résultat >= 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {résultat >= 0 ? (
                        <ArrowUpRight size={13} />
                      ) : (
                        <ArrowDownRight size={13} />
                      )}

                      {résultat >= 0
                        ? 'Solde positif'
                        : 'Solde négatif'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-end gap-5">
                    {financialChart.map((item) => {
                      const height =
                        item.value === 0
                          ? 4
                          : Math.max(
                              10,
                              (item.value /
                                financialMax) *
                                150,
                            );

                      return (
                        <div
                          key={item.label}
                          className="min-w-0"
                        >
                          <div className="flex h-[170px] items-end justify-center">
                            <div className="relative flex h-full w-full max-w-[70px] items-end justify-center">
                              <div
                                className={`w-full rounded-t-xl ${item.color} transition-all duration-500`}
                                style={{
                                  height: `${height}px`,
                                }}
                              />

                              <div className="absolute -top-7 whitespace-nowrap text-[9px] font-black text-slate-700">
                                {fcfa(item.value)}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`mt-3 rounded-lg px-2 py-2 text-center ${item.light}`}
                          >
                            <p
                              className={`text-[9px] font-bold ${item.text}`}
                            >
                              {item.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            {canViewOrders && (
              <div className="card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        Commandes
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Répartition du mois
                      </p>
                    </div>

                    <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[var(--blue)]">
                      <ShoppingCart size={17} />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-center py-3">
                    <div
                      className="relative grid size-40 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(
                          #06b6d4 0% ${
                            (activeOrders.length /
                              totalOrderStatuses) *
                            100
                          }%,
                          #ef4444 ${
                            (activeOrders.length /
                              totalOrderStatuses) *
                            100
                          }% 100%
                        )`,
                      }}
                    >
                      <div className="grid size-28 place-items-center rounded-full bg-white shadow-inner">
                        <div className="text-center">
                          <p className="text-3xl font-black text-slate-900">
                            {activeOrders.length +
                              cancelledOrders.length}
                          </p>

                          <p className="text-[9px] font-semibold text-slate-400">
                            commandes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {orderStatusChart.map((item) => {
                      const percentage =
                        totalOrderStatuses > 0
                          ? Math.round(
                              (item.value /
                                totalOrderStatuses) *
                                100,
                            )
                          : 0;

                      return (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${item.color}`}
                              />

                              <span className="text-[10px] font-semibold text-slate-500">
                                {item.label}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-black ${item.text}`}
                            >
                              {item.value} · {percentage}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${item.color} transition-all duration-500`}
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              ACTIVITY + STOCK
              ===================================================== */}

          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            {/* Weekly activity */}
            {canViewOrders && (
              <div className="card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        Activité des commandes
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Nombre de prestations par semaine
                      </p>
                    </div>

                    <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                      <ClipboardList size={17} />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex h-[220px] items-end justify-between gap-3 border-b border-slate-100">
                    {weeklyActivity.map((item) => {
                      const height =
                        item.value === 0
                          ? 4
                          : Math.max(
                              8,
                              (item.value /
                                weeklyMax) *
                                170,
                            );

                      return (
                        <div
                          key={item.label}
                          className="flex h-full flex-1 flex-col items-center justify-end"
                        >
                          <span className="mb-2 text-[9px] font-black text-slate-500">
                            {item.value}
                          </span>

                          <div
                            className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[var(--blue)] to-[var(--primary)] shadow-lg shadow-cyan-500/10 transition-all duration-500 hover:opacity-80"
                            style={{
                              height: `${height}px`,
                            }}
                          />

                          <span className="mt-3 text-[9px] font-bold text-slate-400">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Total du mois
                      </p>

                      <p className="mt-1 text-lg font-black text-slate-900">
                        {activeOrders.length}
                      </p>
                    </div>

                    <div className="grid size-9 place-items-center rounded-xl bg-white text-cyan-600 shadow-sm">
                      <BarChart3 size={17} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stock analytics */}
            {canViewStock && (
              <div className="card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        État du stock
                      </h3>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Articles nécessitant votre attention
                      </p>
                    </div>

                    <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Boxes size={17} />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {stockChart.length > 0 ? (
                    <div className="space-y-4">
                      {stockChart.map((item) => {
                        const critical =
                          item.quantity <=
                          item.threshold;

                        const width = Math.min(
                          100,
                          Math.max(
                            item.percentage,
                            5,
                          ),
                        );

                        return (
                          <div key={item.name}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <div
                                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                                    critical
                                      ? 'bg-red-50 text-red-500'
                                      : 'bg-amber-50 text-amber-500'
                                  }`}
                                >
                                  {critical ? (
                                    <AlertTriangle size={14} />
                                  ) : (
                                    <Boxes size={14} />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-[10px] font-bold text-slate-800">
                                    {item.name}
                                  </p>

                                  <p className="text-[9px] text-slate-400">
                                    Seuil :{' '}
                                    {item.threshold}{' '}
                                    {item.unit}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                                  critical
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}
                              >
                                {item.quantity}{' '}
                                {item.unit}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  critical
                                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                }`}
                                style={{
                                  width: `${width}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-8 text-center">
                      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                        <ArrowUpRight size={20} />
                      </div>

                      <p className="mt-3 text-xs font-black text-emerald-800">
                        Stock sous contrôle
                      </p>

                      <p className="mt-1 text-[10px] text-emerald-600">
                        Aucun article sous le seuil
                        défini.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                        Articles
                      </p>

                      <p className="mt-1 text-lg font-black text-blue-700">
                        {stock.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-cyan-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500">
                        Valeur totale
                      </p>

                      <p className="mt-1 text-sm font-black text-cyan-700">
                        {fcfa(totalStockValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              QUICK METRICS
              ===================================================== */}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {canViewOrders && (
              <div className="group rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                    <ShoppingCart size={17} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-cyan-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>

                <p className="mt-4 text-2xl font-black text-slate-900">
                  {todayOrders.length}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  Prestations aujourd'hui
                </p>
              </div>
            )}

            {canViewPayments && (
              <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--blue)] text-white shadow-lg shadow-blue-500/20">
                    <CreditCard size={17} />
                  </div>

                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[9px] font-black text-blue-600">
                    MOIS
                  </span>
                </div>

                <p className="mt-4 text-xl font-black text-slate-900">
                  {fcfa(encaissé)}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  Encaissements
                </p>
              </div>
            )}

            {canViewClients && (
              <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
                    <Users size={17} />
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-violet-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>

                <p className="mt-4 text-2xl font-black text-slate-900">
                  {clientsCount}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  Clients enregistrés
                </p>
              </div>
            )}

            {canViewStock && (
              <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/10">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <Boxes size={17} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-black ${
                      lowStock.length
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {lowStock.length
                      ? `${lowStock.length} ALERTE(S)`
                      : 'OK'}
                  </span>
                </div>

                <p className="mt-4 text-2xl font-black text-slate-900">
                  {stock.length}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  Articles en stock
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}