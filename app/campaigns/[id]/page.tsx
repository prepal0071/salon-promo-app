import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getPool, initializeDb } from '@/lib/db';
import CopyButton from '@/app/components/CopyButton';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  await initializeDb();
  const { id } = await params;
  const pool = getPool();
  const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
  const campaign = result.rows[0];
  if (!campaign) notFound();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">{campaign.theme}</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
      </div>

      <div className="space-y-6">
        <Block label="店内POP" value={campaign.pop_text} />
        <Block label="Instagram投稿文" value={campaign.instagram_text} />
        <Block label="LINE配信文" value={campaign.line_text} />
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-slate-700 text-sm">{label}</h2>
        <CopyButton text={value} />
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-800">{value}</p>
    </div>
  );
}
