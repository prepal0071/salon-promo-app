import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { getClaudeClient, CLAUDE_MODEL } from './anthropic';

export interface SalonContext {
  name: string;
  tone: string;
  brandNotes: string;
}

const ThemeSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        theme: z.string(),
        rationale: z.string(),
      })
    )
    .min(3)
    .max(5),
});

const ContentSchema = z.object({
  pop_text: z.string(),
  instagram_text: z.string(),
  line_text: z.string(),
});

function salonContextBlock(salon: SalonContext): string {
  return [
    `サロン名: ${salon.name || '(未設定)'}`,
    `トーン・雰囲気: ${salon.tone || '(未設定)'}`,
    `ブランドノート（ターゲット・注意点など）: ${salon.brandNotes || '(未設定)'}`,
  ].join('\n');
}

export async function suggestThemes(params: {
  salon: SalonContext;
  monthLabel: string;
  recentThemes: string[];
}): Promise<{ theme: string; rationale: string }[]> {
  const client = getClaudeClient();

  const recentThemesBlock =
    params.recentThemes.length > 0
      ? `直近実施したテーマ（これらと重複・酷似しないこと）:\n${params.recentThemes.map((t) => `- ${t}`).join('\n')}`
      : '直近実施したテーマ: なし';

  const response = await client.beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system:
      'あなたはエステサロンの販促コピーライターです。季節・行事・肌悩みのトレンドを踏まえて、来店客への「季節メニュープレゼント企画」に使う月替わりテーマ案を考えます。日本語で回答してください。',
    messages: [
      {
        role: 'user',
        content: [
          salonContextBlock(params.salon),
          `対象月: ${params.monthLabel}`,
          recentThemesBlock,
          '',
          'この月にふさわしい季節メニューのテーマ案を3〜5件、それぞれ一言の理由（rationale）付きで提案してください。',
        ].join('\n'),
      },
    ],
    output_format: betaZodOutputFormat(ThemeSuggestionsSchema),
  });

  if (!response.parsed_output) {
    throw new Error('テーマ提案の生成に失敗しました');
  }
  return response.parsed_output.suggestions;
}

export async function generateCampaignContent(params: {
  salon: SalonContext;
  theme: string;
  monthLabel: string;
}): Promise<{ pop_text: string; instagram_text: string; line_text: string }> {
  const client = getClaudeClient();

  const response = await client.beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: [
      'あなたはエステサロンの販促コピーライターです。以下のサロン情報とテーマに沿って、3種類の販促文を作成してください。すべて日本語で、サロンのトーン・ブランドノートを反映すること。',
      '',
      '- pop_text: 店内に貼るPOP用の文言。短く目を引く見出し調。季節テーマと来店を促す一言を含める。ハッシュタグは使わない。',
      '- instagram_text: Instagram投稿用のキャプション。親しみやすい一人称の文体、絵文字を適度に使用、末尾に関連ハッシュタグを3〜5個。',
      '- line_text: LINE公式アカウントからの配信文。お客様に直接語りかける文体で、ご予約への明確な呼びかけを含める。Instagramより短め。ハッシュタグは使わない。',
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: [
          salonContextBlock(params.salon),
          `対象月: ${params.monthLabel}`,
          `今回のテーマ: ${params.theme}`,
        ].join('\n'),
      },
    ],
    output_format: betaZodOutputFormat(ContentSchema),
  });

  if (!response.parsed_output) {
    throw new Error('文面の生成に失敗しました');
  }
  return response.parsed_output;
}
