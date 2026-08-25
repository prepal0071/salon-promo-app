import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool, initializeDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  await initializeDb();
  const { username, password, adminKey } = await req.json();

  if (adminKey !== (process.env.ADMIN_KEY || 'admin1234')) {
    return NextResponse.json({ error: '管理者キーが違います' }, { status: 403 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 });
  }

  const pool = getPool();
  const hashed = bcrypt.hashSync(password, 10);

  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashed]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'そのユーザー名は既に使われています' }, { status: 409 });
  }
}
