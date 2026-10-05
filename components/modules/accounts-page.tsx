'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CheckCircle2, CircleDollarSign, CreditCard, HandCoins, Plus, Search, WalletCards, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { fcfa } from '@/lib/money';
import type { CTRole } from '@/lib/ct-access';

type Row = {
  id: string; type: 'RECEIVABLE' | 'PAYABLE'; status: 'OPEN' | 'PARTIAL' | 'SETTLED' | 'CANCELLED'; clientId?: string | null; clientName?: string | null; orderId?: string | null; orderRef?: string | null;
  counterpartyName: string; phone?: string | null; note?: string | null; label: string; originalAmount: number; balance: number; dueAt?: string | null; createdAt: string;
  entries?: { id: string; kind: 'DEBT' | 'PAYMENT' | 'ADJUSTMENT'; amount: number; method?: string | null; note?: string | null; createdAt: string }[];
};
type Summary = { receivable: number; payable: number; receivableCount: number; payableCount: number };
const emptyForm = { type: 'RECEIVABLE', clientId: '', counterpartyName: '', phone: '', label: '', amount: '', dueAt: '', note: '' };
const methods = [['CASH','Espèces'],['ORANGE_MONEY','Orange Money'],['MTN_MONEY','MTN Money'],['MOOV_MONEY','Moov Money'],['WAVE','Wave'],['CARD','Carte'],['OTHER','Autre']];

export default function AccountsPage({ ctRole }: { ctRole: CTRole }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary>({ receivable: 0, payable: 0, receivableCount: 0, payableCount: 0 });
  const [clients, setClients] = useState<{id:string;name:string}[]>([]);
  const [tab, setTab] = useState<'RECEIVABLE'|'PAYABLE'>('RECEIVABLE');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPay, setOpenPay] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pay, setPay] = useState({ amount:'', method:'CASH', note:'' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [accountsResponse, clientsResponse] = await Promise.all([fetch(`/api/accounts?type=${tab}&limit=200`, { cache:'no-store' }), fetch('/api/clients', { cache:'no-store' })]);
      const accountsData = await accountsResponse.json().catch(() => null);
      if (!accountsResponse.ok) throw new Error(accountsData?.error || 'Impossible de charger les comptes.');
      setRows(Array.isArray(accountsData?.rows) ? accountsData.rows : []);
      setSummary(accountsData?.summary || { receivable:0, payable:0, receivableCount:0, payableCount:0 });
      if (clientsResponse.ok) { const data = await clientsResponse.json().catch(()=>[]); setClients(Array.isArray(data) ? data.map((c:any)=>({id:c.id,name:c.name})) : []); }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Impossible de charger les comptes.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tab]);

  const filtered = useMemo(() => rows.filter(r => `${r.counterpartyName} ${r.label} ${r.orderRef || ''}`.toLowerCase().includes(search.trim().toLowerCase())), [rows, search]);

  function openNew() {
    setForm({ ...emptyForm, type: tab, label: tab === 'RECEIVABLE' ? 'Créance client' : 'Dette fournisseur' });
    setOpenCreate(true);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.label.trim() || !Number.isFinite(amount) || amount <= 0) return toast.error('Renseignez un libellé et un montant valide.');
    if (form.type === 'RECEIVABLE' && !form.clientId) return toast.error('Sélectionnez le client qui doit le montant.');
    if (form.type === 'PAYABLE' && !form.counterpartyName.trim()) return toast.error('Indiquez le créancier ou fournisseur.');
    try {
      setSaving(true);
      const response = await fetch('/api/accounts', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ ...form, amount, type:form.type }) });
      const data = await response.json().catch(()=>null);
      if (!response.ok) throw new Error(data?.error || 'Impossible d’enregistrer le compte.');
      toast.success(form.type === 'RECEIVABLE' ? 'Créance enregistrée.' : 'Dette enregistrée.');
      setOpenCreate(false); setForm(emptyForm); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.'); }
    finally { setSaving(false); }
  }

  async function settle(e: React.FormEvent) {
    e.preventDefault();
    if (!openPay) return;
    const amount = Number(pay.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > openPay.balance + 0.01) return toast.error('Montant supérieur au solde restant.');
    try {
      setSaving(true);
      const response = await fetch(`/api/accounts/${openPay.id}/payments`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ amount, method:pay.method, note:pay.note || null }) });
      const data = await response.json().catch(()=>null);
      if (!response.ok) throw new Error(data?.error || 'Impossible d’enregistrer le règlement.');
      toast.success('Règlement enregistré.'); setOpenPay(null); setPay({amount:'',method:'CASH',note:''}); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.'); }
    finally { setSaving(false); }
  }

  const isReceivable = tab === 'RECEIVABLE';
  const total = isReceivable ? summary.receivable : summary.payable;
  const count = isReceivable ? summary.receivableCount : summary.payableCount;

  return <div className="space-y-5">
    <PageHeader ctRole={ctRole} title="Comptes" subtitle="Suivez ce que vos clients vous doivent et ce que votre imprimerie doit à ses partenaires." />

    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#0b1f3a] p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200"><WalletCards size={12}/> Comptabilité opérationnelle</div><h2 className="text-xl font-black sm:text-2xl">Vos comptes, simplement.</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Les créances et dettes restent séparées des paiements classiques pour garder une trésorerie lisible.</p></div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold text-slate-200"><span className="size-2 rounded-full bg-cyan-300"/> Powered by <span className="font-black text-white">ORO</span></div>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="card p-4"><div className="flex items-center justify-between"><div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ArrowDownLeft size={17}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">À recevoir</span></div><p className="mt-3 text-xl font-black text-slate-900">{fcfa(summary.receivable)}</p><p className="text-[10px] text-slate-500">{summary.receivableCount} créance{summary.receivableCount > 1 ? 's' : ''} ouverte{summary.receivableCount > 1 ? 's' : ''}</p></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600"><ArrowUpRight size={17}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">À payer</span></div><p className="mt-3 text-xl font-black text-slate-900">{fcfa(summary.payable)}</p><p className="text-[10px] text-slate-500">{summary.payableCount} dette{summary.payableCount > 1 ? 's' : ''} ouverte{summary.payableCount > 1 ? 's' : ''}</p></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><CircleDollarSign size={17}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Vue actuelle</span></div><p className="mt-3 text-xl font-black text-slate-900">{fcfa(total)}</p><p className="text-[10px] text-slate-500">{count} compte{count > 1 ? 's' : ''}</p></div>
    </section>

    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex rounded-2xl bg-slate-100 p-1"><button onClick={()=>setTab('RECEIVABLE')} className={`rounded-xl px-4 py-2 text-xs font-black transition ${isReceivable?'bg-white text-emerald-700 shadow-sm':'text-slate-500'}`}>Ce qu&apos;on me doit</button><button onClick={()=>setTab('PAYABLE')} className={`rounded-xl px-4 py-2 text-xs font-black transition ${!isReceivable?'bg-white text-rose-700 shadow-sm':'text-slate-500'}`}>Ce que je dois</button></div>
        <div className="flex gap-2"><div className="relative flex-1 sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/></div><button onClick={openNew} className="btn btn-primary inline-flex shrink-0 items-center gap-2"><Plus size={15}/> Nouveau compte</button></div>
      </div>
      <div className="overflow-x-auto"><table className="table min-w-[850px]"><thead><tr><th>Personne / entreprise</th><th>Compte</th><th>Montant initial</th><th>Solde</th><th>Échéance</th><th>Action</th></tr></thead><tbody>{loading?<tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Chargement…</td></tr>:filtered.length===0?<tr><td colSpan={6} className="py-12 text-center"><HandCoins className="mx-auto size-8 text-slate-300"/><p className="mt-2 text-sm font-bold text-slate-500">Aucun compte dans cette vue.</p><p className="text-xs text-slate-400">Les créances liées aux prestations apparaîtront automatiquement ici.</p></td></tr>:filtered.map(row=><tr key={row.id}><td><div><p className="font-black text-slate-800">{row.counterpartyName}</p><p className="text-[10px] text-slate-400">{row.clientName || row.orderRef || 'Compte manuel'}</p></div></td><td><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-600"><CreditCard size={11}/>{row.label}</span></td><td className="font-bold text-slate-600">{fcfa(row.originalAmount)}</td><td><p className={`font-black ${isReceivable?'text-emerald-700':'text-rose-700'}`}>{fcfa(row.balance)}</p>{row.status==='PARTIAL'&&<span className="text-[9px] font-bold text-slate-400">Partiellement réglé</span>}</td><td>{row.dueAt?<span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13}/>{new Date(row.dueAt).toLocaleDateString('fr-FR')}</span>:<span className="text-xs text-slate-400">Sans échéance</span>}</td><td><div className="flex items-center gap-2"><button onClick={()=>setDetail(row)} className="btn">Voir</button><button disabled={row.balance<=0} onClick={()=>{setOpenPay(row);setPay({amount:String(row.balance),method:'CASH',note:''})}} className="btn inline-flex items-center gap-1.5 border-cyan-200 bg-cyan-50 text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={14}/> Régler</button></div></td></tr>)}</tbody></table></div>
    </section>

    {detail && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Détail du compte</p><h3 className="text-lg font-black text-slate-900">{detail.counterpartyName}</h3><p className="mt-1 text-xs text-slate-400">{detail.label}</p></div><button onClick={()=>setDetail(null)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={17}/></button></div><div className="grid grid-cols-2 gap-3 p-5"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-400">Montant initial</p><p className="mt-1 text-sm font-black text-slate-900">{fcfa(detail.originalAmount)}</p></div><div className={`rounded-2xl p-4 ${isReceivable?'bg-emerald-50':'bg-rose-50'}`}><p className="text-[9px] font-black uppercase text-slate-400">Solde</p><p className={`mt-1 text-sm font-black ${isReceivable?'text-emerald-700':'text-rose-700'}`}>{fcfa(detail.balance)}</p></div></div><div className="px-5 pb-5"><p className="mb-2 text-xs font-black text-slate-700">Historique</p><div className="max-h-52 space-y-2 overflow-y-auto">{detail.entries?.map(entry=><div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold text-slate-700">{entry.kind==='DEBT'?'Création':'Règlement'}</p><p className="text-[10px] text-slate-400">{new Date(entry.createdAt).toLocaleString('fr-FR')}</p></div><p className="text-xs font-black text-slate-800">{fcfa(entry.amount)}</p></div>)}</div>{detail.note&&<p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{detail.note}</p>}</div><div className="flex justify-end gap-2 border-t border-slate-100 p-5"><button onClick={()=>setDetail(null)} className="btn">Fermer</button>{detail.balance>0&&<button onClick={()=>{setDetail(null);setOpenPay(detail);setPay({amount:String(detail.balance),method:'CASH',note:''})}} className="btn btn-primary">Enregistrer un règlement</button>}</div></div></div>}

    {openCreate && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={createAccount} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="text-lg font-black text-slate-900">Nouveau compte</h3><p className="text-xs text-slate-400">Ajoutez une créance ou une dette à suivre.</p></div><button type="button" onClick={()=>setOpenCreate(false)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={17}/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label">Type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setForm({...form,type:'RECEIVABLE'})} className={`rounded-2xl border p-3 text-left text-xs font-black ${form.type==='RECEIVABLE'?'border-emerald-300 bg-emerald-50 text-emerald-700':'border-slate-200 bg-slate-50 text-slate-500'}`}>Ce qu&apos;on me doit</button><button type="button" onClick={()=>setForm({...form,type:'PAYABLE'})} className={`rounded-2xl border p-3 text-left text-xs font-black ${form.type==='PAYABLE'?'border-rose-300 bg-rose-50 text-rose-700':'border-slate-200 bg-slate-50 text-slate-500'}`}>Ce que je dois</button></div></div>{form.type==='RECEIVABLE'?<div><label className="label">Client</label><select className="input" value={form.clientId} onChange={e=>setForm({...form,clientId:e.target.value,counterpartyName:clients.find(c=>c.id===e.target.value)?.name||''})}><option value="">Sélectionner…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>:<div><label className="label">Créancier / fournisseur</label><input className="input" value={form.counterpartyName} onChange={e=>setForm({...form,counterpartyName:e.target.value})} placeholder="Nom ou entreprise"/></div>}<div><label className="label">Téléphone</label><input className="input" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="07…"/></div><div><label className="label">Libellé</label><input className="input" required value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Ex. Solde impression"/></div><div><label className="label">Montant</label><div className="relative"><input className="input pr-16" required type="number" min="1" step="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">FCFA</span></div></div><div><label className="label">Échéance</label><input className="input" type="date" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/></div><div className="sm:col-span-2"><label className="label">Note</label><textarea className="input min-h-20" maxLength={2000} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Information utile…"/></div></div><div className="flex justify-end gap-2 border-t border-slate-100 p-5"><button type="button" onClick={()=>setOpenCreate(false)} className="btn">Annuler</button><button disabled={saving} className="btn btn-primary">{saving?'Enregistrement…':'Enregistrer'}</button></div></form></div>}

    {openPay && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={settle} className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Règlement</p><h3 className="text-lg font-black text-slate-900">{openPay.counterpartyName}</h3><p className="mt-1 text-xs text-slate-400">Solde : <strong className="text-slate-700">{fcfa(openPay.balance)}</strong></p></div><button type="button" onClick={()=>setOpenPay(null)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={17}/></button></div><div className="space-y-4 p-5"><div><label className="label">Montant réglé</label><input className="input" type="number" min="1" step="1" max={openPay.balance} value={pay.amount} onChange={e=>setPay({...pay,amount:e.target.value})}/></div><div><label className="label">Mode</label><select className="input" value={pay.method} onChange={e=>setPay({...pay,method:e.target.value})}>{methods.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><div><label className="label">Note</label><textarea className="input min-h-20" value={pay.note} onChange={e=>setPay({...pay,note:e.target.value})}/></div></div><div className="flex justify-end gap-2 border-t border-slate-100 p-5"><button type="button" onClick={()=>setOpenPay(null)} className="btn">Annuler</button><button disabled={saving} className="btn btn-primary inline-flex items-center gap-2"><CheckCircle2 size={15}/>{saving?'Enregistrement…':'Enregistrer le règlement'}</button></div></form></div>}
  </div>;
}
