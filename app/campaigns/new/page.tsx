import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ThemePicker from '@/app/components/ThemePicker';

export default async function NewCampaignPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <ThemePicker />;
}
