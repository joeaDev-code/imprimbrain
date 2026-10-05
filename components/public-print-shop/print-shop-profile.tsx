import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock3, MapPin,
  MessageCircle, Phone, Quote, ShieldCheck,
} from "lucide-react";
import type { MockPrintShop } from "@/lib/mock/print-shops";
import { PrintShopServices } from "./print-shop-services";
import { PrintShopContact } from "./print-shop-contact";

type Props = { shop: MockPrintShop };

export function PrintShopProfile({ shop }: Props) {
  const whatsappNumber = shop.whatsapp.replace(/\D/g, "");

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[var(--primary)]">
            <ArrowLeft className="h-4 w-4" /> Imprim’Brain
          </Link>
          <span className="hidden text-xs font-medium text-slate-400 sm:block">
            Fiche publique d’imprimerie
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex justify-center md:justify-start">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 sm:h-36 sm:w-36">
                <Image src={shop.logo} alt={`Logo de ${shop.name}`} width={144} height={144}
                  className="h-full w-full object-contain p-4" priority />
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  shop.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${shop.isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {shop.isOpen ? "Ouvert actuellement" : "Fermé actuellement"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                  <MapPin className="h-3.5 w-3.5" /> {shop.city} · {shop.neighborhood}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{shop.name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{shop.shortDescription}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={`tel:${shop.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]">
                  <Phone className="h-4 w-4" /> Appeler
                </a>
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
                  Demander un devis <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><ShieldCheck className="h-5 w-5" /></div>
                <div><h2 className="text-xl font-extrabold text-slate-950">À propos</h2><p className="text-sm text-slate-500">Découvrez l’imprimerie</p></div>
              </div>
              <p className="text-[15px] leading-7 text-slate-600">{shop.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {shop.highlights.map((highlight) => (
                  <span key={highlight} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500" /> {highlight}
                  </span>
                ))}
              </div>
            </section>

            <PrintShopServices services={shop.services} />

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Clock3 className="h-5 w-5" /></div>
                <div><h2 className="text-xl font-extrabold text-slate-950">Horaires</h2><p className="text-sm text-slate-500">Quand nous trouver</p></div>
              </div>
              <div className="divide-y divide-slate-100">
                {shop.hours.map((item) => (
                  <div key={item.day} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="font-semibold text-slate-700">{item.day}</span>
                    <span className={item.closed ? "text-slate-400" : "text-slate-600"}>
                      {item.closed ? "Fermé" : `${item.open} – ${item.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600"><Quote className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Une impression simple et professionnelle</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Contactez directement l’imprimerie pour discuter de votre besoin, obtenir un devis et connaître les délais de production.
                  </p>
                </div>
              </div>
            </section>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start"><PrintShopContact shop={shop} /></aside>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Fiche publiée avec <span className="font-bold text-cyan-600">Imprim’Brain</span></p>
          <a href="/" className="font-semibold text-slate-600 transition-colors hover:text-cyan-600">Découvrir Imprim’Brain</a>
        </div>
      </footer>
    </main>
  );
}
