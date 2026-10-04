"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Waves,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        setError(
          d.error || "Connexion impossible. Vérifiez vos identifiants.",
        );
        setLoading(false);
        return;
      }

      const identityResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const identityData = await identityResponse.json().catch(() => null);
      const authenticatedUser = identityData?.user;
      if (!identityResponse.ok || !authenticatedUser) {
        throw new Error("Connexion établie mais identité impossible à vérifier.");
      }

      if (authenticatedUser.role === "SUPER_ADMIN") {
        router.replace("/ad/super-admin");
      } else if (["ADMIN", "OFFICER", "SECRETARY"].includes(authenticatedUser.role) && authenticatedUser.organizationId) {
        router.replace(`/ct/${authenticatedUser.role.toLowerCase()}`);
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
        throw new Error("Ce compte n’est pas associé à un espace autorisé.");
      }
      router.refresh();
    } catch {
      setError(
        "Impossible de contacter le serveur. Vérifiez votre connexion.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef8ff]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="absolute -right-40 top-1/4 h-[620px] w-[620px] rounded-full bg-blue-500/20 blur-3xl" />

        <div className="absolute inset-x-0 bottom-[-12%] h-[48%] bg-gradient-to-t from-cyan-400/30 via-blue-400/10 to-transparent" />

        <svg
          className="absolute bottom-0 left-0 h-[48%] w-full"
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="loginWave"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.05" />
              <stop offset="48%" stopColor="#2563eb" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <path
            d="M0 310C230 170 430 450 690 285C950 120 1110 120 1440 250V500H0Z"
            fill="url(#loginWave)"
          />

          <path
            d="M0 355C260 190 430 480 710 310C990 140 1160 160 1440 280"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.65"
            strokeWidth="2"
          />

          <path
            d="M0 390C260 225 450 505 730 335C1000 170 1180 195 1440 305"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Brand */}
      <header className="absolute left-6 top-6 z-20 sm:left-10 sm:top-8">
        <Logo
          variant="full"
          width={180}
          height={52}
          priority
        />
      </header>

      {/* Main */}
      <div className="relative z-10 grid min-h-screen place-items-center px-5 py-24 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_420px]">
          {/* Presentation */}
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm backdrop-blur">
                <span className="size-1.5 rounded-full bg-cyan-500" />
                Espace professionnel
              </div>

              <h1 className="font-[var(--font-comfortaa)] text-5xl font-extrabold leading-[1.08] tracking-[-0.045em] text-[#0b1f3a] xl:text-6xl">
                Pilotez votre
                <br />
                imprimerie
                <br />
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                  intelligemment.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-500">
                Gérez vos clients, prestations, paiements, stocks et activités
                depuis un seul espace.
              </p>

              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-cyan-500" />
                  Données sécurisées
                </div>

                <div className="flex items-center gap-2">
                  <Waves className="size-4 text-blue-500" />
                  Gestion centralisée
                </div>
              </div>
            </div>
          </section>

          {/* Login Card */}
          <section className="w-full">
            <form
              onSubmit={submit}
              className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(30,64,175,0.16)] backdrop-blur-xl sm:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

              <div className="mb-7">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                  <LockKeyhole className="size-5" strokeWidth={2.2} />
                </div>

                <h2 className="font-[var(--font-comfortaa)] text-2xl font-extrabold tracking-[-0.035em] text-[#0b1f3a]">
                  Bon retour 👋
                </h2>

                <p className="mt-1.5 text-sm text-slate-500">
                  Connectez-vous à votre espace de gestion.
                </p>
              </div>

              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.06em] text-slate-500"
                  >
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.06em] text-slate-500"
                  >
                    Mot de passe
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-600"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:from-cyan-600 hover:to-blue-700 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connexion…
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="size-3.5 text-cyan-500" />
                Accès sécurisé à votre espace professionnel
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
