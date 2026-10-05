import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintShopProfile } from "@/components/public-print-shop/print-shop-profile";
import { getPublicPrintShopBySlug } from "@/lib/public-print-shop";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicPrintShopBySlug(slug);
  if (!shop) return { title: "Imprimerie introuvable | Imprim’Brain", robots: { index: false, follow: false } };
  return { title: `${shop.name} | Imprim’Brain`, description: shop.description, openGraph: { title: `${shop.name} | Imprim’Brain`, description: shop.description, type: "website" } };
}

export default async function PublicPrintShopPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getPublicPrintShopBySlug(slug);
  if (!shop) notFound();
  return <PrintShopProfile shop={shop} />;
}
