import { NextResponse } from 'next/server';
import { getPublicPrintShopBySlug } from '@/lib/public-print-shop';
import { apiError } from '@/lib/api-error';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug)) return NextResponse.json({ error: 'Imprimerie introuvable.' }, { status: 404 });
  const shop = await getPublicPrintShopBySlug(slug);
  if (!shop) return NextResponse.json({ error: 'Imprimerie introuvable.' }, { status: 404 });
  return NextResponse.json(shop);
  } catch (error) {
    return apiError(error);
  }
}
