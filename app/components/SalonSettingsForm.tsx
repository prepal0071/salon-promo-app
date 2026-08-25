'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SalonSettingsForm() {
  const [name, setName] = useState('');
  const [tone, setTone] = useState('');
  const [brandNotes, setBrandNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || '');
        setTone(data.tone || '');
        setBrandNotes(data.brand_notes || '');
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tone, brand_notes: brandNotes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-slate-500 text-sm">読み込み中...</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">サロン設定</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← ダッシュボードに戻る</Link>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-6">
        <div>
          <label className="block text-sm text-slate-600 mb-1">サロン名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">トーン・雰囲気</label>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="例: 上品で落ち着いた、親しみやすくカジュアル など"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">ブランドノート（ターゲット・注意点など）</label>
          <textarea
            value={brandNotes}
            onChange={(e) => setBrandNotes(e.target.value)}
            rows={4}
            placeholder="例: 30〜40代女性がメイン、NGワード、よく使う言い回し など"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : saved ? '保存しました' : '保存'}
        </button>
      </form>
    </div>
  );
}
