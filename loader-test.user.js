// ==UserScript==
// @name         SLB macro 불러오기 (테스트판)
// @namespace    slbcareerlab-slb-macro-loader-dev
// @version      1.00
// @description  게임 페이지를 열 때마다 GitHub 저장소(slbcareerlab/SLB-macro)의 dev 갈래에서 매크로를 받아 실행합니다. 받기에 실패하면 이 기기에 저장된 마지막 버전을 실행합니다. 확인용입니다. 출시용 불러오기와 동시에 켜지 마세요.
// @match        https://slbcareer.com/*
// @match        https://*.slbcareer.com/*
// @match        http://slbcareer.com/*
// @match        http://*.slbcareer.com/*
// @inject-into  page
// @sandbox      raw
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==
(function () {
  'use strict';
  if (window.__SLB_LOADER__) return; // 불러오기 스크립트가 두 개 켜져 있어도 한 번만
  window.__SLB_LOADER__ = 'dev';
  const URL = 'https://raw.githubusercontent.com/slbcareerlab/SLB-macro/dev/slb-macro.user.js';
  const KEY = 'slb-loader-cache-dev';
  const CHANNEL = 'dev' === 'main' ? 'main' : 'dev';
  const ok = (code) => typeof code === 'string' && code.length > 10000 && code.includes('==UserScript==') && code.includes('__SLB_MAIN__');
  function run(code, from) {
    const s = document.createElement('script');
    s.textContent = 'window.__SLB_CHANNEL__=' + JSON.stringify(CHANNEL) + ';window.__SLB_LOADED_FROM__=' + JSON.stringify(from) + ';\n' + code;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
  }
  function toast(msg) {
    try {
      const d = document.createElement('div');
      d.textContent = msg;
      d.style.cssText = 'position:fixed;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:2147483647;background:#7c2d12;color:#fff;font:600 13px/1.4 -apple-system,system-ui,sans-serif;padding:8px 10px;border-radius:10px;text-align:center';
      document.body.appendChild(d); setTimeout(() => d.remove(), 6000);
    } catch (e) {}
  }
  const cached = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  const bust = Math.floor(Date.now() / 60000); // 1분마다 새 주소로 받아 GitHub 캐시를 피함
  fetch(URL + '?t=' + bust, { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((code) => {
      if (!ok(code)) throw new Error('받은 파일이 매크로가 아님');
      try { localStorage.setItem(KEY, code); } catch (e) {}
      run(code, 'github');
    })
    .catch((e) => {
      if (ok(cached)) { run(cached, 'cache'); toast('매크로를 새로 받지 못해 이 기기에 저장된 버전으로 실행합니다 (' + (e && e.message || e) + ')'); }
      else toast('매크로를 받지 못했습니다 — 인터넷 연결을 확인하고 새로고침해 주세요 (' + (e && e.message || e) + ')');
    });
})();
