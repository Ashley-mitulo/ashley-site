/* screen.js — 大屏演示页（1920×1080 等比缩放，自动巡检，零交互默认）
 * 复用 api.js: fetchTopology / fetchHomeOverview / analyzeIncompatibleExtended
 * 主数据: /api/screen/overview（一次返回 scale/risk/conclusions/domains）
 * 降级容错: 后端断连不显示 0、不出现空白区 */
(function () {
  "use strict";
  var DESIGN_W = 1920, DESIGN_H = 1080;
  var chart = null, $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---- 六域定义（配色与 home 一致）----
  var DOMAINS = [
    { key: "hazard",     name: "危险特性", color: "#FF9F43" },
    { key: "incompatible", name: "禁配关系", color: "#D85A30" },
    { key: "reaction",   name: "化学反应", color: "#B28CFF" },
    { key: "emergency",  name: "应急处置", color: "#4DC3FF" },
    { key: "accident",   name: "历史事故", color: "#E24B4A" },
    { key: "enterprise", name: "同类型企业", color: "#2DD4A7" }
  ];
  // 全域罗盘六边形 symbol（ECharts 无内置 hexagon，用自定义 SVG path，中心(0,0)顶点间隔60°）
  var HEX_PATH = "path://M0,-1 L0.866,-0.5 L0.866,0.5 L0,1 L-0.866,0.5 L-0.866,-0.5 Z";
  var state = { paused: false, cur: -1, timer: null, resumeT: null, data: null };

  // ---- 等比缩放（contain，勿裁右侧榜单）----
  function fitStage() {
    var s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    var el = $("stage");
    if (el) el.style.transform = "translate(-50%, -50%) scale(" + s + ")";
  }
  window.addEventListener("resize", fitStage);

  // ---- 时钟 ----
  function tickClock() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var el = $("clock");
    if (el) el.textContent = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  setInterval(tickClock, 1000); tickClock();

  // ---- 心跳 ----
  function heartbeat() {
    PKG_API.getBackendStatus().then(function (r) {
      var dot = $("screen-dot"), st = $("screen-status");
      if (r) { dot.className = "dot"; st.textContent = "数据实时接入"; }
      else { dot.className = "dot off"; st.textContent = "离线演示"; }
    });
  }
  setInterval(heartbeat, 30000); heartbeat();

  // ---- 左栏指标（v2：节点/企业/储罐/监测；无数据显示「—」不填0）----
  function renderMetrics(scale, risk) {
    var set = function (id, v) { var el = $(id); if (el) el.textContent = (v === undefined || v === null || v === 0) ? "—" : v; };
    set("m-node", scale.nodeCount);
    set("m-edge", scale.edgeCount);
    set("m-ent", scale.enterpriseCount);
    set("m-tank", scale.tankUnitCount);
    set("m-tankgroup", scale.tankGroupCount);
    set("m-nontank", scale.nonTankFacilityCount);
    // 已判定隐患（v2.1 risk.hazards，真实 0 显示 0 不显示—）
    var hz = (risk.hazards || []);
    var hzTotal = hz.reduce(function (s, h) { return s + (h.count || 0); }, 0);
    var eh = $("m-hazard"); if (eh) eh.textContent = hz.length ? hzTotal : "0";
    var ehSub = $("m-hazard-sub"); if (ehSub) ehSub.textContent = hz.length ? hz.length : "0";
  }

  // ---- 星系（v2 一核六维：中心=储罐插槽，六维椭圆轨道环绕，layout:'none' 可复现）----
  var currentTankLabel = null;  // 当前中心显示的储罐名（null=知识库总览）
  function buildGalaxy(topology) {
    var el = $("galaxy");
    if (!el || !window.echarts) return null;
    var GX = 450, GY = 395, RX = 330, RY = 255;   // 椭圆轨道（v2 C.1）
    var nodes = [], links = [];
    window.__screenGX = GX; window.__screenGY = GY;
    // 中心：全域罗盘（v2.1 默认焦点位，六边形，六条边即六维，silent 不可点击）
    var center = { id: "core_total", name: "储存环节 · 全域", x: GX, y: GY, symbolSize: 180, symbol: HEX_PATH, silent: true,
      itemStyle: { color: "#132442", borderColor: "#22D3EE", borderWidth: 2 },
      label: { show: true, position: "inside", fontSize: 18, color: "#E8F0FF" }, category: "center" };
    nodes.push(center);

    // 六域在椭圆轨道（v2 C.1: 正上/右上/右下/正下/左下/左上）
    DOMAINS.forEach(function (dm, i) {
      var a = (-90 + i * 60) * Math.PI / 180;
      var cx = GX + RX * Math.cos(a), cy = GY + RY * Math.sin(a);
      var dn = { id: "dom_" + dm.key, name: dm.name, x: cx, y: cy, symbolSize: 46,
        itemStyle: { color: dm.color }, label: { show: true, position: "inside", fontSize: 16, color: "#060B18", fontWeight: 500 },
        category: dm.key, domainKey: dm.key };
      nodes.push(dn);
      links.push({ id: "c_" + dm.key, source: "core_total", target: "dom_" + dm.key, lineStyle: { color: dm.color, opacity: 0.35 } });

      // 代表实体（每域3~5个，度数高的优先——这里按种子序取该域类型节点前5）
      var reps = (topology.nodes || []).filter(function (n) {
        var c = n.category || n.type;
        return (dm.key === "hazard" && c === "dangerous_goods") ||
               ((dm.key === "incompatible" || dm.key === "reaction") && c === "chemical_reaction") ||
               (dm.key === "emergency" && c === "emergency_measure") ||
               (dm.key === "accident" && c === "accident") ||
               (dm.key === "enterprise" && c === "enterprise");
      }).slice(0, 5);
      reps.forEach(function (r, ri) {
        var b = Math.random() * Math.PI * 2;
        var px = cx + 62 * Math.cos(b), py = cy + 62 * Math.sin(b);
        var nm = (r.name || r.label || "").replace(/[（(].*[）)]/, "");
        nodes.push({ id: "rep_" + dm.key + "_" + ri, name: nm.length > 8 ? nm.slice(0, 7) + "…" : nm, full: nm, x: px, y: py, symbolSize: 22,
          itemStyle: { color: dm.color, opacity: 0.85 }, label: { show: false, position: "bottom", fontSize: 13, color: dm.color },
          category: dm.key, domainKey: dm.key });
        links.push({ id: "d_" + dm.key + "_" + ri, source: "dom_" + dm.key, target: "rep_" + dm.key + "_" + ri, lineStyle: { color: dm.color, opacity: 0.2 } });
      });
    });

    var opt = {
      backgroundColor: "transparent",
      tooltip: { show: true, formatter: function (p) { return p.data.full || p.data.name; } },
      series: [{
        type: "graph", layout: "none", roam: false,
        data: nodes, links: links,
        label: { show: false },
        itemStyle: { borderColor: "rgba(255,255,255,0)" },
        lineStyle: { color: "source", curveness: 0.12, opacity: 0.35 },
        emphasis: { focus: "adjacency", scale: 1.2, lineStyle: { width: 2.5 } },
        blur: { itemStyle: { opacity: 0.28 }, lineStyle: { opacity: 0.1 } },
        animationDuration: 800, animationEasing: "cubicOut",
        animationDelay: function (i) { return i * 20; }
      }]
    };
    chart = echarts.init(el);
    chart.setOption(opt);
    chart.on("click", function (p) {
      if (p.dataType !== "node" || !p.data) return;
      if (p.data.domainKey && p.data.domainKey !== "center") {
        // 点域/代表节点 → 锁定在该域，六维展开
        state.paused = true; state.cur = DOMAINS.findIndex(function (d) { return d.key === p.data.domainKey; });
        focusDomain(state.cur, true); updatePauseBtn();
      }
    });
    return chart;
  }


  // ---- 焦点切换 ----
  function focusDomain(idx, manual) {
    if (!chart) return;
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    var dm = DOMAINS[idx];
    var data = chart.getOption().series[0].data;
    var di = data.findIndex(function (n) { return n.domainKey === dm.key && n.id.indexOf("rep_") !== 0; });
    if (di >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: di });
    renderFocusCard(dm);
    if (manual) { clearTimeout(state.resumeT); state.resumeT = setTimeout(finishHold, 30000); }
  }
  function releaseFocus() {
    if (chart) chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    var fc = $("focus-card"); if (fc) fc.style.opacity = 0;
  }

  // ---- 焦点说明卡 ----
  function renderFocusCard(dm) {
    var fc = $("focus-card"); if (!fc) return;
    var d = (state.data && state.data.domains || []).filter(function (x) { return x.key === dm.key; })[0];
    var cnt = d ? d.count : "–";
    var samples = (d && d.samples || []).slice(0, 3).join("<br>");
    fc.innerHTML = '<div class="fc-title">' + dm.name + "　<span class='fc-count'>" + cnt + " 项</span></div>" +
      '<div class="fc-props">' + (samples || "暂无样例") + "</div>";
    fc.style.opacity = 1;
  }

  // ---- 推理剧场：一屏一焦点指挥舱（巡检联动，基于焦点实体动态生成推理链） ----
  // 链舞台：节点/关系横向排布，未激活半透明下沉；播放时依次点亮，链走完浮出依据卡+结论条
  function buildTheaterChain(f) {
    var stage = $("th-stage");
    if (!stage) return;
    // 依据 patrolPool 焦点字段动态构造链（nodes/links）——取不到显示 "—"，绝不编造
    var name = f.label || "—";
    var medium = (f.medium && f.medium.length) ? f.medium.slice(0, 3).join("/") : (f.forbidden && f.forbidden.length ? f.forbidden.slice(0, 3).join("/") : "—");
    var conclusion = (f.conclusion || "—");
    var suggestion = f.suggestion || (conclusion.indexOf("禁配") >= 0 ? "建议核查隔离间距 · 分罐存放" : "跟踪整改");
    var risk = f.riskScore != null ? f.riskScore : "—";
    var isTank = f.focusType === "storage_tank";
    // 三段链：焦点实体 → 风险源 → 处置。节点+关系均取自焦点数据
    var nodes = [ name ];
    var links = [];
    var ruleLabel = isTank ? "储罐·介质" : "货种·危险特性";
    if (medium !== "—") { nodes.push(medium); links.push({ label: "经营/存储", rule: ruleLabel }); nodes.push(conclusion); links.push({ label: "风险推断", rule: "同址/禁配" }); }
    else { nodes.push(conclusion); links.push({ label: "风险推断", rule: "同址/禁配" }); }
    var html = '<div class="th-chain">';
    nodes.forEach(function (n, i) {
      if (i > 0) {
        var lk = links[i - 1];
        html += '<span class="th-link"><span class="th-lk-label">' + esc(lk.label) + '</span>' +
          '<span class="th-lk-rule">' + esc(lk.rule || "") + '</span></span>';
      }
      html += '<span class="th-node' + (i === 0 ? " th-high" : "") + '">' + esc(n) + '</span>';
    });
    html += '</div>';
    stage.innerHTML = html;
    // 结论依据（依据卡 + 结论条）
    var out = $("th-out");
    if (out) {
      out.innerHTML = '<div class="th-cards">' +
        '<div class="th-card"><span class="th-card-t">确认</span><div class="th-card-name">' + esc(name) + '</div><div class="th-card-d">' + (isTank ? "储罐设施" : "危货物种") + "</div></div>" +
        '<div class="th-card"><span class="th-card-t">依据</span><div class="th-card-name">' + esc(conclusion) + '</div><div class="th-card-d">' + esc(suggestion) + "</div></div>" +
        '<div class="th-card"><span class="th-card-t">处置建议</span><div class="th-card-name">' + esc(suggestion) + '</div><div class="th-card-d">风险分 <b>' + esc(risk) + "</b></div></div>" +
        "</div>";
    }
    // 记录到 state，供播放用
    state._theater = { stage: stage, concl: conclusion, sug: suggestion, risk: risk };
  }

  // 播放：依次点亮节点/关系（~0.5s 一拍，约1.5s 走完），链走完点亮依据卡
  function playTheaterChain(f, onDone) {
    var tag = $("th-curtag"); if (tag) tag.textContent = f.label || "全域罗盘";
    buildTheaterChain(f);
    if (state._tChain) clearTimeout(state._tChain);
    var stage = $("th-stage");
    if (!stage) { if (onDone) onDone(); return; }
    var els = stage.querySelectorAll(".th-node, .th-link");
    els.forEach(function (el) { el.classList.remove("th-live"); });
    var idx = 0, total = els.length;
    function step() {
      if (idx < total) { els[idx].classList.add("th-live"); idx++; state._tChain = setTimeout(step, 500); }
      else { state._tChain = null; if (onDone) onDone(); }
    }
    step();
  }

  // 剧场持续轮播：顺序播 patrolPool 所有链，每条播完停留后切下一条，循环（消灭全景/初始空窗）
  var _theaterT = null, _theaterIdx = 0;
  function startTheaterLoop() {
    if (_theaterT) { clearTimeout(_theaterT); _theaterT = null; }
    if (!patrolPool.length) return;
    var total = patrolPool.length;
    function playOne() {
      if (_theaterIdx >= total) _theaterIdx = 0;
      var f = patrolPool[_theaterIdx];
      // 链播放结束(约1.5s) + 停留展示依据卡 ~4s 后切下一条
      playTheaterChain(f, function () {
        _theaterT = setTimeout(function () { _theaterIdx++; playOne(); }, 4000);
      });
    }
    playOne();
  }
  function stopTheaterLoop() { if (_theaterT) { clearTimeout(_theaterT); _theaterT = null; } if (state._tChain) { clearTimeout(state._tChain); state._tChain = null; } }


  // ---- 底部结论条（永远非空）----
  var _conclPool = [], _conclIdx = 0, _conclT = null, _conclBuf = "";
  function renderConclusions(data) {
    var pool = data.conclusions || [];
    // 后备素材：无结论时滚动禁配数量说明
    if (!pool.length) {
      (data.risk.topGoods || []).forEach(function (g) {
        if (g.hint) pool.push(g.name + "：" + g.hint);
      });
    }
    if (!pool.length) pool.push("知识图谱服务已接入，等待风险结论生成…");
    _conclPool = pool; _conclIdx = 0; _conclBuf = "";
    if (_conclT) clearTimeout(_conclT);
    // 演示 F：结论条改成「打字机式」逐字浮现（比匀速跑马灯更有播报感），逐条循环
    typeNextChar();
    function typeNextChar() {
      if (_conclIdx >= _conclPool.length) { _conclIdx = 0; }   // 播完一轮循环
      var cur = _conclPool[_conclIdx];
      var track = $("concl-track"); if (!track) return;
      // 去掉滚动动画，用打字机追加
      track.style.animation = "none";
      track.style.paddingLeft = "0";
      if (_conclBuf.length < cur.length) {
        _conclBuf += cur.charAt(_conclBuf.length);
        track.innerHTML = '<span>▶ ' + _conclBuf + '<span class="crt">|</span></span>';
        _conclT = setTimeout(typeNextChar, 60);
      } else {
        // 本条打完，停顿后换下一条
        track.innerHTML = '<span>▶ ' + _conclBuf + "</span>";
        _conclIdx++; _conclBuf = "";
        _conclT = setTimeout(typeNextChar, 2000);
      }
    }
  }

  // ---- v2.1 自动巡检：以「焦点实体」为单位（全域罗盘4s + 每个焦点18s，跨类型混合，总约98s）----
  var patrolPool = [];      // 跨类型混合：storage_tank + dangerous_goods（来自后端 d.patrolPool）
  var patrolPhase = -1;   // -1=罗盘，>=0=巡检到 patrolPool[i]
  function tick() {
    if (state.paused) return;
    if (!patrolPool.length) { state.cur = (state.cur + 1) % (DOMAINS.length + 1); if (state.cur === DOMAINS.length) releaseFocus(); else focusDomain(state.cur, false); state.timer = setTimeout(tick, 15000); return; }
    // 混合池巡检：-1→0→1→...→N-1→-1
    patrolPhase = (patrolPhase + 1) % (patrolPool.length + 1);
    if (patrolPhase === 0) {
      showPanorama();
      setTimeout(tick, 4000);  // 罗盘4s
    } else {
      showPatrolFocus(patrolPool[patrolPhase - 1]);
      setTimeout(tick, 18000); // 每焦点18s
    }
  }
  function showPanorama() {
    if (chart && currentTankLabel) chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    // 中心回全域罗盘（六边形）
    if (chart && currentTankLabel) {
      var GX = window.__screenGX || 450, GY = window.__screenGY || 395;
      chart.setOption({ series: [{ data: (chart.getOption().series[0].data || []).map(function (n) {
        if (n.category === "center") return Object.assign({}, n, { id: "core_total", name: "储存环节 · 全域", full: "港口危货安全知识库", x: GX, y: GY, symbolSize: 180, symbol: HEX_PATH, silent: true, itemStyle: { color: "#132442", borderColor: "#22D3EE", borderWidth: 2 }, label: { show: true, position: "inside", fontSize: 18, color: "#E8F0FF" } });
        return n;
      }) }] });
    }
    currentTankLabel = null;
    var fc = $("focus-card"); if (fc) fc.innerHTML = '<div class="fc-title">港口危货安全知识库<span class="fc-count"> 全景</span></div><div class="fc-props">全域罗盘 · 储存环节 · 自动巡检中，储罐与高危货种交替聚焦，证明六维框架对任何对象成立</div>';
    var tracks = document.querySelectorAll(".rank-item"); tracks.forEach(function (el) { el.classList.remove("active"); });
    // 回全景：重启剧场持续轮播（顺序播所有链，不再空窗）
    if (patrolPool.length) startTheaterLoop();
  }
  // 焦点推入：罗盘缩小退位 opacity 0.15，实体升起进居中心（v2.1 C.2 聚焦态）
  function showPatrolFocus(f) {
    if (!chart) return;
    var GX = window.__screenGX || 450, GY = window.__screenGY || 395;
    var isTank = f.focusType === "storage_tank";
    var isNonTank = isTank && f.shape === "rect";
    var color = isTank ? (isNonTank ? "#7C93B8" : "#FFB020") : "#D85A30";
    var symbol = isTank ? (isNonTank ? "rect" : "circle") : "circle";
    var riskColor = f.riskLevel === "high" ? "#EF4444" : f.riskLevel === "medium" ? "#F59E0B" : "#22C55E";
    var radius = f.radius || (isTank ? 60 : 46);
    currentTankLabel = f.label;
    chart.setOption({ series: [{ data: (chart.getOption().series[0].data || []).map(function (n) {
      if (n.category === "center") {
        return Object.assign({}, n, { id: "core_focus", name: f.label, full: f.label,
          x: GX, y: GY, symbolSize: radius, symbol: symbol, silent: false,
          itemStyle: { color: color, borderColor: riskColor, borderWidth: 3 },
          label: { show: true, position: "inside", fontSize: 16, color: "#060B18", fontWeight: 500 } });
      }
      if (n.category !== "center" && n.id !== "core_total" && !n.silentOriginal) return n;
      // 罗盘退位淡出
      if (n.id === "core_total") return Object.assign({}, n, { silentOriginal: true, silent: true, itemStyle: Object.assign({}, n.itemStyle, { opacity: 0.15 }) });
      return n;
    }) }] });
    renderFocusCardFocus(f);
    animateFocusSwap();
    // 一屏一焦点指挥舱：切到当前焦点实体链，暂停独立轮播（回全景时重启轮播）
    stopTheaterLoop();
    _theaterIdx = patrolPool.findIndex(function (p) { return p && p.label === f.label; });
    if (_theaterIdx < 0) _theaterIdx = 0;
    playTheaterChain(f);
  }
  // v1.5 指挥舱：焦点卡切换微动效——进入时右推入（enter），无旧卡淡出需求（内容已由 render 替换）
  function animateFocusSwap() {
    var fc = $("focus-card"); if (!fc) return;
    fc.classList.remove("enter");
    // 强制重排触发 transition
    void fc.offsetWidth;
    fc.classList.add("enter");
    setTimeout(function () { fc.classList.remove("enter"); }, 500);
  }
  // 焦点卡：v1.5 指挥舱版——大号风险分 + 四宫格 + 迷你推理链 + 建议动作（保留原六维计数）
  function renderFocusCardFocus(f) {
    var fc = $("focus-card"); if (!fc) return;
    var depth = (state.data && state.data.domains || []).reduce(function (o, x) { o[x.key] = x.count; return o; }, {});
    // 大号风险分
    var rs = f.riskScore != null ? f.riskScore : (depth.incompatible || 0);
    var riskHtml = rs ? '<div class="fc-riskbig"><span class="fc-rsnum' + (rs >= 20 ? ' warn-hazard' : '') + '">' + rs + '</span><span class="fc-rslabel">风险分</span></div>' : "";
    // 四宫格：罐型/介质/同址危货/冲突类型
    var quad1 = { k: "罐型", v: f.focusType === "storage_tank" ? (f.label || "储罐") : (f.typeLabel || "货种") };
    var quad2 = { k: "介质", v: f.forbidden && f.forbidden.length ? f.forbidden.join("/") : (f.medium || "-") };
    var quad3 = { k: "同址危货", v: (f.conclusion || "").indexOf("LPG") >= 0 ? "液化石油气(LPG)" : "-" };
    var quad4 = { k: "冲突类型", v: "禁配共存" };
    var quads = [quad1, quad2, quad3, quad4].map(function (q) {
      return '<div class="fc-quad"><div class="fc-qk">' + q.k + '</div><div class="fc-qv">' + (q.v || "-") + '</div></div>';
    }).join("");
    // 迷你推理链
    var ch = (f.conclusion || "").trim();
    var chainHtml = ch ? '<div class="fc-chain"><span class="fc-chain-badge">推理</span>' + ch + '</div>' : "";
    // 建议动作
    var action = f.suggestion || (ch.indexOf("禁配") >= 0 ? "建议核查隔离间距 · 分罐存放" : "跟踪整改");
    // 六维计数（保留）
    var scores = '特性 ' + (depth.hazard || "–") + " · 禁配 " + (depth.incompatible || "–") + " · 反应 " + (depth.reaction || "–") + " · 事故 " + (depth.accident || "–") + " · 企业 " + (depth.enterprise || "–") + " · 措施 " + (depth.emergency || "–");
    fc.innerHTML = '<div class="fc-title">' + (f.label || "") + "</div>" +
      riskHtml +
      '<div class="fc-quadgrid">' + quads + "</div>" +
      chainHtml +
      '<div class="fc-action">💡 ' + action + "</div>" +
      '<div class="fc-scores">' + scores + "</div>" +
      (f.conclusion ? '<div class="fc-risk">⚠ ' + f.conclusion + "</div>" : "");
  }
  function startPatrol() {
    if (state.timer) clearTimeout(state.timer);
    // 用混合巡检池（patrolPool）驱动；初始先全域罗盘
    // P1-1: 单链调度——不再 setInterval，由 tick() 内部 setTimeout 自调度（罗盘4s + 焦点18s），避免双链连跳
    patrolPhase = -1;
    if (patrolPool.length) { showPanorama(); }
    tick();
  }
  function finishHold() { state.paused = false; updatePauseBtn(); }
  function updatePauseBtn() {
    var b = $("btn-pause");
    if (b) b.textContent = state.paused ? "▶ 继续" : "⏸ 暂停";
  }
  // 交互暂停 30s
  document.addEventListener("mousemove", function () { if (!state.paused) { state.paused = true; updatePauseBtn(); } clearTimeout(state.resumeT); state.resumeT = setTimeout(finishHold, 30000); });
  $("btn-pause").addEventListener("click", function () { state.paused = !state.paused; clearTimeout(state.resumeT); updatePauseBtn(); });
  // 键盘：空格暂停/继续，←/→ 切焦点
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") { e.preventDefault(); state.paused = !state.paused; clearTimeout(state.resumeT); updatePauseBtn(); }
    else if (e.key === "ArrowRight") { state.paused = true; clearTimeout(state.resumeT); state.resumeT = setTimeout(finishHold, 30000); state.cur = (state.cur + 1) % DOMAINS.length; focusDomain(state.cur, true); updatePauseBtn(); }
    else if (e.key === "ArrowLeft") { state.paused = true; clearTimeout(state.resumeT); state.resumeT = setTimeout(finishHold, 30000); state.cur = (state.cur - 1 + DOMAINS.length) % DOMAINS.length; focusDomain(state.cur, true); updatePauseBtn(); }
  });

  // ---- 后端断连容错：不清 0，只置灰 ----
  function setStale() {
    ["m-ent", "m-node", "m-edge", "m-high"].forEach(function (id) { var el = $(id); if (el) el.style.opacity = 0.35; });
  }

  // ---- 主流程 ----
  function load() {
    fitStage();
    // 星系
    PKG_API.fetchTopology().then(function (topo) { if (topo) buildGalaxy(topo); });
    // 大屏主数据（一次拉全 scale/risk/conclusions/domains/tanks）
    function refresh() {
      PKG_API.fetchScreenOverview().then(function (d) {
        if (!d) { setStale(); return; }
        state.data = d;
        patrolPool = (d.patrolPool && d.patrolPool.length) ? d.patrolPool : ((d.tanks && d.tanks.topTanks) || []);
        renderMetrics(d.scale || {}, d.risk || {});
        renderConclusions({ conclusions: d.conclusions, risk: { topGoods: d.risk.topGoods } });
        // 剧场持续轮播：数据就绪即启动，顺序播所有链（消灭初始/全景空窗）
        if (patrolPool.length) startTheaterLoop();
        // 顶栏最后更新时间
        if (d.timestamp) { var up = $("screen-uptime"); if (up) up.textContent = "最后更新 " + d.timestamp.slice(5, 16); }
        // 范围声明行（v2.1 scope 段）
        if (d.scope && d.scope.statement) { var ss = $("scope-line"); if (ss) ss.innerHTML = '<span class="scope-cur">' + d.scope.statement.split("｜")[0] + '</span><span class="scope-planned">｜' + (d.scope.statement.split("｜")[1] || "") + "</span>"; }
        // 若无线索池数据，中心保持全域罗盘（降级）
        if (!patrolPool.length && currentTankLabel && chart) showPanorama();
      });
    }
    refresh();
    setInterval(refresh, 300000);   // 榜单/结论 5 分钟
    startPatrol();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();