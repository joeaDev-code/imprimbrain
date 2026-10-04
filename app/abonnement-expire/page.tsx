import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function SubscriptionExpiredPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600"><ShieldAlert size={30}/></div><h1 className="mt-5 text-2xl font-black text-slate-950">Accès suspendu</h1><p className="mt-3 text-sm leading-6 text-slate-500">Votre organisation n’a plus d’abonnement actif ou son accès a été suspendu. Contactez l’administrateur de la plateforme pour renouveler votre accès.</p><Link href="/login" className="mt-7 inline-flex rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700">Retour à la connexion</Link></section></main>;
}
