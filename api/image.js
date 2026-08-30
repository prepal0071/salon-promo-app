module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    const b = req.body || {};

    const variants = {
      treatment: `
【今回の方向性：人物・施術】
30〜50代の大人女性が、女性専用エステサロンでプロフェッショナルな美容ケアを受けている場面。
性的・官能的な印象は一切避け、健康的で清潔感のある美容広告として表現する。
女性は適切なサロンウェアやタオルで十分に覆われ、胸元・腹部・脚などを強調しない。
顔、頭部、肩まわり、手元などを中心に、施術者が丁寧にケアしている自然な構図。
人物を比較的大きく見せながら、安心感、信頼感、上質さを表現する。
`,

      interior: `
【今回の方向性：サロン空間】
人物を主役にせず、上質なエステサロン空間を主役にする。
施術ベッド、柔らかな間接照明、上質なファブリック、植物や自然素材などを使う。
アーユルヴェーダやインド美容を連想できる要素は、上品で現代的に取り入れる。
人物が入る場合も小さく背景的にする。
`,

      concept: `
【今回の方向性：イメージビジュアル】
人物やサロン室内の記録写真ではなく、販促広告として印象に残るコンセプトビジュアルにする。
季節感、植物、オイル、ハーブ、布、光と影、水滴などから企画内容に合う要素を選び、
余白を活かした洗練された美容広告の構図にする。
他の2案とは明確に異なるアートディレクションにする。
`
    };

    const variantInstruction =
      variants[b.variant] || variants.treatment;

    const prompt = `
${b.prompt || ''}

${b.revision ? `追加希望：${b.revision}` : ''}

${variantInstruction}

女性向けエステサロンの販促物に使用する、上品で自然な写真表現。

【基本イメージ】
・30〜50代女性向け
・高級感
・清潔感
・安心感
・落ち着いたエステサロンらしい世界観
・Instagram投稿画像や店内POPの背景として使いやすい構図
・後から文字を重ねやすい余白を残す

【避ける表現】
・派手すぎる広告表現
・安売り感
・過度な演出
・不自然な人物表現
・不自然な手指

【禁止】
・文字
・日本語や英語の文章
・数字
・ロゴ
・看板
・透かし
`;

    const callImage = async (imagePrompt) => {
      const r = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-image-2',
            prompt: imagePrompt,
            size: '1024x1024',
            quality: 'low'
          })
        }
      );

      const j = await r.json();
      return { r, j };
    };

    let { r, j } = await callImage(prompt);

    if (!r.ok) {
      const message = j.error?.message || '';

      const isSafety =
        message.includes('safety') ||
        message.includes('sexual');

      if (isSafety) {
        const safePrompt = `
${b.prompt || ''}

女性向けエステサロンの販促用イメージ。

人物の肌や身体への接触を主役にしない。
人物を使用する場合は、十分に衣服やサロンウェアを着用し、
顔や頭部、手元、サロン空間を中心に表現する。

または人物を使わず、
施術ベッド、タオル、植物、ハーブ、オイルボトル、
美容用品、自然光などを使った上品な美容広告として表現する。

高級感、清潔感、安心感のある30〜50代女性向け。
性的・官能的な表現は一切含めない。
身体の特定部位を強調しない。

文字、数字、ロゴ、看板、透かしは入れない。
`;

        ({ r, j } = await callImage(safePrompt));
      }
    }

    if (!r.ok) {
      return res
        .status(r.status)
        .json({
          error: 'この画像案は生成できませんでした。別の構図で再度お試しください。'
        });
    }ｍ
    }

    const d = j.data?.[0];

    if (!d) {
      return res.status(500).json({
        error: '画像データを取得できませんでした。'
      });
    }

    return res.json(
      d.b64_json
        ? { image_base64: d.b64_json }
        : { image_url: d.url }
    );

  } catch (e) {
    return res
      .status(500)
      .json({ error: e.message });
  }
};