import LegacySettings from '@/components/modules/settings-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTSettingsPage() {
  await requireCTPagePermission('SETTINGS_VIEW');
  return <LegacySettings />;
}