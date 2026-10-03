"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Mail, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import type { CTRole } from "@/lib/ct-access";

export default function Settings({ ctRole }: { ctRole: CTRole }){
  const [f,setF]=useState({name:"",phone:"",email:"",address:""});const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  useEffect(()=>{fetch("/api/settings").then(r=>r.json()).then(d=>setF({name:d.name||"",phone:d.phone||"",email:d.email||"",address:d.address||""})).catch(()=>toast.error("Impossible de charger les paramètres.")).finally(()=>setLoading(false))},[]);
  async function save(e:React.FormEvent){e.preventDefault();try{setSaving(true);const r=await fetch("/api/settings",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(f)});if(!r.ok)throw new Error();toast.success("Paramètres enregistrés.")}catch{toast.error("Impossible d’enregistrer les paramètres.")}finally{setSaving(false)}}
  return <div className="space-y-5"><PageHeader ctRole={ctRole} title="Paramètres" subtitle="Configurez les informations de votre imprimerie utilisées dans l'application et les reçus." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={save} className="card overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Building2 size={17}/></div><div><h2 className="text-sm font-black">Informations de l'imprimerie</h2><p className="text-[10px] text-slate-400">Ces informations peuvent apparaître sur vos reçus.</p></div></div><div className="space-y-4 p-5">
        <div><label className="label">Nom de l'imprimerie <span className="text-red-500">*</span></label><div className="relative"><Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required disabled={loading}/></div></div>
        <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Téléphone</label><div className="relative"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" type="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div></div><div><label className="label">E-mail</label><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div></div></div>
        <div><label className="label">Adresse</label><div className="relative"><MapPin size={15} className="absolute left-3 top-3 text-slate-400"/><textarea className="input min-h-24 resize-y pl-9" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></div></div>
        <div className="flex justify-end border-t border-slate-100 pt-4"><button className="btn btn-primary inline-flex items-center gap-2" disabled={saving||loading}><Save size={15}/>{saving?"Enregistrement…":"Enregistrer"}</button></div>
      </div></form>
      <aside className="space-y-3"><div className="card p-5"><div className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><CheckCircle2 size={19}/></div><h3 className="mt-4 text-sm font-black">Conseil</h3><p className="mt-1 text-xs leading-5 text-slate-500">Gardez vos coordonnées à jour pour que les reçus remis aux clients restent cohérents.</p></div><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Configuration</p><p className="mt-2 text-xs leading-5 text-blue-700/80">Les champs facultatifs peuvent rester vides si vous ne souhaitez pas les afficher.</p></div></aside>
    </div>
  </div>;
}
