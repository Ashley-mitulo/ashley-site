/* glossary-tip.js — 术语悬浮解释层（T3，面向领导可读性优化）
 * 数据：/api/glossary（{terms:[{term,domain,plain,source,confidence}]}）。
 * 铁律：只解释、不改写页面内容；confidence=pending 追加「（出处待核）」；ID/代码串不误标。
 * 实现：text node 拆分（不 innerHTML 重写），避免破坏原有 DOM 绑定。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  var TERMS = null;       // [{term, plain, source, confidence}]
  var MAP = null;         // term -> entry
  var MAXLEN = 0;
  var tipEl = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // —— 载入词表（一次）——
  function load() {
    if (TERMS) return Promise.resolve(TERMS);
    return API.fetchGlossary().then(function (g) {
      var list = (g && g.terms) || [];
      // 只保留有解释的；按长度降序做最长匹配
      list = list.filter(function (t) { return t && t.term && t.plain; });
      list.sort(function (a, b) { return b.term.length - a.term.length; });
      TERMS = list;
      MAP = {};
      list.forEach(function (t) { if (!MAP[t.term]) MAP[t.term] = t; });
      MAXLEN = list.length ? list[0].term.length : 0;
      return TERMS;
    }).catch(function () { TERMS = []; MAP = {}; return TERMS; });
  }

  // —— 悬浮卡 ——
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "sb-gloss-tip";
    tipEl.style.display = "none";
    document.body.appendChild(tipEl);
    return tipEl;
  }
  function showTip(entry, target) {
    var t = ensureTip();
    var html = '<div class="g-plain">' + esc(entry.plain) + "</div>";
    if (entry.source) html += '<div class="g-src">出处：' + esc(entry.source) + (entry.confidence === "pending" ? " （出处待核）" : "") + "</div>";
    else if (entry.confidence === "pending") html += '<div class="g-src">（出处待核）</div>';
    t.innerHTML = html;
    t.style.display = "block";
    var r = target.getBoundingClientRect();
    var top = r.bottom + window.scrollY + 6;
    var left = r.left + window.scrollX;
    t.style.top = top + "px";
    t.style.left = Math.max(8, Math.min(left, window.innerWidth - t.offsetWidth - 12)) + "px";
  }
  function hideTip() { if (tipEl) tipEl.style.display = "none"; }

  // —— 判定：该文本片段是否是 ID/代码串（不标）——
  // 规则：含 2 个以上大写字母连写，或形如 XX-YY 的全大写短横线串（如 C-COAL-MOISTURE、R1-APRON-DEPTH）
  function looksLikeCode(s) {
    return /[A-Z]{2,}/.test(s) || /[A-Z]+-[A-Z0-9-]{2,}/.test(s);
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, A: 1, INPUT: 1, SELECT: 1, OPTION: 1, TEXTAREA: 1, BUTTON: 1 };

  // —— 扫描单个文本节点，命中则拆分替换 ——
  function processTextNode(node) {
    var parent = node.parentNode;
    if (!parent || SKIP_TAGS[parent.tagName]) return;
    if (parent.classList && (parent.classList.contains("sb-term") || parent.classList.contains("g-plain") || parent.classList.contains("g-src"))) return;
    if (parent.hasAttribute && parent.hasAttribute("data-no-glossary")) return;
    var text = node.nodeValue;
    if (!text || text.length < 2 || !/[^\s]/.test(text)) return;
    if (looksLikeCode(text)) return;   // 整段像代码/ID，跳过

    // 贪心最长匹配，找出所有命中区间
    var hits = [];
    var i = 0;
    while (i < text.length) {
      var matched = null;
      for (var L = Math.min(MAXLEN, text.length - i); L >= 2; L--) {
        var cand = text.substr(i, L);
        if (MAP[cand]) { matched = { term: cand, entry: MAP[cand] }; break; }
      }
      if (matched) { hits.push({ start: i, end: i + matched.term.length, entry: matched.entry }); i += matched.term.length; }
      else { i++; }
    }
    if (!hits.length) return;

    // 用 DocumentFragment 拆分（不破坏父节点绑定）
    var frag = document.createDocumentFragment();
    var pos = 0;
    hits.forEach(function (h) {
      if (h.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, h.start)));
      var span = document.createElement("span");
      span.className = "sb-term";
      span.textContent = h.entry.term;
      span.setAttribute("data-gloss", h.entry.term);
      frag.appendChild(span);
      pos = h.end;
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    parent.replaceChild(frag, node);
  }

  // —— 扫描一个根容器（限标题与结论区，避免全局噪音）——
  function scan(root) {
    if (!root || !MAP) return 0;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    var count = 0;
    nodes.forEach(function (nd) { var before = nd.nodeValue; processTextNode(nd); if (nd.parentNode === null) count++; });
    return count;
  }

  // —— 事件委托：悬停/点击显示；移动端可点 ——
  function bindEvents(root) {
    var el = root || document;
    el.addEventListener("mouseover", function (e) {
      var t = e.target.closest && e.target.closest(".sb-term");
      if (t && t.getAttribute("data-gloss")) showTip(MAP[t.getAttribute("data-gloss")], t);
    });
    el.addEventListener("mouseout", function (e) {
      var t = e.target.closest && e.target.closest(".sb-term");
      if (t) hideTip();
    });
    el.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".sb-term");
      if (t && "ontouchstart" in window) {   // 触屏：点击切换
        e.preventDefault();
        var cur = tipEl && tipEl.style.display === "block";
        if (cur) hideTip(); else showTip(MAP[t.getAttribute("data-gloss")], t);
      }
    });
  }

  // —— 对外：初始化（selector 数组 = 要扫描的容器）——
  function init(selectors) {
    load().then(function () {
      bindEvents(document);
      var sels = selectors || [];
      function runScan() {
        sels.forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (r) { scan(r); });
        });
      }
      runScan();
      // 结论区异步渲染后再扫（MutationObserver 防抖）
      var t = null;
      var obs = new MutationObserver(function () {
        if (t) return;
        t = setTimeout(function () { t = null; runScan(); }, 300);
      });
      sels.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (r) { obs.observe(r, { childList: true, subtree: true }); });
      });
      window.__GLOSSARY_SCAN = runScan;
    });
  }

  window.GLOSSARY_TIP = { load: load, scan: scan, init: init, _map: function () { return MAP; } };
})();
