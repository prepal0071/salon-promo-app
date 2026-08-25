import { NextRequest, NextResponse } from 'next/server';
import { getPool, initializeDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const pool = getPool();
  const result = await pool.query('SELECT * FROM salons WHERE id = 1');
  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { name, tone, brand_notes } = await req.json();
  const pool = getPool();
  await pool.query(
    `UPDATE salons SET name=$1, tone=$2, brand_notes=$3, updated_at=NOW() WHERE id = 1`,
    [name || '', tone || '', brand_notes || '']
  );
  return NextResponse.json({ ok: true });
}
