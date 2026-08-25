import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ContentEditor from '@/app/components/ContentEditor';

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  return <ContentEditor campaignId={id} />;
}
