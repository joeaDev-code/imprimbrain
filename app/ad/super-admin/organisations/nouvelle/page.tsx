"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  FileImage,
  KeyRound,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { superAdminApi } from "@/lib/super-admin-api";

type CreatedOrganization = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  adminEmail: string;
  password: string;
  logoUrl: string;
  subscription: { amount: number; currency: string; status: string; startsAt: string; expiresAt: string };
  payment: { amount: number; currency: string; status: string; reference: string; paidAt: string };
  emailStatus: "sent" | "failed" | "not_configured";
};

function generatePassword(length = 16) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "-_@#";

  const all = uppercase + lowercase + numbers + symbols;

  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  let password = "";

  password += uppercase[values[0] % uppercase.length];
  password += lowercase[values[1] % lowercase.length];
  password += numbers[values[2] % numbers.length];
  password += symbols[values[3] % symbols.length];

  for (let i = 4; i < length; i++) {
    password += all[values[i] % all.length];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function buildWhatsAppMessage(data: CreatedOrganization) {
  return [
    `Bonjour,`,
    ``,
    `Votre espace Imprim'Brain a été créé avec succès.`,
    ``,
    `🏢 Organisation : ${data.name}`,
    `🔗 Adresse : ${window.location.origin}/login`,
    ``,
    `🔐 Identifiants de connexion`,
    `Identifiant : ${data.adminEmail}`,
    `Mot de passe : ${data.password}`,
    ``,
    `Veuillez conserver ces informations et modifier votre mot de passe après votre première connexion.`,
    ``,
    `Bienvenue sur Imprim'Brain.`,
  ].join("\n");
}

export default function NewOrganizationPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [copied, setCopied] = useState<
    "password" | "credentials" | null
  >(null);

  const [createdOrganization, setCreatedOrganization] =
    useState<CreatedOrganization | null>(null);

  const generatedSlug = useMemo(() => {
    if (slug.trim()) return slug;

    return normalizeSlug(name);
  }, [name, slug]);

  function handleNameChange(value: string) {
    setName(value);

    if (!slug.trim()) {
      setSlug(normalizeSlug(value));
    }
  }

  function regeneratePassword() {
    setPassword(generatePassword());
    setCopied(null);
  }

  async function copyText(
    value: string,
    type: "password" | "credentials",
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      window.setTimeout(() => {
        setCopied(null);
      }, 1800);
    } catch {
      setError("Impossible de copier le contenu.");
    }
  }

  function handleLogoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Le logo ne doit pas dépasser 5 Mo.");
      return;
    }

    setError("");
    setLogoFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setLogoPreview(
        typeof reader.result === "string" ? reader.result : null,
      );
    };

    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const organizationName = name.trim();
    const organizationSlug = generatedSlug.trim();
    const organizationPhone = phone.trim();
    const organizationAddress = address.trim();
    const administratorEmail = adminEmail.trim();

    if (!organizationName) {
      setError("Le nom de l'organisation est obligatoire.");
      return;
    }

    if (!organizationSlug) {
      setError("Le slug de l'organisation est obligatoire.");
      return;
    }

    if (!organizationPhone) {
      setError("Le contact téléphonique est obligatoire.");
      return;
    }

    if (!organizationAddress) {
      setError("L'adresse est obligatoire.");
      return;
    }

    if (!administratorEmail) {
      setError("L'e-mail professionnel de l'administrateur est obligatoire.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      setSaving(true);

      if (!logoFile) {
        setError("Le logo de l'organisation est obligatoire.");
        return;
      }
      const payload = new FormData();
      payload.set("name", organizationName);
      payload.set("slug", organizationSlug);
      payload.set("phone", organizationPhone);
      payload.set("address", organizationAddress);
      payload.set("email", administratorEmail);
      payload.set("password", password);
      payload.set("logo", logoFile);

      const response = await superAdminApi.createOrganization(payload);

      setCreatedOrganization({
        id: response.organization.id,
        name: response.organization.name,
        slug: response.organization.slug,
        phone: organizationPhone,
        address: organizationAddress,
        adminEmail: response.administrator.email,
        password,
        logoUrl: response.organization.logoUrl,
        subscription: response.subscription,
        payment: response.payment,
        emailStatus: response.email.status,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer l'organisation.",
      );
    } finally {
      setSaving(false);
    }
  }

  function sendWhatsApp() {
    if (!createdOrganization) return;

    const phoneNumber = formatPhoneForWhatsApp(
      createdOrganization.phone,
    );

    if (!phoneNumber) {
      setError(
        "Le numéro de téléphone de l'organisation est invalide.",
      );
      return;
    }

    const message = buildWhatsAppMessage(createdOrganization);

    const url = `https://wa.me/${phoneNumber.replace(
      /^\+/,
      "",
    )}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (createdOrganization) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4"><img src={createdOrganization.logoUrl} alt="Logo de l’organisation" className="size-16 rounded-2xl border object-contain p-2" /><div><p className="text-sm font-semibold text-cyan-700">Organisation créée</p><h1 className="text-2xl font-bold">{createdOrganization.name}</h1></div></div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Administrateur</dt><dd className="font-medium">{createdOrganization.adminEmail}</dd></div><div><dt className="text-xs text-slate-500">Abonnement</dt><dd className="font-medium">{createdOrganization.subscription.amount.toLocaleString("fr-FR")} {createdOrganization.subscription.currency} · {createdOrganization.subscription.status}</dd></div><div><dt className="text-xs text-slate-500">Expiration</dt><dd className="font-medium">{new Date(createdOrganization.subscription.expiresAt).toLocaleDateString("fr-FR")}</dd></div><div><dt className="text-xs text-slate-500">E-mail de bienvenue</dt><dd className="font-medium">{createdOrganization.emailStatus === "sent" ? "Envoyé" : createdOrganization.emailStatus === "failed" ? "Échec d’envoi" : "Configuration e-mail requise"}</dd></div></dl>
          <p className="mt-6 text-sm text-slate-500">Le mot de passe initial n’est pas conservé ni réaffiché après la création.</p>
          <div className="mt-8 flex gap-3"><Link href={`/ad/super-admin/organisations/${createdOrganization.id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Voir l’organisation</Link><Link href="/ad/super-admin/organisations" className="rounded-xl border px-4 py-2 text-sm font-semibold">Toutes les organisations</Link></div>
        </section>
      </main>
    );

    const credentials = [
      `Imprim'Brain`,
      `Organisation : ${createdOrganization!.name}`,
      `Connexion : ${window.location.origin}/login`,
      `Identifiant : ${createdOrganization!.adminEmail}`,
      `Mot de passe : ${createdOrganization!.password}`,
    ].join("\n");

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Link
              href="/ad/super-admin/organisations"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-cyan-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux organisations
            </Link>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-600 to-blue-700 px-6 py-10 text-white sm:px-10">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Check className="h-7 w-7" />
                </div>

                <p className="mb-2 text-sm font-medium text-cyan-100">
                  Création terminée
                </p>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Organisation créée avec succès
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50 sm:text-base">
                  {createdOrganization!.name} est maintenant disponible
                  dans la plateforme Imprim&apos;Brain.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Organisation
                      </p>
                      <p className="font-semibold text-slate-900">
                        {createdOrganization!.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    {createdOrganization!.address}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Phone className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Contact
                      </p>
                      <p className="font-semibold text-slate-900">
                        {createdOrganization!.phone}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    Utilisé pour transmettre les identifiants.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">
                      Identifiants de connexion
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      Transmets ces informations au responsable de
                      l&apos;organisation.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-cyan-100 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Connexion
                        </p>

                        <p className="mt-1 break-all text-sm font-medium text-slate-900">
                          {window.location.origin}/login
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-100 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Identifiant
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {createdOrganization!.adminEmail}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-100 bg-white p-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Mot de passe initial
                          </p>

                          <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                            {createdOrganization!.password}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              createdOrganization!.password,
                              "password",
                            )
                          }
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {copied === "password" ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={sendWhatsApp}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20bd5c]"
                >
                  <Send className="h-4 w-4" />
                  Envoyer par WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(credentials, "credentials")
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {copied === "credentials" ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      Identifiants copiés
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      Copier les identifiants
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/ad/super-admin/organisations"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Toutes les organisations
                </Link>

                <Link
                  href={`/ad/super-admin/organisations/${createdOrganization!.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Voir l&apos;organisation
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/ad/super-admin/organisations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-cyan-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux organisations
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-600">
                Super Admin
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Nouvelle organisation
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Crée une nouvelle organisation et prépare immédiatement
            ses accès.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <X className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Impossible de continuer</p>
              <p className="mt-1">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Identité
                  </h2>
                  <p className="text-sm text-slate-500">
                    Informations principales de l&apos;organisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Nom de l&apos;organisation
                </label>

                <input
                  id="name"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="Ex. Imprimerie ABC"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="slug"
                  className="text-sm font-semibold text-slate-700"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  value={slug}
                  onChange={(event) =>
                    setSlug(normalizeSlug(event.target.value))
                  }
                  placeholder="imprimerie-abc"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Identifiant technique :{" "}
                  <span className="font-mono">
                    {generatedSlug || "—"}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Coordonnées
                  </h2>
                  <p className="text-sm text-slate-500">
                    Informations permettant de contacter l&apos;organisation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="text-sm font-semibold text-slate-700"
                >
                  Contact téléphonique
                </label>

                <div className="relative mt-2">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+225 07 00 00 00 00"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="text-sm font-semibold text-slate-700"
                >
                  Adresse
                </label>

                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    placeholder="Cocody, Abidjan"
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-email"
                  className="text-sm font-semibold text-slate-700"
                >
                  E-mail professionnel de l&apos;administrateur
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  placeholder="admin@imprimerie.com"
                  autoComplete="email"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <KeyRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Accès initial
                  </h2>

                  <p className="text-sm text-slate-500">
                    Un mot de passe sécurisé sera utilisé pour le
                    premier accès.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Mot de passe initial
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      required
                      minLength={8}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 font-mono text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Régénérer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(password, "password")
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {copied === "password" ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === "password" ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Ce mot de passe sera transmis au responsable de
                l&apos;organisation. Il est recommandé de le modifier après
                la première connexion.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-700">
                  <FileImage className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Identité visuelle
                  </h2>

                  <p className="text-sm text-slate-500">
                    Ajoute le logo de l&apos;organisation.
                  </p>
                </div>
              </div>
            </div>

            {logoPreview ? (
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img
                    src={logoPreview}
                    alt="Aperçu du logo"
                    className="h-full w-full object-contain p-3"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {logoFile?.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {logoFile
                      ? `${(logoFile.size / 1024 / 1024).toFixed(2)} Mo`
                      : ""}
                  </p>

                  <button
                    type="button"
                    onClick={removeLogo}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="logo"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm transition group-hover:text-cyan-600">
                  <Upload className="h-6 w-6" />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Ajouter un logo
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPG, WEBP — 5 Mo maximum
                </p>

                <input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    handleLogoChange(
                      event.target.files?.[0] ?? null,
                    )
                  }
                />
              </label>
            )}
          </section>

          <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Après la création
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Les informations de connexion seront affichées afin
                  que tu puisses les copier ou les transmettre directement
                  au responsable par WhatsApp.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/ad/super-admin/organisations"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Annuler
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Création en cours…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Créer l&apos;organisation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
