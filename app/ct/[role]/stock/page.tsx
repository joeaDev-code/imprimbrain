import StockPage from '@/components/modules/stock-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTStockPage() {
  const user = await requireCTPagePermission('STOCK_VIEW');
  return <StockPage ctRole={user.role} />;
}
