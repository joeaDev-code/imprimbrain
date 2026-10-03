import LegacyExpenses from '@/components/modules/expenses-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTExpensesPage() {
  await requireCTPagePermission('EXPENSES_VIEW');
  return <LegacyExpenses />;
}