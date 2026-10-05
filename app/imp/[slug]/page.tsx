import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintShopProfile } from "@/components/public-print-shop/print-shop-profile";
import { getMockPrintShop } from "@/lib/mock/print-shops";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = getMockPrintShop(slug);

  if (!shop) return { title: "Imprimerie introuvable | Imprim’Brain" };

  return {
    title: `${shop.name} | Imprim’Brain`,
    description: shop.description,
    openGraph: {
      title: `${shop.name} | Imprim’Brain`,
      description: shop.description,
      type: "website",
    },
  };
}

export default async function PublicPrintShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = getMockPrintShop(slug);
  if (!shop) notFound();

  return <PrintShopProfile shop={shop} />;
}
