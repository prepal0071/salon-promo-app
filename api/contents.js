module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};
    const p = b.plan || {};
    const key = process.env.OPENAI_API_KEY;
    const outs = b.outputs || [];
    const props = {};
    const required = [];

    const emojiInstruction = (value, channel) => {
      if (value === 'none') return `${channel}では絵文字を一切使用しない。`;
      if (value === 'low') return `${channel}では内容に合う絵文字を必ず2〜4個入れる。`;
      if (value === 'high') return `${channel}では内容に合う絵文字を8〜12個程度入れる。`;
      return `${channel}では内容に合う絵文字を必ず5〜8個程度入れる。`;
    };

    if (outs.includes('pop')) {
      props.pop = {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          subheadline: { type: 'string' },
          body: { type: 'string' },
          footer: { type: 'string' },
          gift_display: { type: 'string' }
        },
        required: ['headline','subheadline','body','footer','gift_display'],
        additionalProperties: false
      };
      required.push('pop');
    }

    if (outs.includes('line')) {
      props.line = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' }
        },
        required: ['title','body'],
        additionalProperties: false
      };
      required.push('line');
    }

    if (outs.includes('instagram')) {
      props.instagram = {
        type: 'object',
        properties: {
          caption: { type: 'string' },
          hashtags: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 8
          }
        },
        required: ['caption','hashtags'],
        additionalProperties: false
      };
      required.push('instagram');
    }

    if (outs.includes('image') || outs.includes('pop')) {
      props.image = {
        type: 'object',
        properties: {
          prompt_ja: { type: 'string' }
        },
        required: ['prompt_ja'],
        additionalProperties: false
      };
      required.push('image');
    }

    const schema = {
      type: 'object',
      properties: props,
      required,
      additionalProperties: false
    };

    const baseInstruction = `
あなたは30〜50代女性向けエステサロンの販促編集者です。
上品、高級感、清潔感、安心感を保ち、安売り感・煽り・医療的断定を避けます。

【今回の企画】
企画名：${p.title || ''}
キャッチ：${p.catch || ''}
プレゼント：${p.gift || ''}
期間：${b.start_date || ''}〜${b.end_date || ''}
対象：${b.target || ''}

条件：${b.conditions || ''}

【LINE】
作成する場合、本文は必ず320〜480文字程度。
短い告知で終わらせず、
「季節や悩みへの導入 → 共感 → サロンからの美容・ケア説明 → 今回の企画 → 条件 → 来店案内」
の順で、スマホで読みやすく段落を分ける。
${emojiInstruction(b.line_emoji, 'LINE')}
絵文字設定が「なし」以外なら、実際の本文中に絵文字を必ず入れる。

【Instagram】
作成する場合、captionは必ず500〜700文字程度。
単なるキャンペーン告知ではなく、
「共感できる導入 → 季節・生活習慣による美容上の変化 → サロン視点の説明 → ケアの考え方 → 今回の企画 → おすすめの方 → 期間・条件・来店案内」
の順で、美容コラムとして読める内容にする。
${emojiInstruction(b.instagram_emoji, 'Instagram')}
絵文字設定が「なし」以外なら、実際のcaption中に絵文字を必ず入れる。
ハッシュタグは5〜8個。

【POP】
一目で内容が分かる短い見出しと、店頭で読みやすい説明にする。

【画像生成指示】
画像自体には文字・数字・ロゴ・看板・透かしを入れない。
`;

    async function callModel(input) {
      const r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5.4-mini',
          input,
          text: {
            format: {
              type: 'json_schema',
              name: 'contents',
              strict: true,
              schema
            }
          }
        })
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.error?.message || 'OpenAI API error');
      }

      let t = '';

      for (const o of j.output || []) {
        for (const c of o.content || []) {
          if (c.type === 'output_text') {
            t = c.text;
          }
        }
      }

      return JSON.parse(t);
    }

    const countEmoji = s => {
      try {
        return (String(s || '').match(/\p{Extended_Pictographic}/gu) || []).length;
      } catch {
        return 0;
      }
    };

    const wantsEmoji = v => v && v !== 'none';

    const minEmoji = v =>
      v === 'low' ? 2 :
      v === 'high' ? 8 :
      v === 'standard' ? 5 : 0;

    let result = await callModel(baseInstruction);

    const problems = [];

    if (outs.includes('line')) {
      const n = String(result.line?.body || '').length;

      if (n < 280) {
        problems.push(
          `LINE本文が短すぎる（現在約${n}文字）。320〜480文字程度に増やす。`
        );
      }

      if (
        wantsEmoji(b.line_emoji) &&
        countEmoji(result.line?.body) < minEmoji(b.line_emoji)
      ) {
        problems.push(
          `LINE本文の絵文字が不足。設定「${b.line_emoji}」に合う数を本文中に必ず入れる。`
        );
      }
    }

    if (outs.includes('instagram')) {
      const n = String(result.instagram?.caption || '').length;

      if (n < 430) {
        problems.push(
          `Instagram本文が短すぎる（現在約${n}文字）。500〜700文字程度に増やす。`
        );
      }

      if (
        wantsEmoji(b.instagram_emoji) &&
        countEmoji(result.instagram?.caption) < minEmoji(b.instagram_emoji)
      ) {
        problems.push(
          `Instagram本文の絵文字が不足。設定「${b.instagram_emoji}」に合う数をcaption中に必ず入れる。`
        );
      }
    }

    if (problems.length) {
      result = await callModel(`
${baseInstruction}

以下は一度生成したJSONです。
${JSON.stringify(result)}

次の不備を必ず修正して、同じJSON形式で完成版を返してください。
${problems.map((x,i)=>`${i+1}. ${x}`).join('\n')}

文章量は「タイトルやハッシュタグを除く本文そのもの」で満たしてください。
絵文字設定が「なし」以外なら、絵文字を必ず本文中に見える形で入れてください。
`);
    }

    return res.json(result);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};