# salon-promo-app

サロンの月次販促（季節メニュープレゼント企画）向けの、テーマ選定〜POP・Instagram・LINE文面生成・履歴管理を行う社内Webアプリ。

## セットアップ

```bash
npm install
```

`.env.local` を作成し、以下を設定:

```
DATABASE_URL=postgres://...
JWT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_KEY=...           # 任意。ユーザー登録時の管理者キー（未設定時デフォルト値あり）
ANTHROPIC_MODEL=claude-sonnet-5   # 任意。未設定時はコード側デフォルトを使用
```

## 開発

```bash
npm run dev
```

http://localhost:3000 で確認。初回は `/login` の「ユーザー登録」タブから管理者キーを使ってオーナーアカウントを作成する。

## デプロイ

git push → Render 自動デプロイ（`manual-app` と同じ構成）。Render ダッシュボードで `DATABASE_URL` / `JWT_SECRET` / `ANTHROPIC_API_KEY` / (任意)`ADMIN_KEY` / `ANTHROPIC_MODEL` を設定する。
