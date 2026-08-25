'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CopyButton from './CopyButton';

interface Campaign {
  id: number;
  theme: string;
  month: string | null;
  status: string;
  pop_text: string;
  instagram_text: string;
  line_text: string;
}

export default function ContentEditor({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [popText, setPopText] = useState('');
  const [instagramText, setInstagramText] = useState('');
  const [lineText, setLineText] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadCampaign() {
    const res = await fetch(`/api/campaigns/${campaignId}`);
    const data: Campaign = await res.json();
    setCampaign(data);
    setPopText(data.pop_text);
    setInstagramText(data.instagram_text);
    setLineText(data.line_text);
    setLoading(false);
    return data;
  }

  async function generate(theme: string, month: string | null) {
    setGenerating(true);
    setError('');
    const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, month }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setPopText(data.pop_text);
      setInstagramText(data.instagram_text);
      setLineText(data.line_text);
    } else {
      setError(data.error || '生成に失敗しました');
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCampaign().then((data) => {
        if (!data.pop_text && !data.instagram_text && !data.line_text) {
          generate(data.theme, data.month);
        }
      });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function handleSave() {
    if (!campaign) return;
    setSaving(true);
    await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: campaign.theme,
        month: campaign.month,
        pop_text: popText,
        instagram_text: instagramText,
        line_text: lineText,
        status: 'finalized',
      }),
    });
    setSaving(false);
    router.push('/');
  }

  if (loading || !campaign) return <p className="p-6 text-sm text-slate-500">読み込み中...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">{campaign.theme}</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="mb-4">
        <button
          onClick={() => generate(campaign.theme, campaign.month)}
          disabled={generating}
          className="text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          {generating ? '生成中...' : '3つとも再生成'}
        </button>
      </div>

      <div className="space-y-6">
        <Block label="店内POP" value={popText} onChange={setPopText} rows={4} />
        <Block label="Instagram投稿文" value={instagramText} onChange={setInstagramText} rows={6} />
        <Block label="LINE配信文" value={lineText} onChange={setLineText} rows={5} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || generating}
        className="mt-6 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存して完了'}
      </button>
    </div>
  );
}

function Block({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-slate-700 text-sm">{label}</h2>
        <CopyButton text={value} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
