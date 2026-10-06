import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";

import { LandingFooter } from "./landing-footer";

const features = [
  {
    icon: BarChart3,
    title: "Pilotage centralisé",
    text: "Visualisez vos commandes, paiements et alertes stock depuis un tableau de bord clair.",
    featured: true,
  },
  {
    icon: ClipboardList,
    title: "Commandes centralisées",
    text: "Créez et suivez chaque prestation sans multiplier les fichiers et carnets.",
    featured: false,
  },
  {
    icon: Users,
    title: "Clients & employés",
    text: "Retrouvez vos clients et adaptez les accès de votre équipe grâce aux rôles.",
    featured: false,
  },
  {
    icon: Bell,
    title: "Alertes utiles",
    text: "Soyez informé des niveaux de stock et des opérations qui demandent votre attention.",
    featured: false,
  },
  {
    icon: Package,
    title: "Gestion du stock",
    text: "Suivez les entrées, sorties, ajustements et seuils de vos consommables.",
    featured: false,
  },
  {
    icon: CreditCard,
    title: "Paiements simplifiés",
    text: "Gérez les paiements partiels, les soldes et les différents moyens d’encaissement.",
    featured: false,
  },
  {
    icon: Receipt,
    title: "Reçus professionnels",
    text: "Générez des reçus propres, consultables et prêts à être imprimés.",
    featured: false,
  },
  {
    icon: ShieldCheck,
    title: "Sécurité & permissions",
    text: "Les accès sont organisés par rôle et les opérations importantes sont journalisées.",
    featured: false,
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Créez votre espace",
    text: "Configurez votre imprimerie et vos services.",
  },
  {
    number: "02",
    title: "Enregistrez vos opérations",
    text: "Clients, prestations, commandes, paiements et stock.",
  },
  {
    number: "03",
    title: "Pilotez votre activité",
    text: "Retrouvez les informations importantes au même endroit.",
  },
] as const;

const faqs = [
  {
    question: "Imprim’Brain est-il adapté aux petites imprimeries ?",
    answer:
      "Oui. L’interface est pensée pour centraliser les opérations essentielles sans imposer une usine à gaz.",
  },
  {
    question: "Puis-je gérer plusieurs employés ?",
    answer:
      "Oui. Le système prévoit des rôles et des permissions pour adapter l’accès aux différents collaborateurs.",
  },
  {
    question: "Le paiement partiel est-il géré ?",
    answer:
      "Oui. Une commande peut être créée avec un paiement nul, partiel ou complet, avec calcul du reste à payer.",
  },
  {
    question: "Puis-je imprimer les reçus ?",
    answer:
      "Oui. Les reçus sont conçus pour être consultés et imprimés depuis l’application.",
  },
] as const;

const dashboardStats = [
  ["Commandes", "128", ClipboardList],
  ["Clients", "84", Users],
  ["Encaissements", "1,24 M", CreditCard],
  ["Stock", "12 alertes", Package],
] as const;

const activityBars = [34, 48, 42, 66, 57, 78, 62, 88, 71, 96, 83, 108];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#101827]">
      

      {/* =========================================================
          HERO
          ========================================================= */}
      <section className="relative overflow-hidden bg-white">
        {/* Decorative brand shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-blue-50/80 blur-[2px]" />

          <div className="absolute -right-40 top-[28%] h-[500px] w-[500px] rounded-full bg-cyan-50/80 blur-[4px]" />

          <div className="absolute left-1/2 top-[38%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-50/60 blur-[100px]" />

          <div className="absolute left-[4%] top-[48%] h-32 w-32 rounded-full border-[18px] border-blue-100/80" />

          <div className="absolute right-[5%] top-[18%] h-44 w-44 rounded-full border-[24px] border-cyan-100/80" />

          <div className="absolute right-[20%] top-[12%] h-8 w-8 rounded-full bg-blue-200/70" />

          <div className="absolute left-[18%] top-[18%] h-5 w-5 rounded-full bg-cyan-200/80" />

          <div className="absolute left-[42%] top-[-180px] h-[350px] w-[350px] rounded-full bg-blue-50/70 blur-3xl" />

          <div className="absolute bottom-[8%] right-[-100px] h-[260px] w-[260px] rotate-45 rounded-[70px] bg-cyan-50/80" />

          <div className="absolute left-[8%] top-[65%] h-3 w-3 rounded-full bg-blue-300/70" />
          <div className="absolute left-[11%] top-[68%] h-2 w-2 rounded-full bg-cyan-300/70" />
          <div className="absolute right-[12%] top-[62%] h-3 w-3 rounded-full bg-cyan-300/70" />

          <div className="absolute bottom-[18%] right-[14%] h-28 w-28 rounded-full border border-blue-200/80" />

          {/* Small logo-inspired accent */}
          <div className="absolute right-[25%] top-[22%] h-2.5 w-2.5 rounded-full bg-pink-400/70" />
          <div className="absolute left-[27%] top-[30%] h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-6 lg:px-8">
          {/* Hero content */}
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_0_4px_rgba(6,182,212,0.10)]" />
              Gestion intelligente pour imprimeries
            </div>

            <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[#101827] sm:text-6xl lg:text-[76px]">
              Gérez votre imprimerie.
              <span className="mt-2 block bg-gradient-to-r from-[var(--blue)] to-[var(--primary)] bg-clip-text text-transparent">
                Plus simplement.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              Clients, prestations, commandes, paiements, stocks et reçus.
              Imprim’Brain rassemble l’essentiel de votre imprimerie dans un
              seul espace.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>

              <a
                href="#fonctionnalites"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-7 py-3.5 text-sm font-semibold text-[#101827] shadow-sm backdrop-blur transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-[var(--primary-hover)]"
              >
                Découvrir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Product mockups card */}
          <div className="relative z-10 mt-20 overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/85 px-4 pb-20 pt-10 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:pt-14 lg:px-12">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />

              <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-cyan-100/80 blur-3xl" />

              <div className="absolute left-1/2 top-1/2 h-[400px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/70 blur-[80px]" />

              <div className="absolute left-[5%] top-[28%] h-24 w-24 rounded-full border-[12px] border-blue-100/80" />

              <div className="absolute right-[6%] top-[40%] h-36 w-36 rounded-full border-[16px] border-cyan-100/80" />

              <div className="absolute right-[17%] top-[10%] h-16 w-16 rotate-12 rounded-2xl bg-blue-100/60" />

              <div className="absolute bottom-[12%] left-[17%] h-10 w-10 rounded-full bg-cyan-100/90" />

              <div className="absolute right-[22%] top-[17%] h-3 w-3 rounded-full bg-pink-400/70" />
              <div className="absolute bottom-[20%] left-[25%] h-3 w-3 rounded-full bg-yellow-400/80" />
            </div>

            <div className="relative z-10 mx-auto mb-12 max-w-xl text-center">
              <span className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--blue)] shadow-sm">
                Une interface pensée pour le terrain
              </span>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#101827] sm:text-3xl">
                Votre imprimerie, partout avec vous.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Travaillez depuis votre ordinateur ou votre téléphone, avec une
                expérience adaptée à chaque écran.
              </p>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl">
              {/* Desktop mockup */}
              <div className="relative z-10 mx-auto max-w-5xl">
                <div className="rounded-[24px] border border-slate-300 bg-[#0b1f3a] p-2 shadow-[0_40px_100px_rgba(15,23,42,0.20)] sm:rounded-[30px]">
                  <div className="flex h-8 items-center gap-1.5 px-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />

                    <div className="mx-auto hidden h-4 w-1/3 rounded-full bg-white/[0.06] sm:block" />
                  </div>

                  <div className="overflow-hidden rounded-[18px] bg-white sm:rounded-[22px]">
                    <Image
                      src="/images/landing/hero/dashboard-desktop.png"
                      alt="Interface Imprim’Brain sur ordinateur"
                      width={1600}
                      height={1000}
                      priority
                      className="block h-auto w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile mockup */}
              <div className="absolute bottom-[-80px] right-[4%] z-30 w-[115px] sm:w-[140px] md:right-[8%] md:w-[155px] lg:bottom-[-105px] lg:right-[10%] lg:w-[185px]">
                <div className="rounded-[27px] border-[7px] border-[#0b1f3a] bg-[#0b1f3a] p-1 shadow-[0_35px_90px_rgba(15,23,42,0.30)] lg:rounded-[34px] lg:border-[8px]">
                  <div className="overflow-hidden rounded-[20px] bg-white lg:rounded-[25px]">
                    <Image
                      src="/images/landing/hero/dashboard-mobile.png"
                      alt="Interface Imprim’Brain sur mobile"
                      width={600}
                      height={1200}
                      className="block h-auto w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-24 sm:h-28" />
          </div>
        </div>
      </section>

      {/* =========================================================
    FEATURES
    ========================================================= */}
      <section
        id="fonctionnalites"
        className="relative bg-[#f7f9fc] py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--blue)]">
              Fonctionnalités Imprim’Brain
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-.03em] text-[#101827] sm:text-5xl">
              Tout ce qu’il faut pour gérer votre activité, au même endroit.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Une expérience claire pour suivre vos opérations quotidiennes sans
              vous perdre dans des outils dispersés.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, featured }) => (
              <article
                key={title}
                className={
                  featured
                    ? "group min-h-[225px] rounded-[1.5rem] border border-[var(--blue)] bg-gradient-to-br from-[#0b1f3a] to-[var(--blue)] p-6 text-white shadow-xl shadow-blue-900/15 transition duration-300 hover:-translate-y-1"
                    : "group min-h-[225px] rounded-[1.5rem] border border-slate-200 bg-white p-6 text-[#101827] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
                }
              >
                <div
                  className={
                    featured
                      ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-cyan-200"
                      : "flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-[var(--primary)]"
                  }
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-base font-bold leading-6">{title}</h3>

                <p
                  className={
                    featured
                      ? "mt-3 text-xs leading-6 text-blue-100/80"
                      : "mt-3 text-xs leading-6 text-slate-500"
                  }
                >
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
          ========================================================= */}
      <section id="fonctionnement" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--blue)]">
                Comment ça marche
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-.03em] text-[#101827] sm:text-5xl">
                Une gestion pensée pour le quotidien.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                L’objectif est simple : réduire les tâches dispersées et vous
                donner une vision claire de votre activité.
              </p>

              <div className="mt-9 space-y-6">
                {steps.map(({ number, title, text }) => (
                  <div key={number} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-xs font-bold text-white shadow-lg shadow-blue-600/15">
                      {number}
                    </span>

                    <div>
                      <h3 className="font-bold text-[#101827]">{title}</h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-[#0b1f3a] p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

              <div className="relative rounded-[1.5rem] border border-white/10 bg-white/[.06] p-5 backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] text-slate-300/60">
                      Commande #IB-1048
                    </p>

                    <p className="mt-1 font-bold text-white">
                      Impression couleur A4
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold text-emerald-300">
                    En cours
                  </span>
                </div>

                <div className="space-y-4 py-5 text-sm">
                  {[
                    ["Client", "Entreprise ABC"],
                    ["Quantité", "250 feuilles"],
                    ["Total", "25 000 FCFA"],
                    ["Encaissé", "15 000 FCFA"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-slate-300/60">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/[.08] p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />

                    <div>
                      <p className="text-sm font-bold text-white">
                        Suivi centralisé
                      </p>

                      <p className="text-xs text-slate-300/60">
                        Client, commande, paiement et stock au même endroit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-semibold text-cyan-200">
                  <FileText className="h-3.5 w-3.5" />
                  Reçu professionnel prêt à imprimer
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT / PRICING CTA
          ========================================================= */}
      <section id="tarifs" className="bg-[#0b1f3a] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--primary)]">
            Votre espace de gestion
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-.03em] sm:text-5xl">
            Structurez votre imprimerie dès maintenant.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300/70 sm:text-base">
            Centralisez vos opérations dans une seule application et donnez à
            votre équipe un espace de travail clair.
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-white/10 bg-white/[.07] p-7 text-left shadow-2xl backdrop-blur sm:p-9">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-[var(--primary)]">
                  IMPRIM’BRAIN
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  Une gestion simple et centralisée
                </h3>
              </div>

              <div className="rounded-2xl bg-white/10 p-3">
                <Zap className="h-5 w-5 text-[var(--primary)]" />
              </div>
            </div>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Clients et prestations",
                "Commandes et paiements",
                "Gestion du stock",
                "Reçus professionnels",
                "Utilisateurs et permissions",
                "Journal des opérations",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-300/75"
                >
                  <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="/login"
              className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Accéder à mon espace
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
          ========================================================= */}
      <section id="faq" className="bg-[#f7f9fc] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--blue)]">
              FAQ
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-[-.03em] text-[#101827] sm:text-5xl">
              Questions fréquentes
            </h2>
          </div>

          <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#101827]">
                  {question}

                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>

                <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-slate-500">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
          ========================================================= */}
      <section className="px-5 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-[#0b1f3a] via-[#1557d6] to-[#06b6d4] px-7 py-14 text-center text-white shadow-2xl shadow-blue-700/20 sm:px-12">
          <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-6 w-6 text-cyan-200" />
            </div>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Prêt à mieux gérer votre imprimerie ?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-blue-50/80 sm:text-base">
              Passez d’une gestion dispersée à un espace de travail centralisé.
            </p>

            <a
              href="/login"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[var(--blue)] transition hover:bg-cyan-50"
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
