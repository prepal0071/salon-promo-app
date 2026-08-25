'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: number;
  theme: string;
  month: string | null;
  status: string;
  created_at: string;
}

export default function Dashboard({ username }: { username: string }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data);
        setLoading(false);
      });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">サロン販促アシスタント</h1>
          <p className="text-sm text-slate-500">{username} さん</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm text-slate-600 hover:underline">サロン設定</Link>
          <button onClick={handleLogout} className="text-sm text-slate-600 hover:underline">ログアウト</button>
        </div>
      </div>

      <Link
        href="/campaigns/new"
        className="inline-block mb-6 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        + 新しいキャンペーンを作成
      </Link>

      <div className="bg-white rounded-xl shadow divide-y">
        {loading && <p className="p-4 text-sm text-slate-500">読み込み中...</p>}
        {!loading && campaigns.length === 0 && (
          <p className="p-4 text-sm text-slate-500">まだキャンペーンがありません。</p>
        )}
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={c.status === 'draft' ? `/campaigns/${c.id}/edit` : `/campaigns/${c.id}`}
            className="flex items-center justify-between p-4 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-800">{c.theme}</p>
              <p className="text-xs text-slate-400">
                {c.month ? new Date(c.month).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : ''}
                {' '}
                {new Date(c.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                c.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {c.status === 'finalized' ? '完了' : '下書き'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
