import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool, initializeDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  await initializeDb();
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 });
  }

  const pool = getPool();
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが違います' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, username: user.username });

  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
