/* ============================================================
   ai.js — 하이브리드 AI 레이어
   · 규칙/템플릿 기반 분석은 키 없이 항상 동작 (기본)
   · API 키가 설정되면 Claude로 품질 고도화 (선택)
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'cdc_ai_v1';
  let cfg = { key:'', model:'claude-sonnet-4-6' };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); } catch(e){}
  function persist(){ try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch(e){} }

  const getKey   = () => cfg.key || '';
  const setKey   = k => { cfg.key = (k||'').trim(); persist(); };
  const hasKey   = () => !!cfg.key;
  const getModel = () => cfg.model || 'claude-sonnet-4-6';
  const setModel = m => { cfg.model = m || 'claude-sonnet-4-6'; persist(); };

  /* ── 규칙 기반 신호 키워드 ─────────────────────────────── */
  const SIGNAL = ['수상','최우수','대표','팀장','회장','부회장','기획','운영','제작','분석','전략',
    '마케팅','콘텐츠','브랜딩','홍보','전시','캠페인','프로젝트','인턴','자격증','수료','봉사',
    '서포터즈','공모전','동아리','데이터','SNS','유튜브','릴스','숏폼','발표','기여','성과','경력'];
  const DOMAIN = ['마케팅','콘텐츠','전시','기획','홍보','브랜딩','데이터','SNS','디자인','영상',
    '커뮤니티','교육','아동','복지','플랫폼','그로스','유입','운영'];

  function sentences(t){
    return String(t||'').split(/(?<=[.!?。])\s+|\n+/).map(s=>s.trim())
      .filter(s=>s.length>=8 && s.length<=120);
  }
  function countCareers(t){
    const txt=String(t||'');
    const years=(txt.match(/20\d{2}/g)||[]).length;          // 연도 표기 수
    const bullets=txt.split('\n').filter(l=>l.trim().length>6).length;
    return Math.max(years, Math.min(bullets, 12));
  }

  /* ── 규칙 기반 요약 (동기 / 키 불필요) ─────────────────── */
  function summarizeApplicant(a){
    const all = [a.motivation, a.career, a.vision].join('\n');
    const kw = [...new Set(SIGNAL.filter(k => all.includes(k)))].slice(0, 8);
    const domains = [...new Set(DOMAIN.filter(k => all.includes(k)))].slice(0, 5);
    // 강점 문장: 신호 키워드를 포함한 짧은 문장 우선
    const cand = [...sentences(a.career), ...sentences(a.motivation)];
    const scored = cand.map(s => ({ s, n: SIGNAL.reduce((c,k)=>c+(s.includes(k)?1:0),0) }))
      .filter(x => x.n > 0).sort((x,y)=> y.n - x.n || x.s.length - y.s.length);
    const seen = new Set(); const highlights = [];
    for (const x of scored){ const key=x.s.slice(0,16); if(seen.has(key))continue; seen.add(key);
      highlights.push(x.s); if(highlights.length>=4) break; }
    return {
      keywords: kw, domains, careers: countCareers(a.career),
      highlights, wordcount: all.replace(/\s/g,'').length,
    };
  }

  /* ── 규칙 기반 면접 추천 질문 (동기 / 키 불필요) ───────── */
  function interviewQuestions(a, itvCriteria){
    const q = [];
    const mFirst = sentences(a.motivation)[0];
    if (mFirst) q.push(`지원동기에서 “${mFirst.slice(0,40)}…”라고 하셨는데, 그 배경과 계기를 구체적으로 설명해 주세요.`);
    const cFirst = sentences(a.career)[0];
    if (cFirst) q.push(`경력 중 “${cFirst.slice(0,38)}…” 경험에서 본인의 역할과 가장 어려웠던 점은 무엇이었나요?`);
    const vFirst = sentences(a.vision)[0];
    if (vFirst) q.push(`수행계획으로 제시한 내용 중 우선순위 1가지와, 8주 내 달성 가능한 근거를 말씀해 주세요.`);
    // 평가기준 연계 질문
    (itvCriteria||[]).forEach(c=>{
      const map = {
        '직무 이해도':'이 직무에서 가장 중요한 역량 한 가지와 본인의 준비 수준을 설명해 주세요.',
        '의사소통 능력':'팀에서 의견 충돌이 있었을 때 어떻게 조율했는지 사례를 들어 주세요.',
        '문제해결·창의성':'제약(시간·예산·인력) 속에서 창의적으로 문제를 해결한 경험이 있나요?',
        '성실성·인성':'책임을 끝까지 완수하기 위해 가장 신경 쓰는 원칙은 무엇인가요?',
        '조직 적합성·열정':'우리 기관/프로그램에 본인이 기여할 수 있는 점은 무엇이라고 생각하나요?',
      };
      if (map[c.name]) q.push(map[c.name]);
      else q.push(`[${c.name}] ${c.desc||'관련 역량'}을(를) 보여줄 수 있는 구체적 사례를 말씀해 주세요.`);
    });
    return q;
  }

  /* ── Claude 호출 (선택) ───────────────────────────────── */
  async function callClaude(system, user, maxTokens){
    if (!hasKey()) throw new Error('NO_KEY');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-api-key': getKey(),
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true',
      },
      body: JSON.stringify({ model:getModel(), max_tokens:maxTokens||700, system,
        messages:[{ role:'user', content:user }] }),
    });
    if (!res.ok){ const t=await res.text().catch(()=> ''); throw new Error('API '+res.status+' '+t.slice(0,120)); }
    const j = await res.json();
    return (j.content||[]).map(c=>c.text||'').join('').trim();
  }

  function applicantContext(a){
    return `[지원자] ${a.name} / 트랙: ${a.track} / 학과: ${a.major||a.college||'-'} / 학력: ${a.edu||'-'}\n`
      + `[지원동기]\n${a.motivation||'(없음)'}\n\n[향후 비전·수행계획]\n${a.vision||'(없음)'}\n\n[관련 경력·경험]\n${a.career||'(없음)'}`;
  }

  // 키가 있으면 Claude 요약, 없으면 규칙 기반 텍스트로 폴백
  async function enhanceSummary(a){
    if (!hasKey()) return null;
    const sys = '당신은 청년일경험 사업 채용 심사를 돕는 어시스턴트입니다. 지원서를 근거로만 간결하게 한국어로 요약하세요. 추측·과장 금지.';
    const user = `${applicantContext(a)}\n\n위 지원자를 심사위원이 빠르게 파악하도록 다음 형식으로 요약:\n1) 핵심 강점 3가지(각 1줄)\n2) 직무 적합성 한줄평\n3) 확인이 필요한 점 1~2가지`;
    return await callClaude(sys, user, 600);
  }

  async function generateQuestions(a, itvCriteria){
    if (!hasKey()) return interviewQuestions(a, itvCriteria);
    const sys = '당신은 채용 면접관을 돕는 어시스턴트입니다. 지원서 내용을 근거로 한 맞춤형 면접 질문만 한국어로 생성하세요.';
    const crit = (itvCriteria||[]).map(c=>`- ${c.name}: ${c.desc||''}`).join('\n');
    const user = `${applicantContext(a)}\n\n[평가 기준]\n${crit}\n\n각 평가기준을 검증할 수 있는 맞춤형 면접 질문 6개를 번호 목록으로 작성하세요. 지원자의 실제 서술을 인용해 구체화하세요.`;
    try {
      const txt = await callClaude(sys, user, 700);
      const arr = txt.split('\n').map(l=>l.replace(/^\s*\d+[.)]\s*/,'').trim()).filter(l=>l.length>6);
      return arr.length ? arr : interviewQuestions(a, itvCriteria);
    } catch(e){ return interviewQuestions(a, itvCriteria); }
  }

  window.AI = {
    hasKey, getKey, setKey, getModel, setModel,
    summarizeApplicant, interviewQuestions,
    enhanceSummary, generateQuestions,
  };
})();
