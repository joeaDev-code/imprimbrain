"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) return setError("Les deux nouveaux mots de passe ne correspondent pas.");
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setError(data?.error || "Impossible de modifier le mot de passe."); return; }
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      if (me?.user?.role === "SUPER_ADMIN") router.replace("/ad/super-admin");
      else if (me?.user?.organizationId && me?.user?.role) router.replace(`/ct/${String(me.user.role).toLowerCase()}`);
      else router.replace("/login");
    } catch { setError("Impossible de contacter le serveur."); }
    finally { setSaving(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10"><div className="w-full max-w-md"><div className="mb-8 flex justify-center"><Logo variant="full" width={180} height={52} priority /></div><form onSubmit={submit} className="rounded-3xl border bg-white p-6 shadow-xl sm:p-8"><div className="mb-7"><div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><LockKeyhole size={22}/></div><h1 className="text-2xl font-black text-slate-950">Sécurisez votre compte</h1><p className="mt-2 text-sm leading-6 text-slate-500">Votre administrateur vous a fourni un mot de passe initial. Choisissez maintenant votre mot de passe personnel.</p></div><div className="space-y-4"><label className="block text-sm font-semibold">Mot de passe actuel<input required type={show ? "text" : "password"} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border px-4 outline-none focus:border-cyan-500"/></label><label className="block text-sm font-semibold">Nouveau mot de passe<div className="relative mt-2"><input required minLength={10} type={show ? "text" : "password"} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="h-12 w-full rounded-xl border px-4 pr-12 outline-none focus:border-cyan-500"/><button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><label className="block text-sm font-semibold">Confirmation<input required minLength={10} type={show ? "text" : "password"} value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-2 h-12 w-full rounded-xl border px-4 outline-none focus:border-cyan-500"/></label></div>{error&&<div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<div className="mt-5 flex items-start gap-2 rounded-xl bg-cyan-50 p-3 text-xs leading-5 text-cyan-800"><ShieldCheck size={16} className="mt-0.5 shrink-0"/>Votre mot de passe est stocké sous forme de hash et ne peut pas être récupéré depuis la base.</div><button disabled={saving} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-black text-white disabled:opacity-50">{saving?"Enregistrement…":<>Continuer <ArrowRight size={16}/></>}</button></form></div></main>;
}
