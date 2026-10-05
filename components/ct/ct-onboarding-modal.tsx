'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Eye, EyeOff, LockKeyhole, Plus, ShieldCheck, Store, Trash2, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCTStore } from '@/components/ct/ct-provider';

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
type Hour = { dayOfWeek: number; openMinute: number | null; closeMinute: number | null; closed: boolean };
type Service = { name: string; category: string; unit: string; price: string };
const defaultHours: Hour[] = days.map((_, dayOfWeek) => ({ dayOfWeek, openMinute: 480, closeMinute: 1080, closed: dayOfWeek === 0 }));
const emptyService: Service = { name: '', category: 'Impression', unit: 'unité', price: '' };

type OnboardingData = {
  bio: string;
  phone: string;
  whatsapp: string;
  city: string;
  neighborhood: string;
  address: string;
  openingHours: Hour[];
  services: Array<{ id?: string; name: string; category: string | null; unit: string; price: number }>;
};

export function CTOnboardingModal() {
  const router = useRouter();
  const role = useCTStore((state) => state.role);
  const mustChangePassword = useCTStore((state) => state.mustChangePassword);
  const onboardingCompleted = useCTStore((state) => state.onboardingCompleted);
  const markPasswordChanged = useCTStore((state) => state.markPasswordChanged);
  const completeOnboarding = useCTStore((state) => state.completeOnboarding);
  const isAdmin = role === 'ADMIN';
  const [passwordDone, setPasswordDone] = useState(!mustChangePassword);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<OnboardingData>({ bio: '', phone: '', whatsapp: '', city: '', neighborhood: '', address: '', openingHours: defaultHours, services: [] });
  const [service, setService] = useState<Service>(emptyService);

  const visible = mustChangePassword || (isAdmin && !onboardingCompleted);
  const optionalStepCount = 3;
  const totalSteps = optionalStepCount;

  useEffect(() => {
    if (!visible || !isAdmin || (!passwordDone && mustChangePassword)) return;
    let cancelled = false;
    setDataLoading(true);
    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) throw new Error(json?.error || 'Impossible de charger la configuration.');
        if (!cancelled) {
          setProfile({
            bio: json.bio || '', phone: json.phone || '', whatsapp: json.whatsapp || '', city: json.city || '', neighborhood: json.neighborhood || '', address: json.address || '',
            openingHours: Array.isArray(json.openingHours) && json.openingHours.length ? json.openingHours : defaultHours,
            services: Array.isArray(json.services) ? json.services : [],
          });
        }
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Impossible de charger la configuration.'); })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [visible, mustChangePassword, isAdmin, passwordDone]);

  const title = useMemo(() => {
    if (!passwordDone) return 'Sécurisez votre compte';
    if (step === 0) return 'Présentez votre imprimerie';
    if (step === 1) return 'Définissez vos horaires';
    return 'Ajoutez vos services';
  }, [passwordDone, step]);

  if (!visible) return null;

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmation) return setError('Les deux nouveaux mots de passe ne correspondent pas.');
    if (newPassword.length < 10 || newPassword.length > 128 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return setError('Le nouveau mot de passe doit contenir au moins 10 caractères, une lettre et un chiffre.');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error || 'Impossible de modifier le mot de passe.');
      markPasswordChanged();
      setPasswordDone(true);
      toast.success('Mot de passe modifié.');
      router.refresh();
      if (!isAdmin) return;
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de modifier le mot de passe.'); }
    finally { setLoading(false); }
  }

  function timeToMinute(value: string) { const [h, m] = value.split(':').map(Number); return h * 60 + m; }
  function minuteToTime(value: number | null) { if (value == null) return '08:00'; return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
  function updateHour(index: number, patch: Partial<Hour>) { setProfile((v) => ({ ...v, openingHours: v.openingHours.map((h, i) => i === index ? { ...h, ...patch } : h) })); }
  function addService() {
    const name = service.name.trim();
    const price = Number(service.price);
    if (!name || !Number.isFinite(price) || price < 0) return setError('Renseignez un nom et un prix valides pour le service.');
    if (profile.services.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) return setError('Ce service est déjà présent.');
    setProfile((v) => ({ ...v, services: [...v.services, { name, category: service.category.trim() || null, unit: service.unit.trim() || 'unité', price }] }));
    setService(emptyService);
    setError('');
  }
  function removeService(index: number) { setProfile((v) => ({ ...v, services: v.services.filter((_, i) => i !== index) })); }

  async function finish() {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        bio: profile.bio, phone: profile.phone, whatsapp: profile.whatsapp, city: profile.city, neighborhood: profile.neighborhood, address: profile.address,
        openingHours: profile.openingHours, services: profile.services,
      }) });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error || 'Impossible d’enregistrer votre configuration.');
      completeOnboarding();
      toast.success('Configuration enregistrée. Bienvenue sur Imprim’Brain !');
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer votre configuration.'); }
    finally { setLoading(false); }
  }

  async function skipOptional() {
    if (!isAdmin) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ services: [] }) });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error || 'Impossible de terminer cette étape.');
      completeOnboarding();
      toast.success('Vous pourrez compléter ces informations plus tard dans Paramètres.');
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de terminer cette étape.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><Store size={21}/></div>
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-600">Bienvenue sur Imprim’Brain</p><h2 id="onboarding-title" className="text-lg font-black text-slate-950">{title}</h2></div>
          </div>
          {passwordDone && isAdmin && <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">Étape {step + 1}/{totalSteps}</span>}
        </div>

        <div className="overflow-y-auto p-5 sm:p-7">
          {!passwordDone ? (
            <form onSubmit={submitPassword} className="space-y-5">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900"><div className="flex gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0"/><p>Votre compte vient d’être créé avec un mot de passe initial. <strong>Vous devez obligatoirement le remplacer</strong> avant d’utiliser l’espace d’administration.</p></div></div>
              <label className="block text-sm font-bold text-slate-700">Mot de passe actuel<input required type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input mt-2" autoComplete="current-password" /></label>
              <label className="block text-sm font-bold text-slate-700">Nouveau mot de passe<div className="relative mt-2"><input required minLength={10} type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input pr-12" autoComplete="new-password"/><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? 'Masquer' : 'Afficher'}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><span className="mt-1 block text-[11px] font-medium text-slate-400">10 caractères minimum, avec au moins une lettre et un chiffre.</span></label>
              <label className="block text-sm font-bold text-slate-700">Confirmation<input required minLength={10} type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="input mt-2" autoComplete="new-password" /></label>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <div className="flex items-center justify-end gap-3"><div className="mr-auto hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex"><LockKeyhole size={14}/> Votre mot de passe reste confidentiel.</div><button disabled={loading} className="btn btn-primary inline-flex items-center gap-2">{loading ? 'Enregistrement…' : <>Continuer <ArrowRight size={16}/></>}</button></div>
            </form>
          ) : !isAdmin ? (
            <div className="py-10 text-center"><Check className="mx-auto size-12 text-emerald-500"/><h3 className="mt-4 text-xl font-black">Compte sécurisé</h3><p className="mt-2 text-sm text-slate-500">Votre mot de passe a été modifié. Vous pouvez maintenant utiliser votre espace.</p></div>
          ) : dataLoading ? (
            <div className="py-16 text-center text-sm font-semibold text-slate-500">Préparation de votre espace…</div>
          ) : (
            <>
              {step === 0 && <section className="space-y-4"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex gap-3"><UserRound size={19} className="mt-0.5 text-cyan-600"/><p className="text-sm leading-6 text-slate-600">Ajoutez quelques informations utiles pour votre imprimerie. Elles pourront être utilisées sur votre profil public et dans vos communications.</p></div></div><label className="block text-sm font-bold text-slate-700">Bio / présentation<textarea maxLength={1000} className="input mt-2 min-h-28 resize-y" placeholder="Ex. Imprimerie spécialisée dans les flyers, affiches, cartes de visite…" value={profile.bio} onChange={(e) => setProfile((v) => ({ ...v, bio: e.target.value }))}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-700">Téléphone<input className="input mt-2" type="tel" value={profile.phone} onChange={(e) => setProfile((v) => ({ ...v, phone: e.target.value }))}/></label><label className="block text-sm font-bold text-slate-700">WhatsApp<input className="input mt-2" type="tel" value={profile.whatsapp} onChange={(e) => setProfile((v) => ({ ...v, whatsapp: e.target.value }))}/></label><label className="block text-sm font-bold text-slate-700">Ville<input className="input mt-2" value={profile.city} onChange={(e) => setProfile((v) => ({ ...v, city: e.target.value }))}/></label><label className="block text-sm font-bold text-slate-700">Quartier<input className="input mt-2" value={profile.neighborhood} onChange={(e) => setProfile((v) => ({ ...v, neighborhood: e.target.value }))}/></label><label className="block text-sm font-bold text-slate-700 sm:col-span-2">Adresse<input className="input mt-2" value={profile.address} onChange={(e) => setProfile((v) => ({ ...v, address: e.target.value }))} maxLength={500}/></label></div></section>}
              {step === 1 && <section className="space-y-3"><div className="mb-4 rounded-2xl bg-slate-50 p-4"><div className="flex gap-3"><Clock3 size={19} className="mt-0.5 text-cyan-600"/><p className="text-sm leading-6 text-slate-600">Indiquez les horaires habituels de votre imprimerie. Vous pourrez les modifier plus tard.</p></div></div>{profile.openingHours.map((hour, index) => <div key={hour.dayOfWeek} className="grid items-center gap-3 rounded-2xl border border-slate-100 p-3 sm:grid-cols-[120px_90px_1fr]"><span className="text-sm font-bold text-slate-700">{days[hour.dayOfWeek]}</span><label className="flex items-center gap-2 text-xs font-semibold text-slate-500"><input type="checkbox" checked={hour.closed} onChange={(e) => updateHour(index, { closed: e.target.checked })}/> Fermé</label><div className="flex flex-wrap items-center gap-2"><input type="time" className="input max-w-32" disabled={hour.closed} value={minuteToTime(hour.openMinute)} onChange={(e) => updateHour(index, { openMinute: timeToMinute(e.target.value) })}/><span className="text-slate-400">→</span><input type="time" className="input max-w-32" disabled={hour.closed} value={minuteToTime(hour.closeMinute)} onChange={(e) => updateHour(index, { closeMinute: timeToMinute(e.target.value) })}/></div></div>)}</section>}
              {step === 2 && <section className="space-y-4"><div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Ajoutez vos prestations principales avec leur prix. Vous pourrez ensuite gérer votre catalogue et vos règles de consommation dans <strong>Services</strong>.</div><div className="grid gap-3 rounded-2xl border border-slate-100 p-4 sm:grid-cols-2"><input className="input" placeholder="Nom du service" value={service.name} onChange={(e) => setService({ ...service, name: e.target.value })}/><input className="input" placeholder="Catégorie" value={service.category} onChange={(e) => setService({ ...service, category: e.target.value })}/><input className="input" placeholder="Unité (ex. feuille)" value={service.unit} onChange={(e) => setService({ ...service, unit: e.target.value })}/><div className="flex gap-2"><input className="input" type="number" min="0" step="1" placeholder="Prix FCFA" value={service.price} onChange={(e) => setService({ ...service, price: e.target.value })}/><button type="button" onClick={addService} className="btn btn-primary shrink-0" aria-label="Ajouter le service"><Plus size={17}/></button></div></div><div className="space-y-2">{profile.services.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{item.name}</p><p className="text-xs text-slate-400">{item.category || 'Sans catégorie'} · {item.unit} · {Number(item.price).toLocaleString('fr-FR')} FCFA</p></div><button type="button" onClick={() => removeService(index)} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${item.name}`}><Trash2 size={16}/></button></div>)}</div></section>}
              {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={skipOptional} disabled={loading} className="text-sm font-bold text-slate-400 hover:text-slate-700">Ignorer pour le moment</button><div className="flex gap-2">{step > 0 && <button type="button" onClick={() => { setStep((v) => v - 1); setError(''); }} className="btn inline-flex items-center gap-2"><ArrowLeft size={15}/> Retour</button>}{step < totalSteps - 1 ? <button type="button" onClick={() => { setStep((v) => v + 1); setError(''); }} className="btn btn-primary inline-flex items-center gap-2">Continuer <ArrowRight size={15}/></button> : <button type="button" onClick={finish} disabled={loading} className="btn btn-primary inline-flex items-center gap-2">{loading ? 'Enregistrement…' : <>Terminer <Check size={15}/></>}</button>}</div></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
