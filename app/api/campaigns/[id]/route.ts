import { NextRequest, NextResponse } from 'next/server';
import { getPool, initializeDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { id } = await params;
  const pool = getPool();
  const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
  if (result.rows.length === 0) return NextResponse.json({ error: '見つかりません' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { id } = await params;
  const { theme, month, pop_text, instagram_text, line_text, status } = await req.json();
  const pool = getPool();
  await pool.query(
    `UPDATE campaigns
     SET theme=$1, month=$2, pop_text=$3, instagram_text=$4, line_text=$5, status=$6, updated_at=NOW()
     WHERE id=$7`,
    [theme, month || null, pop_text || '', instagram_text || '', line_text || '', status || 'draft', id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { id } = await params;
  const pool = getPool();
  await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
