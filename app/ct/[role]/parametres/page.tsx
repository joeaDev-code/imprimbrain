import SettingsPage from '@/components/modules/settings-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTSettingsPage() {
  const user = await requireCTPagePermission('SETTINGS_VIEW');
  return <SettingsPage ctRole={user.role} />;
}
