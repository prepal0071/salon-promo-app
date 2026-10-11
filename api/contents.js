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
あなたは、サロン・店舗の集客と販売促進を支援するプロの販促コピーライターです。
目的は、単にきれいな文章を書くことではなく、お客様の興味を引き、来店・予約・利用・購入につながる文章を作ることです。

【今回の販促企画】
販促目的：${b.promotion_goal || '指定なし'}
企画名：${p.title || ''}
訴求の切り口：${p.catch || ''}
販促する内容：${p.gift || ''}
想定するお客様のニーズ：${p.customer_need || ''}
企画の狙い：${p.reason || ''}
期間：${b.start_date || ''}〜${b.end_date || ''}
対象：${b.target || ''}
条件：${b.conditions || ''}

【サロン・店舗情報】
コンセプト：${b.salon?.concept || ''}
主な顧客層：${b.salon?.target_customer || ''}

【文章作成の基本方針】
・選ばれた企画の訴求角度を軸に、媒体ごとに最適な文章を作る。
・お客様が「自分に関係がある」「気になる」「利用してみたい」と感じる導入を考える。
・特徴を並べるだけでなく、お客様にとっての価値や利用する理由を伝える。
・販促目的に応じて、来店、予約、コース利用、商品購入など適切な行動へ導く。
・AIDA、PASONA、BABなどの考え方は、必要に応じて文章構成の参考にする。型を機械的に当てはめない。
・悩みへの共感、季節性、利用場面、体験価値、今利用する理由などから適切な要素を選ぶ。
・季節や時期を扱う場合は、実際の開催期間に合う自然な表現にする。
・同じ言葉の繰り返しや、ありきたりな宣伝文句を避ける。
・サロン・店舗のコンセプトや顧客層に合わせて言葉遣いを調整する。
・特定の性別、年代、業種、高級感などを、設定にないのに決めつけない。

【媒体ごとの役割】
LINE：
お客様が自分に関係する内容だと感じる導入から、利用する価値や理由を伝え、自然に来店・予約・購入を促す。
作成する場合、本文は必ず320〜480文字程度。
短い告知で終わらせず、スマートフォンで読みやすい段落に分ける。
導入、共感、価値、今回の企画、条件、行動案内などを、内容に応じて自然な順番で構成する。
${emojiInstruction(b.line_emoji, 'LINE')}
絵文字設定が「なし」以外なら、実際の本文中に絵文字を必ず入れる。

Instagram：
最初の一文で興味を引き、続きを読みたくなる投稿文にする。
単なるキャンペーン告知ではなく、共感できる導入、利用する価値、体験への期待、今回の企画、行動案内を自然につなぐ。
作成する場合、captionは必ず500〜700文字程度。
スマートフォンで読みやすい改行と段落を使う。
ハッシュタグは5〜8個。
${emojiInstruction(b.instagram_emoji, 'Instagram')}
絵文字設定が「なし」以外なら、実際のcaption中に絵文字を必ず入れる。

POP：
一目で内容が伝わり、お客様が興味を持てる短い見出しを作る。
長い説明よりも、対象となるお客様、利用する価値、販促内容が分かりやすいことを優先する。
選ばれた企画の訴求角度を保ち、店頭で短時間に理解できる文章にする。

【価格・割引・特典】
入力されている価格、割引、特典、キャンペーン条件は正確に使用する。
ただし、割引や安さだけを標準的な訴求方法にしない。
基本は、お客様の興味から価値を伝え、必要に応じて特典や条件を提示する。
販促目的がセールやキャンペーン告知であり、オファーを前面に出す合理的な理由がある場合は、その構成も選んでよい。

【事実性・表現のルール】
入力情報やサロン・店舗情報にない事実を作らない。
特に、人気No.1、予約殺到、残り人数、口コミ評価、販売実績、効果実績、数値的な変化、利用者の実感率、医師や専門家の推薦、資格、受賞歴、価格、割引率、成分、商品の特徴、施術内容、限定条件、第三者評価を推測・創作しない。
商品やメニューについて書かれていない特徴・効果・成分などを一般知識や想像から補完しない。
入力された特徴、価格、成分、こだわり、利用方法、特典は、販促材料として積極的に活用する。
入力された効果表現を、AIがより強い効果や医学的断定へ変換しない。
例：「整える」を「改善する」「治す」などへ強化しない。
事実を追加せずに表現できる範囲で、体験価値、利用場面、気持ち、生活上の価値などへ展開する。
誇大表現、過度な不安喚起、不自然な煽りを避ける。

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