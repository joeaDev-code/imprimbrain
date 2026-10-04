import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";

const features = [
  {
    icon: ClipboardList,
    title: "Commandes centralisées",
    text: "Créez, suivez et gérez les prestations de vos clients depuis un seul espace.",
  },
  {
    icon: Users,
    title: "Gestion des clients",
    text: "Retrouvez rapidement les informations et l'historique de chaque client.",
  },
  {
    icon: Package,
    title: "Stock maîtrisé",
    text: "Suivez vos consommables, seuils d'alerte et mouvements de stock.",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    text: "Gérez les paiements partiels, soldes et montants à rendre sans calcul manuel.",
  },
  {
    icon: FileText,
    title: "Reçus professionnels",
    text: "Générez des reçus clairs et prêts à imprimer pour chaque prestation.",
  },
  {
    icon: BarChart3,
    title: "Pilotage",
    text: "Visualisez les données utiles à la gestion quotidienne de votre imprimerie.",
  },
];

const steps = [
  ["01", "Créez votre espace", "Configurez votre imprimerie et vos services."],
  ["02", "Gérez vos prestations", "Enregistrez clients, commandes et paiements."],
  ["03", "Pilotez votre activité", "Suivez votre stock et vos opérations au même endroit."],
];

const faqs = [
  ["Imprim’Brain est-il adapté aux petites imprimeries ?", "Oui. L’interface est pensée pour centraliser les opérations essentielles sans imposer une usine à gaz."],
  ["Puis-je gérer plusieurs employés ?", "Oui. Le système prévoit des rôles et des permissions pour adapter l’accès aux différents collaborateurs."],
  ["Le paiement partiel est-il géré ?", "Oui. Une commande peut être créée avec un paiement nul, partiel ou complet, avec calcul du reste à payer."],
  ["Puis-je imprimer les reçus ?", "Oui. Les reçus sont conçus pour être consultés et imprimés depuis l’application."],
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <LandingHeader />

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_15%,rgba(6,182,212,.14),transparent_30%),linear-gradient(to_bottom,#f8fdff,#fff)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              <Sparkles className="h-4 w-4" />
              Gestion intelligente pour imprimeries
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Gérez votre imprimerie
              <span className="text-cyan-500"> simplement.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Imprim’Brain centralise vos clients, prestations, commandes,
              paiements, stocks et reçus pour vous aider à travailler plus
              efficacement au quotidien.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/inscription" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-600">
                Commencer maintenant <ArrowRight className="h-5 w-5" />
              </a>
              <a href="/connexion" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700">
                Se connecter
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              {["Simple à prendre en main", "Pensé pour les imprimeries", "Données sécurisées"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-500" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
              <div className="rounded-2xl bg-slate-950 p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Vue d’ensemble</p>
                    <p className="mt-1 text-lg font-bold text-white">Mon imprimerie</p>
                  </div>
                  <div className="rounded-xl bg-cyan-400/15 p-2.5 text-cyan-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Commandes", "128", ClipboardList],
                    ["Clients", "84", Users],
                    ["Paiements", "1,24 M", CreditCard],
                    ["Stock", "12 alertes", Package],
                  ].map(([label, value, Icon]) => (
                    <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <Icon className="mb-5 h-4 w-4 text-cyan-300" />
                      <p className="text-xs text-slate-400">{label as string}</p>
                      <p className="mt-1 font-bold text-white">{value as string}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Activité récente</span>
                    <span className="text-xs text-cyan-300">Cette semaine</span>
                  </div>
                  <div className="flex h-28 items-end gap-2">
                    {[35, 52, 44, 72, 60, 86, 68, 94, 78, 100, 88, 112].map((height, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-cyan-400/80" style={{ height: `${height / 1.25}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="border-y border-slate-100 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-600">Tout au même endroit</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Les outils essentiels pour votre activité</h2>
            <p className="mt-4 text-slate-600">Moins de dispersion, plus de visibilité sur vos opérations quotidiennes.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-500/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-600">Simple à utiliser</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Une gestion pensée pour le terrain</h2>
              <p className="mt-5 leading-7 text-slate-600">
                L’objectif est simple : vous permettre de passer moins de temps à
                chercher des informations et plus de temps à faire avancer votre activité.
              </p>
              <div className="mt-8 space-y-6">
                {steps.map(([number, title, text]) => (
                  <div key={number} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{number}</span>
                    <div>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50/60 p-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs text-slate-400">Commande #IB-1048</p>
                    <p className="mt-1 font-bold">Impression couleur A4</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">En cours</span>
                </div>
                <div className="space-y-3 py-5 text-sm">
                  {[
                    ["Client", "Entreprise ABC"],
                    ["Quantité", "250 feuilles"],
                    ["Total", "25 000 FCFA"],
                    ["Encaissé", "15 000 FCFA"],
                  ].map(([a, b]) => (
                    <div key={a} className="flex justify-between gap-4">
                      <span className="text-slate-500">{a}</span>
                      <span className="font-semibold">{b}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="text-sm font-bold">Suivi centralisé</p>
                      <p className="text-xs text-slate-500">Client, commande, paiement et stock au même endroit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-300">Une gestion plus simple</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Commencez à structurer votre imprimerie</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
            Centralisez vos opérations dans une seule application et donnez à votre équipe un espace de travail clair.
          </p>
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-white/[.06] p-7 text-left">
            <p className="text-sm font-semibold text-cyan-300">Imprim’Brain</p>
            <h3 className="mt-2 text-2xl font-bold">Votre espace de gestion</h3>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {["Clients et prestations", "Commandes et paiements", "Gestion du stock", "Reçus professionnels", "Utilisateurs et permissions"].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> {x}</li>
              ))}
            </ul>
            <a href="/inscription" className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">
              Créer mon espace <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions fréquentes</h2>
          </div>
          <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                  {question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-cyan-500 px-7 py-12 text-center text-white shadow-2xl shadow-cyan-500/20 sm:px-12">
          <Zap className="mx-auto h-8 w-8" />
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Prêt à mieux gérer votre imprimerie ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-cyan-50">Passez d’une gestion dispersée à un espace de travail centralisé.</p>
          <a href="/inscription" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-cyan-700 transition hover:bg-cyan-50">
            Commencer maintenant <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
