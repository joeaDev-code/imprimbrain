import EmployeesPage from '@/components/modules/employees-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTEmployeesPage() {
  const user = await requireCTPagePermission('EMPLOYEES_VIEW');
  return <EmployeesPage ctRole={user.role} />;
}
