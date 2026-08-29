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
      if (value === 'none') {
        return `${channel}では絵文字を一切使用しない。`;
      }
      if (value === 'low') {
        return `${channel}では、内容に合う絵文字を必ず2〜4個使用する。絵文字は見出しや重要箇所を中心に控えめに使用する。`;
      }
      if (value === 'high') {
        return `${channel}では、内容に合う絵文字を8〜12個程度使用する。ただし読みづらくならないようにする。`;
      }
      return `${channel}では、内容に合う絵文字を必ず5〜8個程度使用し、自然で見やすい配信文にする。`;
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
        required: [
          'headline',
          'subheadline',
          'body',
          'footer',
          'gift_display'
        ],
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
        required: ['title', 'body'],
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
        required: ['caption', 'hashtags'],
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

    const input = `
あなたは女性向けエステサロンの販促企画・文章制作を担当する編集者です。

【サロンの基本方針】
・30〜50代女性が安心して読める内容
・上品、高級感、清潔感、安心感を大切にする
・安売り感を出さない
・強すぎる煽り表現や医療的な断定表現は使わない
・単にプレゼントを告知するだけではなく、「なぜ今この企画なのか」が伝わる内容にする
・エステサロンとして専門性が感じられる説明を入れる
・難しすぎる専門用語は避ける

【今回の企画】
企画名：${p.title || ''}
キャッチ：${p.catch || ''}
プレゼント：${p.gift || ''}
期間：${b.start_date || ''}〜${b.end_date || ''}
対象：${b.target || ''}
販売・利用につなげたいもの：${b.sales_goal || 'なし'}
条件：${b.conditions || ''}

【LINE配信文】
LINEを作成する場合は、300〜500文字程度を目安にする。
短い告知だけで終わらせない。

次の流れを意識する。
1. 季節や悩みに触れる、興味を引く導入
2. お客様が感じやすい状態への共感
3. サロンからの簡単な説明・美容情報
4. 今回の企画・プレゼントの紹介
5. 期間や利用条件
6. 来店・予約につながる自然な一言

段落を適度に分け、スマートフォンで読みやすくする。
${emojiInstruction(b.line_emoji, 'LINE')}
絵文字を使用する設定の場合、絵文字は必ず実際の文章内に入れる。

【Instagram投稿文】
Instagramを作成する場合は、450〜700文字程度を目安にする。
単なるキャンペーン告知ではなく、美容情報として読める投稿にする。

次の流れを意識する。
1. 読者が「自分のことかも」と感じる導入
2. 季節・生活習慣などによる美容上の変化や悩み
3. サロンとしての考え方・ケアのポイント
4. 今回の企画や施術・プレゼントの紹介
5. どんな方におすすめか
6. 期間・利用条件・来店案内

文章には適度に改行を入れる。
${emojiInstruction(b.instagram_emoji, 'Instagram')}
絵文字を使用する設定の場合、絵文字は必ず実際の文章内に入れる。
ハッシュタグは内容に合うものを5〜8個作成する。

【POP】
POPは、一目で内容が分かることを優先する。
headlineは短く印象的にする。
subheadlineは企画の魅力を補足する。
bodyは店頭で読みやすい簡潔な説明にする。
gift_displayはプレゼント内容がひと目で伝わる短い表現にする。

【画像生成指示】
画像には文字・数字・ロゴ・看板・透かしを入れない。
女性向けエステサロンらしい、上品で自然な写真表現にする。
企画内容に合う季節感や施術イメージを反映する。
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
            name: 'contents',
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
};module.exports=async function(req,res){res.setHeader('Content-Type','application/json');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});try{const b=req.body||{},p=b.plan||{},key=process.env.OPENAI_API_KEY,outs=b.outputs||[],props={},required=[];const emoji=v=>v==='none'?'絵文字は使わない':v==='standard'?'自然な範囲で標準程度':'2〜4個程度まで控えめ';if(outs.includes('pop')){props.pop={type:'object',properties:{headline:{type:'string'},subheadline:{type:'string'},body:{type:'string'},footer:{type:'string'}},required:['headline','subheadline','body','footer'],additionalProperties:false};required.push('pop')}if(outs.includes('line')){props.line={type:'object',properties:{title:{type:'string'},body:{type:'string'}},required:['title','body'],additionalProperties:false};required.push('line')}if(outs.includes('instagram')){props.instagram={type:'object',properties:{caption:{type:'string'},hashtags:{type:'array',items:{type:'string'},maxItems:8}},required:['caption','hashtags'],additionalProperties:false};required.push('instagram')}if(outs.includes('image')||outs.includes('pop')){props.image={type:'object',properties:{prompt_ja:{type:'string'}},required:['prompt_ja'],additionalProperties:false};required.push('image')}const schema={type:'object',properties:props,required,additionalProperties:false};const input=`企画:${p.title} キャッチ:${p.catch} プレゼント:${p.gift} 期間:${b.start_date}〜${b.end_date} 対象:${b.target} 条件:${b.conditions}。女性向けエステサロン。上品、高級感、安心感。LINE:${emoji(b.line_emoji)}。Instagram:${emoji(b.instagram_emoji)}。装飾記号は原則使わない。画像指示は文字なし。`;const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.4-mini',input,text:{format:{type:'json_schema',name:'contents',strict:true,schema}}})}),j=await r.json();if(!r.ok)return res.status(r.status).json({error:j.error?.message||'OpenAI API error'});let t='';for(const o of j.output||[])for(const c of o.content||[])if(c.type==='output_text')t=c.text;return res.json(JSON.parse(t))}catch(e){return res.status(500).json({error:e.message})}};
