/* datasources-ui.js — 数据源接入矩阵（工作台 T3.4，M3）
 * 读 /api/datasources，按三态分组：已接入(公开) / 待内部资料 / 动态值(生产系统)。
 * 原则：取不到「—」；不编造；动态值为 null 明示待接。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var GRP = { ready: "ds-ready", internal: "ds-internal", dynamic: "ds-dynamic" };
  var GRP_T = { ready: "已接入 · 公开资料", internal: "待内部资料 · Ashley 收集", dynamic: "动态值 · 需接生产系统" };

  function itemHtml(it, group) {
    var badge = group === 'ready' ? '<span class="ds-badge ds-b-ok">✓ 已接入</span>'
      : group === 'internal' ? '<span class="ds-badge ds-b-wait">⏳ 待资料</span>'
      : '<span class="ds-badge ds-b-dyn">🔄 动态</span>';
    var sub = '';
    if (group === 'dynamic' && it.field) {
      sub = '<span class="ds-code">' + esc(it.field) + '</span>' +
        (it.filled != null ? ' <span class="ds-count">' + it.filled + '/' + it.total + ' 有值</span>' : '') +
        (it.sample != null ? ' · 示例 <b>' + esc(it.sample) + '</b>' : ' · 示例 —');
    }
    return '<div class="ds-item ' + (GRP[group] || '') + '">' +
      '<div class="ds-item-h">' + badge +
      '<span class="ds-name">' + esc(it.name || it.field || '—') + '</span></div>' +
      (sub ? '<div class="ds-sub">' + sub + '</div>' : '') +
      (it.note ? '<div class="ds-note">' + esc(it.note) + '</div>' : '') +
      '</div>';
  }

  function render() {
    var main = $("wb-main");
    main.innerHTML = '<div class="ds-loading">加载数据源状态…</div>';
    API.get("/api/datasources").then(function (res) {
      var html = (res.matrix || []).map(function (g) {
        return '<div class="ds-group"><div class="ds-group-t">' + esc(GRP_T[g.status] || g.group) + ' <span class="ds-count">(' + g.items.length + ')</span></div>' +
          '<div class="ds-items">' + g.items.map(function (it) { return itemHtml(it, g.status); }).join("") + "</div></div>";
      }).join("");
      main.innerHTML =
        '<div class="ds-page"><div class="ds-head"><div class="ds-title">数据源接入状态</div>' +
        '<div class="ds-desc">知识库数据来源矩阵：公开资料已接入 / 内部资料待收集 / 动态值需接生产系统</div></div>' + html + "</div>";
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
  }

  window.__WB && window.__WB.register("datasources", render);
})();