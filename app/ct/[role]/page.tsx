import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    if (error instanceof Error && error.message === 'UNAUTHORIZED') notFound();
    if (error instanceof Error && error.message === 'SUPER_ADMIN_ONLY') notFound();
    if (error instanceof Error && error.message === 'FORBIDDEN') notFound();
    throw error;
  }

  const organizationId = user.organizationId;
  const canView = (permission: Permission) => user.permissions.includes(permission);
  const canViewPayments = canView('PAYMENTS_VIEW');
  const canViewExpenses = canView('EXPENSES_VIEW');
  const canViewOrders = canView('ORDERS_VIEW');
  const canViewStock = canView('STOCK_VIEW');
  const canViewClients = canView('CLIENTS_VIEW');
  const canViewServices = canView('SERVICES_VIEW');
  const links = ctDashboardLinks(user.role);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const scopes = dashboardTenantScopes(organizationId, monthStart, monthEnd, todayStart, todayEnd);

  const [payments, expenses, recentRows, monthRows, todayOrders, stock, clientsCount, servicesCount] = await Promise.all([
    canViewPayments
      ? db.payment.findMany({
          where: scopes.payments,
          select: { amount: true },
        })
      : Promise.resolve([]),
    canViewExpenses
      ? db.expense.findMany({
          where: scopes.expenses,
          select: { amount: true },
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
            ...(canViewPayments ? { payments: { select: { amount: true } } } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        })
      : Promise.resolve([]),
    canViewOrders
      ? db.order.findMany({
          where: scopes.monthOrders,
          select: {
            total: true,
            status: true,
            ...(canViewPayments ? { payments: { select: { amount: true } } } : {}),
          },
        })
      : Promise.resolve([]),
    canViewOrders
      ? db.order.findMany({
          where: scopes.todayOrders,
          select: { id: true },
        })
      : Promise.resolve([]),
    canViewStock
      ? db.stockItem.findMany({
          where: scopes.stock,
          select: { id: true, name: true, unit: true, quantity: true, minThreshold: true, unitCost: true },
          orderBy: { quantity: 'asc' },
        })
      : Promise.resolve([]),
    canViewClients ? db.client.count({ where: scopes.clients }) : Promise.resolve(null),
    canViewServices ? db.service.count({ where: scopes.services }) : Promise.resolve(null),
  ]);

  const encaissé = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const dépenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const résultat = encaissé - dépenses;
  const hasPaymentRows = (order: object): order is { payments: { amount: unknown }[] } => 'payments' in order;
  const orders = recentRows.map((order) => ({
    ...order,
    paid: hasPaymentRows(order) ? order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) : null,
  }));
  const monthOrders = monthRows.map((order) => ({
    ...order,
    paid: hasPaymentRows(order) ? order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) : null,
  }));
  const resteAPercevoir = canViewPayments
    ? monthOrders
        .filter((order) => order.status !== 'CANCELLED')
        .reduce((sum, order) => sum + Math.max(0, Number(order.total) - (order.paid ?? 0)), 0)
    : 0;
  const activeOrders = monthOrders.filter((order) => order.status !== 'CANCELLED');
  const cancelledOrders = monthOrders.filter((order) => order.status === 'CANCELLED');
  const lowStock = stock.filter((item) => Number(item.quantity) <= Number(item.minThreshold));
  const totalStockValue = stock.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const todayLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const metrics: { label: string; value: string; icon: LucideIcon; description: string }[] = [];
  if (canViewPayments) metrics.push({ label: 'Encaissé ce mois', value: fcfa(encaissé), icon: CreditCard, description: `${payments.length} paiement(s)` });
  if (canViewExpenses) metrics.push({ label: 'Dépenses du mois', value: fcfa(dépenses), icon: Receipt, description: `${expenses.length} dépense(s)` });
  if (canViewPayments && canViewExpenses) metrics.push({ label: 'Résultat', value: fcfa(résultat), icon: Wallet, description: résultat >= 0 ? 'Solde positif' : 'Solde négatif' });
  if (canViewOrders && canViewPayments) metrics.push({ label: 'Reste à percevoir', value: fcfa(resteAPercevoir), icon: ArrowDownRight, description: 'Commandes du mois' });

  const secondaryCards: { label: string; value: number | null; icon: LucideIcon; iconClass: string; badge?: string }[] = [];
  if (canViewOrders) secondaryCards.push({ label: 'Prestations ce mois', value: activeOrders.length, icon: ShoppingCart, iconClass: 'bg-cyan-50 text-cyan-600', badge: `+${activeOrders.length}` });
  if (canViewClients) secondaryCards.push({ label: 'Clients enregistrés', value: clientsCount, icon: Users, iconClass: 'bg-blue-50 text-blue-600' });
  if (canViewServices) secondaryCards.push({ label: 'Services actifs', value: servicesCount, icon: Package, iconClass: 'bg-violet-50 text-violet-600' });
  if (canViewStock) secondaryCards.push({ label: 'Articles sous le seuil', value: lowStock.length, icon: Boxes, iconClass: 'bg-amber-50 text-amber-600' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">Vue opérationnelle de votre imprimerie</p>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f4c81] via-[#096e9f] to-cyan-600 p-5 text-white shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-blue-900/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-200" /><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-100">Activité de l'imprimerie</span></div>
              <h2 className="text-xl font-black md:text-2xl">Bonjour, {user.name} 👋</h2>
              <p className="mt-1 text-sm text-white/70">Voici l'état de votre activité pour {monthLabel}.</p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur">{todayLabel}</div>
          </div>
          {metrics.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, icon: Icon, description }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.10] p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-white/65">{label}</span><Icon size={15} className="text-white/70" /></div>
                  <p className="mt-2 text-lg font-black">{value}</p>
                  <p className="mt-1 text-[9px] text-white/50">{description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {secondaryCards.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {secondaryCards.map(({ label, value, icon: Icon, iconClass, badge }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center justify-between">
                <div className={`grid size-9 place-items-center rounded-lg ${iconClass}`}><Icon size={17} /></div>
                {badge && <span className="text-[10px] font-bold text-green-600">{badge}</span>}
              </div>
              <p className="mt-3 text-xl font-black text-slate-900">{value}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </section>
      )}

      {(canViewOrders || canViewStock) && (
        <section className={`grid gap-5 ${canViewOrders && canViewStock ? 'lg:grid-cols-[1.55fr_1fr]' : 'lg:grid-cols-1'}`}>
          {canViewOrders && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><h2 className="text-sm font-black text-slate-900">Activité récente</h2><p className="mt-0.5 text-[10px] text-slate-400">Dernières prestations enregistrées</p></div>
                <Link href={links.prestations} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700">Voir tout →</Link>
              </div>
              {orders.length ? (
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const total = Number(order.total);
                    const remaining = order.paid === null ? null : Math.max(0, total - order.paid);
                    const cancelled = order.status === 'CANCELLED';
                    return (
                      <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${cancelled ? 'bg-red-50 text-red-500' : 'bg-cyan-50 text-cyan-600'}`}><ClipboardList size={16} /></div>
                          <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">Prestation #{order.id.slice(-6)}</p><p className="mt-0.5 text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p></div>
                        </div>
                        <div className="text-right"><p className="text-xs font-black text-slate-800">{fcfa(total)}</p><span className={`text-[9px] font-bold ${cancelled ? 'text-red-500' : remaining === null ? 'text-slate-500' : remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {cancelled ? 'Annulée' : remaining === null ? 'Enregistrée' : remaining > 0 ? `Reste ${fcfa(remaining)}` : 'Payée'}
                        </span></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-12 text-center"><ClipboardList size={24} className="mx-auto text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">Aucune prestation récente</p></div>
              )}
            </div>
          )}

          {canViewStock && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><h2 className="text-sm font-black text-slate-900">Stock à surveiller</h2><p className="mt-0.5 text-[10px] text-slate-400">Articles proches ou sous le seuil</p></div>
                <Link href={links.stock} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700">Gérer →</Link>
              </div>
              <div className="p-4">
                {lowStock.length ? (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((item) => {
                      const quantity = Number(item.quantity);
                      const threshold = Number(item.minThreshold);
                      const critical = quantity <= threshold;
                      return (
                        <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-amber-600 shadow-sm"><Boxes size={14} /></div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-slate-800">{item.name}</p><p className="text-[9px] text-slate-400">Seuil : {threshold} {item.unit}</p></div></div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${critical ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{quantity} {item.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-green-50 p-5 text-center"><div className="mx-auto grid size-9 place-items-center rounded-full bg-white text-green-600 shadow-sm"><ArrowUpRight size={17} /></div><p className="mt-2 text-xs font-bold text-green-800">Stock sous contrôle</p><p className="mt-1 text-[10px] text-green-600">Aucun article sous le seuil défini.</p></div>
                )}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Valeur du stock</p><p className="mt-1 text-sm font-black text-slate-800">{fcfa(totalStockValue)}</p></div><Boxes size={18} className="text-slate-300" /></div>
              </div>
            </div>
          )}
        </section>
      )}

      {(canViewOrders || (canViewPayments && canViewExpenses)) && (
        <section className="grid gap-5 lg:grid-cols-3">
          {canViewOrders && (
            <div className="card p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><ShoppingCart size={17} /></div><div><h3 className="text-xs font-black text-slate-900">Aujourd'hui</h3><p className="text-[10px] text-slate-400">Prestations enregistrées</p></div></div><p className="mt-5 text-3xl font-black text-slate-900">{todayOrders.length}</p></div>
          )}
          {canViewPayments && canViewExpenses && (
            <div className="card p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-green-50 text-green-600"><Wallet size={17} /></div><div><h3 className="text-xs font-black text-slate-900">Performance</h3><p className="text-[10px] text-slate-400">Résultat du mois</p></div></div><div className="mt-5 flex items-end justify-between gap-3"><p className="text-xl font-black text-slate-900">{fcfa(résultat)}</p>{résultat >= 0 ? <span className="flex items-center gap-1 text-[9px] font-bold text-green-600"><ArrowUpRight size={12} />Positif</span> : <span className="flex items-center gap-1 text-[9px] font-bold text-red-600"><ArrowDownRight size={12} />Négatif</span>}</div></div>
          )}
          {canViewOrders && (
            <div className="card p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600"><Receipt size={17} /></div><div><h3 className="text-xs font-black text-slate-900">Annulations</h3><p className="text-[10px] text-slate-400">Ce mois</p></div></div><p className="mt-5 text-3xl font-black text-slate-900">{cancelledOrders.length}</p></div>
          )}
        </section>
      )}
    </div>
  );
}
