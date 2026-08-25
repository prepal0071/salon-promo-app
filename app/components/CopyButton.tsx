'use client';
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className="text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
    >
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  );
}
