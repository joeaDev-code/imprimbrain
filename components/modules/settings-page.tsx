
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  LocateFixed,
  Mail,
  MessageCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import type { CTRole } from "@/lib/ct-access";

const days = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

type Hour = {
  dayOfWeek: number;
  openMinute: number | null;
  closeMinute: number | null;
  closed: boolean;
};

type FormState = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  publicProfileEnabled: boolean;
  publicDescription: string;
  city: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  timezone: string;
  openingHours: Hour[];
};

const defaultHours: Hour[] = days.map(
  (_, dayOfWeek) => ({
    dayOfWeek,
    openMinute: 480,
    closeMinute: 1080,
    closed: dayOfWeek === 0,
  }),
);

export default function Settings({
  ctRole,
}: {
  ctRole: CTRole;
}) {
  const [f, setF] = useState<FormState>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    publicProfileEnabled: false,
    publicDescription: "",
    city: "",
    neighborhood: "",
    latitude: "",
    longitude: "",
    timezone: "Africa/Abidjan",
    openingHours: defaultHours,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          },
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Impossible de charger les paramètres.",
          );
        }

        if (cancelled) return;

        setF({
          name: data?.name || "",
          phone: data?.phone || "",
          whatsapp: data?.whatsapp || "",
          email: data?.email || "",
          address: data?.address || "",
          publicProfileEnabled:
            Boolean(
              data?.publicProfileEnabled,
            ),
          publicDescription:
            data?.publicDescription || "",
          city: data?.city || "",
          neighborhood:
            data?.neighborhood || "",
          latitude:
            data?.latitude == null
              ? ""
              : String(data.latitude),
          longitude:
            data?.longitude == null
              ? ""
              : String(data.longitude),
          timezone:
            data?.timezone ||
            "Africa/Abidjan",
          openingHours:
            Array.isArray(
              data?.openingHours,
            ) &&
            data.openingHours.length
              ? data.openingHours
              : defaultHours,
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de charger les paramètres.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateHour(
    index: number,
    patch: Partial<Hour>,
  ) {
    setF((current) => ({
      ...current,
      openingHours:
        current.openingHours.map(
          (hour, i) =>
            i === index
              ? {
                  ...hour,
                  ...patch,
                }
              : hour,
        ),
    }));
  }

  function timeToMinute(value: string) {
    const [hours, minutes] = value
      .split(":")
      .map(Number);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  function minuteToTime(
    value: number | null,
  ) {
    if (
      value == null ||
      !Number.isFinite(value)
    ) {
      return "08:00";
    }

    return `${String(
      Math.floor(value / 60),
    ).padStart(2, "0")}:${String(
      value % 60,
    ).padStart(2, "0")}`;
  }

  async function save(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!f.name.trim()) {
      toast.error(
        "Le nom de l’imprimerie est obligatoire.",
      );
      return;
    }

    const latitude =
      f.latitude.trim() === ""
        ? null
        : Number(f.latitude);

    const longitude =
      f.longitude.trim() === ""
        ? null
        : Number(f.longitude);

    if (
      latitude !== null &&
      (!Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      toast.error(
        "La latitude doit être comprise entre -90 et 90.",
      );
      return;
    }

    if (
      longitude !== null &&
      (!Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      toast.error(
        "La longitude doit être comprise entre -180 et 180.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...f,
        name: f.name.trim(),
        phone: f.phone.trim(),
        whatsapp: f.whatsapp.trim(),
        email: f.email.trim(),
        address: f.address.trim(),
        city: f.city.trim(),
        neighborhood:
          f.neighborhood.trim(),
        publicDescription:
          f.publicDescription.trim(),
        latitude,
        longitude,
      };

      const response = await fetch(
        "/api/settings",
        {
          method: "PATCH",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Enregistrement impossible.",
        );
      }

      toast.success(
        "Paramètres enregistrés.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer les paramètres.",
      );
    } finally {
      setSaving(false);
    }
  }

  function locate() {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      !("geolocation" in navigator)
    ) {
      toast.error(
        "La géolocalisation n’est pas disponible sur cet appareil.",
      );
      return;
    }

    if (!window.isSecureContext) {
      toast.error(
        "La géolocalisation nécessite HTTPS ou localhost.",
      );
      return;
    }

    if (locating) {
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          setLocating(false);

          toast.error(
            "La position reçue est invalide.",
          );

          return;
        }

        setF((current) => ({
          ...current,
          latitude:
            latitude.toFixed(6),
          longitude:
            longitude.toFixed(6),
        }));

        setLocating(false);

        toast.success(
          "Position récupérée avec succès.",
        );
      },
      (error) => {
        setLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              "Permission de localisation refusée. Autorisez la localisation dans votre navigateur puis réessayez.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            toast.error(
              "Position indisponible. Vérifiez que la localisation de votre appareil est activée.",
            );
            break;

          case error.TIMEOUT:
            toast.error(
              "La récupération de la position a pris trop de temps. Réessayez.",
            );
            break;

          default:
            toast.error(
              "Impossible d’obtenir votre position.",
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        ctRole={ctRole}
        title="Paramètres"
        subtitle="Configurez les informations de votre imprimerie et votre présence publique."
      />

      <form
        onSubmit={save}
        className="space-y-5"
      >
        {/* INFORMATIONS DE L'IMPRIMERIE */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <Building2 size={17} />
            </div>

            <div>
              <h2 className="text-sm font-black">
                Informations de l’imprimerie
              </h2>

              <p className="text-[10px] text-slate-400">
                Ces informations peuvent
                apparaître sur vos reçus.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">
                Nom de l’imprimerie *
              </label>

              <input
                className="input"
                value={f.name}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    name: event.target
                      .value,
                  }))
                }
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">
                Téléphone
              </label>

              <input
                className="input"
                type="tel"
                value={f.phone}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    phone: event.target
                      .value,
                  }))
                }
              />
            </div>

            <div>
              <label className="label">
                WhatsApp
              </label>

              <div className="relative">
                <MessageCircle
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className="input pl-9"
                  type="tel"
                  value={f.whatsapp}
                  onChange={(event) =>
                    setF((current) => ({
                      ...current,
                      whatsapp:
                        event.target
                          .value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className="input pl-9"
                  type="email"
                  value={f.email}
                  onChange={(event) =>
                    setF((current) => ({
                      ...current,
                      email:
                        event.target
                          .value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">
                Adresse
              </label>

              <input
                className="input"
                value={f.address}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    address:
                      event.target
                        .value,
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* PROFIL PUBLIC */}
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black">
                Profil public · Discover
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Publiez votre imprimerie
                uniquement lorsque le
                profil est prêt.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={
                  f.publicProfileEnabled
                }
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    publicProfileEnabled:
                      event.target
                        .checked,
                  }))
                }
              />

              Visible sur Discover
            </label>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">
                Description publique
              </label>

              <textarea
                className="input min-h-24 resize-y"
                maxLength={1000}
                value={
                  f.publicDescription
                }
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    publicDescription:
                      event.target
                        .value,
                  }))
                }
                placeholder="Présentez brièvement votre imprimerie, vos spécialités et votre clientèle."
              />
            </div>

            <div>
              <label className="label">
                Ville
              </label>

              <input
                className="input"
                maxLength={100}
                value={f.city}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    city: event.target
                      .value,
                  }))
                }
              />
            </div>

            <div>
              <label className="label">
                Quartier
              </label>

              <input
                className="input"
                maxLength={120}
                value={f.neighborhood}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    neighborhood:
                      event.target
                        .value,
                  }))
                }
              />
            </div>

            {/* LATITUDE */}
            <div>
              <label className="label">
                Latitude
              </label>

              <input
                className="input"
                inputMode="decimal"
                value={f.latitude}
                onChange={(event) =>
                  setF((current) => ({
                    ...current,
                    latitude:
                      event.target
                        .value,
                  }))
                }
                placeholder="Ex. 5.3364"
              />
            </div>

            {/* LONGITUDE + GEOLOCALISATION */}
            <div>
              <label className="label">
                Longitude
              </label>

              <div className="flex gap-2">
                <input
                  className="input min-w-0 flex-1"
                  inputMode="decimal"
                  value={f.longitude}
                  onChange={(event) =>
                    setF((current) => ({
                      ...current,
                      longitude:
                        event.target
                          .value,
                    }))
                  }
                  placeholder="Ex. -4.0267"
                />

                <button
                  type="button"
                  onClick={locate}
                  disabled={
                    locating ||
                    loading
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LocateFixed
                    size={15}
                    className={
                      locating
                        ? "animate-pulse"
                        : ""
                    }
                  />

                  <span>
                    {locating
                      ? "Localisation…"
                      : "Position"}
                  </span>
                </button>
              </div>

              <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                Cliquez sur « Position »
                pour récupérer automatiquement
                les coordonnées GPS de
                l’appareil.
              </p>
            </div>
          </div>
        </section>

        {/* HORAIRES PUBLICS */}
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={17} />
            </div>

            <div>
              <h2 className="text-sm font-black">
                Horaires publics
              </h2>

              <p className="text-[10px] text-slate-400">
                Ces horaires seront affichés
                sur votre fiche.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {f.openingHours.map(
              (hour, index) => (
                <div
                  key={hour.dayOfWeek}
                  className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[140px_100px_1fr]"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {
                      days[
                        hour.dayOfWeek
                      ]
                    }
                  </span>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <input
                      type="checkbox"
                      checked={
                        hour.closed
                      }
                      onChange={(event) =>
                        updateHour(
                          index,
                          {
                            closed:
                              event
                                .target
                                .checked,
                          },
                        )
                      }
                    />

                    Fermé
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      className="input max-w-36"
                      disabled={
                        hour.closed
                      }
                      value={minuteToTime(
                        hour.openMinute,
                      )}
                      onChange={(event) =>
                        updateHour(
                          index,
                          {
                            openMinute:
                              timeToMinute(
                                event
                                  .target
                                  .value,
                              ),
                          },
                        )
                      }
                    />

                    <span className="text-slate-400">
                      →
                    </span>

                    <input
                      type="time"
                      className="input max-w-36"
                      disabled={
                        hour.closed
                      }
                      value={minuteToTime(
                        hour.closeMinute,
                      )}
                      onChange={(event) =>
                        updateHour(
                          index,
                          {
                            closeMinute:
                              timeToMinute(
                                event
                                  .target
                                  .value,
                              ),
                          },
                        )
                      }
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex items-center justify-between gap-3">
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <CheckCircle2
              size={15}
              className="text-emerald-500"
            />

            Les données publiques sont
            désactivées par défaut.
          </div>

          <button
            type="submit"
            className="btn btn-primary inline-flex items-center gap-2"
            disabled={
              saving ||
              loading ||
              locating
            }
          >
            <Save size={15} />

            {saving
              ? "Enregistrement…"
              : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}