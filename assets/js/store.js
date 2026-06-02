/* ============================================================
   store.js — 전역 상태 / localStorage / 평가 로직 / 통계
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'cdc_selection_v1';

  /* ── 선발 단계 정의 ───────────────────────────────────────── */
  const STAGES = {
    applied:        { key:'applied',        label:'신청완료',   step:'01 접수', badge:'b-gray',   order:0 },
    doc_review:     { key:'doc_review',     label:'서류심사중', step:'02 서류', badge:'b-blue',   order:1 },
    doc_pass:       { key:'doc_pass',       label:'서류합격',   step:'02 서류', badge:'b-teal',   order:2 },
    doc_fail:       { key:'doc_fail',       label:'서류불합격', step:'02 서류', badge:'b-red',    order:2 },
    interview:      { key:'interview',      label:'인터뷰대상', step:'03 면접', badge:'b-amber',  order:3 },
    interview_done: { key:'interview_done', label:'인터뷰완료', step:'03 면접', badge:'b-purple', order:4 },
    final_pass:     { key:'final_pass',     label:'최종합격',   step:'04 최종', badge:'b-green',  order:5 },
    final_fail:     { key:'final_fail',     label:'최종불합격', step:'04 최종', badge:'b-red',    order:5 },
  };
  const STAGE_ORDER = ['applied','doc_review','doc_pass','doc_fail','interview','interview_done','final_pass','final_fail'];

  /* ── 기본 평가 기준 (기본 항목 + 추가 항목) ──────────────── */
  const DEFAULT_CONFIG = {
    docCriteria: [
      { id:'d_motive', name:'지원동기 적합성',        max:25, kind:'basic', desc:'사업 목적·직무와의 연관성, 참여 의지의 진정성' },
      { id:'d_career', name:'관련 경력·경험',         max:25, kind:'basic', desc:'직무 관련 경력, 활동, 보유 역량의 충실도' },
      { id:'d_plan',   name:'수행계획 구체성',        max:25, kind:'basic', desc:'향후 비전·포부 및 수행계획의 구체성·실현 가능성' },
      { id:'d_growth', name:'성장 가능성',            max:15, kind:'basic', desc:'학습 태도, 발전 가능성, 잠재 역량' },
      { id:'d_doc',    name:'서류 충실도',            max:10, kind:'add',   desc:'첨부서류·기재 완성도, 적격요건 충족' },
    ],
    itvCriteria: [
      { id:'i_job',    name:'직무 이해도',            max:25, kind:'basic', desc:'직무·과제에 대한 이해와 전문성' },
      { id:'i_comm',   name:'의사소통 능력',          max:20, kind:'basic', desc:'논리적 전달력, 경청·표현력' },
      { id:'i_solve',  name:'문제해결·창의성',        max:20, kind:'basic', desc:'문제 정의 및 창의적 해결 역량' },
      { id:'i_atti',   name:'성실성·인성',            max:20, kind:'basic', desc:'책임감, 태도, 조직 적응력' },
      { id:'i_fit',    name:'조직 적합성·열정',       max:15, kind:'add',   desc:'기관 가치 부합도, 참여 열정' },
    ],
    docPassCut: 60,     // 서류 합격 기준 점수
    itvPassCut: 65,     // 최종 합격 기준 점수
    finalQuota: { '째깍섬':14, '키즈-째깍악어':5, '펫-모그와이':5 }, // 트랙별 최종 선발 인원
  };

  /* ── 상태 ──────────────────────────────────────────────── */
  let state = {
    applicants: [],
    evals: {},      // { [id]: { doc:{reviews:[{reviewer,scores,total,comment,date}], total, scores, std, reviewerCount, date}, itv:{...} } }
    stages: {},     // { [id]: stageKey }
    config: null,
    session: { reviewer: '심사위원1' }, // 현재 평가를 입력하는 심사위원
    meta: { uploadedName:'', uploadedAt:'', sourceTitle:'' },
  };

  function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

  /* ── 루브릭 앵커(점수구간 행동지표) ───────────────────── */
  function defaultAnchors(max){
    const b = max/4;
    return [
      { label:'탁월', min:Math.round(b*3), target:max,             desc:'기대를 크게 상회 — 명확한 근거·성과 제시' },
      { label:'우수', min:Math.round(b*2), target:Math.round(b*2.5), desc:'기준을 충분히 충족 — 구체적 사례 있음' },
      { label:'보통', min:Math.round(b*1), target:Math.round(b*1.5), desc:'기본 요건 충족 — 일반적 수준' },
      { label:'미흡', min:0,               target:Math.round(b*0.5), desc:'기준 미달 — 근거 부족/모호' },
    ];
  }
  function ensureAnchors(){
    if (!state.config) return;
    ['docCriteria','itvCriteria'].forEach(k=>{
      (state.config[k]||[]).forEach(c=>{ if(!c.anchors || !c.anchors.length) c.anchors = defaultAnchors(c.max); });
    });
  }

  /* ── 평가 데이터 마이그레이션(단일 review → reviews 배열) ─ */
  function migrateEvals(){
    Object.keys(state.evals||{}).forEach(id=>{
      const e = state.evals[id]; if(!e) return;
      ['doc','itv'].forEach(p=>{
        const o = e[p];
        if (o && !o.reviews) {
          e[p] = { reviews:[{ reviewer:o.reviewer||'심사위원1', scores:o.scores||{}, total:o.total||0,
                              comment:o.comment||'', date:o.date||new Date().toISOString() }] };
          recomputeAgg(p, e);
        }
      });
    });
  }

  function load() {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
        if (!state.config) state.config = deepClone(DEFAULT_CONFIG);
        if (!state.session) state.session = { reviewer:'심사위원1' };
        ensureAnchors();
        migrateEvals();
        return;
      } catch (e) { console.warn('상태 복원 실패, 초기화', e); }
    }
    seedFromDefault();
  }

  function seedFromDefault() {
    const seed = (window.SEED_APPLICANTS || []).map(normalizeApplicant);
    state.applicants = seed;
    state.evals = {};
    state.stages = {};
    seed.forEach(a => state.stages[a.id] = 'applied');
    state.config = deepClone(DEFAULT_CONFIG);
    ensureAnchors();
    state.session = { reviewer:'심사위원1' };
    state.meta = { uploadedName:'통합신청자명단 (시드)', uploadedAt:new Date().toISOString(),
      sourceTitle:'2026 청년일경험지원사업 [커넥팅더닷츠]' };
    save();
  }

  function normalizeApplicant(a, i) {
    return {
      id: a.id || a.authNo || ('APP' + String(i+1).padStart(4,'0')),
      no: a.no || (i+1),
      track: a.track || '미분류',
      org: a.org || '', program: a.program || '',
      authNo: a.authNo || '', authStatus: a.authStatus || '',
      name: a.name || '(이름없음)',
      applyDate: a.applyDate || '', birth: a.birth || '',
      address: a.address || '', phone: a.phone || '', email: a.email || '',
      edu: a.edu || '', school: a.school || '', college: a.college || '', major: a.major || '',
      annualCount: a.annualCount || 0,
      kepa: a.kepa || '', employIns: a.employIns || '',
      privacyAgree: a.privacyAgree || '', dataIssue: a.dataIssue || '', hasFile: a.hasFile || '',
      motivation: a.motivation || '', vision: a.vision || '', career: a.career || '',
    };
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
    catch (e) { console.error('저장 실패', e); }
  }

  /* ── 데이터 교체 (업로드) ──────────────────────────────── */
  function replaceApplicants(rows, meta) {
    const norm = rows.map(normalizeApplicant);
    state.applicants = norm;
    state.evals = {};
    state.stages = {};
    norm.forEach(a => state.stages[a.id] = 'applied');
    state.meta = Object.assign({ uploadedAt:new Date().toISOString() }, meta || {});
    save();
  }

  function resetAll() { localStorage.removeItem(LS_KEY); seedFromDefault(); }

  /* ── 조회 ──────────────────────────────────────────────── */
  const applicants = () => state.applicants;
  const getApplicant = id => state.applicants.find(a => a.id === id);
  const config = () => state.config;
  const meta = () => state.meta;
  const stageOf = id => state.stages[id] || 'applied';
  const stageInfo = key => STAGES[key] || STAGES.applied;
  const allStages = () => STAGES;

  function evalOf(id) {
    if (!state.evals[id]) state.evals[id] = { doc:null, itv:null };
    return state.evals[id];
  }

  /* ── 평가 저장 (다중 심사위원) ─────────────────────────── */
  function totalOf(scores, criteria) {
    return criteria.reduce((s,c) => s + (Number(scores[c.id]) || 0), 0);
  }
  function maxTotal(criteria){ return criteria.reduce((s,c)=>s+c.max,0); }

  const getReviewer = () => (state.session && state.session.reviewer) || '심사위원1';
  function setReviewer(name){ state.session = state.session || {}; state.session.reviewer = (name||'').trim() || '심사위원1'; save(); }
  const round1 = n => Math.round(n*10)/10;

  // reviews[] → 평균 점수/항목별 평균/표준편차(편차) 집계를 같은 객체에 기록 (기존 .total/.scores 읽기 호환)
  function recomputeAgg(phase, e){
    const obj = e[phase];
    if (!obj || !obj.reviews || !obj.reviews.length){ e[phase] = null; return; }
    const crits = phase==='doc' ? state.config.docCriteria : state.config.itvCriteria;
    const n = obj.reviews.length;
    const scores = {};
    crits.forEach(c => { scores[c.id] = round1(obj.reviews.reduce((s,r)=> s + (Number(r.scores[c.id])||0), 0)/n); });
    const totals = obj.reviews.map(r => Number(r.total)||0);
    const mean = totals.reduce((a,b)=>a+b,0)/n;
    const std = Math.sqrt(totals.reduce((s,t)=> s + (t-mean)**2, 0)/n);
    obj.scores = scores;
    obj.total = round1(mean);
    obj.std = round1(std);
    obj.reviewerCount = n;
    obj.date = obj.reviews.map(r=>r.date).sort().slice(-1)[0];
    obj.reviewer = n===1 ? obj.reviews[0].reviewer : `${n}명 평균`;
  }

  function upsertReview(phase, id, scores, comment, reviewer, criteria){
    reviewer = (reviewer||getReviewer()).trim() || '심사위원1';
    const e = evalOf(id);
    if (!e[phase] || !e[phase].reviews) e[phase] = { reviews:[] };
    const total = totalOf(scores, criteria);
    const rec = { reviewer, scores:deepClone(scores), total, comment:comment||'', date:new Date().toISOString() };
    const ex = e[phase].reviews.find(r => r.reviewer === reviewer);
    if (ex) Object.assign(ex, rec); else e[phase].reviews.push(rec);
    recomputeAgg(phase, e);
    return e[phase].total;
  }

  function saveDocEval(id, scores, comment, reviewer) {
    const total = upsertReview('doc', id, scores, comment, reviewer, state.config.docCriteria);
    if (stageOf(id) === 'applied') state.stages[id] = 'doc_review';
    save();
    return total;
  }
  function saveItvEval(id, scores, comment, reviewer) {
    const total = upsertReview('itv', id, scores, comment, reviewer, state.config.itvCriteria);
    if (stageOf(id) === 'interview') state.stages[id] = 'interview_done';
    save();
    return total;
  }

  // 특정 단계의 집계 + 현재 심사위원의 개별 평가
  function evalAggregate(id, phase){
    const e = state.evals[id]; const o = e && e[phase];
    if (!o || !o.reviews || !o.reviews.length) return null;
    return { avgTotal:o.total, perCritAvg:o.scores, std:o.std, reviewerCount:o.reviewerCount, reviews:o.reviews };
  }
  function myReview(id, phase){
    const e = state.evals[id]; const o = e && e[phase];
    if (!o || !o.reviews) return null;
    return o.reviews.find(r => r.reviewer === getReviewer()) || null;
  }

  function setStage(id, stage) {
    if (!STAGES[stage]) return;
    state.stages[id] = stage;
    save();
  }

  /* ── 일괄 처리 ─────────────────────────────────────────── */
  // 서류 합격선 자동 적용: 점수 있는 신청자 중 cut 이상 합격 / 미만 불합격
  function applyDocCut() {
    const cut = state.config.docPassCut;
    let pass=0, fail=0;
    state.applicants.forEach(a => {
      const e = state.evals[a.id];
      if (e && e.doc) {
        if (['interview','interview_done','final_pass','final_fail'].includes(stageOf(a.id))) return;
        if (e.doc.total >= cut) { state.stages[a.id]='doc_pass'; pass++; }
        else { state.stages[a.id]='doc_fail'; fail++; }
      }
    });
    save();
    return { pass, fail };
  }

  // 서류합격자 → 인터뷰대상 일괄 승급
  function promoteToInterview(ids) {
    let n=0;
    ids.forEach(id => { if (stageOf(id)==='doc_pass'){ state.stages[id]='interview'; n++; } });
    save(); return n;
  }

  // 최종 선발: 트랙별 인터뷰 점수 순 + 쿼터 적용
  function applyFinalSelection() {
    const cut = state.config.itvPassCut;
    const quota = state.config.finalQuota;
    const byTrack = {};
    state.applicants.forEach(a => {
      const e = state.evals[a.id];
      const st = stageOf(a.id);
      if ((st==='interview_done'||st==='final_pass'||st==='final_fail') && e && e.itv) {
        (byTrack[a.track] = byTrack[a.track] || []).push({ id:a.id, total:e.itv.total });
      }
    });
    let pass=0, fail=0;
    Object.keys(byTrack).forEach(tr => {
      const list = byTrack[tr].sort((x,y)=>y.total-x.total);
      const q = quota[tr] != null ? quota[tr] : list.length;
      list.forEach((item, idx) => {
        if (idx < q && item.total >= cut) { state.stages[item.id]='final_pass'; pass++; }
        else { state.stages[item.id]='final_fail'; fail++; }
      });
    });
    save();
    return { pass, fail };
  }

  /* ── 설정 변경 ─────────────────────────────────────────── */
  function updateConfig(patch){ Object.assign(state.config, patch); save(); }
  function addCriterion(group, crit){
    crit.id = (group==='doc'?'d_':'i_') + 'x' + Date.now().toString(36);
    crit.kind = 'add';
    if (!crit.anchors) crit.anchors = defaultAnchors(crit.max);
    state.config[group==='doc'?'docCriteria':'itvCriteria'].push(crit);
    save(); return crit.id;
  }
  function removeCriterion(group, id){
    const k = group==='doc'?'docCriteria':'itvCriteria';
    state.config[k] = state.config[k].filter(c=>c.id!==id);
    save();
  }
  function updateCriterion(group, id, patch){
    const k = group==='doc'?'docCriteria':'itvCriteria';
    const c = state.config[k].find(x=>x.id===id);
    if (c) {
      const maxChanged = patch.max != null && Number(patch.max) !== c.max;
      Object.assign(c, patch);
      if (maxChanged) c.anchors = defaultAnchors(c.max); // 배점 변경 시 앵커 재생성
    }
    save();
  }

  /* ── 통계 ──────────────────────────────────────────────── */
  function stats() {
    const apps = state.applicants;
    const total = apps.length;
    const cnt = k => apps.filter(a => stageOf(a.id)===k).length;
    const counts = {};
    STAGE_ORDER.forEach(k => counts[k] = cnt(k));

    // 퍼널 (누적)
    const reviewed   = apps.filter(a => state.evals[a.id]?.doc).length;
    const docPassed  = apps.filter(a => ['doc_pass','interview','interview_done','final_pass','final_fail'].includes(stageOf(a.id))).length;
    const interviewed= apps.filter(a => ['interview_done','final_pass','final_fail'].includes(stageOf(a.id))).length;
    const finalPass  = cnt('final_pass');

    // 트랙 분포
    const trackMap = {};
    apps.forEach(a => { trackMap[a.track] = (trackMap[a.track]||0)+1; });

    // 학력 분포
    const eduMap = {};
    apps.forEach(a => { const e=a.edu||'기타'; eduMap[e]=(eduMap[e]||0)+1; });

    // 서류 점수 분포 (구간)
    const buckets = [0,0,0,0,0]; // <60,60-69,70-79,80-89,90+
    const docScores = [];
    apps.forEach(a => {
      const e = state.evals[a.id];
      if (e?.doc) {
        const t = e.doc.total; docScores.push(t);
        if (t<60) buckets[0]++; else if (t<70) buckets[1]++; else if (t<80) buckets[2]++;
        else if (t<90) buckets[3]++; else buckets[4]++;
      }
    });
    const avgDoc = docScores.length ? (docScores.reduce((a,b)=>a+b,0)/docScores.length) : 0;

    // 적격 플래그
    const privacyY = apps.filter(a=>a.privacyAgree==='Y').length;
    const fileY    = apps.filter(a=>a.hasFile==='Y').length;
    const issueN   = apps.filter(a=>a.dataIssue==='N').length;

    return {
      total, counts, reviewed, docPassed, interviewed, finalPass, avgDoc,
      trackMap, eduMap, buckets, docScores, privacyY, fileY, issueN,
    };
  }

  // 트랙별 진행 요약
  function trackProgress() {
    const map = {};
    state.applicants.forEach(a => {
      const t = a.track;
      map[t] = map[t] || { track:t, total:0, reviewed:0, docPass:0, interview:0, finalPass:0 };
      map[t].total++;
      const e = state.evals[a.id]; const st = stageOf(a.id);
      if (e?.doc) map[t].reviewed++;
      if (['doc_pass','interview','interview_done','final_pass','final_fail'].includes(st)) map[t].docPass++;
      if (['interview','interview_done','final_pass','final_fail'].includes(st)) map[t].interview++;
      if (st==='final_pass') map[t].finalPass++;
    });
    return Object.values(map);
  }

  function recentActivity(n) {
    const acts = [];
    state.applicants.forEach(a => {
      const e = state.evals[a.id]; if(!e) return;
      ['doc','itv'].forEach(p=>{
        const o = e[p]; if(!o || !o.reviews) return;
        const label = p==='doc'?'서류':'인터뷰';
        o.reviews.forEach(r => acts.push({ id:a.id, name:a.name, track:a.track, type:label,
          total:r.total, date:r.date, reviewer:r.reviewer }));
      });
    });
    return acts.sort((x,y)=> new Date(y.date)-new Date(x.date)).slice(0, n||8);
  }

  /* ── 다음 할일 추천 (현 단계에서 필요한 작업) ──────────── */
  function nextActions(){
    const apps = state.applicants;
    const cnt = fn => apps.filter(fn).length;
    const hasDoc = a => !!(state.evals[a.id] && state.evals[a.id].doc);
    const hasItv = a => !!(state.evals[a.id] && state.evals[a.id].itv);
    const out = [];
    const docUnscored = cnt(a => ['applied','doc_review'].includes(stageOf(a.id)) && !hasDoc(a));
    if (docUnscored) out.push({ icon:'doc', color:'#3B5BDB', title:'서류 평가 진행', desc:`${docUnscored}명 평가 대기`, count:docUnscored, route:'#/document' });
    const scoredNotCut = cnt(a => ['applied','doc_review'].includes(stageOf(a.id)) && hasDoc(a));
    if (scoredNotCut) out.push({ icon:'bolt', color:'#F5A623', title:'서류 합격선 적용', desc:`평가완료 ${scoredNotCut}명 합격선 미적용`, count:scoredNotCut, route:'#/document' });
    const docPassWait = cnt(a => stageOf(a.id)==='doc_pass');
    if (docPassWait) out.push({ icon:'arrow', color:'#00A99D', title:'인터뷰 대상 승급', desc:`서류합격 ${docPassWait}명 인터뷰 대기`, count:docPassWait, route:'#/interview' });
    const itvWait = cnt(a => stageOf(a.id)==='interview' && !hasItv(a));
    if (itvWait) out.push({ icon:'mic', color:'#8C5BE6', title:'인터뷰 평가 진행', desc:`${itvWait}명 인터뷰 평가 대기`, count:itvWait, route:'#/interview' });
    const finalWait = cnt(a => stageOf(a.id)==='interview_done');
    if (finalWait) out.push({ icon:'trophy', color:'#2BB673', title:'최종 선발 확정', desc:`인터뷰완료 ${finalWait}명 최종 미확정`, count:finalWait, route:'#/final' });
    let disagree = 0;
    apps.forEach(a => { const e=state.evals[a.id]; if(!e) return;
      ['doc','itv'].forEach(p=>{ const o=e[p]; if(o && o.reviewerCount>=2 && o.std>=10) disagree++; }); });
    if (disagree) out.push({ icon:'users', color:'#E8503A', title:'평가 편차 재검토', desc:`심사위원 점수차 큰 평가 ${disagree}건`, count:disagree, route:'#/applicants' });
    const ineligible = cnt(a => a.privacyAgree!=='Y' || a.dataIssue==='Y');
    if (ineligible) out.push({ icon:'x', color:'#E8503A', title:'적격요건 확인', desc:`개인정보 미동의·기재이상 ${ineligible}명`, count:ineligible, route:'#/applicants' });
    return out;
  }

  /* ── Export 평탄화 행 ─────────────────────────────────── */
  function exportRows(){
    return state.applicants.map(a => {
      const e = state.evals[a.id] || {};
      return {
        연번:a.no, 이름:a.name, 트랙:a.track, 프로그램:a.program,
        학력:a.edu, 학교:a.school, 학과:a.major||a.college,
        연락처:a.phone, 이메일:a.email,
        개인정보동의:a.privacyAgree, 첨부파일:a.hasFile, 기재이상:a.dataIssue,
        단계: stageInfo(stageOf(a.id)).label,
        서류평균: e.doc? e.doc.total : '', 서류심사위원수: e.doc? e.doc.reviewerCount : '', 서류편차: e.doc? e.doc.std : '',
        인터뷰평균: e.itv? e.itv.total : '', 인터뷰심사위원수: e.itv? e.itv.reviewerCount : '', 인터뷰편차: e.itv? e.itv.std : '',
      };
    });
  }

  window.Store = {
    load, save, resetAll, replaceApplicants,
    applicants, getApplicant, config, meta,
    stageOf, stageInfo, allStages, STAGE_ORDER,
    evalOf, saveDocEval, saveItvEval, setStage,
    totalOf, maxTotal,
    getReviewer, setReviewer, evalAggregate, myReview, defaultAnchors,
    applyDocCut, promoteToInterview, applyFinalSelection,
    updateConfig, addCriterion, removeCriterion, updateCriterion,
    stats, trackProgress, recentActivity, nextActions, exportRows,
    DEFAULT_CONFIG,
  };
})();
