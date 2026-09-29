/* wb.js — 后端工作台（workbench.html）路由与主逻辑（M1 骨架）
 * 架构：hash 路由（#/solver/:id / #/archive/:dim / #/rules...），刷新可复现。
 * 原则：错误显式报错（顶部红条），取不到显示「—」，不静默。
 */
(function () {
  "use strict";
  var API = window.PKG_API;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // T4: 页面定位条（uiHints.pages，按路由切换）
  var UI_HINTS = null;
  function loadUiHints() {
    if (UI_HINTS) return Promise.resolve(UI_HINTS);
    return API.fetchUiHints().then(function (u) { UI_HINTS = u || {}; return UI_HINTS; }).catch(function () { UI_HINTS = {}; return UI_HINTS; });
  }
  function updateWhere(route) {
    var el = $("wb-where"); if (!el) return;
    loadUiHints().then(function (u) {
      var pg = (u && u.pages) || {};
      var key = null;
      if (route.type === "solver") key = "solver/" + route.id;
      else if (route.type === "graph" || route.type === "graph-chain" || route.type === "graph-domain") key = "graph";
      else key = "workbench";
      var entry = pg[key] || (route.type === "solver" ? pg["workbench"] : null);
      el.textContent = (entry && entry.where) ? entry.where : "";
    });
  }

  // —— 错误红条（显式报错）——
  function showError(msg) {
    var bar = $("wb-errorbar");
    if (bar) { bar.textContent = "⚠ " + msg; bar.classList.remove("hidden"); clearTimeout(showError._t); showError._t = setTimeout(function () { bar.classList.add("hidden"); }, 6000); }
  }

  // —— 路由解析：hash -> {type, id} 兼容两种格式 #/solver/ID 与 #/solver:ID ——
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    var seg = h.split(/[?]/)[0];
    var qs = h.indexOf("?") >= 0 ? h.slice(h.indexOf("?") + 1) : "";
    var params = {};
    qs.split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); });
    // 统一分割符：冒号或斜杠
    var parts = seg.split(/[/:]/).filter(Boolean);
    if (parts[0] === "solver") return { type: "solver", id: parts[1] || "", params: params };
    if (parts[0] === "archive") return { type: "archive", id: parts[1] || "", params: params };
    if (parts[0] === "rules") return { type: "rules", params: params };
    if (parts[0] === "datasources") return { type: "datasources", params: params };
    if (parts[0] === "chains") return { type: "chains", params: params };
    if (parts[0] === "entity") return { type: "entity", id: parts[1] || "", params: { id2: parts[2] || "", ...params } };
    if (parts[0] === "graph") return parts[1] ? { type: "graph-chain", id: parts[1], params: params } : { type: "graph", params: params };
    if (parts[0] === "graph-domain") return { type: "graph", params: { domain: parts[1] || "dry-bulk", ...params } };
    return { type: "home", params: {} };
  }

  // —— 导航项高亮 ——
  function syncNav(route) {
    var key = route.type === "solver" ? "solver:" + route.id : route.type === "archive" ? "archive:" + route.id : route.type;
    document.querySelectorAll(".wb-nav-item").forEach(function (el) {
      var r = el.getAttribute("data-route") || "";
      var active = r === key;
      // archive 维度与 solver 的归属不做精确匹配，仅导航自身项
      el.classList.toggle("active", active);
    });
  }

  // —— 统一渲染主区：先清空，根据 route 调用对应渲染器 ——
  var RENDERERS = {};
  function renderRoute(route) {
    var main = $("wb-main");
    syncNav(route);
    updateWhere(route);   // T4: 页面定位条
    // 页面标题级占位；各模块 renderer 由后续里程碑注册
    if (route.type === "solver") { if (RENDERERS.solver) RENDERERS.solver(route); else main.innerHTML = '<div class="wb-empty">求解器 ' + esc(route.id) + '（待接通，见 T1.7）</div>'; }
    else if (route.type === "archive") { if (RENDERERS.archive) RENDERERS.archive(route); else main.innerHTML = '<div class="wb-empty">档案库 · 维度（待接通，见 T3.1）</div>'; }
    else if (route.type === "rules") { if (RENDERERS.rules) RENDERERS.rules(route); else main.innerHTML = '<div class="wb-empty">约束规则库（待接通，见 T3.3）</div>'; }
    else if (route.type === "datasources") { if (RENDERERS.datasources) RENDERERS.datasources(route); else main.innerHTML = '<div class="wb-empty">数据源接入状态（待接通，见 T3.4）</div>'; }
    else if (route.type === "chains") { if (RENDERERS.chains) RENDERERS.chains(route); else main.innerHTML = '<div class="wb-empty">求解链监控（待接通，见 T4.2）</div>'; }
    else if (route.type === "entity") { if (RENDERERS.entity) RENDERERS.entity(route); else main.innerHTML = '<div class="wb-empty">实体详情（待接通）</div>'; }
    else if (route.type === "graph" || route.type === "graph-chain") { if (RENDERERS.graph) RENDERERS.graph(route); else main.innerHTML = '<div class="wb-empty">知识图谱（待接通）</div>'; }
    else main.innerHTML = '<div class="wb-empty">选择左侧求解器或档案库开始</div>';
    // T3: 路由渲染后扫描术语（若组件就绪；异步内容由 MutationObserver 兼顾）
    if (window.GLOSSARY_TIP && window.GLOSSARY_TIP.scan) { try { window.GLOSSARY_TIP.scan(main); } catch (e) {} }
  }

  function navigate(hash) {
    if (location.hash !== hash) { location.hash = hash; }  // 触发 hashchange
    else { renderRoute(parseHash()); }                     // 相同 hash 强制重渲染
  }

  // —— 初始化：导航点击 + hashchange ——
  function init() {
    document.querySelectorAll(".wb-nav-item[data-route]").forEach(function (el) {
      el.addEventListener("click", function () { navigate("#/" + el.getAttribute("data-route")); });
    });
    window.addEventListener("hashchange", function () { renderRoute(parseHash()); });
    // 顶栏数据源状态点击 → 数据源页
    var src = $("wb-src-state"); if (src) src.addEventListener("click", function () { navigate("#/datasources"); });
    // 顶栏全局搜索：回车 → 跨实体模糊匹配
    var sb = $("wb-search");
    if (sb) sb.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { doSearch(sb.value.trim()); }
    });
    renderRoute(parseHash());   // 初始渲染（刷新可复现）
    // T3: 术语悬浮解释层（扫描标题/结论/卡片区，不全局扫）
    if (window.GLOSSARY_TIP && window.GLOSSARY_TIP.init) {
      window.GLOSSARY_TIP.init(["#wb-main", ".sb-conclusion", ".sb-card", ".sb-chain", ".sb-title", ".sb-desc"]);
    }
  }

  // —— 全局搜索：跨船舶/泊位/堆场/设备/约束 模糊匹配，结果点跳 entity 路由 ——
  var LOADED_ENT = null;
  function ensureEnt() {
    if (LOADED_ENT) return Promise.resolve(LOADED_ENT);
    return API.get("/api/domains/dry-bulk/entities").then(function (s) {
      LOADED_ENT = s; return s;
    });
  }
  var TYPE_CN = { vessels: "船舶", berths: "泊位", yards: "堆场", equipment: "设备", constraints: "约束规则" };
  function doSearch(q) {
    var main = $("wb-main");
    if (!q) { main.innerHTML = '<div class="wb-empty">输入关键词搜索 船舶/泊位/堆场/设备/约束…</div>'; return; }
    main.innerHTML = '<div class="wb-empty">搜索中…</div>';
    ensureEnt().then(function (s) {
      var hits = [];
      Object.keys(TYPE_CN).forEach(function (k) {
        (s[k] || []).forEach(function (it) {
          var name = String(it.name || "");
          if (name.indexOf(q) >= 0) hits.push({ type: k === "constraints" ? "constraint" : k === "vessels" ? "vessel" : k === "berths" ? "berth" : k === "yards" ? "yard" : "equipment", typeCn: TYPE_CN[k], id: it.id, name: it.name });
        });
      });
      if (!hits.length) { main.innerHTML = '<div class="wb-empty">未找到含「' + esc(q) + '」的实体，试试 泊位/船舶/设备/约束</div>'; return; }
      main.innerHTML =
        '<div class="wb-empty" style="text-align:left"><b>搜索「' + esc(q) + '」共 ' + hits.length + ' 条：</b></div>' +
        hits.map(function (h) {
          return '<div class="wb-sr-item" data-href="#/entity/' + h.type + '/' + esc(h.id) + '">' +
            '<span class="wb-sr-type">' + esc(h.typeCn) + '</span>' +
            '<span class="wb-sr-name">' + esc(h.name) + "</span></div>";
        }).join("");
      main.querySelectorAll(".wb-sr-item").forEach(function (el) {
        el.addEventListener("click", function () { navigate(el.getAttribute("data-href")); });
      });
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">搜索失败：' + esc(e.message) + "</div>"; });
  }

  // 暴露给后续模块注册 renderer
  window.__WB = { showError: showError, navigate: navigate, parseHash: parseHash, register: function (type, fn) { RENDERERS[type] = fn; }, API: API };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();