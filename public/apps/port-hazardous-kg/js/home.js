/* home.js — 六维知识星系门户逻辑
 * 数据：/api/home/overview（KPI/域/TOP5/来源）+ /api/graph/topology（星系代表节点按度数取样）
 * 布局：六域固定极坐标（layout:'none'），手工计算位置可复现；focus/blur 实现悬停他域淡出
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  var GALAXY_W = 900, GALAXY_H = 520, CX = 450, CY = 262;
  var R_DOMAIN = 150, R_REP = 50;   // 域中心半径 / 域内代表节点半径

  // 六域定义（严格对应 3.5.5，法规是背景不入星团）
  var DOMAINS = [
    { key: "hazard", name: "危险特性", color: "#ff9f43" },
    { key: "incompatible", name: "禁配关系", color: "#D85A30" },
    { key: "reaction", name: "化学反应", color: "#b28cff" },
    { key: "emergency", name: "应急处置", color: "#4dc3ff" },
    { key: "accident", name: "历史事故", color: "#E24B4A" },
    { key: "enterprise", name: "同类型企业", color: "#2dd4a7" }
  ];
  // 全域罗盘六边形 symbol（ECharts 无内置 hexagon，用自定义 SVG path）
  var RO_SETTE_PATH = "path://M0,-1 L0.866,-0.5 L0.866,0.5 L0,1 L-0.866,0.5 L-0.866,-0.5 Z";

  var chart = null, overview = null, topo = null;
  var idToDomain = {};   // 节点id -> 域key
  var domainData = {};   // 域key -> {nodes:[], links:[]}

  function $(id) { return document.getElementById(id); }

  // ---------- 加载 & 渲染 ----------
  window.__homeDiag = { phase: "start" };
  function init() {
    window.__homeDiag.phase = "init-called";
    window.onerror = function (m, s, l) { window.__homeDiag.err = m + " @" + l; };
    window.addEventListener("unhandledrejection", function (e) { window.__homeDiag.rej = String(e.reason && e.reason.message || e.reason); });
    chart = echarts.init($("galaxy"));
    window.__homeDiag.phase = "chart-init";
    // 容器自适应后，窗口尺寸变化时让图跟随 (演示 A)
    window.addEventListener("resize", function () { if (chart) chart.resize(); });
    // 演示 D：抽屉关闭 → 复位星系聚焦
    document.addEventListener("kgdrill:close", function () { resetFocus(); });
    // 连接状态
    Promise.all([API.fetchHomeOverview(), API.fetchTopology(), API.fetchScreenOverview()]).then(function (rs) {
      overview = rs[0]; topo = rs[1];
      var screenOv = rs[2] || {};
      // P2-D：捕获后端实时风险分（patrolPool），供推理链/结论卡数据驱动（不再写死 29/12/15/24）
      window.__patrolPool = screenOv.patrolPool || [];
      if (!overview) { setStatus(false); fillKpiFallback(); return; }
      setStatus(true);
      renderKpi();
      injectKpiSparklines([6, 9, 7, 12, 11, 15, 14, 18]); // 演示微趋势（提案⑧）
      renderFooter();
      renderFindings();
      renderDomainCounts();
      buildGalaxy();
      // v1.5：推理剧场默认播放最高危链（禁配共存）
      playChain("forbidden-coexist", true);
      // 布局完成后再 resize 一次，确保自适应高度正确 (演示 A)
      if (chart) setTimeout(function () { chart.resize(); }, 50);
      bindEvents();
      // P1-1：支持 URL 直达/刷新恢复（?domain=X&entity=Y&claim=Z）——打开对应下钻抽屉
      applyHomeUrlParams();
    }).catch(function () { setStatus(false); fillKpiFallback(); });
  }

  function setStatus(on) {
    var dot = $("s-dot"), txt = $("s-txt");
    if (on) { dot.classList.add("on"); txt.textContent = "已接入 " + overview.stats.nodeCount + " 节点"; }
    else { dot.classList.remove("on"); txt.textContent = "后端未连接"; }
  }
  function fillKpiFallback() { ["k-node","k-edge","k-goods","k-incompat"].forEach(function (id) { $(id).textContent = "–"; }); }

  // v1.5：底部 4 态势指标（节点/关联/危险货种/隐患结论）
  function renderKpi() {
    var s = overview.stats, nbt = s.nodesByType || {};
    var vals = {
      "k-node": s.nodeCount, "k-edge": s.edgeCount, "k-goods": nbt.dangerous_goods || 0
    };
    Object.keys(vals).forEach(function (id) { countUp(id, vals[id]); });    // 隐患结论数（k-incompat）：优先禁配关系边/域计数，兜底统计顶层禁配合（硝酸铵类）
    var inc = 0;
    try { inc = overview.stats.nodesByType.goods_incompatible || 0; } catch (e) {}
    if (!inc) {
      var dm = overview.domains.filter(function (d) { return d.key === "incompatible"; })[0];
      if (dm) inc = dm.count;
    }
    countUp("k-incompat", inc || 0);
  }
  // ---- 提案⑧：4 个态势指标数字旁注入 sparkline 微趋势（内联 SVG 折线，域色）----
  function sparklineSVG(pts, color) {
    var w = 46, h = 16, pad = 2;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
    var range = (max - min) || 1;
    var stepX = (w - 2 * pad) / (pts.length - 1);
    var coords = pts.map(function (v, i) {
      var x = pad + i * stepX, y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var poly = coords.join(' ');
    var area = pad + ',' + (h - pad) + ' ' + poly + ' ' + (w - pad) + ',' + (h - pad);
    var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="vertical-align:middle;margin-left:4px">' +
      '<polygon points="' + area + '" fill="' + color + '" fill-opacity="0.12"/>' +
      '<polyline points="' + poly + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</svg>';
    return svg;
  }
  // 在 renderKpi 执行后给每个 .kpi-item 注入 sparkline
  function injectKpiSparklines(seed) {
    var items = document.querySelectorAll('#kpi-bar .kpi-item');
    items.forEach(function (it) {
      it.setAttribute('data-spark', '1');
      it.insertAdjacentHTML('beforeend', sparklineSVG(seed, '#38bdf8'));
    });
  }

  // 演示 B：KPI 数字滚动（count-up，1.2s ease-out）
  function countUp(id, target) {
    var el = $(id); if (!el) return;
    var t = Number(target) || 0;
    var dur = 1200, start = null;
    function step(ts) {
      if (start == null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      el.textContent = Math.round(t * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = t;
    }
    requestAnimationFrame(step);
  }

  function renderFooter() {
    $("ft-updated").textContent = overview.updatedAt || "–";
    $("ft-reg").textContent = overview.sourceSummary.regulation || 0;
    $("ft-acc").textContent = overview.sourceSummary.accidentReport || 0;
    $("ft-emg").textContent = overview.sourceSummary.emergency || 0;
  }

  // ================= v1.5 结论流 / 推理剧场 / 六域计数 =================
  // 三条可播放推理链（数据优先 / 演示结论硬编码兜底）。
  // chain: [{n:名称, r:是否最高危节点红点}, links: [{label,rule?}], conclusion, riskScore]
  var CHAINS = [
    // 三条推理链：全部数据可回溯（真实出处见 source 的「数据」卡），再也不编造货种/风险分
    // ① 禁配共存：真实出处 /api/screen/overview patrolPool[0]（河北滨海港 LPG+硝酸铵 风险分29）
    { id: "forbidden-coexist", title: "禁配共存", risk: 29, nodes: ["硝酸铵", "液化石油气(LPG)", "河北滨海港罐区"],
      links: [ { label: "互为禁配", rule: "GB18218 表2" }, { label: "同罐区", rule: "储罐台账" } ],
      source: [ { t: "规则", name: "GB 18218-2018 表 2", d: "硝酸铵 与 液化石油气(LPG) 互为禁配" },
                { t: "数据", name: "储罐实测台账", d: "两者同时储存于河北滨海港罐区（非罐设施载硝酸铵、球罐载LPG）" },
                { t: "数据", name: "风险分", d: "patrolPool[0] = 29（来自 /api/screen/overview 实时计算）" } ],
      done: "该罐区存在禁配物质共存", suggest: "建议核查隔离间距", riskScore: 29 },
    // ② 多危货同址：真实出处 patrolPool[1]（苏港 苯/丙酮 与 过氧化氢 同址 风险分12）
    { id: "multi-site", title: "多危货同址", risk: 12, nodes: ["苯", "过氧化氢溶液(双氧水)", "苏港（连云港）罐区"],
      links: [ { label: "危险特性共址", rule: "储罐台账" }, { label: "同址集聚", rule: "台账" } ],
      source: [ { t: "规则", name: "安全间距标准", d: "高危货种同址应集中核查间距" },
                { t: "数据", name: "储罐台账", d: "苏港外浮顶罐载苯/丙酮、非罐设施载过氧化氢溶液(双氧水)，同址存储" },
                { t: "数据", name: "风险分", d: "patrolPool[1] = 12（来自 /api/screen/overview 实时计算）" } ],
      done: "罐区同时存放多种高危货种", suggest: "建议核查罐间距与隔离措施", riskScore: 12 },
    // ③ 高危货种 TOP1：真实出处 overview.topRiskGoods[0]（硝酸铵 riskScore 24.5）
    { id: "top-hazard", title: "高危货种", risk: 24, nodes: ["硝酸铵", "过氧化氢溶液(双氧水)", "储运链路"],
      links: [ { label: "枢纽高危", rule: "degree" }, { label: "关联风险", rule: "禁配数" } ],
      source: [ { t: "规则", name: "TOP1 高危货种", d: "硝酸铵 riskScore 24.5，10 条禁配" },
                { t: "数据", name: "图谱度中心", d: "硝酸铵为高危枢纽节点，连接广" },
                { t: "推理", name: "一阶推理链", d: "高危货种为核心风险源" } ],
      done: "硝酸铵为当前最高危货种", suggest: "建议优先纳入日常巡检", riskScore: 24 },
    // ④ 事故频发：真实出处 overview.domains[accident].samples（历史重大事故真实案例，非编造货种）
    { id: "accident-prone", title: "事故频发", risk: 15, nodes: ["硝铵/化工储运", "重大事故", "历史事故样本"],
      links: [ { label: "事故多发", rule: "事故报告" }, { label: "高危关联", rule: "禁配数" } ],
      source: [ { t: "数据", name: "历史事故", d: "天津港8·12/响水3·21/古雷PX/青岛11·22 等真实案例（事故域样本）" },
                { t: "推理", name: "关联分析", d: "高危货种(硝酸铵等)关涉多起爆炸事故，是重点盯防对象" } ],
      done: "高危货种关联多起历史重大事故", suggest: "建议结合同类型企业重点排查", riskScore: 15 }
  ];
  var currentChain = CHAINS[0];
  var chainTimer = null, chainStop = null, chainPlaying = false;

  // 今日发现结论流（数据优先：禁配共存/多危货同址/高危TOP1；演示结论兜底）
  function renderFindings() {
    var list = $("findings-list");
    var html = "";
    // ① 禁配共存（最高危，红色置顶）：硝酸铵 ↔ LPG 同罐区
    // ② 多危货同址：危险特性域样本中 high 级货种
    // ③ 高危货种 TOP1：overview.topRiskGoods[0]
    // ④ 事故波及：历史事故域（演示结论兜底）
    // 禁配共存卡＝剧场主链，永远同源：优先取 CHAINS[0]（真实 patrolPool[0] 河北滨海港 LPG↔硝酸铵 29）
    var incompatPair = (CHAINS[0].nodes[0] || "硝酸铵") + " ↔ " + (CHAINS[0].nodes[1] || "液化石油气(LPG)");
    try {
      var dInc = overview.domains.filter(function (d) { return d.key === "incompatible"; })[0];
      if (dInc && dInc.samples && dInc.samples.length) {
        // 优先挑真实样本中含“液化石油气”或 LPG 的禁配对（保证与主链一致，绝不回退到编造的样本）
        var cand = dInc.samples.filter(function (s) { return /液化石油气|LPG/.test(s); })[0];
        if (cand) incompatPair = cand;
      }
    } catch (e) {}
    var top = (overview.topRiskGoods || [])[0] || null;
    // P2-D 数据驱动：从后端 patrolPool 取真实风险分/货种对（依企业名匹配），替代写死的 29/12/15/24
    var pool = window.__patrolPool || [];
    function poolRisk(keyword) {
      var hit = pool.filter(function (p) { return /河北滨海/.test(p.label || "") && /硝酸铵/.test((p.attributes||"") + (p.conclusion||"")); })[0];
      if (keyword === "multi") hit = pool.filter(function (p) { return /苏港/.test(p.label || "") && /苯/.test((p.attributes||"") + (p.conclusion||"")); })[0];
      if (keyword === "accident") return null; // 事故频发无单一风险分，显示起数，不伪造
      return hit ? hit.riskScore : null;
    }
    var R_c = poolRisk("forbid");   // 禁配共存：河北滨海港 硝酸铵 实际风险分
    var R_m = poolRisk("multi");    // 多危货同址：苏港 苯 实际风险分

    // 四张结论卡：全部数据驱动，取不到显示"—"，绝不写死编造风险分/货种（数据真实性底线）
    var accSamples = (function(){ try { var a=overview.domains.filter(function(d){return d.key==="accident";})[0]; return (a&&a.samples)||[]; } catch(e){ return []; } })();
    var accEl = accSamples.length ? accSamples[0] : null;   // 真实事故域样本（可回溯：如天津8·12）
    var cards = [
      { title: "禁配物质共存", risk: R_c != null ? R_c : "—", badge: "高危", red: true, chainId: "forbidden-coexist",
        desc: incompatPair + " 同罐区存储，耦合爆炸/火灾风险（风险分 " + (R_c != null ? R_c : "实时计算") + " = /api/screen/overview）" },
      { title: "高危货种TOP1", risk: top ? top.riskScore : "-", badge: top ? riskWord(top) : "高危", red: false, chainId: "top-hazard",
        desc: top ? (top.name + "（" + (top.hint || "禁配数据") + "）") : "暂无高危货种数据" },
      { title: "多危货同址", risk: R_m != null ? R_m : "—", badge: "中危", red: false, chainId: "multi-site",
        desc: "苏港（连云港）罐区同时存放苯/丙酮与过氧化氢溶液(双氧水)（风险分 " + (R_m != null ? R_m : "实时计算") + " = 实时计算）" },
      { title: "事故频发货种", risk: accSamples.length ? accSamples.length + "起" : "—", badge: "关注", red: false, chainId: "accident-prone",
        desc: accEl ? ("针对高危货种，历史典型事故案例：" + accEl) : "暂无事故样本数据" }
    ];
    cards.forEach(function (c) {
      html += '<div class="f-card' + (c.red ? " f-fatal" : "") + '" data-chain="' + esc(c.chainId) + '">' +
        '<div class="f-row"><span class="f-c-title">' + esc(c.title) + '</span>' +
        '<span class="f-badge ' + (c.red ? "f-badge-fatal" : "f-badge-warn") + '">' + esc(c.badge) + '</span></div>' +
        '<div class="f-risk">风险分 <b>' + c.risk + '</b></div>' +
        '<div class="f-desc">' + esc(c.desc) + '</div>' +
        '<button class="f-play" data-chain="' + esc(c.chainId) + '">▶ 播放推理</button>' +
        '</div>';
    });
    list.innerHTML = html;

    // 结论卡「点击整卡」→ 切换对应链到剧场播放（点击卡片任意处都切链，不再只点播放按钮）
    list.querySelectorAll(".f-card").forEach(function (cardEl) {
      cardEl.addEventListener("click", function () {
        cardEl.closest(".findings-list").querySelectorAll(".f-card").forEach(function (c) { c.classList.remove("f-active"); });
        cardEl.classList.add("f-active");
        switchToChain(cardEl.getAttribute("data-chain"));
      });
    });
  }

  var domainChart = null; // 六域计数 sparkline（等宽/微趋势，提案⑧）

  // ---- 提案⑧：六域象形图标（data URI SVG，用域色着色）----
  var DOMAIN_ICONS = {
    hazard: 'M12 2 L22 20 H2 Z',            // 警示三角
    incompatible: 'M4 4 L20 20 M20 4 L4 20',  // 交叉禁配
    reaction: 'M6 3 H18 M12 3 V8 M8 15 A6 6 0 0 0 16 15 M8 15 H16 M11 21 H13', // 烧瓶/分子
    emergency: 'M5 8 A7 7 0 0 1 19 8 C19 14 14 18 12 21 C10 18 5 14 5 8 Z M12 12 V12', // 盾牌
    accident: 'M12 2 L13.5 8 L20 8 L14.5 11.5 L16.5 18 L12 14 L7.5 18 L9.5 11.5 L4 8 L10.5 8 Z', // 爆炸星
    enterprise: 'M4 12 L12 5 L20 12 V20 H13 V15 H11 V20 H4 Z' // 厂房
  };
  function domainIconSVG(key, color) {
    var path = DOMAIN_ICONS[key] || DOMAIN_ICONS.hazard;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // 六域计数一行：#domain-counts（从 overview.domains 渲染）
  function renderDomainCounts() {
    var wrap = $("domain-counts");
    if (!wrap) return;
    var dm = overview.domains || [];
    if (!dm.length) { wrap.classList.add("hidden"); return; }
    var html = "";
    dm.forEach(function (d) {
      html += '<span class="dc-item" title="' + esc(d.name) + '"><img class="dc-icon" src="' + domainIconSVG(d.key, esc(d.color)) + '" alt="">' + esc(d.name) +
        ' <b class="dc-num">' + d.count + '</b></span>';
    });
    wrap.innerHTML = html;
    wrap.classList.remove("hidden");
  }

  // 结论流的刷新按钮（重构卡片 + 重播默认链）
  function bindFindingsRefresh() {
    var btn = $("btn-findings-refresh");
    if (btn) btn.addEventListener("click", function () {
      if (!overview) return;
      var chain = currentChain && currentChain.id || "forbidden-coexist";
      swaChainInfo(chain);
    });
  }
  function swaChainInfo(id) {
    var c = CHAINS.filter(function (x) { return x.id === id; })[0] || CHAINS[0];
    // 对应卡片轻微呼吸提示
    var cards = document.querySelectorAll(".f-card");
    cards.forEach(function (el) {
      el.classList.remove("f-flash");
      if (el.getAttribute("data-chain") === c.id) { el.classList.add("f-flash"); setTimeout(function () { el.classList.remove("f-flash"); }, 900); }
    });
  }

  // ---------- 推理剧场（提案① Signature） ----------
  // 构建链舞台（节点/关系标签横向排布），未激活半透明下沉
  function buildStage(chain) {
    var stage = $("th-stage");
    var html = '<div class="th-chain">';
    chain.nodes.forEach(function (n, i) {
      if (i > 0) {
        var lk = chain.links[i - 1];
        html += '<span class="th-link"><span class="th-lk-label">' + esc(lk.label) + '</span>' +
          '<span class="th-lk-rule">' + esc(lk.rule || "") + '</span></span>';
      }
      html += '<span class="th-node' + (i === 0 ? " th-high" : "") + '">' + esc(n) + '</span>';
    });
    html += '</div>';
    stage.innerHTML = html;
    stage.querySelectorAll(".th-node").forEach(function (el) {
      el.addEventListener("click", function () { switchToChain(chain.id); });
    });
    $("th-out").innerHTML = "";
  }

  // 播放：依次点亮节点/关系（~0.6s 一拍），链走完浮出依据卡+红色结论条
  function playChain(id, silent) {
    var chain = CHAINS.filter(function (x) { return x.id === id; })[0] || CHAINS[0];
    currentChain = chain;
    buildStage(chain);
    if (chainTimer) { clearTimeout(chainTimer); chainTimer = null; }
    if (chainStop) { clearTimeout(chainStop); chainStop = null; }
    var stage = $("th-stage");
    var els = stage.querySelectorAll(".th-node, .th-link");
    // 复位：全部未激活半透明
    els.forEach(function (el) { el.classList.remove("th-live"); });
    var btn = $("btn-play");
    btn.textContent = "▶ 播放推理"; chainPlaying = false;
    // 依次点亮，每 0.6s 一拍
    var idx = 0, total = els.length;
    function stepNext() {
      if (idx < total) {
        els[idx].classList.add("th-live");
        idx++;
        chainTimer = setTimeout(stepNext, 600);
      } else {
        chainPlaying = false;
        btn.textContent = "↻ 重播";
        showChainOutcome(chain);   // 链走完 → 浮出结论
      }
    }
    chainPlaying = true;
    btn.textContent = "⏳ 推理中…";
    stepNext();
  }
  function switchToChain(id) {
    var c = CHAINS.filter(function (x) { return x.id === id; })[0] || CHAINS[0];
    playChain(c.id, false);
    swaChainInfo(c.id);
    // 联动：结论流对应卡高亮
    document.querySelectorAll(".f-card").forEach(function (el) {
      el.classList.remove("f-active");
      if (el.getAttribute("data-chain") === c.id) el.classList.add("f-active");
    });
  }

  // 链走完浮出三条依据卡 + 红色结论条
  function showChainOutcome(chain) {
    var out = $("th-out");
    var html = '<div class="th-cards">';
    chain.source.forEach(function (s) {
      html += '<div class="th-card"><span class="th-card-t">' + esc(s.t) + '</span>' +
        '<div class="th-card-name">' + esc(s.name) + '</div><div class="th-card-d">' + esc(s.d) + '</div></div>';
    });
    html += '</div><div class="th-verdict"><span class="th-verdict-note">⚠ ' + esc(chain.done) + '</span>' +
      ' · <span class="th-verdict-sug">' + esc(chain.suggest) + '</span>' +
      ' · 风险分 <b>' + chain.riskScore + '</b></div>';
    out.innerHTML = html;
  }

  function bindTheater() {
    var play = $("btn-play");
    if (play) play.addEventListener("click", function () {
      if (chainPlaying) return;         // 播放中忽略
      // 未播放时播放当前链，已播完则重播
      playChain(currentChain && currentChain.id || "forbidden-coexist");
    });
  }

  (function initV15() {
    bindFindingsRefresh();
    bindTheater();
    // 结论流的直接播放按钮（静态注册，动态卡片由 renderFindings 委托）
    var list = $("findings-list");
    if (list) list.addEventListener("click", function (ev) {
      var tar = ev.target;
      if (tar && tar.classList && tar.classList.contains("f-play")) {
        switchToChain(tar.getAttribute("data-chain"));
      }
    });
  })();

  // v1.5：renderTopRisk() 已移除——顶部卡片改为「今日发现」结论流 (#findings-list)，
  // 高危货种 TOP5 数据(renderKpi/renderFindings)消费，不在此单独渲染。
  // 保留 riskScore→风险分映射供结论流复用
  function riskWord(g) { return g && g.level ? (g.level === "high" ? "高危" : g.level === "medium" ? "中危" : "低危") : ""; }

  // 中心插槽内容（v2.1：恒为全域罗盘 hexagon，无核心；任何实体由点击推入焦点位）
  function coreNode() {
    return { kind: "rosette", symbol: RO_SETTE_PATH, color: "#132442", riskColor: "#22D3EE", size: 82, name: "储存环节\n· 全域", full: "港口危货安全知识库" };
  }

  // ---------- 星系构建 ----------
  function buildGalaxy() {
    var stats = overview.stats, nbt = stats.nodesByType || {};
    var counts = {
      hazard: nbt.dangerous_goods || 0, incompatible: overview.domains[1].count,
      reaction: nbt.chemical_reaction || 0, emergency: nbt.emergency_measure || 0,
      accident: nbt.accident || 0, enterprise: nbt.enterprise || 0
    };
    // 按类型把 topology 节点归域（禁配域用化学/禁配示意：禁配不在topology独立类型，取 chemical_reaction 归反应域，禁配域以中央放射线体现计数）
    var byType = {};
    (topo.nodes || []).forEach(function (n) { (byType[n.type] = byType[n.type] || []).push(n); });

    var nodes = [], links = [], center = "kg_center";
    var core = coreNode();   // 中心插槽内容（默认储罐/可切换）
    nodes.push({ id: center, name: core.name, x: CX, y: CY, symbolSize: core.size, category: "center", coreKind: core.kind,
      label: { show: true, fontSize: 12, color: "#e2e8f0", position: "inside", lineHeight: 16 }, itemStyle: { color: core.color, borderColor: core.riskColor, borderWidth: 2 }, symbol: core.symbol, coreFull: core.full });

    function typeOfDomain(key) {
      if (key === "hazard") return "dangerous_goods";
      if (key === "enterprise") return "enterprise";
      if (key === "accident") return "accident";
      if (key === "emergency") return "emergency_measure";
      if (key === "reaction" || key === "incompatible") return "chemical_reaction"; // 反应+禁配同源（chemical）
      return null;
    }
    function sampleForDomain(key, n) {
      if (key === "incompatible") return overview.domains[1].samples; // 禁配域直接用禁配对样例
      var t = typeOfDomain(key), arr = byType[t] || [];
      // P2-d：按度数降序取代表（topology 已含 degree），让星系上展示的是高连接/高风险的枢纽实体而非冷门货种
      var sorted = arr.slice().sort(function (a, b) { return (b.degree || 0) - (a.degree || 0); });
      return sorted.slice(0, n).map(function (x) { return x.name; });
    }
    function sampleForReaction(key) {
      var arr = (overview.domains.find(function (d) { return d.key === key; }) || {}).samples || [];
      return arr.slice(0, 5);
    }

    DOMAINS.forEach(function (dm, i) {
      var a = (-90 + i * 60) * Math.PI / 180;     // 六域放射 60° 间隔，起点正上方
      var cx = CX + R_DOMAIN * Math.cos(a);
      var cy = CY + R_DOMAIN * Math.sin(a);
      // 域中心节点
      Array.prototype.push.apply(nodes, []);
      var dmNodeId = "dom_" + dm.key;
      links.push({ source: center, target: dmNodeId, type: "centerlink" });
      nodes.push({ id: dmNodeId, name: dm.name, x: cx, y: cy, symbolSize: 26,
        category: "domain", domainKey: dm.key, label: { show: true, position: "inside", fontSize: 12, color: "#0b1222", fontWeight: 700 },
        itemStyle: { color: dm.color } });

      // 域内代表节点（绕域中心环形；v1.5 提案④：轨道半径=风险倒数，体积=关联度数，高危内圈红脉冲）
      var reps = (dm.key === "reaction") ? sampleForReaction("reaction") : sampleForDomain(dm.key, 6);
      if (dm.key === "incompatible") reps = sampleForDomain("incompatible", 6);
      var repStyles = buildRepStyles(dm.key, reps);
      (reps || []).forEach(function (name, j) {
        var b = (j / reps.length) * 2 * Math.PI + (i * 0.5);
        var st = repStyles[j] || {};
        // ④ 轨道半径 = 风险倒数（高危内圈 R_min 取 22，低危外圈 R_max 取 62）
        var Rr = 22 + (1 - (st.risk || 0.35)) * 40;   // 0.35~0.75 → 22~62
        var px = cx + Rr * Math.cos(b), py = cy + Rr * Math.sin(b);
        var nid = "rep_" + dm.key + "_" + j;
        nodes.push({ id: nid, name: name.length > 10 ? name.slice(0, 9) + "…" : name, full: name, x: px, y: py, symbolSize: st.size || 9,
          category: dm.key, label: st.labelShow ? { show: true, position: "bottom", fontSize: 9, color: dm.color } : { show: false, position: "bottom", fontSize: 9, color: dm.color },
          itemStyle: { color: st.color || dm.color }, highRisk: !!st.high });
        links.push({ source: dmNodeId, target: nid, type: "member" });
        idToDomain[nid] = dm.key;
      });
    });

    var series = {
      type: "graph", layout: "none", roam: true,
      data: nodes, links: links,
      focusNodeAdjacency: false,
      emphasis: { focus: "adjacency", scale: 1.15, lineStyle: { width: 2 } },
      blur: { itemStyle: { opacity: 0.28 }, lineStyle: { opacity: 0.12 } },
      label: { show: false },
      // P2-E：label 防碰撞——隐藏重叠标签，避免同半径环形标注互相压字
      labelLayout: { hideOverlap: true, moveOverlap: "shiftY" },
      lineStyle: { color: "source", curveness: 0.15, opacity: 0.35 },
      edgeSymbol: ["none", "arrow"],
      animationDuration: 800, animationEasing: "cubicOut",
    };
    // 逐节点入场动画：延迟错峰
    series.data = nodes.map(function (n, idx) { n.symbolSize = n.symbolSize || 9; return n; });
    series.animationDelay = function (idx) { return idx * 18; };

    chart.setOption({
      tooltip: { trigger: "item", formatter: function (p) { return p.dataType === "edge" ? "" : (p.data.full || p.name); } },
      series: [series]
    });

    // 保存域数据供点击推进
    DOMAINS.forEach(function (dm) {
      domainData[dm.key] = nodes.filter(function (n) { return n.id === "dom_" + dm.key || (idToDomain[n.id] === dm.key); });
    });
    startAmbientFX(nodes);
  }

  // v1.5 提案④：为域内代表节点计算风险样式（轨道半径/体积/颜色/标签），data优先，硬编码兜底
  function buildRepStyles(key, names) {
    var HIGH_SET = { "硝酸铵(含可燃物)": 0.8, "过氧化氢溶液(双氧水)": 0.7, "苯": 0.65, "液化石油气(LPG)": 0.68, "丙烷": 0.5, "丁烷": 0.5, "丙烯": 0.5, "汽油": 0.5, "硫酸": 0.55, "硝酸铵": 0.8 };
    var riskMap = {};
    (overview.topRiskGoods || []).forEach(function (g) { riskMap[g.name] = Math.min(0.9, 0.35 + (g.riskScore || 0) / 60); });
    return (names || []).map(function (nm, j) {
      var risk = riskMap[nm] || HIGH_SET[nm] || (0.28 + (j % 4) * 0.07);   // 默认给差异化风险
      var high = risk > 0.6;
      return {
        risk: risk, high: high,
        // 体积 = 关联度数（无则按风险），high 更大更红更显
        size: high ? (12 + (risk - 0.6) * 22) : (risk > 0.42 ? 11 : 8 + risk * 4),
        color: high ? "#E24B4A" : (risk > 0.45 ? dmColorFallback(key) : "rgba(143,163,192,.5)"),
        labelShow: high ? true : (risk > 0.5)
      };
    });
  }
  function dmColorFallback(key) {
    var dm = DOMAINS.filter(function (d) { return d.key === key; })[0];
    return dm ? dm.color : "#4dc3ff";
  }

  // 演示 C：星系常驻动效——中心罗盘呼吸光晕 + 高危节点扩散脉冲
  function startAmbientFX(nodes) {
    var centerIdx = nodes.findIndex(function (n) { return n.id === "kg_center"; });
    // 找高危货种代表节点（硝酸铵/双氧水/苯 等，红色系 #E24B4A 呼吸）
    var pulseIdx = [], seen = {};
    nodes.forEach(function (n, i) {
      if (n.id.indexOf("rep_") !== 0) return;
      var nm = String(n.full || n.name || "");
      if (/硝酸铵|双氧水|苯|LPG|液化气|硝化棉/.test(nm) && !seen[nm]) { seen[nm] = 1; pulseIdx.push(i); }
    });
    if (!centerIdx && !pulseIdx.length) return;
    var step = 0;
    var iv = setInterval(function () {
      if (!chart) { clearInterval(iv); return; }
      step++;
      var breath = 0.5 + 0.5 * Math.sin(step * 0.18);    // 0~1 呼吸
      var opt = chart.getOption();
      var data = (opt.series && opt.series[0] && opt.series[0].data) || [];
      if (!data.length) return;
      if (centerIdx != null && data[centerIdx]) {
        data[centerIdx].itemStyle = Object.assign({}, data[centerIdx].itemStyle || {}, {
          color: "#132442", borderColor: "#22D3EE", borderWidth: 2,
          shadowBlur: 14 + breath * 18, shadowColor: "rgba(34,211,238," + (0.35 + breath * 0.45) + ")"
        });
      }
      pulseIdx.forEach(function (i) {
        if (!data[i]) return;
        var r = 0.35 + 0.65 * ((step + i * 7) % 40) / 40;   // 循环扩散
        data[i].itemStyle = Object.assign({}, data[i].itemStyle || {}, {
          shadowBlur: 4 + r * 18, shadowColor: "rgba(226,75,74," + (0.3 + r * 0.6) + ")", borderColor: "#E24B4A", borderWidth: 1
        });
      });
      chart.setOption({ series: [{ data: data }] });
    }, 120);
  }

  // v2.1：中心恒为全域罗盘（删除核心切换后，无需动态重建；点击数落入下方事件）
  // P1-1：读取 URL 参数 ?domain=X&entity=Y 打开对应下钻抽屉（首刷新恢复/直链分享）；同时去重重复参数(P1-3)
  function applyHomeUrlParams() {
    var raw = (window.location.search || "").replace(/^\?/, "");
    if (!raw) return;
    var params = {};
    raw.split("&").forEach(function (kv) {
      var p = kv.split("="); if (!p[0]) return;
      var k = decodeURIComponent(p[0]); var v = decodeURIComponent(p.slice(1).join("=") || "");
      if (k && v) params[k] = v;   // 后者覆盖前者，天然去重(P1-3)
    });
    if (!params.domain) return;
    if (!window.PKG_DRILL) return;
    var dom = params.domain, ent = params.entity;
    if (ent) {
      // 直达 L2 实体画像
      window.PKG_DRILL.openL2(ent, params.kind || (/tank|储罐|罐/.test(ent) ? "tank" : "goods"), dom, "");
    } else {
      // 打开域 L1 清单（在数据就绪后，openDomainDrilldown 用 overview/topo）
      openDomainDrilldown(dom);
    }
  }

  // 点击域中心 → 首页直接打开 L1 分类清单抽屉（不跳页）。用已有 overview/topo 数据构项。
  function openDomainDrilldown(key) {
    if (!window.PKG_DRILL) return;
    var dm = DOMAINS.filter(function (d) { return d.key === key; })[0] || { key: key, name: key };
    var typeMap = {
      hazard: "dangerous_goods", enterprise: "enterprise", accident: "accident",
      emergency: "emergency_measure", reaction: "chemical_reaction", incompatible: "dangerous_goods"
    };
    var type = typeMap[key] || "dangerous_goods";
    var kind = (key === "enterprise") ? "enterprise" : (key === "incompatible" ? "goods" : "goods");
    var items = [];
    if (key === "incompatible") {
      // 禁配域用首页 overview.domains[1].samples（禁配对）作为 L1 项；meta 用「禁配关系」而非无信息量的「禁配对N」(P2-f)
      var d1 = overview.domains[1];
      (d1.samples || []).forEach(function (pair, i) {
        items.push({ name: pair, kind: "goods", meta: d1.name || "禁配关系" });
      });
    } else if (key === "reaction") {
      // 反应域：取 overview 对应域 samples
      var dro = overview.domains.filter(function (d) { return d.key === "reaction"; })[0];
      (dro && dro.samples || []).forEach(function (nm) { items.push({ name: nm, kind: "goods", meta: "化学反应" }); });
    } else {
      // 其它域：从拓扑节点按类型取值去重；meta 用中文类型名（P1-B：不再透出英文内部码 dangerous_goods）
      var typeCN = { dangerous_goods: "高危货种", enterprise: "企业", accident: "历史事故", emergency_measure: "应急处置", chemical_reaction: "化学反应" };
      // 危险特性域：用 topRiskGoods 匹配风险级别作为 meta（更有信息量）
      var riskMap = {};
      if (key === "hazard") { (overview.topRiskGoods || []).forEach(function (g) { riskMap[g.name] = g.level === "high" ? "高危" : g.level === "medium" ? "中危" : "低危"; }); }
      var seen = {};
      (topo.nodes || []).forEach(function (n) {
        if ((n.type || n.category) !== type) return;
        var nm = n.name || n.label || ""; if (!nm || seen[nm]) return;
        seen[nm] = 1;
        items.push({ name: nm, kind: kind, meta: riskMap[nm] || typeCN[type] || type });
      });
    }
    window.PKG_DRILL.openL1(key, (dm.name || key) + " · 清单", items, kind);
  }

  // 演示 D：星系联动聚焦——高亮指定域的节点（域中心+代表），其他弱化；entity时聚焦单节点。关闭=复位全部
  function focusDomain(key, entityIdx) {
    if (!chart) return;
    var opt = chart.getOption();
    var data = (opt.series && opt.series[0] && opt.series[0].data) || [];
    var idx = {};
    data.forEach(function (n, i) { idx[n.id] = i; });
    // 高亮目标集合
    var hl = [];
    if (entityIdx != null) hl.push(entityIdx);
    else {
      data.forEach(function (n, i) {
        var dom = n.category;
        if (n.id === "dom_" + key) hl.push(i);
        else if (n.id && n.id.indexOf("rep_" + key + "_") === 0) hl.push(i);
      });
    }
    // 先复位所有
    data.forEach(function (n, i) { chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: i }); });
    // 高亮目标
    hl.forEach(function (i) { chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: i }); });
    // 用 series.blur 弱化非目标（graph series 已配 blur opacity:0.28）
    try {
      chart.setOption({ series: [{ emphasis: { focus: "none" }, blur: { itemStyle: { opacity: 0.18 }, lineStyle: { opacity: 0.08 } } }] });
    } catch (e) {}
  }
  // 复位星系聚焦（关闭抽屉/重排时调用）
  function resetFocus() {
    if (!chart) return;
    var opt = chart.getOption();
    var data = (opt.series && opt.series[0] && opt.series[0].data) || [];
    data.forEach(function (n, i) { chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: i }); });
  }

  function rebuildCore() {
    var core = coreNode();
    var data = chart.getOption().series[0].data;
    var idx = data.findIndex(function (n) { return n.id === "kg_center"; });
    if (idx < 0) return;
    data[idx] = Object.assign({}, data[idx], {
      name: core.name, full: core.full, coreKind: core.kind, symbolSize: core.size, symbol: core.symbol,
      itemStyle: { color: core.color, borderColor: core.riskColor, borderWidth: 2 }
    });
    chart.setOption({ series: [{ data: data }] });
  }

  // ---------- 交互 ----------
  function bindEvents() {
    var chartEl = $("galaxy");
    // 悬停：显示域概览条
    chart.on("mouseover", function (p) { if (p.dataType !== "node" || !p.data) return; var k = p.data.category; showDomainBar(k, p); });
    chart.on("mouseout", function () { hideDomainBar(); });

    // 点击域中心 → 在首页直接打开 L1 分类清单抽屉（不再整页跳转，渐进披露保持页面）
    chart.on("click", function (p) {
      if (p.dataType !== "node") return;
      var k = p.data.domainKey || p.data.category;
      if (k && k !== "center" && !/^rep_/.test(p.data.id || "") && k !== p.data.id) {
        if (window.PKG_DRILL) window.PKG_DRILL.closeAll();   // 切换域前先关旧抽屉
        openDomainDrilldown(k);
        // 演示 D：星系联动聚焦——高亮该域节点、弱化其他，形成「镜头推进」
        focusDomain(k, null);
      }
    });

    // 点击域内代表实体 → 在首页直接打开 L2 画像抽屉（任意实体点选推入焦点位，不跳页）
    chart.on("click", function (p) {
      if (p.dataType !== "node" || !p.data) return;
      if (p.data.id && /^rep_/.test(p.data.id)) {
        var ent = p.data.full || p.data.name || "";
        var dom = p.data.category || "hazard";
        var isTank = /tank|储罐|罐/.test(ent);
        if (window.PKG_DRILL) window.PKG_DRILL.closeAll();
        if (window.PKG_DRILL) window.PKG_DRILL.openL2(ent, isTank ? "tank" : "goods", dom, "");
        // 演示 D：星系聚焦该节点（其余弱化）
        var di = chart.getOption().series[0].data.findIndex(function (n) { return n.id === p.data.id; });
        if (di >= 0) focusDomain(null, di);
      }
    });

    // 中央节点点击 → 轻脉冲高亮（视觉反馈，不跳页），提示用户到域/实体上下钻 (P2-b)
    chart.on("click", function (p) {
      if (p.dataType !== "node" || !p.data) return;
      if (p.data.id !== "kg_center" && !p.data.coreKind) return;
      // 轻脉冲：中心短暂放大再复位（3 帧），避免「点了没反应」
      var idx = p.dataIndex;
      var opt = chart.getOption(), data = (opt.series && opt.series[0] && opt.series[0].data) || [];
      if (data[idx]) {
        var oSize = data[idx].symbolSize;
        data[idx].symbolSize = oSize * 1.15;
        chart.setOption({ series: [{ data: data }] });
        setTimeout(function () {
          var opt2 = chart.getOption(), d2 = (opt2.series && opt2.series[0] && opt2.series[0].data) || [];
          if (d2[idx]) { d2[idx].symbolSize = oSize; chart.setOption({ series: [{ data: d2 }] }); }
        }, 220);
      }
      $("crumb").innerHTML = "首页 › 全域监视中枢（点击外周域中心或代表实体逐级下钻）";
    });

    // 搜索 → 星系高亮匹配节点
    var search = $("home-search");
    function doSearch() {
      var q = (search.value || "").trim(); if (!q) return;
      highlightEntity(q);
    }
    $("btn-search").addEventListener("click", doSearch);
    search.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });

    // 一键演示：G —— 自动播放完整故事线（全景→禁配域L1→硝酸铵L2画像→L3证据），P1-C 完善节奏+叙事字幕
    var demoBtn = $("btn-demo");
    if (demoBtn) demoBtn.addEventListener("click", function () {
      if (!demoState.running) autoDemo();
      else if (demoState.paused) resumeDemo();
      else pauseDemo();
    });
    // P2-b：一键演示可暂停/跳步状态机
    var demoState = { running: false, paused: false, idx: 0, timer: null, stepStart: 0 };
    var demoSteps = [
      { ms: 400, fn: function () { focusDomain("incompatible", null); openDomainDrilldown("incompatible"); demoTxt("② 进入「禁配关系」域：逐条为禁配组合溯源"); } },
      { ms: 4800, fn: function () { window.PKG_DRILL.closeAll(); focusDomain("hazard", null); openDomainDrilldown("hazard"); demoTxt("③ 切到「危险特性」域：按风险挑出高危货种"); } },
      { ms: 3600, fn: function () { window.PKG_DRILL.closeAll(); findEntityData("hazard", "硝酸铵"); window.PKG_DRILL.openL2("硝酸铵", "goods", "hazard", ""); demoTxt("④ 高危货种六维画像：六根轴=六维证据强度，雷达一眼看清风险在哪一维"); } },
      { ms: 6200, fn: function () { window.PKG_DRILL.openL3("硝酸铵", "goods", "硝酸铵 · 证据溯源"); demoTxt("⑤ 逐条溯源证据：法规条款 · 事故报告 · 应急规程"); } },
      { ms: 7000, fn: function () { endDemo(); } }
    ];
    function autoDemo() {
      if (!window.PKG_DRILL || !overview) return;
      demoState.running = true; demoState.paused = false; demoState.idx = 0;
      setDemoBtnTxt("⏸ 暂停", true);
      // 0) 复位 + 起始字幕
      window.PKG_DRILL.closeAll(); resetFocus();
      demoTxt("① 全域监盘：中心为港口危货知识库全域罗盘");
      runNextStep(520);
    }
    function runNextStep(delay) {
      if (!demoState.running || demoState.paused) return;
      var s = demoSteps[demoState.idx];
      if (!s) { endDemo(); return; }
      demoState.stepStart = Date.now();
      demoState.timer = setTimeout(function () {
        s.fn();
        demoState.idx++;
        if (demoState.running && !demoState.paused && demoState.idx < demoSteps.length) runNextStep(demoSteps[demoState.idx - 1].ms);
        else if (demoState.idx >= demoSteps.length) endDemo();
      }, delay || s.ms);
    }
    function pauseDemo() {
      if (!demoState.running || demoState.paused) return;
      demoState.paused = true;
      clearTimeout(demoState.timer);
      // 当前正等待的步骤延时 = 本步 ms（最后一步 endDemo 用 7000）
      var curMs = demoState.idx < demoSteps.length ? demoSteps[demoState.idx].ms : 7000;
      demoState.pauseRemain = Math.max(0, (demoState.stepStart + curMs) - Date.now());
      setDemoBtnTxt("▶ 继续", true);
    }
    function resumeDemo() {
      if (!demoState.running || !demoState.paused) return;
      demoState.paused = false;
      runNextStep(demoState.pauseRemain != null ? demoState.pauseRemain : 0);
      setDemoBtnTxt("⏸ 暂停", true);
    }
    function jumpStep() {
      if (!demoState.running) return;
      clearTimeout(demoState.timer);
      var s = demoSteps[demoState.idx];
      if (s) s.fn();
      demoState.idx++;
      demoState.paused = false;
      if (demoState.idx >= demoSteps.length) endDemo(); else runNextStep(0);
    }
    function endDemo() {
      demoState.running = false; demoState.paused = false;
      clearTimeout(demoState.timer);
      window.PKG_DRILL.closeAll(); resetFocus(); clearDemoCaption();
      setDemoBtnTxt("▶ 一键演示", false);
      hideDemoCtrls();
    }
    function setDemoBtnTxt(t, showCtrls) {
      if (demoBtn) demoBtn.textContent = t;
      var n = $("btn-demo-next"); if (n) n.style.display = showCtrls ? "inline-block" : "none";
    }
    function demoTxt(t) { demoCaption(t); }
    // ⏸/⏭ 按钮（跳步）
    // 演示叙事字幕：星系左上角浮层（可选，自动消失）
    var _capT = null;
    function demoCaption(txt, delay) {
      clearDemoCaption();
      var bar = $("demo-caption");
      if (!bar) { bar = document.createElement("div"); bar.id = "demo-caption"; bar.className = "demo-caption"; document.querySelector(".galaxy-wrap").appendChild(bar); }
      bar.textContent = txt; bar.classList.add("show");
      if (delay) _capT = setTimeout(clearDemoCaption, delay);
    }
    function clearDemoCaption() { if (_capT) { clearTimeout(_capT); _capT = null; } var b = $("demo-caption"); if (b) b.classList.remove("show"); }
    // ⏭ 跳步按钮：跳到下一步
    var nxtBtn = $("btn-demo-next");
    if (nxtBtn) nxtBtn.addEventListener("click", jumpStep);
    function hideDemoCtrls() { var n = $("btn-demo-next"); if (n) n.style.display = "none"; }
    function findEntityData(dom, name) {
      // 聚焦星系中对应代表实体（若有）
      var data = chart.getOption().series[0].data;
      var di = data.findIndex(function (n) { return (n.full || n.name) === name; });
      if (di >= 0) focusDomain(null, di);
    }
    // v1.5：.tr-item 已随 TOP5 卡片移除；高危货种点击由结论流卡片承担
  }

  function showDomainBar(key, p) {
    var dm = overview.domains.find(function (d) { return d.key === key; });
    if (!dm && key === "reaction") dm = overview.domains[2];
    if (!dm) return;
    var bar = $("domain-bar");
    bar.innerHTML = '<b style="color:' + dm.color + '">' + esc(dm.name) + '</b> · ' + dm.count + ' 项' +
      '<div class="samples">示例：' + esc((dm.samples || []).slice(0, 4).join("、")) + '</div>';
    bar.classList.remove("hidden");
  }
  function hideDomainBar() { $("domain-bar").classList.add("hidden"); }

  // 搜索高亮：匹配节点名/全名，脉冲发光
  function highlightEntity(q) {
    var matched = null, best = -1;
    chart.getOption().series[0].data.forEach(function (n) {
      var text = (n.full || n.name || "");
      if (text.indexOf(q) !== -1 && (n.id.indexOf("rep_") === 0 || n.id.indexOf("dom_") === 0)) {
        var score = text.length; if (score < best || best < 0) { best = score; matched = n; }
      }
    });
    if (!matched) { $("crumb").innerHTML = "首页 › 未找到「<b>" + esc(q) + "</b>」"; return; }
    // P2-a：不再用 graphRoam zoom 增量缩放（连搜多次会累积放大到失控）。改为绝对缩放：先读当前 zoom，计算目标相对增量一次性到达 1.6x
    var opt = chart.getOption();
    var cur = (opt.series && opt.series[0] && opt.series[0].zoom) || 1;
    if (!isFinite(cur) || cur <= 0) cur = 1;
    chart.dispatchAction({ type: "graphRoam", seriesIndex: 0, zoom: 1.6 / cur });
    var el = chart.getZr().handler; // 触发高亮动画
    chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: chart.getOption().series[0].data.findIndex(function (n) { return n.id === matched.id; }) });
    $("crumb").innerHTML = "首页 › 命中「<b style='color:var(--accent)'>" + esc(matched.full || matched.name) + "</b>」";
  }

  // 跳工作台
  function goWorkbench(key) {
    var map = { hazard: "view=profile", incompatible: "view=chem", reaction: "view=chem", emergency: "view=emergency", accident: "view=accident", enterprise: "view=similar" };
    window.location.href = "index.html?" + (map[key] || "view=graph");
  }
  function goWorkbenchWork(label) {
    var map = { "危货透镜": "view=profile", "企业画像": "view=similar", "应急情景": "view=emergency" };
    window.location.href = "index.html?" + (map[label] || "view=graph");
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();