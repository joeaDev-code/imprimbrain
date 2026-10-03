import ExpensesPage from '@/components/modules/expenses-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTExpensesPage() {
  const user = await requireCTPagePermission('EXPENSES_VIEW');
  return <ExpensesPage ctRole={user.role} />;
}
