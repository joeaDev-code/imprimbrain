"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  mockDiscoverShops,
  type DiscoverPrintShop,
} from "@/lib/mock/discover";

const serviceFilters = [
  "Tous",
  "Impression numérique",
  "Flyers",
  "Cartes de visite",
  "Reprographie",
  "Reliure",
];

export function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [service, setService] = useState("Tous");
  const [nearby, setNearby] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const shops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockDiscoverShops.filter((shop) => {
      const matchesQuery =
        !normalizedQuery ||
        shop.name.toLowerCase().includes(normalizedQuery) ||
        shop.city.toLowerCase().includes(normalizedQuery) ||
        shop.neighborhood.toLowerCase().includes(normalizedQuery) ||
        shop.services.some((item) =>
          item.toLowerCase().includes(normalizedQuery),
        );

      const matchesService =
        service === "Tous" || shop.services.includes(service);

      return matchesQuery && matchesService;
    }).sort((a, b) => {
      if (nearby) return a.distanceKm - b.distanceKm;
      return Number(b.isOpen) - Number(a.isOpen);
    });
  }, [query, service, nearby]);

  function handleNearby() {
    if (!navigator.geolocation) {
      setLocationMessage(
        "La localisation n’est pas disponible sur cet appareil.",
      );
      return;
    }

    setLocationMessage("Recherche des imprimeries autour de vous…");
    navigator.geolocation.getCurrentPosition(
      () => {
        setNearby(true);
        setLocationMessage("Imprimeries triées par proximité.");
      },
      () => {
        setLocationMessage(
          "Autorisez la localisation pour utiliser la recherche autour de vous.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-pink-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <header className="mb-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-extrabold tracking-tight text-slate-950"
            >
              Imprim<span className="text-cyan-500">’</span>Brain
            </Link>

            <Link
              href="/login"
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Connexion
            </Link>
          </header>

          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700">
              <MapPin className="h-3.5 w-3.5" />
              Le réseau des imprimeries
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
              Trouvez une imprimerie
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                près de chez vous.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Découvrez les imprimeries disponibles autour de vous et trouvez
              rapidement les services dont vous avez besoin.
            </p>

            <div className="mx-auto mt-8 max-w-3xl">
              <div className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 sm:flex-row">
                <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl px-4 text-left">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ville, quartier, imprimerie ou service..."
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleNearby}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  <LocateFixed className="h-4 w-4" />
                  Autour de moi
                </button>
              </div>

              {locationMessage && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {locationMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-600">
                {nearby ? "Autour de vous" : "Explorer"}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
                Imprimeries disponibles
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{shops.length} résultat{shops.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {serviceFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setService(filter)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                  service === filter
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {shops.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <DiscoverShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-4 font-extrabold text-slate-900">
                Aucune imprimerie trouvée
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Essayez une autre ville, un autre quartier ou un autre service.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-[2rem] bg-[var(--sidebar)] p-7 text-white sm:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Vous êtes imprimeur ?
              </p>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                Faites découvrir votre imprimerie.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Présentez vos services et permettez à vos futurs clients de
                vous trouver plus facilement.
              </p>
              <Link
                href="/inscription"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50"
              >
                Créer mon espace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
          <span className="font-bold text-cyan-600">Imprim’Brain</span> ·
          Trouver une imprimerie simplement.
        </div>
      </footer>
    </main>
  );
}

function DiscoverShopCard({ shop }: { shop: DiscoverPrintShop }) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-100 hover:shadow-lg hover:shadow-slate-900/5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img
            src={shop.logo}
            alt=""
            className="h-full w-full object-contain p-2"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                shop.isOpen ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  shop.isOpen ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {shop.isOpen ? "Ouvert" : "Fermé"}
            </span>

            <span className="text-xs font-semibold text-slate-400">
              {shop.distanceKm.toFixed(1)} km
            </span>
          </div>

          <h3 className="mt-2 truncate font-extrabold text-slate-950">
            {shop.name}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {shop.neighborhood}, {shop.city}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
        {shop.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {shop.services.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
          >
            {item}
          </span>
        ))}
      </div>

      <Link
        href={`/imp/${shop.slug}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition group-hover:bg-[var(--primary)]"
      >
        Voir la fiche
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
