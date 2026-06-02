/* ============================================================
   app.js — 라우터 / 뷰 렌더링 / 차트 / 인터랙션
   ============================================================ */
(function () {
  'use strict';
  const S = window.Store;

  /* ───────────────── 유틸 ───────────────── */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nl2br = s => esc(s).replace(/\n/g,'<br>');
  const fmtDate = iso => { if(!iso) return '-'; const d=new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const ago = iso => { if(!iso) return ''; const s=(Date.now()-new Date(iso))/1000;
    if(s<60) return '방금'; if(s<3600) return Math.floor(s/60)+'분 전'; if(s<86400) return Math.floor(s/3600)+'시간 전';
    return Math.floor(s/86400)+'일 전'; };

  const TRACK_COLOR = { '째깍섬':'#00A99D', '키즈-째깍악어':'#3B5BDB', '펫-모그와이':'#F5A623' };
  const trackColor = t => TRACK_COLOR[t] || '#8C5BE6';
  const AVA = ['#00A99D','#3B5BDB','#F5A623','#8C5BE6','#E8503A','#2BB673','#007A73','#748FFC'];
  const avaColor = name => AVA[(name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AVA.length];
  const initials = name => (name||'?').trim().slice(-2);
  const scoreColor = (t,max=100)=>{ const p=t/max*100; return p>=80?'#2BB673':p>=65?'#00A99D':p>=50?'#F5A623':'#E8503A'; };

  /* 아이콘 (Lucide 스타일 인라인 SVG) */
  const I = {
    dash:'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    doc:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    mic:'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
    trophy:'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z',
    upload:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
    check:'M20 6L9 17l-5-5',
    x:'M18 6L6 18 M6 6l12 12',
    chevR:'M9 18l6-6-6-6',
    chevL:'M15 18l-6-6 6-6',
    star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    phone:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
    mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
    cap:'M22 10L12 5 2 10l10 5 10-5z M6 12v5c0 1 2 3 6 3s6-2 6-3v-5',
    pin:'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    plus:'M12 5v14 M5 12h14',
    trash:'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    file:'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7',
    filter:'M22 3H2l8 9.46V19l4 2v-8.54z',
    arrow:'M5 12h14 M12 5l7 7-7 7',
    refresh:'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    bolt:'M13 2L3 14h9l-1 8 10-12h-9z',
    award:'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    columns:'M3 3h18v18H3z M9 3v18 M15 3v18',
    download:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    copy:'M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-1 M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    send:'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
    spark:'M12 2l1.9 5.8L20 9.7l-5 3.6 1.8 6.1L12 16l-4.8 3.4L9 13.3 4 9.7l6.1-1.9z',
    bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
    grip:'M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01',
  };
  const ico = (n, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(I[n]||'').split(' M').map((p,i)=>`<path d="${i?'M'+p:p}"/>`).join('')}</svg>`;

  /* 토스트 */
  function toast(msg, type='') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type==='ok'?'ok':type==='err'?'err':'');
    t.innerHTML = (type==='ok'?ico('check'):type==='err'?ico('x'):ico('bolt')) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 2600);
  }

  /* 모달 */
  function modal({ title, icon, iconBg, body, footer, onOpen }) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal">
      <div class="modal-head">
        ${icon?`<div style="width:36px;height:36px;border-radius:9px;display:grid;place-items:center;color:#fff;background:${iconBg||'var(--navy)'}">${ico(icon)}</div>`:''}
        <h3>${esc(title)}</h3>
        <button class="x" data-close>${ico('x')}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer?`<div class="modal-foot">${footer}</div>`:''}
    </div>`;
    root.classList.add('show');
    root.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
    root.onclick = e => { if(e.target===root) closeModal(); };
    if (onOpen) onOpen(root);
  }
  function closeModal(){ const r=$('#modalRoot'); r.classList.remove('show'); setTimeout(()=>r.innerHTML='',180); }

  /* 배지 */
  function stageBadge(key){ const s=S.stageInfo(key); return `<span class="badge ${s.badge}"><span class="d" style="background:currentColor"></span>${s.label}</span>`; }
  function trackBadge(t){ const c=trackColor(t); return `<span class="badge" style="background:${c}1a;color:${c}"><span class="d" style="background:${c}"></span>${esc(t)}</span>`; }

  /* ── Export (Excel / CSV) ─────────────────────────────── */
  function exportExcel(){
    const rows = S.exportRows();
    if (typeof XLSX === 'undefined'){ toast('엑셀 라이브러리를 불러오지 못했습니다(인터넷 필요)','err'); return; }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '신청자평가현황');
    // 트랙별 최종 순위 시트
    const tracks = [...new Set(S.applicants().map(a=>a.track))];
    const rank = [];
    tracks.forEach(tr=>{
      S.applicants().filter(a=>a.track===tr && ['interview','interview_done','final_pass','final_fail'].includes(S.stageOf(a.id)))
        .map(a=>({a, itv:S.evalOf(a.id).itv}))
        .sort((x,y)=>(y.itv?.total??-1)-(x.itv?.total??-1))
        .forEach((c,i)=> rank.push({ 트랙:tr, 순위:i+1, 이름:c.a.name, 인터뷰평균:c.itv?c.itv.total:'', 결과:S.stageInfo(S.stageOf(c.a.id)).label }));
    });
    if (rank.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rank), '트랙별최종순위');
    XLSX.writeFile(wb, `선발현황_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast('엑셀 파일을 내려받았습니다','ok');
  }
  function exportCSV(){
    const rows = S.exportRows(); if(!rows.length) return;
    const head = Object.keys(rows[0]);
    const csv = '﻿' + [head.join(','), ...rows.map(r=>head.map(h=>{
      const v = String(r[h]??''); return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(','))].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=`선발현황_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url); toast('CSV 파일을 내려받았습니다','ok');
  }

  /* ── 결과 통보문 생성 모달 ────────────────────────────── */
  function notifyTemplates(a){
    const prog = a.program || a.track;
    return {
      pass:`${a.name} 님, 안녕하세요.\n\n2026 청년일경험지원사업 [커넥팅더닷츠] ‘${prog}’ 선발에 최종 합격하셨음을 안내드립니다.\n진심으로 축하드립니다. 세부 일정(오리엔테이션·근무 시작일)은 추후 개별 안내 예정입니다.\n\n감사합니다.\n건국대학교 한국지속가능경영연구원 드림`,
      itv:`${a.name} 님, 안녕하세요.\n\n서류 심사 결과 ‘${prog}’ 인터뷰 심사 대상자로 선정되셨습니다.\n아래 일정으로 인터뷰를 진행하오니 참석 부탁드립니다.\n\n· 일시: (기재)\n· 장소/방식: (기재)\n· 준비물: 신분증\n\n문의: 운영사무국\n감사합니다.`,
      fail:`${a.name} 님, 안녕하세요.\n\n2026 청년일경험지원사업 [커넥팅더닷츠] ‘${prog}’에 관심을 갖고 지원해 주셔서 진심으로 감사드립니다.\n아쉽게도 이번 선발에서는 함께하지 못하게 되었음을 안내드립니다.\n지원자님의 앞날에 좋은 결과가 함께하길 응원합니다.\n\n건국대학교 한국지속가능경영연구원 드림`,
    };
  }
  function notifyModal(a){
    const tpl = notifyTemplates(a);
    const tabs = [['pass','합격 통보'],['itv','면접 안내'],['fail','불합격 통보']];
    modal({ title:`결과 통보문 — ${a.name}`, icon:'send', iconBg:'var(--teal-dark)',
      body:`<div class="tabs" id="ntabs">${tabs.map((t,i)=>`<div class="tab ${i===0?'active':''}" data-nt="${t[0]}">${t[1]}</div>`).join('')}</div>
        <textarea class="inp" id="ntext" style="width:100%;min-height:220px;margin-top:14px;line-height:1.7">${esc(tpl.pass)}</textarea>
        <div class="cell-sub" style="margin-top:8px">수신: ${esc(a.email||'이메일 없음')}</div>`,
      footer:`<button class="btn btn-ghost" id="ncopy">${ico('copy')}복사</button>
        ${a.email?`<button class="btn btn-ghost" id="nmail">${ico('mail')}메일 열기</button>`:''}
        <button class="btn btn-primary" data-close>닫기</button>`,
      onOpen:r=>{
        const ta=r.querySelector('#ntext');
        r.querySelectorAll('[data-nt]').forEach(t=>t.onclick=()=>{
          r.querySelectorAll('[data-nt]').forEach(x=>x.classList.remove('active')); t.classList.add('active');
          ta.value = tpl[t.dataset.nt]; });
        r.querySelector('#ncopy').onclick=()=>{ navigator.clipboard?.writeText(ta.value); toast('통보문을 복사했습니다','ok'); };
        const mb=r.querySelector('#nmail'); if(mb) mb.onclick=()=>{
          const sub=encodeURIComponent('[커넥팅더닷츠] 선발 결과 안내');
          window.open(`mailto:${a.email}?subject=${sub}&body=${encodeURIComponent(ta.value)}`); };
      } });
  }

  /* ───────────────── 사이드바 ───────────────── */
  const NAV = [
    { group:'현황', items:[
      { route:'dashboard',  label:'대시보드',     icon:'dash' },
      { route:'applicants', label:'신청자 현황',  icon:'users', countKey:'total' },
      { route:'pipeline',   label:'파이프라인 보드', icon:'columns' },
    ]},
    { group:'선발 프로세스', items:[
      { route:'document',  label:'서류심사',   icon:'doc',    countKey:'docTodo' },
      { route:'interview', label:'인터뷰 심사', icon:'mic',    countKey:'itvTodo' },
      { route:'final',     label:'최종 선발',   icon:'trophy', countKey:'finalPass' },
    ]},
    { group:'관리', items:[
      { route:'upload',    label:'데이터 업로드', icon:'upload' },
      { route:'settings',  label:'평가·시스템 설정', icon:'gear' },
    ]},
  ];

  function navCounts() {
    const apps = S.applicants();
    const docTodo = apps.filter(a=>['applied','doc_review'].includes(S.stageOf(a.id))).length;
    const itvTodo = apps.filter(a=>S.stageOf(a.id)==='interview').length;
    const st = S.stats();
    return { total: apps.length, docTodo, itvTodo, finalPass: st.finalPass };
  }

  function renderSidebar(active) {
    const c = navCounts();
    const groups = NAV.map(g => `
      <div class="sb-group-label">${g.group}</div>
      ${g.items.map(it => {
        const cnt = it.countKey ? c[it.countKey] : null;
        return `<a class="sb-item ${active===it.route?'active':''}" href="#/${it.route}">
          ${ico(it.icon,'ico')}<span>${it.label}</span>
          ${cnt!=null && cnt>0 ? `<span class="badge-count">${cnt}</span>`:''}
        </a>`;
      }).join('')}
    `).join('');
    $('#sidebar').innerHTML = `
      <div class="sb-brand">
        <span class="sb-badge">Selection System</span>
        <div class="sb-title">청년일경험 <span>선발관리</span></div>
        <div class="sb-sub">커넥팅더닷츠 · 2026</div>
      </div>
      <nav class="sb-nav">${groups}</nav>
      <div class="sb-reviewer" id="sbReviewer" title="현재 심사위원 — 클릭하여 변경">
        <div class="rv-ava">${esc(initials(S.getReviewer()))}</div>
        <div class="rv-info"><span class="rv-label">현재 심사위원</span><strong>${esc(S.getReviewer())}</strong></div>
        ${ico('refresh','rv-ic')}
      </div>
      <div class="sb-foot">
        <strong>건국대학교 한국지속가능경영연구원</strong>
        주관 · 산학협력단 운영
      </div>`;
    const rv = $('#sbReviewer'); if (rv) rv.onclick = openReviewerModal;
  }

  function openReviewerModal(){
    const presets = ['심사위원1','심사위원2','심사위원3','위원장'];
    modal({ title:'심사위원 전환', icon:'users', iconBg:'var(--navy)',
      body:`<p style="font-size:13.5px;line-height:1.7;color:var(--text-sub)">평가는 <strong>현재 심사위원</strong> 명의로 저장됩니다. 여러 심사위원이 같은 지원자를 평가하면 점수가 자동으로 평균·편차로 집계됩니다.</p>
        <div class="field" style="margin-top:14px"><label>심사위원명</label><input class="inp" id="rvName" value="${esc(S.getReviewer())}" placeholder="예: 홍길동 위원"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${presets.map(p=>`<button class="chip" data-preset="${esc(p)}">${esc(p)}</button>`).join('')}</div>`,
      footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-primary" id="rvSave">${ico('check')}전환</button>`,
      onOpen:r=>{
        r.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{ r.querySelector('#rvName').value=b.dataset.preset; });
        r.querySelector('#rvSave').onclick=()=>{ S.setReviewer(r.querySelector('#rvName').value);
          closeModal(); toast(`심사위원 전환: ${S.getReviewer()}`,'ok'); navigate(); };
      } });
  }

  /* ───────────────── 라우터 ───────────────── */
  const routes = {};
  function route(name, fn){ routes[name]=fn; }
  function parseHash(){
    const h = (location.hash||'#/dashboard').slice(2);
    const [path, ...rest] = h.split('/');
    return { name: path||'dashboard', param: rest.join('/') };
  }
  function navigate(){
    const { name, param } = parseHash();
    const fn = routes[name] || routes.dashboard;
    renderSidebar(name);
    window.scrollTo(0,0);
    fn(param);
  }
  window.addEventListener('hashchange', navigate);

  function setTop(title, crumb, actions=''){
    $('#topbar').innerHTML = `
      <div><h1>${esc(title)}</h1><div class="crumb">${crumb||''}</div></div>
      <div class="topbar-spacer"></div>
      ${actions}`;
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 대시보드
     ════════════════════════════════════════════════════════ */
  let charts = [];
  function destroyCharts(){ charts.forEach(c=>{try{c.destroy()}catch(e){}}); charts=[]; }

  route('dashboard', () => {
    destroyCharts();
    const st = S.stats();
    const m = S.meta();
    setTop('대시보드', `${esc(m.sourceTitle||'')} · 집계일 ${new Date().toLocaleDateString('ko-KR')}`,
      `<a class="btn btn-ghost" href="#/upload">${ico('upload')}데이터 업로드</a>
       <a class="btn btn-primary" href="#/applicants">${ico('users')}신청자 보기</a>`);

    const kpi = (label,icon,c,val,sub) => `
      <div class="kpi" style="--c:${c}">
        <div class="kpi-label"><span class="kpi-ico">${ico(icon)}</span>${label}</div>
        <div class="kpi-val">${val}</div>
        <div class="kpi-meta">${sub}</div>
      </div>`;

    const docRate = st.total? Math.round(st.reviewed/st.total*100):0;
    const passRate = st.reviewed? Math.round(st.docPassed/st.reviewed*100):0;

    const kpis = `<div class="kpi-grid">
      ${kpi('총 신청자','users','#3B5BDB', st.total+'<small>명</small>', `${Object.keys(st.trackMap).length}개 트랙`)}
      ${kpi('서류심사 완료','doc','#00A99D', st.reviewed+'<small>명</small>', `진행률 <span class="up">${docRate}%</span>`)}
      ${kpi('서류 합격','check','#2BB673', st.docPassed+'<small>명</small>', `합격률 ${passRate}%`)}
      ${kpi('인터뷰 대상','mic','#F5A623', (st.counts.interview+st.counts.interview_done)+'<small>명</small>', `완료 ${st.interviewed}명`)}
      ${kpi('최종 합격','trophy','#8C5BE6', st.finalPass+'<small>명</small>', `평균 서류 ${st.avgDoc.toFixed(1)}점`)}
    </div>`;

    // 퍼널
    const steps = [
      { label:'신청 접수', n:st.total, c:'#3B5BDB' },
      { label:'서류심사', n:st.reviewed, c:'#00A99D' },
      { label:'서류합격', n:st.docPassed, c:'#2BB673' },
      { label:'인터뷰', n:st.interviewed, c:'#F5A623' },
      { label:'최종합격', n:st.finalPass, c:'#8C5BE6' },
    ];
    const funnel = `<div class="card" style="padding:6px 10px;margin-bottom:16px"><div class="funnel">
      ${steps.map((s,i)=>{ const prev=i?steps[i-1].n:s.n; const rate=prev?Math.round(s.n/steps[0].n*100):0;
        const wprev = i? (prev? Math.round(s.n/prev*100):0):100;
        return `<div class="funnel-step">
          <div class="funnel-num" style="color:${s.c}">${s.n}</div>
          <div class="funnel-label">${s.label}</div>
          <div class="funnel-rate">${i?`전환 ${wprev}% · `:''}전체 ${rate}%</div>
          <div class="funnel-bar"><i style="width:${rate}%;background:${s.c}"></i></div>
        </div>`; }).join('')}
    </div></div>`;

    // 차트 영역
    const chartsHtml = `
      <div class="chart-grid">
        <div class="card chart-card">
          <div class="chart-head"><div><div class="section-title"><span class="dot"></span>단계별 신청자 분포</div>
            <div class="section-sub">선발 프로세스 전 단계 현황</div></div></div>
          <div class="chart-wrap"><canvas id="cStage"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="chart-head"><div><div class="section-title"><span class="dot"></span>트랙별 신청 비율</div>
            <div class="section-sub">3개 프로그램 트랙</div></div></div>
          <div class="chart-wrap sm"><canvas id="cTrack"></canvas></div>
        </div>
      </div>
      <div class="chart-grid">
        <div class="card chart-card">
          <div class="chart-head"><div><div class="section-title"><span class="dot"></span>서류 점수 분포</div>
            <div class="section-sub">평가 완료 ${st.reviewed}명 · 평균 ${st.avgDoc.toFixed(1)}점 / 합격선 ${S.config().docPassCut}점</div></div></div>
          <div class="chart-wrap sm"><canvas id="cScore"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="chart-head"><div><div class="section-title"><span class="dot"></span>학력 분포</div>
            <div class="section-sub">신청자 최종 학력 기준</div></div></div>
          <div class="chart-wrap sm"><canvas id="cEdu"></canvas></div>
        </div>
      </div>`;

    // 트랙별 진행 + 최근 활동
    const tp = S.trackProgress();
    const trackTable = `<div class="card chart-card" style="margin-top:16px">
      <div class="section-title"><span class="dot"></span>트랙별 진행 현황</div>
      <div class="table-wrap" style="margin-top:14px"><table class="dt">
        <thead><tr><th style="cursor:default">트랙</th><th style="cursor:default">신청</th><th style="cursor:default">서류심사</th>
          <th style="cursor:default">서류합격</th><th style="cursor:default">인터뷰</th><th style="cursor:default">최종합격</th>
          <th style="cursor:default">진행도</th></tr></thead>
        <tbody>${tp.map(t=>{ const prog=t.total?Math.round((t.reviewed)/t.total*100):0;
          return `<tr style="cursor:default">
            <td>${trackBadge(t.track)}</td>
            <td><strong>${t.total}</strong>명</td>
            <td>${t.reviewed}</td><td>${t.docPass}</td><td>${t.interview}</td>
            <td><span class="score-pill" style="color:#8C5BE6">${t.finalPass}</span></td>
            <td><div style="display:flex;align-items:center;gap:9px"><div class="progress-mini"><i style="width:${prog}%;background:${trackColor(t.track)}"></i></div><span class="cell-sub">${prog}%</span></div></td>
          </tr>`; }).join('')}</tbody>
      </table></div></div>`;

    const acts = S.recentActivity(8);
    const recent = `<div class="card chart-card" style="margin-top:16px">
      <div class="section-title"><span class="dot"></span>최근 평가 활동</div>
      ${acts.length? `<div style="margin-top:8px">${acts.map(a=>`
        <div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--gray-1)">
          <div class="avatar" style="width:34px;height:34px;font-size:12px;background:${avaColor(a.name)}">${esc(initials(a.name))}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:13.5px">${esc(a.name)} <span class="badge ${a.type==='서류'?'b-teal':'b-purple'}" style="margin-left:4px">${a.type} 평가</span></div>
            <div class="cell-sub">${trackBadge(a.track)} · ${esc(a.reviewer)} · ${ago(a.date)}</div>
          </div>
          <div class="score-pill" style="font-size:17px;color:${scoreColor(a.total)}">${a.total}<small style="font-size:11px;color:var(--text-mute)">점</small></div>
          <a class="btn btn-ghost btn-sm" href="#/applicant/${a.id}">${ico('chevR')}</a>
        </div>`).join('')}</div>`
      : `<div class="empty">${ico('list')}<div>아직 평가 활동이 없습니다.<br>서류심사부터 시작해 보세요.</div></div>`}
    </div>`;

    // 다음 할일 추천 (AI 업무 제안형)
    const actions = S.nextActions();
    const actionStrip = `<div class="card" style="padding:18px 22px;margin-bottom:18px">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px">
        <div class="section-title"><span class="dot" style="background:var(--amber)"></span>다음 할 일 추천</div>
        <span class="cell-sub">현 단계에서 먼저 처리하면 좋은 작업</span>
        <div style="flex:1"></div>
        ${ico('spark','')}
      </div>
      ${actions.length ? `<div class="action-grid">${actions.map(a=>`
        <a class="action-card" href="${a.route}" style="--ac:${a.color}">
          <div class="ac-ic">${ico(a.icon)}</div>
          <div class="ac-body"><div class="ac-title">${esc(a.title)}</div><div class="ac-desc">${esc(a.desc)}</div></div>
          <div class="ac-cnt">${a.count}</div>
        </a>`).join('')}</div>`
      : `<div class="note" style="margin:0">${ico('check')} 모든 단계의 대기 작업이 없습니다. 진행 상황이 최신 상태입니다.</div>`}
    </div>`;

    $('#view').innerHTML = kpis + actionStrip + funnel + chartsHtml + `<div class="split-2" style="align-items:start">${trackTable}${recent}</div>`;

    // 차트 그리기
    const ds = st.counts;
    drawBar('cStage',
      ['신청완료','서류심사중','서류합격','서류불합격','인터뷰대상','인터뷰완료','최종합격','최종불합격'],
      [ds.applied,ds.doc_review,ds.doc_pass,ds.doc_fail,ds.interview,ds.interview_done,ds.final_pass,ds.final_fail],
      ['#9BA8BC','#3B5BDB','#00A99D','#E8503A','#F5A623','#8C5BE6','#2BB673','#c23a26']);
    drawDoughnut('cTrack', Object.keys(st.trackMap), Object.values(st.trackMap),
      Object.keys(st.trackMap).map(trackColor));
    drawBar('cScore', ['~59','60-69','70-79','80-89','90+'], st.buckets,
      ['#E8503A','#F5A623','#00A99D','#4EC9C3','#2BB673']);
    drawDoughnut('cEdu', Object.keys(st.eduMap), Object.values(st.eduMap),
      ['#3B5BDB','#00A99D','#F5A623','#8C5BE6','#E8503A','#2BB673','#748FFC'], true);
  });

  function drawBar(id, labels, data, colors){
    const ctx = $('#'+id); if(!ctx) return;
    charts.push(new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ data, backgroundColor:colors, borderRadius:7, maxBarThickness:46 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} },
        scales:{ x:{ grid:{display:false}, ticks:{ font:{family:'Noto Sans KR',size:11}, color:'#5A6A82' } },
          y:{ beginAtZero:true, grid:{color:'#F0F3F8'}, ticks:{ precision:0, font:{size:11}, color:'#8A98AE' } } } } }));
  }
  function drawDoughnut(id, labels, data, colors, legendRight){
    const ctx = $('#'+id); if(!ctx) return;
    charts.push(new Chart(ctx, { type:'doughnut', data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:3, borderColor:'#fff' }]},
      options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
        plugins:{ legend:{ position: legendRight?'right':'bottom', labels:{ font:{family:'Noto Sans KR',size:11.5}, color:'#5A6A82', padding:12, usePointStyle:true, pointStyle:'circle', boxWidth:8 } } } } }));
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 칸반 파이프라인 보드
     ════════════════════════════════════════════════════════ */
  const PIPE_COLS = [
    { key:'applied',        label:'신청완료',   stages:['applied'],        color:'#9BA8BC' },
    { key:'doc_review',     label:'서류심사중', stages:['doc_review'],     color:'#3B5BDB' },
    { key:'doc_pass',       label:'서류합격',   stages:['doc_pass'],       color:'#00A99D' },
    { key:'interview',      label:'인터뷰대상', stages:['interview'],      color:'#F5A623' },
    { key:'interview_done', label:'인터뷰완료', stages:['interview_done'], color:'#8C5BE6' },
    { key:'final_pass',     label:'최종합격',   stages:['final_pass'],     color:'#2BB673' },
    { key:'rejected',       label:'탈락',       stages:['doc_fail','final_fail'], color:'#E8503A' },
  ];
  let pipeTrack = 'all';
  route('pipeline', () => {
    destroyCharts();
    setTop('파이프라인 보드', '전형 단계를 드래그하여 이동 · 칸반 방식 진행 관리',
      `<a class="btn btn-ghost" href="#/applicants">${ico('list')}목록 보기</a>`);
    renderPipeline();
  });

  function renderPipeline(){
    const tracks = [...new Set(S.applicants().map(a=>a.track))];
    const chips = `<div class="filters">
      <button class="chip ${pipeTrack==='all'?'active':''}" data-pt="all">전체 <span class="c">${S.applicants().length}</span></button>
      ${tracks.map(t=>`<button class="chip ${pipeTrack===t?'active':''}" data-pt="${esc(t)}">${esc(t)} <span class="c">${S.applicants().filter(a=>a.track===t).length}</span></button>`).join('')}
    </div>`;

    const pool = pipeTrack==='all' ? S.applicants() : S.applicants().filter(a=>a.track===pipeTrack);
    const cols = PIPE_COLS.map(col=>{
      const cards = pool.filter(a=>col.stages.includes(S.stageOf(a.id)));
      return `<div class="kanban-col" data-col="${col.key}">
        <div class="kanban-col-head" style="--cc:${col.color}">
          <span class="kc-dot"></span><strong>${col.label}</strong><span class="kc-count">${cards.length}</span>
        </div>
        <div class="kanban-drop" data-col="${col.key}">
          ${cards.map(cardHtml).join('') || `<div class="kanban-empty">없음</div>`}
        </div>
      </div>`;
    }).join('');

    $('#view').innerHTML = `<div class="toolbar">${chips}<div class="toolbar-spacer"></div>
      <span class="cell-sub">${ico('grip')} 카드를 끌어 다른 단계로 이동</span></div>
      <div class="kanban">${cols}</div>`;

    $$('#view .chip[data-pt]').forEach(c=>c.onclick=()=>{ pipeTrack=c.dataset.pt; renderPipeline(); });
    bindKanban();
  }

  function cardHtml(a){
    const e = S.evalOf(a.id);
    const doc = e.doc, itv = e.itv;
    const score = itv ? itv.total : (doc ? doc.total : null);
    const tc = trackColor(a.track);
    return `<div class="kanban-card" draggable="true" data-id="${a.id}">
      <div class="kc-top">
        <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${avaColor(a.name)}">${esc(initials(a.name))}</div>
        <div class="kc-name">${esc(a.name)}</div>
        ${score!=null?`<span class="kc-score" style="color:${scoreColor(score)}">${score}</span>`:''}
      </div>
      <div class="kc-track" style="color:${tc}"><span class="d" style="background:${tc}"></span>${esc(a.track)}</div>
      ${(doc&&doc.reviewerCount>1)||(itv&&itv.reviewerCount>1)?`<div class="kc-meta">${ico('users')} 심사 ${Math.max(doc?doc.reviewerCount:0,itv?itv.reviewerCount:0)}명</div>`:''}
    </div>`;
  }

  function bindKanban(){
    let dragId = null;
    $$('#view .kanban-card').forEach(card=>{
      card.addEventListener('dragstart', e=>{ dragId = card.dataset.id; card.classList.add('dragging');
        e.dataTransfer.effectAllowed='move'; });
      card.addEventListener('dragend', ()=>{ card.classList.remove('dragging'); $$('#view .kanban-drop').forEach(d=>d.classList.remove('drop-target')); });
      card.addEventListener('click', ()=>{ location.hash='#/applicant/'+card.dataset.id; });
    });
    $$('#view .kanban-drop').forEach(drop=>{
      drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.classList.add('drop-target'); });
      drop.addEventListener('dragleave', ()=> drop.classList.remove('drop-target'));
      drop.addEventListener('drop', e=>{ e.preventDefault(); drop.classList.remove('drop-target');
        if (!dragId) return;
        const colKey = drop.dataset.col;
        const col = PIPE_COLS.find(c=>c.key===colKey);
        // '탈락' 컬럼은 현재 단계에 맞춰 서류/최종 불합격으로 매핑
        let target = col.stages[0];
        if (colKey==='rejected'){
          const cur = S.stageOf(dragId);
          target = ['interview','interview_done','final_pass'].includes(cur) ? 'final_fail' : 'doc_fail';
        }
        if (S.stageOf(dragId)===target){ return; }
        S.setStage(dragId, target);
        toast(`${S.getApplicant(dragId).name} → ${S.stageInfo(target).label}`,'ok');
        renderPipeline(); renderSidebar('pipeline');
      });
    });
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 신청자 현황 (목록)
     ════════════════════════════════════════════════════════ */
  let listState = { q:'', track:'all', stage:'all', sort:'no', dir:1 };
  route('applicants', () => {
    destroyCharts();
    setTop('신청자 현황', '전체 신청자 명단 · 필터/정렬/검색',
      `<button class="btn btn-ghost" id="topCsv">${ico('download')}CSV</button>
       <button class="btn btn-ghost" id="topXlsx">${ico('download')}Excel</button>
       <a class="btn btn-ghost" href="#/document">${ico('doc')}서류심사로</a>`);
    $('#topXlsx').onclick = exportExcel; $('#topCsv').onclick = exportCSV;
    renderApplicantList();
  });

  function filteredApplicants(){
    let list = S.applicants().slice();
    const { q, track, stage } = listState;
    if (track!=='all') list = list.filter(a=>a.track===track);
    if (stage!=='all') list = list.filter(a=>S.stageOf(a.id)===stage);
    if (q.trim()){ const t=q.trim().toLowerCase();
      list = list.filter(a => [a.name,a.school,a.major,a.email,a.phone,a.authNo].some(v=>String(v).toLowerCase().includes(t))); }
    const { sort, dir } = listState;
    list.sort((a,b)=>{
      let va,vb;
      if (sort==='no'){ va=a.no; vb=b.no; }
      else if (sort==='name'){ va=a.name; vb=b.name; }
      else if (sort==='track'){ va=a.track; vb=b.track; }
      else if (sort==='stage'){ va=S.stageInfo(S.stageOf(a.id)).order; vb=S.stageInfo(S.stageOf(b.id)).order; }
      else if (sort==='doc'){ va=S.evalOf(a.id).doc?.total??-1; vb=S.evalOf(b.id).doc?.total??-1; }
      if (va<vb) return -1*dir; if (va>vb) return 1*dir; return 0;
    });
    return list;
  }

  function renderApplicantList(){
    const tracks = [...new Set(S.applicants().map(a=>a.track))];
    const trackCounts = {}; S.applicants().forEach(a=>trackCounts[a.track]=(trackCounts[a.track]||0)+1);
    const stagesAll = S.allStages();
    const stageCount = k => S.applicants().filter(a=>S.stageOf(a.id)===k).length;

    const trackChips = `<div class="filters">
      <button class="chip ${listState.track==='all'?'active':''}" data-track="all">전체 <span class="c">${S.applicants().length}</span></button>
      ${tracks.map(t=>`<button class="chip ${listState.track===t?'active':''}" data-track="${esc(t)}">${esc(t)} <span class="c">${trackCounts[t]}</span></button>`).join('')}
    </div>`;

    const list = filteredApplicants();
    const arrow = key => listState.sort===key ? (listState.dir>0?'▲':'▼') : '↕';
    const th = (key,label,style='') => `<th class="${listState.sort===key?'sorted':''}" data-sort="${key}" style="${style}">${label}<span class="sort-ind">${arrow(key)}</span></th>`;

    const stageOpts = ['all',...S.STAGE_ORDER].map(k=>{
      const lbl = k==='all'?'전체 단계':S.stageInfo(k).label;
      const cnt = k==='all'?'':` (${stageCount(k)})`;
      return `<option value="${k}" ${listState.stage===k?'selected':''}>${lbl}${cnt}</option>`;
    }).join('');

    $('#view').innerHTML = `
      <div class="toolbar">
        ${trackChips}
        <div class="toolbar-spacer"></div>
        <select class="inp" id="stageFilter">${stageOpts}</select>
        <div class="mini-search">${ico('search')}<input id="listSearch" placeholder="이름·학교·전공·연락처 검색" value="${esc(listState.q)}"></div>
      </div>
      <div class="card">
        <div class="table-wrap"><table class="dt">
          <thead><tr>
            ${th('no','연번','width:60px')}
            ${th('name','신청자')}
            ${th('track','트랙')}
            <th style="cursor:default">학력 · 학교</th>
            <th style="cursor:default">연락처</th>
            <th style="cursor:default">적격</th>
            ${th('doc','서류점수')}
            ${th('stage','단계')}
            <th style="cursor:default"></th>
          </tr></thead>
          <tbody>
            ${list.length? list.map(rowHtml).join('') : `<tr><td colspan="9"><div class="empty">${ico('search')}<div>조건에 맞는 신청자가 없습니다.</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div>
      <div class="kpi-meta" style="margin-top:12px;justify-content:flex-end">${list.length}명 표시 / 전체 ${S.applicants().length}명</div>`;

    // 이벤트
    $$('#view .chip[data-track]').forEach(c=>c.onclick=()=>{ listState.track=c.dataset.track; renderApplicantList(); });
    $('#stageFilter').onchange = e => { listState.stage=e.target.value; renderApplicantList(); };
    const si = $('#listSearch'); si.oninput = e => { listState.q=e.target.value; clearTimeout(si._t); si._t=setTimeout(renderApplicantList,180); };
    si.focus(); si.setSelectionRange(si.value.length,si.value.length);
    $$('#view th[data-sort]').forEach(h=>h.onclick=()=>{ const k=h.dataset.sort;
      if(listState.sort===k) listState.dir*=-1; else { listState.sort=k; listState.dir=1; } renderApplicantList(); });
    $$('#view tbody tr[data-id]').forEach(tr=>tr.onclick=()=>{ location.hash='#/applicant/'+tr.dataset.id; });
  }

  function flagDot(val, type){ // type: agree(Y good) / issue(N good)
    const good = type==='issue' ? val==='N' : val==='Y';
    return `<span class="badge ${good?'b-green':'b-gray'}" style="padding:2px 8px;font-size:10.5px">${good?'O':(val==='Y'?'Y':'N')}</span>`;
  }

  function rowHtml(a){
    const doc = S.evalOf(a.id).doc;
    const docCell = doc ? `<span class="score-pill" style="color:${scoreColor(doc.total)}">${doc.total}<small style="font-size:10px;color:var(--text-mute)"> /${S.maxTotal(S.config().docCriteria)}</small></span>` : `<span class="muted">–</span>`;
    return `<tr data-id="${a.id}">
      <td class="cell-sub">${a.no}</td>
      <td><div class="row-flex">
        <div class="avatar" style="width:32px;height:32px;font-size:12px;background:${avaColor(a.name)}">${esc(initials(a.name))}</div>
        <div><div class="cell-name">${esc(a.name)}</div><div class="cell-sub">${esc(a.edu)}</div></div>
      </div></td>
      <td>${trackBadge(a.track)}</td>
      <td><div style="font-size:13px">${esc(a.school||'-')}</div><div class="cell-sub">${esc(a.major||a.college||'-')}</div></td>
      <td><div class="cell-sub">${esc(a.phone)}</div></td>
      <td><div style="display:flex;gap:3px" title="개인정보동의 / 첨부 / 이상없음">${flagDot(a.privacyAgree)} ${flagDot(a.hasFile)} ${flagDot(a.dataIssue,'issue')}</div></td>
      <td>${docCell}</td>
      <td>${stageBadge(S.stageOf(a.id))}</td>
      <td>${ico('chevR','')}</td>
    </tr>`;
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 신청자 상세
     ════════════════════════════════════════════════════════ */
  route('applicant', (id) => {
    destroyCharts();
    const a = S.getApplicant(id);
    if (!a){ $('#view').innerHTML=`<div class="empty">${ico('user')}<div>신청자를 찾을 수 없습니다.</div></div>`; setTop('신청자 상세',''); return; }
    const list = filteredApplicants();
    const idx = list.findIndex(x=>x.id===id);
    const prev = idx>0?list[idx-1]:null, next = idx>=0&&idx<list.length-1?list[idx+1]:null;
    setTop(a.name+' 신청자', `${esc(a.program)}`,
      `${prev?`<a class="btn btn-ghost btn-sm" href="#/applicant/${prev.id}">${ico('chevL')}이전</a>`:''}
       ${next?`<a class="btn btn-ghost btn-sm" href="#/applicant/${next.id}">다음${ico('chevR')}</a>`:''}
       <a class="btn btn-ghost" href="#/applicants">${ico('list')}목록</a>`);
    renderDetail(a);
  });

  function renderDetail(a){
    const stg = S.stageOf(a.id);
    const ev = S.evalOf(a.id);
    const cfg = S.config();

    // 단계 스트립 (4단계 시각화)
    const stripNodes = [
      { keys:['applied'],                          label:'신청접수', step:'01', maxOrder:0 },
      { keys:['doc_review','doc_pass','doc_fail'], label:'서류심사', step:'02', maxOrder:2 },
      { keys:['interview','interview_done'],       label:'인터뷰',   step:'03', maxOrder:4 },
      { keys:['final_pass','final_fail'],          label:'최종선발', step:'04', maxOrder:5 },
    ];
    const curOrder = S.stageInfo(stg).order;
    const strip = `<div class="stage-strip">${stripNodes.map(n=>{
      const inThis = n.keys.includes(stg);
      const isFail = stg==='doc_fail'||stg==='final_fail';
      let cls = '';
      if (inThis) cls = 'current' + (isFail?' fail':'');
      else if (curOrder > n.maxOrder) cls = 'done';
      return `<div class="stage-node ${cls}"><span class="sn-step">${n.step}</span>${n.label}</div>`;
    }).join('')}</div>`;

    // 적격 플래그
    const flag = (label,val,good) => `<div class="flag"><span class="fi ${good?'y':'n'}">${good?ico('check'):ico('x')}</span>${label}</div>`;
    const flags = `<div class="flag-grid">
      ${flag('개인정보 동의', a.privacyAgree, a.privacyAgree==='Y')}
      ${flag('첨부파일', a.hasFile, a.hasFile==='Y')}
      ${flag('기재 이상없음', a.dataIssue, a.dataIssue==='N')}
      ${flag('인증상태', a.authStatus, a.authStatus==='완료'||a.authStatus==='인증')}
    </div>`;

    const profile = `<div class="card profile-card">
      <div class="profile-head">
        <div class="avatar lg" style="background:${avaColor(a.name)}">${esc(initials(a.name))}</div>
        <h2>${esc(a.name)}</h2>
        <div class="p-sub">${esc(a.birth)} · 연번 ${a.no}</div>
        <div class="p-track">${trackBadge(a.track)}</div>
        <div style="margin-top:10px">${stageBadge(stg)}</div>
      </div>
      <div class="profile-body">
        <div class="info-row"><span class="k">인증번호</span><span class="v">${esc(a.authNo||'-')}</span></div>
        <div class="info-row"><span class="k">신청일자</span><span class="v">${esc(a.applyDate||'-')}</span></div>
        <div class="info-row"><span class="k">학력</span><span class="v">${esc(a.edu||'-')}</span></div>
        <div class="info-row"><span class="k">학교</span><span class="v">${esc(a.school||'-')}</span></div>
        <div class="info-row"><span class="k">학과</span><span class="v">${esc(a.major||a.college||'-')}</span></div>
        <div class="info-row"><span class="k">${ico('phone')} 연락처</span><span class="v">${esc(a.phone||'-')}</span></div>
        <div class="info-row"><span class="k">${ico('mail')} 이메일</span><span class="v">${esc(a.email||'-')}</span></div>
        <div class="info-row"><span class="k">${ico('pin')} 주소</span><span class="v">${esc(a.address||'-')}</span></div>
        <div class="info-row"><span class="k">국취제 / 고용보험</span><span class="v">${esc(a.kepa||'-')} / ${esc(a.employIns||'-')}</span></div>
        ${flags}
      </div>
    </div>`;

    // 에세이
    const essay = (num,title,text) => `<div class="card essay-card">
      <h3><span class="num">${num}</span>${title}<span class="cnt">${(text||'').length.toLocaleString()}자</span></h3>
      <div class="essay-text" data-essay>${text?nl2br(text):'<span class="muted">작성 내용 없음</span>'}</div>
      ${ (text||'').length>320 ? `<div class="essay-more" data-more>전체 보기 ${ico('chevR')}</div>`:''}
    </div>`;

    const essays = essay(1,'지원동기',a.motivation) + essay(2,'향후 비전 및 포부 (수행계획)',a.vision) + essay(3,'관련 경력 · 경험',a.career);

    // AI / 규칙 기반 한눈에 보기 요약
    const summary = window.AI ? window.AI.summarizeApplicant(a) : null;
    const aiCard = summary ? `<div class="card ai-card">
      <div class="ai-head">${ico('spark')}<strong>한눈에 보기</strong>
        <span class="ai-tag">${window.AI.hasKey()?'AI 분석 가능':'규칙 기반'}</span>
        <div style="flex:1"></div>
        ${window.AI.hasKey()?`<button class="btn btn-ghost btn-sm" id="aiEnhance">${ico('spark')}AI 요약</button>`:''}
      </div>
      <div class="ai-body" id="aiBody">
        <div class="ai-stats">
          <span>경력·활동 <strong>${summary.careers}</strong>건</span>
          <span>지원서 <strong>${summary.wordcount.toLocaleString()}</strong>자</span>
        </div>
        ${summary.domains.length?`<div class="ai-kw">${summary.domains.map(k=>`<span class="kw">${esc(k)}</span>`).join('')}</div>`:''}
        ${summary.highlights.length?`<ul class="ai-hl">${summary.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:'<div class="cell-sub">자동 추출된 강점 문장이 없습니다.</div>'}
      </div>
    </div>` : '';

    // 평가 패널
    const docPanel = evalPanelHtml('doc','서류 심사', 'doc', '#00A99D', cfg.docCriteria, a, stg);
    const showItv = ['interview','interview_done','final_pass','final_fail'].includes(stg);
    const itvPanel = showItv ? evalPanelHtml('itv','인터뷰 심사','mic','#8C5BE6', cfg.itvCriteria, a, stg)
      : `<div class="card" style="padding:20px 24px"><div class="note">${ico('mic')} 인터뷰 심사는 <strong>인터뷰 대상자로 선정된 후</strong> 진행할 수 있습니다. 서류 합격 처리 후 ‘인터뷰 심사’ 메뉴에서 대상자로 승급하세요.</div></div>`;

    // 단계 제어
    const controls = stageControlsHtml(stg, a);

    $('#view').innerHTML = `
      <div style="margin-bottom:16px">${strip}</div>
      <div class="detail-grid">
        <div>${profile}${aiCard}</div>
        <div class="detail-main">
          ${controls}
          ${docPanel}
          ${itvPanel}
          ${essays}
        </div>
      </div>`;

    // 에세이 더보기
    $$('#view [data-more]').forEach(b=>{ const txt=b.previousElementSibling; txt.classList.add('clamped');
      b.onclick=()=>{ txt.classList.toggle('open'); b.innerHTML = txt.classList.contains('open')?`접기 ${ico('chevL')}`:`전체 보기 ${ico('chevR')}`; }; });
    $$('#view .essay-text').forEach(t=>{ if(t.scrollHeight>t.clientHeight+5) t.classList.add('clamped'); });

    bindEvalPanel('doc', a, cfg.docCriteria);
    if (showItv) bindEvalPanel('itv', a, cfg.itvCriteria);
    bindStageControls(a);

    // AI 요약 고도화 (키 있을 때)
    const enh = $('#aiEnhance');
    if (enh) enh.onclick = async () => {
      enh.disabled = true; enh.innerHTML = '분석 중…';
      try {
        const txt = await window.AI.enhanceSummary(a);
        if (txt) $('#aiBody').innerHTML = `<div class="ai-llm">${nl2br(txt)}</div>`;
      } catch(e){ toast('AI 요약 실패: '+e.message,'err'); enh.disabled=false; enh.innerHTML=`${ico('spark')}AI 요약`; }
    };

    // 인터뷰 추천 질문 로드
    const qbtn = $('#itvQbtn');
    if (qbtn) qbtn.onclick = async () => {
      const box = $('#itvQbox'); qbtn.disabled = true; qbtn.innerHTML='생성 중…';
      let qs;
      try { qs = await window.AI.generateQuestions(a, cfg.itvCriteria); }
      catch(e){ qs = window.AI.interviewQuestions(a, cfg.itvCriteria); }
      box.innerHTML = `<ol class="qlist">${qs.map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`;
      qbtn.disabled=false; qbtn.innerHTML=`${ico('refresh')}다시 생성`;
    };
  }

  function evalPanelHtml(key, title, icon, color, criteria, a, stg){
    const maxT = criteria.reduce((s,c)=>s+c.max,0);
    const agg = S.evalAggregate(a.id, key);
    const mine = S.myReview(a.id, key);
    const scores = mine ? mine.scores : {};
    const myTotal = mine ? mine.total : 0;
    const reviewer = S.getReviewer();

    // 다중 심사위원 요약
    let panelSummary = '';
    if (agg && agg.reviewerCount >= 1){
      const stdHigh = agg.reviewerCount>=2 && agg.std>=10;
      panelSummary = `<div class="reviewer-summary">
        <div class="rs-agg">
          <div class="rs-avg"><span class="rs-n" style="color:${scoreColor(agg.avgTotal,maxT)}">${agg.avgTotal}</span><span class="rs-l">평균 / ${maxT}</span></div>
          <div class="rs-div"></div>
          <div class="rs-meta">
            <div>심사위원 <strong>${agg.reviewerCount}명</strong></div>
            <div class="${stdHigh?'rs-warn':''}">편차 σ ${agg.std}${stdHigh?' · 재검토 권장':''}</div>
          </div>
        </div>
        <div class="rs-list">${agg.reviews.map(r=>`
          <div class="rs-item ${r.reviewer===reviewer?'me':''}">
            <span class="rs-ava" style="background:${avaColor(r.reviewer)}">${esc(initials(r.reviewer))}</span>
            <span class="rs-rv">${esc(r.reviewer)}${r.reviewer===reviewer?' (나)':''}</span>
            <span class="rs-sc" style="color:${scoreColor(r.total,maxT)}">${r.total}</span>
          </div>`).join('')}</div>
      </div>`;
    }

    const crits = criteria.map(c=>{
      const v = scores[c.id] ?? 0;
      const anchors = c.anchors || S.defaultAnchors(c.max);
      const chips = anchors.map(an=>`<button type="button" class="anchor" data-anchor="${c.id}" data-val="${an.target}" title="${esc(an.desc)}">${an.label}<small>${an.target}</small></button>`).join('');
      return `<div class="crit">
        <div class="crit-top">
          <div><div class="crit-name">${esc(c.name)}<span class="tag ${c.kind==='basic'?'tag-basic':'tag-add'}">${c.kind==='basic'?'기본':'추가'}</span></div>
            <div class="crit-desc">${esc(c.desc||'')}</div></div>
          <div class="crit-score"><span class="sval" data-sval="${c.id}" style="color:${scoreColor(v,c.max)}">${v}<small>/${c.max}</small></span></div>
        </div>
        <div class="range-row">
          <input type="range" class="slider" data-crit="${c.id}" min="0" max="${c.max}" step="1" value="${v}">
        </div>
        <div class="anchor-row">${chips}</div>
      </div>`;
    }).join('');

    // 인터뷰 패널엔 추천 질문 영역
    const qSection = key==='itv' ? `<div class="qpanel">
      <div class="qpanel-head"><strong>${ico('spark')} 추천 면접 질문</strong>
        <span class="ai-tag">${window.AI&&window.AI.hasKey()?'AI 생성 가능':'규칙 기반'}</span>
        <div style="flex:1"></div>
        <button class="btn btn-ghost btn-sm" id="itvQbtn">${ico('spark')}질문 생성</button></div>
      <div id="itvQbox" class="qbox"><div class="cell-sub">‘질문 생성’을 누르면 지원서·평가기준 기반 맞춤 질문이 표시됩니다.</div></div>
    </div>` : '';

    return `<div class="card eval-card" data-eval="${key}">
      <div class="eval-head">
        <div class="ico" style="background:${color}">${ico(icon)}</div>
        <div><h3>${title}</h3><div class="sub">기본 ${criteria.filter(c=>c.kind==='basic').length}항목 + 추가 ${criteria.filter(c=>c.kind==='add').length}항목 · 만점 ${maxT}점</div></div>
        <div class="total-badge"><div class="n" data-total style="color:${scoreColor(myTotal,maxT)}">${myTotal}</div><div class="l">내 점수 / ${maxT}</div></div>
      </div>
      ${panelSummary}
      <div class="eval-subhead">${ico('user')} <strong>${esc(reviewer)}</strong> 님의 평가 입력 <span class="cell-sub">— 다른 심사위원으로 바꾸려면 좌측 하단에서 전환</span></div>
      <div class="eval-body">${crits}</div>
      ${qSection}
      <div class="eval-foot">
        <textarea class="inp" data-comment placeholder="심사 의견 / 코멘트를 입력하세요 (선택)">${mine?esc(mine.comment):''}</textarea>
        <div class="actions">
          <button class="btn btn-primary" data-save>${ico('check')}내 평가 저장</button>
          ${mine?`<span class="meta" data-savemeta>최종 저장 ${ago(mine.date)}</span>`:'<span class="meta">미평가</span>'}
        </div>
      </div>
    </div>`;
  }

  function bindEvalPanel(key, a, criteria){
    const root = $(`#view .eval-card[data-eval="${key}"]`); if(!root) return;
    const maxT = criteria.reduce((s,c)=>s+c.max,0);
    const setVal = (id, v) => {
      const sl = root.querySelector(`[data-crit="${id}"]`); if(!sl) return; sl.value = v;
      const c = criteria.find(x=>x.id===id);
      const sv = root.querySelector(`[data-sval="${id}"]`); sv.innerHTML=`${v}<small>/${c.max}</small>`; sv.style.color=scoreColor(v,c.max);
    };
    const recalc = () => {
      let total=0;
      criteria.forEach(c=>{
        const sl = root.querySelector(`[data-crit="${c.id}"]`); const v=Number(sl.value); total+=v;
        const sv = root.querySelector(`[data-sval="${c.id}"]`); sv.innerHTML=`${v}<small>/${c.max}</small>`; sv.style.color=scoreColor(v,c.max);
      });
      const tEl = root.querySelector('[data-total]'); tEl.textContent=total; tEl.style.color=scoreColor(total,maxT);
    };
    root.querySelectorAll('[data-crit]').forEach(sl=>sl.oninput=recalc);
    root.querySelectorAll('[data-anchor]').forEach(b=>b.onclick=()=>{ setVal(b.dataset.anchor, Number(b.dataset.val)); recalc(); });
    root.querySelector('[data-save]').onclick = () => {
      const scores={}; criteria.forEach(c=>scores[c.id]=Number(root.querySelector(`[data-crit="${c.id}"]`).value));
      const comment=root.querySelector('[data-comment]').value;
      const total = key==='doc'? S.saveDocEval(a.id,scores,comment) : S.saveItvEval(a.id,scores,comment);
      toast(`${key==='doc'?'서류':'인터뷰'} 평가 저장 — 평균 ${total}점 (${S.getReviewer()})`,'ok');
      navigate(); // 단계/배지/집계 갱신 반영
    };
  }

  function stageControlsHtml(stg, a){
    let btns = '';
    if (stg==='applied' || stg==='doc_review'){
      const ev=S.evalOf(a.id);
      const cut=S.config().docPassCut;
      btns = `<button class="btn btn-primary" data-act="doc_pass">${ico('check')}서류 합격</button>
              <button class="btn btn-danger" data-act="doc_fail">서류 불합격</button>
              ${ev.doc?`<span class="meta muted" style="font-size:12px">서류 ${ev.doc.total}점 / 합격선 ${cut}점</span>`:'<span class="meta muted" style="font-size:12px">먼저 서류 평가를 저장하세요</span>'}`;
    } else if (stg==='doc_pass'){
      btns = `<button class="btn btn-navy" data-act="interview">${ico('mic')}인터뷰 대상 선정</button>
              <button class="btn btn-ghost" data-act="doc_review">서류 재심사</button>`;
    } else if (stg==='doc_fail'){
      btns = `<button class="btn btn-ghost" data-act="doc_review">서류 재심사로 되돌리기</button>`;
    } else if (stg==='interview'){
      const ev=S.evalOf(a.id);
      btns = `<button class="btn btn-primary" data-act="final_pass">${ico('trophy')}최종 합격</button>
              <button class="btn btn-danger" data-act="final_fail">최종 불합격</button>
              <button class="btn btn-ghost" data-act="doc_pass">인터뷰 취소</button>
              ${ev.itv?`<span class="meta muted" style="font-size:12px">인터뷰 ${ev.itv.total}점</span>`:''}`;
    } else if (stg==='interview_done'){
      const ev=S.evalOf(a.id);
      btns = `<button class="btn btn-primary" data-act="final_pass">${ico('trophy')}최종 합격</button>
              <button class="btn btn-danger" data-act="final_fail">최종 불합격</button>
              ${ev.itv?`<span class="meta muted" style="font-size:12px">인터뷰 ${ev.itv.total}점</span>`:''}`;
    } else if (stg==='final_pass'){
      btns = `<span class="badge b-green" style="font-size:13px;padding:7px 14px">${ico('trophy')} 최종 합격자</span>
              <button class="btn btn-ghost" data-act="interview_done">선발 취소</button>`;
    } else if (stg==='final_fail'){
      btns = `<button class="btn btn-ghost" data-act="interview_done">최종심사로 되돌리기</button>`;
    }
    return `<div class="card" style="padding:16px 22px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span class="section-title" style="font-size:13.5px"><span class="dot"></span>단계 처리</span>
      <div style="flex:1"></div>${btns}
      <button class="btn btn-ghost" data-notify>${ico('send')}결과 통보문</button></div>`;
  }

  function bindStageControls(a){
    $$('#view [data-act]').forEach(b=>b.onclick=()=>{ S.setStage(a.id, b.dataset.act);
      toast(`단계 변경: ${S.stageInfo(b.dataset.act).label}`,'ok'); navigate(); });
    const nb = $('#view [data-notify]'); if(nb) nb.onclick=()=>notifyModal(a);
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 서류심사 작업대
     ════════════════════════════════════════════════════════ */
  route('document', () => {
    destroyCharts();
    setTop('서류 심사', '신청서류 평가 · 합격선 적용 · 인터뷰 대상 선정',
      `<button class="btn btn-ghost" id="btnCut">${ico('bolt')}합격선 일괄 적용</button>`);
    renderProcess('doc');
    $('#btnCut').onclick = () => {
      const cut=S.config().docPassCut;
      modal({ title:'서류 합격선 일괄 적용', icon:'bolt', iconBg:'var(--amber)',
        body:`<p style="font-size:14px;line-height:1.7">평가가 완료된 신청자를 대상으로 <strong>합격선 ${cut}점</strong>을 기준으로 서류 합격/불합격을 일괄 처리합니다.<br><span class="muted">(이미 인터뷰·최종 단계로 넘어간 신청자는 제외됩니다)</span></p>
          <div class="note warn" style="margin-top:14px">합격선은 ‘설정’ 메뉴에서 변경할 수 있습니다.</div>`,
        footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-primary" id="doCut">${ico('check')}적용</button>`,
        onOpen:r=>{ r.querySelector('#doCut').onclick=()=>{ const res=S.applyDocCut(); closeModal();
          toast(`합격 ${res.pass}명 · 불합격 ${res.fail}명 처리`,'ok'); renderProcess('doc'); renderSidebar('document'); }; } });
    };
  });

  /* ════════════════════════════════════════════════════════
     VIEW: 인터뷰 심사
     ════════════════════════════════════════════════════════ */
  route('interview', () => {
    destroyCharts();
    setTop('인터뷰 심사', '서류 합격자 인터뷰 대상 선정 · 인터뷰 평가',
      `<button class="btn btn-ghost" id="btnPromote">${ico('arrow')}서류합격자 일괄 승급</button>`);
    renderProcess('itv');
    $('#btnPromote').onclick = () => {
      const docPass = S.applicants().filter(a=>S.stageOf(a.id)==='doc_pass');
      if(!docPass.length){ toast('인터뷰로 승급할 서류 합격자가 없습니다.','err'); return; }
      modal({ title:'인터뷰 대상 일괄 승급', icon:'arrow', iconBg:'var(--navy)',
        body:`<p style="font-size:14px;line-height:1.7"><strong>서류 합격자 ${docPass.length}명</strong>을 모두 인터뷰 대상자로 승급합니다.</p>
          <div style="margin-top:12px;max-height:240px;overflow:auto">${docPass.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--gray-1)"><div class="avatar" style="width:28px;height:28px;font-size:11px;background:${avaColor(a.name)}">${esc(initials(a.name))}</div><strong style="font-size:13px">${esc(a.name)}</strong> ${trackBadge(a.track)} <span class="score-pill" style="margin-left:auto;color:${scoreColor(S.evalOf(a.id).doc?.total||0)}">${S.evalOf(a.id).doc?.total||'-'}점</span></div>`).join('')}</div>`,
        footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-primary" id="doProm">${ico('check')}${docPass.length}명 승급</button>`,
        onOpen:r=>{ r.querySelector('#doProm').onclick=()=>{ const n=S.promoteToInterview(docPass.map(a=>a.id)); closeModal();
          toast(`${n}명 인터뷰 대상 승급 완료`,'ok'); renderProcess('itv'); renderSidebar('interview'); }; } });
    };
  });

  // 공통 프로세스 목록 (서류 / 인터뷰)
  let procTrack = 'all';
  function renderProcess(mode){
    const isDoc = mode==='doc';
    const cfg = S.config();
    const criteria = isDoc?cfg.docCriteria:cfg.itvCriteria;
    const maxT = criteria.reduce((s,c)=>s+c.max,0);
    // 대상 단계
    const pool = S.applicants().filter(a=>{
      const st=S.stageOf(a.id);
      return isDoc ? ['applied','doc_review','doc_pass','doc_fail'].includes(st)
                   : ['interview','interview_done','final_pass','final_fail'].includes(st);
    });
    const tracks=[...new Set(S.applicants().map(a=>a.track))];
    let list = procTrack==='all'?pool:pool.filter(a=>a.track===procTrack);

    // 진행 요약 미니 KPI
    const todo = pool.filter(a=>{ const st=S.stageOf(a.id); return isDoc?['applied','doc_review'].includes(st):st==='interview'; }).length;
    const done = pool.filter(a=>S.evalOf(a.id)[isDoc?'doc':'itv']).length;
    const scored = pool.map(a=>S.evalOf(a.id)[isDoc?'doc':'itv']).filter(Boolean);
    const avg = scored.length? (scored.reduce((s,e)=>s+e.total,0)/scored.length):0;

    const stat = (l,v,c)=>`<div class="kpi" style="--c:${c}"><div class="kpi-label">${l}</div><div class="kpi-val" style="font-size:28px">${v}</div></div>`;
    const stats = `<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      ${stat('대상 인원', pool.length+'명','#3B5BDB')}
      ${stat(isDoc?'평가 대기':'인터뷰 대기', todo+'명','#F5A623')}
      ${stat('평가 완료', done+'명','#00A99D')}
      ${stat('평균 점수', avg.toFixed(1)+'점','#8C5BE6')}
    </div>`;

    const chips = `<div class="filters">
      <button class="chip ${procTrack==='all'?'active':''}" data-ptrack="all">전체 <span class="c">${pool.length}</span></button>
      ${tracks.map(t=>{ const c=pool.filter(a=>a.track===t).length; return c?`<button class="chip ${procTrack===t?'active':''}" data-ptrack="${esc(t)}">${esc(t)} <span class="c">${c}</span></button>`:''; }).join('')}
    </div>`;

    // 정렬: 점수 높은 순 (평가된 것 우선)
    list.sort((a,b)=>{ const ea=S.evalOf(a.id)[isDoc?'doc':'itv'], eb=S.evalOf(b.id)[isDoc?'doc':'itv'];
      return (eb?.total??-1)-(ea?.total??-1) || a.no-b.no; });

    const rows = list.map(a=>{
      const ev = S.evalOf(a.id)[isDoc?'doc':'itv'];
      const st = S.stageOf(a.id);
      const scoreCell = ev? `<span class="score-pill" style="color:${scoreColor(ev.total,maxT)}">${ev.total}<small style="font-size:10px;color:var(--text-mute)"> /${maxT}</small></span>` : '<span class="muted">미평가</span>';
      return `<tr data-id="${a.id}">
        <td><div class="row-flex"><div class="avatar" style="width:32px;height:32px;font-size:12px;background:${avaColor(a.name)}">${esc(initials(a.name))}</div>
          <div><div class="cell-name">${esc(a.name)}</div><div class="cell-sub">${esc(a.school||'')} ${esc(a.major||'')}</div></div></div></td>
        <td>${trackBadge(a.track)}</td>
        <td>${scoreCell}</td>
        <td>${ev?`<div class="progress-mini"><i style="width:${ev.total/maxT*100}%;background:${scoreColor(ev.total,maxT)}"></i></div>`:''}</td>
        <td>${stageBadge(st)}</td>
        <td>${ev?`<span class="cell-sub">${esc(ev.reviewer)} · ${ago(ev.date)}</span>`:''}</td>
        <td><a class="btn btn-primary btn-sm" href="#/applicant/${a.id}">${ev?'평가 보기':'평가하기'}${ico('chevR')}</a></td>
      </tr>`;
    }).join('');

    $('#view').innerHTML = stats + `
      <div class="toolbar">${chips}</div>
      <div class="card"><div class="table-wrap"><table class="dt">
        <thead><tr><th style="cursor:default">신청자</th><th style="cursor:default">트랙</th><th style="cursor:default">${isDoc?'서류':'인터뷰'} 점수</th>
          <th style="cursor:default">분포</th><th style="cursor:default">단계</th><th style="cursor:default">심사정보</th><th style="cursor:default"></th></tr></thead>
        <tbody>${list.length?rows:`<tr><td colspan="7"><div class="empty">${ico('doc')}<div>${isDoc?'서류심사 대상 신청자가 없습니다.':'인터뷰 대상자가 없습니다. 서류 합격자를 인터뷰 대상으로 승급하세요.'}</div></div></td></tr>`}</tbody>
      </table></div></div>`;

    $$('#view .chip[data-ptrack]').forEach(c=>c.onclick=()=>{ procTrack=c.dataset.ptrack; renderProcess(mode); });
    $$('#view tbody tr[data-id]').forEach(tr=>tr.onclick=e=>{ if(e.target.closest('a'))return; location.hash='#/applicant/'+tr.dataset.id; });
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 최종 선발
     ════════════════════════════════════════════════════════ */
  route('final', () => {
    destroyCharts();
    setTop('최종 선발', '트랙별 인터뷰 점수 순위 · 선발 인원(쿼터) 적용',
      `<button class="btn btn-ghost" id="btnFinalXlsx">${ico('download')}결과 Excel</button>
       <button class="btn btn-primary" id="btnFinal">${ico('trophy')}최종 선발 확정</button>`);
    $('#btnFinalXlsx').onclick = exportExcel;
    renderFinal();
    $('#btnFinal').onclick = () => {
      modal({ title:'최종 선발 확정', icon:'trophy', iconBg:'var(--purple)',
        body:`<p style="font-size:14px;line-height:1.7">인터뷰가 완료된 신청자를 대상으로 <strong>트랙별 선발 인원(쿼터)</strong>과 <strong>합격 기준 ${S.config().itvPassCut}점</strong>에 따라 인터뷰 점수 상위자를 자동 선발합니다.</p>
          <div class="note warn" style="margin-top:14px">쿼터·합격선은 ‘설정’ 메뉴에서 조정할 수 있으며, 확정 후에도 개별 신청자 화면에서 수동 조정이 가능합니다.</div>`,
        footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-primary" id="doFinal">${ico('check')}확정</button>`,
        onOpen:r=>{ r.querySelector('#doFinal').onclick=()=>{ const res=S.applyFinalSelection(); closeModal();
          toast(`최종 합격 ${res.pass}명 확정`,'ok'); renderFinal(); renderSidebar('final'); }; } });
    };
  });

  function renderFinal(){
    const cfg = S.config();
    const maxT = cfg.itvCriteria.reduce((s,c)=>s+c.max,0);
    const tracks=[...new Set(S.applicants().map(a=>a.track))];
    const st = S.stats();

    const stat=(l,v,c)=>`<div class="kpi" style="--c:${c}"><div class="kpi-label">${l}</div><div class="kpi-val" style="font-size:28px">${v}</div></div>`;
    const totalQuota = Object.values(cfg.finalQuota).reduce((a,b)=>a+(b||0),0);
    const stats=`<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
      ${stat('인터뷰 완료', st.interviewed+'명','#3B5BDB')}
      ${stat('총 선발 정원', totalQuota+'명','#F5A623')}
      ${stat('최종 합격', st.finalPass+'명','#2BB673')}
      ${stat('합격 기준', cfg.itvPassCut+'점','#8C5BE6')}
    </div>`;

    const blocks = tracks.map(tr=>{
      const cands = S.applicants().filter(a=>a.track===tr && ['interview','interview_done','final_pass','final_fail'].includes(S.stageOf(a.id)))
        .map(a=>({a, ev:S.evalOf(a.id).itv}))
        .sort((x,y)=>(y.ev?.total??-1)-(x.ev?.total??-1));
      const quota = cfg.finalQuota[tr] ?? '-';
      const passed = cands.filter(c=>S.stageOf(c.a.id)==='final_pass').length;
      const rows = cands.map((c,i)=>{
        const stg=S.stageOf(c.a.id);
        const rank = i+1;
        const rcls = stg==='final_pass'?(rank<=3?`rank-${rank}`:'rank-x'):'rank-x';
        return `<tr data-id="${c.a.id}">
          <td><span class="rank-badge ${rcls}">${rank}</span></td>
          <td><div class="row-flex"><div class="avatar" style="width:30px;height:30px;font-size:11px;background:${avaColor(c.a.name)}">${esc(initials(c.a.name))}</div><div class="cell-name">${esc(c.a.name)}</div></div></td>
          <td>${c.ev?`<span class="score-pill" style="color:${scoreColor(c.ev.total,maxT)}">${c.ev.total}<small style="color:var(--text-mute);font-size:10px"> /${maxT}</small></span>`:'<span class="muted">미평가</span>'}</td>
          <td>${stageBadge(stg)}</td>
          <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-notify="${c.a.id}">${ico('send')}</button>
            <a class="btn btn-ghost btn-sm" href="#/applicant/${c.a.id}">상세${ico('chevR')}</a></td>
        </tr>`;
      }).join('');
      return `<div class="card chart-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div class="section-title">${trackBadge(tr)}</div>
          <div style="flex:1"></div>
          <span class="badge b-green">합격 ${passed} / 정원 ${quota}</span>
        </div>
        <div class="table-wrap" style="margin-top:8px"><table class="dt">
          <thead><tr><th style="cursor:default;width:50px">순위</th><th style="cursor:default">신청자</th><th style="cursor:default">인터뷰 점수</th><th style="cursor:default">결과</th><th style="cursor:default"></th></tr></thead>
          <tbody>${cands.length?rows:`<tr><td colspan="5"><div class="empty" style="padding:30px">${ico('mic')}<div>인터뷰 대상자가 없습니다.</div></div></td></tr>`}</tbody>
        </table></div>
      </div>`;
    }).join('');

    $('#view').innerHTML = stats + `<div class="grid" style="gap:18px">${blocks}</div>`;
    $$('#view [data-notify]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); const a=S.getApplicant(b.dataset.notify); if(a) notifyModal(a); });
    $$('#view tbody tr[data-id]').forEach(tr=>tr.onclick=e=>{ if(e.target.closest('a')||e.target.closest('button'))return; location.hash='#/applicant/'+tr.dataset.id; });
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 데이터 업로드
     ════════════════════════════════════════════════════════ */
  const COLMAP = { // 헤더(한글) → 내부키
    '통합연번':'no','트랙구분':'track','운영기관명':'org','프로그램명':'program','참여자인증번호':'authNo',
    '인증상태':'authStatus','이름':'name','신청일자':'applyDate','생년월일':'birth','주소':'address',
    '휴대전화번호':'phone','이메일':'email','학력':'edu','학교':'school','학부':'college','학과':'major',
    '연간참여횟수':'annualCount','국민취업지원제도참여여부':'kepa','고용보험가입여부':'employIns',
    '개인정보활용동의여부':'privacyAgree','확인내용이상여부':'dataIssue','첨부파일유무':'hasFile',
    '지원동기':'motivation','향후 비전 및 포부(수행계획)':'vision','관련 경력(경험)':'career',
  };

  route('upload', () => {
    destroyCharts();
    const m = S.meta();
    setTop('데이터 업로드', '모집 엑셀(.xlsx) 또는 CSV 업로드 → 신청자 명단 갱신');
    $('#view').innerHTML = `
      <div class="split-2" style="align-items:start">
        <div>
          <div class="dropzone" id="dz">
            <div class="dz-ico">${ico('upload')}</div>
            <h3>엑셀 / CSV 파일을 끌어다 놓으세요</h3>
            <p>또는 클릭하여 파일 선택 · .xlsx, .xls, .csv 지원</p>
            <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" hidden>
          </div>
          <div class="note" style="margin-top:16px">
            <strong>인식 가능한 컬럼</strong> — 통합연번, 트랙구분, 이름, 학력, 학교, 학과, 연락처, 이메일, 지원동기, 향후 비전 및 포부, 관련 경력 등 ‘통합신청자명단’ 형식.
            첫 행에 제목/부제가 있는 경우 자동으로 헤더 행을 탐지합니다.
          </div>
        </div>
        <div class="card chart-card">
          <div class="section-title"><span class="dot"></span>현재 데이터</div>
          <div style="margin-top:14px">
            <div class="info-row"><span class="k">데이터 출처</span><span class="v">${esc(m.uploadedName||'-')}</span></div>
            <div class="info-row"><span class="k">갱신 일시</span><span class="v">${m.uploadedAt?fmtDate(m.uploadedAt):'-'}</span></div>
            <div class="info-row"><span class="k">신청자 수</span><span class="v">${S.applicants().length}명</span></div>
            <div class="info-row"><span class="k">트랙 수</span><span class="v">${new Set(S.applicants().map(a=>a.track)).size}개</span></div>
          </div>
          <div class="note warn" style="margin-top:16px">새 파일을 업로드하면 <strong>기존 신청자 명단과 평가 데이터가 모두 교체</strong>됩니다. 진행 중인 심사 데이터가 있다면 주의하세요.</div>
          <button class="btn btn-ghost btn-danger" id="btnReset" style="margin-top:14px">${ico('refresh')}시드 데이터로 초기화</button>
        </div>
      </div>
      <div id="previewArea" style="margin-top:20px"></div>`;

    const dz=$('#dz'), fi=$('#fileInput');
    dz.onclick=()=>fi.click();
    dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag');};
    dz.ondragleave=()=>dz.classList.remove('drag');
    dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);};
    fi.onchange=e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); };
    $('#btnReset').onclick=()=>{ modal({title:'시드 데이터로 초기화',icon:'refresh',iconBg:'var(--red)',
      body:`<p style="font-size:14px;line-height:1.7">모든 평가·단계 데이터를 삭제하고 기본 시드(통합신청자명단 48명)로 되돌립니다.</p>`,
      footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-danger" id="doReset">초기화</button>`,
      onOpen:r=>{r.querySelector('#doReset').onclick=()=>{S.resetAll();closeModal();toast('시드 데이터로 초기화 완료','ok');navigate();};}}); };
  });

  function detectHeaderRow(rows){
    // '이름' 또는 '통합연번' 이 포함된 행을 헤더로 탐지
    for (let i=0;i<Math.min(rows.length,8);i++){
      const r=rows[i].map(c=>String(c||'').trim());
      if (r.includes('이름') && (r.includes('트랙구분')||r.includes('통합연번')||r.includes('지원동기'))) return i;
    }
    return 0;
  }

  function handleFile(file){
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'array'});
        // 통합신청자명단 우선, 없으면 첫 시트
        let sn = wb.SheetNames.find(n=>n.includes('통합')||n.includes('명단')) || wb.SheetNames[0];
        const ws=wb.Sheets[sn];
        const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        if(!rows.length){ toast('데이터를 읽을 수 없습니다.','err'); return; }
        const hr=detectHeaderRow(rows);
        const headers=rows[hr].map(c=>String(c||'').trim());
        const dataRows=rows.slice(hr+1).filter(r=>r.some(c=>String(c||'').trim()!==''));
        const parsed=dataRows.map((r,i)=>{
          const o={};
          headers.forEach((h,ci)=>{ const key=COLMAP[h]; if(key){ let v=r[ci];
            if(typeof v==='string') v=v.replace(/_x000D_\n|_x000D_/g,'\n').trim(); o[key]=v; } });
          if(!o.no) o.no=i+1;
          return o;
        }).filter(o=>o.name);
        if(!parsed.length){ toast('신청자 데이터를 인식하지 못했습니다. 컬럼명을 확인하세요.','err'); return; }
        showPreview(parsed, file.name, sn, headers);
      }catch(err){ console.error(err); toast('파일 분석 실패: '+err.message,'err'); }
    };
    reader.readAsArrayBuffer(file);
  }

  function showPreview(parsed, fileName, sheetName, headers){
    const sample=parsed.slice(0,6);
    const recognized = headers.filter(h=>COLMAP[h]);
    $('#previewArea').innerHTML=`
      <div class="card chart-card">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="section-title"><span class="dot"></span>업로드 미리보기</div>
          <span class="badge b-teal">${parsed.length}명 인식</span>
          <span class="badge b-gray">시트: ${esc(sheetName)}</span>
          <div style="flex:1"></div>
          <button class="btn btn-primary" id="btnConfirm">${ico('check')}이 데이터로 교체</button>
        </div>
        <div class="cell-sub" style="margin-top:8px">인식된 컬럼 ${recognized.length}개: ${recognized.map(esc).join(', ')}</div>
        <div class="table-wrap" style="margin-top:14px"><table class="dt">
          <thead><tr><th style="cursor:default">연번</th><th style="cursor:default">이름</th><th style="cursor:default">트랙</th><th style="cursor:default">학교</th><th style="cursor:default">학과</th><th style="cursor:default">연락처</th><th style="cursor:default">지원동기(요약)</th></tr></thead>
          <tbody>${sample.map(o=>`<tr style="cursor:default"><td class="cell-sub">${esc(o.no)}</td><td class="cell-name">${esc(o.name)}</td><td>${o.track?trackBadge(o.track):'-'}</td><td>${esc(o.school||'-')}</td><td>${esc(o.major||o.college||'-')}</td><td class="cell-sub">${esc(o.phone||'-')}</td><td class="cell-sub">${esc(String(o.motivation||'').slice(0,40))}${String(o.motivation||'').length>40?'…':''}</td></tr>`).join('')}</tbody>
        </table></div>
        ${parsed.length>6?`<div class="cell-sub" style="margin-top:10px;text-align:center">외 ${parsed.length-6}명 …</div>`:''}
      </div>`;
    $('#btnConfirm').onclick=()=>{
      S.replaceApplicants(parsed,{uploadedName:fileName, sourceTitle:'업로드: '+fileName});
      toast(`${parsed.length}명 신청자 데이터로 교체 완료`,'ok');
      setTimeout(()=>location.hash='#/dashboard',600);
    };
  }

  /* ════════════════════════════════════════════════════════
     VIEW: 설정
     ════════════════════════════════════════════════════════ */
  route('settings', () => {
    destroyCharts();
    setTop('평가 · 시스템 설정', '평가 항목(기본/추가) · 합격 기준 · 트랙별 선발 인원');
    renderSettings();
  });

  function renderSettings(){
    const cfg=S.config();
    const critTable = (group, criteria, color) => {
      const maxT=criteria.reduce((s,c)=>s+c.max,0);
      return `<div class="card chart-card">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="section-title"><span class="dot" style="background:${color}"></span>${group==='doc'?'서류 심사':'인터뷰 심사'} 평가 항목</div>
          <span class="badge b-gray">만점 ${maxT}점</span>
          <div style="flex:1"></div>
          <button class="btn btn-ghost btn-sm" data-addcrit="${group}">${ico('plus')}추가 항목</button>
        </div>
        ${maxT!==100?`<div class="note warn" style="margin-top:12px">현재 배점 합계가 ${maxT}점입니다. 100점 만점 기준 점수와 다를 수 있으니 확인하세요.</div>`:''}
        <div style="margin-top:14px">
          ${criteria.map(c=>`<div class="crit" data-cid="${c.id}" style="border-bottom:1px solid var(--gray-1)">
            <div class="crit-top">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px">
                  <input class="inp" data-f="name" value="${esc(c.name)}" style="font-weight:700;border:none;background:transparent;padding:4px 0;font-size:14px;width:auto;min-width:160px">
                  <span class="tag ${c.kind==='basic'?'tag-basic':'tag-add'}">${c.kind==='basic'?'기본':'추가'}</span>
                </div>
                <input class="inp" data-f="desc" value="${esc(c.desc||'')}" placeholder="평가 설명" style="border:none;background:transparent;padding:2px 0;font-size:11.5px;color:var(--text-mute);width:100%;margin-top:2px">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="cell-sub">배점</span>
                <input class="inp" data-f="max" type="number" min="1" max="100" value="${c.max}" style="width:72px;text-align:center;font-weight:700">
                ${c.kind==='add'?`<button class="btn btn-danger btn-sm" data-delcrit="${c.id}">${ico('trash')}</button>`:'<span style="width:34px"></span>'}
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>`;
    };

    const tracks=[...new Set(S.applicants().map(a=>a.track))];
    const quotaInputs = tracks.map(t=>`<div class="field" style="margin-bottom:10px">
      <label>${esc(t)}</label>
      <input class="inp" data-quota="${esc(t)}" type="number" min="0" value="${cfg.finalQuota[t]??0}">
    </div>`).join('');

    $('#view').innerHTML=`
      <div class="split-2" style="align-items:start;margin-bottom:18px">
        <div class="card chart-card">
          <div class="section-title"><span class="dot"></span>합격 기준 점수</div>
          <div style="margin-top:16px" class="split-2">
            <div class="field"><label>서류 합격선 (점)</label><input class="inp" id="docCut" type="number" min="0" max="200" value="${cfg.docPassCut}"></div>
            <div class="field"><label>최종(인터뷰) 합격선 (점)</label><input class="inp" id="itvCut" type="number" min="0" max="200" value="${cfg.itvPassCut}"></div>
          </div>
          <div class="note">합격선은 ‘합격선 일괄 적용’ 및 ‘최종 선발 확정’ 시 기준으로 사용됩니다.</div>
        </div>
        <div class="card chart-card">
          <div class="section-title"><span class="dot"></span>트랙별 최종 선발 인원 (쿼터)</div>
          <div style="margin-top:16px">${quotaInputs||'<div class="muted">트랙 정보 없음</div>'}</div>
        </div>
      </div>
      <div class="grid" style="gap:18px">
        ${critTable('doc',cfg.docCriteria,'#00A99D')}
        ${critTable('itv',cfg.itvCriteria,'#8C5BE6')}
      </div>
      <div class="card chart-card" style="margin-top:18px">
        <div class="section-title"><span class="dot" style="background:var(--purple)"></span>AI 고도화 (선택)</div>
        <div class="cell-sub" style="margin-top:6px">키를 비워두면 모든 AI 기능은 <strong>규칙·템플릿 기반</strong>으로 동작합니다. 키를 입력하면 자소서 요약·면접질문이 Claude로 고도화됩니다.</div>
        <div class="split-2" style="margin-top:14px">
          <div class="field"><label>Anthropic API 키 (선택)</label><input class="inp" id="aiKey" type="password" placeholder="sk-ant-..." value="${window.AI&&window.AI.getKey()?'••••••••••••':''}"></div>
          <div class="field"><label>모델</label>
            <select class="inp" id="aiModel">
              ${['claude-sonnet-4-6','claude-opus-4-8','claude-haiku-4-5-20251001'].map(m=>`<option value="${m}" ${window.AI&&window.AI.getModel()===m?'selected':''}>${m}</option>`).join('')}
            </select></div>
        </div>
        <div class="note warn" style="margin-top:4px">⚠ 이 앱은 백엔드가 없는 관리자 내부 도구입니다. API 키는 브라우저(localStorage)에 저장되며 브라우저에서 직접 호출되므로, <strong>신뢰된 기기에서만</strong> 사용하세요. 운영 배포 시에는 서버 프록시 사용을 권장합니다.</div>
        <div style="margin-top:10px"><button class="btn btn-ghost" id="aiClear">${ico('trash')}키 삭제</button></div>
      </div>
      <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-primary" id="saveSettings">${ico('check')}설정 저장</button>
      </div>`;

    // 추가 항목
    $$('#view [data-addcrit]').forEach(b=>b.onclick=()=>{ const g=b.dataset.addcrit;
      modal({ title:'추가 평가 항목', icon:'plus', iconBg:'var(--purple)',
        body:`<div class="field"><label>항목명</label><input class="inp" id="ncName" placeholder="예: 포트폴리오 완성도"></div>
              <div class="field"><label>설명</label><input class="inp" id="ncDesc" placeholder="평가 기준 설명"></div>
              <div class="field"><label>배점</label><input class="inp" id="ncMax" type="number" min="1" max="100" value="10"></div>`,
        footer:`<button class="btn btn-ghost" data-close>취소</button><button class="btn btn-primary" id="ncAdd">추가</button>`,
        onOpen:r=>{ r.querySelector('#ncAdd').onclick=()=>{ const name=r.querySelector('#ncName').value.trim();
          if(!name){ toast('항목명을 입력하세요','err'); return; }
          S.addCriterion(g,{name,desc:r.querySelector('#ncDesc').value.trim(),max:Number(r.querySelector('#ncMax').value)||10});
          closeModal(); toast('평가 항목 추가됨','ok'); renderSettings(); }; } });
    });
    // 삭제
    $$('#view [data-delcrit]').forEach(b=>b.onclick=()=>{ const cid=b.dataset.delcrit;
      const g = b.closest('[data-addcrit],.card').querySelector('[data-addcrit]').dataset.addcrit;
      S.removeCriterion(g,cid); toast('항목 삭제됨','ok'); renderSettings(); });

    // 저장
    $('#saveSettings').onclick=()=>{
      // 항목 인라인 수정 반영
      $$('#view .crit[data-cid]').forEach(row=>{
        const cid=row.dataset.cid;
        const g = row.closest('.card').querySelector('[data-addcrit]').dataset.addcrit;
        S.updateCriterion(g,cid,{ name:row.querySelector('[data-f="name"]').value.trim()||'(무제)',
          desc:row.querySelector('[data-f="desc"]').value.trim(), max:Number(row.querySelector('[data-f="max"]').value)||1 });
      });
      const quota={}; $$('#view [data-quota]').forEach(i=>quota[i.dataset.quota]=Number(i.value)||0);
      S.updateConfig({ docPassCut:Number($('#docCut').value)||0, itvPassCut:Number($('#itvCut').value)||0, finalQuota:quota });
      // AI 설정
      if (window.AI){
        const k=$('#aiKey').value.trim();
        if (k && !/^•+$/.test(k)) window.AI.setKey(k);   // 마스킹된 값이 아니면 갱신
        window.AI.setModel($('#aiModel').value);
      }
      toast('설정이 저장되었습니다','ok'); renderSettings(); renderSidebar('settings');
    };
    const clr=$('#aiClear'); if(clr) clr.onclick=()=>{ if(window.AI) window.AI.setKey(''); toast('API 키를 삭제했습니다','ok'); renderSettings(); };
  }

  /* ───────────────── 시작 ───────────────── */
  S.load();
  if (!location.hash) location.hash = '#/dashboard';
  navigate();
})();
