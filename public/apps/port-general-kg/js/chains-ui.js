/* chains-ui.js — 求解链监控（工作台 T4.2，M4）
 * 读 /api/chains/stats + /api/chains/stats/detail + /api/chains
 * 展示：北极星链完备率 KPI + 每条链完备状态卡（步数/完整度/断链定位），可展开看详情。
 * 原则：取不到「—」；断链即不合格（fail 明示）；不编造。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var main = $("wb-main");
    main.innerHTML = '<div class="ch-loading">加载求解链监控…</div>';
    Promise.all([
      API.get("/api/chains/stats"),
      API.get("/api/chains/stats/detail"),
      API.get("/api/chains")
    ]).then(function (res) {
      var stats = res[0], detail = res[1], chains = res[2];
      // KPI 卡
      var kpis = [
        { label: "链完备率", value: (stats.completeness != null ? stats.completeness + "%" : "—"), cls: stats.completeness === 100 ? "ok" : (stats.completeness >= 80 ? "warn" : "bad") },
        { label: "断链", value: (stats.broken != null ? stats.broken : "—"), cls: stats.broken ? "bad" : "ok" },
        { label: "可用链", value: (stats.complete != null ? stats.complete : "—"), cls: "ok" },
        { label: "总链数", value: (stats.total != null ? stats.total : "—"), cls: "" }
      ];
      var kpiHtml = kpis.map(function (k) {
        return '<div class="ch-kpi ' + k.cls + '"><div class="ch-kpi-v">' + esc(k.value) + '</div><div class="ch-kpi-l">' + esc(k.label) + "</div></div>";
      }).join("");

      // TE-1: 动态求解记录区块（detail 现为 {chains, dynamicRuns}）
      var SOLVER_CHAIN = { 'S1-BERTHING-FEASIBILITY': 'CHAIN-BERTHING-DECISION', 'S2-THROUGHPUT': 'CHAIN-THROUGHPUT-BOTTLENECK' };
      var dyn = (detail && detail.dynamicRuns) || (stats && stats.dynamic) || { total: 0, list: [], bySolver: {} };
      var dynList = (dyn.list || []).map(function (r) {
        var iv = Object.keys(r.inputs || {}).map(function (k) { return k + "=" + (r.inputs[k] || ""); }).join(" ");
        var chId = SOLVER_CHAIN[r.solverId] || "";
        return '<div class="ch-dyn-row">' +
          '<span class="ch-dyn-solver">' + esc(r.solverName || r.solverId || "?") + "</span>" +
          '<span class="ch-dyn-in">' + esc(iv || "默认参数") + "</span>" +
          '<span class="ch-dyn-cpl' + (r.completeness && r.completeness.complete ? " ok" : "") + '">' + (r.completeness != null ? (r.completeness.complete ? "完备" : "断链") : "—") + "</span>" +
          '<span class="ch-dyn-tm">' + esc(r.time || "") + "</span>" +
          (chId ? '<a class="ch-dyn-g" href="#/graph:' + encodeURIComponent(chId) + '" title="该链图谱">图谱</a>' : "") +
          "</div>";
      }).join("");
      var dynHtml = '<div class="ch-dyn"><div class="ch-dyn-h">动态求解记录' +
        ' <span class="ch-dyn-total">' + (dyn.total != null ? dyn.total : 0) + ' 次</span></div>' +
        (dynList ? '<div class="ch-dyn-list">' + dynList + "</div>" : '<div class="ch-dyn-empty">暂无求解记录——在工作台任一求解器改参求解后这里会实时出现</div>') +
        "</div>";

      // 每条链卡（detail.chains）
      var chainsArr = Array.isArray(detail) ? detail : ((detail && detail.chains) || []);
      var cardHtml = chainsArr.map(function (d) {
        var miss = (d.missingSource || []);
        var okCls = d.complete ? "ch-card-ok" : "ch-card-bad";
        var tag = d.complete ? '<span class="ch-tag ch-tag-ok">✓ 完备</span>' : '<span class="ch-tag ch-tag-bad">✗ 断链</span>';
        return '<div class="ch-card ' + okCls + '">' +
          '<div class="ch-card-h"><span class="ch-name">' + esc(d.name) + "</span>" + tag + "</div>" +
          '<div class="ch-meta">' + (d.stepCount != null ? d.stepCount + " 步" : "—") + "</div>" +
          (miss.length ? '<div class="ch-miss">缺 source：' + miss.map(esc).join("、") + "</div>" : "") +
          "</div>";
      }).join("");

      main.innerHTML =
        '<div class="ch-page"><div class="ch-head"><div class="ch-title">求解链监控</div>' +
        '<div class="ch-desc">推理链完备性实时看板——北极星：链完备率 100%，断链即不合格</div></div>' +
        '<div class="ch-kpis">' + kpiHtml + "</div>" +
        '<div class="ch-cards">' + (cardHtml || '<div class="wb-empty">无推理链</div>') + "</div>" +
        dynHtml + "</div>";
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
  }

  window.__WB && window.__WB.register("chains", render);
})();