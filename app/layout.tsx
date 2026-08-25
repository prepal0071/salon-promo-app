import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'サロン販促アシスタント',
  description: '季節メニュープレゼント企画の販促コンテンツ作成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
