/* ============================================================
   HookFlow Studio — Cloudflare Worker (AI 프록시 · 백엔드)
   프론트(GitHub Pages)가 CORS로 직접 못 부르는 Gemini/fal를 대신 호출.
   키는 여기 Secret에만 보관(브라우저 노출 X).

   [필수 Secret]  GEMINI_API_KEY   (Google AI Studio 무료 키)
   [선택 Secret]  FAL_KEY          (fal.ai · Seedance 영상 생성용)
   [선택 Var]     ALLOW_ORIGIN     (기본 * · 특정 도메인으로 잠그려면 지정)

   배포:  npm i -g wrangler → wrangler deploy  (WORKER_SETUP.md 참고)
   ============================================================ */

function corsHeaders(env){
  return {
    'Access-Control-Allow-Origin': (env && env.ALLOW_ORIGIN) || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(env, obj, status){
  return new Response(JSON.stringify(obj), {status: status||200,
    headers: Object.assign({'Content-Type':'application/json; charset=utf-8'}, corsHeaders(env))});
}

export default {
  async fetch(req, env){
    if (req.method === 'OPTIONS') return new Response(null, {headers: corsHeaders(env)});
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (p === '/' || p === '/health') return json(env, {ok:true, service:'hookflow-worker', hasGemini: !!env.GEMINI_API_KEY, hasFal: !!env.FAL_KEY});
      if (p === '/gemini/text')  return await geminiText(req, env);
      if (p === '/gemini/image') return await geminiImage(req, env);
      if (p === '/news')         return await news(req, env);
      if (p === '/seedance')     return await seedance(req, env);
      return json(env, {error: 'unknown route: ' + p}, 404);
    } catch (e) {
      return json(env, {error: String((e && e.message) || e)}, 500);
    }
  }
};

/* --- Gemini 텍스트(JSON 구조화 출력) --- */
async function geminiText(req, env){
  if (!env.GEMINI_API_KEY) return json(env, {error:'GEMINI_API_KEY 미설정'}, 500);
  const { prompt, schema, model, grounding } = await req.json();
  if (!prompt) return json(env, {error:'prompt 필요'}, 400);
  const m = model || 'gemini-2.5-flash';
  const gc = {};
  if (schema) { gc.responseMimeType = 'application/json'; gc.responseSchema = schema; }
  const body = { contents: [{ role:'user', parts: [{ text: prompt }] }], generationConfig: gc };
  if (grounding) body.tools = [{ google_search: {} }]; // 실시간 검색(유료 티어)
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await r.json();
  if (!r.ok) return json(env, {error: (d.error && d.error.message) || ('Gemini '+r.status)}, r.status);
  const parts = ((((d.candidates||[])[0]||{}).content)||{}).parts || [];
  const text = parts.map(x => x.text || '').join('');
  return json(env, { text });
}

/* --- Gemini 이미지(Nano Banana = gemini-2.5-flash-image) --- */
async function geminiImage(req, env){
  if (!env.GEMINI_API_KEY) return json(env, {error:'GEMINI_API_KEY 미설정'}, 500);
  const { prompt, refs, model } = await req.json();
  if (!prompt) return json(env, {error:'prompt 필요'}, 400);
  const m = model || 'gemini-2.5-flash-image';
  const parts = [{ text: prompt }];
  (refs || []).forEach(rf => { if (rf && rf.data) parts.push({ inlineData: { mimeType: rf.mimeType || 'image/png', data: rf.data } }); });
  const body = { contents: [{ role:'user', parts }], generationConfig: { responseModalities: ['IMAGE','TEXT'] } };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const d = await r.json();
  if (!r.ok) return json(env, {error: (d.error && d.error.message) || ('Gemini image '+r.status)}, r.status);
  const outParts = ((((d.candidates||[])[0]||{}).content)||{}).parts || [];
  const images = outParts.filter(x => x.inlineData).map(x => ({ mimeType: x.inlineData.mimeType, data: x.inlineData.data }));
  const note = outParts.filter(x => x.text).map(x => x.text).join(' ');
  if (!images.length) return json(env, {error:'이미지가 반환되지 않았습니다 (프롬프트/모델 확인)', note}, 502);
  return json(env, { images, note });
}

/* --- 오늘의 이슈(구글뉴스 KR RSS · 서버측이라 CORS 무관) --- */
async function news(req, env){
  const u = new URL(req.url);
  const q = u.searchParams.get('q');
  const rss = q
    ? 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1d') + '&hl=ko&gl=KR&ceid=KR:ko'
    : 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko';
  const r = await fetch(rss, { cf: { cacheTtl: 300 } });
  const xml = await r.text();
  let titles = (xml.match(/<title>([\s\S]*?)<\/title>/g) || [])
    .map(s => s.replace(/<\/?title>/g,'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/\s+-\s+[^-]+$/,'').trim())
    .filter(Boolean);
  if (titles.length && /google news/i.test(titles[0])) titles.shift();
  return json(env, { titles: titles.slice(0, 10) });
}

/* --- Seedance 영상(fal.ai · 선택) : 제출→요청ID 반환, 프론트가 폴링 --- */
async function seedance(req, env){
  if (!env.FAL_KEY) return json(env, {error:'FAL_KEY 미설정 · 영상 생성은 선택 기능입니다'}, 400);
  const body = await req.json();
  // 인증 GET (status_url / response_url 폴링·결과조회)
  if (body && (body.url || body.statusUrl)) {
    const r = await fetch(body.url || body.statusUrl, { headers: { 'Authorization': 'Key ' + env.FAL_KEY } });
    return json(env, await r.json(), r.status);
  }
  const model = body.model || 'fal-ai/bytedance/seedance/v1/lite/text-to-video';
  const payload = { prompt: body.prompt, resolution: body.resolution || '720p', duration: body.duration || 5 };
  if (body.image_url) payload.image_url = body.image_url;
  const r = await fetch('https://queue.fal.run/' + model, {
    method:'POST', headers:{ 'Authorization':'Key '+env.FAL_KEY, 'Content-Type':'application/json' }, body: JSON.stringify(payload)
  });
  return json(env, await r.json(), r.status);
}
