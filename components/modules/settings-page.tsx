"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Clock3, LocateFixed, Mail, MapPin, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import type { CTRole } from "@/lib/ct-access";

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
type Hour = { dayOfWeek: number; openMinute: number | null; closeMinute: number | null; closed: boolean };
type FormState = { name: string; phone: string; whatsapp: string; email: string; address: string; publicProfileEnabled: boolean; publicDescription: string; city: string; neighborhood: string; latitude: string; longitude: string; timezone: string; openingHours: Hour[] };
const defaultHours = days.map((_, dayOfWeek) => ({ dayOfWeek, openMinute: 480, closeMinute: 1080, closed: dayOfWeek === 0 }));

export default function Settings({ ctRole }: { ctRole: CTRole }) {
  const [f, setF] = useState<FormState>({ name: "", phone: "", whatsapp: "", email: "", address: "", publicProfileEnabled: false, publicDescription: "", city: "", neighborhood: "", latitude: "", longitude: "", timezone: "Africa/Abidjan", openingHours: defaultHours });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then(r => r.json()).then(d => setF({
      name: d.name || "", phone: d.phone || "", whatsapp: d.whatsapp || "", email: d.email || "", address: d.address || "",
      publicProfileEnabled: Boolean(d.publicProfileEnabled), publicDescription: d.publicDescription || "", city: d.city || "", neighborhood: d.neighborhood || "",
      latitude: d.latitude == null ? "" : String(d.latitude), longitude: d.longitude == null ? "" : String(d.longitude), timezone: d.timezone || "Africa/Abidjan",
      openingHours: Array.isArray(d.openingHours) && d.openingHours.length ? d.openingHours : defaultHours,
    })).catch(() => toast.error("Impossible de charger les paramètres.")).finally(() => setLoading(false));
  }, []);

  function updateHour(index: number, patch: Partial<Hour>) {
    setF(value => ({ ...value, openingHours: value.openingHours.map((hour, i) => i === index ? { ...hour, ...patch } : hour) }));
  }
  function timeToMinute(value: string) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
  function minuteToTime(value: number | null) { if (value == null) return "08:00"; return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...f, latitude: f.latitude === "" ? null : Number(f.latitude), longitude: f.longitude === "" ? null : Number(f.longitude) };
      const r = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Enregistrement impossible");
      toast.success("Paramètres enregistrés.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Impossible d’enregistrer les paramètres."); }
    finally { setSaving(false); }
  }

  function locate() {
    if (!navigator.geolocation) return toast.error("La localisation n’est pas disponible.");
    navigator.geolocation.getCurrentPosition(position => setF(value => ({ ...value, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6) })), () => toast.error("Impossible d’obtenir votre position."), { enableHighAccuracy: false, timeout: 8000 });
  }

  return <div className="space-y-5"><PageHeader ctRole={ctRole} title="Paramètres" subtitle="Configurez les informations de votre imprimerie et votre présence publique." />
    <form onSubmit={save} className="space-y-5">
      <section className="card overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Building2 size={17}/></div><div><h2 className="text-sm font-black">Informations de l’imprimerie</h2><p className="text-[10px] text-slate-400">Ces informations peuvent apparaître sur vos reçus.</p></div></div><div className="grid gap-4 p-5 md:grid-cols-2"><div className="md:col-span-2"><label className="label">Nom de l’imprimerie *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required disabled={loading}/></div><div><label className="label">Téléphone</label><input className="input" type="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div><div><label className="label">WhatsApp</label><div className="relative"><MessageCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" type="tel" value={f.whatsapp} onChange={e=>setF({...f,whatsapp:e.target.value})}/></div></div><div><label className="label">E-mail</label><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div></div><div><label className="label">Adresse</label><input className="input" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></div></div></section>

      <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-black">Profil public · Discover</h2><p className="mt-1 text-[10px] text-slate-400">Publiez votre imprimerie uniquement lorsque le profil est prêt.</p></div><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={f.publicProfileEnabled} onChange={e=>setF({...f,publicProfileEnabled:e.target.checked})} /> Visible sur Discover</label></div><div className="grid gap-4 p-5 md:grid-cols-2"><div className="md:col-span-2"><label className="label">Description publique</label><textarea className="input min-h-24 resize-y" maxLength={1000} value={f.publicDescription} onChange={e=>setF({...f,publicDescription:e.target.value})} placeholder="Présentez brièvement votre imprimerie, vos spécialités et votre clientèle." /></div><div><label className="label">Ville</label><input className="input" maxLength={100} value={f.city} onChange={e=>setF({...f,city:e.target.value})}/></div><div><label className="label">Quartier</label><input className="input" maxLength={120} value={f.neighborhood} onChange={e=>setF({...f,neighborhood:e.target.value})}/></div><div><label className="label">Latitude</label><input className="input" inputMode="decimal" value={f.latitude} onChange={e=>setF({...f,latitude:e.target.value})}/></div><div><label className="label">Longitude</label><div className="flex gap-2"><input className="input" inputMode="decimal" value={f.longitude} onChange={e=>setF({...f,longitude:e.target.value})}/><button type="button" onClick={locate} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><LocateFixed size={15}/> Position</button></div></div></div></section>

      <section className="card overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Clock3 size={17}/></div><div><h2 className="text-sm font-black">Horaires publics</h2><p className="text-[10px] text-slate-400">Ces horaires seront affichés sur votre fiche.</p></div></div><div className="divide-y divide-slate-100">{f.openingHours.map((hour,index)=><div key={hour.dayOfWeek} className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[140px_100px_1fr]"><span className="text-sm font-bold text-slate-700">{days[hour.dayOfWeek]}</span><label className="flex items-center gap-2 text-xs font-semibold text-slate-500"><input type="checkbox" checked={hour.closed} onChange={e=>updateHour(index,{closed:e.target.checked})}/> Fermé</label><div className="flex flex-wrap items-center gap-2"><input type="time" className="input max-w-36" disabled={hour.closed} value={minuteToTime(hour.openMinute)} onChange={e=>updateHour(index,{openMinute:timeToMinute(e.target.value)})}/><span className="text-slate-400">→</span><input type="time" className="input max-w-36" disabled={hour.closed} value={minuteToTime(hour.closeMinute)} onChange={e=>updateHour(index,{closeMinute:timeToMinute(e.target.value)})}/></div></div>)}</div></section>

      <div className="flex items-center justify-between gap-3"><div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><CheckCircle2 size={15} className="text-emerald-500"/> Les données publiques sont désactivées par défaut.</div><button className="btn btn-primary inline-flex items-center gap-2" disabled={saving||loading}><Save size={15}/>{saving?"Enregistrement…":"Enregistrer"}</button></div>
    </form>
  </div>;
}
