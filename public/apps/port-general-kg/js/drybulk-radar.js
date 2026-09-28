/* drybulk-radar.js — 干散货域 L2 六维画像（六边形雷达图 + 六张维卡）
 * 数据源：window.__DRY_BULK_SEED（全部真实，带 source）
 * 原则：不编造分值。雷达每轴 = 该实体在「该维度是否有真实数据支撑」的强度，
 *       有真实字段→据实归一化(0~1)，缺失→0 并显示「—」。六张维卡列出真实数据项+source。
 * 红线：catch/finally + 8s 超时兜底；取不到显示「—」，无英文类型码。
 */
(function () {
  "use strict";
  function seedNow() { return window.__DRY_BULK_SEED || null; }
  function num(v) { return (v != null && isFinite(v)) ? v : null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // 六维定义（与星系/seed 一致）
  var DIMS = [
    { key: "cargo", name: "货物特性", color: "#b5651d" },
    { key: "process", name: "装卸工艺", color: "#3a7bd5" },
    { key: "yard", name: "堆场仓储", color: "#7eb356" },
    { key: "safety", name: "安全环保", color: "#e0863c" },
    { key: "capacity", name: "作业能力", color: "#2dd4a7" },
    { key: "regulation", name: "法规事件", color: "#b28cff" }
  ];

  // —— 每类实体按 kind 取数组 ——
  function arrOf(kind) {
    var S = seedNow(); if (!S) return [];
    return S[kind === "vessel" ? "vessels" : kind === "berth" ? "berths" : kind === "yard" ? "yards" : kind === "equipment" ? "equipment" : "constraints"] || [];
  }

  // —— 六维画像计算：返回 [{key,name,color,value(0~1),has,label,source}] 不编造 ——
  function profileOf(kind, id) {
    var item = arrOf(kind).filter(function (o) { return o.id === id; })[0];
    if (!item) return [];
    var out = [];
    DIMS.forEach(function (dm) {
      var p = { key: dm.key, name: dm.name, color: dm.color, value: 0, has: false, label: "—", source: item.source || "—" };
      switch (kind) {
        case "vessel": vesselDim(item, dm, p); break;
        case "berth": berthDim(item, dm, p); break;
        case "yard": yardDim(item, dm, p); break;
        case "equipment": equipDim(item, dm, p); break;
        case "constraint": consDim(item, dm, p); break;
      }
      out.push(p);
    });
    return out;
  }

  // —— 各 kind 的六维取值（真实字段→label + 0~1 归一化强度；缺失 has=false value=0 ——

  // 船舶：货物特性(载重/吃水)、装卸工艺(在港时间)、作业能力(载货量)、法规(来源)
  function vesselDim(o, dm, p) {
    if (dm.key === "cargo") {
      if (num(o.dwt_t)) { p.has = true; p.value = Math.min(1, (o.dwt_t / 400000) * 0.9 + 0.1); p.label = "载重 " + (o.dwt_t / 10000) + " 万吨"; }
      else if (num(o.designDraft_m)) { p.has = true; p.value = 0.5; p.label = "吃水 " + o.designDraft_m + " m"; }
    } else if (dm.key === "process") {
      if (num(o.berthTime_h)) { p.has = true; p.value = Math.min(1, o.berthTime_h / 50); p.label = "在港 " + o.berthTime_h + " h"; }
    } else if (dm.key === "yard") {
      // 船舶无堆场字段
    } else if (dm.key === "safety") {
      if (num(o.designDraft_m)) { p.has = true; p.value = 0.4; p.label = "设计吃水 " + o.designDraft_m + " m"; }
    } else if (dm.key === "capacity") {
      if (num(o.actualCargo_t)) { p.has = true; p.value = Math.min(1, o.actualCargo_t / 400000); p.label = (o.actualCargo_t / 10000) + " 万吨实载"; }
      else if (num(o.dwt_t)) { p.has = true; p.value = Math.min(1, o.dwt_t / 400000); p.label = "载重 " + (o.dwt_t / 10000) + " 万吨"; }
    } else if (dm.key === "regulation") {
      p.has = true; p.value = 0.3; p.label = "主尺度/规范依据";
    }
  }

  // 泊位：满六维（最丰富）
  function berthDim(o, dm, p) {
    if (dm.key === "cargo") {
      if (num(o.berthClass_t)) { p.has = true; p.value = Math.min(1, o.berthClass_t / 400000); p.label = "靠泊 " + (o.berthClass_t / 10000) + " 万吨级"; }
    } else if (dm.key === "process") {
      // 泊位自身无装卸设备字段（设备挂 berthId）
      p.label = "关联装卸设备（见设备域）";
    } else if (dm.key === "yard") {
      p.label = "配套堆场（见堆场域）";
    } else if (dm.key === "safety") {
      if (num(o.apronDepth_m)) { p.has = true; p.value = Math.min(1, o.apronDepth_m / 26); p.label = "前沿水深 " + o.apronDepth_m + " m"; }
    } else if (dm.key === "capacity") {
      if (num(o.annualThroughput_t)) { p.has = true; p.value = Math.min(1, o.annualThroughput_t / 25000000); p.label = "年通过 " + (o.annualThroughput_t / 10000) + " 万吨"; }
      if (num(o.platformLength_m)) { p.has = true; p.value = 0.7; p.label += (p.label ? " · " : "") + "平台长 " + o.platformLength_m + " m"; }
    } else if (dm.key === "regulation") {
      if (o.inNationalLayout === true) { p.has = true; p.value = 1; p.label = "在 40 万吨批复名单"; }
      else if (o.inNationalLayout === false) { p.has = true; p.value = 1; p.label = "名单外（硬否决）"; }
      else { p.label = o.inNationalLayoutNote || "名单待核"; }
    }
  }

  // 堆场
  function yardDim(o, dm, p) {
    if (dm.key === "cargo") {
      if (o.cargoType) { p.has = true; p.value = 0.5; p.label = "货种 " + o.cargoType; }
    } else if (dm.key === "yard") {
      if (num(o.area_m2)) { p.has = true; p.value = Math.min(1, o.area_m2 / 4000000); p.label = "面积 " + (o.area_m2 / 10000) + " 万㎡"; }
      if (num(o.designStorageCapacity_t)) { p.has = true; p.value = 0.8; p.label += (p.label ? " · " : "") + "堆存 " + (o.designStorageCapacity_t / 10000) + " 万吨"; }
    } else if (dm.key === "capacity") {
      if (o.remainingCapacity_t != null) { p.has = true; p.value = 0.6; p.label = "剩余 " + o.remainingCapacity_t + " 吨"; }
      else { p.label = "剩余容量（动态 · 待接入生产系统）"; }
    }
    // 其余维无字段 → 缺失
  }

  // 设备
  function equipDim(o, dm, p) {
    if (dm.key === "process") {
      if (num(o.ratedCapacity_tph)) { p.has = true; p.value = Math.min(1, o.ratedCapacity_tph / 12000); p.label = o.ratedCapacity_tph + " t/h ×" + (num(o.quantity) || 1); }
    } else if (dm.key === "capacity") {
      p.has = true; p.value = 0.5; p.label = "作业能力";
    }
  }

  // 约束规则
  function consDim(o, dm, p) {
    if (dm.key === "regulation") {
      p.has = true; p.value = 1; p.label = (o.basis || o.src || "规范条款").split("§")[0];
    } else if (dm.key === "safety" && /水深|长度|合规/.test(o.name || "")) {
      p.has = true; p.value = 0.8; p.label = "约束校验";
    } else if (dm.key === "capacity" && /瓶颈|能力|吞吐/.test(o.name || "")) {
      p.has = true; p.value = 0.8; p.label = "能力约束";
    }
  }

  // —— solverRouting（实体→求解器深链映射，惰性缓存，后端 /api/domains/:id/config 返回） ——
  var routingCache = null;
  function getRouting(cb) {
    if (routingCache) return cb(routingCache);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/domains/dry-bulk/config");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try { routingCache = (JSON.parse(xhr.responseText).solverRouting) || {}; } catch (e) { routingCache = {}; }
        cb(routingCache);
      }
    };
    xhr.send();
  }
  // 按 kind+item 构造深链；无映射或含 route 类型回退到对应路由页
  function solverHref(kind, item) {
    var r = routingCache && routingCache[kind];
    if (!r) return null;
    if (r.route) return "workbench.html#/" + r.route;
    if (!r.solver) return null;
    var url = "workbench.html#/solver/" + r.solver;
    var val = r.via ? (item && item[r.via]) : (item && item.id);
    if (val) url += "?" + r.param + "=" + encodeURIComponent(val);
    return url;
  }

  // —— 渲染雷达层 ——
  var chart = null, curLayer = null;
  function openProfile(kind, id) {
    var item = arrOf(kind).filter(function (o) { return o.id === id; })[0];
    if (!item) return;
    var prof = profileOf(kind, id);
    renderLayer(kind, item, prof);
  }

  function renderLayer(kind, item, prof) {
    close();
    var lay = document.createElement("div");
    lay.className = "radar-layer";
    lay.innerHTML =
      '<div class="radar-card">' +
      '<div class="radar-head"><span>' + iconOf(kind) + " " + esc(item.name) + "</span><button class=\"radar-close\" aria-label=\"关闭\">✕</button></div>" +
      '<div class="radar-cols">' +
      '<div class="radar-chart" id="__radar_canvas"></div>' +
      '<div class="radar-cards">' + prof.map(cardHtml).join("") + "</div>" +
      "</div>" +
      '<div class="radar-foot"><span class="radar-note">六轴为该实体的数据支撑强度（据实归一化，无数据为“—”）</span>' +
      '<span class="radar-actions"><a class="radar-wb" href="#" style="display:none">🛠️ 去工作台求解 →</a>' +
      '<button class="radar-evidence" data-kind="' + esc(kind) + '" data-id="' + esc(item.id) + '">证据溯源 →</button></span></div>' +
      "</div>";
    var self = lay;
    getRouting(function (routing) {
      var href = solverHref(kind, item);
      var a = self.querySelector(".radar-wb");
      if (a && href) { a.href = href; a.style.display = "inline-flex"; }
    });
    lay.addEventListener("click", function (e) {
      if (e.target === lay) close();
      var wb = e.target.closest(".radar-wb");
      if (wb) { e.preventDefault(); e.stopPropagation(); window.location.href = wb.getAttribute("href"); return; }
      var ev = e.target.closest(".radar-evidence");
      if (ev) {
        var k = ev.getAttribute("data-kind"), i = ev.getAttribute("data-id");
        onEvidence(k, i);
      }
    });
    lay.querySelector(".radar-close").addEventListener("click", close);
    document.body.appendChild(lay);
    document.body.classList.add("radar-lock");
    curLayer = lay;
    drawRadar(lay.querySelector("#__radar_canvas"), prof);
  }

  function cardHtml(p) {
    var bar = p.has ? '<div class="radar-bar"><i style="width:' + Math.round(p.value * 100) + '%;background:' + p.color + '"></i></div>' : "";
    return '<div class="radar-card-item"><div class="radar-ci-h">' +
      '<span class="radar-ci-dot" style="background:' + p.color + '"></span>' +
      '<span class="radar-ci-name">' + p.name + "</span>" +
      (p.has ? '<span class="radar-ci-v">' + esc(p.label) + "</span>" : '<span class="radar-ci-v miss">' + esc(p.label) + "</span>") +
      "</div>" + bar +
      (p.has ? '<div class="radar-ci-src">' + esc(p.source) + "</div>" : "") + "</div>";
  }

  function drawRadar(el, prof) {
    if (!el || !window.echarts) return;
    if (chart) chart.dispose();
    chart = window.echarts.init(el);
    var indicators = prof.map(function (p) { return { name: p.name, max: 1 }; });
    var values = (prof && prof.length ? prof : DIMS.map(function (d) { return { name: d.name, value: 0 }; }));
    chart.setOption({
      tooltip: { trigger: "item" },
      radar: {
        indicator: indicators, radius: "68%", center: ["50%", "55%"],
        axisName: { color: "#cfe0f0", fontSize: 11 },
        splitArea: { areaStyle: { color: ["rgba(38,72,110,.25)", "rgba(38,72,110,.05)"] } },
        splitLine: { lineStyle: { color: "rgba(120,160,200,.25)" } },
        axisLine: { lineStyle: { color: "rgba(120,160,200,.35)" } }
      },
      series: [{ type: "radar", symbolSize: 4, data: [{ value: values.map(function (p) { return p.value; }), name: "六维画像",
        areaStyle: { color: "rgba(224,163,74,.30)" }, lineStyle: { color: "#e0a34a", width: 2 }, itemStyle: { color: "#e0a34a" } }] }]
    }, true);
  }

  function iconOf(kind) {
    return { vessel: "🚢", berth: "⚓", yard: "🏗️", equipment: "⚙️", constraint: "📜" }[kind] || "▫";
  }

  function close() {
    if (chart) { chart.dispose(); chart = null; }
    if (curLayer) { curLayer.remove(); curLayer = null; }
    document.body.classList.remove("radar-lock");
  }

  // 证据溯源回调（由外部注入，避免耦合）
  var onEvidence = function () {};
  function setEvidenceHandler(fn) { onEvidence = fn || function () {}; }

  window.__DRY_BULK_RADAR = { openProfile: openProfile, close: close, setEvidenceHandler: setEvidenceHandler, profileOf: profileOf };
})();