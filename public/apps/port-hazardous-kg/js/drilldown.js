/* ===== 四层下钻层叠抽屉（第三批）=====
   层：L0 全景 → L1 分类清单 → L2 实体六维画像 → L3 证据溯源
   原则：下钻在页内完成，上层不消失（右侧逐层堆叠），图谱主视图保留，面包屑可回退，URL 同步。
   依赖：PKG_API（api.js）、window.PKG_DRILL 暴露供 app.js 调用。 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var DIMS = [
    { key: "hazard", ico: "🔥", name: "危险特性" },
    { key: "incompatible", ico: "⛔", name: "禁配关系" },
    { key: "reaction", ico: "⚛️", name: "化学反应" },
    { key: "emergency", ico: "🚒", name: "应急处置" },
    { key: "accident", ico: "📉", name: "历史事故" },
    { key: "enterprise", ico: "🏭", name: "关联企业" }
  ];

  var state = {
    layers: []            // [{level:'L0'|'L1'|'L2'|'L3', title, data}]
  };

  function ensureShell() {
    if ($("drawer-root")) return;
    var root = document.createElement("div");
    root.id = "drawer-root"; root.className = "drawer-root";
    root.innerHTML =
      '<div id="drawer-mask" class="drag"></div>' +
      '<div id="drawer-stack" class="drawer-stack"></div>';
    document.body.appendChild(root);
    $("drawer-mask").addEventListener("click", closeAll);
  }

  // 每个抽屉 header 内的紧凑路径（当前层往回）：全景 › A › B
  function crumbInlineHTML() {
    var parts = ['<span class="crumb-item" data-i="-1">全景</span>'];
    state.layers.forEach(function (L, i) {
      parts.push('<span class="crumb-sep">›</span>');
      parts.push('<span class="crumb-item' + (i === state.layers.length - 1 ? ' current' : '') + '" data-i="' + i + '">' + esc(L.title) + "</span>");
    });
    return '<div class="drawer-crumb-inline">' + parts.join("") + "</div>";
  }

  // 面包屑已内嵌到每个抽屉 header；此函数刷新各层 header 内的路径并绑定回退
  function breadcrumbRender() {
    var stack = $("drawer-stack");
    if (!stack) return;
    Array.prototype.forEach.call(stack.querySelectorAll(".drawer"), function (d, idx) {
      var box = d.querySelector(".drawer-crumb-inline");
      if (!box) return;
      box.innerHTML = crumbInlineHTML();
      box.querySelectorAll(".crumb-item").forEach(function (el) {
        el.addEventListener("click", function () {
          var i = parseInt(el.dataset.i, 10);
          if (i === -1) { closeAll(); return; }
          truncateTo(i);
        });
      });
    });
  }

  function renderStack() {
    var stack = $("drawer-stack");
    stack.innerHTML = "";
    var n = state.layers.length;
    state.layers.forEach(function (L, i) {
      var d = document.createElement("div");
      d.className = "drawer" + (i === n - 1 ? " open" : "");
      d.id = "drawer-layer-" + i;
      var isTop = i === n - 1;
      var showBack = isTop && n > 1;    // 顶层且有更下层 → 显示「返回上一级」
      var closeLabel = (isTop && n === 1) ? "返回全景" : "关闭";
      d.innerHTML =
        '<div class="drawer-header">' +
          (showBack ? '<button class="btn-back" title="返回上一级">← 返回</button>' : '<span class="dd-level">' + L.level + "</span>") +
          '<span class="dd-title">' + esc(L.title) + "</span>" +
          '<button class="btn-close" title="' + closeLabel + '">×</button></div>' +
        '<div class="drawer-crumb-inline"></div>' +
        '<div class="drawer-body">' + L.bodyHTML + "</div>";
      stack.appendChild(d);
      var backBtn = d.querySelector(".btn-back");
      if (backBtn) backBtn.addEventListener("click", function () { if (state.layers.length > 1) truncateTo(state.layers.length - 2); });
      d.querySelector(".btn-close").addEventListener("click", closeAll);   // ×恒为关闭整个抽屉
      bindL1Rows(d, L);   // L1 清单行 → L2（返回重绘后也要重绑，否则丢失监听）
      bindL2L3(d, i);
    });
  }

  // L1 分类清单行 → L2：每次 renderStack 后对当前层重绑，确保「返回后再次点击」不失效
  // 根因：openL1 只在首次 setTimeout 绑一次，返回（truncateTo→renderStack）重建 DOM 后监听丢失
  function bindL1Rows(d, L) {
    var rows = d.querySelectorAll(".dd-row");
    if (!rows.length || L.level !== "L1") return;
    Array.prototype.forEach.call(rows, function (row) {
      row.addEventListener("click", function () {
        openL2(row.getAttribute("data-name"), row.getAttribute("data-kind"), L.domain, L.title);
      });
    });
  }

  // P1-2：层叠抽屉露边——非顶层保留可见宽度（阶梯状露边，下钻几层一目了然），顶层全宽
  function scaleBacks() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".drawer-stack .drawer"));
    var n = els.length;
    els.forEach(function (el, i) {
      var depth = (n - 1) - i;            // depth=0 顶层，越大越在底层
      el.style.width = (420 - depth * 34) + "px";   // 每层向左缩 34px 露边
      el.style.opacity = depth === 0 ? "1" : "0.35";
      el.style.transform = "";
      el.style.zIndex = i;
      el.style.overflow = depth === 0 ? "hidden" : "visible";  // 露边层要显示内容不被裁切
      el.classList.toggle("open", depth === 0);
    });
  }

  // L2 / L3 内的点击（六维卡片 → L3 证据）
  function bindL2L3(d, i) {
    Array.prototype.forEach.call(d.querySelectorAll("[data-ev]"), function (el) {
      el.addEventListener("click", function () {
        openL3(el.getAttribute("data-ev"), el.getAttribute("data-type") || "goods", el.getAttribute("data-title") || "");
      });
    });
  }

  function truncateTo(i) {
    if (i < 0) { closeAll(); return; }
    state.layers = state.layers.slice(0, i + 1);
    renderStack(); breadcrumbRender(); syncUrl();
  }

  function closeAll() {
    state.layers = [];
    var mask = $("drawer-mask"); if (mask) mask.classList.remove("show");
    var stack = $("drawer-stack"); if (stack) stack.innerHTML = "";
    history.replaceState(null, "", location.pathname);
    document.body.classList.remove("dd-open");
    // 演示 D：通知外部抽屉已全部关闭（供 home.js 复位星系聚焦）
    try { document.dispatchEvent(new CustomEvent("kgdrill:close")); } catch (e) {}
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function syncUrl() {
    // P1-3：每个参数只写一次（去重），取各层最深信息（domain/entity/claim 全局唯一）
    var params = {};
    state.layers.forEach(function (L) {
      if (L.domain) params.domain = L.domain;
      if (L.entity) params.entity = L.entity;
      if (L.level === "L3" && L.claim) params.claim = L.claim;
    });
    var qs = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); });
    try { history.replaceState(null, "", location.pathname + (qs.length ? "?" + qs.join("&") : "")); } catch (e) {}
  }

  // ---------- 对外 API ----------
  var USE_MASK = false;   // 下钻抽屉默认不遮罩（递进下钻，下层保留可见）；工作台可调 setMask(true)
  function pushLayer(L) {
    ensureShell();
    state.layers.push(L);
    if (USE_MASK) { $("drawer-mask").classList.add("show"); $("drawer-mask").style.pointerEvents = "auto"; }
    renderStack(); scaleBacks(); breadcrumbRender(); syncUrl();
  }

  // L1 分类清单（domain 已有分类数据）
  function openL1(domainKey, title, items, typeHint) {
    var bodyHTML =
      '<div class="dd-list">' +
      (items.length ? items.map(function (it, i) {
        var score = it.riskScore != null ? '<span class="dd-score">' + it.riskScore + "</span>" : "";
        return '<div class="dd-row ' + esc(it.kind || "") + '" data-name="' + esc(it.name) + '" data-kind="' + esc(it.kind || typeHint || "goods") + '">' +
          '<span class="dd-rank">' + (i + 1) + "</span>" +
          '<span class="dd-name">' + esc(it.name) + "</span>" +
          '<span class="dd-meta">' + esc(it.meta || "") + "</span>" + score +
          '<span class="dd-arrow">›</span></div>';
      }).join("") : '<div class="empty">暂无实体</div>') +
      "</div>";
    pushLayer({ level: "L1", title: title, bodyHTML: bodyHTML, domain: domainKey });
    // L1 行点击 → L2 由 renderStack 的 bindL1Rows 统一绑定（首次与返回重绘均生效），此处不再重复绑定
  }

  // L2 实体六维画像
  function openL2(name, kind, domainKey, fromTitle) {
    var title = name;
    var isTank = kind === "storage_tank" || kind === "tank";
    var bodyHTML =
      '<div class="dd-obj-head">' + esc(name) + '<span class="dd-obj-type">' + (isTank ? "储罐/设施" : "危货实体") + "</span></div>" +
      '<div id="dd-radar" class="dd-radar" style="height:170px;margin-bottom:10px"></div>' +
      '<div class="dd-dims">' + DIMS.map(function (dim) {
        return '<div class="dd-dim" data-ev="' + esc(name) + '" data-type="' + (isTank ? "tank" : "goods") + '" data-title="' + esc(name + " · " + dim.name) + '">' +
          '<div class="dd-dim-head"><span class="dd-dim-ico">' + dim.ico + "</span><span class='dd-dim-name'>" + dim.name + "</span></div>" +
          '<div class="dd-dim-body dd-dim-loading">加载中…</div></div>';
      }).join("") + "</div>" +
      '<div class="dd-dims" style="margin-top:10px"><div class="dd-dim" data-ev="' + esc(name) + '" data-type="' + (isTank ? "tank" : "goods") + '" data-title="' + esc(name + " · 风险综述") + '" style="grid-column:1/-1">' +
      '<div class="dd-dim-head"><span class="dd-dim-ico">🛡</span><span class="dd-dim-name">综合证据溯源</span></div>' +
      '<div class="dd-dim-body dd-dim-risk">逐条追溯该对象结论的依据来源（法规/报告/推理路径）…</div></div></div>';
    pushLayer({ level: "L2", title: title, bodyHTML: bodyHTML, entity: name, domain: domainKey, kind: kind });
    // P0-A：统一入口——储罐走 tank-profile；复合禁配对给拆解 UI；货种走 goods-profile。全部带 catch+超时兜底，不允许永久 loading。
    if (isTank) {
      loadTankProfile(name);
    } else if (isPairName(name)) {
      renderPairSplitUI(name);
    } else {
      loadGoodsProfile(name);
    }
    // 超时兜底：8s 后若还有个卡在“加载中”，替换为“数据暂不可用”
    setTimeout(function () {
      var top = $("drawer-stack"); var d = top.querySelector(".drawer.open"); if (!d) return;
      d.querySelectorAll(".dd-dim-body.dd-dim-loading").forEach(function (b) {
        b.innerHTML = "数据暂不可用（接口超时）"; b.classList.remove("dd-dim-loading");
      });
    }, 8000);

    // ---- 货种六维 ----
    function loadGoodsProfile(nm) {
      PKG_API.analyzeGoodsProfile(nm).then(function (p) {
        if (!p || !p.stats) {
          // stats 为空（可能是复合名变体）：若仍含拆字符则渲染拆解，否则给空态
          if (isPairName(nm)) { renderPairSplitUI(nm); return; }
          return markUnavailable(nm);
        }
        var s = p.stats;
        var dimText = {
          hazard: s.safetyLevel ? '危险程度<b>' + (s.safetyLevel === "high" ? "较高" : s.safetyLevel === "medium" ? "中等" : "较低") + "</b>综合评估已生成" : (p.assessment || "").slice(0, 40) + "…",
          incompatible: '<b>' + s.incompatible + "</b> 种禁配（" + topN(p.incompatibleNames, 2) + "）",
          reaction: '<b>' + s.reactions + "</b> 条反应特性（" + topN(p.reactions.map(function (r) { return r.name; }), 1) + "）",
          emergency: '<b>' + s.emergency + "</b> 套应急规程（" + topN(p.emergency.map(function (e) { return e.scenario; }), 1) + "）",
          accident: '<b>' + s.accidents + "</b> 起关联事故（" + topN(p.accidents.map(function (a) { return a.name; }), 1) + "）",
          enterprise: '<b>' + s.enterprises + "</b> 家关联企业（" + topN(p.enterpriseNames, 1) + "）"
        };
        fillL2Dims(nm, dimText);
        renderRadar({
          hazard: dimCount(p.hazardDim || riskToAxis(p.riskScore)),
          incompatible: Math.min(5, s.incompatible || 0),
          reaction: Math.min(5, s.reactions || 0),
          emergency: Math.min(5, s.emergency || 0),
          accident: Math.min(5, s.accidents || 0),
          enterprise: Math.min(5, s.enterprises || 0)
        });
      }).catch(function () { markUnavailable(nm); });
    }
    // ---- 储罐六维 ----
    function loadTankProfile(nm) {
      PKG_API.fetchTankProfile(nm).then(function (p) {
        if (!p || !p.found) { markUnavailable(nm, "未找到该储罐数据"); return; }
        var dimText = {
          hazard: '危险程度<b>' + (p.safetyLevel === "high" ? "较高" : p.safetyLevel === "medium" ? "中等" : "较低") + "</b>（" + esc(p.category || "") + "）",
          incompatible: '<b>' + p.incompatible + "</b> 处罐区禁配（" + topN(p.incompatibleNames, 2) + "）",
          reaction: '介质：' + topN(p.mediums, 3) + (p.mediumStatus ? "（" + esc(p.mediumStatus) + "）" : ""),
          emergency: '<b>' + p.emergency + "</b> 套应急规程（" + topN(p.emergencyNames, 1) + "）",
          accident: '<b>' + p.accidents + "</b> 起关联事故（" + topN(p.accidentNames, 1) + "）",
          enterprise: '<b>' + p.enterprises + "</b> 家关联企业（" + topN(p.enterpriseNames, 1) + "）"
        };
        fillL2Dims(nm, dimText);
        renderRadar({
          hazard: p.safetyLevel === "high" ? 3 : p.safetyLevel === "medium" ? 2 : 1,
          incompatible: Math.min(5, p.incompatible || 0),
          reaction: p.mediums && p.mediums.length ? Math.max(1, Math.min(5, p.mediums.length)) : 0,
          emergency: Math.min(5, p.emergency || 0),
          accident: Math.min(5, p.accidents || 0),
          enterprise: Math.min(5, p.enterprises || 0)
        });
      }).catch(function () { markUnavailable(nm); });
    }
    // ---- 复合禁配对：拆解提示 ----
    function renderPairSplitUI(nm) {
      var m = isPairName(nm); if (!m) return;
      fillL2Dims(nm, {
        hazard: "复合禁配对，请<span style='color:#22D3EE'>拆解至两侧货种</span>查看六维画像",
        incompatible: "<b>互为禁配</b>：" + esc(m[1]) + " ↔ " + esc(m[2]),
        reaction: "建议分别查看两侧货种的化学与风险画像",
        emergency: "禁配共存建议核查隔离间距/分罐存放",
        accident: "合并查看两侧货种的关联事故",
        enterprise: "分别看两家经营方分布"
      });
      renderPairSplitButtons(nm, m);
      renderRadar({ hazard: 2, incompatible: 5, reaction: 2, emergency: 1, accident: 1, enterprise: 2 });
    }
    // ---- 兜底：不可用文案 ----
    function markUnavailable(nm, msg) {
      fillL2Dims(nm, null, msg || "数据暂不可用");
    }
    function topN(arr, n) { return (arr || []).slice(0, n).join("、") || "—"; }
    // 拆解按钮（复用 openL3 的 splitPairButtons 逻辑）
    function renderPairSplitButtons(nm, m) {
      var top = $("drawer-stack"); var d = top.querySelector(".drawer.open"); if (!d) return;
      d.querySelectorAll(".dd-dim").forEach(function (el, i) {
        if (i !== 0) return;   // 只插到第一张卡里，避免重复
      });
      var box = document.createElement("div"); box.className = "dd-split";
      box.innerHTML = '<div class="dd-split-tip">该对象为复合禁配对，建议拆解至两侧货种分别溯源：</div>' +
        '<button class="dd-split-btn" data-split="' + esc(m[1]) + '" style="background:rgba(255,159,67,.85)">' + esc(m[1]) + "</button>" +
        '<button class="dd-split-btn" data-split="' + esc(m[2]) + '" style="background:rgba(76,195,255,.85)">' + esc(m[2]) + "</button>";
      var firstDim = d.querySelector(".dd-dim");
      if (firstDim) firstDim.appendChild(box);
      box.querySelectorAll(".dd-split-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { openL2(btn.getAttribute("data-split"), "goods", domainKey, ""); });
      });
    }
  }
  function isPairName(s) {
    var m = String(s || "").trim().match(/^(.+?)\s*(?:↔|[-–]|和|与)\s*(.+)$/);
    return m ? m : null;
  }
  function dimCount(v) { return v == null ? 1 : (Number(v) || 1); }
  // P2-a：riskScore(0~30+) 连续映射到六维轴 1-5（危险强度证据量，不再用离散 safetyLevel 映射）
  function riskToAxis(rs) { rs = Number(rs) || 0; return Math.max(1, Math.min(5, Math.round(rs / 6))); }
  // 用后端数据填充 L2 六维卡 body；msg 传入时所有卡显示该兜底文案
  function fillL2Dims(name, dimText, msg) {
    var top = $("drawer-stack"); var d = top.querySelector(".drawer.open"); if (!d) return;
    d.querySelectorAll(".dd-dim").forEach(function (el) {
      var body = el.querySelector(".dd-dim-body"); if (!body) return;
      // P0-A：填充后清掉 loading 残留 class/样式（不复用斜体灰）
      body.classList.remove("dd-dim-loading");
      if (msg) { body.innerHTML = msg; return; }
      var headName = el.querySelector(".dd-dim-name") ? el.querySelector(".dd-dim-name").textContent : "";
      var map = { "危险特性": "hazard", "禁配关系": "incompatible", "化学反应": "reaction", "应急处置": "emergency", "历史事故": "accident", "关联企业": "enterprise" };
      var k = map[headName];
      if (k && dimText[k]) body.innerHTML = dimText[k];
    });
  }
  // 演示 E：L2 六维雷达图（六轴=六维，轴长=证据量）。依赖全局 echarts（首页已引入）。
  function renderRadar(values) {
    if (typeof echarts === "undefined") return;
    var top = $("drawer-stack"); var d = top.querySelector(".drawer.open"); if (!d) return;
    var el = d.querySelector("#dd-radar"); if (!el) return;
    var dims = [
      { k: "hazard", n: "危险特性" }, { k: "incompatible", n: "禁配关系" }, { k: "reaction", n: "化学反应" },
      { k: "emergency", n: "应急处置" }, { k: "accident", n: "事故" }, { k: "enterprise", n: "关联企业" }
    ];
    var radar = echarts.init(el);
    var radVals = dims.map(function (dm) { return values[dm.k] != null ? values[dm.k] : 0; });
    radar.setOption({
      tooltip: {},
      radar: {
        indicator: dims.map(function (dm) { return { name: dm.n, max: 5 }; }),
        radius: "62%",
        axisName: { color: "#7c8aa0", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(34,211,238,.25)" } },
        splitArea: { areaStyle: { color: ["rgba(34,211,238,.04)", "rgba(34,211,238,.08)"] } },
        axisLine: { lineStyle: { color: "rgba(34,211,238,.35)" } }
      },
      series: [{
        type: "radar", data: [{ value: radVals, name: "证据强度", areaStyle: { color: "rgba(34,211,238,.35)" }, lineStyle: { color: "#22D3EE", width: 2 }, itemStyle: { color: "#22D3EE" } }]
      }]
    });
    // 抽屉关闭/换层时清理雷达实例
    var disposeId = setInterval(function () {
      if (!document.body.contains(el)) { if (!radar.isDisposed()) radar.dispose(); clearInterval(disposeId); }
    }, 300);
  }

  // L3 证据溯源
  function openL3(node, type, title) {
    ensureShell();
    // 若 L3 已开（最后层），先出栈旧的再进新的
    if (state.layers.length && state.layers[state.layers.length - 1].level === "L3") state.layers.pop();
    var bodyHTML = '<div class="empty">正在溯源 <b>' + esc(node) + "</b> 的依据…</div>";
    pushLayer({ level: "L3", title: title || node + " · 证据", bodyHTML: bodyHTML, entity: node, claim: node });
    PKG_API.fetchEvidence(node, type === "tank" ? "tank" : "goods").then(function (res) {
      if (!res) { renderL3Body('<div class="empty">溯源服务不可用</div>'); return; }
      var realClaims = (res.claims || []).filter(function (c) { return !(c.confidence === 0 || (c.source && c.source.type === "none")); });
      // P0-1 兜底：接口识别为 empty（无可用证据）或只有占位 claim 时——渲染友好空态，不显示「置信度 0.00」废卡
      var top = $("drawer-stack");
      var lastTop = top.querySelector(".drawer.open .drawer-body");
      if (!realClaims.length) {
        var pairBtn = splitPairButtons(node);
        lastTop.innerHTML =
          '<div class="dd-claims"><div class="empty">该对象暂未挂接可溯源证据' + (type === "tank" ? "" : "（可能是复合禁配对或冷门货种）") + "</div>" + pairBtn + "</div>";
        return;
      }
      var claims = realClaims.map(function (c) {
        var src = (c.source && c.source.name) || "";
        var clause = (c.source && c.source.clause) || "";
        var conf = c.confidence != null ? c.confidence : 1;
        var confTxt = conf < 1 ? '<span class="dd-claim-conf">置信度 ' + conf.toFixed(2) + "</span>" : "";
        return '<div class="dd-claim">' +
          '<div class="dd-claim-text">' + esc(c.text || "") + "</div>" +
          '<div class="dd-claim-meta"><span>来源：' + esc(src) + (clause ? " · " + esc(clause) : "") + "</span>" +
          "<span>推理：<code>" + esc(c.inference || "") + "</code></span></div>" + confTxt +
          "</div>";
      }).join("");
      renderL3Body('<div class="dd-claims">' + claims + "</div>");
    });
    function renderL3Body(inner) {
      var top = $("drawer-stack");
      var last = top.querySelector(".drawer.open .drawer-body");
      if (last) last.innerHTML = inner;
    }
    // P0-1：复合禁配名 → 拆解为两侧货种按钮（点击进入各自正常证据链）
    function splitPairButtons(node) {
      var m = String(node || "").trim().match(/^(.+?)\s*(?:↔|[-–]|和|与)\s*(.+)$/);
      if (!m) return "";
      var a = m[1].trim(), b = m[2].trim();
      return '<div class="dd-split"><div class="dd-split-tip">建议拆解为两侧货种分别溯源</div>' +
        '<button class="dd-split-btn" data-split="' + esc(a) + '">' + esc(a) + "</button>" +
        '<button class="dd-split-btn" data-split="' + esc(b) + '">' + esc(b) + "</button></div>";
    }
    renderL3Body('<div class="empty">正在溯源 <b>' + esc(node) + "</b> 的依据…</div>");
    setTimeout(function () {
      var top = $("drawer-stack");
      var d = top.querySelector(".drawer.open");
      if (!d) return;
      Array.prototype.forEach.call(d.querySelectorAll(".dd-split-btn"), function (btn) {
        btn.addEventListener("click", function () {
          openL3(btn.getAttribute("data-split"), "goods", btn.getAttribute("data-split") + " · 证据");
        });
      });
    }, 30);
  }

  window.PKG_DRILL = { openL1: openL1, openL2: openL2, openL3: openL3, closeAll: closeAll, isOpen: function () { return state.layers.length > 0; }, getLayers: function () { return state.layers.slice(); }, setMask: function (on) { USE_MASK = !!on; if (!on) { var m = $("drawer-mask"); if (m) { m.classList.remove("show"); m.style.pointerEvents = "none"; } } } };
})();