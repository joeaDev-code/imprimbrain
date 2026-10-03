import LegacyStock from '@/app/(admin)/admin/stock/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTStockPage() {
  await requireCTPagePermission('STOCK_VIEW');
  return <LegacyStock />;
}