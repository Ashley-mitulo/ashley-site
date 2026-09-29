/* demo-tour.js — 全站演示讲解组件（T5，面向领导可读性优化）
 * 脚本：/api/ui-hints 的 demoScripts（键 = 页面 key，值含 steps:[{text,focus,ms}]）。
 * 数值：{{占位}} 运行时插值（由页面注册 provider 提供），严禁硬编码。
 * 用法：DEMO_TOUR.mount(btnEl, pageKey, {provide:fn->obj})
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  var SCRIPTS = null;
  var capEl = null, state = { running: false, idx: 0, timer: null, steps: [], provide: null, btn: null };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function load() {
    if (SCRIPTS) return Promise.resolve(SCRIPTS);
    return API.fetchUiHints().then(function (u) {
      SCRIPTS = (u && u.demoScripts) || {};
      return SCRIPTS;
    }).catch(function () { SCRIPTS = {}; return SCRIPTS; });
  }

  // {{key}} 插值；缺值 → 「—」
  function interpolate(text, data) {
    return String(text).replace(/\{\{(\w+)\}\}/g, function (m, k) {
      var v = data && data[k];
      return (v == null || v === "") ? "—" : String(v);
    });
  }

  function ensureCap() {
    if (capEl && document.body.contains(capEl)) return capEl;
    capEl = document.createElement("div");
    capEl.className = "demo-caption demo-caption-fixed";
    document.body.appendChild(capEl);
    return capEl;
  }
  function show(txt, focusSel) {
    var c = ensureCap();
    c.textContent = txt;
    c.classList.add("show");
    // 轻量聚焦：滚动到 focus 元素（不改变布局）
    if (focusSel) {
      var el = document.querySelector(focusSel);
      if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); } }
    }
  }
  function hide() { if (capEl) capEl.classList.remove("show"); }

  function isRunning() { return state.running; }
  function runStep() {
    if (!state.running) return;
    if (state.idx >= state.steps.length) { hide(); end(); return; }
    var st = state.steps[state.idx];
    var data = (typeof state.provide === "function") ? (state.provide() || {}) : {};
    show(interpolate(st.text || "", data), st.focus);
    state.idx++;
    var ms = st.ms || 2200;
    state.timer = setTimeout(runStep, ms);
  }
  function start() {
    state.running = true; state.idx = 0;
    if (state.btn) state.btn.textContent = "⏸ 演示中";
    runStep();
  }
  function stop() {
    state.running = false; clearTimeout(state.timer); hide();
    if (state.btn) state.btn.textContent = "▶ 讲解";
  }
  function end() { stop(); }
  function next() { if (state.running) { clearTimeout(state.timer); runStep(); } }

  // 挂载：在 btnEl 上绑定；pageKey 取 demoScripts；opts.provide 提供插值数据
  function mount(btnEl, pageKey, opts) {
    if (!btnEl || btnEl.getAttribute("data-demo-mounted")) return;
    btnEl.setAttribute("data-demo-mounted", "1");
    opts = opts || {};
    state.btn = btnEl;
    state.provide = opts.provide || null;
    load().then(function (scripts) {
      var entry = scripts[pageKey];
      state.steps = (entry && entry.steps) || [];
      if (!state.steps.length) { btnEl.style.display = "none"; return; }   // 无脚本则隐藏按钮
      btnEl.style.display = "inline-block";
      btnEl.textContent = "▶ 讲解";
      btnEl.addEventListener("click", function () { if (!state.running) start(); else stop(); });
      // 双击下一步
      btnEl.addEventListener("dblclick", function (e) { e.preventDefault(); next(); });
    });
  }

  // 切换当前页讲解（工作台 SPA 路由变化时调用）
  function setPage(pageKey, provide) {
    return load().then(function (scripts) {
      var entry = scripts[pageKey];
      state.steps = (entry && entry.steps) || [];
      if (provide) state.provide = provide;
      if (state.running) stop();
      if (state.btn) state.btn.style.display = state.steps.length ? "inline-block" : "none";
      return state.steps.length;
    });
  }

  window.DEMO_TOUR = { mount: mount, setPage: setPage, start: start, stop: stop, isRunning: isRunning };
})();
