'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push('/');
    } else {
      setError(data.error);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, adminKey }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      alert('ユーザーを登録しました。ログインしてください。');
      setTab('login');
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">サロン販促アシスタント</h1>
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 pb-2 text-sm font-medium ${tab === 'login' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
            onClick={() => setTab('login')}
          >ログイン</button>
          <button
            className={`flex-1 pb-2 text-sm font-medium ${tab === 'register' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
            onClick={() => setTab('register')}
          >ユーザー登録</button>
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          {tab === 'register' && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">管理者キー</label>
              <input
                type="password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <p className="text-xs text-slate-400 mt-1">管理者から発行されたキーを入力してください</p>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '処理中...' : tab === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
