import type { Metadata } from "next";
import { DiscoverPage } from "@/components/discover/discover-page";

export const metadata: Metadata = {
  title: "Trouver une imprimerie | Imprim’Brain",
  description:
    "Découvrez les imprimeries disponibles près de chez vous et trouvez les services d'impression adaptés à vos besoins.",
};

export default function DiscoverRoute() {
  return <DiscoverPage />;
}
