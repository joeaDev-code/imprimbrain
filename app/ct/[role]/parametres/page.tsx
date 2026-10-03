import LegacySettings from '@/app/(admin)/admin/parametres/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTSettingsPage() {
  await requireCTPagePermission('SETTINGS_VIEW');
  return <LegacySettings />;
}