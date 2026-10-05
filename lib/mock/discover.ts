export type DiscoverPrintShop = {
  id: string;
  slug: string;
  name: string;
  logo: string;
  city: string;
  neighborhood: string;
  description: string;
  services: string[];
  distanceKm: number;
  isOpen: boolean;
};

export const mockDiscoverShops: DiscoverPrintShop[] = [
  {
    id: "discover-001",
    slug: "imprimerie-jesse",
    name: "Imprimerie Jesse",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Cocody",
    description:
      "Impression numérique, supports publicitaires et travaux de reprographie.",
    services: [
      "Impression numérique",
      "Flyers",
      "Cartes de visite",
      "Reprographie",
    ],
    distanceKm: 1.2,
    isOpen: true,
  },
  {
    id: "discover-002",
    slug: "print-express-abidjan",
    name: "Print Express Abidjan",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Yopougon",
    description:
      "Impression rapide et reprographie pour particuliers et petites entreprises.",
    services: ["Impression numérique", "Reprographie", "Flyers"],
    distanceKm: 4.8,
    isOpen: false,
  },
  {
    id: "discover-003",
    slug: "studio-print-cocody",
    name: "Studio Print Cocody",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Riviera",
    description:
      "Création et impression de supports professionnels pour entreprises.",
    services: [
      "Cartes de visite",
      "Flyers",
      "Impression numérique",
      "Reliure",
    ],
    distanceKm: 2.6,
    isOpen: true,
  },
  {
    id: "discover-004",
    slug: "graphik-service",
    name: "Graphik Service",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Marcory",
    description:
      "Solutions d'impression pour communication, événements et documents.",
    services: ["Flyers", "Cartes de visite", "Reprographie"],
    distanceKm: 6.3,
    isOpen: true,
  },
  {
    id: "discover-005",
    slug: "pro-print-treichville",
    name: "Pro Print Treichville",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Treichville",
    description:
      "Impression de documents et supports commerciaux pour professionnels.",
    services: [
      "Impression numérique",
      "Reliure",
      "Reprographie",
      "Flyers",
    ],
    distanceKm: 7.1,
    isOpen: false,
  },
  {
    id: "discover-006",
    slug: "express-copy-adjame",
    name: "Express Copy Adjamé",
    logo: "/logo/icon-logo-imprim-brain.png",
    city: "Abidjan",
    neighborhood: "Adjamé",
    description:
      "Reprographie et impression rapide pour les besoins du quotidien.",
    services: ["Reprographie", "Impression numérique", "Cartes de visite"],
    distanceKm: 8.4,
    isOpen: true,
  },
];
