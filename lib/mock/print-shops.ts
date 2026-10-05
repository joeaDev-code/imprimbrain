export type MockPrintShopService = {
  id: string; name: string; description: string; icon: string;
};

export type MockPrintShopHour = {
  day: string; open?: string; close?: string; closed?: boolean;
};

export type MockPrintShop = {
  id: string; slug: string; name: string; logo: string; city: string; neighborhood: string;
  shortDescription: string; description: string; phone: string; whatsapp: string; email: string;
  address: string; isOpen: boolean; todayHours: string; highlights: string[];
  services: MockPrintShopService[]; hours: MockPrintShopHour[];
};

export const mockPrintShops: MockPrintShop[] = [
  {
    id: "mock-shop-001", slug: "imprimerie-jesse", name: "Imprimerie Jesse",
    logo: "/logo/icon-logo-imprim-brain.png", city: "Abidjan", neighborhood: "Cocody",
    shortDescription: "Impression numérique, supports publicitaires et travaux de reprographie pour particuliers et professionnels.",
    description: "Imprimerie Jesse accompagne les particuliers, entrepreneurs, associations et entreprises dans leurs besoins d’impression. L’équipe propose des solutions simples pour les documents professionnels, supports publicitaires et travaux de reprographie.",
    phone: "+225 07 07 07 07 07", whatsapp: "+225 07 07 07 07 07",
    email: "contact@imprimerie-jesse.ci", address: "Cocody, Abidjan, Côte d’Ivoire",
    isOpen: true, todayHours: "08:00 – 18:00",
    highlights: ["Service professionnel", "Devis sur demande", "Petites et grandes quantités", "Accompagnement client"],
    services: [
      { id: "service-001", name: "Impression numérique", description: "Documents, rapports, mémoires et supports professionnels.", icon: "printer" },
      { id: "service-002", name: "Flyers & affiches", description: "Supports publicitaires pour événements et activités commerciales.", icon: "image" },
      { id: "service-003", name: "Cartes de visite", description: "Cartes professionnelles adaptées à votre identité visuelle.", icon: "card" },
      { id: "service-004", name: "Reprographie", description: "Photocopies, scans et reproduction de documents.", icon: "scan" },
      { id: "service-005", name: "Documents reliés", description: "Reliure et finition pour rapports, mémoires et dossiers.", icon: "file" },
      { id: "service-006", name: "Supports publicitaires", description: "Solutions d’impression pour vos besoins de communication.", icon: "package" },
    ],
    hours: [
      { day: "Lundi", open: "08:00", close: "18:00" }, { day: "Mardi", open: "08:00", close: "18:00" },
      { day: "Mercredi", open: "08:00", close: "18:00" }, { day: "Jeudi", open: "08:00", close: "18:00" },
      { day: "Vendredi", open: "08:00", close: "18:00" }, { day: "Samedi", open: "09:00", close: "15:00" },
      { day: "Dimanche", closed: true },
    ],
  },
  {
    id: "mock-shop-002", slug: "print-express-abidjan", name: "Print Express Abidjan",
    logo: "/logo/icon-logo-imprim-brain.png", city: "Abidjan", neighborhood: "Yopougon",
    shortDescription: "Impression rapide et reprographie pour particuliers, étudiants et petites entreprises.",
    description: "Print Express Abidjan propose des services d’impression et de reprographie adaptés aux besoins quotidiens des particuliers et professionnels.",
    phone: "+225 05 05 05 05 05", whatsapp: "+225 05 05 05 05 05",
    email: "contact@printexpress.example", address: "Yopougon, Abidjan, Côte d’Ivoire",
    isOpen: false, todayHours: "08:30 – 17:30",
    highlights: ["Impression rapide", "Reprographie", "Devis sur demande"],
    services: [
      { id: "service-101", name: "Impression de documents", description: "Impression de documents administratifs et professionnels.", icon: "printer" },
      { id: "service-102", name: "Photocopie & scan", description: "Reproduction et numérisation de vos documents.", icon: "scan" },
      { id: "service-103", name: "Flyers", description: "Impression de flyers pour vos activités et événements.", icon: "image" },
    ],
    hours: [
      { day: "Lundi", open: "08:30", close: "17:30" }, { day: "Mardi", open: "08:30", close: "17:30" },
      { day: "Mercredi", open: "08:30", close: "17:30" }, { day: "Jeudi", open: "08:30", close: "17:30" },
      { day: "Vendredi", open: "08:30", close: "17:30" }, { day: "Samedi", open: "09:00", close: "14:00" },
      { day: "Dimanche", closed: true },
    ],
  },
];

export function getMockPrintShop(slug: string) {
  return mockPrintShops.find((shop) => shop.slug === slug);
}
