module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return res.status(503).json({ error: 'APIキー未設定' });
    }

    const schema = {
      type: 'object',
      properties: {
        plans: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                enum: ['A', 'B', 'C']
              },
              title: {
                type: 'string'
              },
              catch: {
                type: 'string'
              },
              gift: {
                type: 'string'
              },
              customer_need: {
                type: 'string'
              },
              reason: {
                type: 'string'
              },
              recommended: {
                type: 'boolean'
              }
            },
            required: [
              'id',
              'title',
              'catch',
              'gift',
              'customer_need',
              'reason',
              'recommended'
            ],
            additionalProperties: false
          }
        }
      },
      required: ['plans'],
      additionalProperties: false
    };

    const input = `
あなたは、店舗・サロンの販促戦略を考えるマーケティングAIです。
文章の言い換えを3案作るのではなく、「どう売るか・どう興味を持ってもらうか」が異なる3つの販促プランを提案してください。

【今回の情報】
サロン・店舗情報：
${JSON.stringify(b.salon || {})}

期間：
${b.start_date || ''} 〜 ${b.end_date || ''}

販促目的：
${b.promotion_goal || b.sales_goal || ''}

今回のテーマ：
${b.theme || '指定なし。内容から適切な切り口を考えること'}

販促する内容：
${b.promotion_content || b.gift_request || ''}

対象者：
${b.target || ''}

条件：
${b.conditions || ''}

追加情報：
${b.note || 'なし'}

【最初に内部で考えること】
1. 今回の販促目的は何か
2. 誰に届ける販促か
3. 何を販売・案内するのか
4. 入力情報の中に、販促に使える事実が何か
5. 顧客が興味を持つ可能性のある価値・利用場面・悩み・理想・体験は何か
6. 今行動する本当の理由があるか
7. サロン・店舗情報に、表現へ反映すべき特徴があるか

【販促を考える際の基本思考】
必要に応じて、以下を単独または組み合わせて使用してください。

・自分ごと化
・ベネフィット
・悩みから提案
・理想や変化のイメージ
・今という理由
・体験・感情価値

AIDA、PAS/PASONA、BABなどの考え方は、必要な場合のみ文章構成の補助として内部で使用してください。
手法名を利用者向けの文章に表示する必要はありません。

【3案についての重要ルール】
・A、B、Cは「表現」ではなく「販促角度・売り方」が明確に異なること
・同じ悩み訴求を言い換えただけの3案は禁止
・3案を作った後、互いに十分違うか内部で確認すること
・似ている場合は、異なる角度になるよう作り直すこと
・1案だけ recommended=true にすること
・titleは、利用者が「この売り方で行きたい」と直感的に選べる短いタイトルにすること
・reasonでは、その案が何を入口にして、どう行動につなげるプランなのかを簡潔に説明すること

【価格・割引・特典について】
割引、価格、プレゼント、キャンペーン条件が入力されていても、
原則としてタイトルや最初のフックの第一訴求にはしないでください。

基本は、
「興味 → 価値 → 特典・条件 → 行動」
の順で考えてください。

ただし、販促目的そのものがセール・キャンペーン告知などであり、
オファーを前面に出す合理的な理由がある場合は使用して構いません。

安売りを標準的な販促戦略にしないでください。

【事実性の最重要ルール】
入力情報またはサロン・店舗情報に存在しない事実を作ってはいけません。

特に以下を推測・捏造しないでください。

・人気No.1
・予約殺到
・残り人数
・口コミ評価
・販売実績
・効果実績
・数値的な変化
・利用者の実感率
・医師や専門家の推薦
・資格
・受賞歴
・価格
・割引率
・成分
・商品の特徴
・施術内容
・限定条件
・第三者評価

商品やメニューについて書かれていない特徴・効果・成分などを、
一般知識や想像から補完してはいけません。

一方、入力された特徴・価格・成分・こだわり・利用方法・特典などは、
販促材料として積極的に活用してください。

【効果表現】
利用者が入力した効果表現を、AIがより強い効果・医療的な断定へ変換してはいけません。

例：
「整える」→「改善する」「治す」などへ強化しない。

必要に応じて、体験価値・利用場面・気持ち・生活上の価値など、
事実を追加しなくても表現できる方向へ展開してください。

【サロン・店舗への適応】
特定の性別、年代、業種、高級感、親しみやすさ等を固定しないでください。

サロン・店舗情報に設定されている内容があれば、それに合わせて表現してください。
設定されていない特徴を勝手に付与しないでください。

【出力項目】
title：
販促プランを選ぶための短い名称。

catch：
その販促角度を象徴する短い訴求イメージ。

gift：
入力された販促内容・商品・メニュー・特典等を、その案でどう扱うかを簡潔に示す。

customer_need：
その案が着目する顧客側のニーズ・関心。

reason：
利用者向けに、この案が「何を入口にして、どう興味・行動につなげるか」を1〜2文程度で説明する。

recommended：
3案のうち最も今回の目的・対象・内容に適していると判断した1案のみtrue。
`;

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
            name: 'plans',
            strict: true,
            schema
          }
        }
      })
    });

    const j = await r.json();

    if (!r.ok) {
      return res
        .status(r.status)
        .json({ error: j.error?.message || 'OpenAI API error' });
    }

    let t = '';

    for (const o of j.output || []) {
      for (const c of o.content || []) {
        if (c.type === 'output_text') {
          t = c.text;
        }
      }
    }

    return res.json(JSON.parse(t));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
