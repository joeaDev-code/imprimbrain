"use client";

import { RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { superAdminApi } from "@/lib/super-admin-api";
import { ErrorBox, Loading, PageTitle, useApi } from "@/components/super-admin/ui";

function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); }
function money(value: number, currency: string) { return `${new Intl.NumberFormat("fr-FR").format(value)} ${currency}`; }

export default function Subscriptions() {
  const { data, error, loading, reload } = useApi(superAdminApi.subscriptions);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => (data ?? []).filter((item) => `${item.organization.name} ${item.organization.slug}`.toLowerCase().includes(query.toLowerCase())), [data, query]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={reload} />;

  const active = data?.filter((x) => x.status === "ACTIVE" && !x.expired).length ?? 0;
  const expired = data?.filter((x) => x.status === "EXPIRED" || x.expired).length ?? 0;
  const suspended = data?.filter((x) => x.organization.status === "SUSPENDED").length ?? 0;

  return <div className="space-y-6">
    <PageTitle title="Abonnements" description="Suivez les accès, échéances et renouvellements des organisations." />
    <div className="grid gap-4 sm:grid-cols-3">
      {[['Actifs', active], ['Expirés', expired], ['Organisations suspendues', suspended]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher une organisation…" className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm outline-none focus:border-cyan-500"/></div>
      <button onClick={reload} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-slate-50"><RefreshCw size={16}/> Actualiser</button>
    </div>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Aucun abonnement.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Organisation</th><th className="p-4">Montant</th><th className="p-4">Période</th><th className="p-4">Statut</th></tr></thead><tbody>{filtered.map((item)=><tr key={item.id} className="border-t"><td className="p-4"><p className="font-semibold text-slate-900">{item.organization.name}</p><p className="font-mono text-xs text-slate-400">{item.organization.slug}</p></td><td className="p-4 font-semibold">{money(item.amount,item.currency)}</td><td className="p-4 text-slate-600">{date(item.startsAt)} → {date(item.expiresAt)}</td><td className="p-4">{item.expired || item.status === "EXPIRED" ? <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"><ShieldAlert size={13}/> Expiré</span> : item.organization.status === "SUSPENDED" ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Suspendu</span> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Actif</span>}</td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
