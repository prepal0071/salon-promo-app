import { NextRequest, NextResponse } from 'next/server';
import { getPool, initializeDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { suggestThemes } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { month } = await req.json();
  const pool = getPool();

  const salonResult = await pool.query('SELECT * FROM salons WHERE id = 1');
  const salon = salonResult.rows[0];

  const recentResult = await pool.query(
    `SELECT DISTINCT theme FROM campaigns WHERE salon_id = 1 ORDER BY theme LIMIT 6`
  );
  const recentThemes: string[] = recentResult.rows.map((r) => r.theme);

  const monthLabel = month || '今月';

  try {
    const suggestions = await suggestThemes({
      salon: { name: salon.name, tone: salon.tone, brandNotes: salon.brand_notes },
      monthLabel,
      recentThemes,
    });
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: '生成に失敗しました。もう一度お試しください' }, { status: 500 });
  }
}
