import AccountsPage from '@/components/modules/accounts-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTAccountsPage() {
  const user = await requireCTPagePermission('ACCOUNTS_VIEW');
  return <AccountsPage ctRole={user.role} />;
}
