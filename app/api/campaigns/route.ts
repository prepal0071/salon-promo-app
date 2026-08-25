import { NextRequest, NextResponse } from 'next/server';
import { getPool, initializeDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM campaigns WHERE salon_id = 1 ORDER BY created_at DESC`
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { theme, month, theme_suggestions } = await req.json();

  if (!theme) {
    return NextResponse.json({ error: 'テーマを入力してください' }, { status: 400 });
  }

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO campaigns (theme, month, theme_suggestions, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [theme, month || null, theme_suggestions ? JSON.stringify(theme_suggestions) : null, user.userId]
  );
  return NextResponse.json({ id: result.rows[0].id });
}
