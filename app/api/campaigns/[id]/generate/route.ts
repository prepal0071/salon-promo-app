import { NextRequest, NextResponse } from 'next/server';
import { getPool, initializeDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateCampaignContent } from '@/lib/prompts';
import { CLAUDE_MODEL } from '@/lib/anthropic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  await initializeDb();
  const { id } = await params;
  const { theme, month } = await req.json();

  if (!theme) {
    return NextResponse.json({ error: 'テーマを入力してください' }, { status: 400 });
  }

  const pool = getPool();
  const salonResult = await pool.query('SELECT * FROM salons WHERE id = 1');
  const salon = salonResult.rows[0];

  try {
    const content = await generateCampaignContent({
      salon: { name: salon.name, tone: salon.tone, brandNotes: salon.brand_notes },
      theme,
      monthLabel: month || '今月',
    });

    await pool.query(
      `UPDATE campaigns
       SET theme=$1, pop_text=$2, instagram_text=$3, line_text=$4,
           generation_meta=$5, updated_at=NOW()
       WHERE id=$6`,
      [
        theme,
        content.pop_text,
        content.instagram_text,
        content.line_text,
        JSON.stringify({ model: CLAUDE_MODEL, generated_at: new Date().toISOString() }),
        id,
      ]
    );

    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: '生成に失敗しました。もう一度お試しください' }, { status: 500 });
  }
}
