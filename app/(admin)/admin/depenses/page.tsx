"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, CalendarDays, Plus, Receipt, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";

type Expense = { id:string; label:string; category?:string|null; amount:number|string; spentAt:string };

const emptyForm = { label:"", category:"Divers", amount:"" };

export default function Expenses() {
  const [rows,setRows] = useState<Expense[]>([]);
  const [f,setF] = useState(emptyForm);
  const [search,setSearch] = useState("");
  const [saving,setSaving] = useState(false);
  const [loading,setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/expenses");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setRows(Array.isArray(data) ? data : []);
    } catch { toast.error("Impossible de charger les dépenses."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  async function add(e:React.FormEvent) {
    e.preventDefault();
    if (!f.label.trim() || Number(f.amount) <= 0) return toast.error("Renseignez un libellé et un montant valide.");
    try {
      setSaving(true);
      const r = await fetch("/api/expenses", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({...f,label:f.label.trim(),amount:Number(f.amount)}) });
      if (!r.ok) { const d=await r.json().catch(()=>null); throw new Error(d?.error || d?.message || "Impossible d'ajouter la dépense."); }
      setF(emptyForm); await load(); toast.success("Dépense enregistrée.");
    } catch(e) { toast.error(e instanceof Error ? e.message : "Une erreur est survenue."); }
    finally { setSaving(false); }
  }

  const filtered = rows.filter(r => `${r.label} ${r.category||""}`.toLowerCase().includes(search.toLowerCase().trim()));
  const total = useMemo(()=>rows.reduce((s,r)=>s+Number(r.amount),0),[rows]);
  const monthTotal = useMemo(()=>rows.filter(r=>{const d=new Date(r.spentAt),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,r)=>s+Number(r.amount),0),[rows]);

  return <div className="space-y-5">
    <PageHeader title="Dépenses" subtitle="Suivez les sorties de trésorerie de votre imprimerie." />
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="card p-4"><div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Receipt size={17}/></div><p className="mt-3 text-xl font-black text-slate-900">{rows.length}</p><p className="text-[10px] text-slate-500">Dépenses enregistrées</p></div>
      <div className="card p-4"><div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={17}/></div><p className="mt-3 text-xl font-black text-slate-900">{fcfa(monthTotal)}</p><p className="text-[10px] text-slate-500">Dépenses ce mois</p></div>
      <div className="card p-4"><div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600"><ArrowDownLeft size={17}/></div><p className="mt-3 text-xl font-black text-slate-900">{fcfa(total)}</p><p className="text-[10px] text-slate-500">Total enregistré</p></div>
    </section>
    <form onSubmit={add} className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Plus size={17}/></div><div><h2 className="text-sm font-black text-slate-900">Nouvelle dépense</h2><p className="text-[10px] text-slate-400">Enregistrez une sortie de caisse ou de trésorerie.</p></div></div>
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
        <div><label className="label">Libellé <span className="text-red-500">*</span></label><input className="input" placeholder="Ex. Achat d'encre" value={f.label} onChange={e=>setF({...f,label:e.target.value})} required/></div>
        <div><label className="label">Catégorie</label><input className="input" placeholder="Ex. Fournitures" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/></div>
        <div><label className="label">Montant <span className="text-red-500">*</span></label><div className="relative"><input className="input pr-16" type="number" min="1" placeholder="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">FCFA</span></div></div>
        <button className="btn btn-primary self-end" disabled={saving}>{saving?"Enregistrement…":"Ajouter"}</button>
      </div>
    </form>
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="text-sm font-black text-slate-900">Historique</h2><p className="text-[10px] text-slate-400">{filtered.length} résultat{filtered.length>1?"s":""}</p></div><div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
      <div className="overflow-x-auto"><table className="table min-w-[700px]"><thead><tr><th>Dépense</th><th>Catégorie</th><th>Montant</th><th>Date</th></tr></thead><tbody>{loading?<tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">Chargement…</td></tr>:filtered.length===0?<tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">Aucune dépense trouvée.</td></tr>:filtered.map(r=><tr key={r.id}><td><div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-500"><Receipt size={14}/></div><span className="font-bold text-slate-800">{r.label}</span></div></td><td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">{r.category||"Divers"}</span></td><td className="font-black text-slate-800">{fcfa(Number(r.amount))}</td><td><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13}/>{new Date(r.spentAt).toLocaleDateString("fr-FR")}</span></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
