// ==UserScript==
// @name         SLB macro (태생 리세 + 반자동 육성)
// @namespace    slbcareerlab-slb-macro
// @version      1.0
// @description  이번 생은 야구다: 뽑지 않을 포지션을 뺀 나머지에서 패널에서 고른 조건(잠재력·수비 적성·내구도·빠름)의 태생이 나올 때까지 리세 → 발견하면 멈추고 특별훈련만 대신(육성은 직접) → 새로운 인생을 누르면 2페이지 투구폼만 고르면 다시 리세.
// @match        https://slbcareer.com/*
// @match        https://*.slbcareer.com/*
// @match        http://slbcareer.com/*
// @match        http://*.slbcareer.com/*
// @inject-into  page
// @sandbox      raw
// @run-at       document-idle
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/slbcareerlab/SLB-macro/main/slb-macro.user.js
// @downloadURL  https://raw.githubusercontent.com/slbcareerlab/SLB-macro/main/slb-macro.user.js
// ==/UserScript==
// 아이폰 Safari(Userscripts)·갤럭시 Firefox(Tampermonkey/Violentmonkey) 공용.
// 게임 상태(React)를 읽으려면 페이지 안에서 실행돼야 해서, 확장 프로그램이 분리된 공간에서 실행하면 페이지에 스스로 넣어 다시 실행함
function __SLB_MAIN__() {


(function () {
  'use strict';
  if (window.__SLBHM__) return; // 두 번 실행 방지 (북마클릿을 두 번 눌러도 안전 · 리세 전용과 같이 깔려 있어도 하나만 실행)
  window.__SLBHM__ = true;
  const RESET_ONLY = false; // 리세 전용 판: 고3 통과 선수가 나오면 멈추고 끔 (설정·기록은 본 매크로와 따로 저장)

  // ═════════════════════════════════════════════
  // 1. 설정
  // ═════════════════════════════════════════════
  const STORE = RESET_ONLY ? 'slbResetOnly.v1' : 'slbHalfMacro.v2';
  const LOGKEY = RESET_ONLY ? 'slbResetOnly.log.v1' : 'slbHalfMacro.log.v2';
  const DEFAULTS = {
    on: false,
    // 진행
    postseason: 'skipAll',      // skipAll | skipRound | ask
    stopForTraining: true,      // 스토브리그에 특별훈련 버튼이 있으면 멈춤
    stopForPosting: false,      // MLB 포스팅 요청 버튼이 있으면 멈춤 (루트·FA 규칙으로 리그 이동하므로 기본은 그냥 진행)
    stopForMilitary: false,     // 상무/현역 입대 선택지가 있으면 멈춤
    nationalTeam: 'join',       // join | ask
    nonFaExtension: 'reject',   // reject | accept | ask
    injury: 'auto',             // auto(회복 끝까지·일반 재활) | ask
    keepRoleAndPosition: true,  // 투수 보직 변경 제안은 유지 (목표 보직 제안이면 수락) — 야수 포지션 전환 제안은 이 설정과 상관없이 항상 거절
    // 선수 목표
    // 여러 개 고르면 '구단 추천 우선 → TR 점수 최대'로 자동 선택, 하나만 고르면 그것만, 비우면 멈춤
    targetSides: ['PITCHER', 'HITTER'], // 목표 쪽 (둘 다면 리세 통과 쪽·OVR 높은 쪽)
    pitcherRoles: [],                   // 선발 | 불펜 | 마무리
    hitterPositions: [],                // 포수 1루수 2루수 3루수 유격수 좌익수 중견수 우익수 지명타자 (비우면 추천)
    pitchForms: [],                     // 오버핸드 스리쿼터 사이드암 언더핸드 (비우면 추천)
    commitTwoWay: true,         // 코치의 전념 제안이 목표 쪽이면 수락
    // 이벤트 (스토브리그 선택 카드)
    eventPolicy: 'weak',        // weak(약점 보완) | strong(강점) | random | ask
    eventPriority: '',          // 특정 능력치를 항상 우선 (비우면 사용 안 함)
    // 이적 (FA·리그 선택·구단 오퍼)
    transfer: 'routeAll',       // manual | route(루트대로, 오퍼는 멈춤) | routeAll(오퍼까지 자동)
    route: 'KBO>NPB|CPBL',      // 이번 생의 리그 순서. '|' 는 '둘 중 제안 있는 곳(앞쪽 우선)'
    routeSeasons: 10,           // 각 리그에서 같은 구단 1군 시즌 목표 (영결 기준 10시즌, 11.19 완화)
    // 특별훈련
    autoNextAttempt: true,      // '다음 시도/다음 스윙' 버튼 자동
    trainingAutoPlay: true,     // 미니게임 자동 플레이 (10점 목표)
    trainingPick: 'weak',       // manual(종목 직접) | weak(목표 쪽 가장 낮은 능력치) | tr(목표 포지션 TR 비중 큰 순) | fixed(아래 순서)
    trainingOrder: '',          // fixed 일 때 순서. 예: '제구,구위,구속'
    trainingMinScore: 10,       // 이 점수 미만이면 결과 화면에서 멈춤
    // 리세 보조
    resetOn: false,             // 켜면: 투타겸업 새 인생 → 후보·생성 자동 → 고3 OVR 컷 판정
    resetAutoContinue: true,    // 컷 통과하면 멈추지 않고 그대로 커리어 진행
    // 진로·방출·은퇴 권고
    pathAuto: true,             // 고교 졸업 진로를 루트 첫 리그대로 (KBO→드래프트, MLB→MLB 진출)
    releaseContinue: true,      // 전력 외 통보 → 2차 드래프트/입단 테스트 도전
    retireAdvice: 'continue',   // continue(항상 다른 팀 제안·계약으로 계속, 제안이 없을 때만 은퇴) | smart(MLB 12시즌 전이면 계속) | accept | ask
    // 목표 선수 모드 (🎯)
    goalOn: true, wizardDone: false, earlyAbort: true, maxRetry: 2, rebirthSignball: false, // 사인볼 회귀는 기본 직접 (설정에서 자동 가능)
    finalRetryAll: true,        // 목표 미달이면 횟수 제한 없이 계속 다시 회귀 (3생 계획은 마지막 생, 한 생 목표는 그 생 · 가망 없으면 새 인생)
    stallRetries: 3,            // 성공 예상 계산: 앞으로 회귀 이 횟수 안에 목표에 닿을 확률
    maxRebirths: 12,            // 한 선수 회귀 상한 (넘으면 가장 좋은 커리어로 저장)
    resetTarget: 0,             // 리세 목표 잠재력: 0=자동(PA 목표 94, 그 외 92) | 92 | 94 | 96  (96은 컷 56.5로 올리고 1명 약 57분)
    rebirthAsk: true,           // 회귀 직전에 알림 → ▶ 진행(허락)을 눌러야 회귀
    rebirthMinP: 15,            // 회귀 판단: 앞으로 회귀해서 목표에 닿을 예상 확률이 이 %보다 낮으면 묻지 않고 버림
    polishRebirths: 1,          // 라인업 초기 채우기: 목표를 채운 선수도 이 횟수만큼 더 회귀해 TR 높은 커리어만 남김 (0=끔)
    lineupOn: true,             // 팀 모드(27인 로스터)가 기본
    lineupWeakest: true,        // 팀 모드: 생마다 팀 점검 → 가장 약한 주전 자리(빈 자리 먼저) 도전
    keepByTR: true,             // 회귀 후 '남길 커리어'를 TR(목표 포지션 기준)로 비교해 고름 (목표 달성·영결/명전 진척이 먼저)
    trSaveMin: 98,              // 회귀를 다 써도 미달일 때, 남은 선수 TR이 이 값 이상이면 버리지 않고 저장 (0=끔, 98 = 올S+ 최저 TR과 같음)
    twoWayZero: true,           // 투타겸업 회귀 고교 특훈 2회: 목표 쪽은 만점, 다른 쪽은 0점 → 투타 OVR 차이 5점(전념 제안) 빨리
    // 시뮬레이션 결과(게임 코드 재현): 투수 56.0+ / 타자 57.1+ 일 때 '잠재력 92+ 선수 1명' 기대 시간이 가장 짧음
    resetCutP: '55.5-',         // 투수 OVR 통과 구간 (쉼표로 여러 개, '56-' 은 56 이상, '54.2-54.5' 같은 범위도 가능)
    resetCutH: '56.0-',         // 타자 OVR 통과 구간
    candidatePick: 'first',     // first | balanced | ask  (후보·집중은 최종 OVR에 거의 영향 없음 → 빠른 1번)
    focusPick: 'tr2',           // tr2(목표 포지션 TR 비중 큰 2개) | weak2(낮은 능력치 2개)  ※게임이 1개 이상 요구
    // 알림
    alertMode: 'screen',        // screen(화면만) | vibrate | sound | both
    panelTop: false,
  };
  let cfg = Object.assign({}, DEFAULTS);
  // 설정은 localStorage + 쿠키(.slbcareer.com 전체, 1년) 두 곳에 저장 → 새로고침·다른 탭·www 주소에서도 같은 설정
  const CK = RESET_ONLY ? 'slbro_cfg' : 'slbhm_cfg';
  const readCookieCfg = () => {
    try {
      const parts = {}; document.cookie.split('; ').forEach((kv) => { const i = kv.indexOf('='); const k = kv.slice(0, i); const m = new RegExp('^' + CK + '(\\d+)$').exec(k); if (m) parts[+m[1]] = kv.slice(i + 1); });
      const n = Object.keys(parts).length; if (!n) return null;
      let str = ''; for (let i = 0; i < n; i++) { if (parts[i] == null) return null; str += parts[i]; }
      return JSON.parse(decodeURIComponent(str));
    } catch (e) { return null; }
  };
  const writeCookieCfg = (obj) => {
    try {
      // 쿠키는 요청마다 서버로 가므로 기본값과 같은 항목·빈 칸은 빼고 짧게
      const slim = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'lineup' && Array.isArray(v)) { slim.lineup = v.map((x) => Object.fromEntries(Object.entries(x).filter(([kk, vv]) => kk === 'slot' || (vv !== '' && vv !== false && vv != null)))); continue; }
        if (JSON.stringify(v) !== JSON.stringify(DEFAULTS[k])) slim[k] = v;
      }
      const str = encodeURIComponent(JSON.stringify(slim)); const host = location.hostname.replace(/^www\./, '');
      const dom = /slbcareer\.com$/.test(host) ? '; domain=.slbcareer.com' : '';
      const N = 3600, chunks = Math.ceil(str.length / N);
      for (let i = 0; i < chunks; i++) document.cookie = CK + i + '=' + str.slice(i * N, (i + 1) * N) + '; path=/; max-age=31536000; SameSite=Lax' + dom;
      for (let i = chunks; i < chunks + 6; i++) document.cookie = CK + i + '=; path=/; max-age=0' + dom; // 예전 조각 지우기
    } catch (e) { /* 쿠키 불가 */ }
  };
  {
    let ls = null; try { ls = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { ls = null; }
    const ck = readCookieCfg();
    const pick = ls && ck ? ((ck.savedAt || 0) > (ls.savedAt || 0) ? ck : ls) : ls || ck;
    if (pick) Object.assign(cfg, pick);
  }
  for (const k of Object.keys(DEFAULTS)) if (Array.isArray(DEFAULTS[k]) && !Array.isArray(cfg[k])) cfg[k] = DEFAULTS[k].slice();
  const save = () => { cfg.savedAt = Date.now(); try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) { /* 저장 불가 */ } writeCookieCfg(cfg); };
  // 다른 탭에서 설정을 바꾸면 이 탭에도 바로 반영
  window.addEventListener('storage', (e) => {
    if (e.key !== STORE || !e.newValue) return;
    try { const v = JSON.parse(e.newValue); if ((v.savedAt || 0) > (cfg.savedAt || 0)) { Object.assign(cfg, v); if (typeof paint === 'function') paint(); } } catch (er) { /* 무시 */ }
  });
  if ((cfg.cfgVer || 0) < 6 && (cfg.cfgVer || 0) >= 5) { // v0.7: 중간 폐기 반영한 컷
    if (cfg.resetCutP === '56.0-') cfg.resetCutP = '55.5-';
    if (cfg.resetCutH === '57.1-') cfg.resetCutH = '56.0-';
    if (cfg.maxRetry === 1) cfg.maxRetry = 2;
    cfg.cfgVer = 6; save();
  }
  if ((cfg.cfgVer || 0) < 5) { // v0.5: 바뀐 기본값을 예전 설정에도 한 번 적용
    Object.assign(cfg, { stopForPosting: false, transfer: 'routeAll', trainingPick: cfg.trainingPick || 'weak', trainingAutoPlay: true, resetCutP: '55.5-', resetCutH: '56.0-', cfgVer: 6 });
    save();
  }

  if (cfg.retireFix !== 1) { cfg.retireAdvice = 'continue'; cfg.retireFix = 1; save(); } // 은퇴 권고 자동 수락 끔 (OVR 높아도 PA는 기록 기준이라 더 뛰는 게 나음) — 한 번만
  if ((cfg.cfgVer || 0) < 7) { Object.assign(cfg, { goalOn: true, lineupOn: true, lineupWeakest: true, cfgVer: 7 }); save(); } // v0.8: 목표 모드 항상 켬, 기본은 팀 모드(27인)
  cfg.goalOn = true;
  if (RESET_ONLY) { cfg.lineupOn = cfg.lineupWeakest = false; cfg.resetAutoContinue = false; } // 리세 전용: 개인 목표만, 통과하면 멈춤

  let LOG = [];
  try { LOG = JSON.parse(localStorage.getItem(LOGKEY) || '[]'); } catch (e) { LOG = []; }
  const saveLog = () => { try { localStorage.setItem(LOGKEY, JSON.stringify(LOG.slice(-3000))); } catch (e) { /* 용량 초과 */ } };

  // ═════════════════════════════════════════════
  // 2. 절대 누르지 않는 버튼 (규칙이 명시적으로 허락한 경우만 예외)
  // ═════════════════════════════════════════════
  const NEVER = /광고|사인볼|구매|충전|결제|회귀|슬롯|삭제|탈퇴|로그아웃|후원|은퇴|트레이드 요청|재협상|포스팅|입대|상무|훈련 시작|특별 ?훈련 하기/;
  const HARD_NEVER = /광고|사인볼|구매|충전|결제|회귀|슬롯|삭제|탈퇴|로그아웃|후원|은퇴 확정|현역 은퇴/; // 어떤 규칙도 못 누름

  // ═════════════════════════════════════════════
  // 3. DOM 도우미
  // ═════════════════════════════════════════════
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // anyOpacity: 등장 애니메이션 중(투명도 0)인 팝업도 '떠 있는 것'으로 본다
  const visible = (el, anyOpacity) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && (anyOpacity || s.opacity !== '0');
  };
  const txt = (el) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  const isPanel = (el) => !!(el && el.closest && el.closest('#slbhm-panel'));
  const num = (s) => { const m = String(s).match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };

  function topScope() {
    const dlg = $$('[role=dialog],[aria-modal=true],dialog[open],.cv2-modal,.browser-exit-modal,.career-milestone-backdrop')
      .filter((d) => visible(d, true) && !isPanel(d));
    return dlg.length ? dlg[dlg.length - 1] : (document.querySelector('#root') || document.body);
  }
  function buttons(scope) {
    return $$('button,[role=button]', scope)
      .filter((b) => visible(b, true) && !b.disabled && !isPanel(b))
      .map((b) => ({ el: b, t: txt(b), cls: String(b.className || '') }));
  }
  const NAV = /^(홈으로 이동|사운드 (켜기|끄기)|BGM.*|시즌|커리어|선수|리그 결과|선수카드|리그 기록실|홈|클럽하우스|플레이볼|랭킹|상점|환경설정)$/;
  const STAT = /상세 보기$|상세 기록|^[▶▼]/;
  const meaningful = (list) => list.filter((b) => b.t && !NAV.test(b.t) && !STAT.test(b.t));
  const find = (list, re) => list.find((b) => re.test(b.t));
  const hasCls = (ctx, c) => ctx.list.find((b) => b.cls.includes(c));
  const has = (ctx, sel) => !!ctx.scope.querySelector(sel);

  // 머리글(이름·나이·OVR) 읽기
  function header() {
    const t = (document.querySelector('#root') || document.body).innerText.split('\n').map((s) => s.trim()).filter(Boolean);
    const h = { name: '', age: NaN, ovr: NaN, pOvr: NaN, hOvr: NaN };
    const ai = t.findIndex((s) => /^\d{2}세$/.test(s));
    if (ai >= 0) { h.age = num(t[ai]); h.name = t[ai - 2] || ''; }
    for (let i = 0; i < Math.min(t.length, 30); i++) {
      if (t[i] === 'OVR') h.ovr = num(t[i + 1]);
      if (t[i] === '투수 OVR') h.pOvr = num(t[i + 1]);
      if (t[i] === '타자 OVR') h.hOvr = num(t[i + 1]);
    }
    // 게임 화면 머리(cv2 HUD)에서 직접 읽기: 이름 / '유격수 · 19세' / 투수·타자 OVR 또는 OVR 하나
    const idb = document.querySelector('.cv2-hud-identity');
    if (idb) { const nm = idb.querySelector('strong'); if (nm && nm.textContent.trim()) h.name = nm.textContent.trim(); const am = /(\d{2})세/.exec(idb.innerText); if (am) h.age = +am[1]; }
    if (isNaN(h.age)) { const line = t.slice(0, 30).find((x) => /\d{2}세$/.test(x)); if (line) h.age = +/(\d{2})세$/.exec(line)[1]; }
    const tw = document.querySelector('.two-way-hud-ovr');
    if (tw) $$('span', tw).forEach((sp) => { const l = ((sp.querySelector('small') || {}).textContent || '').trim(), v = num((sp.querySelector('strong') || {}).textContent || ''); if (l === '투수 OVR' && !isNaN(v)) h.pOvr = v; if (l === '타자 OVR' && !isNaN(v)) h.hOvr = v; });
    const so = document.querySelector('.cv2-hud-ovr b'); if (so && !isNaN(num(so.textContent))) h.ovr = num(so.textContent);
    return h;
  }

  // ═════════════════════════════════════════════
  // 4. 상태 (선수별 메모리: 목표 쪽, 마지막 팀, 능력치)
  // ═════════════════════════════════════════════
  const SKEY = RESET_ONLY ? 'slbResetOnly.state.v1' : 'slbHalfMacro.state.v2';
  let S = {};
  try { S = JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) { S = {}; }
  const saveS = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { /* 무시 */ } };
  // S = { side:'PITCHER'|'HITTER', team:'', league:'', abilities:{}, resetCount:0, resetPhase:'' }

  // ═════════════════════════════════════════════
  // 5. 시즌 기록
  // ═════════════════════════════════════════════
  function recordSeason(c) {
    const lines = c.scope.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
    const ti = lines.findIndex((s) => /시즌 결과$/.test(s));
    if (ti < 0) return;
    const yearM = lines[ti].match(/(\d{4})/);
    const year = yearM ? yearM[1] : lines[ti];
    const level = lines[ti - 1] || '';
    const h = header();
    if (!S.lifeId) { S.lifeId = Date.now().toString(36); saveS(); }
    const key = S.lifeId + '|' + h.name + '|' + year + '|' + level;
    if (LOG.some((r) => r.key === key)) return;
    // 주요 기록: '상세 기록' 전까지 라벨-값 쌍
    const stats = {};
    const endStats = lines.findIndex((s, i) => i > ti && /상세 기록/.test(s));
    for (let i = ti + 1; i < (endStats > 0 ? endStats : lines.length) - 1; i++) {
      const a = lines[i], b = lines[i + 1] === 'CH' || lines[i + 1] === '🏆' ? lines[i + 2] : lines[i + 1];
      if (/^(승|이닝|탈삼진|평균자책점|ERA|WHIP|K\/9|WAR|홈런|안타|타점|타율|출루율|장타율|OPS|세이브|홀드)$/.test(a) && b && /[\d.-]/.test(b)) stats[a] = b;
    }
    const gm = lines.slice(ti, ti + 8).join(' ').match(/(\d+)경기/);
    // 수상: '상세 기록' 과 'OVR 변화' 사이
    const ovrI = lines.findIndex((s, i) => i > ti && /OVR 변화$/.test(s));
    const awards = endStats > 0 && ovrI > endStats ? lines.slice(endStats + 1, ovrI).filter((s) => !/^(전국대회 결과|\d+|월|🏆|우승|\d+강)$/.test(s)) : [];
    // OVR 변화와 능력치
    let ovrFrom = '', ovrTo = '';
    const abil = {};
    if (ovrI > 0) {
      ovrFrom = lines[ovrI + 1]; ovrTo = lines[ovrI + 3];
      for (let i = ovrI + 4; i < Math.min(lines.length, ovrI + 60); i++) {
        if (/^(구속|구위|제구|체력|위기관리|컨택|파워|선구안|주력|수비)$/.test(lines[i]) && /^[\d.]+$/.test(lines[i + 1] || '')) abil[lines[i]] = parseFloat(lines[i + 1]);
      }
    }
    if (Object.keys(abil).length) { S.abilities = Object.assign(S.abilities || {}, abil); saveS(); }
    const lg = /MAJOR|MLB/.test(level) ? 'MLB' : /NPB|일본/.test(level) ? 'NPB' : /CPBL|대만/.test(level) ? 'CPBL' : /KBO/.test(level) ? 'KBO' : '';
    if (lg && S.league !== lg) {
      const st = routeSteps(), i = Math.min(S.stepIdx || 0, st.length - 1);
      if (st[i + 1] && st[i + 1].lg.includes(lg) && !(st[i] && st[i].lg.includes(lg))) S.stepIdx = i + 1; // 루트 다음 단계로
      S.league = lg; saveS();
    }
    const rec = {
      key, 생애: S.lifeId, 선수: h.name, 연도: year, 나이: isNaN(h.age) ? '' : h.age, 리그: level, 팀: S.team || '',
      경기: gm ? gm[1] : '', 기록: Object.entries(stats).map(([k, v]) => k + ' ' + v).join(' / '),
      수상: awards.join(', '), OVR: ovrFrom && ovrTo ? ovrFrom + '→' + ovrTo : '',
      능력치: Object.entries(abil).map(([k, v]) => k + v).join(' '),
      시각: new Date().toISOString(),
    };
    LOG.push(rec); saveLog(); renderLog();
    return true;
  }
  // 스토브리그 화면에서 팀·리그 기억
  function rememberHub(c) {
    const lines = c.scope.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
    const i = lines.findIndex((s) => /년 스토브리그/.test(s));
    if (i >= 0 && lines[i + 1]) {
      const team = lines[i + 1];
      if (S.team !== team) {
        if (!S.team) LOG.forEach((r) => { if (r.생애 === S.lifeId && !r.팀) r.팀 = team; }); // 첫 시즌은 허브 전에 끝나 팀이 비어 있음
        S.team = team; saveS(); saveLog();
      }
    }
  }
  // 같은 팀·리그 1군 시즌 수 (기록 기준)
  function seasonsWithTeam() {
    const h = header();
    return LOG.filter((r) => r.선수 === h.name && (!r.생애 || r.생애 === S.lifeId) && r.팀 === S.team && /1군|MLB|MAJOR|NPB|CPBL/.test(r.리그) && !/2군|마이너|MINOR|트리플|더블|싱글|고교|HIGH|대학|COLLEGE/.test(r.리그) && Number(r.경기) > 0).length;
  }

  // ═════════════════════════════════════════════
  // 6. 화면 규칙 (위에서부터 처음 맞는 것 하나만 실행)
  //    결과: 버튼 → 누름 / 'STOP:이유' → 멈추고 알림 / 'WAIT:이유' → 기다림 / null → 대기
  // ═════════════════════════════════════════════
  const R = [];
  const rule = (name, test, act, opt = {}) => R.push({ name, test, act, trusted: !!opt.trusted });
  // 넘겨받은 선수(HO): 회귀 특전 고르기·회귀 시작은 사용자가 직접 → 그동안은 아무것도 누르지 않음 (특별훈련 안내부터 자동)
  rule('태생 리세: 회귀는 직접', () => HO() && !!document.querySelector('.rebirth-backdrop, .rebirth-picker-backdrop, .rebirth-team-picker-leagues, .rebirth-ad-unavailable'), () => 'WAIT:회귀 특전·회귀 시작은 직접 눌러 주세요 — 특별훈련부터 자동으로 이어갑니다');
  const ROLE_RE = /^(선발|불펜|마무리)/;
  const TO = () => !!cfg.trainOnly || (RESET_ONLY && S.resetPhase === 'passed'); // 특별훈련만 대신 (태생 리세가 찾은 선수를 직접 키울 때)
  const HO = () => !!cfg.handoff; // 태생 리세 매크로가 넘겨준 선수: 은퇴 카드에서 멈춤 → 사용자가 회귀를 누르면 회귀 자동 → 남길 커리어 화면에서 멈춤
  const sideKo = () => (curSide() === 'PITCHER' ? '투수' : curSide() === 'HITTER' ? '타자' : '');
  const curSide = () => (cfg.targetSides.length === 1 ? cfg.targetSides[0] : S.side || '');

  // TR 반영 비율 (게임 코드와 같음: 지명타자 수비 0%, 마무리 체력 5% 등)
  const TRW = {
    포수: { 컨택: .25, 파워: .17, 선구안: .18, 주력: .05, 수비: .35 }, '1루수': { 컨택: .25, 파워: .3, 선구안: .2, 주력: .05, 수비: .2 },
    '2루수': { 컨택: .25, 파워: .1, 선구안: .15, 주력: .2, 수비: .3 }, '3루수': { 컨택: .2, 파워: .25, 선구안: .2, 주력: .1, 수비: .25 },
    유격수: { 컨택: .25, 파워: .05, 선구안: .15, 주력: .2, 수비: .35 }, 좌익수: { 컨택: .27, 파워: .27, 선구안: .18, 주력: .08, 수비: .2 },
    중견수: { 컨택: .2, 파워: .08, 선구안: .15, 주력: .25, 수비: .32 }, 우익수: { 컨택: .22, 파워: .27, 선구안: .18, 주력: .08, 수비: .25 },
    지명타자: { 컨택: .32, 파워: .4, 선구안: .23, 주력: .05, 수비: 0 },
    선발: { 구속: .15, 구위: .27, 제구: .25, 체력: .23, 위기관리: .1 }, 불펜: { 구속: .25, 구위: .3, 제구: .2, 체력: .05, 위기관리: .2 },
    마무리: { 구속: .2, 구위: .3, 제구: .15, 체력: .05, 위기관리: .3 },
  };
  const trScore = (pos, a) => Object.entries(TRW[pos] || {}).reduce((s, [k, w]) => s + (typeof a[k] === 'number' ? a[k] : 0) * w, 0);
  // 은퇴 카드 PA 점수 → TR (목표 포지션 중 가장 높은 값, 게임의 o6 계산과 같은 가중치)
  function cardTR(rows) {
    const a = {}; (rows || []).forEach((r) => { if (!isNaN(r.score)) a[r.label] = r.score; });
    const g = (typeof goal === 'function' ? goal().positions : cfg.goal && cfg.goal.positions) || [];
    const cands = (g.length ? g : Object.keys(TRW)).filter((p) => TRW[p] && Object.keys(TRW[p]).every((k) => k in a));
    return cands.length ? Math.max(...cands.map((p) => trScore(p, a))) : NaN;
  }
  // 버튼 목록에서 고르기: 허용 목록이 비면 추천, 하나면 그것, 여럿이면 추천 우선 → TR 최대 → 목록 순서
  function pickAllowed(btns, allowed, abil) {
    const name = (b) => b.t.replace(/\s*(구단 )?추천$/, '').split(' ')[0];
    const reco = btns.find((b) => /추천$/.test(b.t));
    if (!allowed || !allowed.length) return reco || null;
    const ok = btns.filter((b) => allowed.includes(name(b)));
    if (!ok.length) return null;
    if (ok.length === 1) return ok[0];
    if (reco && ok.includes(reco)) return reco;
    if (abil && ok.some((b) => TRW[name(b)])) return ok.slice().sort((x, y) => trScore(name(y), abil) - trScore(name(x), abil))[0];
    return ok.sort((x, y) => allowed.indexOf(name(x)) - allowed.indexOf(name(y)))[0];
  }

  // ── 6-1. 직접 플레이·미니게임 중에는 손대지 않음
  rule('직접 플레이', () => playingPostseason || !!document.querySelector('.tb-header-pause, .tb-inning-arrow, .pq-survive'), () => 'WAIT:직접 플레이 중 (끝나면 이어서 진행)');
  const nextTry = (c) => c.list.find((b) => /stp-primary/.test(b.cls) && !/tap|hold|run/.test(b.cls) && /·\s*\d+\s*\/\s*\d+$/.test(b.t));
  rule('특별훈련 플레이', (c) => /특별훈련 · \d+ \/ \d+/.test(c.text) && !nextTry(c) && !find(c.list, /^결과 보기/), () => 'WAIT:' + (cfg.trainingAutoPlay ? '특별훈련 자동 플레이 중' : '특별훈련 플레이 중 — 직접 해 주세요 (10점 목표)'));
  rule('특별훈련 시작 전', (c) => !!c.scope.querySelector('.stp-intro') && !!find(c.list, /^(훈련 시작|훈련 이어하기) ?→/), (c) => (cfg.trainingAutoPlay ? find(c.list, /^(훈련 시작|훈련 이어하기) ?→/) : 'STOP:특별훈련 준비 완료 — 훈련 시작을 누르고 직접 플레이해 주세요 (10점 목표)'), { trusted: true });

  // ── 6-2. 홈 팝업
  rule('접속 보상', (c) => c.scope.matches('.daily-login-reward-modal'), (c) => find(c.list, /^확인$/));
  rule('신인왕 발표', (c) => c.scope.matches('.rookie-announcement'), (c) => find(c.list, /^닫기$/));
  rule('앱 홍보', (c) => c.scope.matches('.android-app-promotion'), (c) => find(c.list, /^웹에서 계속하기$/));
  rule('운영 팝업', (c) => !!hasCls(c, 'managed-popup-close'), (c) => hasCls(c, 'managed-popup-close'));

  // ── 6-3. 리세 보조 (켜져 있을 때만)
  rule('리세: 시작 확인', () => cfg.resetOn && S.resetPhase === 'ask', () => 'STOP:리세를 시작하면 지금 진행 중인(저장 안 한) 선수가 삭제돼요 — 시작하려면 ▶ 진행');
  rule('리세: 통과', (c) => S.resetPhase === 'passed' && /고3 시즌 결과/.test(c.text), () => {
    if (cfg.resetAutoContinue && !RESET_ONLY) { S.resetPhase = ''; saveS(); notify(S.passMsg || '리세 통과'); return 'WAIT:리세 통과 — 이어서 진행'; }
    return 'STOP:' + (S.passMsg || '리세 통과');
  }, { trusted: true });
  rule('라인업: 약한 자리 찾기', (c) => cfg.goalOn && cfg.lineupOn && cfg.lineupWeakest && cfg.resetOn && S.resetPhase === 'new' && !S.assign && !S.slotPicked && !taskBusy && !!document.querySelector('.stadium-home') && !c.inModal, () => { scanTeamTask(); return 'WAIT:팀에서 가장 약한 자리 찾는 중'; }, { trusted: true });
  rule('리세: 홈', (c) => cfg.resetOn && S.resetPhase === 'new' && !S.assign && (!cfg.lineupWeakest || !cfg.lineupOn || S.slotPicked) && !!document.querySelector('.stadium-home') && !c.inModal, () => document.querySelector('.home-new-life-button, .home-continue-button:not(.home-continue-existing)'), { trusted: true });
  rule('리세: 새로 시작 확인', (c) => cfg.resetOn && S.resetPhase === 'new' && c.scope.matches('.new-career-confirmation'), (c) => find(c.list, /^새로운 인생 시작$/), { trusted: true });
  rule('인트로 스킵', (c) => !!hasCls(c, 'creation-intro-skip'), (c) => hasCls(c, 'creation-intro-skip'));

  // 목표 선수 기본사항 입력 (국적 → 투타겸업 → 투타 유형 → 이름·번호·학교 → 희망 구단)
  const setInput = (el, v) => { if (!el || v === '' || v == null || el.value === String(v)) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); return true; };
  const NATL = { KR: '한국', JP: '일본', US: '미국', TW: '대만', PR: '푸에르토리코', DO: '도미니카공화국', MX: '멕시코', CU: '쿠바', VE: '베네수엘라', AU: '호주', CA: '캐나다', PA: '파나마' };
  // 투타겸업은 포수를 고를 수 없음 (게임 코드: 투타겸업 → 포수 제외, 타자 전용 → 지명타자 제외) → 포수 목표는 타자 전용으로 만듦
  const hitterOnly = () => { const ps = goal().positions || []; return ps.length > 0 && ps.every((x) => x === '포수'); };
  const kindBtn = (c) => (hitterOnly() ? c.list.find((b) => b.t === '타자' && /position-options|segmented/.test((b.el.parentElement && b.el.parentElement.className) || '') ) || c.list.find((b) => b.t === '타자') : c.list.find((b) => b.t === '투타겸업'));
  function fillCreation(c) {
    if (!cfg.goalOn) return null;
    const g = goal();
    const natLabel = NATL[g.nationality];
    if (natLabel && txt(document.querySelector('#creation-nationality-value')) !== natLabel) {
      const det = document.querySelector('.creation-country-picker');
      const b = det && $$('.creation-country-options button', det).find((x) => txt(x) === natLabel);
      if (det && !det.open) return { el: det.querySelector('summary'), t: '국적 열기' };
      if (b) return { el: b, t: natLabel };
    }
    const tw = kindBtn(c);
    if (tw && !/active/.test(tw.cls)) return tw;
    if (g.hand) {
      const h = c.list.find((b) => /hand-option/.test(b.cls) && b.t === g.hand);
      if (h && !/active/.test(h.cls)) return h;
      if (!h && S.handWarn !== g.hand + '|' + hitterOnly()) { S.handWarn = g.hand + '|' + hitterOnly(); saveS(); notify('투타 "' + g.hand + '"는 ' + (hitterOnly() ? '타자 전용' : '투타겸업') + ' 생성에서 고를 수 없어 기본값으로 만듭니다'); }
    }
    if (setInput(document.querySelector('.creation-name-control input'), g.name)) return 'WAIT:이름 입력';
    if (setInput(document.querySelector('.jersey-number-field input'), g.number)) return 'WAIT:등번호 입력';
    if (setInput(document.querySelector('.high-school-name-input'), g.school)) return 'WAIT:학교 입력';
    if (g.team) { const trig = document.querySelector('.team-picker-trigger'); if (trig && !txt(trig).includes(g.team)) return { el: trig, t: '희망 구단 열기' }; }
    return null;
  }
  rule('목표: 희망 구단 고르기', (c) => cfg.goalOn && !!c.scope.querySelector('.team-picker-list') && !!goal().team, (c) => {
    const b = $$('.team-picker-list button', c.scope).find((x) => txt(x).includes(goal().team));
    return b ? { el: b, t: goal().team } : 'STOP:희망 구단 "' + goal().team + '"을 목록에서 못 찾았어요';
  }, { trusted: true });
  rule('리세: 생성 입력', (c) => cfg.resetOn && S.resetPhase === 'new' && !!c.scope.querySelector('.creation-randomize-button'), (c) => {
    const f = fillCreation(c);
    if (f) return f;
    const tw = kindBtn(c);
    if (tw && !/active/.test(tw.cls)) return tw;
    S.resetPhase = 'candidate'; saveS(); candScores = {};
    return find(c.list, /^다음 · 능력치 후보 확인/);
  });
  // 회귀 생성: 후보 확정 전에 회귀 특전 특별훈련부터 (투타겸업은 투수·타자 1번씩)
  rule('회귀 특훈 안내', (c) => c.scope.matches('.rebirth-training-reminder') || (/특별 훈련을 먼저 진행해 주세요/.test(c.text) && !!find(c.list, /^특별 훈련하기/)), (c) => find(c.list, /^특별 훈련하기/) || 'STOP:회귀 특전 특별훈련 버튼을 못 찾았어요', { trusted: true });
  rule('후보 3개 열기', (c) => !!hasCls(c, 'ability-open-all'), (c) => hasCls(c, 'ability-open-all'));
  rule('리세: 후보 고르기', (c) => (cfg.resetOn || cfg.goalOn || HO()) && !!c.scope.querySelector('.ability-select-candidate-button'), (c) => pickCandidate(c));
  rule('리세: 성장 방향', (c) => (cfg.resetOn || cfg.goalOn || HO()) && !!c.scope.querySelector('.ability-finalize-button'), (c) => growthSetup(c));
  rule('리세: 생성 완료', (c) => (cfg.resetOn || cfg.goalOn || HO()) && c.scope.matches('.ability-confirm-modal, .player-creation-confirm-modal'), (c) => { if (cfg.resetOn) { S.resetPhase = 'hs'; saveS(); } S.lifeId = Date.now().toString(36); saveS(); return find(c.list, /^고3 시즌 바로 시작/) || c.list.find((b) => /primary-action/.test(b.cls)); });
  rule('선수 생성 화면', (c) => !!c.scope.querySelector('.creation-randomize-button, .ability-candidate-slot, .ability-finalize-button, .ability-confirm-modal'), () => 'STOP:선수 생성 — 직접 골라 주세요');
  rule('스카우팅 리포트', (c) => !!hasCls(c, 'hs-scouting-action'), (c) => hasCls(c, 'hs-scouting-action'));
  rule('리세: 고3 판정', (c) => cfg.resetOn && S.resetPhase === 'hs' && /고3 시즌 결과/.test(c.text), (c) => judgeHighSchool(c), { trusted: true });
  rule('리세: 실패 후 홈으로', (c) => cfg.resetOn && S.resetPhase === 'new' && !!document.querySelector('.career-home-button') && !c.inModal, () => document.querySelector('.career-home-button'), { trusted: true });

  // ── 6-4. 드래프트·입단
  rule('드래프트 공개', (c) => !!hasCls(c, 'draft-reveal-skip'), (c) => hasCls(c, 'draft-reveal-skip'));
  rule('입단 계약서', (c) => /ROOKIE CONTRACT/.test(c.text), (c) => find(c.list, /^사인하고 \S+ 입단/) || c.list.find((x) => /draft-signature-complete/.test(x.cls) && !x.el.disabled) || find(c.list, /^이름 사인 사용$/));

  // ── 6-5. 알림형 팝업
  rule('마일스톤', () => !!document.querySelector('.career-milestone-popup-dismiss'), () => document.querySelector('.career-milestone-popup-dismiss'));
  rule('스타일 변화', (c) => /PLAYER STYLE CHANGE/.test(c.text), (c) => find(c.list, /^확인/));
  rule('강제 입대', (c) => /현역 강제 입대/.test(c.text), (c) => find(c.list, /^강제 입대 후 군 생활 진행/), { trusted: true });
  rule('이벤트 결과', (c) => !!hasCls(c, 'career-event-result-action'), (c) => hasCls(c, 'career-event-result-action'));

  // ── 6-6. 포스트시즌
  rule('포스트시즌', (c) => /직접 플레이하시겠습니까/.test(c.text), (c) => {
    if (cfg.postseason === 'skipAll') return find(c.list, /^포스트시즌 전체 스킵$/);
    if (cfg.postseason === 'skipRound') return find(c.list, /^이번 라운드 스킵$/);
    return 'STOP:포스트시즌 — 직접 플레이할지 골라 주세요';
  });

  // ── 6-7. 특별훈련 (종목 선택·플레이는 직접)
  rule('특훈 시작 확인', (c) => /훈련을 시작할까요/.test(c.text) && !!c.list.find((b) => /career-decision-confirm/.test(b.cls)), (c) => (cfg.trainingPick === 'manual' ? 'STOP:특별훈련 시작 확인 — 직접 눌러 주세요' : c.list.find((b) => /career-decision-confirm/.test(b.cls))), { trusted: true });
  rule('특훈 다음 시도', (c) => !!nextTry(c), (c) => (cfg.autoNextAttempt ? nextTry(c) : 'WAIT:다음 시도를 눌러 주세요'));
  rule('특훈 결과 보기', (c) => !!find(c.list, /^결과 보기/) && !!c.scope.querySelector('[class*=stp]'), (c) => find(c.list, /^결과 보기/));
  rule('특훈 결과', (c) => /훈련 결과/.test(c.text), (c) => {
    // 투타겸업은 '× 0.4' 없이 'N점'만 보임 (증가량은 똑같이 점수 × 0.4)
    const m = c.text.match(/(\d+)\s*점\s*×\s*0\.4/) || c.text.match(/\+[\d.]+\s*\|?\s*(\d+)\s*점/);
    const score = m ? parseInt(m[1], 10) : NaN;
    const back = find(c.list, /^(스토브리그로|후보 카드로|다음 특별훈련)/);
    const zero = !!S.trainZero;
    if (!zero && !(score >= cfg.trainingMinScore)) {
      if (!cfg.trainingAutoPlay) return 'STOP:특별훈련 ' + (isNaN(score) ? '?' : score) + '점 — ' + cfg.trainingMinScore + '점 미만이라 멈췄어요';
      if (S.lastTrainSig !== c.text.slice(0, 200)) notify('특별훈련 ' + score + '점 (기회는 이미 사용됨 → 계속 진행)');
    }
    if (back && S.lastTrainSig !== c.text.slice(0, 200)) {
      S.lastTrainSig = c.text.slice(0, 200);
      if (S.bonusLife !== S.lifeId) { S.bonusLife = S.lifeId; S.trainBonus = 0; S.statBonus = {}; }
      const dm = c.text.match(/×\s*0\.4\s*=\s*\S+\s*\+\s*([\d.]+)/); const gain = dm ? parseFloat(dm[1]) : score * 0.4; // 화면의 실제 상승값 우선
      if (!zero && !isNaN(gain)) { S.trainBonus = (S.trainBonus || 0) + gain; const st = (S.trainWhat || '').split(' ').pop(); if (st) { S.statBonus = S.statBonus || {}; S.statBonus[st] = (S.statBonus[st] || 0) + gain; } }
      LOG.push({ key: 'train|' + Date.now(), 선수: header().name || '', 연도: '특훈', 나이: header().age || '', 리그: '', 팀: '', 경기: '', 기록: (S.trainWhat || '') + ' ' + (isNaN(score) ? '?' : score) + '점', 수상: zero ? '0점 목표(전념 제안용)' : '', OVR: '', 능력치: '', 시각: new Date().toISOString() });
      S.trainZero = false; saveS(); saveLog();
    }
    return back;
  });
  rule('특훈 종목 선택', (c) => /특별훈련/.test(c.text) && /강화 훈련/.test(c.text), (c) => pickTraining(c), { trusted: true });

  // 특별훈련 종목 자동 선택 (미니게임 플레이는 직접)
  // 특별훈련 종목 순위: 게임 성장 방식(zt) — 능력치 합 상한(≈잠재력) 안에서 성장 예산을 집중 2개에 많이, 나머지에 고르게 나누고 각 20에서 막힘
  //   → 집중 능력치는 저절로 20까지 가고, 나머지 3개가 상한 부족으로 20 아래에서 끝남. 끝날 때 가장 낮을 능력치(=가장 필요한 것)부터 훈련
  //   올S+ 목표: 예상 부족분이 큰 순(같으면 TR 비중) · TR 목표: TR 비중 × (예상 부족분 + 1)
  function projectGrowth(cur, keys, focus, cap, A = 0.3) {
    const d = Object.assign({}, cur); let left = Math.max(0, cap - keys.reduce((a, k) => a + d[k], 0));
    const nf = focus.filter((k) => keys.includes(k)).length, F = (1 - A * nf) / Math.max(1, keys.length - nf);
    const w = Object.fromEntries(keys.map((k) => [k, focus.includes(k) ? A : F]));
    for (let it = 0; it < 10 && left > 1e-4; it++) {
      const open = keys.filter((k) => d[k] < 20); if (!open.length) break;
      const tw = open.reduce((a, k) => a + w[k], 0); let used = 0;
      for (const k of open) { const x = Math.min(20 - d[k], (left * w[k]) / tw); d[k] += x; used += x; }
      if (used <= 1e-4) break; left -= used;
    }
    return d;
  }
  function rankTraining(opts, kind) {
    const isP = kind ? kind === 'PITCHER' : PSTAT.includes(opts[0].stat);
    const keys = isP ? PSTAT : HSTAT;
    const key = isP ? (cfg.pitcherRoles.length === 1 ? cfg.pitcherRoles[0] : '선발') : (cfg.hitterPositions.length === 1 ? cfg.hitterPositions[0] : '지명타자');
    const w = TRW[key] || {};
    const focus = ((S.focus || {})[isP ? 'PITCHER' : 'HITTER']) || [];
    const cur = {}; keys.forEach((k) => { const o = opts.find((x) => x.stat === k); cur[k] = o ? o.v : NaN; });
    const known = keys.filter((k) => !isNaN(cur[k])), avg = known.reduce((a, k) => a + cur[k], 0) / (known.length || 1);
    keys.forEach((k) => { if (isNaN(cur[k])) cur[k] = avg; });
    // 특훈 보너스는 따로 얹히는 값(게임 코드 specialTrainingV1.bonus)이라 자연 성장 상한 계산에서 빼고, 끝에 다시 더함
    const bon = S.bonusLife === S.lifeId ? S.statBonus || {} : {};
    const base = Object.fromEntries(keys.map((k) => [k, cur[k] - (bon[k] || 0)]));
    // 집중 몫(게임 코드 mn·hn, 프로 기준): 타자 38% · 투수 25% (불펜은 35%)
    const pb = projectGrowth(base, keys, focus, targetCap(), isP ? (key === '불펜' ? 0.35 : 0.25) : 0.38);
    const proj = Object.fromEntries(keys.map((k) => [k, pb[k] + (bon[k] || 0)]));
    const PA = PRI().has('PA');
    const list = opts.filter((o) => !(w[o.stat] === 0)).map((o) => { const def = Math.max(0, 24 - proj[o.stat]), ww = w[o.stat] || 0; return Object.assign({}, o, { need: PA ? def + ww : ww * (def + 1), proj: proj[o.stat] }); });
    return (list.length ? list : opts).sort((a, b) => (b.need || 0) - (a.need || 0));
  }
  function pickTraining(c) {
    if (cfg.trainingPick === 'manual') return 'STOP:특별훈련 — 종목을 골라 주세요' + (sideKo() ? ' (목표: ' + sideKo() + ')' : '');
    const side = curSide();
    const all = $$('.stove-training-targets button', c.scope).filter((b) => visible(b, true));
    const usable = all.filter((b) => !b.disabled && !/사용 완료/.test(b.innerText));
    const kinds = new Set(all.map((b) => b.getAttribute('data-training-kind')).filter(Boolean));
    const kindOf = (b) => b.getAttribute('data-training-kind');
    // 회귀 특전 추가 훈련(투타겸업): 투수·타자 1번씩 꼭 해야 함 → 목표 쪽은 만점, 다른 쪽은 0점(설정)
    if (kinds.size > 1 && /회귀 특전|추가 훈련/.test(c.text)) {
      const avail = (k) => usable.filter((b) => kindOf(b) === k);
      let kind = '';
      if (document.querySelector('.ability-candidate-slot')) { // 생성 화면: 지금 보고 있는 후보 종류
        const det = document.querySelector('.ability-candidate-detail'), t = det ? det.innerText : '';
        const hasP = PSTAT.some((x) => t.includes(x)), hasH = HSTAT.some((x) => t.includes(x));
        kind = hasP && !hasH ? 'PITCHER' : hasH && !hasP ? 'HITTER' : '';
      }
      if (!kind || !avail(kind).length) kind = side && avail(side).length && !document.querySelector('.ability-candidate-slot') ? side : avail('PITCHER').length ? 'PITCHER' : 'HITTER';
      const zero = !!(cfg.twoWayZero && side && kind !== side);
      const list = avail(kind).map((b) => { const m = txt(b.querySelector('strong') || b).match(/^(\S+) 강화 훈련\s*([\d.]+)/); return m ? { el: b, stat: m[1], v: parseFloat(m[2]), t: m[1] + ' 강화 훈련' } : null; }).filter(Boolean);
      if (!list.length) return 'STOP:회귀 특전 특별훈련 — 고를 종목이 없어요';
      let pk;
      // 0점 목표는 가장 빨리 끝나는 미니게임으로 (실측: 타이밍 2초 < 길 3초 < 힘 4초 < 도루·기억·체력 20초대)
      const FAST = { 컨택: 0, 위기관리: 0, 수비: 1, 구위: 1, 파워: 2, 구속: 2, 주력: 3, 선구안: 4, 제구: 4, 체력: 5 };
      if (zero) pk = list.slice().sort((a, b) => (FAST[a.stat] ?? 9) - (FAST[b.stat] ?? 9))[0];
      else pk = rankTraining(list, kind)[0];
      S.trainZero = zero; S.trainWhat = (kind === 'PITCHER' ? '투수 ' : '타자 ') + pk.stat; saveS();
      return Object.assign({}, pk, { t: pk.t + (zero ? ' (0점 목표 · 전념 제안용)' : ' (만점 목표)') });
    }
    if (S.trainZero) { S.trainZero = false; saveS(); }
    if (kinds.size > 1 && !side) return 'STOP:특별훈련 — 목표 쪽(투수/타자)이 정해지지 않아 직접 골라 주세요';
    const mine = usable.filter((b) => !kindOf(b) || !side || kindOf(b) === side);
    const opts = mine.map((b) => { const m = txt(b.querySelector('strong') || b).match(/^(\S+) 강화 훈련\s*([\d.]+)/); return m ? { el: b, stat: m[1], v: parseFloat(m[2]), t: m[1] + ' 강화 훈련' } : null; }).filter(Boolean);
    if (!opts.length) {
      S.trainDoneYear = S.trainOpenYear; saveS();
      return find(c.list, /^(닫기|취소|나중에|×|✕)$/) || 'STOP:특별훈련 — 남은 목표 쪽 종목이 없어요. 닫아 주세요';
    }
    let pick;
    if (cfg.trainingPick === 'fixed') {
      const order = cfg.trainingOrder.split(',').map((x) => x.trim()).filter(Boolean);
      pick = order.map((st) => opts.find((o) => o.stat === st)).find(Boolean) || opts.slice().sort((a, b) => a.v - b.v)[0];
    } else {
      pick = rankTraining(opts)[0]; // 집중성장 고려: 끝날 때 가장 낮을 능력치부터
    }
    S.trainWhat = pick.stat; saveS();
    return Object.assign({}, pick, { t: pick.t + (pick.proj !== undefined ? ' (예상 최종 ' + pick.proj.toFixed(1) + ')' : '') });
  }

  // ── 6-8. 시즌 결과: 연출 스킵 → 기록 → 바로 다음
  rule('결과 연출 스킵', (c) => !!hasCls(c, 'cv2-reveal-skip'), (c) => hasCls(c, 'cv2-reveal-skip'));
  rule('시즌 결과', (c) => /시즌 결과/.test(c.text) && !!find(c.list, /^다음( · 스토브리그로)? ?→?$/), (c) => {
    if (/\| \? \|/.test(c.text)) return find(c.list, /^다음( · 스토브리그로)? ?→?$/); // 아직 가려진 값 → 먼저 열기
    const fresh = recordSeason(c);
    if (fresh) noteOvr();
    if (fresh && header().age >= 19) {
      const why = checkAbort();
      const home = document.querySelector('.career-home-button');
      if (why && home) { startNewLife(why); notify('가망 없음 → 새 인생: ' + why); return { el: home, t: '중간 폐기 → 홈' }; }
    }
    return find(c.list, /^다음( · 스토브리그로)? ?→?$/);
  });

  // ── 6-9. 선택형 이벤트 (기본 선택 규칙)
  rule('국가대표', (c) => /국가대표팀에 선발되었습니다/.test(c.text), (c) => (cfg.nationalTeam === 'join' ? find(c.list, /^대표팀 참가/) : 'STOP:국가대표 참가 여부'), { trusted: true });
  rule('비FA 다년계약', (c) => /비FA 다년계약 제안/.test(c.text), (c) => {
    if (cfg.nonFaExtension === 'reject') return find(c.list, /^기존 계약 유지/);
    if (cfg.nonFaExtension === 'accept') return find(c.list, /^비FA 다년계약 수락/);
    return 'STOP:비FA 다년계약 제안';
  }, { trusted: true });
  rule('보직 변경 제안', (c) => /보직 변경 제안/.test(c.text) && !!find(c.list, /^현재 보직 유지/), (c) => {
    if (!cfg.keepRoleAndPosition) return 'STOP:보직 변경 제안';
    const st = $$('.pitcher-role-route strong', c.scope).map(txt);
    const okRole = (r) => cfg.pitcherRoles.some((x) => r && r.startsWith(x));
    if (cfg.pitcherRoles.length && !okRole(st[0]) && okRole(st[1])) return find(c.list, /^변경 수락/);
    return find(c.list, /^현재 보직 유지/);
  }, { trusted: true });
  rule('첫 보직 선택', (c) => /(첫 1군 보직|1군 보직 재선택)/.test(c.text), (c) => {
    const roleBtns = c.list.filter((b) => /^(선발|불펜|마무리)/.test(b.t));
    if (!cfg.pitcherRoles.length) { // 목표가 타자뿐이면(투타겸업 중) 보직은 상관없으니 구단 추천
      if (cfg.goalOn || (cfg.targetSides.length === 1 && cfg.targetSides[0] === 'HITTER')) return roleBtns.find((b) => /추천/.test(b.t)) || roleBtns[0] || 'STOP:1군 보직 버튼이 없어요';
      return 'STOP:1군 보직 — 직접 골라 주세요 (설정에서 목표 보직 지정 가능)';
    }
    return pickAllowed(roleBtns, cfg.pitcherRoles, S.abilities || {}) || 'STOP:고른 보직 버튼이 없어요';
  }, { trusted: true });
  // 수비·좌투·지명타자 포지션 전환 제안은 설정과 상관없이 항상 거절(현재 포지션 유지). 거절 버튼을 못 찾으면 멈춤
  rule('포지션 전환 제안', (c) => /(포지션 전환 제안|지명타자 전환 제안)/.test(c.text), (c) => find(c.list, /^(현재 포지션 유지|현재 자리에서 재도전)/) || 'STOP:포지션 전환 제안 — 거절(현재 포지션 유지) 버튼을 못 찾았어요', { trusted: true });
  rule('전념 제안', (c) => /코치의 전념 제안/.test(c.text), (c) => {
    const want = sideKo();
    if (!cfg.commitTwoWay || !want) return 'STOP:코치의 전념 제안 — 목표 쪽이 정해지지 않았어요';
    const yes = find(c.list, new RegExp('^' + want + ' 전념')); if (yes) return yes;
    const keep = find(c.list, /^투타겸업 유지/); // 반대쪽 전념 제안(더 높은 쪽으로만 옴) → 거절하고 계속 (게임: 거절하면 몇 년 뒤 다시 제안)
    if (keep) { notify('전념 제안이 목표(' + want + ')와 반대 → 투타겸업 유지'); return keep; }
    return 'STOP:전념 제안이 목표(' + want + ')와 달라요';
  }, { trusted: true });
  rule('부상 선택', (c) => cfg.injury === 'auto' && (!!find(c.list, /^회복 기간을 끝까지/) || !!find(c.list, /^일반 재활$/)), (c) => find(c.list, /^회복 기간을 끝까지/) || find(c.list, /^일반 재활$/));
  // ── 6-10a. 루트 이동 (게임 코드 기준: MLB FA·퀄리파잉 오퍼·계약 만료, 아시아 구단 제안, 포스팅)
  //   루트의 '지금 단계'는 S.stepIdx 로 기억 (KBO→MLB→KBO처럼 같은 리그가 두 번 나와도 구분)
  function curIdx() {
    const st = routeSteps(), here = S.league || 'KBO';
    let i = Math.min(S.stepIdx || 0, st.length - 1);
    if (st[i] && st[i].lg.includes(here)) return i;
    const j = st.findIndex((x, k) => k >= i && x.lg.includes(here));
    return j >= 0 ? j : st.findIndex((x) => x.lg.includes(here));
  }
  const curStep = () => routeSteps()[curIdx()];
  const nextStep = () => routeSteps()[curIdx() + 1];
  // 이번 리그 연속 구간 1군 시즌 수 (팀이 바뀌어도 이어서 셈)
  function stintSeasons() {
    const h = header(), lgOf = (lv) => (/MAJOR|MLB/.test(lv) ? 'MLB' : /NPB|일본/.test(lv) ? 'NPB' : /CPBL|대만/.test(lv) ? 'CPBL' : /KBO/.test(lv) ? 'KBO' : '');
    const rows = LOG.filter((r) => r.선수 === h.name && (!r.생애 || r.생애 === S.lifeId) && Number(r.경기) > 0 && /1군|MLB|MAJOR|NPB|CPBL/.test(r.리그) && !/2군|마이너|MINOR|트리플|더블|싱글|고교|HIGH|대학|COLLEGE/.test(r.리그));
    let n = 0; for (let i = rows.length - 1; i >= 0 && lgOf(rows[i].리그) === S.league; i--) n++;
    return n;
  }
  // 영결용 같은 팀 10시즌(아시아·KBO)은 팀 기준, MLB(명전은 MLB 통산)와 1시즌 경유 단계는 리그 연속 구간 기준
  const stepDone = () => { const s = curStep(); if (!s) return false; return (s.n >= 10 && !s.lg.includes('MLB') ? seasonsWithTeam() : Math.max(seasonsWithTeam(), stintSeasons())) >= s.n; };
  const wantLeave = () => (cfg.transfer === 'routeAll' || cfg.goalOn) && stepDone() && !!nextStep();
  const LGRE = { KBO: /KBO/, NPB: /NPB/, CPBL: /대만|CPBL/, MLB: /미국|MLB/ };
  // 원래 팀(지금 팀·리그별로 가장 오래 뛴 팀)이 선택지에 있으면 그 팀부터 (영결·TR 시너지는 같은 팀 기준)
  const origTeams = () => [...new Set([S.team, ...['CPBL', 'KBO', 'NPB', 'MLB'].map((lg) => { try { return wantTeam(lg); } catch (e) { return ''; } })].filter((x) => x && x.length >= 2))];
  const pickOrig = (items) => { const ts = origTeams(); for (const t of ts) { const b = items.find((x) => x.t.includes(t)); if (b) return b; } return null; };
  const pickLeague = (items, lgs) => { for (const lg of lgs) { const m = items.filter((x) => LGRE[lg].test(x.t)); if (m.length) return pickOrig(m) || m[0]; } return null; };
  // 스토브리그 화면에서 할 이동 (허브 규칙이 시즌 진행 누르기 전에 확인)
  function routeMoveAction(c) {
    if (!wantLeave()) return null;
    const nx = nextStep().lg;
    if (nx.includes('MLB')) { const post = find(c.list, /^(MLB )?포스팅 (신청|요청)/); if (post) return post; }
    const offers = c.list.find((b) => /· \d+건$/.test(b.t) && /(구단 제안|계약|제안)/.test(b.t));
    if (offers && (offers.t.startsWith('구단 제안') || pickLeague([offers], nx))) return offers;
    return null;
  }
  rule('아시아 구단 제안 목록', (c) => !!c.scope.querySelector('.international-offer-list'), (c) => {
    const items = $$('.international-offer-list button', c.scope).map((b) => ({ el: b, t: txt(b) }));
    const sel = items.find((x) => /한 번 더 누르면/.test(x.t));
    if (sel) return sel;
    if (!wantLeave()) return pickOrig(items) || 'STOP:구단 제안 — 직접 골라 주세요';
    return pickLeague(items, nextStep().lg) || 'STOP:' + nextStep().lg.join('/') + ' 제안이 없어요 — 직접 골라 주세요';
  }, { trusted: true });
  rule('아시아 구단 제안 (진로)', (c) => !!c.scope.querySelector('.international-path-panel') && /구단 제안|입단 제안|편입/.test(txt(c.scope.querySelector('.international-path-panel h2') || document.body)), (c) => {
    const cards = c.list.filter((b) => /path-choice/.test(b.cls));
    const sel = cards.find((b) => /한 번 더 누르면/.test(b.t)); if (sel) return sel;
    if (!wantLeave()) return find(c.list, /^잔류/) || cards.find((b) => /^잔류/.test(b.t)) || pickOrig(cards) || 'STOP:구단 제안 — 직접 골라 주세요';
    const nx = nextStep().lg;
    const direct = pickLeague(cards, nx);
    if (direct) return direct;
    const overseas = cards.find((b) => /^해외 구단/.test(b.t)); // CPBL·KBO·미국은 '해외 구단' 묶음
    return overseas || 'STOP:' + nx.join('/') + ' 제안이 없어요 — 직접 골라 주세요';
  }, { trusted: true });
  rule('선택 확정', (c) => (cfg.transfer === 'routeAll' || cfg.goalOn) && !!find(c.list, /^선택 확정$/), (c) => find(c.list, /^선택 확정$/), { trusted: true });
  rule('계약서 사인', (c) => !!c.scope.querySelector('.draft-signature-modal'), (c) => c.list.find((b) => /draft-signature-complete/.test(b.cls) && !b.el.disabled) || find(c.list, /^이름 사인 사용$/));
  // MLB: 같은 팀 목표 시즌 전이면 잔류(재계약·퀄리파잉 수락), 채웠으면 루트 다음 리그로 복귀
  const mlbStay = () => { const s = curStep(); return !!s && s.lg.includes('MLB') && !stepDone(); };
  const returnBtn = (c) => find(c.list, /^(KBO 복귀|아시아 구단 제안)$/);
  rule('MLB 퀄리파잉 오퍼', (c) => /퀄리파잉 오퍼/.test(txt(c.scope.querySelector('.panel-heading h2'))) || (/QUALIFYING OFFER/.test(c.text) && !!c.scope.querySelector('.fa-offer-card')), (c) => {
    if (cfg.transfer === 'manual') return 'STOP:퀄리파잉 오퍼 — 직접 골라 주세요';
    if (mlbStay() || !nextStep()) return c.list.find((b) => /fa-offer-card/.test(b.cls)) || 'STOP:퀄리파잉 오퍼 카드를 못 찾았어요';
    return returnBtn(c) || find(c.list, /^퀄리파잉 오퍼 거절하고 FA 시장으로/);
  }, { trusted: true });
  rule('MLB 계약 만료 새 제안', (c) => /계약 만료 · 새 제안/.test(c.text), (c) => {
    if (cfg.transfer === 'manual') return 'STOP:MLB 계약 만료 — 직접 골라 주세요';
    const cards = c.list.filter((b) => /fa-offer-card/.test(b.cls));
    const sel = cards.find((b) => /selected/.test(b.cls)); if (sel) return sel;
    if (!mlbStay() && nextStep()) return returnBtn(c) || 'STOP:MLB → ' + nextStep().lg.join('/') + ' 복귀 버튼이 없어요 (계약이 남았거나 보류권)';
    const yrs = (b) => { const m = b.t.match(/(\d+)\s*년/); return m ? +m[1] : 0; };
    const same = cards.find((b) => S.team && b.t.includes(S.team));
    return same || cards.slice().sort((a, b) => yrs(b) - yrs(a))[0] || find(c.list, /^마이너 계약으로 도전 계속/) || 'STOP:MLB 계약 제안이 없어요';
  }, { trusted: true });
  rule('미국 계약 만료', (c) => /미국 계약이 만료되었습니다/.test(c.text), (c) => {
    if (cfg.transfer === 'manual') return 'STOP:미국 계약 만료 — 직접 골라 주세요';
    if (!mlbStay() && nextStep()) return returnBtn(c) || find(c.list, /계약 제안 확인$/);
    return find(c.list, /계약 제안 확인$/);
  }, { trusted: true });
  rule('마이너 계약 없음', (c) => /마이너 계약 제안이 없습니다/.test(c.text), (c) => returnBtn(c) || 'STOP:마이너 계약 제안이 없어요 — 은퇴 여부를 직접 정해 주세요', { trusted: true });
  rule('MLB 트레이드', (c) => !!find(c.list, /^현재 팀 잔류$/) && !!find(c.list, /^이적 수락$/), (c) => find(c.list, /^현재 팀 잔류$/), { trusted: true });

  // ── 6-10. 이적 (FA·리그·오퍼)
  rule('FA 자격', (c) => /FA 자격 획득/.test(c.text), (c) => faDecision(c), { trusted: true });
  rule('리그 선택', (c) => /진출할 리그 선택/.test(c.text), (c) => leagueChoice(c), { trusted: true });
  rule('구단 오퍼', (c) => !!c.scope.querySelector('.fa-offer-card') || /구단 오퍼 확인/.test(c.text), (c) => offerChoice(c), { trusted: true });

  // ── 6-10b. 진로·방출·은퇴 권고 (코드 분석으로 정한 기본 선택)
  const routeFirst = () => (parseRoute()[0] || [])[0] || 'KBO';
  rule('졸업 진로', (c) => !!c.scope.querySelector('.graduation-path-panel') && /졸업 후 진로|다른 진로 선택/.test(txt(c.scope.querySelector('.graduation-path-panel h2') || document.body)), (c) => {
    if (!cfg.pathAuto) return 'STOP:졸업 후 진로 — 직접 골라 주세요';
    const cards = c.list.filter((b) => /path-choice/.test(b.cls));
    const first = routeFirst();
    const want = first === 'MLB' ? /^MLB 진출/ : ['KBO', 'CPBL', 'NPB'].includes(first) ? /드래프트 (도전|참가)/ : null; // 대만 국적은 'CPBL 드래프트 도전'
    const pick = want && cards.find((b) => want.test(b.t));
    if (!pick) return 'STOP:졸업 후 진로 — 루트(' + first + ')에 맞는 선택지가 없어요';
    return pick; // 처음 누르면 선택, 다음 틱에 한 번 더 눌러 진행
  }, { trusted: true });
  rule('MLB 고교 직행', (c) => /MLB 고교 직행/.test(c.text) && /INTERNATIONAL AMATEUR/.test(c.text), (c) => {
    if (!cfg.pathAuto) return 'STOP:MLB 고교 직행 계약 — 직접 골라 주세요';
    if (routeFirst() !== 'MLB') return find(c.list, /^진로 다시 선택/) || 'STOP:MLB 고교 직행 계약';
    return c.list.find((b) => /primary-action/.test(b.cls)) || 'STOP:MLB 고교 직행 계약';
  }, { trusted: true });
  rule('대학 특별훈련', (c) => /2년간 특별훈련을 하시겠습니까/.test(c.text), (c) => (cfg.trainingAutoPlay ? find(c.list, /^특별훈련 하기$/) : 'STOP:대학 특별훈련 여부 — 직접 골라 주세요'), { trusted: true });
  rule('대학 시즌 진행', (c) => /대학 특별훈련/.test(c.text) && !!find(c.list, /^대학 시즌 진행/), (c) => find(c.list, /^대학 시즌 진행/), { trusted: true });
  rule('전력 외 통보', (c) => c.scope.matches('.release-process-modal') && !c.scope.matches('.retirement-recommendation, .market-result'), (c) => {
    if (!cfg.releaseContinue) return 'STOP:전력 외 통보 — 직접 골라 주세요';
    return c.list.find((b) => /primary-action/.test(b.cls)) || 'STOP:전력 외 통보 — 버튼을 못 찾았어요';
  }, { trusted: true });
  const mlbSeasons = () => { const h = header(); return LOG.filter((r) => r.선수 === h.name && (!r.생애 || r.생애 === S.lifeId) && /MLB|MAJOR/.test(r.리그) && Number(r.경기) > 0).length; };
  // 목표 모드에서 루트에 아직 갈 리그가 남았으면(영결용 1군 출전) 은퇴 권고를 넘기고 계속
  const keepPlaying = () => cfg.retireAdvice === 'continue' || (cfg.retireAdvice === 'smart' && ((S.league === 'MLB' && mlbSeasons() < 12) || (goalActive() && PRI().has('RN') && !!nextStep())));
  rule('은퇴 권고', (c) => c.scope.matches('.retirement-recommendation'), (c) => {
    if (cfg.retireAdvice === 'ask') return 'STOP:구단의 은퇴 권고 — 직접 골라 주세요';
    return keepPlaying() ? find(c.list, /^다른 팀 제안 확인/) : find(c.list, /^은퇴 권고 수락/);
  }, { trusted: true });
  rule('현역 연장 시장', (c) => c.scope.matches('.market-result'), (c) => {
    if (cfg.retireAdvice === 'ask') return 'STOP:단년 계약 제안 — 직접 골라 주세요';
    const offers = $$('.release-offer-list article', c.scope).map((a) => ({ el: a.querySelector('button'), r: num((a.querySelector('em') || {}).textContent || '0'), t: '계약 선택' }));
    if (offers.length && keepPlaying()) return offers.sort((x, y) => y.r - x.r)[0];
    return find(c.list, /^(모든 제안을 거절하고 은퇴|은퇴 기록 보기)/);
  }, { trusted: true });

  rule('스토브리그 이벤트', (c) => !!c.scope.querySelector('.choice-card, .cv2-choice') || /OFFSEASON EVENT/.test(c.text), (c) => chooseEvent(c), { trusted: true });

  // ── 6-11. 스토브리그 허브 (시즌 진행)
  rule('리세 전용: 특훈 들어가기', (c) => TO() && !!c.scope.querySelector('.stove-training-entry'), (c) => {
    const year = (c.text.match(/(\d{4})년 스토브리그/) || [])[1] || '?';
    const entry = hasCls(c, 'stove-training-entry');
    if (entry && !entry.el.disabled && S.trainDoneYear !== year) { S.trainOpenYear = year; saveS(); return entry; }
    return 'WAIT:특별훈련 대기 — 시즌은 직접 진행하세요';
  });
  // 대학(국내·대만): 2·4학년 뒤 드래프트 결정 → 프로 드래프트 참가 (프로 시즌을 하루라도 빨리)
  rule('대학 드래프트 결정', (c) => !!c.scope.querySelector('.college-decision-path-panel') && !!find(c.list, /^프로 드래프트 참가/), (c) => find(c.list, /^프로 드래프트 참가/), { trusted: true });
  // 대만 대학·실업팀 진로 선택(매년): 'CPBL 드래프트'가 있으면 참가, 없으면 '대학 시즌 계속'/'잔류'
  rule('대학·실업팀 진로', (c) => !!find(c.list, /대학 시즌 계속/) || (!!find(c.list, /^(CPBL|KBO|NPB) 드래프트/) && !!find(c.list, /^(잔류|실업팀 입단)/)), (c) => find(c.list, /^(CPBL|KBO|NPB) 드래프트|^(신인|프로) 드래프트 참가/) || find(c.list, /대학 시즌 계속|^잔류/) || 'STOP:대학 진로 버튼을 못 찾았어요', { trusted: true });
  rule('대학 시즌 진행', (c) => !!find(c.list, /^\d+학년 시즌 진행/) && !c.scope.querySelector('.ready-player-type, .stove-training-entry'), (c) => find(c.list, /^\d+학년 시즌 진행/), { trusted: true });
  rule('프로 지명', (c) => /프로 지명|ROOKIE DRAFT/.test(c.text) && !!find(c.list, /^프로 입단/), (c) => find(c.list, /^프로 입단/), { trusted: true }); // 대만 CPBL 드래프트 지명 화면
  rule('스토브리그', (c) => !!c.scope.querySelector('.ready-player-type, .stove-training-entry'), (c) => {
    rememberHub(c);
    const go = c.list.find((b) => /primary-action/.test(b.cls) && /^(수락 후 시즌 진행|계약 \d+\/\d+ 시즌 진행|판정 확인 후 시즌 진행|FA 연장 .*시즌 진행|\d+년차 .*진행|\d+학년 시즌 진행|시즌 진행 ?→?$)/.test(b.t));
    const year = (c.text.match(/(\d{4})년 스토브리그/) || [])[1] || '?';
    const entry = hasCls(c, 'stove-training-entry');
    if (entry && cfg.trainingPick !== 'manual' && S.trainDoneYear !== year && !entry.el.disabled) { S.trainOpenYear = year; saveS(); return entry; }
    const mv = routeMoveAction(c);
    if (mv) return mv;
    if (cfg.stopForTraining && cfg.trainingPick === 'manual' && entry) return 'STOP:특별훈련 가능 — 하시거나 ▶ 진행' + (sideKo() ? ' (목표: ' + sideKo() + ')' : '');
    if (cfg.stopForPosting && find(c.list, /포스팅/)) return 'STOP:MLB 포스팅 가능 — 정하시거나 ▶ 진행';
    if (cfg.stopForMilitary && find(c.list, /^(상무 지원|현역 입대)$/)) return 'STOP:병역 선택지 — 정하시거나 ▶ 진행';
    if (!go) return 'STOP:시즌 진행 버튼을 못 찾았어요';
    return go;
  }, { trusted: true });

  // ── 6-12. 은퇴 후 집계 (마지막 화면에서는 멈춤)
  // ═════════════════════════════════════════════
  // 6-12a. 목표 선수 모드: 생애 계획 · 중간 폐기 · 은퇴 판정 · 회귀 · 저장 · 라인업
  // ═════════════════════════════════════════════
  const NATIVE = ['ios', 'android'].includes(document.documentElement.dataset.nativePlatform || '');
  const PRI = () => new Set(goal().priorities || []);
  // 활성 목표: 라인업 모드면 지금 채울 슬롯, 아니면 처음 설정한 목표
  // 라인업 모드에서 지금 만들 자리: 약한 자리 자동이면 마지막 팀 점검에서 고른 자리, 아니면 체크된 자리 중 아직 안 끝난 첫 자리
  const curSlot = () => (cfg.lineupWeakest ? (cfg.lineup || []).find((x) => x.slot === S.curSlot) : (cfg.lineup || []).find((x) => !x.done));
  function goal() {
    if (cfg.lineupOn) {
      const s = curSlot();
      if (s) {
        // 팀 모드: 팀 점검 때 고른 이름 칸(S.curId)에 적은 것만 쓰고 나머지는 랜덤 (국적만 비우면 한국 — 루트가 KBO 기준)
        const o = Object.assign({}, cfg.goal, { name: '', number: '', hand: '', team: '', school: '', form: '', nationality: 'KR' });
        const id = S.curId || s;
        for (const k of ['name', 'number', 'nationality', 'hand', 'team', 'school', 'form']) if (id[k]) o[k] = id[k];
        o.positions = [S.curPos || s.pos]; return fixHand(o);
      }
    }
    return fixHand(cfg.goal || {});
  }
  // 좌투 선수는 포수 불가·내야는 1루수만 (게임 코드) → 포수·2루수·3루수·유격수 목표인데 좌투로 정했으면 우투로 바꿔서 만듦 (타석은 그대로)
  function fixHand(o) {
    const ps = o.positions || [];
    if (ps.length && ps.every((x) => ['포수', '2루수', '3루수', '유격수'].includes(x)) && /^좌투/.test(o.hand || '')) return Object.assign({}, o, { hand: '우투' + o.hand.slice(2) });
    return o;
  }
  const goalActive = () => cfg.goalOn && (!cfg.lineupOn || cfg.lineupWeakest || (cfg.lineup || []).some((x) => !x.done));
  const PIT_ROLES = ['선발', '불펜', '마무리'];
  const isDH = () => { const p = goal().positions || []; return p.length && p.every((x) => x === '지명타자'); };
  // 우선순위 → 생애 계획 (생마다 루트, 회귀 때 고를 성장 유형)
  function lifePlan() {
    const P = PRI();
    if (P.has('RN')) return [
      { route: 'KBO:10>NPB:10' },
      { route: 'KBO:1>CPBL:10>NPB:1' },
      { route: P.has('HOF') ? 'KBO:7>MLB:12>KBO:1>NPB:1>CPBL:1' : 'KBO:7>MLB:10>KBO:1>NPB:1>CPBL:1' },
    ];
    if (P.has('HOF')) return [{ route: 'KBO:7>MLB:99' }];
    return [{ route: 'KBO:99' }];
  }
  const life = () => Math.max(1, S.life || 1);
  const curPlan = () => { const pl = lifePlan(); return pl[Math.min(pl.length, life()) - 1]; };
  const effRoute = () => (goalActive() ? curPlan().route : cfg.route);
  const routeSteps = () => effRoute().split('>').map((st) => {
    const [lgs, n] = st.split(':');
    return { lg: lgs.split('|').map((x) => x.trim().toUpperCase()).filter(Boolean), n: n ? +n : cfg.routeSeasons };
  }).filter((st) => st.lg.length);
  const stepOf = (lg) => routeSteps().findIndex((st) => st.lg.includes(lg));

  // ── 중간 조기 폐기: 게임 코드 시뮬레이션으로 만든 '이 나이에 이 OVR 미만이면 목표 잠재력 확률 10% 미만' 표
  const ABORT = {
    PITCHER: { 92: [null, 60.5, 66, 70.5, 75, 78.5, 81.5, 82.5, 83.5, 84, 84.5, 84, 83], 94: [56, 61, 66.5, 71, 75.5, 79, 84.5, 86.5, 87.5, 88, 88.5, 88, 87.5], 96: [56.5, 63, 69, 74.5, 80, 85, 88.5, 90, 91.5, 92, 92.5, 92, 91.5] },
    HITTER: { 92: [null, 62, 67.5, 73, 78.5, 83, 87, 88.5, 89.5, 90.5, 91, 91, 90.5], 94: [null, 62.5, 68.5, 74, 80, 84.5, 88, 90, 91, 91.5, 92, 92, 91.5], 96: [57, 63.5, 69.5, 75.5, 81.5, 86.5, 90, 92, 93, 93.5, 94, 94, 93.5] },
  }; // 인덱스 0 = 18세 … 12 = 30세
  const targetCap = () => { if ([92, 94, 96].includes(+cfg.resetTarget)) return +cfg.resetTarget; const P = PRI(); return P.has('PA') ? 94 : 92; };
  // 중간 폐기: 추정 기준표는 쓰지 않음 — 이 매크로로 키운 1생 선수들의 실제 기록으로만 판단
  //   '좋았던 선수'(1생 은퇴 TR이 목표 -5 이내) 5명 이상 쌓인 뒤, 같은 나이 그 선수들 중 가장 낮았던 OVR보다 2점 넘게 낮은 시즌이 2번 연속일 때만 버림
  const CKEY = 'slbHalfMacro.careers.v1';
  const loadCareers = () => { try { return JSON.parse(localStorage.getItem(CKEY) || '[]'); } catch (e) { return []; } };
  const sideOvr = (h) => (S.side === 'PITCHER' ? (isNaN(h.pOvr) ? h.ovr : h.pOvr) : (isNaN(h.hOvr) ? h.ovr : h.hOvr));
  function noteOvr() { // 시즌마다 이 선수 OVR 기록 (1생, 회귀 전만)
    if (life() > 1 || (S.retry || 0) > 0 || (S.polish || 0) > 0 || !S.side) return;
    if (S.histLife !== S.lifeId) { S.histLife = S.lifeId; S.ovrHist = {}; }
    const h = header(), o = sideOvr(h); if (!isNaN(o) && h.age) { S.ovrHist[h.age] = o; saveS(); }
  }
  function abortLine(age) {
    const good = loadCareers().filter((x) => x.side === S.side && x.ok && x.h && x.h[age] !== undefined);
    if (good.length < 5) return null;
    return Math.min(...good.map((x) => x.h[age]));
  }
  function checkAbort() {
    if (!cfg.goalOn || !cfg.earlyAbort || life() > 1 || (S.retry || 0) > 0 || (S.polish || 0) > 0 || !S.side) return ''; // 회귀한 생은 이미 남길 카드가 있으니 폐기 안 함
    const h = header();
    if (S.abortLife !== S.lifeId) { S.abortLife = S.lifeId; S.abortStrike = 0; } // 이전 선수의 미달 횟수가 넘어오지 않게
    const ovr = sideOvr(h), age = h.age, th = abortLine(age);
    if (th === null || isNaN(ovr)) return ''; // 기록이 모자라면 버리지 않음
    if (ovr < th - 2.0) S.abortStrike = (S.abortStrike || 0) + 1; else S.abortStrike = 0;
    saveS();
    return S.abortStrike >= 2 ? (age + '세 OVR ' + ovr + ' < 좋았던 선수들의 ' + age + '세 최저 ' + th + ' -2 (2시즌 연속)') : '';
  }
  function startNewLife(reason) {
    LOG.push({ key: 'abort|' + Date.now(), 선수: header().name, 연도: '폐기', 나이: header().age, 리그: '', 팀: S.team || '', 경기: '', 기록: reason, 수상: '', OVR: '', 능력치: '', 시각: new Date().toISOString() });
    saveLog(); renderLog();
    Object.assign(S, { resetPhase: 'new', life: 1, retry: 0, polish: 0, chainTR: 0, ownD: [], rebirthApproved: false, bestTR: 0, bestAt: 0, prospect: '', trainBonus: 0, abortStrike: 0, abilities: {}, league: '', team: '', curveDone: false, perk: '', lifeId: '', stepIdx: 0 });
    saveS(); cfg.resetOn = true; save();
  }

  // ── 은퇴 카드 읽기 (PA 점수·영결·명전·LS)
  function readCard() {
    const root = document.querySelector('.retired-card-panel') || document;
    const tc = (e) => ((e && e.textContent) || '').trim();
    const rows = $$('.retired-card-prime-row', root).map((r) => { const g = r.querySelector('strong'); const cls = g ? g.className : ''; return { label: tc(r.querySelector('span')), score: num(tc(r.querySelector('b'))), splus: /grade-splus/.test(cls) ? true : /grade-/.test(cls) ? false : null }; });
    const honors = $$('.retired-card-honors b', root).map(tc);
    const ls = num((tc(root.querySelector('.retired-card-header-score')) || tc(root.querySelector('.retired-card-legacy strong'))).replace(/,/g, ''));
    const rn = new Set(honors.filter((x) => /영구결번/.test(x)).map((x) => x.replace(/\s*영구결번/, '')));
    const name = tc(root.querySelector('.retired-card-player strong'));
    return { rows, rn, hof: honors.includes('HOF'), ls, name, tr: cardTR(rows), pasum: sidePA(rows) };
  }
  const sidePA = (rows) => { const side = S.side === 'HITTER' ? HSTAT : PSTAT; return rows.filter((r) => side.includes(r.label)).reduce((a, r) => a + (isNaN(r.score) ? 0 : Math.round(r.score)), 0); };
  function judgeCard(card) {
    const P = PRI(), miss = [];
    if (P.has('PA') && cfg.goal.minPAsum > 0 && !isDH()) { // PA 합계 기준 (지명타자는 제외 → 올S+ 기준)
      const sum = sidePA(card.rows);
      if (!(sum >= cfg.goal.minPAsum)) miss.push('PA 합계 ' + sum + ' < ' + cfg.goal.minPAsum);
    } else if (P.has('PA')) {
      const need = card.rows.filter((r) => !(isDH() && r.label === '수비'));
      const side = S.side === 'HITTER' ? HSTAT : PSTAT;
      const mine = need.filter((r) => side.includes(r.label));
      const isS = (r) => (r.splus === null ? r.score >= 98 : r.splus); // 등급 클래스가 있으면 그걸로 (반올림 98 오판 방지)
      if (!mine.length || mine.some((r) => !isS(r))) miss.push('PA S+ 미달(' + mine.filter((r) => !isS(r)).map((r) => r.label + ' ' + r.score).join(', ') + ')');
    }
    if (P.has('RN') && card.rn.size < 4) miss.push('영결 ' + card.rn.size + '/4');
    if (P.has('HOF') && !card.hof) miss.push('명전 없음');
    if (P.has('LS') && cfg.goal.minLS && !(card.ls >= cfg.goal.minLS)) miss.push('LS ' + card.ls + ' < ' + cfg.goal.minLS);
    if (cfg.goal.minTR > 0 && !(card.tr >= cfg.goal.minTR)) miss.push('TR ' + (isNaN(card.tr) ? '?' : card.tr.toFixed(1)) + ' < ' + cfg.goal.minTR);
    return miss;
  }
  // 회귀 성공률 추정: 회귀마다 카드 TR이 얼마나 올랐는지(내 기록) → 없거나 적으면 기본 가정
  //   기본 가정: 회귀 1번에 35%는 그대로, 65%는 평균 +2.0(회귀가 거듭될수록 ×0.8)·편차 1.5로 오름 (전념 +2·특훈 +1 기준의 대략값)
  const DKEY = 'slbHalfMacro.deltas.v1';
  const loadDeltas = () => { try { return JSON.parse(localStorage.getItem(DKEY) || '[]'); } catch (e) { return []; } };
  const pushDelta = (r, d) => { const a = loadDeltas(); a.push({ r, d: Math.round(d * 100) / 100 }); try { localStorage.setItem(DKEY, JSON.stringify(a.slice(-300))); } catch (e) { /* 무시 */ } };
  const PHI = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), y = 0.3989423 * Math.exp(-z * z / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - y : y; };
  function estimateRebirth(cur, target, r0, needStat, fails = 0, own = []) {
    const all = loadDeltas(), near = all.filter((x) => x.r >= r0), D = near.length >= 6 ? near : all;
    const mu = (r) => 2.0 * Math.pow(0.8, r), SD = 1.5, STAY = 0.35;
    const pPrior = (gap, r) => (gap <= 0 ? 1 - STAY : (1 - STAY) * (1 - PHI((gap - mu(r)) / SD)));
    const pOne = (c, r) => { const thr = needStat ? Math.max(target, c + 0.5) : target; const pp = pPrior(thr - c, r); if (D.length < 6) return pp; const k = D.filter((x) => c + x.d >= thr).length; return (k + 2 * pp) / (D.length + 2); };
    const gain0 = (r) => (D.length >= 6 ? D.reduce((a, x) => a + Math.max(0, x.d), 0) / D.length : (1 - STAY) * mu(r));
    const gain = (r) => (own.length ? (own.reduce((a, x) => a + Math.max(0, x), 0) + 2 * gain0(r)) / (own.length + 2) : gain0(r)); // 이 선수 실제 상승폭 섞기
    const corr = 3 / (3 + fails); // 이 선수가 회귀해도 목표에 못 닿은 횟수만큼 낮춤 (3번 실패하면 절반)
    const m = Math.max(1, cfg.stallRetries || 3);
    let c = cur, miss = 1, expN = 0; const ps = [];
    for (let i = 0; i < m; i++) { const p = Math.min(0.97, pOne(c, r0 + i)) * corr; ps.push(p); expN += miss; miss *= 1 - p; c += gain(r0 + i); }
    const up = D.length >= 6 ? (D.filter((x) => x.d > 0.2).length + 2 * (1 - STAY)) / (D.length + 2) : 1 - STAY;
    return { pNext: ps[0], pAny: 1 - miss, m, balls: Math.round(expN * 5), up, gain: gain(r0), src: (D.length >= 6 ? '내 기록 ' + D.length + '번' : '기본 가정') + (fails ? ' · 이 선수 실패 ' + fails + '번 반영' : '') };
  }
  const pct = (x) => Math.round(x * 100) + '%';
  // 은퇴 완료 화면: 회귀(다음 생) / 저장 / 새 인생
  rule('목표: 은퇴 판정', (c) => goalActive() && !!document.querySelector('.retired-card-panel') && !c.inModal && !S.retireDecision, () => {
    const card = readCard();
    if (!card.rows.length) return 'WAIT:은퇴 카드를 읽는 중';
    const miss = judgeCard(card), plan = lifePlan();
    const nReb = (life() - 1) + (S.retry || 0) + (S.polish || 0); // 이 선수가 지금까지 회귀한 횟수
    if (S.chainTR > 0 && !isNaN(card.tr) && nReb > 0) { pushDelta(nReb - 1, card.tr - S.chainTR); S.ownD = [...(S.ownD || []), card.tr - S.chainTR]; }
    if (!isNaN(card.tr)) S.chainTR = card.tr;
    let d;
    const needRN = PRI().has('RN') ? [['KBO', 'NPB'], ['KBO', 'NPB', 'CPBL']][life() - 1] || [] : []; // 생마다 쌓여야 할 영결 (전생 보장분 포함)
    const missRN = needRN.filter((lg) => !card.rn.has(lg));
    if (life() < plan.length && missRN.length && (S.retry || 0) < cfg.maxRetry) { d = 'RETRY'; miss.push('이번 생 목표 영결 없음: ' + missRN.join('·')); }
    else if (life() < plan.length) d = 'REBIRTH';
    else if (!miss.length) d = 'SAVE';
    else {
      // 한 생 목표는 TR 최고치(남길 커리어에서 좋은 쪽만 남으니 카드 TR = 지금까지 최고)로 가망을 본다
      if (!isNaN(card.tr) && card.tr > (S.bestTR || 0) + 0.05) { S.bestTR = card.tr; S.bestAt = S.retry || 0; }
      d = 'RETRY'; // 계속 회귀 — 그만둘지는 아래 성공 예상(이 선수가 실패할수록 낮아짐)으로 판단
    }
    S.saveReason = ''; S.polishing = false;
    S.est = null; S.declineTo = 'NEW';
    const tgt = Math.max(cfg.goal.minTR || 0, PRI().has('PA') ? 98 : 0);
    if (d === 'SAVE' && cfg.lineupOn && (!cfg.lineupWeakest || !(S.curSlotTR > 0)) && cfg.polishRebirths > 0 && (S.polish || 0) < cfg.polishRebirths && !isNaN(card.tr) && card.tr < 99.95) { d = 'RETRY'; S.polishing = true; S.declineTo = 'SAVE'; const e = estimateRebirth(card.tr, 100, nReb, false); S.est = { polish: true, up: e.up, gain: e.gain, src: e.src }; miss.push('목표 달성 · 다듬기 회귀 ' + ((S.polish || 0) + 1) + '/' + cfg.polishRebirths + ' (TR 높은 쪽만 남김)'); }
    if (d === 'RETRY' && !S.polishing && tgt > 0 && !isNaN(card.tr)) {
      const needStat = miss.some((x) => /S\+ 미달/.test(x)) && card.tr >= tgt;
      const e = estimateRebirth(card.tr, tgt, nReb, needStat, S.retry || 0, S.ownD || []);
      S.est = { pNext: e.pNext, pAny: e.pAny, m: e.m, balls: e.balls, src: e.src };
      if (e.pAny * 100 < (cfg.rebirthMinP || 0)) {
        if (nReb === 0) { d = 'NEW'; miss.push('회귀 성공 예상 ' + pct(e.pAny) + '(' + e.m + '번 안) < ' + cfg.rebirthMinP + '% → 회귀하지 않고 새 인생'); notify('회귀 안 함 — 성공 예상 ' + pct(e.pAny) + ' (' + e.src + ')'); }
        else { d = 'SAVE'; S.saveReason = 'EST'; miss.push('회귀 ' + nReb + '번 · 성공 예상 ' + pct(e.pAny) + ' < ' + cfg.rebirthMinP + '% → 지금까지 가장 좋은 커리어로 저장'); notify('회귀 그만 — 성공 예상 ' + pct(e.pAny) + ', 가장 좋은 커리어(TR ' + card.tr.toFixed(1) + ')로 저장'); }
      }
    }
    if (d === 'RETRY' && !S.polishing && nReb >= (cfg.maxRebirths || 12)) { d = 'SAVE'; S.saveReason = 'EST'; miss.push('회귀 ' + nReb + '번 (상한) → 가장 좋은 커리어로 저장');
    }
    if (d === 'NEW' && cfg.keepByTR && cfg.trSaveMin > 0 && card.tr >= Math.max(cfg.trSaveMin, cfg.goal.minTR || 0) ) { d = 'SAVE'; S.saveReason = 'TR'; miss.push('TR ' + card.tr.toFixed(1) + ' ≥ ' + Math.max(cfg.trSaveMin, cfg.goal.minTR || 0) + ' → 버리지 않고 저장'); }
    // 첫 회귀 전 가망 판단 (회귀해도 잠재력 상한은 그대로라 지금 카드가 기준)
    S.prospect = '';
    if (/^(REBIRTH|RETRY)$/.test(d) && life() === 1 && !(S.retry || 0) && !S.polishing) {
      const target = Math.max(cfg.goal.minTR || 0, PRI().has('PA') ? 98 : 0);
      if (target > 0 && !isNaN(card.tr)) {
        const gap = target - card.tr;
        const side = S.side === 'HITTER' ? HSTAT : PSTAT;
        const low = card.rows.filter((r) => side.includes(r.label) && !(isDH() && r.label === '수비') && r.score < 98).map((r) => r.label + ' ' + r.score);
        // 회귀하면 전념 +2 잠재력(누적)·특훈 +1회·부상 없음·성장 유형 선택이 붙어 1생 카드보다 좋아짐 → 기준을 넉넉히
        const lv = gap <= 2.5 ? '높음' : gap <= 5 ? '보통' : gap <= 8 ? '낮음' : '매우 낮음';
        S.prospect = '가망 ' + lv + ' (TR ' + card.tr.toFixed(1) + ' / 목표 ' + target + (low.length ? ', S+ 미달 ' + low.join('·') : '') + (PRI().has('RN') ? ', 영결 ' + card.rn.size + '개' : '') + ')';
        if (lv === '매우 낮음' && plan.length < 3) { d = 'NEW'; miss.push('첫 회귀 전 가망 판단: ' + S.prospect + ' → 회귀하지 않고 새 인생'); notify('회귀 안 함 — ' + S.prospect); }
        else miss.push('첫 회귀 전 ' + S.prospect);
      }
    }
    if (/^(REBIRTH|RETRY)$/.test(d) && nReb > 0) S.declineTo = 'SAVE'; // 이미 회귀한 선수는 버리지 않음
    if (S.declineTo !== 'SAVE' && (!judgeCard(card).length && life() >= plan.length || (cfg.keepByTR && cfg.trSaveMin > 0 && card.tr >= Math.max(cfg.trSaveMin, cfg.goal.minTR || 0)))) S.declineTo = 'SAVE';
    if (life() === 1 && !(S.retry || 0) && !(S.polish || 0) && S.side && S.histLife === S.lifeId && S.ovrHist && !isNaN(card.tr)) {
      const a = loadCareers(); a.push({ side: S.side, h: S.ovrHist, tr: card.tr, ok: tgt > 0 ? card.tr >= tgt - 5 : !judgeCard(card).length, t: Date.now() });
      try { localStorage.setItem(CKEY, JSON.stringify(a.slice(-200))); } catch (e) { /* 무시 */ }
      S.histLife = '';
    }
    S.keptCard = { name: card.name, tr: card.tr, pasum: card.pasum, rn: [...card.rn], hof: card.hof, ls: card.ls, pass: !judgeCard(card).length };
    S.retireDecision = d; saveS();
    LOG.push({ key: 'retire|' + Date.now(), 선수: header().name || '', 연도: '은퇴', 나이: '', 리그: life() + '생', 팀: S.team || '', 경기: '', 기록: 'PA ' + card.rows.map((r) => r.label + r.score).join(' ') + ' / TR ' + (isNaN(card.tr) ? '?' : card.tr.toFixed(1)) + ' / LS ' + card.ls + ' / 영결 ' + [...card.rn].join('·') + (card.hof ? ' / HOF' : ''), 수상: { REBIRTH: '다음 생(회귀)', SAVE: S.saveReason === 'TR' ? 'TR 높음 → 저장' : S.saveReason === 'EST' ? '회귀 그만 → 최고 커리어 저장' : '완성 → 저장', RETRY: '미달 → 다시 회귀', NEW: '미달 → 새 인생' }[d], OVR: '', 능력치: miss.join(' / '), 시각: new Date().toISOString() });
    saveLog(); renderLog();
    return 'WAIT:은퇴 판정: ' + { REBIRTH: '다음 생으로 회귀', SAVE: S.saveReason === 'TR' ? '미달이지만 TR 높음 → 저장' : S.saveReason === 'EST' ? '회귀 그만 → 가장 좋은 커리어 저장' : '완성형! 저장', RETRY: '미달 → 다시 회귀', NEW: '미달 → 새 인생' }[d];
  }, { trusted: true });
  // 회귀 시작 (웹: 사인볼 자동은 설정에서 켰을 때만 · 앱: 광고는 직접, 본 뒤 이어서)
  rule('목표: 회귀 열기', (c) => goalActive() && /^(REBIRTH|RETRY)$/.test(S.retireDecision || '') && !c.inModal && !!document.querySelector('.rebirth-entry .primary-action'), () => {
    const b = document.querySelector('.rebirth-entry .primary-action');
    if (b.disabled) return 'STOP:회귀할 수 없는 선수예요 (MY CLUB 저장 선수이거나 로그인 필요)';
    if (cfg.rebirthAsk && !S.rebirthApproved) {
      const e = S.est, no = S.declineTo === 'SAVE' ? '저장' : '버리고 새 인생';
      const est = !e ? '' : e.polish ? ' TR 오를 확률 ' + pct(e.up) + ', 오르면 평균 +' + e.gain.toFixed(1) + ' (' + e.src + ') → ' + (e.up >= 0.5 ? '회귀 추천' : '그냥 저장 추천') + '.'
        : ' 성공 예상: 이번 ' + pct(e.pNext) + ' · ' + e.m + '번 안에 ' + pct(e.pAny) + (NATIVE ? '' : ' · 사인볼 약 ' + e.balls + '개') + ' (' + e.src + ') → ' + (e.pAny >= 0.4 ? '회귀 추천' : '애매, 판단해 주세요') + '.';
      return 'STOP:회귀 확인 — ' + (S.polishing ? '목표 달성, 다듬기 회귀(TR 높은 커리어만 남김)' : S.retireDecision === 'RETRY' ? '미달이라 ' + life() + '생 다시(' + ((S.retry || 0) + 1) + '번째)' : (life() + 1) + '생으로') + ' 회귀' + (NATIVE ? '' : ' (사인볼 5개)') + '.' + (S.prospect ? ' ' + S.prospect + '.' : '') + est + ' ▶ 회귀 / ✕ ' + no;
    }
    return { el: b, t: '고3으로 회귀 열기', hardOk: true };
  }, { trusted: true });
  // 회귀 특전: 첫 회귀에 원하는 성장 유형(이미 그 유형이면 건너뜀) → 이후 회귀는 희망 구단
  //   성장 유형은 숨은 프로필에 남아 다음 회귀에도 이어지고, 희망 구단은 회귀마다 새로 골라야 함 (게임 코드)
  const KO_CURVE = { EARLY: '선행형', NORMAL: '꾸준형', LATE: '후반형', LONG: '지속형', STEP: '단계형', BURST: '집중형' };
  const wantCurve = () => (HO() ? 'NORMAL' : '') || (cfg.goal && cfg.goal.curve) || (PRI().has('RN') ? 'LONG' : 'NORMAL');
  // 리그별 희망 구단: 설정값 → 이 선수 기록에서 그 리그 최다 시즌 팀
  function wantTeam(lg) {
    const set = cfg.goal && cfg.goal.teams && cfg.goal.teams[lg];
    if (set) return set;
    const nm = header().name || ((document.querySelector('.retired-card-player strong') || {}).textContent || '').trim();
    const re = { KBO: /KBO/, NPB: /NPB|일본/, MLB: /MLB|MAJOR/, CPBL: /CPBL|대만/ }[lg];
    const cnt = {};
    LOG.filter((r) => r.선수 === nm && re.test(r.리그) && r.팀 && Number(r.경기) > 0).forEach((r) => { cnt[r.팀] = (cnt[r.팀] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map((x) => x[0])[0] || '';
  }
  rule('목표: 회귀 특전', (c) => goalActive() && c.scope.matches('.rebirth-backdrop:not(.rebirth-picker-backdrop)') && !!c.scope.querySelector('.rebirth-options'), (c) => {
    const opt = (re) => $$('.rebirth-options button', c.scope).find((b) => re.test(txt(b)));
    const selEl = c.scope.querySelector('.rebirth-selection'), sel = selEl ? txt(selEl) : '';
    const want = wantCurve();
    if (!S.curveDone) {
      if (!sel.includes('성장유형: ' + KO_CURVE[want])) return { el: opt(/성장 유형 선택/), t: '성장 유형 선택' };
      S.perk = 'GROWTH';
    } else {
      if (!/KBO .+MLB|MLB .+NPB|NPB .+CPBL/.test(sel)) return { el: opt(/희망 구단 선택/), t: '희망 구단 선택' };
      S.perk = 'DRAFT';
    }
    saveS();
    const go = $$('button.primary-action', c.scope).find((b) => !b.disabled);
    if (!go) return 'WAIT:회귀 가능 여부 확인 중';
    const t = txt(go);
    if (/회귀 이어가기|광고 보상으로 회귀|구매한 회귀로 이어가기/.test(t)) return { el: go, t, hardOk: true };
    if (/사인볼 5개로 회귀/.test(t)) {
      if (NATIVE) { const ad = $$('button', c.scope).find((b) => /광고 1회 시청후 회귀/.test(txt(b))); return 'STOP:광고를 시청해 주세요 — ' + (ad ? "'광고 1회 시청후 회귀'" : "'광고 보상 확인'") + '을 누르고 광고가 끝나면 이어서 진행합니다'; }
      if (!cfg.rebirthSignball && !(cfg.rebirthAsk && S.rebirthApproved) && !HO()) return 'STOP:사인볼 5개로 회귀 — 직접 눌러 주세요 (설정에서 자동 가능)'; // 회귀 확인에서 허락했으면 사인볼 사용도 허락한 것으로 봄
      return { el: go, t, hardOk: true };
    }
    return 'STOP:회귀 버튼 상태를 모르겠어요: ' + t.slice(0, 20);
  }, { trusted: true });
  rule('목표: 성장 유형 고르기', (c) => goalActive() && !!c.scope.querySelector('.rebirth-picker-options'), (c) => {
    const want = wantCurve();
    const intro = c.scope.querySelector('.rebirth-growth-intro');
    const cur = ((intro ? intro.textContent : '').match(/:\s*(\S+)/) || [])[1];
    if (cur === KO_CURVE[want] || S.curveDone) { // 이미 원하는 유형 → 성장 특전은 건너뛰고 희망 구단으로
      if (!S.curveDone) { S.curveDone = true; saveS(); notify('이미 ' + cur + ' → 희망 구단 특전으로'); }
      const cancel = $$('button', c.scope).find((x) => txt(x) === '취소');
      return cancel ? { el: cancel, t: '취소' } : 'STOP:성장 유형 창의 취소 버튼을 못 찾았어요';
    }
    const b = $$('.rebirth-picker-options button', c.scope).find((x) => txt(x) === KO_CURVE[want]);
    if (b && b.getAttribute('aria-pressed') !== 'true') return { el: b, t: KO_CURVE[want] };
    return find(c.list, /^선택 완료/);
  }, { trusted: true });
  rule('목표: 회귀 희망 구단', (c) => goalActive() && !!c.scope.querySelector('.rebirth-team-picker-leagues'), (c) => {
    for (const grp of $$('.rebirth-team-picker-league', c.scope)) {
      const lg = txt(grp.querySelector('h3 span'));
      const labels = $$('label', grp);
      if (labels.some((l) => l.querySelector('input').checked)) {
        const w = wantTeam(lg), on = labels.find((l) => l.querySelector('input').checked);
        if (!w || txt(on).includes(w) || w.includes(txt(on))) continue;
      }
      const w = wantTeam(lg);
      const pick = (w && labels.find((l) => txt(l).includes(w) || w.includes(txt(l)))) || labels.find((l) => l.querySelector('input').checked) || labels[0];
      if (pick && !pick.querySelector('input').checked) return { el: pick.querySelector('input'), t: lg + ' ' + txt(pick) };
    }
    return find(c.list, /^선택 완료/);
  }, { trusted: true });
  rule('목표: 광고 없음', (c) => goalActive() && c.scope.querySelector('.rebirth-ad-unavailable'), (c) => {
    const go = c.list.find((b) => /primary-action/.test(b.cls));
    if (go && /보유 회귀권으로 시작/.test(go.t)) return { el: go.el, t: go.t, hardOk: true };
    if (go && /사인볼 5개로 시작/.test(go.t) && (cfg.rebirthSignball || (cfg.rebirthAsk && S.rebirthApproved) || HO())) return { el: go.el, t: go.t, hardOk: true };
    return 'STOP:시청할 광고가 없어요 — 사인볼로 할지 직접 정해 주세요';
  }, { trusted: true });
  // 회귀가 시작되면 생 번호 올리기
  // 회귀가 시작됐는지: 규칙 순서와 상관없이 매 틱 먼저 확인 (회귀 직후 선수 생성 화면에서도 놓치지 않게)
  // 영구결번 연출에 나오는 이번 커리어 카드에서 PA 줄을 미리 읽어 둠 (남길 커리어 비교에 정확한 TR 사용)
  function peekRows() {
    if (!goalActive() || S.retireDecision) return;
    const seq = document.querySelector('.number-retirement-sequence');
    if (!seq) return;
    const tc = (e) => ((e && e.textContent) || '').trim();
    const rows = $$('.retired-card-prime-row', seq).map((r) => { const g = r.querySelector('strong'); const cls = g ? g.className : ''; return { label: tc(r.querySelector('span')), score: num(tc(r.querySelector('b'))), splus: /grade-splus/.test(cls) ? true : /grade-/.test(cls) ? false : null }; }).filter((r) => r.label && !isNaN(r.score));
    if (rows.length < 5) return;
    const sig = JSON.stringify(rows);
    if (S.peek && S.peek.lifeId === S.lifeId && JSON.stringify(S.peek.rows) === sig) return;
    S.peek = { lifeId: S.lifeId, rows }; saveS();
  }
  function checkRebirthStarted() {
    if (HO() && !S.retireDecision && document.querySelector('.rebirth-backdrop, .rebirth-picker-backdrop')) { S.retireDecision = 'REBIRTH'; S.rebirthApproved = true; saveS(); } // 사용자가 회귀 버튼을 누름 = 이번 회귀 허락
    if (!(goalActive() || HO()) || !/^(REBIRTH|RETRY)$/.test(S.retireDecision || '')) return;
    if (document.querySelector('.retired-card-panel, .rebirth-backdrop, .rebirth-picker-backdrop')) return;
    if (!document.querySelector('.career-shell, .ability-candidate-slot, .ability-finalize-button')) return;
    if (S.retireDecision === 'RETRY' && S.polishing) S.polish = (S.polish || 0) + 1;
    else if (S.retireDecision === 'RETRY') S.retry = (S.retry || 0) + 1; else { S.life = life() + 1; S.retry = 0; }
    S.polishing = false; S.rebirthApproved = false; S.prospect = '';
    if (S.perk === 'GROWTH') S.curveDone = true; // 고른 성장 유형은 다음 회귀에도 이어짐
    Object.assign(S, { retireDecision: '', trainBonus: 0, abortStrike: 0, league: '', team: '', resetPhase: '', lifeId: Date.now().toString(36), stepIdx: 0 });
    saveS(); notify(life() + '생 시작 (회귀)');
  }
  // 회귀 후 은퇴: 남길 커리어 → 이번 커리어
  // 회귀한 생의 은퇴: 이전·이번 중 남길 커리어
  //   ① 이번이 목표를 다 채웠을 수 있으면 이번 ② (영결·명전 목표) 진척이 많은 쪽 ③ TR 높은 쪽
  //   이번 커리어의 능력치 줄은 이 화면에 없어서, 영구결번 연출 카드에서 읽었으면 그 값, 아니면
  //   'PA 총합 ÷ 5 + (이전 카드 TR − 이전 PA 총합 ÷ 5)'로 추정 (같은 선수라 포지션 가중 차이가 비슷)
  function compactInfo(btn) {
    const tc = (e) => ((e && e.textContent) || '').trim();
    const sc = $$('.retired-card-summary-score', btn);
    const paEl = sc.find((x) => /PA/.test(x.getAttribute('aria-label') || '') || /^PA/.test(tc(x.querySelector('small'))));
    const lsEl = sc.find((x) => x !== paEl);
    const honors = $$('.retired-card-honors b', btn).map(tc);
    return { name: tc(btn.querySelector('.retired-card-player strong')), pa: num(tc(paEl && paEl.querySelector('strong')).replace(/,/g, '')), ls: num(tc(lsEl && lsEl.querySelector('strong')).replace(/,/g, '')), rn: new Set(honors.filter((x) => /영구결번/.test(x)).map((x) => x.replace(/\s*영구결번/, ''))), hof: honors.includes('HOF') || !!btn.querySelector('[data-hof="true"]') };
  }
  function keepChoice(prev, cur) {
    if (!cfg.keepByTR) return ['CURRENT', '설정: 항상 이번 커리어'];
    const P = PRI();
    const kc = S.keptCard && (!prev.name || S.keptCard.name === prev.name) ? S.keptCard : null;
    const peek = S.peek && S.peek.lifeId === S.lifeId ? S.peek.rows : null;
    const curTR = peek ? cardTR(peek) : kc && !isNaN(kc.tr) && cur.pa > 0 ? cur.pa / 5 + (kc.tr - kc.pasum / 5) : NaN;
    const prevTR = kc ? kc.tr : NaN;
    const allS = (rows) => { const side = S.side === 'HITTER' ? HSTAT : PSTAT; const m = rows.filter((r) => side.includes(r.label) && !(isDH() && r.label === '수비')); return m.length > 0 && m.every((r) => (r.splus === null ? r.score >= 98 : r.splus)); };
    const full = (x, rows, tr) => (!P.has('RN') || x.rn.size >= 4) && (!P.has('HOF') || x.hof) && (!P.has('LS') || !cfg.goal.minLS || x.ls >= cfg.goal.minLS)
      && (!P.has('PA') || (cfg.goal.minPAsum > 0 && !isDH() ? (rows ? sidePA(rows) : x.pa) >= cfg.goal.minPAsum : rows ? allS(rows) : x.pa >= (isDH() ? 392 : 490))) && (!(cfg.goal.minTR > 0) || !(tr < cfg.goal.minTR));
    const f = (v) => (isNaN(v) ? '?' : v.toFixed(1));
    if (full(cur, peek, curTR)) {
      // 둘 다 목표를 채웠으면(다듬기 회귀) TR 높은 쪽
      if (kc && kc.pass && !isNaN(prevTR) && !isNaN(curTR) && prevTR > curTR + (peek ? 0 : 0.5)) return ['PREVIOUS', '둘 다 목표 달성 · TR 이전 ' + f(prevTR) + ' > 이번 ' + f(curTR) + (peek ? '' : '(추정)')];
      return ['CURRENT', '이번 커리어가 목표를 채웠을 수 있음' + (kc && kc.pass ? ' · TR 이번 ' + f(curTR) + ' ≥ 이전 ' + f(prevTR) : '')];
    }
    if (kc && kc.pass) return ['PREVIOUS', '이전 커리어가 목표 달성'];
    if (P.has('RN') || P.has('HOF')) {
      const pr = (x) => x.rn.size + (x.hof ? 1 : 0);
      if (pr(cur) !== pr(prev)) return pr(cur) > pr(prev) ? ['CURRENT', '영결·명전 진척 이번 ' + pr(cur) + ' > 이전 ' + pr(prev)] : ['PREVIOUS', '영결·명전 진척 이전 ' + pr(prev) + ' > 이번 ' + pr(cur)];
    }
    if (isNaN(curTR) || isNaN(prevTR)) return ['CURRENT', 'TR 비교 불가 → 이번'];
    const margin = peek ? 0 : 0.5; // 추정값이면 0.5 여유
    return prevTR > curTR + margin ? ['PREVIOUS', 'TR 이전 ' + f(prevTR) + ' > 이번 ' + f(curTR) + (peek ? '' : '(추정)')] : ['CURRENT', 'TR 이번 ' + f(curTR) + (peek ? '' : '(추정)') + ' ≥ 이전 ' + f(prevTR)];
  }
  rule('태생 리세: 남길 커리어', (c) => HO() && /남길 커리어를 선택해 주세요/.test(c.text), () => 'STOP:두 인생 중 남길 커리어를 직접 골라 주세요');
  rule('목표: 남길 커리어', (c) => goalActive() && /남길 커리어를 선택해 주세요|이 커리어를 보관할까요/.test(c.text), (c) => {
    if (/이 커리어를 보관할까요/.test(c.text)) return c.list.find((b) => /primary-action/.test(b.cls)) || 'STOP:커리어 보관 확인 버튼을 못 찾았어요';
    const cards = $$('.rebirth-career-card-select', c.scope);
    const curB = cards.find((b) => /이번/.test(b.getAttribute('aria-label') || '')) || cards[cards.length - 1];
    const prevB = cards.find((b) => /이전/.test(b.getAttribute('aria-label') || '')) || cards[0];
    if (prevB && prevB.disabled && /확인 중/.test(txt(prevB))) return 'WAIT:이전 커리어 불러오는 중';
    if (prevB && prevB.disabled && /불러오지 못했/.test(txt(prevB))) { // 이전 커리어를 못 불러오면 '이번'으로 넘기지 않고 다시 확인 → 그래도 안 되면 멈춤 (이전이 더 좋을 수 있음)
      const retry = find(c.list, /^이전 커리어 다시 확인/);
      S.keepRetry = (S.keepRetry || 0) + 1; saveS();
      if (retry && S.keepRetry <= 3) return retry;
      return 'STOP:이전 커리어를 불러오지 못했어요 — 네트워크 확인 후 직접 골라 주세요 (이번 커리어로 넘기면 이전 기록은 사라짐)';
    }
    S.keepRetry = 0;
    let pick = curB, why = '이번 커리어';
    if (prevB && curB && prevB !== curB && !prevB.disabled) {
      const [ch, reason] = keepChoice(compactInfo(prevB), compactInfo(curB));
      pick = ch === 'PREVIOUS' ? prevB : curB; why = reason;
      if (S.keepWhy !== reason) { S.keepWhy = reason; saveS(); notify('남길 커리어: ' + (ch === 'PREVIOUS' ? '이전' : '이번') + ' — ' + reason); }
    }
    if (pick && pick.getAttribute('aria-pressed') !== 'true') return { el: pick, t: (pick === prevB ? '이전' : '이번') + ' 커리어 (' + why + ')' };
    return c.list.find((b) => /primary-action/.test(b.cls) && !b.el.disabled) || 'WAIT:커리어 선택 확인 중';
  }, { trusted: true });
  // 저장 / 새 인생
  rule('목표: 저장', (c) => goalActive() && S.retireDecision === 'SAVE' && !c.inModal && !!document.querySelector('.retirement-my-club-action'), () => {
    const b = document.querySelector('.retirement-my-club-action');
    if (b.disabled) return 'STOP:MY CLUB 슬롯이 꽉 찼어요 — 미달 선수 정리 후 다시 진행해 주세요';
    return { el: b, t: 'MY CLUB 저장' };
  }, { trusted: true });
  rule('목표: 저장 확정', (c) => goalActive() && S.retireDecision === 'SAVE' && !!find(c.list, /^저장 확정/), (c) => {
    S.retireDecision = 'SAVED';
    const g = goal();
    if (cfg.lineupOn) {
      const s = curSlot();
      const nm = ((document.querySelector('.retired-card-player strong') || {}).textContent || header().name || '').trim();
      const tr = S.keptCard ? S.keptCard.tr : NaN;
      if (s && cfg.lineupWeakest) { // 팀 모드: 주전 자리부터 넣어 보고 밀린 선수는 아래로, 끝까지 밀린 선수는 삭제 (배치 작업)
        S.assign = { place: true, group: S.curGroup || groupOf(s.slot), slot: s.slot, pos: S.curPos || s.pos, name: nm, tr };
        S.slotPicked = false; save();
      } else if (s && S.saveReason !== 'TR') { s.done = true; s.savedName = nm; S.assign = { pos: s.pos, slot: s.slot, name: nm }; save(); }
    }
    saveS();
    return find(c.list, /^저장 확정/);
  }, { trusted: true });
  rule('목표: 새 인생', (c) => (cfg.goalOn) && /^(SAVED|NEW)$/.test(S.retireDecision || '') && !c.inModal && !!document.querySelector('.retirement-new-life-action'), () => {
    const home = document.querySelector('.career-home-button');
    if (S.assign && home) { Object.assign(S, { retireDecision: '', life: 1, retry: 0, polish: 0, chainTR: 0, ownD: [], rebirthApproved: false, bestTR: 0, bestAt: 0, prospect: '', trainBonus: 0, abortStrike: 0, league: '', team: '', abilities: {}, resetPhase: 'new', curveDone: false, perk: '', stepIdx: 0 }); saveS(); cfg.resetOn = true; save(); return { el: home, t: '홈 (라인업 배치 먼저)' }; }
    return { el: document.querySelector('.retirement-new-life-action'), t: '새 인생' };
  }, { trusted: true });
  rule('목표: 새 인생 확정', (c) => /^(SAVED|NEW)$/.test(S.retireDecision || '') && !!find(c.list, /^새 인생 시작$/), (c) => {
    Object.assign(S, { retireDecision: '', life: 1, retry: 0, polish: 0, chainTR: 0, ownD: [], rebirthApproved: false, bestTR: 0, bestAt: 0, prospect: '', trainBonus: 0, abortStrike: 0, league: '', team: '', abilities: {}, resetPhase: 'new', curveDone: false, perk: '', lifeId: '', stepIdx: 0 });
    saveS(); cfg.resetOn = true; save();
    return find(c.list, /^새 인생 시작$/);
  }, { trusted: true });
  // 3생 포스팅: 루트상 다음이 MLB이고 이 리그 목표 시즌을 채웠으면 포스팅 요청
  rule('포스팅 진행', (c) => wantLeave() && (nextStep() || { lg: [] }).lg.includes('MLB') && /포스팅/.test(c.text) && !!find(c.list, /^(MLB )?포스팅 (신청|요청)$/) && !c.scope.querySelector('.ready-player-type, .stove-training-entry'), (c) => find(c.list, /^(MLB )?포스팅 (신청|요청)$/), { trusted: true });

  // 영구결번·명예의 전당 연출: 화면 전체 탭 버튼 (타이머가 끝나야 눌림)
  rule('은퇴 연출 넘기기', (c) => !!document.querySelector('.number-retirement-sequence .number-retirement-tap'), () => {
    const b = document.querySelector('.number-retirement-sequence .number-retirement-tap');
    return b.disabled ? 'WAIT:은퇴 연출 진행 중' : { el: b, t: b.getAttribute('aria-label') || '연출 넘기기' };
  }, { trusted: true });
  rule('은퇴 순위', (c) => !!hasCls(c, 'retirement-daily-rank-continue'), (c) => hasCls(c, 'retirement-daily-rank-continue'));
  rule('레거시 점수', (c) => /LEGACY SCORE/.test(c.text) && !!find(c.list, /^통산 기록 보기/), (c) => find(c.list, /^통산 기록 보기/));
  rule('은퇴 완료', (c) => !!c.scope.querySelector('.retirement-new-life-action, .retired-player-card'), () => (HO() ? 'STOP:은퇴 카드 — 회귀 버튼·특전·회귀 시작은 직접 눌러 주세요. 특별훈련부터 다음 생 은퇴까지 자동으로 이어가요' : 'STOP:은퇴 완료 — 회귀·저장·새 인생은 직접 골라 주세요'));

  // ── 6-13. 나머지 선택 화면은 멈춤, 버튼 하나뿐인 안내는 누름
  rule('선택지', (c) => c.inCareer && (!!c.scope.querySelector('.fa-offer-card, .career-decision-confirm, .pv-market-retire') || (c.list.length >= 2 && c.list.every((b) => !/→$|^확인$|^다음/.test(b.t)))), (c) => 'STOP:' + shortTitle(c) + ' — 직접 골라 주세요');
  rule('단일 확인', (c) => c.inCareer && c.list.length === 1 && !NEVER.test(c.list[0].t) && !/stp-|spt-|ptp-|atp-|tp-hold|tp-tap|choice-card|fa-offer-card|tb-|pvp-|shop-/.test(c.list[0].cls), (c) => c.list[0]);

  function shortTitle(c) {
    const hs = $$('h1,h2,h3', c.scope).filter(visible).map(txt).filter((t) => t.length >= 2);
    if (hs.length) return hs[hs.length - 1].slice(0, 24);
    return '선택 화면';
  }

  // ═════════════════════════════════════════════
  // 7. 선택 규칙 세부
  // ═════════════════════════════════════════════
  const PSTAT = ['구속', '구위', '제구', '체력', '위기관리'];
  const HSTAT = ['컨택', '파워', '선구안', '주력', '수비'];
  const ab = (k) => (S.abilities && typeof S.abilities[k] === 'number' ? S.abilities[k] : NaN);

  // 스토브리그 이벤트 카드: 문서의 기본 선택표
  function chooseEvent(c) {
    const opts = c.list.filter((b) => /choice-card|cv2-choice/.test(b.cls) || !/→$|^확인/.test(b.t));
    if (cfg.eventPolicy === 'ask') return 'STOP:' + shortTitle(c) + ' — 직접 골라 주세요';
    const pick = (re) => opts.find((b) => re.test(b.t));
    const T = c.text;
    let want = null;
    if (/트레이드 제안/.test(T)) want = pick(/^원소속팀 잔류/);
    else if (/주장 선임 제안/.test(T)) want = pick(/^주장 수락/);
    else if (/부상 뒤, 개막/.test(T)) want = pick(/^회복 기간을 끝까지/);
    else if (/처음 받은 1군의 자리/.test(T)) want = pick(/^주전 경쟁 기회를 요청한다/);
    else if (/베테랑이 지키려는 것/.test(T)) want = pick(/^내 자리는 경기에서 지킨다/);
    else if (/마무리 자리를 다시 묻다/.test(T)) want = (!cfg.pitcherRoles.length || cfg.pitcherRoles.includes('마무리')) ? pick(/^한 시즌 더 마무리로/) : pick(/^필승조에서/);
    else if (/2군에서 받은 두 가지 과제/.test(T)) {
      if (cfg.eventPolicy === 'strong') want = pick(/^한 가지 무기/);
      else if (cfg.eventPolicy === 'random') want = opts[Math.floor(Math.random() * opts.length)];
      else want = pick(/^두 약점을/);
      if (cfg.eventPriority && new RegExp(cfg.eventPriority).test(T.split('한 가지 무기')[0]) && /더 날카롭게/.test(T)) {
        // 우선 능력치가 '강점' 쪽에 있으면 무기 선택
        const strongName = (T.match(/바로 통할 (\S+?)[을를] 더 날카롭게/) || [])[1];
        if (strongName === cfg.eventPriority) want = pick(/^한 가지 무기/);
      }
    } else if (/무너진 타격/.test(T)) want = lower('선구안', '파워') === '선구안' ? pick(/^존을 좁히고/) : pick(/^강한 타구를/);
    else if (/떨어진 구속/.test(T)) want = (ab('구속') < Math.min(ab('구위'), ab('제구'))) ? pick(/^동작을 다시 만들어/) : pick(/^구위와 제구로/);
    else if (/포수의 자리를/.test(T)) want = (ab('수비') <= Math.min(ab('컨택'), ab('파워'))) ? pick(/^수비와 경기 운영/) : pick(/^타격으로/);
    if (cfg.eventPriority && !want) want = opts.find((b) => b.t.includes(cfg.eventPriority));
    if (!want && cfg.eventPolicy === 'random' && opts.length) want = opts[Math.floor(Math.random() * opts.length)];
    return want || 'STOP:' + shortTitle(c) + ' — 처음 보는 이벤트라 직접 골라 주세요';
  }
  function lower(a, b) {
    if (cfg.eventPriority === a) return a;
    if (cfg.eventPriority === b) return b;
    const va = ab(a), vb = ab(b);
    if (isNaN(va) || isNaN(vb)) return a;
    if (cfg.eventPolicy === 'strong') return va >= vb ? a : b;
    return va <= vb ? a : b;
  }

  // FA 자격: 루트상 아직 이 리그 목표 시즌을 못 채웠으면 보류, 채웠으면 신청
  function faDecision(c) {
    if (cfg.transfer === 'manual') return 'STOP:FA 자격 — 직접 결정해 주세요';
    const sel = c.list.find((b) => /selected/.test(b.cls));
    const confirm = find(c.list, /^(FA 신청 확정|자격 보류 확정|.*확정)/);
    const n = seasonsWithTeam();
    const route = parseRoute();
    const here = S.league || 'KBO';
    const idx = curIdx();
    if (!LOG.length || n === 0) return 'STOP:FA 자격 — 이 팀 시즌 기록이 없어 판단 못 함 (직접 결정)';
    const lastStep = idx >= 0 && idx === route.length - 1;
    const stay = idx >= 0 && (n < (routeSteps()[idx] || {}).n || lastStep); // 루트 마지막 리그면 같은 팀에 남기
    const wantTitle = stay ? /^자격을 보류한다/ : /^FA를 신청한다/;
    if (!stay && (idx < 0 || idx === route.length - 1)) return 'STOP:FA 자격 — 루트의 마지막 리그예요 (같은 팀 ' + n + '시즌)';
    if (sel && wantTitle.test(sel.t) && confirm) return confirm;
    return find(c.list, wantTitle) || 'STOP:FA 자격 화면 버튼을 못 찾았어요';
  }
  const parseRoute = () => routeSteps().map((st) => st.lg);
  function leagueChoice(c) {
    if (cfg.transfer === 'manual') return 'STOP:진출 리그 — 직접 골라 주세요';
    const route = parseRoute();
    const idx = curIdx();
    const next = route[idx + 1];
    if (!next) return 'STOP:루트에 다음 리그가 없어요';
    for (const lg of next) { const b = c.list.find((x) => x.t.startsWith(lg)); if (b) return b; }
    return 'STOP:' + next.join('/') + ' 제안이 없어요 — 직접 골라 주세요';
  }
  function offerChoice(c) {
    const confirm = find(c.list, /^계약 확정/);
    if (confirm && cfg.transfer === 'routeAll') return confirm;
    if (cfg.transfer !== 'routeAll') return 'STOP:구단 오퍼 — 직접 골라 주세요';
    const cards = c.list.filter((b) => /fa-offer-card/.test(b.cls));
    if (!cards.length) return 'STOP:오퍼가 없어요';
    const home = cards.find((b) => /원소속/.test(b.t)) || pickOrig(cards);
    const yrs = (b) => { const m = b.t.match(/(\d+)\s*년/); return m ? +m[1] : 0; };
    const best = home || cards.slice().sort((a, b) => yrs(b) - yrs(a) || num(b.t) - num(a.t))[0]; // 원소속 우선, 아니면 가장 긴 계약 (같은 팀 10시즌)
    return best;
  }

  // 리세: 후보 고르기 (각 후보를 눌러 SCOUT REPORT 를 읽은 뒤 결정)
  let candScores = {};
  function readScout(c) {
    const root = c.scope.querySelector('.ability-candidate-detail') || c.scope; // 스카우트 리포트(지금 고른 후보)만
    const lines = root.innerText.split('\n').map((s) => s.trim());
    const v = {};
    lines.forEach((s, i) => { if ([...PSTAT, ...HSTAT].includes(s) && /^[\d.]+$/.test(lines[i + 1] || '')) v[s] = parseFloat(lines[i + 1]); });
    if (!Object.keys(v).length) { const re = new RegExp('(' + [...PSTAT, ...HSTAT].join('|') + ')\\s*([\\d]+(?:\\.\\d+)?)', 'g'); let m; while ((m = re.exec(root.innerText))) if (!(m[1] in v)) v[m[1]] = parseFloat(m[2]); } // 이름·값이 한 줄에 붙어 있을 때
    return v;
  }
  // 포지션별 수비 적성 기대값 (게임 코드 Ct의 랜덤 빼고)
  const APT = { 포수: (v) => v.수비, '1루수': (v) => v.수비 * 0.8 + v.파워 * 0.2, '2루수': (v) => v.수비 * 0.65 + v.주력 * 0.35, '3루수': (v) => v.수비 * 0.8 + v.파워 * 0.2, 유격수: (v) => v.수비 * 0.7 + v.주력 * 0.3, 좌익수: (v) => v.수비 * 0.7 + v.주력 * 0.2 + v.파워 * 0.1, 중견수: (v) => v.수비 * 0.55 + v.주력 * 0.45, 우익수: (v) => v.수비 * 0.75 + v.주력 * 0.15 + v.파워 * 0.1 };
  function pickCandidate(c) {
    const slots = $$('.ability-candidate-slot', c.scope).filter(visible);
    const active = slots.findIndex((s) => /active/.test(s.className));
    // 회귀 특전 훈련을 한 뒤에는 그 후보로 확정되어 다른 후보가 잠김 → 바로 진행
    if (active >= 0 && !slots[active].disabled && slots.some((s, i) => i !== active && s.disabled)) return find(c.list, /^이 후보로 진행/) || 'WAIT:후보 진행 버튼을 기다리는 중';
    if (HO() && Number.isInteger(S.keepSlot) && slots[S.keepSlot]) { // 태생 리세로 고른 후보(적성) 그대로 유지
      if (active !== S.keepSlot) return slots[S.keepSlot].disabled ? 'STOP:태생 리세로 고른 후보가 잠겨 있어요 — 직접 확인해 주세요' : { el: slots[S.keepSlot], t: '후보 ' + (S.keepSlot + 1) + ' 유지 (태생 리세)' };
      return find(c.list, /^이 후보로 진행/) || 'WAIT:후보 진행 버튼을 기다리는 중';
    }
    if (cfg.candidatePick === 'ask') return 'STOP:능력치 후보 — 직접 골라 주세요';
    // 타자 목표(수비 포지션): 후보마다 수비 적성이 달라(게임 코드: 시작 수비·주력·파워 + 랜덤, 4~18) 포지션 점수가 ±20%쯤 달라짐 → 3명 다 보고 그 포지션 기대 적성이 가장 높은 후보
    const fitPos = (goal().positions || []).filter((x) => APT[x]);
    if (cfg.candidatePick === 'first' && fitPos.length && cfg.targetSides.includes('HITTER')) {
      if (active < 0) return { el: slots[0], t: '후보 1 보기' };
      const v = readScout(c);
      if (HSTAT.some((k) => !isNaN(v[k]))) {
        candScores[active] = Math.max(...fitPos.map((x) => APT[x](v))) + 0.001 * HSTAT.reduce((a, k) => a + (v[k] || 0) * ((TRW[fitPos[0]] || {})[k] || 0), 0);
        const miss = slots.findIndex((sl, i) => !(i in candScores) && !sl.disabled);
        if (miss >= 0) return { el: slots[miss], t: '후보 ' + (miss + 1) + ' 수비 적성 보기' };
        const best = Object.entries(candScores).sort((a, b) => b[1] - a[1])[0][0] | 0;
        if (active !== best) return { el: slots[best], t: '후보 ' + (best + 1) + ' 선택 (' + fitPos[0] + ' 적성 ' + candScores[best].toFixed(1) + ')' };
        candScores = {};
        return find(c.list, /^이 후보로 진행/);
      }
    }
    if (cfg.candidatePick === 'first') return active === 0 ? find(c.list, /^이 후보로 진행/) : { el: slots[0], t: '후보 1' };
    if (cfg.candidatePick === 'random') { const r = S.randPick ?? (S.randPick = Math.floor(Math.random() * slots.length)); return active === r ? (delete S.randPick, find(c.list, /^이 후보로 진행/)) : { el: slots[r], t: '후보 ' + (r + 1) }; }
    // balanced: 모든 후보 점수 읽기
    const v = readScout(c);
    if (active >= 0 && Object.keys(v).length) {
      const ps = PSTAT.map((k) => v[k]).filter((x) => !isNaN(x)), hs = HSTAT.map((k) => v[k]).filter((x) => !isNaN(x));
      const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
      const sd = (a) => Math.sqrt(mean(a.map((x) => (x - mean(a)) ** 2)));
      candScores[active] = (ps.length ? Math.min(...ps) : 0) + (hs.length ? Math.min(...hs) : 0) - 0.01 * (sd(ps) + sd(hs));
    }
    const missing = slots.findIndex((s, i) => !(i in candScores));
    if (missing >= 0) return { el: slots[missing], t: '후보 ' + (missing + 1) + ' 보기' };
    const best = Object.entries(candScores).sort((a, b) => b[1] - a[1])[0][0] | 0;
    if (active !== best) return { el: slots[best], t: '후보 ' + (best + 1) + ' 선택' };
    candScores = {};
    return find(c.list, /^이 후보로 진행/);
  }
  // 리세: 투구폼·포지션(허용 목록 → 추천 우선) + 낮은 능력치 2개 집중. 화면 상태를 보고 모자란 것만 누른다
  function growthSetup(c) {
    const FORMS = ['오버핸드', '스리쿼터', '사이드암', '언더핸드'];
    const POS = ['포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];
    const on = (b) => /active|selected/.test(b.cls) || b.el.getAttribute('aria-pressed') === 'true';
    const base = (b) => b.t.replace(/\s*추천$/, '');
    const formBtns = c.list.filter((b) => FORMS.includes(base(b)));
    const posBtns = c.list.filter((b) => POS.includes(base(b)));
    const gf = cfg.goalOn && goal().form; // 선수마다 정한 투구폼 (비우면 아래 공통 설정 → 구단 추천)
    const f = formBtns.length ? pickAllowed(formBtns, gf ? [gf] : cfg.pitchForms, null) : null;
    if (formBtns.length && !f) return 'STOP:고른 투구폼이 없어요';
    if (f && !on(f)) return f;
    const ps = posBtns.length ? pickAllowed(posBtns, cfg.hitterPositions, readScout(c)) : null;
    if (posBtns.length && !ps) return 'STOP:고른 야수 포지션이 없어요';
    if (ps && !on(ps)) return ps;
    if (cfg.focusPick === 'tr2') {
      const statBtns = c.list.filter((b) => /^(구속|구위|제구|체력|위기관리|컨택|파워|선구안|주력|수비) [\d.]+$/.test(b.t));
      const role = cfg.pitcherRoles.length === 1 ? cfg.pitcherRoles[0] : '선발';
      const pos = ps ? base(ps) : '지명타자';
      for (const [grp, w] of [[PSTAT, TRW[role]], [HSTAT, TRW[pos] || TRW['지명타자']]]) {
        const g = statBtns.filter((b) => grp.includes(b.t.split(' ')[0]));
        if (!g.length) continue;
        const want = g.slice().sort((x, y) => (w[y.t.split(' ')[0]] || 0) - (w[x.t.split(' ')[0]] || 0)).slice(0, 2);
        const wrongOn = g.filter((b) => on(b) && !want.includes(b));
        if (wrongOn.length) return wrongOn[0];
        const missing = want.find((b) => !on(b));
        if (missing) return missing;
      }
    }
    if (cfg.focusPick === 'weak2') {
      const statBtns = c.list.filter((b) => /^(구속|구위|제구|체력|위기관리|컨택|파워|선구안|주력|수비) [\d.]+$/.test(b.t));
      const pos = ps ? base(ps) : null;
      for (const grp of [PSTAT, HSTAT]) {
        // TR 반영 비율이 0인 능력치(예: 지명타자 수비)는 집중 대상에서 뺀다
        const g = statBtns.filter((b) => grp.includes(b.t.split(' ')[0]) && !(grp === HSTAT && pos && TRW[pos] && TRW[pos][b.t.split(' ')[0]] === 0));
        if (!g.length) continue;
        const want = g.slice().sort((x, y) => num(x.t) - num(y.t)).slice(0, 2);
        const wrongOn = statBtns.filter((b) => grp.includes(b.t.split(' ')[0]) && on(b) && !want.includes(b));
        if (wrongOn.length) return wrongOn[0];
        const missing = want.find((b) => !on(b));
        if (missing) return missing;
      }
    }
    { // 고른 집중성장 능력치 기억 (특별훈련 종목 고를 때 씀)
      const fo = c.list.filter((b) => /^(구속|구위|제구|체력|위기관리|컨택|파워|선구안|주력|수비) [\d.]+$/.test(b.t) && on(b)).map((b) => b.t.split(' ')[0]);
      if (fo.length) { const k = PSTAT.includes(fo[0]) ? 'PITCHER' : 'HITTER'; S.focus = Object.assign({}, S.focus, { [k]: fo }); saveS(); }
    }
    return find(c.list, /^이대로 선수 생성/) || 'WAIT:선수 생성 버튼을 기다리는 중';
  }
  // 리세: 고3 결과 판정
  function inCut(v, spec) {
    if (isNaN(v)) return false;
    return String(spec || '').split(',').map((s) => s.trim()).filter(Boolean).some((r) => {
      const [a, b] = r.split('-');
      const lo = a === '' ? -Infinity : parseFloat(a), hi = b === undefined || b === '' ? Infinity : parseFloat(b);
      return v >= lo - 1e-9 && v <= hi + 1e-9;
    });
  }
  function judgeHighSchool() {
    const h = header();
    const single = isNaN(h.pOvr) && isNaN(h.hOvr); // 투타겸업이 아니면 OVR 하나만 보임
    const p = single ? (hitterOnly() ? NaN : h.ovr) : h.pOvr, t = single ? (hitterOnly() ? h.ovr : NaN) : h.hOvr;
    const okP = cfg.targetSides.includes('PITCHER') && inCut(p, cfg.resetCutP), okH = cfg.targetSides.includes('HITTER') && inCut(t, cfg.resetCutH);
    S.resetCount = (S.resetCount || 0) + 1;
    const nowJ = Date.now(), took = S.lastJudgeAt && nowJ - S.lastJudgeAt < 300000 ? ' · ' + ((nowJ - S.lastJudgeAt) / 1000).toFixed(1) + '초' : '';
    S.lastJudgeAt = nowJ;
    LOG.push({ key: 'reset|' + Date.now(), 선수: h.name, 연도: '리세', 나이: h.age, 리그: '고3', 팀: '', 경기: '', 기록: '투수 OVR ' + (isNaN(p) ? '-' : p) + ' / 타자 OVR ' + (isNaN(t) ? '-' : t) + took, 수상: okP || okH ? '통과' : '탈락', OVR: '', 능력치: '', 시각: new Date().toISOString() });
    saveLog(); renderLog();
    if (okP || okH) {
      S.side = okP && okH ? (p >= t ? 'PITCHER' : 'HITTER') : okP ? 'PITCHER' : 'HITTER';
      S.passMsg = '리세 통과! ' + (S.side === 'PITCHER' ? '투수 ' + p : '타자 ' + t) + ' (' + S.resetCount + '번째) — 목표: ' + sideKo() + '. 확인 후 진행해 주세요';
      S.resetPhase = 'passed'; S.abilities = {}; saveS();
      cfg.resetOn = false; save(); paint();
      if (RESET_ONLY) { S.passMsg = S.passMsg.replace(/ 확인 후 진행해 주세요$/, '') + ' — 리세 끝. 이제 특별훈련만 대신해요 (시즌은 직접 진행)'; saveS(); notify(S.passMsg.replace(/ 확인 후 진행해 주세요$/, '')); try { document.title = '✅ 리세 통과 — ' + document.title.replace(/^✅ 리세 통과 — /, ''); } catch (e) { /* 무시 */ } return 'STOP:' + S.passMsg.replace(/ 확인 후 진행해 주세요$/, '') + ' — 리세 끝. 이제 특별훈련만 대신해요 (시즌은 직접 진행 · 다시 리세하려면 OFF→홈에서 ON)'; }
      if (cfg.resetAutoContinue) { S.resetPhase = ''; S.lifeId = S.lifeId || Date.now().toString(36); saveS(); notify(S.passMsg.replace(/ 확인 후 진행해 주세요$/, '')); return 'WAIT:리세 통과 — 이어서 진행'; }
      return 'STOP:' + S.passMsg;
    }
    S.resetPhase = 'new'; saveS();
    return document.querySelector('.career-home-button') ? { el: document.querySelector('.career-home-button'), t: '탈락 → 새 인생' } : 'STOP:홈 버튼을 못 찾았어요';
  }

  // ═════════════════════════════════════════════
  // 7-9. 특별훈련 미니게임 자동 플레이 (프레임 단위)
  //   timing(컨택·위기관리·제구/선구안 일부): 마커가 중앙 ±6 안일 때 터치
  //   power(파워·구속): 90~99%에서 놓기 · stamina(체력): 페이스를 초록 구간 중앙에 유지
  //   steal(주력): 투구 시작 후 10번 연타 · memory(제구·선구안): 순서 기억 후 입력 · path(수비·구위): 길 따라 이동
  // ═════════════════════════════════════════════
  const AP = { mem: [], memRound: '', memAnswered: false, path: false, stamina: false, holding: false, stealDone: '', px: null, lastMemClick: '' };
  const key = (el, type, k = ' ') => el.dispatchEvent(new KeyboardEvent(type, { key: k, code: k === ' ' ? 'Space' : 'Enter', bubbles: true, cancelable: true }));
  const ptr = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 77, pointerType: 'touch', isPrimary: true, button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  (() => { // 합성 포인터는 캡처가 안 되므로 오류만 삼킴
    const orig = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function (id) { try { return orig.call(this, id); } catch (e) { /* 합성 입력 */ } };
  })();
  const roundOf = (root) => ((root.querySelector('.stp-round span') || {}).textContent || '');

  // 0점 모드: 투타겸업 회귀 고교 특훈에서 목표가 아닌 쪽 훈련 (전념 제안 = 투타 OVR 5점 차이를 빨리 만들기)
  const zeroMode = () => !!S.trainZero;
  function autoPlayFrame() {
    if (!cfg.on || !cfg.trainingAutoPlay || document.hidden) return;
    // 타이밍
    const tap = document.querySelector('.timing-training-preview .stp-tap');
    const marker = document.querySelector('.timing-training-preview .stp-marker');
    if (tap && marker && zeroMode()) { // 중앙에서 먼 곳(±30 밖)에서 터치 → 0점
      const x = parseFloat(marker.style.left), r = roundOf(tap.closest('section') || document);
      if (Math.abs(x - 50) >= 30 && AP.zeroTap !== r + '|' + (document.querySelector('.stp-feedback') || {}).textContent) { AP.zeroTap = r + '|' + (document.querySelector('.stp-feedback') || {}).textContent; key(tap, 'keydown'); key(tap, 'keyup'); }
      return;
    }
    if (tap && marker) {
      const x = parseFloat(marker.style.left), est = AP.px == null ? x : x + (x - AP.px);
      AP.px = x;
      if (Math.abs(x - 50) <= 4 && Math.abs(est - 50) <= 4) { key(tap, 'keydown'); key(tap, 'keyup'); AP.px = null; }
      return;
    }
    AP.px = null;
    // 힘 모으기
    const hold = document.querySelector('.power-training-preview .ptp-hold');
    if (hold) {
      const v = Number((document.querySelector('.ptp-meter') || {}).getAttribute?.('aria-valuenow'));
      if (!AP.holding && /길게 눌러/.test(hold.textContent)) { AP.holding = true; key(hold, 'keydown'); return; }
      if (AP.holding && zeroMode() && v >= 15 && v < 50) { AP.holding = false; key(hold, 'keyup'); return; } // 60% 미만 → 0점
      if (AP.holding && !zeroMode() && v >= 92 && v < 100) { AP.holding = false; key(hold, 'keyup'); }
      return;
    }
    AP.holding = false;
    // 체력 (페이스 유지)
    const sh = document.querySelector('.atp-hold');
    const gauge = document.querySelector('.atp-gauge');
    if (sh && gauge && zeroMode()) { // 0점 모드: 한 번 톡 → 페이스가 초록 구간 밖으로 떨어짐
      if (/눌러서 시작/.test(sh.textContent) && AP.zeroSta !== roundOf(sh.closest('section') || document)) { AP.zeroSta = roundOf(sh.closest('section') || document); key(sh, 'keydown'); key(sh, 'keyup'); }
      return;
    }
    if (sh && gauge) {
      const pace = Number(gauge.getAttribute('aria-valuenow'));
      const zone = gauge.querySelector('.atp-gauge-zone');
      const lo = zone ? parseFloat(zone.style.left) : 45, hi = zone ? lo + parseFloat(zone.style.width) : 65, mid = (lo + hi) / 2;
      const want = pace < mid || /눌러서 시작/.test(sh.textContent);
      if (want && !AP.stamina) { AP.stamina = true; key(sh, 'keydown'); }
      else if (!want && AP.stamina) { AP.stamina = false; key(sh, 'keyup'); }
      return;
    }
    if (AP.stamina) AP.stamina = false;
    // 도루
    const run = document.querySelector('.atp-run');
    if (run && zeroMode()) return;
    if (run) {
      const r = roundOf(run.closest('section') || document);
      if (run.getAttribute('data-ready') === 'true' && AP.stealDone !== r) {
        AP.stealDone = r;
        for (let i = 0; i < 10; i++) { key(run, 'keydown'); key(run, 'keyup'); }
      }
      return;
    }
    // 위치 기억
    const mem = document.querySelector('.mitt-memory-preview .mmp-board:not(.mmp-example)');
    if (mem) {
      const cells = Array.from(mem.querySelectorAll('button.mmp-cell'));
      const r = roundOf(mem.closest('section'));
      const shown = cells.map((b, i) => (b.classList.contains('mmp-reveal') ? i : -1)).filter((i) => i >= 0);
      const answering = cells.length && cells.every((b) => !b.disabled);
      if (!answering) {
        if (AP.memAnswered && shown.length === 0) { AP.mem = []; AP.memAnswered = false; } // 다음 시도 준비
        if (!AP.memAnswered && shown.length === 1 && AP.mem[AP.mem.length - 1] !== shown[0]) AP.mem.push(shown[0]);
      } else if (AP.mem.length) {
        AP.memAnswered = true; // 한 프레임에 하나씩, 앞 칸이 눌린 걸 확인하고 다음 칸
        // 0점 모드: 순서를 한 칸씩 밀어서 누름 → 모든 자리가 틀림
        const seq = !zeroMode() ? AP.mem : AP.mem.length > 1 ? [...AP.mem.slice(1), AP.mem[0]] : [AP.mem[0] === 0 ? 1 : 0];
        const next = seq.find((i) => cells[i] && cells[i].getAttribute('aria-pressed') !== 'true');
        const k = seq.indexOf(next);
        if (next != null && (k === 0 || cells[seq[k - 1]].getAttribute('aria-pressed') === 'true') && AP.lastMemClick !== next + '|' + r) { AP.lastMemClick = next + '|' + r; cells[next].click(); }
      }
      AP.memRound = r;
      return;
    }
    // 길 따라가기
    const board = document.querySelector('.spin-training-preview .spt-board');
    if (board && !board.disabled && !AP.path) {
      const d = (board.querySelector('path.spt-ring') || {}).getAttribute?.('d') || '';
      const pts = Array.from(d.matchAll(/[ML]\s*([\d.]+)[ ,]([\d.]+)/g)).map((m) => ({ x: +m[1], y: +m[2] }));
      if (pts.length < 2) return;
      AP.path = true;
      const rect = board.getBoundingClientRect();
      const at = (p) => [rect.left + (p.x / 100) * rect.width, rect.top + (p.y / 100) * rect.height];
      if (zeroMode()) { // 0점 모드: 출발점에서 길 밖으로 벗어남
        const far = { x: pts[0].x > 50 ? 3 : 97, y: pts[0].y > 50 ? 3 : 97 };
        ptr(board, 'pointerdown', ...at(pts[0]));
        let k = 0; const go = () => { k++; const f = k / 10; ptr(board, 'pointermove', ...at({ x: pts[0].x + (far.x - pts[0].x) * f, y: pts[0].y + (far.y - pts[0].y) * f })); if (k < 10) requestAnimationFrame(go); else { ptr(board, 'pointerup', ...at(far)); setTimeout(() => { AP.path = false; }, 300); } };
        requestAnimationFrame(go);
        return;
      }
      const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
      const total = seg.reduce((a, b) => a + b, 0);
      const dur = Math.min(1800, 500 + total * 5); // 3초 제한 안에
      const t0 = performance.now();
      ptr(board, 'pointerdown', ...at(pts[0]));
      const step = () => {
        const f = Math.min(1, (performance.now() - t0) / dur);
        let dist = f * total, k = 0;
        while (k < seg.length - 1 && dist > seg[k]) { dist -= seg[k]; k++; }
        const q = Math.min(1, dist / seg[k]);
        const p = { x: pts[k].x + (pts[k + 1].x - pts[k].x) * q, y: pts[k].y + (pts[k + 1].y - pts[k].y) * q };
        ptr(board, 'pointermove', ...at(p));
        if (f < 1) requestAnimationFrame(step);
        else { ptr(board, 'pointerup', ...at(pts[pts.length - 1])); setTimeout(() => { AP.path = false; }, 300); }
      };
      requestAnimationFrame(step);
    }
  }
  (function apLoop() { try { autoPlayFrame(); } catch (e) { /* 다음 프레임에 다시 */ } requestAnimationFrame(apLoop); })();

  // ═════════════════════════════════════════════
  // 8. 메인 루프: 화면이 0.08초 그대로면 누름 (판단이 들어가는 화면은 0.2초) · 눌렀는데 화면이 안 바뀌면 점점 길게 기다렸다 다시
  // ═════════════════════════════════════════════
  const TICK = 50;
  const fastMode = () => cfg.resetOn && ['new', 'candidate', 'hs'].includes(S.resetPhase);
  const timing = () => fastMode() ? { stable: 80, cooldown: 100, repeat: 12 } : { stable: 80, cooldown: 100, repeat: 8 };
  let lastSig = '', sigSince = 0, lastAct = 0, sameClick = 0, lastClickSig = '', alerted = '';
  let forceGo = false, playingPostseason = false;

  function context() {
    const scope = topScope();
    const list = meaningful(buttons(scope));
    const text = (scope.innerText || '').replace(/\n+/g, ' | ').slice(0, 2000);
    const inModal = scope !== document.querySelector('#root');
    const inCareer = !!document.querySelector('.career-home-button') || inModal;
    return { scope, list, text, inCareer, inModal };
  }

  function tick() {
    if (!cfg.on || document.hidden || (typeof taskBusy !== 'undefined' && taskBusy)) return;
    const c = context();
    const sig = c.text.slice(0, 500) + '#' + c.list.map((b) => b.t).join('/');
    const now = Date.now();
    if (sig !== lastSig) { lastSig = sig; sigSince = now; return; }
    const tm = timing();
    if (now - sigSince < tm.stable || now - lastAct < tm.cooldown) return;
    if (sig === lastClickSig && now - lastAct < 350 + 250 * sameClick) return; // 서버 응답 대기 중 같은 버튼 연타 방지

    if (forceGo && /^(REBIRTH|RETRY)$/.test(S.retireDecision || '') && !S.rebirthApproved && document.querySelector('.rebirth-entry .primary-action')) { forceGo = false; S.rebirthApproved = true; saveS(); setStatus('회귀 허락됨 → 진행', 'run'); return; }
    if (forceGo && S.resetPhase === 'ask') { forceGo = false; S.resetPhase = 'new'; saveS(); setStatus('리세 시작', 'run'); return; }
    if (forceGo) {
      forceGo = false;
      const go = c.list.find((b) => /primary-action/.test(b.cls) && /시즌 진행|진행 ?→?$/.test(b.t) && !/입대|상무/.test(b.t));
      if (go) return click(go, '▶ 진행', sig);
    }
    try { checkRebirthStarted(); peekRows(); } catch (e) { /* 무시 */ }
    const roTrain = TO();
    for (const r of R) {
      if (roTrain && (!/훈련|특훈|^리세: 통과$/.test(r.name) || r.name === '대학 특별훈련')) continue; // 리세 전용: 통과 뒤에는 특별훈련만
      let ok = false;
      try { ok = r.test(c); } catch (e) { ok = false; }
      if (!ok) continue;
      if (r.trusted && !fastMode() && now - sigSince < 200) return; // 선택지가 다 그려질 때까지 조금 더 (규칙 실행 전에 기다려야 상태가 꼬이지 않음)
      let res;
      try { res = r.act(c); } catch (e) { res = 'STOP:규칙 오류(' + r.name + ') — 직접 진행해 주세요'; }
      if (res == null) { setStatus('대기: ' + r.name, 'idle'); return; }
      if (typeof res === 'string' && res.startsWith('WAIT:')) { setStatus(res.slice(5), 'idle'); return; }
      if (typeof res === 'string' && res.startsWith('STOP:')) {
        // 태생 리세가 넘긴 선수: 은퇴 카드·남길 커리어(직접 고르기로 한 곳)·사인볼·광고 말고는 멈추지 않고 무난한 쪽을 자동으로 고름
        if (HO() && !/은퇴 카드|남길 커리어|회귀할 수 없는|광고|사인볼|안전장치/.test(res)) { const fb = hoFallback(c); if (fb) { notify('자동 선택: ' + res.slice(5, 40)); return click(fb, '자동(' + r.name + ')', sig); } }
        needUser(res.slice(5)); return;
      }
      const el = res.el || res;
      const t = res.t || txt(el);
      const hardOk = res.hardOk && /^(고3으로 회귀 열기|사인볼 5개로 (회귀|시작)|광고 보상으로 회귀|회귀 이어가기|구매한 회귀로 이어가기|보유 회귀권으로 시작)$/.test(t);
      if ((HARD_NEVER.test(t) && !hardOk) || (NEVER.test(t) && !r.trusted)) { needUser('안전장치: "' + t.slice(0, 20) + '" 는 직접 눌러 주세요'); return; }
      return click({ el, t }, r.name, sig);
    }
    setStatus('대기 중', 'idle');
  }

  // 넘겨받은 선수(HO)의 자동 선택: 위험한 버튼은 빼고 '보류·잔류·재계약 → 리그 이동 → 계약·입단 → 확정·진행' 순으로 고름
  function hoFallback(c) {
    const ok = c.list.filter((b) => !HARD_NEVER.test(b.t) && !NEVER.test(b.t) && !/^(취소|닫기|뒤로|←)/.test(b.t) && !/sangmu|active-duty/.test(b.cls));
    if (!ok.length) return null;
    const conf = ok.find((b) => /^(계약 확정|선택 확정|FA 신청 확정|자격 보류 확정|.*확정)$/.test(b.t));
    if (conf && ok.some((b) => /selected|active/.test(b.cls))) return conf;
    const orig = pickOrig(ok); if (orig) return orig; // 원래 팀이 있으면 그 팀
    const pref = [/^자격을 보류/, /원소속|재계약|잔류|현재 팀|유지|시즌 계속/, /^(CPBL|KBO|NPB|MLB|미국|대만|일본|해외 구단|아시아 구단)/, /계약|입단|제안|드래프트/, /확정|확인|진행|다음/];
    for (const re of pref) { const b = ok.find((x) => re.test(x.t)); if (b) return b; }
    return ok.find((b) => /primary-action/.test(b.cls)) || ok[0];
  }
  function click(b, why, sig) {
    if (sig === lastClickSig) sameClick++; else { sameClick = 0; lastClickSig = sig; }
    if (sameClick >= timing().repeat) { needUser('같은 화면에서 반복됨 — 확인해 주세요'); return; }
    lastAct = Date.now();
    alerted = '';
    setStatus(why + ' → ' + b.t.slice(0, 18), 'run');
    b.el.click();
  }

  function notify(msg) { setStatus('✔ ' + msg, 'run'); if (cfg.alertMode !== 'screen') { alerted = ''; } }
  function needUser(msg) {
    setStatus(msg, 'stop');
    if (alerted === msg) return; // 같은 이유로는 한 번만 알림
    alerted = msg;
    if ((cfg.alertMode === 'vibrate' || cfg.alertMode === 'both') && navigator.vibrate) { try { navigator.vibrate([180, 90, 180]); } catch (e) { /* 미지원 */ } }
    if (cfg.alertMode === 'sound' || cfg.alertMode === 'both') beep();
  }
  let audio;
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; g.gain.value = 0.06;
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.15);
    } catch (e) { /* 소리 불가 */ }
  }

  // ═════════════════════════════════════════════
  // 9. 패널
  // ═════════════════════════════════════════════
  const css = `
  #slbhm-panel{position:fixed;right:8px;z-index:2147483647;font:13px/1.35 system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#fff;width:min(94vw,360px)}
  #slbhm-panel.bottom{bottom:72px} #slbhm-panel.top{top:8px}
  #slbhm-bar{display:flex;align-items:center;gap:5px;background:#1f2a44ee;border-radius:14px;padding:6px 7px;box-shadow:0 4px 14px #0005}
  #slbhm-panel button{border:0;border-radius:10px;padding:6px 8px;font:inherit;font-weight:700;cursor:pointer}
  #slbhm-toggle.on{background:#2fb36b;color:#fff} #slbhm-toggle.off{background:#59607a;color:#fff}
  #slbhm-go{background:#f0b429;color:#222} .slbhm-sub{background:#39425e;color:#fff}
  #slbhm-status{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #slbhm-panel.stop #slbhm-bar{background:#c2410cee}
  #slbhm-panel,#slbhm-panel *{box-sizing:border-box;writing-mode:horizontal-tb!important;letter-spacing:normal;text-transform:none;word-break:keep-all;overflow-wrap:anywhere}
  .slbhm-box{display:none;margin-top:6px;background:#1f2a44f4;border-radius:14px;padding:10px 12px;box-shadow:0 4px 14px #0005;max-height:min(60vh,calc(100vh - 230px));overflow:auto;-webkit-overflow-scrolling:touch}
  .slbhm-box.open{display:block} .slbhm-box label{display:flex!important;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;width:auto!important;min-width:0}
  .slbhm-box h4{margin:12px 0 2px;font-size:12px;opacity:.75}
  #slbhm-panel input,#slbhm-panel select{margin:0;position:static;opacity:1;float:none;min-height:0;box-shadow:none}
  #slbhm-panel input[type=text],#slbhm-panel input[type=number],#slbhm-panel select{color:#111!important;-webkit-text-fill-color:#111!important;background-color:#fff!important;opacity:1!important;visibility:visible!important;font-size:16px!important;line-height:1.2!important;text-indent:0!important;letter-spacing:normal!important;text-shadow:none!important;text-transform:none!important;caret-color:#111!important;border:1px solid #c8cdd8!important;border-radius:6px!important;padding:3px 6px!important;height:32px!important;box-sizing:border-box!important;-webkit-appearance:none!important;appearance:none!important;font-family:-apple-system,system-ui,sans-serif!important;filter:none!important;mix-blend-mode:normal!important}
  #slbhm-panel input::placeholder{color:#8a8f9c!important;-webkit-text-fill-color:#8a8f9c!important;opacity:1!important}
  #slbhm-panel select{background-image:linear-gradient(45deg,transparent 50%,#555 50%),linear-gradient(135deg,#555 50%,transparent 50%)!important;background-position:calc(100% - 12px) 55%,calc(100% - 7px) 55%!important;background-size:5px 5px!important;background-repeat:no-repeat!important;padding-right:20px!important}
  #slbhm-panel option{color:#111!important;-webkit-text-fill-color:#111!important;background:#fff!important}
  .slbhm-pos .slbhm-id>.r{flex-wrap:wrap!important} .slbhm-pos .slbhm-id>.r>input[data-f=name]{flex:1 1 calc(100% - 46px)!important;max-width:none!important}
  .slbhm-pos .slbhm-id>.r>input.num{margin-left:42px!important;flex:0 0 52px!important;max-width:52px!important} .slbhm-pos .slbhm-id>.r>select{flex:1 1 0!important;max-width:none!important;min-width:0!important}
  #slbhm-panel details{display:block!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:0!important;padding:0!important;margin:0!important;min-height:0!important;max-height:none!important;height:auto!important;width:auto!important;overflow:visible!important;color:#fff!important;-webkit-text-fill-color:#fff!important;position:static!important;opacity:1!important;visibility:visible!important;transform:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  #slbhm-panel details.slbhm-pos,#slbhm-panel details.slbhm-adv{border-top:1px solid rgba(255,255,255,.14)!important;padding:3px 0!important}
  #slbhm-panel summary{display:block!important;list-style:none!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:14px!important;font-weight:700!important;line-height:1.35!important;text-align:left!important;text-indent:0!important;padding:6px 0!important;margin:0!important;height:auto!important;min-height:0!important;width:auto!important;opacity:1!important;visibility:visible!important;position:static!important;cursor:pointer!important;overflow:visible!important;white-space:normal!important;transform:none!important}
  #slbhm-panel summary::-webkit-details-marker{display:none!important} #slbhm-panel summary::marker{content:''!important}
  #slbhm-panel summary::before{content:'▸ '!important;display:inline!important;color:#f0b429!important;-webkit-text-fill-color:#f0b429!important} #slbhm-panel details[open]>summary::before{content:'▾ '!important}
  #slbhm-panel summary::after{content:none!important;display:none!important}
  #slbhm-panel details[open]>:not(summary){display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;max-height:none!important;overflow:visible!important} #slbhm-panel details[open]>.r,#slbhm-panel .slbhm-id>.r{display:flex!important} #slbhm-panel details[open]>small{display:block!important}
  #slbhm-panel summary small{display:inline!important;font-size:11px!important;font-weight:400!important;opacity:.7!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
  #slbhm-panel .slbhm-id details>summary{font-size:11px!important;font-weight:400!important;opacity:.65!important;padding:2px 0 2px 42px!important}
  #slbhm-panel input[type=checkbox]{-webkit-appearance:checkbox!important;appearance:auto!important;width:20px!important;height:20px!important;min-width:20px;max-width:20px;flex:0 0 20px!important;padding:0!important;border-radius:4px;accent-color:#2fb36b}
  .slbhm-box select,.slbhm-box input[type=text],.slbhm-box input[type=number]{font:inherit;font-size:16px;color:#111;background:#fff;border-radius:6px;border:0;padding:3px 6px;height:30px;width:auto!important;flex:0 1 150px;min-width:0;max-width:150px}
  .slbhm-box input[type=number]{flex:0 0 64px;max-width:64px}
  .slbhm-box small{display:block;opacity:.7;margin-top:6px}
  .slbhm-checks{display:flex;flex-wrap:wrap;gap:4px 10px;margin:4px 0} .slbhm-multi{display:flex;flex-wrap:wrap;gap:2px 10px;margin:4px 0} .slbhm-checks label,.slbhm-multi label{display:inline-flex!important;justify-content:flex-start!important;gap:4px!important;margin:2px 0!important;white-space:nowrap}
  .slbhm-slot{border-top:1px solid #fff2;padding:5px 0} .slbhm-slot .r{display:flex;align-items:center;gap:4px;margin:3px 0}
  .slbhm-slot .r label{display:inline-flex!important;justify-content:flex-start!important;margin:0!important;gap:5px!important;font-weight:700;flex:1 1 auto}
  .slbhm-slot .tag{flex:0 0 30px;opacity:.75;font-size:12px} .slbhm-slot .nm{flex:1 1 auto} .slbhm-pos{border-top:1px solid #fff2;padding:3px 0} .slbhm-pos>summary{font-weight:700;padding:5px 0;cursor:pointer} .slbhm-pos>summary small{display:inline;font-weight:400} .slbhm-id{margin:2px 0 4px} .slbhm-id details summary{font-size:11px;opacity:.6;padding-left:34px} .slbhm-pos .r{display:flex;align-items:center;gap:4px;margin:3px 0} .slbhm-pos .tag{flex:0 0 38px;opacity:.75;font-size:12px} .slbhm-pos input[type=text]{flex:1 1 0!important;max-width:none!important} .slbhm-pos input.num{flex:0 0 44px!important;max-width:44px!important} .slbhm-pos select{flex:0 0 92px!important;max-width:92px!important} .slbhm-pos select.pos{flex:1 1 auto!important;max-width:none!important} .slbhm-pos select.form{flex:0 0 84px!important;max-width:84px!important} .slbhm-pos .r>select:not(.pos):not(.form){flex:0 0 84px!important;max-width:84px!important} .slbhm-pos small.now{display:block;margin:0 0 4px 42px;opacity:.7} .slbhm-adv{margin:8px 0;border-top:1px solid #fff2;padding-top:4px} .slbhm-adv>summary{font-weight:700;cursor:pointer;padding:4px 0} .slbhm-slot select.nat{flex:0 0 96px!important;max-width:96px!important} .slbhm-slot select.pos{flex:0 0 auto!important;max-width:120px!important;font-size:14px} .slbhm-grp{margin:10px 0 0;font-size:12px;color:#f0b429} .slbhm-mode{display:flex;gap:6px;margin:6px 0} .slbhm-mode button{flex:1;background:#39425e;color:#fff;padding:8px!important} .slbhm-mode button.on{background:#2fb36b} .slbhm-slot details{margin:2px 0 0} .slbhm-slot summary{font-size:12px;opacity:.75;cursor:pointer;padding:2px 0} .slbhm-slot .cur{opacity:.8;font-size:12px}
  .slbhm-slot input[type=text]{flex:1 1 0!important;max-width:none!important} .slbhm-slot input.num{flex:0 0 44px!important;max-width:44px!important} .slbhm-slot select{flex:0 0 92px!important;max-width:92px!important}
  #slbhm-log table{border-collapse:collapse;width:100%;font-size:11px} #slbhm-log td,#slbhm-log th{border-bottom:1px solid #fff2;padding:2px 3px;text-align:left;vertical-align:top}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const sel = (k, opts) => `<select data-k="${k}">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`;
  const chk = (k) => `<input type="checkbox" data-k="${k}">`;
  const multi = (k, opts) => `<span class="slbhm-multi">${opts.map(([v, l]) => `<label style="display:inline-flex;gap:3px;margin:3px 8px 3px 0"><input type="checkbox" data-arr="${k}" value="${v}">${l}</label>`).join('')}</span>`;
  const p = document.createElement('div');
  p.id = 'slbhm-panel';
  p.innerHTML = `
    <div id="slbhm-bar">
      <button id="slbhm-toggle"></button>
      <span id="slbhm-status">대기</span>
      <button id="slbhm-go" title="스토브리그 멈춤을 이번 한 번만 넘기고 시즌 진행">▶ 진행</button>
      <button class="slbhm-sub" id="slbhm-no" title="이번 회귀 안 함" style="display:none">✕</button>
      <button class="slbhm-sub" id="slbhm-logbtn" title="시즌 기록">📋</button>
      <button class="slbhm-sub" id="slbhm-gear" title="설정">⚙</button>
    </div>
    <div class="slbhm-box" id="slbhm-set">
      <h4>진행</h4>
      <label>포스트시즌 직접 플레이 질문 ${sel('postseason', [['skipAll', '전체 스킵'], ['skipRound', '라운드 스킵'], ['ask', '멈춤']])}</label>
      <label>국가대표 선발 ${sel('nationalTeam', [['join', '자동 참가'], ['ask', '멈춤']])}</label>
      <label>비FA 다년계약 ${sel('nonFaExtension', [['reject', '자동 거절'], ['accept', '자동 수락'], ['ask', '멈춤']])}</label>
      <label>부상 선택 ${sel('injury', [['auto', '회복 끝까지·일반 재활'], ['ask', '멈춤']])}</label>
      <label>투수 보직 변경 제안은 유지 ${chk('keepRoleAndPosition')} <small>(야수 포지션 전환은 항상 거절)</small></label>
      <label>특별훈련 가능하면 멈춤 ${chk('stopForTraining')}</label>
      <label>MLB 포스팅 가능하면 멈춤 ${chk('stopForPosting')}</label>
      <label>병역 선택지 있으면 멈춤 ${chk('stopForMilitary')}</label>
      <h4>선수 목표</h4>
      <small>여러 개 고르면 구단 추천 우선 → TR 점수 높은 순으로 자동, 하나만 고르면 그것만 합니다.</small>
      <div>목표 쪽 ${multi('targetSides', [['PITCHER', '투수'], ['HITTER', '타자']])}</div>
      <div>투수 보직 ${multi('pitcherRoles', [['선발', '선발'], ['불펜', '불펜'], ['마무리', '마무리']])}<small>안 고르면 보직 선택 화면에서 멈춤</small></div>
      <div>야수 포지션 ${multi('hitterPositions', ['포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'].map((x) => [x, x]))}<small>안 고르면 구단 추천</small></div>
      <div>투구폼 ${multi('pitchForms', ['오버핸드', '스리쿼터', '사이드암', '언더핸드'].map((x) => [x, x]))}<small>안 고르면 구단 추천</small></div>
      <label>목표 쪽 전념 제안 수락 ${chk('commitTwoWay')}</label>
      <h4>스토브리그 이벤트</h4>
      <label>기본 선택 ${sel('eventPolicy', [['weak', '약점 보완(추천)'], ['strong', '강점 강화'], ['random', '무작위'], ['ask', '멈춤']])}</label>
      <label>우선 능력치 ${sel('eventPriority', [['', '없음'], ...[...PSTAT, ...HSTAT].map((s) => [s, s])])}</label>
      <h4>이적 (FA·리그·오퍼)</h4>
      <label>방식 ${sel('transfer', [['route', '루트대로 (오퍼는 멈춤)'], ['routeAll', '루트대로 전부 자동'], ['manual', '멈춤(직접)']])}</label>
      <label>이번 생 루트 <input type="text" data-k="route" placeholder="KBO>NPB|CPBL"></label>
      <small>'>' 는 다음 리그, '|' 는 둘 중 제안이 있는 곳(앞쪽 우선). 예: KBO>NPB|CPBL, KBO>MLB>NPB>CPBL</small>
      <label>리그별 같은 팀 시즌 <input type="number" min="1" max="20" data-k="routeSeasons"></label>
      <h4>특별훈련</h4>
      <label>미니게임 자동 플레이 ${chk('trainingAutoPlay')}</label>
      <label>'다음 시도' 자동 ${chk('autoNextAttempt')}</label>
      <label>종목 고르기 ${sel('trainingPick', [['weak', '자동: 가장 낮은 능력치'], ['tr', '자동: 목표 포지션 TR 순'], ['fixed', '자동: 아래 순서'], ['manual', '수동(멈춤)']])}</label>
      <label>고정 순서 <input type="text" data-k="trainingOrder" placeholder="제구,구위,구속"></label>
      <small>자동이면 스토브리그에서 특별훈련을 열고 목표 쪽 종목까지 고른 뒤, 미니게임 직전에 멈춰 알립니다.</small>
      <label>이 점수 미만이면 멈춤 <input type="number" min="0" max="10" data-k="trainingMinScore"></label>
      <h4>진로·방출·은퇴 권고</h4>
      <label>졸업 진로를 루트대로 ${chk('pathAuto')}</label>
      <label>전력 외 통보 시 재도전 ${chk('releaseContinue')}</label>
      <label>구단 은퇴 권고 ${sel('retireAdvice', [['continue', '항상 계속 (제안 없을 때만 은퇴)'], ['smart', 'MLB 12시즌 전이면 계속'], ['accept', '항상 수락'], ['ask', '멈춤']])}</label>
      <small>은퇴 권고를 받아들이면 커리어가 끝납니다. 영결은 같은 팀 시즌이 기준이라 다른 팀으로 옮겨 더 뛰어도 늘지 않고, 명예의 전당은 MLB 12시즌이 필요해 그 전이면 계속 뜁니다.</small>
      <h4>리세 보조</h4>
      <label>리세 보조 켜기 ${chk('resetOn')}</label>
      <label>통과하면 그대로 진행 ${chk('resetAutoContinue')}</label>
      <label>투수 통과 OVR <input type="text" data-k="resetCutP" placeholder="56.0-"></label>
      <label>타자 통과 OVR <input type="text" data-k="resetCutH" placeholder="57.1-"></label>
      <small>'56-' 은 56 이상, '54.2-54.5' 는 범위, 쉼표로 여러 개. 기본값은 게임 코드 시뮬레이션으로 정한 값입니다.</small>
      <label>후보 선택 ${sel('candidatePick', [['first', '1번(빠름)'], ['balanced', '고른 후보'], ['ask', '멈춤']])}</label>
      <label>집중 육성 ${sel('focusPick', [['tr2', '목표 포지션 TR 큰 2개'], ['weak2', '낮은 능력치 2개']])}</label>
      <h4>알림·화면</h4>
      <label>멈출 때 알림 ${sel('alertMode', [['screen', '화면 표시만'], ['vibrate', '진동'], ['sound', '소리'], ['both', '소리+진동']])}</label>
      <label>패널을 위쪽에 ${chk('panelTop')}</label>
      <small>광고·사인볼·회귀·은퇴 확정 버튼은 절대 누르지 않습니다.</small>
    </div>
    <div class="slbhm-box" id="slbhm-log">
      <div style="display:flex;gap:6px;margin-bottom:6px"><button class="slbhm-sub" id="slbhm-csv">CSV 저장</button><button class="slbhm-sub" id="slbhm-clear">기록 비우기</button></div>
      <div id="slbhm-logtable"></div>
    </div>`;
  document.body.appendChild(p);

  const $ = (id) => p.querySelector('#' + id);
  function paint() {
    const t = $('slbhm-toggle');
    t.textContent = cfg.on ? 'ON' : 'OFF';
    t.className = cfg.on ? 'on' : 'off';
    p.classList.toggle('top', !!cfg.panelTop);
    p.classList.toggle('bottom', !cfg.panelTop);
    $$('[data-k]', p).forEach((el) => { const k = el.dataset.k; if (el.type === 'checkbox') el.checked = !!cfg[k]; else el.value = cfg[k]; });
    $$('[data-arr]', p).forEach((el) => { el.checked = (cfg[el.dataset.arr] || []).includes(el.value); });
  }
  function setStatus(s, mode) {
    $('slbhm-status').textContent = s;
    p.classList.toggle('stop', mode === 'stop');
    $('slbhm-no').style.display = /^회귀 확인/.test(s) ? '' : 'none';
  }
  const COLS = ['선수', '연도', '나이', '리그', '팀', '경기', '기록', '수상', 'OVR', '능력치'];
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  function renderLog() {
    const box = $('slbhm-logtable');
    if (!box || !$('slbhm-log').classList.contains('open')) return;
    const rows = LOG.slice(-40).reverse();
    box.innerHTML = rows.length ? `<table><tr>${COLS.slice(0, 9).map((c) => `<th>${c}</th>`).join('')}</tr>${rows.map((r) => `<tr>${COLS.slice(0, 9).map((c) => `<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')}</table><small>최근 40줄 · 전체 ${LOG.length}줄은 CSV로</small>` : '<small>아직 기록이 없어요. 매크로가 시즌 결과를 넘길 때마다 쌓입니다.</small>';
  }
  function csv() {
    const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const body = [COLS.join(','), ...LOG.map((r) => COLS.map((c) => q(r[c])).join(','))].join('\n');
    const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'slb-기록-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  $('slbhm-toggle').onclick = () => {
    cfg.on = !cfg.on; save(); paint(); alerted = ''; sameClick = 0;
    setStatus(cfg.on ? '켜짐' : '꺼짐', 'idle');
    // 홈 화면에서 켜면 바로 목표 진행 시작 (진행 중인 선수가 있으면 먼저 물어봄)
    if (RESET_ONLY && cfg.on && S.resetPhase === 'passed' && document.querySelector('.stadium-home')) { S.resetPhase = ''; saveS(); }
    if (cfg.on && cfg.goalOn && document.querySelector('.stadium-home') && !S.resetPhase && !S.retireDecision && !S.assign) {
      applyGoal(); cfg.wizardDone = true; cfg.resetOn = true; save();
      S.resetPhase = document.querySelector('.home-continue-existing, .career-home-button') ? 'ask' : 'new'; S.resetCount = 0; S.life = 1; S.retry = 0; saveS();
      setStatus(S.resetPhase === 'ask' ? '진행 중인 선수가 있어요 — ▶ 진행을 누르면 그 선수는 지우고 새로 시작' : '목표 선수 만들기 시작', S.resetPhase === 'ask' ? 'stop' : 'run');
    }
    if (cfg.on && (cfg.alertMode === 'sound' || cfg.alertMode === 'both')) beep(); // 첫 터치로 소리 권한 열기
  };
  $('slbhm-go').onclick = () => { forceGo = true; alerted = ''; sameClick = 0; if (!cfg.on) { cfg.on = true; save(); paint(); } setStatus('▶ 이번 한 번 진행', 'run'); };
  $('slbhm-no').onclick = () => { // 회귀 확인에서 거절: 저장할 만하면 저장, 아니면 새 인생
    if (!/^(REBIRTH|RETRY)$/.test(S.retireDecision || '')) return;
    const to = S.declineTo === 'SAVE' ? 'SAVE' : 'NEW';
    Object.assign(S, { retireDecision: to, polishing: false, rebirthApproved: false }); if (to === 'SAVE' && !S.saveReason && S.keptCard && !S.keptCard.pass) S.saveReason = 'TR'; saveS();
    alerted = ''; sameClick = 0; if (!cfg.on) { cfg.on = true; save(); paint(); }
    notify('회귀 안 함 → ' + (to === 'SAVE' ? '저장' : '새 인생')); setStatus('회귀 안 함 → ' + (to === 'SAVE' ? '저장' : '새 인생'), 'run');
  };
  $('slbhm-gear').onclick = () => { $('slbhm-set').classList.toggle('open'); $('slbhm-log').classList.remove('open'); const gb = document.getElementById('slbhm-goal'); if (gb) gb.classList.remove('open'); };
  $('slbhm-logbtn').onclick = () => { $('slbhm-log').classList.toggle('open'); $('slbhm-set').classList.remove('open'); const gb = document.getElementById('slbhm-goal'); if (gb) gb.classList.remove('open'); renderLog(); };
  $('slbhm-csv').onclick = csv;
  $('slbhm-clear').onclick = () => { if ($('slbhm-clear').dataset.arm) { LOG = []; saveLog(); renderLog(); delete $('slbhm-clear').dataset.arm; $('slbhm-clear').textContent = '기록 비우기'; } else { $('slbhm-clear').dataset.arm = 1; $('slbhm-clear').textContent = '한 번 더 누르면 삭제'; setTimeout(() => { delete $('slbhm-clear').dataset.arm; $('slbhm-clear').textContent = '기록 비우기'; }, 4000); } };
  $$('[data-k]', p).forEach((el) => {
    el.onchange = () => {
      const k = el.dataset.k;
      cfg[k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value);
      if (k === 'resetOn') { S.resetPhase = cfg.resetOn ? (document.querySelector('.career-home-button, .home-continue-existing') ? 'ask' : 'new') : ''; S.resetCount = 0; saveS(); }
      save(); paint();
    };
  });
  setTimeout(() => liveInputs(p), 0);
  $$('[data-arr]', p).forEach((el) => {
    el.onchange = () => {
      const k = el.dataset.arr;
      const order = $$('[data-arr="' + k + '"]', p).map((x) => x.value);
      const set = new Set(cfg[k] || []);
      if (el.checked) set.add(el.value); else set.delete(el.value);
      cfg[k] = order.filter((v) => set.has(v));
      save(); paint();
    };
  });
  paint();
  // ═════════════════════════════════════════════
  // 10-2. 🎯 목표 선수 설정 화면 (처음 켤 때 자동으로 열림)
  // ═════════════════════════════════════════════
  const NAT = [['KR', '한국'], ['JP', '일본'], ['US', '미국'], ['TW', '대만'], ['PR', '푸에르토리코'], ['DO', '도미니카공화국'], ['MX', '멕시코'], ['CU', '쿠바'], ['VE', '베네수엘라'], ['AU', '호주'], ['CA', '캐나다'], ['PA', '파나마']];
  const HANDS = ['', '우투우타', '우투좌타', '좌투우타', '좌투좌타', '스위치타자']; // 스위치타자는 타자 전용(포수)만, 좌투우타는 투타겸업만 (게임 코드)
  const FORMOPT = [['', '폼 추천'], ['오버핸드', '오버핸드'], ['스리쿼터', '스리쿼터'], ['사이드암', '사이드암'], ['언더핸드', '언더핸드']];
  const ALLPOS = ['선발', '불펜', '마무리', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];
  const PRIS = [['TR', 'TR(팀 레이팅)'], ['PA', 'PA 올S+'], ['LS', 'LS(레거시)'], ['RN', '4영결'], ['HOF', '호프(명전)']];
  // 27인 로스터 (게임 코드의 MY TEAM 구성: 주전 9 + 1선발 + 2~5선발 4 + 필승조 3 + 마무리 + 중간계투 4 + 백업 포수 1 + 내야 백업 2 + 외야 백업 2)
  //   [자리 키, 화면 이름, 기본 육성 포지션, 고를 수 있는 포지션(그 자리 최소 요구), 그룹, 게임 화면 위치]
  const IFP = ['1루수', '2루수', '3루수', '유격수'], OFP = ['좌익수', '중견수', '우익수'], HP = ['포수', ...IFP, ...OFP, '지명타자'];
  const SLOT27 = [
    ['C', '포수', '포수', ['포수'], '주전 야수', { cls: 'c' }], ['1B', '1루수', '1루수', ['1루수'], '주전 야수', { cls: '1b' }], ['2B', '2루수', '2루수', ['2루수'], '주전 야수', { cls: '2b' }],
    ['3B', '3루수', '3루수', ['3루수'], '주전 야수', { cls: '3b' }], ['SS', '유격수', '유격수', ['유격수'], '주전 야수', { cls: 'ss' }], ['LF', '좌익수', '좌익수', ['좌익수'], '주전 야수', { cls: 'lf' }],
    ['CF', '중견수', '중견수', ['중견수'], '주전 야수', { cls: 'cf' }], ['RF', '우익수', '우익수', ['우익수'], '주전 야수', { cls: 'rf' }],
    ['DH', '지명타자', '지명타자', HP, '주전 야수', { cls: 'dh' }],
    ['SP', '1선발', '선발', ['선발'], '선발진', { cls: 'sp' }], ['SP2', '2선발', '선발', ['선발'], '선발진', { aria: '2선발' }], ['SP3', '3선발', '선발', ['선발'], '선발진', { aria: '3선발' }],
    ['SP4', '4선발', '선발', ['선발'], '선발진', { aria: '4선발' }], ['SP5', '5선발', '선발', ['선발'], '선발진', { aria: '5선발' }],
    ['RP1', '필승조 1', '불펜', ['불펜'], '불펜', { cls: 'rp', idx: 0 }], ['RP2', '필승조 2', '불펜', ['불펜'], '불펜', { cls: 'rp', idx: 1 }], ['RP3', '필승조 3', '불펜', ['불펜'], '불펜', { cls: 'rp', idx: 2 }],
    ['CP', '마무리', '마무리', ['마무리'], '불펜', { cls: 'cp' }],
    ['MID1', '중간계투 1', '불펜', ['불펜', '마무리'], '불펜', { aria: '기타 중간계투 1번 칸' }], ['MID2', '중간계투 2', '불펜', ['불펜', '마무리'], '불펜', { aria: '기타 중간계투 2번 칸' }],
    ['MID3', '중간계투 3', '불펜', ['불펜', '마무리'], '불펜', { aria: '기타 중간계투 3번 칸' }], ['MID4', '중간계투 4', '불펜', ['불펜', '마무리'], '불펜', { aria: '기타 중간계투 4번 칸' }],
    ['BC', '백업 포수', '포수', ['포수'], '백업 야수', { aria: '백업 포수 1번 칸' }],
    ['BI1', '내야 백업 1', '유격수', IFP, '백업 야수', { aria: '내야 백업 1번 칸' }], ['BI2', '내야 백업 2', '3루수', IFP, '백업 야수', { aria: '내야 백업 2번 칸' }],
    ['BO1', '외야 백업 1', '중견수', OFP, '백업 야수', { aria: '외야 백업 1번 칸' }], ['BO2', '외야 백업 2', '우익수', OFP, '백업 야수', { aria: '외야 백업 2번 칸' }],
  ];
  const SLOTDEF = Object.fromEntries(SLOT27.map((d) => [d[0], d]));
  // 이름 목록(풀): 포지션마다 [주전 → 로스터 백업(백업 포수·내야/외야 백업 중 그 포지션) → 추가 백업 2], 지명타자 [주전 → 추가 1],
  //   선발 [1~5선발 → 추가 1], 불펜 [마무리 → 필승조 1~3 → 중계 1~4 → 추가 1]. 추가 백업은 로스터 밖, 이름만 준비해 두는 칸
  const FPOS = ['포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수'];
  const EXTRA_N = { 지명타자: 1, 선발: 1, 불펜: 1 }; FPOS.forEach((p) => { EXTRA_N[p] = 2; });
  const BULLPEN = ['CP', 'RP1', 'RP2', 'RP3', 'MID1', 'MID2', 'MID3', 'MID4'], ROTATION = ['SP', 'SP2', 'SP3', 'SP4', 'SP5'];
  const STARTER_OF = { 포수: 'C', '1루수': '1B', '2루수': '2B', '3루수': '3B', 유격수: 'SS', 좌익수: 'LF', 중견수: 'CF', 우익수: 'RF' };
  const lineupSlot = (k) => (cfg.lineup || []).find((x) => x.slot === k);
  const groupOf = (k) => (k === 'DH' ? '지명타자' : ROTATION.includes(k) ? '선발' : BULLPEN.includes(k) ? '불펜' : (lineupSlot(k) || {}).pos || (SLOTDEF[k] || [])[2]);
  const backupsOf = (p) => ['BC', 'BI1', 'BI2', 'BO1', 'BO2'].filter((k) => (lineupSlot(k) || {}).pos === p);
  const groupSlots = (g) => (g === '선발' ? ROTATION : g === '불펜' ? BULLPEN : g === '지명타자' ? ['DH'] : [STARTER_OF[g], ...backupsOf(g)]);
  const ensureExtra = () => { cfg.extra = cfg.extra || {}; for (const [g, n] of Object.entries(EXTRA_N)) { cfg.extra[g] = cfg.extra[g] || []; while (cfg.extra[g].length < n) cfg.extra[g].push({ name: '', number: '', hand: '', nationality: '', team: '', school: '' }); } };
  // 그 그룹 새 선수 이름: 목록 순서대로, 지금 팀에 없는 이름 (같은 이름 두 명이 있으면 배치·삭제 대상을 구분할 수 없어서)
  function pickIdentity(g, held) {
    ensureExtra();
    const pool = [...groupSlots(g).map((k) => lineupSlot(k) || {}), ...(cfg.extra[g] || [])];
    return pool.find((e) => !e.name || !held.has(e.name)) || {};
  }
  if (!cfg.goal) cfg.goal = { name: '', number: '', nationality: 'KR', hand: '', team: '', school: '', positions: [], priorities: ['PA', 'TR'], minLS: 0 };
  if (cfg.lineupOn) cfg.lineupWeakest = true; // 팀 모드는 항상 '약한 자리 자동'
  { // 예전 14칸 → 27칸 (같은 자리 키의 입력값은 그대로 옮김)
    const old = Array.isArray(cfg.lineup) ? cfg.lineup : [];
    const blank = { on: false, done: false, name: '', number: '', nationality: '', hand: '', team: '', school: '' };
    if (old.length === SLOT27.length && !old.some((x, i) => x.slot !== SLOT27[i][0])) cfg.lineup = old.map((x, i) => Object.assign({}, blank, { pos: SLOT27[i][2] }, x)); // 쿠키에서 짧게 저장된 칸 복원
    else {
      cfg.lineup = SLOT27.map(([slot, , pos]) => Object.assign({ slot, pos, on: false, done: false, name: '', number: '', nationality: '', hand: '', team: '', school: '' }, old.find((x) => x.slot === slot) || {}, { slot }));
      save();
    }
  }
  if ((cfg.cfgVer || 0) < 9) { const d = lineupSlot('DH'); if (d) d.pos = '지명타자'; cfg.cfgVer = 9; save(); } // 지명타자 칸 육성 포지션: 처음엔 지명타자 (고른 값은 그대로 유지)
  const gbox = document.createElement('div');
  gbox.className = 'slbhm-box'; gbox.id = 'slbhm-goal';
  const opt = (arr, v) => arr.map((x) => { const [val, lab] = Array.isArray(x) ? x : [x, x || '(랜덤)']; return `<option value="${val}"${val === v ? ' selected' : ''}>${lab}</option>`; }).join('');
  function goalHTML() {
    const g = cfg.goal;
    const checks = (name, list, sel) => list.map(([v, l]) => `<label style="display:inline-flex;gap:3px;margin:3px 8px 3px 0"><input type="checkbox" data-g="${name}" value="${v}"${sel.includes(v) ? ' checked' : ''}>${l}</label>`).join('');
    const NATO = [['', '국적'], ...NAT];
    ensureExtra();
    // 이름 한 칸: [이름][번호][투타] + 펼치면 국적·희망 구단·출신고
    const idRow = (attr, e, tag, pit) => `<div class="slbhm-id"><div class="r"><span class="tag">${tag}</span><input type="text" ${attr} data-f="name" value="${esc(e.name || '')}" placeholder="이름(빈칸=랜덤)"><input type="text" class="num" ${attr} data-f="number" value="${esc(e.number || '')}" placeholder="번호"><select ${attr} data-f="hand">${opt(HANDS, e.hand || '')}</select>${pit ? `<select class="form" ${attr} data-f="form" title="투구폼">${opt(FORMOPT, e.form || '')}</select>` : ''}</div>`
      + `<details${e.nationality || e.team || e.school ? ' open' : ''}><summary>국적·구단·출신고</summary><div class="r"><span class="tag"></span><select class="nat" ${attr} data-f="nationality">${opt(NATO, e.nationality || '')}</select><input type="text" ${attr} data-f="team" value="${esc(e.team || '')}" placeholder="희망 구단"><input type="text" ${attr} data-f="school" value="${esc(e.school || '')}" placeholder="출신 고등학교"></div></details></div>`;
    const L = (k) => cfg.lineup.findIndex((x) => x.slot === k);
    const slotId = (k, tag) => { const i = L(k); const s = cfg.lineup[i]; return idRow(`data-l="${i}"`, s, tag, ROTATION.includes(k) || BULLPEN.includes(k)) + (s.lastName ? `<small class="now">지금: ${esc(s.lastName)}${s.lastTR ? ' · TR ' + s.lastTR : ''}${s.primaryRN ? ' · 영결' : ''}</small>` : ''); };
    const extraId = (g, j) => idRow(`data-x="${g}|${j}"`, cfg.extra[g][j], '추가' + (cfg.extra[g].length > 1 ? j + 1 : ''), g === '선발' || g === '불펜');
    const grp = (title, body, note) => `<details class="slbhm-pos"><summary>${title}${note ? ` <small>${note}</small>` : ''}</summary>${body}</details>`;
    const posSel = (k, choices) => { const i = L(k); return `<select class="pos" data-l="${i}" data-f="pos">${opt(choices.map((x) => [x, x]), cfg.lineup[i].pos)}</select>`; };
    const slotRows = FPOS.map((p) => grp(p, slotId(STARTER_OF[p], '주전') + backupsOf(p).map((k) => slotId(k, '백업')).join('') + cfg.extra[p].map((_, j) => extraId(p, j)).join(''), '주전 → 백업 → 추가 2' + (p === '포수' ? ' · 투타겸업은 포수가 안 돼 타자 전용으로 만듦, 좌투로 정하면 우투로' : ['2루수', '3루수', '유격수'].includes(p) ? ' · 좌투로 정하면 우투로 (좌투는 내야 1루수만)' : ''))).join('')
      + grp('지명타자', `<div class="r"><span class="tag">육성</span>${posSel('DH', ['지명타자', ...HP.filter((x) => x !== '지명타자')])}</div>` + slotId('DH', '주전') + extraId('지명타자', 0), '이 자리가 비거나 가장 약할 때 고른 포지션으로 키움 · 다른 야수와 같이 TR 최대 배치로 경쟁')
      + grp('백업 야수 (로스터 5칸)', `<div class="r"><span class="tag">포수</span><small>백업 포수</small></div>` + ['BI1', 'BI2'].map((k, j) => `<div class="r"><span class="tag">내야${j + 1}</span>${posSel(k, IFP)}</div>`).join('') + ['BO1', 'BO2'].map((k, j) => `<div class="r"><span class="tag">외야${j + 1}</span>${posSel(k, OFP)}</div>`).join(''), '포지션을 정하면 그 포지션 목록의 백업 칸이 됨')
      + grp('선발 (1~5선발 + 추가 1)', ROTATION.map((k, j) => slotId(k, (j + 1) + '선발')).join('') + extraId('선발', 0))
      + grp('불펜 (마무리 → 필승조 → 중계 + 추가 1)', BULLPEN.map((k) => slotId(k, { CP: '마무리', RP1: '필승1', RP2: '필승2', RP3: '필승3', MID1: '중계1', MID2: '중계2', MID3: '중계3', MID4: '중계4' }[k])).join('') + extraId('불펜', 0), '실제 배치는 이 자리 PA 높은 순');
    const team = !!cfg.lineupOn;
    return `
      <h4>🎯 목표 선수</h4>
      <small>여기서 정한 대로 리세 → 육성 → (필요하면 회귀) → 저장까지 반복합니다. 가망 없는 선수는 중간에 버리고 새로 시작합니다.</small>
      ${RESET_ONLY ? '<div class="slbhm-sub">리세 전용 — 목표 선수 정보를 정하고 홈에서 ON을 누르면, 고3 통과 선수가 나올 때까지 리세하고 멈춥니다.</div>' : ''}<div class="slbhm-mode"${RESET_ONLY ? ' style="display:none"' : ''}><button type="button" data-mode="solo" class="${team ? '' : 'on'}">👤 개인 모드</button><button type="button" data-mode="team" class="${team ? 'on' : ''}">👥 팀 모드 (27인)</button></div>
      ${team ? `` : `<h4>👤 목표 선수</h4>
      <label>이름 (빈칸=랜덤) <input type="text" data-g="name" value="${esc(g.name)}" maxlength="16"></label>
      <label>등번호 <input type="text" data-g="number" value="${esc(g.number)}" maxlength="2" style="width:40px"></label>
      <label>국적 <select data-g="nationality">${opt(NAT, g.nationality)}</select></label>
      <label>투타 유형 <select data-g="hand">${opt(HANDS, g.hand)}</select></label>
      <label>투구폼 <select data-g="form">${opt(FORMOPT, g.form || '')}</select></label>
      <label>희망 구단 (이름 일부) <input type="text" data-g="team" value="${esc(g.team)}"></label>
      <label>출신 고등학교 <input type="text" data-g="school" value="${esc(g.school)}" maxlength="20"></label>
      <div>목표 포지션 (여러 개면 구단 추천·TR 순 자동)<div class="slbhm-checks">${checks('positions', ALLPOS.map((x) => [x, x]), g.positions)}</div></div>`}
      <h4>⚙️ 공통 목표·회귀 설정</h4>
      <div>중요하게 볼 것<div class="slbhm-checks">${checks('priorities', PRIS, g.priorities)}</div></div>
      <label>리세 목표 잠재력 <select data-k3="resetTarget">${opt([['0', '자동 (PA 94 · 그 외 92)'], ['92', '92 (약 11분/명)'], ['94', '94 (약 22분/명)'], ['96', '96 (약 57분/명, 회귀 1번 아낌)']], String(cfg.resetTarget || 0))}</select></label>
      <label>회귀 직전에 알림·허락 받기 <input type="checkbox" data-k2="rebirthAsk"${cfg.rebirthAsk ? ' checked' : ''}></label>
      <label>저장 최소 TR (0=제한 없음, 목표 포지션 기준 · 예: 99) <input type="number" data-g="minTR" value="${g.minTR || 0}" step="0.5" style="width:60px"></label>
      <details class="slbhm-adv"><summary>고급 설정</summary>
      <small>지명타자는 수비를 빼고 나머지 4개를 S+로 봅니다. 4영결은 회귀 2번(3생) 계획으로 진행합니다.</small>
      <label>LS 최소 (0=제한 없음) <input type="number" data-g="minLS" value="${g.minLS || 0}" style="width:70px"></label>
      <label>PA 합계 기준 (0=올S+ 기준, 지명타자는 항상 올S+) <input type="number" data-g="minPAsum" value="${g.minPAsum || 0}" style="width:60px"></label>
      <label>회귀 후 남길 커리어를 TR로 비교 <input type="checkbox" data-k2="keepByTR"${cfg.keepByTR ? ' checked' : ''}></label>
      <label>회귀를 다 써도 미달이면, TR ≥ <input type="number" data-k2="trSaveMin" value="${cfg.trSaveMin}" step="0.5" style="width:50px"> 이면 저장 (0=끔)</label>
      <label>투타겸업 회귀 특훈: 목표 아닌 쪽 0점 (전념 제안 빨리) <input type="checkbox" data-k2="twoWayZero"${cfg.twoWayZero ? ' checked' : ''}></label>
      <label>첫 회귀 성장 유형 <select data-g="curve">${opt([['', '자동 (4영결=지속형, 그 외 꾸준형)'], ['EARLY', '선행형'], ['NORMAL', '꾸준형'], ['LATE', '후반형'], ['LONG', '지속형'], ['STEP', '단계형'], ['BURST', '집중형']], g.curve || '')}</select></label>
      <small>첫 회귀에서 성장 유형을 바꾸고(이미 그 유형이면 건너뜀), 이후 회귀는 희망 구단 특전으로 리그별 팀을 고정합니다. 비우면 그 리그에서 가장 오래 뛴 팀.</small>
      <div>${['KBO', 'NPB', 'MLB', 'CPBL'].map((lg) => `<label>${lg} 희망 구단 <input type="text" data-gt="${lg}" value="${esc((g.teams || {})[lg] || '')}" placeholder="전생 최다 시즌 팀"></label>`).join('')}</div>
      <label>가망 없으면 중간에 버리기 <input type="checkbox" data-k2="earlyAbort"${cfg.earlyAbort ? ' checked' : ''}></label>
      <small>내 기록 기준: 1생 은퇴 TR이 목표 -5 이내였던 선수가 투수·타자 각각 5명 쌓인 뒤에만, 같은 나이 그 선수들의 최저 OVR보다 2점 넘게 낮은 시즌이 2번 연속이면 버립니다. 지금 쌓인 좋았던 선수: 투수 ${loadCareers().filter((x) => x.side === 'PITCHER' && x.ok).length}명 · 타자 ${loadCareers().filter((x) => x.side === 'HITTER' && x.ok).length}명</small>
      <label>목표 미달이면 계속 다시 회귀 (3생 계획은 마지막 생, 한 생 목표는 그 생) <input type="checkbox" data-k2="finalRetryAll"${cfg.finalRetryAll ? ' checked' : ''}></label>
      <label>성공 예상: 앞으로 회귀 <input type="number" data-k2="stallRetries" value="${cfg.stallRetries}" min="1" max="10" style="width:40px">번 안에 목표에 닿을 확률로 계산</label>
      <label>한 선수 회귀 상한 <input type="number" data-k2="maxRebirths" value="${cfg.maxRebirths}" min="1" max="50" style="width:44px">번 (넘으면 가장 좋은 커리어 저장)</label>
      <small>또 회귀 3번째부터 TR이 목표보다 3 넘게 낮으면 바로 새 인생 (회귀마다 전념 +2 잠재력이 쌓여 초반엔 지켜봄). 목표 TR = 저장 최소 TR(예: 99), 비우면 PA 올S+ 기준 98.</small>
      <label>미달 시 다시 회귀 (횟수, 위 설정을 끈 경우와 1·2생 영결 미달에 적용) <input type="number" data-k2="maxRetry" value="${cfg.maxRetry}" min="0" max="5" style="width:40px"></label>
      <label>${NATIVE ? '앱: 회귀 광고는 직접 시청 (본 뒤 자동으로 이어감)' : '웹: 사인볼 5개 회귀 자동'} ${NATIVE ? '' : `<input type="checkbox" data-k2="rebirthSignball"${cfg.rebirthSignball ? ' checked' : ''}>`}</label>
      </details>
      ${team ? `<h4>👥 27인 로스터 + 추가 백업</h4>
      <small>생마다 팀을 점검해 빈 자리(주전 → 지명 → 선발 → 불펜 → 백업 순), 다 차면 TR이 가장 낮은 주전급 자리를 노립니다. 이름은 그 포지션 목록에서 지금 팀에 없는 첫 이름을 씁니다. 완성되면 같은 편(야수 14칸 / 투수 13칸) 선수 전원의 자리별 PA를 읽어 TR 합이 가장 큰 배치로 옮깁니다(야수는 주전+지명 먼저, 그다음 백업). 어느 칸에도 못 들어간 선수는 MY CLUB에서 삭제합니다. 빈칸은 랜덤(국적은 한국).</small>
      <label>회귀 그만둘 성공 예상 <input type="number" data-k2="rebirthMinP" value="${cfg.rebirthMinP}" min="0" max="90" style="width:56px">%</label>
      <small>이보다 낮으면 묻지 않고 — 회귀 전 선수는 버리고, 회귀한 선수는 가장 좋은 커리어로 저장합니다.</small>
      <label>목표 달성 선수 다듬기 회귀 (빈 자리 처음 채울 때) <input type="number" data-k2="polishRebirths" value="${cfg.polishRebirths}" min="0" max="5" style="width:40px">번까지 제안</label>
      <div class="slbhm-lineup">${slotRows}</div>` : ''}
      <h4>🧹 미달 선수 정리 (MY CLUB)</h4>
      <small>나의 선수단 관리에서 목표 기준 미달 선수를 찾아 목록을 보여 주고, 확인을 누르면 삭제합니다.</small>
      <button class="slbhm-sub" id="slbhm-clean">미달 선수 찾기</button>
      <div id="slbhm-clean-list"></div>
      <button class="slbhm-sub" id="slbhm-goal-done" style="margin-top:8px">저장하고 시작</button>`;
  }
  const liveInputs = (root) => $$('input[type=text],input[type=number]', root).forEach((el) => { if (el.onchange && !el.oninput) el.oninput = el.onchange; }); // 입력하는 즉시 저장 (칸을 벗어나지 않고 새로고침해도 유지)
  function renderGoal() { gbox.innerHTML = goalHTML(); bindGoal(); liveInputs(gbox); }
  function bindGoal() {
    $$('[data-g]', gbox).forEach((el) => {
      el.onchange = () => {
        const k = el.dataset.g;
        if (el.type === 'checkbox') { const all = $$('[data-g="' + k + '"]', gbox).filter((x) => x.checked).map((x) => x.value); cfg.goal[k] = all; }
        else cfg.goal[k] = el.type === 'number' ? Number(el.value) : el.value;
        applyGoal(); save();
      };
    });
    $$('[data-gt]', gbox).forEach((el) => { el.onchange = () => { cfg.goal.teams = Object.assign({}, cfg.goal.teams, { [el.dataset.gt]: el.value.trim() }); save(); }; });
    $$('[data-x]', gbox).forEach((el) => { el.onchange = () => { const [g, j] = el.dataset.x.split('|'); ensureExtra(); cfg.extra[g][+j][el.dataset.f] = el.value; save(); }; });
    $$('[data-mode]', gbox).forEach((el) => { el.onclick = () => { cfg.lineupOn = cfg.lineupWeakest = el.dataset.mode === 'team'; applyGoal(); save(); renderGoal(); }; });
    $$('[data-k3]', gbox).forEach((el) => { el.onchange = () => { cfg.resetTarget = Number(el.value); const cut = { 92: ['55.5-', '56.0-'], 94: ['55.5-', '56.0-'], 96: ['56.5-', '56.5-'] }[cfg.resetTarget]; if (cut) { cfg.resetCutP = cut[0]; cfg.resetCutH = cut[1]; } save(); }; });
    $$('[data-k2]', gbox).forEach((el) => { el.onchange = () => { cfg[el.dataset.k2] = el.type === 'checkbox' ? el.checked : Number(el.value); applyGoal(); save(); paint(); }; });
    $$('[data-l]', gbox).forEach((el) => { el.onchange = () => { const s = cfg.lineup[+el.dataset.l]; s[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; applyGoal(); save(); }; });
    const lr = gbox.querySelector('#slbhm-lineup-reset'); if (lr) lr.onclick = () => { cfg.lineup.forEach((s) => { s.done = false; s.savedName = ''; }); save(); renderGoal(); };
    gbox.querySelector('#slbhm-goal-done').onclick = () => {
      cfg.wizardDone = true; cfg.goalOn = true; applyGoal();
      cfg.resetOn = true; S.resetPhase = document.querySelector('.career-home-button, .home-continue-existing') ? 'ask' : 'new'; S.resetCount = 0; S.life = 1; S.retry = 0; saveS();
      cfg.on = true; save(); paint(); gbox.classList.remove('open');
      setStatus(S.resetPhase === 'ask' ? '진행 중인 선수가 있어요 — ▶ 진행을 누르면 리세 시작' : '목표 선수 리세 시작', S.resetPhase === 'ask' ? 'stop' : 'run');
    };
    gbox.querySelector('#slbhm-clean').onclick = () => cleanFind();
  }
  // 목표 → 기존 설정값으로 반영 (보직·포지션·훈련 종목·은퇴 권고)
  function applyGoal() {
    if (!cfg.goalOn) return;
    const g = goal(), pos = g.positions || [];
    const roles = pos.filter((x) => PIT_ROLES.includes(x)), hpos = pos.filter((x) => !PIT_ROLES.includes(x));
    cfg.targetSides = [...(roles.length ? ['PITCHER'] : []), ...(hpos.length ? ['HITTER'] : [])];
    if (!cfg.targetSides.length) cfg.targetSides = ['PITCHER', 'HITTER'];
    cfg.pitcherRoles = roles; cfg.hitterPositions = hpos;
    const P = new Set(g.priorities || []);
    cfg.trainingPick = P.has('PA') ? 'weak' : P.has('TR') ? 'tr' : 'weak';
    cfg.focusPick = P.has('PA') ? 'weak2' : 'tr2'; // 올S+는 고르게, TR은 비중 큰 능력치
    cfg.retireAdvice = P.has('LS') ? 'continue' : 'smart';
    cfg.transfer = 'routeAll';
  }
  p.appendChild(gbox);
  const gbtn = document.createElement('button');
  gbtn.className = 'slbhm-sub'; gbtn.id = 'slbhm-goalbtn'; gbtn.title = '목표 선수'; gbtn.textContent = '🎯';
  $('slbhm-bar').insertBefore(gbtn, $('slbhm-gear'));
  gbtn.onclick = () => { renderGoal(); gbox.classList.toggle('open'); $('slbhm-set').classList.remove('open'); $('slbhm-log').classList.remove('open'); };
  if (!cfg.wizardDone) { renderGoal(); gbox.classList.add('open'); }
  applyGoal();

  // ═════════════════════════════════════════════
  // 10-3. 화면 이동 작업: 라인업 배치 · 미달 선수 정리 (클럽하우스)
  // ═════════════════════════════════════════════
  let taskBusy = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(fn, ms = 6000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(80); } return null; }
  const btnText = (t, root = document) => $$('button', root).find((b) => (b.innerText || '').trim() === t);
  async function gotoClub(tab) {
    if (!document.querySelector('.my-team-slot, .current-season-open-target, .archive-grid-open-target')) {
      const home = document.querySelector('.career-home-button');
      if (home && !document.querySelector('.stadium-home')) { home.click(); await waitFor(() => document.querySelector('.stadium-home')); }
      const club = await waitFor(() => btnText('클럽하우스'));
      if (!club) throw new Error('클럽하우스 버튼을 못 찾았어요');
      club.click();
    }
    const t = await waitFor(() => btnText(tab));
    if (!t) throw new Error(tab + ' 탭을 못 찾았어요');
    t.click(); await sleep(500);
  }
  async function goHome() { const h = await waitFor(() => btnText('홈')); if (h) { h.click(); await waitFor(() => document.querySelector('.stadium-home')); } }
  const SLOTCLS = { 포수: 'c', '1루수': '1b', '2루수': '2b', '3루수': '3b', 유격수: 'ss', 좌익수: 'lf', 중견수: 'cf', 우익수: 'rf', 지명타자: 'dh', 선발: 'sp', 불펜: 'rp', 마무리: 'cp' };
  // 자리 버튼 찾기: 주전·1선발·필승조·마무리는 수비배치 그림, 2~5선발·중간계투·백업은 아래 백업 칸
  function slotEl(slot, pos) {
    const d = SLOTDEF[slot];
    const w = d ? d[5] : { cls: SLOTCLS[pos], idx: /^RP(\d)$/.test(slot) ? +slot.slice(2) - 1 : 0 };
    if (w.cls) return $$('.my-team-slot.position-' + w.cls)[w.idx || 0] || null;
    return $$('.club-team-backup-slot button').find((b) => (b.getAttribute('aria-label') || '').startsWith(w.aria + ' ')) || null;
  }
  const slotTR = (el) => { if (!el) return 0; const m = /PA\s*([\d.]+)/.exec((el.getAttribute('aria-label') || '') + ' ' + el.innerText); return /filled/.test(el.className) && m ? parseFloat(m[1]) : 0; };
  async function assignTask() {
    const a = S.assign; if (!a || taskBusy) return; taskBusy = true;
    try {
      setStatus('라인업 배치: ' + a.name + ' → ' + a.pos, 'run');
      await gotoClub('팀');
      const field = btnText('수비배치'); if (field) { field.click(); await sleep(300); }
      await waitFor(() => document.querySelector('.my-team-slot, .club-team-backup-slot'));
      const slot = slotEl(a.slot, a.pos);
      if (!slot) throw new Error(a.pos + ' 자리를 못 찾았어요');
      slot.click();
      const m1 = await waitFor(() => document.querySelector('.my-team-candidate-modal, .my-team-player-modal'));
      if (!m1) throw new Error('선수 선택 창이 안 열렸어요');
      if (m1.matches('.my-team-player-modal')) { const sw = btnText('로스터 교체', m1); if (!sw) throw new Error('로스터 교체 버튼이 없어요'); sw.click(); }
      const m2 = await waitFor(() => document.querySelector('.my-team-candidate-modal'));
      const pick = m2 && $$('button', m2).find((b) => (b.getAttribute('aria-label') || '').startsWith(a.name + ','));
      if (!pick) throw new Error('후보 목록에 ' + a.name + ' 선수가 없어요');
      pick.click(); await sleep(700);
      const again = document.querySelector('.my-team-candidate-modal [aria-label$="닫기"], .my-team-player-modal [aria-label$="닫기"]'); if (again) again.click();
      notify('라인업 배치 완료: ' + a.name + ' → ' + a.pos);
      S.assign = null; saveS();
      await goHome();
    } catch (e) {
      needUser('라인업 배치는 직접 해 주세요 (' + a.name + ' → ' + a.pos + '): ' + e.message);
      S.assign = null; saveS();
    } finally { taskBusy = false; }
  }
  // 팀 점검: 수비배치 화면의 자리별 PA(=그 자리 TR)를 읽어 체크된 자리 중 가장 낮은(빈 자리=0) 곳을 고름
  // 칸의 선수 이름 읽기 (수비배치 그림 칸 / 아래 백업 칸)
  const slotName = (el) => { if (!el || !/filled/.test(el.className)) return ''; const i = el.querySelector('i') || el.querySelector('.club-team-backup-player strong') || el.querySelector('strong'); return ((i && i.textContent) || '').trim(); };
  const PRIORITY = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'SP2', 'SP3', 'SP4', 'SP5', 'CP', 'RP1', 'RP2', 'RP3', 'MID1', 'MID2', 'MID3', 'MID4', 'BC', 'BI1', 'BI2', 'BO1', 'BO2'];
  const PRIMARY = new Set(PRIORITY.slice(0, 22)); // 백업 야수 5칸은 밀린 선수가 채움 (직접 도전 대상 아님)
  async function readTeam() {
    await gotoClub('팀');
    const field = btnText('수비배치'); if (field) { field.click(); await sleep(300); }
    await waitFor(() => document.querySelector('.my-team-slot'));
    const team = {};
    for (const k of PRIORITY) { const el = slotEl(k, (lineupSlot(k) || {}).pos); if (el) team[k] = { el, tr: slotTR(el), name: slotName(el), rn: /영구결번/.test(el.getAttribute('aria-label') || '') }; }
    return team;
  }
  async function scanTeamTask() {
    if (taskBusy) return; taskBusy = true;
    try {
      setStatus('팀 점검: 가장 약한 자리 찾는 중', 'run');
      const team = await readTeam();
      const keys = PRIORITY.filter((k) => team[k]);
      if (!keys.length) throw new Error('팀 화면에서 자리 칸을 못 찾았어요');
      keys.forEach((k) => { const s = lineupSlot(k); if (s) { s.lastTR = team[k].tr; s.lastName = team[k].name; s.primaryRN = team[k].rn; } });
      const held = new Set(keys.map((k) => team[k].name).filter(Boolean));
      // 빈 자리 먼저(주전 → 지명 → 선발 → 불펜 → 백업 순), 다 차 있으면 TR이 가장 낮은 주전급 자리
      let target = keys.find((k) => !team[k].name);
      if (!target) {
        const open = keys.filter((k) => PRIMARY.has(k) && team[k].tr < 100);
        if (!open.length) { S.slotPicked = false; saveS(); cfg.on = false; save(); paint(); needUser('모든 자리가 TR 100이에요 — 더 올릴 자리가 없어 멈췄어요'); await goHome(); return; }
        target = open.sort((a, b) => team[a].tr - team[b].tr)[0];
      }
      const g = groupOf(target);
      const id = pickIdentity(g, held);
      const pos = g === '선발' ? '선발' : g === '불펜' ? (target === 'CP' ? '마무리' : '불펜') : g === '지명타자' ? (lineupSlot('DH') || {}).pos || '지명타자' : (lineupSlot(target) || {}).pos || g;
      Object.assign(S, { curSlot: target, curSlotTR: team[target].tr, curGroup: g, curPos: pos, curId: Object.assign({}, id), slotPicked: true }); saveS(); save();
      notify('이번 생 목표: ' + (SLOTDEF[target] || [target, target])[1] + ' (지금 ' + (team[target].name ? 'TR ' + team[target].tr : '빈 자리') + ') · ' + pos + ' · ' + (id.name || '이름 랜덤'));
      applyGoal(); await goHome();
    } catch (e) {
      needUser('팀 점검 실패 — 직접 확인해 주세요: ' + e.message);
    } finally { taskBusy = false; }
  }
  // 자리 고르기 창 열기 → 후보 목록에서 그 선수의 '이 자리 PA' 읽기 (없으면 그 자리에 못 들어가는 선수)
  async function openPicker(k) {
    const el = slotEl(k, (lineupSlot(k) || {}).pos); if (!el) return null;
    el.click();
    const m1 = await waitFor(() => document.querySelector('.my-team-candidate-modal, .my-team-player-modal'), 4000);
    if (!m1) return null;
    if (m1.matches('.my-team-player-modal')) { const sw = btnText('로스터 교체', m1); if (!sw) return null; sw.click(); }
    return await waitFor(() => document.querySelector('.my-team-candidate-modal'), 4000);
  }
  const closePicker = async () => { const x = document.querySelector('.my-team-candidate-modal [aria-label$="닫기"], .my-team-player-modal [aria-label$="닫기"]'); if (x) { x.click(); await sleep(250); } };
  const candBtn = (m, name) => $$('button', m).find((b) => { const t = (b.getAttribute('aria-label') || b.innerText || '').trim(); return t.startsWith(name + ',') || t.startsWith(name + ' '); });
  const candPA = (b) => { const m = /PA\s*([\d.,]+)/.exec((b.getAttribute('aria-label') || '') + ' ' + b.innerText); return m ? parseFloat(m[1].replace(/,/g, '')) : NaN; };
  // 새 선수 배치: 같은 편(야수 14칸 / 투수 13칸) 선수 전원 × 자리별 PA 표를 읽어 TR 합이 가장 큰 배치를 계산해 그대로 옮김
  //   야수: 주전 8 + 지명타자 합을 먼저 최대로, 그다음 백업 5칸 합 · 투수: 13칸 합 (같으면 1선발·마무리·필승조 순으로 좋은 선수)
  //   어느 칸에도 못 들어간 선수는 MY CLUB에서 삭제 (그 이름은 다시 비어 다음 도전에 쓰임)
  const HIT_SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'BC', 'BI1', 'BI2', 'BO1', 'BO2'];
  const PIT_SLOTS = [...ROTATION, ...BULLPEN];
  async function readMatrix(slots, team, names) {
    const M = {};
    for (const k of slots) {
      if (!team[k]) continue;
      M[k] = {}; if (team[k].name) M[k][team[k].name] = team[k].tr;
      const m = await openPicker(k); if (!m) continue;
      for (const n of names) { if (n === team[k].name) continue; const b = candBtn(m, n); const v = b ? candPA(b) : NaN; if (!isNaN(v)) M[k][n] = v; }
      await closePicker();
    }
    return M;
  }
  // 자리 순서대로 DP (쓴 선수 집합 = 비트마스크) → 칸마다 '비움 또는 아직 안 쓴 선수 1명'
  function bestAssign(slots, names, M, weight) {
    const n = names.length, FULL = 1 << n;
    let dp = new Float64Array(FULL).fill(-Infinity); dp[0] = 0;
    const par = [];
    slots.forEach((k, i) => {
      const nd = new Float64Array(FULL).fill(-Infinity), ch = new Int8Array(FULL).fill(-2), row = M[k] || {}, w = weight(k, i);
      for (let mask = 0; mask < FULL; mask++) {
        const v = dp[mask]; if (v === -Infinity) continue;
        if (v > nd[mask]) { nd[mask] = v; ch[mask] = -1; }
        for (let j = 0; j < n; j++) { if ((mask >> j) & 1) continue; const pa = row[names[j]]; if (pa === undefined) continue; const m2 = mask | (1 << j), v2 = v + pa * w; if (v2 > nd[m2]) { nd[m2] = v2; ch[m2] = j; } }
      }
      dp = nd; par.push(ch);
    });
    let best = 0; for (let m = 0; m < FULL; m++) if (dp[m] > dp[best]) best = m;
    const want = {}; let mask = best;
    for (let i = slots.length - 1; i >= 0; i--) { const j = par[i][mask]; if (j >= 0) { want[slots[i]] = names[j]; mask &= ~(1 << j); } else want[slots[i]] = ''; }
    return want;
  }
  async function placeTask() {
    const a = S.assign; if (!a || taskBusy) return; taskBusy = true;
    const moves = [];
    try {
      setStatus('배치: ' + a.name + ' — 자리별 PA 읽는 중', 'run');
      let team = await readTeam();
      const hitter = !['선발', '불펜'].includes(a.group);
      const slots = (hitter ? HIT_SLOTS : PIT_SLOTS).filter((k) => team[k]);
      let names = [...new Set([a.name, ...slots.map((k) => team[k].name).filter(Boolean)])];
      if (names.length > 16) names = names.slice(0, 16); // 칸 수보다 많을 일은 없음 (안전장치)
      const M = await readMatrix(slots, team, names);
      const want = bestAssign(slots, names, M, (k, i) => (hitter && HIT_SLOTS.indexOf(k) >= 9 ? 1 : 1000) * (1 + (slots.length - i) * 1e-6));
      const before = Object.fromEntries(slots.map((k) => [k, team[k].name])), beforeTR = Object.fromEntries(slots.map((k) => [k, team[k].tr]));
      // 옮기기: 고르면 원래 칸에서 빠지므로 몇 번 돌려서 맞춤
      for (let pass = 0; pass < 3; pass++) {
        let changed = false;
        for (const k of slots) {
          const w = want[k]; if (!w || !team[k] || team[k].name === w) continue;
          const m = await openPicker(k); if (!m) continue;
          const b = candBtn(m, w); if (!b) { await closePicker(); continue; }
          b.click(); await sleep(600); await closePicker(); changed = true;
          team = await readTeam();
        }
        if (!changed) break;
      }
      for (const k of slots) if (want[k] && want[k] !== before[k]) moves.push(want[k] + ' → ' + (SLOTDEF[k] || [k, k])[1] + (M[k] && M[k][want[k]] !== undefined ? ' (PA ' + M[k][want[k]] + (before[k] ? ', 전 ' + before[k] + ' ' + beforeTR[k] : '') + ')' : ''));
      const mismatch = slots.filter((k) => want[k] && team[k] && team[k].name !== want[k]);
      if (mismatch.length) throw new Error('계산한 대로 못 옮긴 칸: ' + mismatch.map((k) => (SLOTDEF[k] || [k, k])[1]).join(', '));
      const placed = new Set(Object.values(want).filter(Boolean)), drop = names.filter((x) => !placed.has(x));
      if (drop.length) { moves.push(drop.join('·') + ' → 자리 없음 · 삭제'); await deletePlayers(drop); }
      if (!moves.length) moves.push('변화 없음');
      notify('배치 완료: ' + moves.join(' / '));
      LOG.push({ key: 'place|' + Date.now(), 선수: a.name, 연도: '배치', 나이: '', 리그: '', 팀: '', 경기: '', 기록: moves.join(' / '), 수상: '', OVR: '', 능력치: '', 시각: new Date().toISOString() }); saveLog();
      S.assign = null; saveS();
      await goHome();
    } catch (e) {
      needUser('배치 중 문제 — 직접 확인해 주세요 (' + a.name + '): ' + e.message + (moves.length ? ' · 한 것: ' + moves.join(' / ') : ''));
      S.assign = null; saveS();
    } finally { taskBusy = false; }
  }
  // MY CLUB에서 이름으로 삭제 (작업용, 화면 목록 없이)
  async function deletePlayers(names) {
    await gotoClub('선수단');
    const all = btnText('전체'); if (all) { all.click(); await sleep(400); }
    let ok = 0;
    for (const n of names) {
      const open = $$('.current-season-open-target, .archive-grid-open-target').find((b) => b.getAttribute('aria-label') === n + ' 선수 기록 열기'); // 목록·격자 보기 둘 다
      if (!open) { notify('삭제 실패: ' + n + ' 을(를) 선수단에서 못 찾았어요 — 직접 지워 주세요'); continue; }
      open.click();
      const del = await waitFor(() => document.querySelector('.archived-record-delete')); if (!del) continue;
      del.click();
      const modal = await waitFor(() => document.querySelector('.retired-delete-modal'));
      const yes = modal && btnText('삭제하기', modal); if (!yes) continue;
      yes.click(); ok++;
      await waitFor(() => document.querySelectorAll('.current-season-open-target, .archive-grid-open-target').length && !document.querySelector('.retired-delete-modal'), 8000);
      await sleep(300);
    }
    return ok;
  }
  rule('목표: 라인업 배치', () => !!S.assign && !taskBusy && !!document.querySelector('.stadium-home'), () => { if (S.assign.place) placeTask(); else assignTask(); return 'WAIT:라인업 배치 중'; }, { trusted: true });

  // 미달 선수 찾기 → 목록 확인 → 삭제
  let cleanList = [];
  function judgeArchived(rows, honors, ls, role) {
    const P = new Set((cfg.goal && cfg.goal.priorities) || []), miss = [];
    const dh = /지명타자/.test(role);
    if (P.has('PA')) { const bad = rows.filter((r) => !(dh && r.label === '수비') && !(r.splus === null || r.splus === undefined ? r.score >= 98 : r.splus)); if (bad.length) miss.push('PA ' + bad.map((r) => r.label + r.score).join(' ')); }
    const rn = honors.filter((x) => /영구결번/.test(x)).length;
    if (P.has('RN') && rn < 4) miss.push('영결 ' + rn + '/4');
    if (P.has('HOF') && !honors.includes('HOF')) miss.push('명전 없음');
    if (cfg.goal && cfg.goal.minLS && !(ls >= cfg.goal.minLS)) miss.push('LS ' + ls);
    return miss;
  }
  async function cleanFind() {
    if (taskBusy) return; taskBusy = true;
    const box = gbox.querySelector('#slbhm-clean-list');
    try {
      box.innerHTML = '<small>찾는 중…</small>';
      await gotoClub('팀');
      const inTeam = new Set($$('.my-team-slot.filled').map((b) => (b.innerText || '').split(/\s*PA\s/)[0].replace(/\s+/g, ' ').trim()));
      await gotoClub('선수단');
      const all = btnText('전체'); if (all) { all.click(); await sleep(400); }
      const names = $$('.current-season-open-target, .archive-grid-open-target').map((b) => (b.getAttribute('aria-label') || '').replace(/ 선수 기록 열기$/, ''));
      cleanList = [];
      for (let i = 0; i < names.length; i++) {
        box.innerHTML = '<small>확인 중 ' + (i + 1) + '/' + names.length + '</small>';
        const open = $$('.current-season-open-target, .archive-grid-open-target')[i]; if (!open) break;
        const role = txt(open.closest('article') && open.closest('article').querySelector('.archived-player-club-role b'));
        open.click();
        await waitFor(() => document.querySelector('.retired-card-prime-row'));
        const rows = $$('.retired-card-prime-row').map((r) => { const m = (r.textContent || '').match(/^(\D+?)(\d+)(S\+|S|A|B|C|D|E)?/); const g = r.querySelector('strong'); const cls = g ? g.className : ''; return m ? { label: m[1], score: +m[2], splus: m[3] ? m[3] === 'S+' : /grade-splus/.test(cls) ? true : /grade-/.test(cls) ? false : null } : null; }).filter(Boolean);
        const honors = $$('.retired-card-honors b').map((b) => (b.textContent || '').trim());
        const ls = num(((document.querySelector('.retired-card-header-score') || {}).textContent || '').replace(/,/g, ''));
        const miss = judgeArchived(rows, honors, ls, role);
        if (miss.length) cleanList.push({ name: names[i], miss, keep: inTeam.has(names[i]) });
        const back = document.querySelector('.archived-detail-back'); if (back) back.click();
        await waitFor(() => document.querySelectorAll('.current-season-open-target, .archive-grid-open-target').length);
      }
      renderClean();
    } catch (e) { box.innerHTML = '<small>실패: ' + esc(e.message) + '</small>'; }
    finally { taskBusy = false; }
  }
  function renderClean() {
    const box = gbox.querySelector('#slbhm-clean-list');
    if (!cleanList.length) { box.innerHTML = '<small>기준 미달 선수가 없어요.</small>'; return; }
    box.innerHTML = '<small>체크한 선수를 삭제합니다 (복구 불가). 라인업에 있는 선수는 기본 해제.</small>' + cleanList.map((c, i) => `<label style="display:flex;gap:6px"><input type="checkbox" data-c="${i}"${c.keep ? '' : ' checked'}><span>${esc(c.name)}${c.keep ? ' (라인업)' : ''} — ${esc(c.miss.join(', '))}</span></label>`).join('') + '<button class="slbhm-sub" id="slbhm-clean-go">선택 삭제 실행</button>';
    box.querySelector('#slbhm-clean-go').onclick = () => cleanDelete($$('[data-c]', box).filter((x) => x.checked).map((x) => cleanList[+x.dataset.c].name));
  }
  async function cleanDelete(names) {
    if (taskBusy || !names.length) return; taskBusy = true;
    const box = gbox.querySelector('#slbhm-clean-list'); let ok = 0;
    try {
      await gotoClub('선수단');
      const all = btnText('전체'); if (all) { all.click(); await sleep(400); }
      for (const n of names) {
        box.innerHTML = '<small>삭제 중 ' + esc(n) + '</small>';
        const open = $$('.current-season-open-target, .archive-grid-open-target').find((b) => b.getAttribute('aria-label') === n + ' 선수 기록 열기');
        if (!open) continue;
        open.click();
        const del = await waitFor(() => document.querySelector('.archived-record-delete')); if (!del) continue;
        del.click();
        const modal = await waitFor(() => document.querySelector('.retired-delete-modal'));
        const yes = modal && btnText('삭제하기', modal); if (!yes) continue;
        yes.click(); ok++;
        await waitFor(() => document.querySelectorAll('.current-season-open-target, .archive-grid-open-target').length && !document.querySelector('.retired-delete-modal'), 8000);
        await sleep(350);
      }
      box.innerHTML = '<small>' + ok + '명 삭제했어요.</small>';
      LOG.push({ key: 'clean|' + Date.now(), 선수: '', 연도: '정리', 나이: '', 리그: '', 팀: '', 경기: '', 기록: names.join(', '), 수상: ok + '명 삭제', OVR: '', 능력치: '', 시각: new Date().toISOString() }); saveLog();
    } catch (e) { box.innerHTML = '<small>실패: ' + esc(e.message) + '</small>'; }
    finally { taskBusy = false; }
  }

  setStatus(cfg.on ? '켜짐' : '꺼짐 — ON을 눌러 시작', 'idle');

  // 포스트시즌 질문에서 '예'를 직접 누르면 시즌 결과가 나올 때까지 손을 뗀다
  document.addEventListener('click', (e) => {
    if (isPanel(e.target) || !e.isTrusted) return;
    sameClick = 0;
    if (S.resetPhase === 'passed') { S.resetPhase = ''; saveS(); }
    const b = e.target.closest && e.target.closest('button');
    if (b && txt(b) === '예' && /직접 플레이하시겠습니까/.test(topScope().innerText || '')) playingPostseason = true;
  }, true);
  setInterval(() => {
    if (playingPostseason && (document.querySelector('.ready-player-type, .stove-training-entry') || /시즌 결과/.test((topScope().innerText || '').slice(0, 400)))) playingPostseason = false;
  }, 1000);

  setInterval(tick, TICK);

  // 콘솔용: SLBHM.peek() 현재 화면 판단, SLBHM.log 기록
  window.SLBHM = {
    peek() { const c = context(); const r = R.find((x) => { try { return x.test(c); } catch (e) { return false; } }); return { rule: r && r.name, buttons: c.list.map((b) => b.t), text: c.text.slice(0, 300) }; },
    get cfg() { return cfg; }, get state() { return S; }, get log() { return LOG; }, rules: R,
    on(v) { cfg.on = !!v; save(); paint(); },
    persist() { save(); saveS(); },
  };
})();

// ───────────── 2부: 태생 리세 + 통합 패널 ─────────────

(function () {
  'use strict';
  if (window.__slbBirthReroll) return;
  window.__slbBirthReroll = true;

  const VERSION = '1.0';
  const K = {
    done: 'slb-br3-done', plan: 'slb-br3-plan', tpl: 'slb-br3-template', run: 'slb-br3-run', stat: 'slb-br3-stat',
    pend: 'slb-br3-pending', rej: 'slb-br3-rejected', ui: 'slb-br3-collapsed', form: 'slb-br3-form', tplPending: 'slb-br3-tpl-pending', wait: 'slb-br3-wait', dur: 'slb-br3-dur',
  };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ───────────────────── 선별 기준 (고정: 최상의 조건) ─────────────────────
  // 목표 포지션의 종목만 판정 (투타겸업이어도 반대 종목은 보지 않음). 성장 곡선은 보지 않음
  // 내구도: 많이 뛴 시즌의 주력·수비(투수는 구속·구위·체력) 추가 감소와 시즌 최대 경기 수를 정함 — 회귀 생에도 적용
  const DUR_OK = { '': null, ANY: null, NORMAL: ['IRON', 'STRONG', 'NORMAL'], STRONG: ['IRON', 'STRONG'], IRON: ['IRON'] };
  const DUR_KO = { IRON: '강철', STRONG: '튼튼', NORMAL: '보통', INJURY_PRONE: '부상 잦음', FRAGILE: '유리몸' };
  // 게임 확률(태생 생성표): 강철 8%, 튼튼 27%, 보통 45%, 부상 잦음 17%, 유리몸 3%
  const DUR_P = { ANY: 1, NORMAL: .8, STRONG: .35, IRON: .08 };
  // ───── 사용자 설정 (패널에서 고름, 새로고침해도 유지) ─────
  // cap: GENIUS 고정 + 잠재력 하한(타자 GENIUS 95~98, 투수 GENIUS 96~98) / apt: 'rec'(추천)·'none'(고려 안 함)·숫자(모든 야수 포지션 같은 하한)
  // dur: 'ANY'·'NORMAL'·'STRONG'·'IRON' / fast: 꾸준형 회귀 시 성장 속도 빠름(타자 시드) 필수 여부
  const CFG_DEF = { cap: 97, apt: 'rec', dur: 'STRONG', fast: true };
  let CFG = { ...CFG_DEF, ...load('slb-br3-cfg', {}) };
  if (!(CFG.cap >= 95)) CFG.cap = 95; // 이전 버전의 '등급 고려 안 함'(0)은 GENIUS 수치 고려 안 함으로
  const saveCfg = () => save('slb-br3-cfg', CFG);
  // (곡선은 회귀 때 한 번 바꾸면 이어지고, 회귀 생에는 부상이 없음)
  // 관용 기준: 잠재력 GENIUS 97 이상 — 97은 전념 한 번에 99, 다음 생 101이라 첫 생만 1 손해
  // 타자: 시드 '빠름'(꾸준형으로 바꿨을 때 NORMAL_FAST) + 목표 포지션 수비 적성 하한
  //   적성 1점 ≈ PA 수비 점수 +1~2 (수비는 이미 평균 98로 병목 아님), 유격수·중견수는 MLB·NPB·KBO에서 15 이상이면 수비 WAR 상한
  //   → 평균 5시간 안쪽에서 가능한 가장 높은 값
  const APT_MIN = { 포수: 17, '1루수': 15, '2루수': 16, '3루수': 16, 유격수: 15, 좌익수: 15, 중견수: 15, 우익수: 16, 지명타자: 0 };
  // 속도: 화면이 바뀌면 바로 다음 동작 (같은 화면이면 0.7초 뒤 재시도), 화면은 60ms만 안정되면 누름
  const STABLE_MS = 60, RETRY_MS = 700, STEP_MS = 40;

  const POSITIONS = ['선발투수', '중계투수', '마무리투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];
  const isPitcherPos = (p) => /투수$/.test(p);
  const ROLE = { 선발투수: 'STARTER', 중계투수: 'BULLPEN', 마무리투수: 'CLOSER' };
  const PW = {
    STARTER: { 구속: .15, 구위: .25, 제구: .25, 체력: .25, 위기관리: .1 },
    BULLPEN: { 구속: .25, 구위: .3, 제구: .25, 체력: .05, 위기관리: .15 },
    CLOSER: { 구속: .25, 구위: .3, 제구: .15, 체력: .05, 위기관리: .25 },
  };
  const HK = ['컨택', '파워', '선구안', '주력', '수비'];
  const POS_W = {
    포수: [.15, .1, .15, .05, .55], '1루수': [.2, .4, .15, .05, .2], '2루수': [.2, .05, .15, .25, .35], '3루수': [.15, .25, .1, .1, .4],
    유격수: [.15, .05, .1, .25, .45], 좌익수: [.25, .3, .15, .15, .15], 중견수: [.18, .12, .1, .3, .3],
    우익수: [.18, .22, .1, .15, .35], 지명타자: [.3, .4, .25, .05, 0],
  };
  const P_FOCUS = ['제구', '위기관리'];
  const hFocusFor = (pos) => HK.map((k, i) => [k, POS_W[pos][i]]).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);

  const PITCH_POS = POSITIONS.filter(isPitcherPos), HIT_POS = POSITIONS.filter((p) => !isPitcherPos(p));
  let DONE = new Set(load(K.done, []));
  const FORMS = ['추천', '오버핸드', '스리쿼터', '사이드암', '언더핸드'];
  let FORM = load(K.form, '추천'); // 투구폼: 시작할 때 성장 방향 화면(2페이지)에서 고른 폼 → 이후 모든 리세·회귀에 같은 폼
  let pendingReset = false;
  // 선수 유형·투타에 따라 이번 리세로 노릴 수 있는 포지션 (뽑지 않을 포지션 제외)
  function openPositions(t) {
    if (!t) return [];
    let el = t.kind === '투수' ? PITCH_POS : t.kind === '타자' ? HIT_POS.filter((p) => p !== '지명타자') : [...PITCH_POS, ...HIT_POS.filter((p) => p !== '포수')];
    if (/^좌투/.test(t.hand || '')) el = el.filter((p) => !['포수', '2루수', '3루수', '유격수'].includes(p));
    return el.filter((p) => !DONE.has(p));
  }
  const openP = () => openPositions(TPL).filter(isPitcherPos);
  const openH = () => openPositions(TPL).filter((p) => !isPitcherPos(p));
  let TPL = load(K.tpl, null);
  let STAT = { tries: 0, pre: 0, started: 0, found: null, last: '', ...load(K.stat, {}) };
  let running = !!load(K.run, false);
  // 반복 대기: 'player' = 찾은 선수를 직접 키우는 중(특별훈련만 대신), 새 인생 1페이지가 뜨면 리세 재개 / 'form' = 2페이지에서 투구폼 고르기 대기
  let WAIT = load(K.wait, '');
  const FORM_NAMES = ['오버핸드', '스리쿼터', '사이드암', '언더핸드'];
  let formAsked = false;

  // ─────────────────────── 절대 누르지 않는 것 ───────────────────────
  const NEVER = /(광고|구매|결제|충전|상점|슬롯|탈퇴|은퇴 확정|현역 은퇴|은퇴하기|사인볼|회귀하기|회귀 시작|이전 커리어|구독|패스|앱스토어|구글플레이|로그아웃|삭제|저장)/;

  // ───────────────────────── DOM 도우미 ─────────────────────────
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // 아래 도우미는 실제 게임에서 검증된 육성 엔진(반자동 도우미)과 같은 방식: 크기로 보이는지 판단, innerText·aria-label로 글자 읽기, 맨 위 팝업 안에서만 버튼 찾기
  const vis = (e) => {
    if (!e || !e.isConnected) return false;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const txt = (e) => ((e && (e.innerText || (e.getAttribute && e.getAttribute('aria-label')) || e.textContent)) || '').replace(/\s+/g, ' ').trim();
  function topScope() {
    const dlg = $$('[role=dialog],[aria-modal=true],dialog[open],.cv2-modal,.browser-exit-modal,.career-milestone-backdrop,.new-career-confirmation,.ability-confirm-modal,.player-creation-confirm-modal').filter((d) => vis(d));
    return dlg.length ? dlg[dlg.length - 1] : (document.querySelector('#root') || document.body);
  }
  const buttons = (root = document) => $$('button, [role=button], summary', root).filter((b) => vis(b));
  const labels = () => buttons(topScope()).map(txt).filter(Boolean).slice(0, 8).join(' / ');
  // 버튼 글자: '사이드암 추천'·'중견수 추천'처럼 공백이 섞여도 이름만 / 선택 상태: active·selected 클래스나 aria-pressed
  const lab = (b) => txt(b).replace(/추천/g, '').replace(/\s+/g, '');
  const isOn = (b) => !!b && (b.classList.contains('active') || b.classList.contains('selected') || b.getAttribute('aria-pressed') === 'true');
  const findBtn = (re, root) => buttons(root || topScope()).find((b) => re.test(txt(b)) && !b.disabled);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function click(el, why) {
    if (!el) return false;
    const t = txt(el);
    if (NEVER.test(t) && !/^새로운 인생/.test(t)) { stop('안전장치: "' + t.slice(0, 30) + '" 버튼은 누르지 않습니다'); return false; }
    el.click(); status(why || t.slice(0, 24));
    return true;
  }
  function setInput(el, v) {
    if (!el || el.value === v) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // ───────────────────── React 상태 읽기 (숨은 정보) ─────────────────────
  function readGame() {
    let fiber = null;
    for (const r of [document.getElementById('root'), document.body.firstElementChild, document.body]) {
      if (!r) continue; const k = Object.keys(r).find((k) => k.startsWith('__reactContainer')); if (k) { fiber = r[k]; break; }
    }
    if (!fiber) return null;
    const found = []; const seen = new Set(); const stack = [fiber]; let n = 0;
    while (stack.length && n < 300000) {
      const f = stack.pop(); n++;
      if (!f) continue;
      let h = f.memoizedState, i = 0;
      while (h && typeof h === 'object' && i < 100) {
        const s = h.memoizedState;
        if (s && typeof s === 'object' && !seen.has(s)) { seen.add(s); if (typeof s.stage === 'string' && 'player' in s && 'lastSeason' in s) found.push(s); }
        h = h.next; i++;
      }
      if (f.child) stack.push(f.child);
      if (f.sibling) stack.push(f.sibling);
    }
    const shown = txt(document.body).slice(0, 400);
    return found.find((s) => s.player?.name && shown.includes(s.player.name)) || found.find((s) => s.player) || found[0] || null;
  }

  // ───────────────────────── 판정 ─────────────────────────
  const aptOf = (c, pos) => pos === '지명타자' ? 10 : (c?.defensiveAptitudes?.byPosition?.[pos] ?? 0);
  function hitterScore(c, pos) {
    const w = POS_W[pos]; const a = c.abilities;
    const base = HK.reduce((s, k, i) => s + (a[k] ?? 10) * w[i], 0);
    return pos === '지명타자' ? base - .8 : base * (.75 + aptOf(c, pos) / 40);
  }
  const pitcherScore = (c) => Object.entries(PW[ROLE[openP()[0]]] || PW.BULLPEN).reduce((s, [k, w]) => s + (c.abilities[k] ?? 10) * w, 0);

  const aptMin = (pos) => {
    const X = window.__SBR_TEST || {};
    if (X.aptMin !== undefined) return X.aptMin;
    if (pos === '지명타자' || CFG.apt === 'none') return 0;
    return typeof CFG.apt === 'number' ? CFG.apt : (APT_MIN[pos] ?? 0);
  };
  // 후보 3명 중 고를 슬롯: 미종결 야수 포지션 적성 기준을 가장 많이(여유 있게) 넘는 타자 후보
  function pickSlot(g) {
    const two = !!g.twoWayCreationV1;
    const P = g.creationDraftV2?.candidates || [];
    const H = two ? (g.twoWayCreationV1?.secondDraft?.candidates || []) : P;
    const oh = TPL.kind === '투수' ? [] : openH(), op = TPL.kind === '타자' ? [] : openP();
    const rows = (TPL.kind === '투수' ? P : H).map((c, i) => {
      const q = c?.kind === 'HITTER' ? oh.filter((pos) => aptOf(c, pos) >= aptMin(pos)) : [];
      const margin = q.reduce((m, pos) => m + (pos === '지명타자' ? 0 : aptOf(c, pos) - aptMin(pos)), 0);
      return { i, q, margin, ps: P[i]?.kind === 'PITCHER' ? pitcherScore(P[i]) : 0 };
    });
    if (!rows.length) return null;
    rows.sort((a, b) => b.q.length - a.q.length || b.margin - a.margin || b.ps - a.ps);
    const best = rows[0];
    if (!best.q.length && !op.length) return { reject: true };
    // 성장 방향 화면에서 고를 포지션: 종결 안 한 포지션 중 (조건 통과 포지션 우선) 게임 포지션 점수가 가장 높은 곳
    const hc = H[best.i];
    const byScore = (list) => list.slice().sort((a, b) => hitterScore(hc, b) - hitterScore(hc, a))[0] || null;
    const pos = hc?.kind === 'HITTER' ? (byScore(best.q) || byScore(oh)) : null;
    return { i: best.i, pos, q: best.q };
  }

  const fastOf = (p) => Math.floor((p?.growthPatternSeed ?? 0) / 100) % 100 < 22;
  function judge(player) {
    const X = window.__SBR_TEST || {}; const CAP = X.cap ?? CFG.cap; // __SBR_TEST: 로컬 검증용
    const gp = player?.twoWayV1?.growthProfiles;
    const kind = player?.playerKindV2;
    const pp = gp?.pitcher || (kind === 'PITCHER' ? player?.hiddenProfileV2 : null);
    const hp = gp?.hitter || (kind === 'HITTER' ? player?.hiddenProfileV2 : null);
    const geniusOK = (p) => p && (X.tiers || ['GENIUS']).includes(p.potentialTier) && p.potentialCap >= CAP; // GENIUS는 항상, CAP 95 = 수치 고려 안 함
    const durOf = (p) => p?.durabilityTier ?? player?.hiddenProfileV2?.durabilityTier ?? 'NORMAL';
    const durOK = (p) => { const ok = X.dur !== undefined ? DUR_OK[X.dur] : DUR_OK[CFG.dur]; return !ok || ok.includes(durOf(p)); };
    const matched = [], why = [];
    const op = pp ? openP() : [], oh = hp ? openH() : [];
    if (op.length) {
      if (!geniusOK(pp)) why.push(`투수 ${pp.potentialTier} ${pp.potentialCap}`);
      else if (!durOK(pp)) why.push(`투수 내구도 ${DUR_KO[durOf(pp)] || durOf(pp)}`);
      else matched.push(...op);
    }
    if (oh.length) {
      if (!geniusOK(hp)) why.push(`타자 ${hp.potentialTier} ${hp.potentialCap}`);
      else if (!durOK(hp)) why.push(`타자 내구도 ${DUR_KO[durOf(hp)] || durOf(hp)}`);
      else if (CFG.fast && !fastOf(hp)) why.push('타자 빠름 시드 아님');
      else {
        const apt = player?.defensiveAptitudesV2?.byPosition || {};
        const q = oh.filter((pos) => pos === '지명타자' || (apt[pos] ?? 0) >= aptMin(pos));
        if (q.length) matched.push(...q); else why.push('적성 미달');
      }
    }
    return { pass: matched.length > 0, matched, why, pp, hp };
  }
  // ───────────────────── 예상 소요 시간 (게임 생성 공식으로 계산) ─────────────────────
  // 잠재력: 타자 GENIUS 2% (95~98 균등), 투수 GENIUS 2% (96~98 균등) / 빠름 시드 22% / 내구도 DUR_P
  // 수비 적성: 후보 능력치(10에서 14번 주고받기, 6~16)와 적성 공식(4~18)을 그대로 따라 굴려 본 통과율, 후보 3명 중 1명이라도
  const ABIL_H = ['컨택', '파워', '선구안', '주력', '수비'];
  const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const r1 = (x) => Math.round(x * 10) / 10;
  function fakeApt(L) {
    const i = { 컨택: 10, 파워: 10, 선구안: 10, 주력: 10, 수비: 10 };
    for (let k = 0; k < 14; k++) {
      const e = ABIL_H[rint(0, 4)]; let n = ABIL_H[rint(0, 4)];
      if (e === n) n = ABIL_H[(ABIL_H.indexOf(n) + 1) % 5];
      const a = rint(5, 15) / 10;
      if (i[e] + a <= 16 && i[n] - a >= 6) { i[e] = r1(i[e] + a); i[n] = r1(i[n] - a); }
    }
    const r = i.수비, s = i.주력, w = i.파워;
    const o = (b, lo, hi, z) => (z ? 0 : Math.min(18, Math.max(4, Math.round(b + rint(lo, hi)))));
    return { 포수: o(r, -5, 4, L), '1루수': o(r * .8 + w * .2 + (L ? 1 : 0), -3, 3), '2루수': o(r * .65 + s * .35, -4, 4, L), '3루수': o(r * .8 + w * .2, -4, 4, L),
      유격수: o(r * .7 + s * .3, -5, 4, L), 좌익수: o(r * .7 + s * .2 + w * .1, -3, 3), 중견수: o(r * .55 + s * .45, -4, 4), 우익수: o(r * .75 + s * .15 + w * .1, -4, 4) };
  }
  const aptCache = {};
  function aptPass3(H, L) { // 후보 3명 중 적어도 1명이 H 중 한 포지션 적성 하한을 넘을 확률
    if (!H.length) return 0;
    if (H.includes('지명타자') || H.every((p) => aptMin(p) <= 4)) return 1;
    const key = H.join(',') + '|' + (L ? 'L' : 'R') + '|' + H.map(aptMin).join(',');
    if (aptCache[key] === undefined) {
      const N = 6000; let ok = 0;
      for (let k = 0; k < N; k++) { const a = fakeApt(L); if (H.some((p) => a[p] >= aptMin(p))) ok++; }
      const q = ok / N; aptCache[key] = 1 - Math.pow(1 - q, 3);
    }
    return aptCache[key];
  }
  const capP = (cap, pitcher) => pitcher ? .02 * Math.max(0, Math.min(3, 99 - cap)) / 3 : .02 * Math.max(0, Math.min(4, 99 - cap)) / 4;
  // 걸리는 시간(초): c1 = 선수 생성까지 가서 잠재력까지 판정한 1명, c2 = 생성 전 후보 단계에서 수비 적성으로 걸러진 1회
  // 돌리면 각각 실제로 걸린 시간의 평균으로 바뀜 (기기에 저장, 각 5회 이상 모이면 실측으로 표시)
  let SPEED = { c1: 8, c2: 4, n1: 0, n2: 0, ...load('slb-br3-speed', {}) };
  if (SPEED.c2 === undefined || SPEED.n1 === undefined) SPEED = { c1: 8, c2: 4, n1: 0, n2: 0 }; // 이전 버전 값은 기준이 달라 버림
  let cycleMark = null; // 직전 판정(생성 또는 후보 탈락)이 끝난 시점의 실행 누적 시간
  function measure(kind) { // kind 1 = 생성 판정, 2 = 후보 탈락
    const now = STAT.activeMs || 0;
    if (cycleMark !== null) {
      const dt = (now - cycleMark) / 1000;
      if (dt > 0.3 && dt < 180) { const n = Math.min(200, (SPEED['n' + kind] || 0) + 1); SPEED['c' + kind] = SPEED['c' + kind] + (dt - SPEED['c' + kind]) / n; SPEED['n' + kind] = n; save('slb-br3-speed', SPEED); }
    }
    cycleMark = now;
  }
  function estimate(t) {
    if (!t || !t.kind) return null;
    const open = openPositions(t); if (!open.length) return null;
    const Pp = open.filter(isPitcherPos), H = open.filter((p) => !isPitcherPos(p));
    const L = /^좌투/.test(t.hand || '');
    const d = DUR_P[CFG.dur] ?? 1, f = CFG.fast ? .22 : 1;
    const gH = capP(CFG.cap, false), gP = capP(CFG.cap, true);
    const s = aptPass3(H, L);
    let full, pre = 0;
    if (!Pp.length) { const p = s * gH * d * f; if (!(p > 0)) return { impossible: true }; full = 1 / (gH * d * f); pre = full * (1 - s) / s; }
    else { const p = d * (1 - (1 - gP) * (1 - gH * f * s)); if (!(p > 0)) return { impossible: true }; full = 1 / p; }
    const c1 = SPEED.c1, c2 = SPEED.c2;
    const sec = full * c1 + pre * c2;
    return { sec, full, pre, c1, c2, m1: SPEED.n1 >= 5, m2: SPEED.n2 >= 5 };
  }
  const fmtT = (sec) => sec < 3600 ? `${Math.max(1, Math.round(sec / 60))}분` : sec < 86400 * 2 ? `${(sec / 3600).toFixed(1)}시간` : `${(sec / 86400).toFixed(1)}일`;
  function estText() {
    const t = TPL || (onCreationForm() ? readForm() : null);
    if (!t?.kind) return '예상 소요: 생성 1페이지에서 선수 유형을 고르면 계산합니다';
    const e = estimate(t);
    if (!e) return '예상 소요: 노릴 포지션이 없습니다';
    if (e.impossible) return '예상 소요: 이 조건으로는 거의 나오지 않습니다 — 수비 적성을 낮춰 주세요';
    const n = (x) => Math.round(x).toLocaleString();
    return `예상 소요: 평균 약 ${fmtT(e.sec)} · 절반은 ${fmtT(e.sec * Math.LN2)} 안 — 생성까지 가는 선수 약 ${n(e.full)}명(1명 ${e.c1.toFixed(1)}초${e.m1 ? ' 실측' : ' 기본값'})${e.pre >= 0.5 ? ` + 후보 단계 탈락 약 ${n(e.pre)}회(1회 ${e.c2.toFixed(1)}초${e.m2 ? ' 실측' : ' 기본값'})` : ''}`;
  }

  const describe = (p) => p ?`${p.potentialTier} ${p.potentialCap} · ${DUR_KO[p.durabilityTier] || p.durabilityTier || '?'} · 시드 ${p.growthPatternSeed}${fastOf(p) ? '(빠름)' : ''}` : '-';

  // ───────────────────── 생성 화면 입력값 읽기/복원 ─────────────────────
  const KINDS = ['투수', '타자', '투타겸업'];
  const HANDS = ['우투우타', '우투좌타', '좌투우타', '좌투좌타', '스위치타자']; // 타자는 좌투우타 대신 스위치타자(우투)
  const onCreationForm = () => $$('.creation-randomize-button').some(vis);
  function readForm() {
    const kind = KINDS.find((k) => buttons().some((b) => txt(b) === k && isOn(b)));
    const hand = HANDS.find((h) => $$('.hand-option').some((b) => vis(b) && txt(b) === h && isOn(b)));
    const natEl = $$('#creation-nationality-value, .creation-country-picker summary').find(vis);
    const nationality = txt(natEl).replace(/[⌄▾▼]/g, '').trim();
    const teamTxt = txt($$('.team-picker-trigger').find(vis)).replace(/[⌄▾▼]/g, '').trim();
    const team = /선택하세요/.test(teamTxt) ? '' : teamTxt;
    const val = (s) => $$(s).find(vis)?.value ?? '';
    return { kind, hand, nationality, team, name: val('.creation-name-control input'), number: val('.jersey-number-field input'), school: val('.high-school-name-input') };
  }
  function validate(t) {
    if (!t.kind) return '선수 유형(투수/타자/투타겸업)을 골라 주세요';
    if (!t.name) return '이름을 입력해 주세요';
    if (!t.school) return '출신 고등학교를 입력해 주세요';
    if (!openPositions(t).length) return `이 선수 유형(${t.kind}·${t.hand || ''})으로 노릴 포지션이 없습니다(모두 '뽑지 않을 포지션'에 체크됨). 포수는 '타자', 지명타자는 '투타겸업'으로 시작해 주세요`;
    return '';
  }
  // 한 번에 한 항목씩 템플릿대로 되돌림. 모두 맞으면 true
  function restoreForm() {
    const t = TPL; const cur = readForm();
    if (cur.kind !== t.kind) { click(findBtn(new RegExp('^' + t.kind + '$')), '유형 ' + t.kind); return false; }
    if (t.nationality && cur.nationality !== t.nationality) {
      const opt = $$('.creation-country-options button').find((b) => txt(b) === t.nationality);
      if (opt && vis(opt)) { click(opt, '국적 ' + t.nationality); return false; }
      const sum = $$('.creation-country-picker summary, #creation-nationality-value').find(vis);
      if (sum) { sum.click(); const o2 = $$('.creation-country-options button').find((b) => txt(b) === t.nationality); if (o2) o2.click(); status('국적 ' + t.nationality); }
      return false;
    }
    if (cur.hand !== t.hand) { const h = $$('.hand-option').find((b) => vis(b) && txt(b) === t.hand); if (h) { click(h, t.hand); return false; } }
    if (t.team && !cur.team.includes(t.team)) {
      const item = $$('.team-picker-list button, .team-picker-list [role=option], .team-picker-list li').find((b) => vis(b) && txt(b).includes(t.team));
      if (item) { click(item, '구단 ' + t.team); return false; }
      const trig = $$('.team-picker-trigger').find(vis); if (trig) { click(trig, '구단 목록'); return false; }
    }
    let changed = false;
    changed = setInput($$('.creation-name-control input').find(vis), t.name) || changed;
    changed = setInput($$('.jersey-number-field input').find(vis), t.number) || changed;
    changed = setInput($$('.high-school-name-input').find(vis), t.school) || changed;
    return !changed;
  }

  // 1페이지에서 '다음 · 능력치 후보 확인'을 누르는 순간 입력값을 기억 (2페이지에서 시작할 때 씀)
  // 새로고침 뒤: 사용자가 1페이지를 직접 고치지 않았다면 시작할 때 저장된 이전 선수 정보로 되돌림
  let formTouched = false;
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('button, summary, [role=button], [role=option], li');
    if (b && /^다음 · 능력치 후보 확인/.test(txt(b)) && onCreationForm()) save(K.tplPending, readForm());
    if (e.isTrusted && b && !running && onCreationForm() && !(host && e.composedPath().includes(host))) formTouched = true;
  }, true);
  document.addEventListener('input', (e) => { if (e.isTrusted && !running && onCreationForm()) formTouched = true; }, true);

  // ───────────────────────── 진행 루프 ─────────────────────────
  let lastAction = 0, busy = false, stuckSince = 0, lastSig = '';
  let scrSig = '', scrSince = 0, lastClickSig = '';
  const act = () => { lastAction = Date.now(); lastClickSig = scrSig; };
  let lastTickAt = 0, idleUntil = 0;
  let lastWaitCheck = 0;
  let lastRunTick = 0;
  async function tick() {
    if (running) { const n = Date.now(); if (lastRunTick) STAT.activeMs = (STAT.activeMs || 0) + Math.min(n - lastRunTick, 2000); lastRunTick = n; } else lastRunTick = 0;
    if (busy) return;
    if (!running) { // 찾은 선수 키우는 중: 사용자가 새 인생을 시작해 1페이지가 뜨면 리세 재개
      if (WAIT !== 'player' || Date.now() - lastWaitCheck < 500) return;
      lastWaitCheck = Date.now();
      if (!onCreationForm() || !TPL) return;
      resumeNext();
    }
    const nowT = Date.now(); if (nowT - lastTickAt < 15) return; lastTickAt = nowT;
    const sc = topScope(); const sg = (sc.innerText || '').slice(0, 400) + '#' + buttons(sc).map(txt).join('/');
    if (sg !== scrSig) { scrSig = sg; scrSince = Date.now(); return; }
    if (Date.now() - scrSince < STABLE_MS) return;                                   // 그리는 중이면 아주 잠깐만 기다림
    if (sg === lastClickSig && Date.now() - lastAction < RETRY_MS) return;          // 방금 누른 화면이 아직 그대로면 응답 대기
    if (Date.now() < idleUntil) return;
    busy = true; const before = lastAction;
    try { await step(); } catch (e) { status('오류: ' + (e?.message || e)); }
    finally { busy = false; if (lastAction === before) idleUntil = Date.now() + 250; } // 누를 게 없던 화면(연출·로딩)은 0.25초 쉬며 게임이 돌 시간을 줌
  }

  async function step() {
    // 새 인생 전환 연출(1.9초 뒤 자동으로 넘어감)·로딩 중에는 아무것도 하지 않음
    if ($$('.new-life-transition').some(vis)) return;
    let gc; const G = () => (gc === undefined ? (gc = readGame()) : gc); // 게임 상태 읽기는 무거워서 필요할 때만
    const body = txt(document.body);
    const sig = scrSig;
    if (sig !== lastSig) { lastSig = sig; stuckSince = Date.now(); }
    else if (Date.now() - stuckSince > 60000) return stop('같은 화면에서 60초 넘게 멈춤 — 보이는 버튼: ' + labels());

    // 앱 홍보 창('웹에서 계속하기'): 웹에서 새 인생을 누를 때마다 뜸 → 다른 처리보다 먼저 닫음 (리세 버튼을 다시 눌러 창이 계속 새로 뜨는 것 방지)
    const web = buttons(document).find((b) => /^웹에서 계속하기/.test(txt(b)) && !b.disabled && b.closest('.browser-exit-modal, [role=dialog]'));
    if (web) { click(web, '앱 안내 닫기'); return act(); }
    if (pendingReset && !onCreationForm() && !$$('.new-career-confirmation').some(vis)) { if (resetLife('처음부터 리세 시작', true)) { pendingReset = false; return; } }
    if (pendingReset && onCreationForm()) pendingReset = false;
    // 안내·확인 창
    if (/이전 선수의 기록을 보관했습니다/.test(body)) { const c = findBtn(/^계속하기$/); if (c) { click(c, '안내 닫기'); return act(); } }
    const confirmNew = findBtn(/^새로운 인생 시작/); // 새 인생 확인 창(또는 홈의 새 인생 버튼)
    if (confirmNew) { resetTry = 0; click(confirmNew, '새 인생 시작'); return act(); }
    const err = body.match(/(신규 선수 생성을 잠시 중단|새 게임 시작 가능 여부를 확인하지 못했습니다|재연결을 먼저 완료|로그인 상태를 확인)/);
    if (err) return stop('게임 안내: ' + err[1]);

    // 생성 확인 창 → 고3 시즌 시작 (이 순간 숨은 잠재력이 정해짐)
    const startHS = findBtn(/^고3 시즌 바로 시작/);
    if (startHS) { save(K.pend, G()?.player?.id || 'unknown'); click(startHS, '고3 시즌 시작'); return act(); }

    // 성장 방향 화면
    const fin = $$('.ability-finalize-button').find(vis);
    if (fin) {
      if (WAIT === 'form') { // 다음 선수 첫 2페이지: 투구폼은 사용자가 고름 → 고르면 그 폼으로 계속 리세
        const fbs = buttons().filter((b) => FORM_NAMES.includes(lab(b)));
        if (fbs.length) {
          const on = fbs.find(isOn);
          if (!on) {
            stuckSince = Date.now(); // 고를 때까지는 멈춤 감지 안 함
            if (!formAsked) { formAsked = true; beep(2); status('2페이지: 투구폼을 골라 주세요 — 고르면 바로 리세를 다시 돌립니다'); render(); }
            return;
          }
          FORM = lab(on); save(K.form, FORM);
        }
        WAIT = ''; save(K.wait, ''); formAsked = false;
        status(`리세 재개 — ${TPL.kind}${fbs.length ? ' · 투구폼 ' + FORM : ''} · 노리는 포지션: ${openPositions(TPL).join(', ')}`); render();
      }
      return growthScreen(fin);
    }

    // 후보 화면
    if ($$('.ability-candidate-slot').some(vis)) return candidateScreen(G());

    // 생성 폼
    if (onCreationForm()) {
      let ok = false;
      for (let k = 0; k < 10 && !(ok = restoreForm()); k++) await sleep(STEP_MS); // 바뀐 항목을 한 번에 되돌림
      if (!ok) return act();
      const next = findBtn(/^다음 · 능력치 후보 확인/);
      if (next) { click(next, '후보 확인'); return act(); }
      return;
    }
    const skip = $$('.creation-intro-skip').find(vis) || findBtn(/탭하여 스킵|^건너뛰기|^스킵/); if (skip) { click(skip, '인트로 건너뛰기'); return act(); }

    // 고3 시즌 이후: 판정
    const g = ($$('.stadium-home').some(vis) || onCreationForm()) ? null : G();
    if (g?.player?.hiddenProfileV2 && !['CREATE', 'STYLE'].includes(g.stage) && !$$('.stadium-home').some(vis)) {
      if (g.player.id === load(K.rej, null)) return resetLife('리세 진행 중');
      const pend = load(K.pend, null);
      if (!pend || (pend !== 'unknown' && g.player.id !== pend)) return stop('이 선수는 매크로가 만든 선수가 아니라서 건드리지 않습니다');
      save(K.pend, null);
      const r = judge(g.player);
      STAT.tries++; measure(1);
      STAT.last = `#${STAT.tries} ${r.pp ? '투 ' + describe(r.pp) : ''}${r.pp && r.hp ? ' / ' : ''}${r.hp ? '타 ' + describe(r.hp) : ''}`;
      if (r.pass) {
        const apt = g.player.defensiveAptitudesV2?.byPosition || {};
        STAT.found = { at: Date.now(), name: g.player.name, matched: r.matched, pp: r.pp, hp: r.hp,
          apts: r.matched.filter((p) => !isPitcherPos(p) && p !== '지명타자').map((p) => `${p} ${apt[p]}`) };
        save(K.stat, STAT); return found();
      }
      save(K.stat, STAT); save(K.rej, g.player.id); render();
      return resetLife('탈락: ' + r.why.join(', '));
    }

    // 홈 화면
    const home = $$('.home-new-life-button, .home-continue-button:not(.home-continue-existing)').find(vis);
    if (home) { click(home, '홈 → 새로운 인생'); return act(); }
    if ($$('.home-continue-existing').some(vis)) return stop('홈에 새 인생 버튼이 없고 이어하기만 있습니다 — 보이는 버튼: ' + labels());
  }

  // 리세: ① 헤더의 홈 버튼(육성 엔진이 실제 게임에서 쓰는 경로) → 홈의 새 인생 → 확인 창  ② 없으면 '새로운 인생' 글자가 든 버튼
  let viaHome = false, resetTry = 0;
  function resetLife(why, quiet) {
    // 빠른 길: 헤더 '새로운 인생' → 확인 창. 이 버튼이 두 번 연속 반응이 없으면 그 뒤로는 홈 경유(육성 엔진의 검증된 경로)
    const nb = buttons(document).find((b) => /새로운 인생|새 인생/.test(txt(b)) && !/시작/.test(txt(b)) && !b.disabled && !b.closest('.home-continue-existing'));
    const home = $$('.career-home-button').find(vis);
    if (nb && !viaHome) { if (++resetTry > 2) viaHome = true; click(nb, why.slice(0, 40)); act(); return true; }
    if (home) { click(home, why.slice(0, 40) + ' → 홈'); act(); return true; }
    if (nb) { click(nb, why.slice(0, 40)); act(); return true; }
    if (!quiet) stop('리세할 버튼(홈·새로운 인생)을 못 찾음 — 보이는 버튼: ' + labels());
    return false;
  }

  let candMem = { id: '', opened: false, clicked: -1 };
  async function candidateScreen(g) {
    if (!g?.creationDraftV2) return;
    const pick = pickSlot(g);
    if (!pick) return stop('후보 정보를 읽지 못했습니다');
    if (pick.reject) {
      const rr = findBtn(/^재추첨$/); // 앱/로컬에서만 보이는 1회 재추첨
      if (rr) { click(rr, '후보 재추첨'); return act(); }
      STAT.pre++; measure(2); save(K.stat, STAT); render();
      return resetLife('후보 탈락: 노리는 포지션 적성 미달');
    }
    save(K.plan, { pos: pick.pos, slot: pick.i });
    const draftId = (g.creationDraftV2.candidates || []).map((c) => c.id).join('|');
    if (candMem.id !== draftId) candMem = { id: draftId, opened: false, clicked: -1 };
    // '모두 오픈'은 후보 세트마다 한 번만 (눌린 뒤에도 버튼이 남아 있는 화면에서 반복하지 않게)
    const openAll = $$('.ability-open-all').find(vis);
    if (openAll && !openAll.disabled && !candMem.opened) { candMem.opened = true; click(openAll, '후보 오픈'); await sleep(STEP_MS * 2); }
    const slot = $$('.ability-candidate-slot').filter(vis)[pick.i];
    const go = $$('.ability-select-candidate-button').find((b) => vis(b) && !b.disabled);
    const slotOn = slot && (/active|selected|current|checked/.test(String(slot.className)) || ['aria-pressed', 'aria-selected', 'aria-current', 'aria-checked'].some((a) => slot.getAttribute(a) === 'true'));
    // 선택 표시를 못 읽어도, 고를 후보를 이미 한 번 눌렀고 진행 버튼이 살아 있으면 진행
    if (slot && !slotOn && candMem.clicked !== pick.i) { candMem.clicked = pick.i; click(slot, `후보 ${pick.i + 1}`); await sleep(STEP_MS); }
    const go2 = $$('.ability-select-candidate-button').find((b) => vis(b) && !b.disabled) || go;
    if (go2) { click(go2, '이 후보로 진행'); return act(); }
    if (slot && !slotOn) { candMem.clicked = -1; status('후보 선택 다시 시도'); return act(); }
  }

  async function growthScreen(fin) {
    // 이 화면의 선택은 한 번에 처리 (클릭 사이 짧게 대기)
    const forms = ['오버핸드', '스리쿼터', '사이드암', '언더핸드'];
    const posNames = Object.keys(POS_W);
    const pKeys = Object.keys(PW.STARTER);
    const plan = load(K.plan, {}) || {};
    const hF = hFocusFor(plan.pos || '지명타자');
    for (let guard = 0; guard < 12; guard++) {
      const btns = buttons();
      const formBtns = btns.filter((b) => forms.some((f) => txt(b).startsWith(f)));
      if (formBtns.length && !formBtns.some((b) => isOn(b))) {
        const fb = (FORM !== '추천' && formBtns.find((b) => lab(b) === FORM)) || formBtns.find((b) => /추천/.test(txt(b))) || formBtns[0];
        click(fb, '투구폼 ' + lab(fb)); await sleep(STEP_MS); continue;
      }
      const posBtns = btns.filter((b) => posNames.includes(lab(b)));
      if (posBtns.length && !posBtns.some((b) => isOn(b))) {
        const want = (plan.pos && posBtns.find((b) => lab(b) === plan.pos)) || posBtns.find((b) => /추천/.test(txt(b))) || posBtns[0];
        click(want, '포지션 ' + lab(want)); await sleep(STEP_MS); continue;
      }
      const abil = btns.filter((b) => /^(구속|구위|제구|체력|위기관리|컨택|파워|선구안|주력|수비)\s*[\d.]/.test(txt(b)));
      const wrong = abil.find((b) => { const n = txt(b).match(/^[가-힣]+/)[0]; const want = (pKeys.includes(n) ? P_FOCUS : hF).includes(n); return want !== isOn(b); });
      if (wrong) { click(wrong, '집중 ' + txt(wrong).match(/^[가-힣]+/)[0]); await sleep(STEP_MS); continue; }
      break;
    }
    if (!fin.disabled) click(fin, '선수 생성'); else status('생성 처리 대기');
    act();
  }

  // ───────────────────────── 시작 / 정지 / 발견 ─────────────────────────
  let wakeLock = null, audio = null, titleTimer = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener?.('release', () => { wakeLock = null; }); }
      if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch {}
  }
  document.addEventListener('visibilitychange', () => { if (running && document.visibilityState === 'visible') keepAwake(true); });
  function beep(times) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const o = audio.createOscillator(), gN = audio.createGain();
        o.frequency.value = i % 2 ? 1320 : 880; o.connect(gN); gN.connect(audio.destination);
        const t0 = audio.currentTime + i * 0.35; gN.gain.setValueAtTime(0.25, t0); gN.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
        o.start(t0); o.stop(t0 + 0.32);
      }
    } catch {}
  }
  // 발견한 선수를 반쪽 매크로(SLB Half Macro)에 넘겨 은퇴 카드 화면(회귀 선택 직전)까지 키움
  const ROLE_KO = { 선발투수: '선발', 중계투수: '불펜', 마무리투수: '마무리' };
  function handoff(f) {
    const H = window.SLBHM;
    if (!H || !H.cfg || !H.state) return false;
    const hitPos = f.matched.filter((p) => !isPitcherPos(p)), pitRoles = f.matched.filter(isPitcherPos).map((p) => ROLE_KO[p]);
    const side = hitPos.length ? 'HITTER' : 'PITCHER';
    const plan = load(K.plan, {}) || {};
    Object.assign(H.cfg, {
      handoff: true, resetOn: false, goalOn: false, lineupOn: false, targetSides: [side],
      pitcherRoles: side === 'PITCHER' ? pitRoles : H.cfg.pitcherRoles,
      hitterPositions: side === 'HITTER' ? (plan.pos && hitPos.includes(plan.pos) ? [plan.pos] : hitPos) : H.cfg.hitterPositions,
      pitchForms: FORM === '추천' ? [] : [FORM],
      commitTwoWay: true, stopForTraining: false, transfer: 'routeAll', pathAuto: true, retireAdvice: 'continue',
      // 직접 고르게 하는 설정(ask·manual)은 자동으로 바꿔 회귀·남길 커리어 말고는 멈추지 않게
      trainingAutoPlay: true, autoNextAttempt: true, trainingPick: H.cfg.trainingPick === 'manual' ? 'weak' : H.cfg.trainingPick,
      stopForPosting: false, stopForMilitary: false, postseason: 'skipAll', nationalTeam: 'join', injury: 'auto',
      nonFaExtension: H.cfg.nonFaExtension === 'ask' ? 'reject' : H.cfg.nonFaExtension, eventPolicy: H.cfg.eventPolicy === 'ask' ? 'weak' : H.cfg.eventPolicy,
      candidatePick: H.cfg.candidatePick === 'ask' ? 'balanced' : H.cfg.candidatePick, releaseContinue: true,
      route: side === 'PITCHER' ? 'CPBL:3>KBO:1>CPBL:99' : 'CPBL:3>MLB:99',
    });
    Object.assign(H.state, { side, keepSlot: Number.isInteger(plan.slot) ? plan.slot : undefined, curveDone: false, perk: '', rebirthApproved: false, resetPhase: '', retireDecision: '', life: 1, retry: 0, polish: 0, stepIdx: 0, league: '', team: '', abilities: {}, lifeId: Date.now().toString(36) });
    H.on(true);
    return side;
  }
  // 찾은 선수: 육성은 사용자가 직접, 특별훈련(종목 고르기·미니게임)만 육성 엔진이 대신
  function trainOnly(f) {
    const H = window.SLBHM;
    if (!H || !H.cfg || !H.state) return false;
    const hitPos = f.matched.filter((p) => !isPitcherPos(p)), pitRoles = f.matched.filter(isPitcherPos).map((p) => ROLE_KO[p]);
    const side = hitPos.length ? 'HITTER' : 'PITCHER';
    const plan = load(K.plan, {}) || {};
    const hpos = plan.pos && hitPos.includes(plan.pos) ? plan.pos : (hitPos[0] || '지명타자');
    Object.assign(H.cfg, {
      trainOnly: true, handoff: false, resetOn: false, goalOn: false, lineupOn: false, targetSides: [side],
      pitcherRoles: side === 'PITCHER' ? pitRoles : H.cfg.pitcherRoles,
      hitterPositions: side === 'HITTER' ? [hpos] : H.cfg.hitterPositions,
      trainingAutoPlay: true, autoNextAttempt: true, trainingPick: H.cfg.trainingPick === 'manual' ? 'weak' : H.cfg.trainingPick,
    });
    Object.assign(H.state, { side, focus: { PITCHER: P_FOCUS, HITTER: hFocusFor(hpos) }, resetPhase: '', retireDecision: '', trainDoneYear: '', trainOpenYear: '',
      lifeId: Date.now().toString(36), bonusLife: '', trainBonus: 0, statBonus: {}, trainZero: false });
    H.on(true); H.persist?.();
    return side;
  }
  // 「특수훈련 자동 진행」 버튼: 지금 키우는 선수 기준으로 특별훈련(종목 고르기·미니게임·결과)만 자동, 시즌·계약 등은 직접
  const PSTAT_KO = ['구속', '구위', '제구', '체력', '위기관리'];
  const ROLE_OF_DP = { 선발투수: '선발', 불펜투수: '불펜', 중계투수: '불펜', 마무리투수: '마무리' };
  function trainFromGame() {
    const H = window.SLBHM;
    if (!H?.cfg || !H.state) return false;
    if (WAIT === 'player' && STAT.found?.matched?.length) return trainOnly(STAT.found);
    let p = null; try { p = readGame()?.player; } catch {}
    const two = p?.twoWayV1?.mode === 'BOTH';
    const isP = !!p && (p.playerKindV2 === 'PITCHER' || p.position === 'P');
    const dp = p?.detailPosition || '';
    const side = two ? (H.state.side || 'HITTER') : isP ? 'PITCHER' : p ? 'HITTER' : (H.state.side || 'HITTER');
    const fx = Array.isArray(p?.trainingFocusV2) ? p.trainingFocusV2 : [];
    const pf = fx.filter((k) => PSTAT_KO.includes(k)), hf = fx.filter((k) => !PSTAT_KO.includes(k));
    const cfgPatch = { trainOnly: true, handoff: false, resetOn: false, goalOn: false, lineupOn: false,
      trainingAutoPlay: true, autoNextAttempt: true, trainingPick: H.cfg.trainingPick === 'manual' ? 'weak' : H.cfg.trainingPick };
    if (p) {
      cfgPatch.targetSides = two ? ['PITCHER', 'HITTER'] : [side];
      if (isP && ROLE_OF_DP[dp]) cfgPatch.pitcherRoles = [ROLE_OF_DP[dp]];
      if (!isP && dp && dp !== 'P') cfgPatch.hitterPositions = [dp];
    }
    Object.assign(H.cfg, cfgPatch);
    const focus = Object.assign({}, H.state.focus || {});
    if (pf.length) focus.PITCHER = pf; if (hf.length) focus.HITTER = hf;
    if (!focus.HITTER && dp && hFocusFor && POS_W[dp]) focus.HITTER = hFocusFor(dp);
    Object.assign(H.state, { side, focus, resetPhase: '' });
    H.on(true); H.persist?.();
    return side;
  }
  function toggleTrain() {
    const H = window.SLBHM; if (!H) return;
    if (H.cfg.on) { H.cfg.trainOnly = false; H.on(false); H.persist?.(); } else trainFromGame();
    render();
  }
  function found() {
    running = false; save(K.run, false);
    const side = trainOnly(STAT.found);
    STAT.found.mode = side ? 'train' : ''; STAT.finds = (STAT.finds || 0) + 1; save(K.stat, STAT);
    WAIT = 'player'; save(K.wait, WAIT);
    status(`★ 찾았습니다! 육성은 직접 해 주세요${side ? ' — 특별훈련만 대신합니다' : ''}. 다음 선수는 새로운 인생을 누르면 1페이지는 자동, 2페이지에서 투구폼만 고르면 다시 리세합니다`);
    beep(12);
    const orig = document.title; let k = 0;
    clearInterval(titleTimer); titleTimer = setInterval(() => { document.title = (k++ % 2) ? '★ 태생 발견 ★' : orig; }, 800);
    render();
  }
  // 다음 선수: 특별훈련 대신하기를 끄고, 같은 1페이지 정보로 리세 재개 (2페이지 투구폼은 사용자가 고름)
  function resumeNext() {
    const H = window.SLBHM; if (H?.cfg) { H.cfg.trainOnly = false; H.cfg.handoff = false; H.on(false); }
    WAIT = 'form'; save(K.wait, WAIT); formAsked = false;
    STAT = { tries: 0, pre: 0, started: Date.now(), found: null, last: '', finds: STAT.finds || 0 }; save(K.stat, STAT);
    save(K.pend, null);
    clearInterval(titleTimer);
    running = true; save(K.run, true); keepAwake(true);
    lastSig = ''; stuckSince = Date.now();
    status('다음 선수 리세 — 1페이지는 자동으로 채웁니다. 2페이지가 나오면 투구폼만 골라 주세요');
    render();
  }
  function stop(msg, keepWait) {
    running = false; save(K.run, false); keepAwake(false);
    if (!keepWait && WAIT === 'form') { WAIT = ''; save(K.wait, ''); }
    status(msg || '정지'); render();
  }
  function endWait() { // 반복 끝내기: 특별훈련 대신하기도 끔
    WAIT = ''; save(K.wait, '');
    const H = window.SLBHM; if (H?.cfg?.trainOnly) { H.cfg.trainOnly = false; H.on(false); }
    clearInterval(titleTimer); status('반복 대기를 끝냈습니다'); render();
  }
  let armAt = 0;
  function start() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch {}
    let t;
    const fin = $$('.ability-finalize-button').find(vis);
    const saved = TPL && !validate(TPL) ? TPL : null; // 이전에 리세하던 선수 정보 (새로고침해도 남아 있음)
    let usedSaved = false;
    if (fin) { // 2페이지(성장 방향)에서 시작: 고른 투구폼을 기억하고 1페이지 입력값으로 처음부터 리세
      t = load(K.tplPending, null) || saved; usedSaved = !load(K.tplPending, null) && !!saved;
      if (!t) { status('1페이지(기본 정보)부터 다시 입력하고 다음을 눌러 주세요'); return render(); }
      const fb = buttons().find((b) => ['오버핸드', '스리쿼터', '사이드암', '언더핸드'].includes(lab(b)) && isOn(b));
      const hasForm = buttons().some((b) => ['오버핸드', '스리쿼터', '사이드암', '언더핸드'].includes(lab(b)));
      if (hasForm && !fb) { status('투구폼을 고른 뒤 시작을 눌러 주세요'); return render(); }
      FORM = fb ? lab(fb) : '추천'; pendingReset = true;
    } else if (onCreationForm()) {
      const cur = readForm();
      // 1페이지를 직접 고쳤으면 화면 입력값, 안 고쳤으면(새로고침 직후 등) 이전 선수 정보로 되돌려서 시작
      if (saved && (!formTouched || validate(cur))) { t = saved; usedSaved = true; FORM = load(K.form, '추천'); }
      else { t = cur; FORM = '추천'; }
    } else if (saved) { // 다른 화면(홈·진행 중인 선수 등)에서 시작: 이전 선수 정보로 새 인생부터
      const atHome = $$('.home-new-life-button, .stadium-home').some(vis);
      let curId = null; try { curId = readGame()?.player?.id || null; } catch {}
      const macroPlayer = curId && (curId === load(K.rej, null) || curId === load(K.pend, null));
      if (!atHome && !macroPlayer && Date.now() - armAt > 6000) { // 키우던 선수를 실수로 두고 가지 않게 한 번 더 확인
        armAt = Date.now(); status('지금 화면의 선수를 두고 이전 선수 정보로 새 인생부터 리세합니다 — 맞으면 6초 안에 시작을 한 번 더 눌러 주세요'); return render();
      }
      armAt = 0; t = saved; usedSaved = true; FORM = load(K.form, '추천'); pendingReset = true;
    } else { status('생성 1페이지(기본 정보) 또는 2페이지(투구폼)에서 시작을 눌러 주세요'); return render(); }
    save(K.form, FORM);
    const bad = validate(t);
    if (bad) { status(bad); return render(); }
    TPL = t; save(K.tpl, TPL);
    if (window.SLBHM?.cfg) { window.SLBHM.cfg.handoff = false; window.SLBHM.cfg.trainOnly = false; window.SLBHM.on(false); } // 리세 중에는 반쪽 매크로를 꺼서 서로 누르지 않게
    WAIT = ''; save(K.wait, ''); formAsked = false;
    STAT = { tries: 0, pre: 0, started: Date.now(), found: null, last: '', finds: STAT.finds || 0 }; save(K.stat, STAT);
    save(K.pend, null); save(K.rej, null);
    clearInterval(titleTimer);
    running = true; save(K.run, true); keepAwake(true); cycleMark = null;
    lastSig = ''; stuckSince = Date.now();
    formTouched = false;
    status(`시작${usedSaved ? '(이전 선수 정보)' : ''} — ${t.nationality} · ${t.kind} · ${t.hand}${t.kind !== '타자' ? ' · 투구폼 ' + FORM : ''} · 노리는 포지션: ${openPositions(t).join(', ')}`);
    render();
  }

  // ───────────────────────── 패널 (포지션 + 시작/정지) ─────────────────────────
  let statusText = running ? (WAIT === 'form' ? '다음 선수 리세 — 2페이지가 나오면 투구폼만 골라 주세요' : '이어서 진행') : WAIT === 'player' ? '찾은 선수 육성 중 (특별훈련만 대신) — 새로운 인생을 누르면 다음 선수 리세' : '생성 화면에서 정보를 입력하고, 뽑지 않을 포지션과 조건을 고른 뒤 시작';
  // 패널은 Shadow DOM 안에 그려서 게임 CSS(큰 체크박스 등)의 영향을 받지 않게 함
  let host = null, root = null, collapsed = !!load(K.ui, false);
  function status(s) { statusText = s; const el = root?.getElementById('st'); if (el) el.textContent = s; const m = root?.getElementById('mini'); if (m) m.textContent = s; }
  const css = `
:host{all:initial}
.wrap{position:fixed;left:8px;right:8px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:2147483646;font:13px/1.4 -apple-system,system-ui,sans-serif;color:#f8fafc;background:rgba(15,23,42,.95);border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,.4);overflow:hidden;-webkit-text-size-adjust:100%}
.bar{display:flex;align-items:center;gap:8px;padding:8px 10px}
.bar .t{font-weight:700;white-space:nowrap}
#mini{flex:1;min-width:0;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center;border-radius:8px;font:700 13px/1 -apple-system,system-ui,sans-serif}
.go{background:#22c55e;color:#fff;padding:8px 14px}.st{background:#ef4444;color:#fff;padding:8px 14px}
.fold{background:#334155;color:#e2e8f0;padding:8px 10px;min-width:28px}
.fold.on{background:#16a34a;color:#fff}
.body{padding:0 10px 10px;max-height:min(56vh,470px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.hint{opacity:.7;font-size:12px;margin-bottom:4px}
.est{background:#0b3b2e;border:1px solid #166534;color:#bbf7d0;border-radius:8px;padding:6px 8px;font-size:12px;line-height:1.35;word-break:keep-all;margin-bottom:6px}
.sec{margin-top:8px}
.row{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px}
.h{font-weight:700;font-size:12px;word-break:keep-all}
.row .h{flex:1;min-width:0}
.sub{opacity:.65;font-size:11px;line-height:1.35;margin-top:4px;word-break:keep-all}
.mini{background:#334155;color:#e2e8f0;padding:7px 10px;font-size:12px;min-height:30px;flex:none;display:inline-flex;align-items:center}
.grid,.grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
.chip{min-height:34px;padding:5px 2px;display:flex;align-items:center;justify-content:center;background:#1e293b;color:#e2e8f0;border:1px solid #475569;font:600 12px/1.15 -apple-system,system-ui,sans-serif;white-space:normal;word-break:keep-all;overflow-wrap:anywhere}
.grid5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
.chip.on{background:#2563eb;border-color:#60a5fa;color:#fff}
.chip.done{background:#0f172a;color:#64748b;border-color:#334155;text-decoration:line-through}
.chip.done::before{content:'✓ ';text-decoration:none;display:inline-block;color:#22c55e;margin-right:2px}
.dim{opacity:.75;font-size:12px;margin-top:6px;word-break:keep-all}
.hm{display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #334155}
#hmst{flex:1;min-width:0;font-size:12px;word-break:keep-all}
#hmst.stop{color:#fbbf24;font-weight:600}
.found{background:#facc15;color:#111;border-radius:8px;padding:7px 8px;margin-top:8px;font-weight:600;font-size:12px}`;
  // 육성(반자동 도우미) 상태: 그 매크로의 패널은 숨기고 상태 글만 이 패널에 보여 줌
  const hmText = () => { const H = window.SLBHM; if (!H) return ''; const el = document.getElementById('slbhm-status'); return H.cfg.on ? (H.cfg.trainOnly ? '특수훈련 자동: ' : '육성: ') + ((el && el.textContent) || '대기 중') : '특수훈련 자동 진행 꺼짐'; };
  const hmStop = () => !!document.querySelector('#slbhm-panel.stop');
  function liveHm() {
    if (!root || !window.SLBHM) return;
    const el = root.getElementById('hmst'); if (el) { el.textContent = hmText(); el.className = hmStop() ? 'stop' : ''; }
    const b = root.getElementById('hmon'); if (b) { b.textContent = window.SLBHM.cfg.on ? '특수훈련 자동 진행 ON' : '특수훈련 자동 진행 OFF'; b.className = 'fold' + (window.SLBHM.cfg.on ? ' on' : ''); }
    const m = root.getElementById('mini'); if (m && collapsed && !running && window.SLBHM.cfg.on) m.textContent = hmText();
  }
  function render() {
    if (!host) {
      host = document.createElement('div'); host.id = 'sbr-panel';
      root = host.attachShadow({ mode: 'open' });
      document.body.appendChild(host);
    }
    if (!host.isConnected) document.body.appendChild(host);
    const hrs = STAT.started ? ((Date.now() - STAT.started) / 3600000).toFixed(1) : '0.0';
    const f = STAT.found;
    const keepScroll = root.querySelector('.body')?.scrollTop || 0; // 다시 그려도 설정 목록 스크롤 위치 유지
    const btn = running ? '<button class="st" id="stop">정지</button>' : WAIT === 'player' ? '<button class="st" id="endwait">반복 끝</button>' : '<button class="go" id="start">시작</button>';
    root.innerHTML = `<style>${css}</style><div class="wrap">
      <div class="bar"><span class="t">${window.__SLB_CHANNEL__ === 'dev' ? '[테스트] ' : ''}${f ? '★ 발견' : WAIT === 'form' ? '다음 선수' : '태생 리세'}${STAT.finds ? ' (' + STAT.finds + '명)' : ''}</span><span id="mini">${collapsed ? statusText : '시도 ' + STAT.tries + ' · 후보 탈락 ' + STAT.pre + ' · ' + hrs + '시간'}</span>${btn}<button class="fold" id="fold">${collapsed ? '▲' : '▼'}</button></div>
      ${collapsed ? '' : `<div class="body">
        <div id="est" class="est">${estText()}</div>
        <div class="sec"><div class="row"><span class="h">뽑지 않을 포지션 선택</span><button class="mini" id="allpos">${POSITIONS.every((x) => DONE.has(x)) ? '모두 해제' : '모두 체크'}</button></div>
        <div class="grid">${POSITIONS.map((x) => `<button class="chip${DONE.has(x) ? ' done' : ''}" data-pos="${x}">${x}</button>`).join('')}</div>
        <div class="sub">✓ 표시한 포지션은 뽑지 않습니다 · v${VERSION}${window.__SLB_CHANNEL__ === 'dev' ? ' · 테스트판' : ''}</div></div>
        <div class="sec"><div class="h">잠재력 (GENIUS는 항상 노림)</div>
        <div class="grid4">${[[95, '고려 안 함'], [96, '96 이상'], [97, '97 이상'], [98, '98만']].map(([v, l]) => `<button class="chip${CFG.cap === v ? ' on' : ''}" data-cap="${v}">${l}</button>`).join('')}</div>
        <div class="sub">GENIUS 잠재력은 타자 95~98, 투수 96~98로 나옵니다 · 고려 안 함은 GENIUS면 수치와 상관없이 통과</div></div>
        <div class="sec"><div class="h">수비 적성 (야수 포지션)</div>
        <div class="grid3">${[['rec', '추천'], ['none', '고려 안 함'], [12, '12 이상'], [14, '14 이상'], [16, '16 이상'], [18, '18 (최고)']].map(([v, l]) => `<button class="chip${CFG.apt === v ? ' on' : ''}" data-apt="${v}">${l}</button>`).join('')}</div>
        <div class="sub">추천: 포수 17 · 2루수·3루수·우익수 16 · 나머지 15 / 적성은 4~18 사이로 나오고, 좌익수는 18이 거의 안 나옵니다</div></div>
        <div class="sec"><div class="h">몸 상태 (내구도)</div>
        <div class="grid4">${[['ANY', '고려 안 함'], ['NORMAL', '보통 이상'], ['STRONG', '튼튼 이상'], ['IRON', '강철']].map(([v, l]) => `<button class="chip${CFG.dur === v ? ' on' : ''}" data-dur="${v}">${l}</button>`).join('')}</div>
        <div class="sub">확률 강철 8% · 튼튼 27% · 보통 45% · 부상 잦음 17% · 유리몸 3% / 투타겸업은 투수·타자 내구도가 같습니다</div></div>
        <div class="sec"><div class="h">꾸준형(보통형) 회귀 시 성장 속도 · 타자 (PA 목표 시)</div>
        <div class="grid2">${[[true, '빠름만'], [false, '고려 안 함']].map(([v, l]) => `<button class="chip${CFG.fast === v ? ' on' : ''}" data-fast="${v}">${l}</button>`).join('')}</div>
        <div class="sub">빠름은 타자 시드의 22%입니다 · 투수는 이 갈래가 없어 보지 않습니다 · 지속형·후반형으로 회귀할 생이면 '고려 안 함'이 리세 시간이 짧습니다</div></div>
        ${TPL && !validate(TPL) ? `<div class="sub">저장된 선수 정보: ${TPL.nationality || ''} · ${TPL.kind} · ${TPL.hand || ''} · ${TPL.name}${TPL.team ? ' · ' + TPL.team : ''} — 1페이지를 직접 고치지 않으면 시작할 때 이 정보로 되돌립니다</div>` : ''}
        <div id="st" class="dim">${statusText}</div>
        ${STAT.last ? `<div class="dim">최근 ${STAT.last}</div>` : ''}
        ${window.SLBHM ? `<div class="hm"><span id="hmst">${hmText()}</span><button class="fold${window.SLBHM.cfg.on ? ' on' : ''}" id="hmon">${window.SLBHM.cfg.on ? '특수훈련 자동 진행 ON' : '특수훈련 자동 진행 OFF'}</button></div>` : ''}
        ${f ? `<div class="found">★ ${f.name} — ${f.matched.join(', ')} 조건 통과<br>${f.pp ? '투수 ' + describe(f.pp) + '<br>' : ''}${f.hp ? '타자 ' + describe(f.hp) + '<br>' : ''}${f.apts?.length ? '적성 ' + f.apts.join(' · ') + '<br>' : ''}직접 키워 주세요${f.mode === 'train' ? ' (특별훈련만 대신합니다)' : ''}. 다 키우면 이 포지션을 '뽑지 않을 포지션'에 체크하고 새로운 인생을 누르세요 — 2페이지 투구폼만 고르면 다시 리세합니다.</div>` : ''}
      </div>`}</div>`;
    root.querySelectorAll('[data-pos]').forEach((b) => { b.onclick = () => { const x = b.dataset.pos; DONE.has(x) ? DONE.delete(x) : DONE.add(x); save(K.done, [...DONE]); render(); }; });
    const allBtn = root.getElementById('allpos');
    if (allBtn) allBtn.onclick = () => { DONE = POSITIONS.every((x) => DONE.has(x)) ? new Set() : new Set(POSITIONS); save(K.done, [...DONE]); render(); };
    const setC = (k, v) => { CFG[k] = v; saveCfg(); render(); };
    root.querySelectorAll('[data-cap]').forEach((b) => { b.onclick = () => setC('cap', Number(b.dataset.cap)); });
    root.querySelectorAll('[data-apt]').forEach((b) => { b.onclick = () => { const v = b.dataset.apt; setC('apt', /^\d+$/.test(v) ? Number(v) : v); }; });
    root.querySelectorAll('[data-dur]').forEach((b) => { b.onclick = () => setC('dur', b.dataset.dur); });
    root.querySelectorAll('[data-fast]').forEach((b) => { b.onclick = () => setC('fast', b.dataset.fast === 'true'); });
    const bodyEl = root.querySelector('.body'); if (bodyEl && keepScroll) bodyEl.scrollTop = keepScroll;
    root.getElementById('start')?.addEventListener('click', start);
    root.getElementById('stop')?.addEventListener('click', () => stop('정지했습니다'));
    root.getElementById('endwait')?.addEventListener('click', endWait);
    root.getElementById('hmon')?.addEventListener('click', toggleTrain);
    root.getElementById('fold').onclick = () => { collapsed = !collapsed; save(K.ui, collapsed); render(); };
  }

  window.SLBBirth = { start, stop, stat: () => STAT, readGame, judge, readForm, estimate: () => estimate(TPL || readForm()), cfg: () => CFG, _set: (o) => { if (o.done) { DONE = new Set(o.done); save(K.done, o.done); } if (o.tpl) TPL = o.tpl; render(); } };
  // 이전 버전(발견하면 은퇴까지 자동 육성)에서 넘겨받아 키우던 선수가 있으면 육성을 멈추고 특별훈련만 대신하는 대기로 바꿈
  function migrate() {
    const H = window.SLBHM;
    if (!H?.cfg?.handoff || running) return;
    if (STAT.found?.matched?.length) {
      trainOnly(STAT.found); STAT.found.mode = 'train'; save(K.stat, STAT);
      WAIT = 'player'; save(K.wait, WAIT);
      statusText = '키우던 선수의 자동 육성을 멈췄습니다 — 육성은 직접, 특별훈련만 대신합니다. 새로운 인생을 누르면 다음 선수 리세';
    } else { H.cfg.handoff = false; H.on(false); }
  }
  const boot = () => {
    try { migrate(); } catch {}
    if (window.SLBHM) { const st = document.createElement('style'); st.textContent = '#slbhm-panel,#slbhm-goal,#slbhm-goalbtn{display:none!important}'; document.head.appendChild(st); }
    render(); setInterval(liveHm, 1000); setInterval(() => { const el = root?.getElementById('est'); if (el) { const t = estText(); if (el.textContent !== t) el.textContent = t; } }, 1500); setInterval(tick, 50); setInterval(() => running && render(), 15000); if (running) keepAwake(true); };
  if (document.body) boot(); else addEventListener('DOMContentLoaded', boot);
})();
}
(function () {
  let isolated = false;
  try {
    isolated = (typeof window.wrappedJSObject === 'object' && window.wrappedJSObject !== null) ||
      (typeof unsafeWindow !== 'undefined' && unsafeWindow !== window);
  } catch (e) { isolated = false; }
  if (window.__SLB_PAGE__ || !isolated) { __SLB_MAIN__(); return; }
  const s = document.createElement('script');
  s.textContent = 'window.__SLB_PAGE__=true;(' + __SLB_MAIN__.toString() + ')();';
  (document.head || document.documentElement).appendChild(s);
  s.remove();
})();
