/* entity-ui.js — 单个实体详情路由（工作台 M5 串联：搜索/首页命中 → 实体档案）
 * 路由 #/entity/{type}/{id}，type∈vessel|berth|yard|equipment|constraint
 * 展示：实体头(类型+名称+valueType徽标) + 全部字段 + 出处 + 「去对应求解器」快捷入口(若有关联)。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var TYPE_CN = { vessel: "船舶", berth: "泊位", yard: "堆场", equipment: "设备", constraint: "约束规则" };
  var VT = { design: ["vt-design", "台账"], measured: ["vt-measured", "实测"], forecast: ["vt-forecast", "推算"] };
  function vtBadge(vt) { var b = VT[vt]; return b ? '<span class="vt-badge ' + b[0] + '">' + b[1] + "</span>" : ""; }

  // 实体 → 关联求解器（跳到同源求解器）
  function solverLink(item, type) {
    if (type === "berth" || type === "vessel") return 'workbench.html#/solver/S1-BERTHING-FEASIBILITY';
    if (type === "equipment") return 'workbench.html#/solver/S2-THROUGHPUT';
    return null;
  }

  function render(route) {
    var type = route.id || "vessel";
    var id = (route.params && route.params.id2) || "";
    var main = $("wb-main");
    main.innerHTML = '<div class="wb-empty">加载实体…</div>';
    API.get("/api/domains/dry-bulk/entities").then(function (s) {
      var list = { vessel: s.vessels, berth: s.berths, yard: s.yards, equipment: s.equipment, constraint: s.constraints }[type] || [];
      var item = list.find(function (x) { return x.id === id; }) || list[0];
      if (!item) { main.innerHTML = '<div class="wb-empty">未找到 ' + type + '/' + esc(id) + "</div>"; return; }
      var rows = Object.keys(item)
        .filter(function (k) { return ["id", "source", "valueType", "note"].indexOf(k) < 0; })
        .map(function (k) {
          var v = item[k];
          var vs = (typeof v === "object" && v !== null) ? JSON.stringify(v) : v;
          return '<div class="ar-row"><span class="ar-k">' + esc(k) + '</span><span class="ar-v">' + (vs != null && vs !== "" ? esc(vs) : "—") + "</span></div>";
        }).join("");
      var wb = solverLink(item, type);
      main.innerHTML =
        '<div class="ar-page"><div class="ar-head"><div class="ar-title"><span class="ar-type">' + esc(TYPE_CN[type] || type) + '</span> ' + esc(item.name || "—") + " " + vtBadge(item.valueType) + "</div>" +
        (item.note ? '<div class="ar-desc">' + esc(item.note) + "</div>" : "") +
        "</div>" +
        '<div class="ar-card"><div class="ar-rows">' + rows + "</div>" +
        (item.source ? '<div class="ar-src">出处：' + esc(item.source) + "</div>" : "") +
        "</div>" +
        (wb ? '<a class="f-wb" href="' + esc(wb) + '">🔧 去求解器测算 →</a>' : "") +
        "</div>";
    }).catch(function (e) { main.innerHTML = '<div class="wb-empty">加载失败：' + esc(e.message) + "</div>"; });
  }

  window.__WB && window.__WB.register("entity", render);
})();