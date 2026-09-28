/* drybulk-detail.js — 干散货域实体详情抽屉（独立隔离模块）
 * 数据源：window.__DRY_BULK_SEED（seed-dry-bulk.js）
 * 设计原则：不依赖/不修改危货的 drilldown.js，自成一套轻量详情浮层。
 * 数据真实性：动态值为 null 的字段渲染「— · 需接入生产系统」；所有值带 source 出处。
 */
(function () {
  "use strict";
  function seedNow() { return window.__DRY_BULK_SEED || null; }

  // 各实体类型的展示字段集（label: 字段名 或 字段名+格式化函数）
  // TF-2/TF-3: 类型码 → 中文名映射（seed 里 type/chainType 的英文码）
  var EQUIP_TYPE_CN = { grabShipUnloader: "抓斗卸船机", beltConveyorLine: "皮带流程线", unloadingRateRecord: "单船卸率历史记录" };
  var CHAIN_TYPE_CN = { compliance: "合规", capability: "能力", rule: "规则", match: "匹配" };
  // TF-3b: 链类型可复合（如 capability+compliance），逐个拆解映射再拼接
  function chainTypeCn(ct) {
    if (!ct) return "—";
    return String(ct).split(/[+\s,]/).filter(Boolean).map(function (t) {
      var k = String(t).trim().toLowerCase();
      return CHAIN_TYPE_CN[k] || t;
    }).join(" + ");
  }

  var KIND = {
    vessel: {
      title: "船舶", icon: "🚢",
      fields: [
        { l: "船名", v: function (o) { return o.name; } },
        { l: "总长 L", v: function (o) { return num(o.lengthOverall_m) + " m"; } },
        { l: "型宽 B", v: function (o) { return num(o.beam_m) + " m"; } },
        { l: "设计吃水 T", v: function (o) { return o.designDraft_m != null ? o.designDraft_m + " m" : "—"; } },
        { l: "载重量", v: function (o) { return o.dwt_t ? fmt(o.dwt_t) + " 吨" : "—"; } },
        { l: "实际载货量", v: function (o) { return o.actualCargo_t != null ? fmt(o.actualCargo_t) + " 吨" : dash("需舱单"); } },
        { l: "在港作业时间", v: function (o) { return o.berthTime_h ? o.berthTime_h + " h" : "—"; } }
      ]
    },
    berth: {
      title: "泊位", icon: "⚓",
      fields: [
        { l: "泊位", v: function (o) { return o.name; } },
        { l: "泊位长度", v: function (o) { return o.berthLength_m ? o.berthLength_m + " m" : (o.platformLength_m ? o.platformLength_m + " m" : "—"); } },
        { l: "前沿水深", v: function (o) { return o.apronDepth_m != null ? o.apronDepth_m + " m" : dash("未公开，不臆断"); } },
        { l: "泊位等级", v: function (o) { return o.berthClass_t ? fmt(o.berthClass_t) + " 吨级" : "—"; } },
        { l: "水工结构设计船型", v: function (o) { return o.structuralDesignShip_t ? fmt(o.structuralDesignShip_t) + " 吨" : "—"; } },
        { l: "设计年通过能力", v: function (o) { return o.annualThroughput_t ? fmt(o.annualThroughput_t) + " 吨" : "—"; } },
        { l: "40万吨批复名单", v: function (o) { return o.inNationalLayout === true ? "✅ 在名单内" : (o.inNationalLayout === false ? "❌ 名单外(硬否决)" : dash(o.inNationalLayoutNote || "待核")); } },
        { l: "占用状态", v: function (o) { return o.occupied != null ? o.occupied : dash("需接入生产系统"); } }
      ]
    },
    yard: {
      title: "堆场", icon: "🏗️",
      fields: [
        { l: "堆场", v: function (o) { return o.name; } },
        { l: "面积", v: function (o) { return o.area_m2 ? fmt(o.area_m2) + " m²" : "—"; } },
        { l: "设计堆存能力", v: function (o) { return o.designStorageCapacity_t ? fmt(o.designStorageCapacity_t) + " 吨" : "—"; } },
        { l: "现存货种", v: function (o) { return o.cargoType || "—"; } },
        { l: "剩余容量", v: function (o) { return o.remainingCapacity_t != null ? fmt(o.remainingCapacity_t) + " 吨" : dash("动态值 · 需接入生产系统"); } }
      ]
    },
    equipment: {
      title: "装卸设备", icon: "⚙️",
      fields: [
        { l: "设备", v: function (o) { return o.name; } },
        { l: "类型", v: function (o) { return EQUIP_TYPE_CN[o.type] || o.type || "—"; } },
        { l: "额定能力", v: function (o) { return o.ratedCapacity_tph ? o.ratedCapacity_tph + " t/h" : "—"; } },
        { l: "台数", v: function (o) { return o.quantity ? o.quantity + " 台" : "—"; } }
      ]
    },
    constraint: {
      title: "约束规则", icon: "📜",
      fields: [
        { l: "规则", v: function (o) { return o.name; } },
        { l: "链类型", v: function (o) { return chainTypeCn(o.chainType); } },
        { l: "公式/规则", v: function (o) { return o.formula || o.rule || "—"; } },
        { l: "依据", v: function (o) { return o.basis || "—"; } }
      ]
    }
  };

  function num(v) { return (v != null && isFinite(v)) ? v : null; }
  function fmt(n) { return n >= 10000 ? (n / 10000).toFixed(0) + " 万" : String(n); }
  function dash(note) { return "— <span class=\"dbd-note\">(" + esc(note) + ")</span>"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function openDetail(kind, id) {
    var SEED = seedNow();
    if (!SEED) { alert("干散货数据未加载（缺 seed 数据）"); return; }
    var conf = KIND[kind]; if (!conf) return;
    var arr = SEED[kind === "vessel" ? "vessels" : kind === "berth" ? "berths" : kind === "yard" ? "yards" : kind === "equipment" ? "equipment" : "constraints"] || [];
    var item = arr.filter(function (o) { return o.id === id; })[0] || arr[0];
    if (!item) return;

    var rows = conf.fields.map(function (f) {
      return '<div class="dbd-row"><span class="dbd-k">' + esc(f.l) + '</span><span class="dbd-v">' + f.v(item) + "</span></div>";
    }).join("");

    clear();
    var src = item.source || "—";
    // M5: 首页详情抽屉 → 工作台（同源实体档案 / 求解器）
    var kindMap = { vessel: "vessel", berth: "berth", yard: "yard", equipment: "equipment", constraint: "constraint" };
    var wbHref = 'workbench.html#/entity/' + (kindMap[kind] || 'vessel') + '/' + encodeURIComponent(item.id || '');
    var lay = document.createElement("div");
    lay.className = "dbd-layer";
    lay.innerHTML =
      '<div class="dbd-card">' +
      '<div class="dbd-head">' + conf.icon + " " + esc(item.name || conf.title) + '<button class="dbd-close" aria-label="关闭">✕</button></div>' +
      '<div class="dbd-body">' + rows +
      '<div class="dbd-src"><span class="dbd-k">数据出处</span><span class="dbd-v">' + esc(src) + "</span></div>" +
      '<a class="dbd-wb" href="' + esc(wbHref) + '">🛠️ 在工作台查看完整档案 →</a>' +
      "</div></div>";
    lay.addEventListener("click", function (e) { if (e.target === lay) clear(); });
    lay.querySelector(".dbd-close").addEventListener("click", clear);
    document.body.appendChild(lay);
    document.body.classList.add("dbd-lock");
  }

  var curLayer = null;
  function clear() {
    if (curLayer) { curLayer.remove(); curLayer = null; }
    document.body.classList.remove("dbd-lock");
  }

  // 对外 API
  window.__DRY_BULK_DETAIL = { openDetail: openDetail, close: clear, kinds: function () { return Object.keys(KIND); } };

  // 模式：在当前页面注入一行"干散货实体详情"快捷条（点按钮打开对应列表，可点选具体实体）
  function mountQuickBar() {
    var barId = "dbd-quickbar";
    if (document.getElementById(barId)) return;
    var bar = document.createElement("div");
    bar.id = barId;
    bar.innerHTML =
      '<div class="dbd-quickbar"><span class="dbd-qb-t">干散货实体</span>' +
      '<span class="dbd-qb-btn" data-kind="berth">⚓ 泊位</span>' +
      '<span class="dbd-qb-btn" data-kind="vessel">🚢 船舶</span>' +
      '<span class="dbd-qb-btn" data-kind="yard">🏗️ 堆场</span>' +
      '<span class="dbd-qb-btn" data-kind="equipment">⚙️ 设备</span>' +
      '<span class="dbd-qb-btn" data-kind="constraint">📜 约束</span></div>';
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".dbd-qb-btn"); if (!b) return;
      var kind = b.getAttribute("data-kind");
      var SEED = seedNow();
      var arr = SEED ? (SEED[kind === "vessel" ? "vessels" : kind === "berth" ? "berths" : kind === "yard" ? "yards" : kind === "equipment" ? "equipment" : "constraints"] || []) : [];
      if (arr.length === 1) { openDetail(kind, arr[0].id); return; }
      showPicker(kind, arr);
    });
    document.body.appendChild(bar);
  }

  // 选择器：多个实体时列出供选
  function showPicker(kind, arr) {
    var conf = KIND[kind];
    clear();
    var lay = document.createElement("div");
    lay.className = "dbd-layer";
    var items = arr.map(function (o) {
      return '<div class="dbd-pick" data-id="' + esc(o.id) + '">' + esc(o.name) + "</div>";
    }).join("");
    lay.innerHTML = '<div class="dbd-card dbd-picker">' +
      '<div class="dbd-head">' + conf.icon + " 选择" + conf.title + ' <button class="dbd-close">✕</button></div>' +
      '<div class="dbd-body">' + items + "</div></div>";
    lay.addEventListener("click", function (e) {
      var p = e.target.closest(".dbd-pick");
      if (p) { openDetail(kind, p.getAttribute("data-id")); return; }
      if (e.target === lay || e.target.classList.contains("dbd-close")) clear();
    });
    document.body.appendChild(lay);
    document.body.classList.add("dbd-lock");
    curLayer = lay;
  }

  // 挂载快捷条（首页加载完成后）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountQuickBar);
  } else {
    mountQuickBar();
  }
})();
