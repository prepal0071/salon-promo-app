module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    const b = req.body || {};

    const prompt = `
${b.prompt || ''}

${b.revision ? `追加希望：${b.revision}` : ''}

女性向けエステサロンの販促物に使用する、上品で自然な写真表現。

【イメージ】
・30〜50代女性向け
・高級感、清潔感、安心感
・落ち着いたエステサロンらしい世界観
・過度に広告的、派手、安売り感のある印象にしない
・自然な人物、施術、サロン空間を表現
・Instagram投稿画像や店内POPの背景として使いやすい構図
・テキストを後から重ねやすいよう、適度な余白を残す

【禁止】
・文字
・日本語や英語などの文章
・数字
・ロゴ
・看板
・透かし
・不自然な手指
`;

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
          prompt,
          size: '1024x1024',
          quality: 'low'
        })
      }
    );

    const j = await r.json();

    if (!r.ok) {
      return res
        .status(r.status)
        .json({ error: j.error?.message || '画像生成エラー' });
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
    return res.status(500).json({ error: e.message });
  }
};