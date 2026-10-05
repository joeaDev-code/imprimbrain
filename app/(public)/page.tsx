import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Imprim’Brain — Gestion intelligente pour imprimeries",
  description: "Gérez clients, prestations, commandes, paiements, stocks et reçus depuis un seul espace.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Imprim’Brain — Gestion intelligente pour imprimeries",
    description: "Gérez clients, prestations, commandes, paiements, stocks et reçus depuis un seul espace.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
