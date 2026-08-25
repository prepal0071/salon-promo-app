import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SalonSettingsForm from '../components/SalonSettingsForm';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <SalonSettingsForm />;
}
