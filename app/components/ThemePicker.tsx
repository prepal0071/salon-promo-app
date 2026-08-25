'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Suggestion {
  theme: string;
  rationale: string;
}

function currentMonthLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月`;
}

function currentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function ThemePicker() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [creating, setCreating] = useState(false);
  const monthLabel = currentMonthLabel();

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    setError('');
    const res = await fetch('/api/themes/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: monthLabel }),
    });
    const data = await res.json();
    setLoadingSuggestions(false);
    if (res.ok) {
      setSuggestions(data.suggestions);
    } else {
      setError(data.error || '生成に失敗しました');
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadSuggestions, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectTheme(theme: string) {
    setCreating(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme, month: currentMonthDate(), theme_suggestions: suggestions }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      router.push(`/campaigns/${data.id}/edit`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">テーマを選ぶ（{monthLabel}）</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-700">AIによるテーマ提案</h2>
          <button
            onClick={loadSuggestions}
            disabled={loadingSuggestions}
            className="text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {loadingSuggestions ? '生成中...' : '別の案を出す'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {loadingSuggestions && <p className="text-sm text-slate-500">テーマ案を生成しています...</p>}

        <div className="space-y-3">
          {suggestions.map((s) => (
            <div key={s.theme} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-800">{s.theme}</p>
                <p className="text-sm text-slate-500">{s.rationale}</p>
              </div>
              <button
                onClick={() => selectTheme(s.theme)}
                disabled={creating}
                className="shrink-0 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
              >
                この案にする
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-medium text-slate-700 mb-3">自分でテーマを決める</h2>
        <div className="flex gap-2">
          <input
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="例: 秋の乾燥先取りケア"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => selectTheme(customTheme)}
            disabled={!customTheme || creating}
            className="text-sm bg-slate-700 text-white rounded-lg px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
