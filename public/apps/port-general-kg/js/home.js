/* home.js — 港口通用知识库 v0.1 首页逻辑（全新重写，纯干散货·配置驱动·对接后端）
 * 数据：/api/domains/dry-bulk/entities（实体） /api/home/overview（结论流+KPI） /api/chains/:id（五段链）
 * 红线：取不到显示「—」；每段标 source；失败显式报错不静默。
 */
(function () {
  "use strict";
  var API = window.PKG_API;
  var chart = null, echarts = null;
  var SEED = null, OVERVIEW = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setStatus(on) { var d = $("s-dot"), t = $("s-txt"); if (d) d.classList.toggle("on", !!on); if (t) t.textContent = on ? "已接入" : "未连接"; }

  // ---------- 数据加载：拉实体 + 首页概览，注入 SEED 供星系/详情复用 ----------
  function load() {
    // 先取域配置(六维 lens)，注入 galaxy 实现配置驱动展示；再拉实体+概览
    return API.fetchDomainConfig("dry-bulk")
      .then(function (cfg) {
        if (cfg && cfg.lens && window.__DRY_BULK_GALAXY && window.__DRY_BULK_GALAXY.setDomains) {
          window.__DRY_BULK_GALAXY.setDomains(cfg.lens);
        }
      })
      .catch(function () { /* 配置获取失败不阻塞，galaxy 用内置默认六维 */ })
      .then(function () {
        return Promise.all([API.fetchDomainEntities("dry-bulk"), API.fetchHomeOverview()]);
      })
      .then(function (rs) {
        SEED = rs[0];
        OVERVIEW = rs[1];
        window.__DRY_BULK_SEED = SEED;   // galaxy/detail 复用同一数据源
        // 页脚「最近更新」（连线 /api/home/overview 的 updatedAt，消除显示「–」）
        var ft = document.getElementById("ft-updated");
        if (ft && OVERVIEW && OVERVIEW.updatedAt) ft.textContent = String(OVERVIEW.updatedAt).slice(0, 10);
        renderAll();
      })
      .catch(function (e) {
        setStatus(false);
        window.__DRY_BULK_SEED = window.__DRY_BULK_SEED || null;
        renderError("数据加载失败：" + e.message);
      });
  }

  // ---------- 北极星 KPI（链完备率/断链/可用链/约束规则） ----------
  function renderKpi() {
    var kpi = OVERVIEW && OVERVIEW.kpi || [];
    var map = {};
    kpi.forEach(function (k) { map[k.id] = k.value; });
    var ids = { chainCompleteness: "k-chainrate", brokenChains: "k-broken", usableChains: "k-chains", constraintRules: "k-rules" };
    for (var k in ids) { var el = $(ids[k]); if (el) el.textContent = map[k] != null ? map[k] : "—"; }
    // 断链0显示绿色，>0显示橙色警示
    var bk = $("k-broken");
    if (bk && map.brokenChains != null) { bk.style.color = map.brokenChains === 0 ? "var(--green,#7fae6a)" : "var(--warn,#e07b39)"; }
    // 页脚链状态
    var mini = $("chain-stats-mini");
    if (mini) mini.textContent = "链完备率 " + (map.chainCompleteness != null ? map.chainCompleteness : "—");
  }

  // T4: KPI 释义（uiHints.kpi）+ 页面定位条（uiHints.pages）
  function renderHints() {
    API.fetchUiHints().then(function (u) {
      var kp = (u && u.kpi) || {};
      Object.keys(kp).forEach(function (k) {
        var el = $("kh-" + k);
        if (el && kp[k] && kp[k].plain) el.textContent = kp[k].plain;
      });
      var pg = (u && u.pages) || {};
      var wb = $("home-where");
      if (wb && pg.home && pg.home.where) wb.textContent = pg.home.where;
    }).catch(function () { /* 释义获取失败不阻塞主页 */ });
  }

  // ---------- 六维星系（复用 drybulk-galaxy.js 渲染） ----------
  function renderGalaxy() {
    var el = $("galaxy");
    if (!el || !window.__DRY_BULK_GALAXY || !SEED) return;
    if (!echarts) echarts = window.echarts;
    if (!chart && echarts) chart = echarts.init(el);
    if (!chart) return;
    var ok = window.__DRY_BULK_GALAXY.render(chart, echarts);
    if (!ok) { el.innerHTML = '<div class="empty">数据缺失，星系无法渲染</div>'; }
    // 点击实体节点 → 开 L2 六维画像（带 detail 引用）；画像内可进实体详情 / L3 证据
    if (chart && window.__DRY_BULK_DETAIL && window.__DRY_BULK_RADAR) {
      chart.off("click");
      chart.on("click", function (p) {
        if (!p.dataType || p.dataType !== "node" || !p.data) return;
        if (p.data.detail && p.data.detail.kind && p.data.detail.id) {
          // 用户诉求：点击星系实体节点 → 直达工作台该实体档案页（#/entity/{type}/{id}），
          // 档案页内可「去求解器测算」；六维画像能力保留在工作台档案页后续可挂。
          var k = p.data.detail.kind, id = p.data.detail.id;
          location.href = "workbench.html#/entity/" + k + "/" + encodeURIComponent(id);
        } else if (p.data.id === "kg_center") {
          // TF-4: 中心节点点击反馈（轻提示，不阻塞）
          tfCenterToast();
        } else if (p.data.category === "domain" && p.data.domainKey) {
          // 用户诉求2：点击维度中心点 → 列该维度下所有实体
          dimList(p.data.domainKey);
        }
      });
    }
  }

  // TF-4: 中心节点点击 → 轻提示（说明全域结构 + 引导下钻）
  var tfTimer = null;
  function tfCenterToast() {
    var el = document.getElementById("kg-center-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "kg-center-toast";
      el.className = "kg-center-toast";
      el.innerHTML = '干散货 · 全域中心 — 六个维度挂接真实实体，点任意实体节点展开六维画像；点维度配色点可按维下钻。';
      document.body.appendChild(el);
    }
    el.classList.remove("show");
    void el.offsetWidth;   // 重触发动画
    el.classList.add("show");
    if (tfTimer) clearTimeout(tfTimer);
    tfTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  // 点击维度中心点 → 列该维度下所有实体（含去工作台档案/求解入口）
  var dimPanel = null;
  function dimList(dkey) {
    var g = window.__DRY_BULK_GALAXY, seed = window.__DRY_BULK_SEED;
    if (!g || !g.domains || !g.repsFor) { tfCenterToast(); return; }
    var dm = null;
    g.domains.forEach(function (x) { if (x.key === dkey) dm = x; });
    if (!dm) { tfCenterToast(); return; }
    var reps = g.repsFor(dkey) || [];
    if (!reps.length) { tfCenterToast(); return; }
    if (!dimPanel) {
      dimPanel = document.createElement("div");
      dimPanel.id = "kg-dim-panel";
      dimPanel.className = "kg-dim-panel";
      document.body.appendChild(dimPanel);
      dimPanel.addEventListener("click", function (e) {
        if (e.target === dimPanel || e.target.className === "dim-close") { hideDim(); }
        else if (e.target.getAttribute && e.target.getAttribute("data-href")) { location.href = e.target.getAttribute("data-href"); }
      });
    }
    dimPanel.style.borderColor = dm.color || "#b5651d";
    var cards = reps.map(function (r) {
      var href = r.kind && r.id ? "workbench.html#/entity/" + r.kind + "/" + encodeURIComponent(r.id) : null;
      return '<div class="dim-item" style="border-left:3px solid ' + (dm.color || "#b5651d") + '">' +
        '<span class="dim-nm">' + escapeHtml(r.name) + "</span>" +
        (href ? '<a class="dim-go" data-href="' + href + '" href="' + href + '">档案 ↗</a>' : "") +
        "</div>";
    }).join("");
    dimPanel.innerHTML =
      '<div class="dim-head"><span style="color:' + (dm.color || "#b5651d") + '">' + escapeHtml(dm.name || dkey) + "</span> · " + reps.length + " 个实体<button class=\"dim-close\">✕</button></div>" +
      '<div class="dim-body">' + cards + "</div>" +
      '<div class="dim-foot">点「档案 ↗」可去工作台查看该实体完整档案</div>';
    dimPanel.classList.add("show");
  }
  function hideDim() { if (dimPanel) dimPanel.classList.remove("show"); }
  function escapeHtml(s) { return String(s == null ? "" : s).replace(/[&<>\"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- 结论流（今日发现，卡与链同源） ----------
  var currentConclusion = null;
  // v0.2 T-A: 推理链 → 工作台求解器 带参深链（读 seed 链的 solverLink，参数与结论同源）
  function wbRoute(chainId) {
    var ch = (SEED && SEED.chains || []).filter(function (c) { return c.id === chainId; })[0];
    var link = ch && ch.solverLink;
    if (!link || !link.solver) return null;
    var url = 'workbench.html#/solver/' + link.solver;
    var defs = link.defaults || {};
    var keys = Object.keys(defs);
    if (keys.length) url += '?' + keys.map(function (k) { return k + '=' + encodeURIComponent(defs[k]); }).join('&');
    return url;
  }
  function renderFindings() {
    var list = $("findings-list");
    if (!list) return;
    var concls = (OVERVIEW && OVERVIEW.conclusions) || [];
    if (!concls.length) { list.innerHTML = '<div class="empty">暂无结论</div>'; return; }
    list.innerHTML = concls.map(function (c) {
      var wb = wbRoute(c.chainId);
      return '<div class="f-card" data-chain="' + esc(c.chainId) + '">' +
        '<div class="f-row"><span class="f-c-title">' + esc(c.title) + '</span>' +
        (c.badge ? '<span class="f-badge">' + esc(c.badge) + '</span>' : '') + '</div>' +
        '<div class="f-desc">' + esc(c.detail || "") + '</div>' +
        (c.source ? '<div class="f-src">出处：' + esc(c.source) + '</div>' : '') +
        '<div class="f-actions">' +
        '<button class="f-play" data-chain="' + esc(c.chainId) + '">▶ 播放推理</button>' +
        '<a class="f-wb" href="workbench.html#/graph:' + encodeURIComponent(c.chainId) + '" title="该链证据图谱">🔗 看图谱</a>' +
        (wb ? '<a class="f-wb" href="' + esc(wb) + '" title="在工作台同源求解器里改参重算">🛠️ 去工作台求解</a>' : '') +
        '</div></div>';
    }).join("");
    list.querySelectorAll(".f-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        var play = e.target.closest(".f-play");
        var wbLink = e.target.closest(".f-wb");
        if (wbLink) return;  // 工作台链接交默认跳转，不触发剧场
        var id = card.getAttribute("data-chain");
        if (!id) return;
        if (play) e.stopPropagation();
        switchToChain(id);
      });
    });
  }

  // ---------- 推理剧场：五段链逐帧点亮 ----------
  var chainTimer = null;
  function playChainOnStage(chainData) {
    var stage = $("th-stage");
    if (!stage) return;
    var steps = chainData.steps || [];
    var html = '<div class="th-chain">' + steps.map(function (s, i) {
      // B-4: 步骤按 index 编号(①②③④⑤⑥...)，角色用 th-role 配色区分
      var icon = "①②③④⑤⑥⑦⑧"[i] || "·";
      var badge = s.hasSource ? '<span class="th-src-ok">✓</span>' : '<span class="th-src-miss">✗</span>';
      return (i ? '<span class="th-link">→</span>' : '') +
        '<span class="th-node th-role-' + esc(s.role) + '" data-step="' + i + '">' +
        '<span class="th-num">' + icon + '</span>' + esc(s.title) + badge + '</span>';
    }).join('') + '</div>';
    stage.innerHTML = html;
    $("th-out").innerHTML = "";
    // 逐帧点亮
    var els = stage.querySelectorAll(".th-node");
    els.forEach(function (el) { el.classList.remove("th-live"); });
    var idx = 0;
    clearTimeout(chainTimer);
    function step() {
      if (idx < els.length) { els[idx].classList.add("th-live"); idx++; chainTimer = setTimeout(step, 650); }
      else { renderStepDetail(chainData); }
    }
    step();
  }

  function renderStepDetail(chainData) {
    var out = $("th-out");
    if (!out) return;
    var s = chainData.steps || [];
    // chainType 徽标：能力/合规/匹配（capability/compliance/match），在链详情首行
    var chainBadge = "";
    var ct = (chainData.chainType || "").toLowerCase();
    if (ct) {
      var ctMap = { capability: "能力", compliance: "合规", match: "匹配", rule: "规则" };
      var cts = String(chainData.chainType || "").split(/[+\s,]/).filter(Boolean);
      chainBadge = '<div class="th-bchain">' + cts.map(function (t) {
        var k = t.toLowerCase();
        return '<span class="th-badge-chain">' + (ctMap[k] || t) + "</span>";
      }).join("") + "</div>";
    }
    var html = s.map(function (st) {
      var rows = "";
      if (st.items && st.items.length) {
        rows = st.items.map(function (it) {
          // valueType 三色徽标：推算(黄)/实测(绿)/台账静态(蓝)，数据缺省不标
          var badge = "";
          if (it.valueType === "forecast") badge = '<span class="th-badge-fc">推算</span>';
          else if (it.valueType === "measured") badge = '<span class="th-badge-measured">实测</span>';
          else if (it.valueType === "design") badge = '<span class="th-badge-design">台账</span>';
          // B-4: badge 仅在 valueType 未覆盖时显示，避免「推算推算」重复
          var b2 = (!badge && it.badge) ? '<span class="th-badge-fc">' + esc(it.badge) + "</span>" : "";
          return '<div class="th-row"><span class="th-k">' + esc(it.label) + '</span><span class="th-v">' + esc(it.value) + " " + badge + b2 + "</span></div>";
        }).join("");
      }
      if (st.results && st.results.length) {
        rows = st.results.map(function (r) {
          var flag = r.flag === "veto" ? "th-veto" : (r.flag === "critical" ? "th-crit" : (r.flag === "unknown" ? "th-miss" : "th-ok"));
          // 兼容堆场维度合规链(yard/margin/limit) 与泊位维度(r.berth/margin_m) 与安全维度(r.entity/meta)
          var entity = r.yard || r.berth || r.entity || "";
          var marginTxt = "";
          if (r.meta) { marginTxt = r.meta; }
          else if (r.note) { marginTxt = "—"; }
          else if (r.margin_m != null) { marginTxt = "余量" + r.margin_m + "m"; }
          else if (r.margin != null) { marginTxt = "余量" + r.margin; }
          var v = r.note ? "—" : ((marginTxt ? marginTxt : ""));
          if ((!r.note) && r.limit) v = v + "（限" + r.limit + "）";
          var whois = entity ? entity : "";
          return '<div class="th-row ' + flag + '"><span class="th-k">' + esc(whois || st.title) + '</span><span class="th-v">' + esc(v) + ' <em>' + esc(r.verdict || "") + '</em></span></div>';
        }).join("");
      }
      var src = st.source ? '<div class="th-src">出处：' + esc(st.source) + '</div>' : "";
      return '<div class="th-step"><div class="th-step-t">' + esc(st.title) + '</div>' + rows + src + '</div>';
    }).join("");
    out.innerHTML = chainBadge + html +
      '<div class="th-graphrow"><a class="f-wb" href="workbench.html#/graph:' + encodeURIComponent(chainData.id) + '" title="该链证据图谱">🔗 查看链图谱</a></div>';
  }

  function switchToChain(id) {
    currentConclusion = id;   // B-1: 记录当前链，保证剧场「▶播放推理」按钮可重播
    API.fetchChain(id).then(function (chain) {
      if (!chain) { $("th-out").innerHTML = '<div class="empty">链加载失败（显式报错）</div>'; return; }
      playChainOnStage(chain);
      // 高亮对应结论卡
      document.querySelectorAll(".f-card").forEach(function (el) {
        el.classList.toggle("f-active", el.getAttribute("data-chain") === id);
      });
    }).catch(function (e) {
      $("th-out").innerHTML = '<div class="empty">链加载失败：' + esc(e.message) + '</div>';
    });
  }

  function renderAll() {
    setStatus(true);
    renderKpi();
    renderGalaxy();
    renderFindings();
    // v0.2 T-C1: 支持 ?chain= 深链（工作台回首页回链）；无则默认播主链
    var qChain = null;
    try { qChain = new URLSearchParams(location.search).get('chain'); } catch (e) { /* 老浏览器忽略 */ }
    var target = (qChain && SEED && SEED.chains && SEED.chains.some(function (c) { return c.id === qChain; }))
      ? qChain
      : (SEED.chains.filter(function (c) { return c.isPrimary; })[0] && SEED.chains.filter(function (c) { return c.isPrimary; })[0].id || SEED.chains[0].id);
    switchToChain(target);
  }

  function renderError(msg) {
    Object.keys({ "k-chainrate": 1, "k-broken": 1, "k-chains": 1, "k-rules": 1 }).forEach(function (id) { var el = $(id); if (el) el.textContent = "—"; });
    var list = $("findings-list"); if (list) list.innerHTML = '<div class="empty">' + esc(msg) + '</div>';
  }

  // ---------- 一键演示（M4）---------
  var demoState = { running: false, idx: 0, timer: null };
  var capEl = null;
  function ensureCaption() {
    if (capEl) return capEl;
    capEl = document.createElement("div");
    capEl.className = "demo-caption";
    document.querySelector(".galaxy-wrap") && document.querySelector(".galaxy-wrap").appendChild(capEl);
    return capEl;
  }
  function demoShow(txt) {
    var c = ensureCaption();
    c.textContent = txt;
    c.classList.add("show");
  }
  function demoHide() { if (capEl) capEl.classList.remove("show"); }

  // T0: 北极星字幕数值实时化（禁止硬编码；真值来自 /api/home/overview 的 kpi）
  function kpiVal(id) {
    var kpi = (OVERVIEW && OVERVIEW.kpi) || [];
    for (var i = 0; i < kpi.length; i++) { if (kpi[i].id === id) return kpi[i].value; }
    return null;
  }
  function kpiSentence() {
    if (!OVERVIEW || !OVERVIEW.kpi) { try { console.warn("[demo] KPI 未加载，字幕数值将显示占位符「—」"); } catch (e) {} }
    return "链完备率" + (kpiVal("chainCompleteness") != null ? kpiVal("chainCompleteness") : "—")
      + " · 断链" + (kpiVal("brokenChains") != null ? kpiVal("brokenChains") : "—")
      + " · 可用链" + (kpiVal("usableChains") != null ? kpiVal("usableChains") : "—")
      + " · 约束规则" + (kpiVal("constraintRules") != null ? kpiVal("constraintRules") : "—");
  }

  var demoSteps = [
    { ms: 1600, fn: function () { demoShow("🗺️ 全域六维星系：中心=链路健康度，六域实体（泊位/船舶/设备/堆场/约束）环绕，轨道半径=风险倒数"); } },
    { ms: 2000, fn: function () { demoShow("① 结论流：40万吨VLOC到港 → 可选泊位仅2个（D1水深临界0.05m/日照长度临界3m），名单外硬否决"); } },
    { ms: 2000, fn: function () { var p = (SEED && SEED.chains && SEED.chains.find(function (c) { return c.isPrimary; })) || (SEED && SEED.chains && SEED.chains[0]); if (p) switchToChain(p.id); demoShow("② 播放主链《40万吨VLOC靠泊决策》：事实→约束→冲突→备选→推荐，每步带出处"); } },
    { ms: 1600, fn: function () { demoShow("③ 深度校验：R1水深余量0.05m临界 / R2长度富余68m / R3名单外硬否决（法规禁止+引航拒绝）"); } },
    { ms: 2000, fn: function () { demoShow("④ 备选方案：A乘潮靠泊 / B精确系缆 / C减载过驳；缺失动态项（堆场剩余/占用/吃水）显示「—」待接入生产系统"); } },
    { ms: 1800, fn: function () { demoShow("⑤ 北极星：" + kpiSentence() + " —— 每段可溯源，取不到不编造（\u201c—\u201d）"); } },
    { ms: 1200, fn: function () { demoHide(); endDemo(); } }
  ];
  function runDemoStep() {
    if (!demoState.running) return;
    if (demoState.idx >= demoSteps.length) { demoHide(); endDemo(); return; }
    var st = demoSteps[demoState.idx];
    st.fn();
    demoState.idx++;
    demoState.timer = setTimeout(runDemoStep, st.ms);
  }
  function startDemo() {
    var d = $("btn-demo");
    if (d) d.textContent = "⏸ 演示中";
    demoState.running = true; demoState.idx = 0;
    var nxt = $("btn-demo-next"); if (nxt) nxt.style.display = "inline-block";
    runDemoStep();
  }
  function endDemo() {
    demoState.running = false;
    clearTimeout(demoState.timer);
    var d = $("btn-demo"); if (d) d.textContent = "▶ 一键演示";
    var nxt = $("btn-demo-next"); if (nxt) nxt.style.display = "none";
  }
  function bindDemo() {
    var d = $("btn-demo"); if (d) d.addEventListener("click", function () { if (!demoState.running) startDemo(); else { clearTimeout(demoState.timer); demoState.running = false; demoHide(); var d2 = $("btn-demo"); if (d2) d2.textContent = "▶ 一键演示"; var nx = $("btn-demo-next"); if (nx) nx.style.display = "none"; } });
    var nxt = $("btn-demo-next"); if (nxt) nxt.addEventListener("click", function () { clearTimeout(demoState.timer); runDemoStep(); });
  }

  // ---------- L3 证据溯源（对接 /api/evidence，中文类型名） ----------
  var evidenceLayer = null;
  var KN = { vessel: "船舶", berth: "泊位", yard: "堆场", equipment: "设备", constraint: "约束规则" };
  function renderEvidence(kind, id) {
    // 关掉 L2 雷达层（L2→L3）
    if (window.__DRY_BULK_RADAR && window.__DRY_BULK_RADAR.close) window.__DRY_BULK_RADAR.close();
    var item = null;
    if (seedNow()) {
      var arr = seedNow()[kind === "vessel" ? "vessels" : kind === "berth" ? "berths" : kind === "yard" ? "yards" : kind === "equipment" ? "equipment" : "constraints"] || [];
      item = arr.filter(function (o) { return o.id === id; })[0] || null;
    }
    if (!item) { window.__DRY_BULK_RADAR && window.__DRY_BULK_RADAR.close && window.__DRY_BULK_RADAR.close(); alert("未找到实体证据"); return; }
    var kw = item.name || "";
    // 用实体全名查 /api/evidence（后端按 name includes 匹配，命中最准）
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; fill([]); }, 8000);
    function fill(ev) {
      clearTimeout(timer);
      closeEvidence();
      var rows = (ev && ev.length ? ev : []).map(function (e) {
        return '<div class="ev-row"><span class="ev-type">' + esc(KN[e.type] || e.type || "—") + '</span>' +
          '<span class="ev-ent">' + esc(e.entity || "") + '</span><span class="ev-field">' + esc(e.field || "") + '</span>' +
          '<div class="ev-src">出处：' + esc(e.source || "—") + (e.note && e.note !== "—" ? " · " + esc(e.note) : "") + "</div></div>";
      }).join("");
      if (!rows) rows = '<div class="ev-empty">暂无公开证据（缺失，不编造）</div>';
      evidenceLayer = document.createElement("div");
      evidenceLayer.className = "ev-layer";
      evidenceLayer.innerHTML = '<div class="ev-card"><div class="ev-head"><span>🕵️ 证据溯源 · ' + esc(item.name) + '</span><button class="ev-close">✕</button></div>' +
        '<div class="ev-body">' + rows + "</div></div>";
      evidenceLayer.addEventListener("click", function (e) { if (e.target === evidenceLayer) closeEvidence(); });
      evidenceLayer.querySelector(".ev-close").addEventListener("click", closeEvidence);
      document.body.appendChild(evidenceLayer);
      document.body.classList.add("ev-lock");
    }
    // 用实体 source 关键词查证据；查不到回退整个域
    API.fetchEvidence(kw).then(function (r) { if (!timedOut) fill(r.evidence || []); })
      .catch(function (e) { if (!timedOut) fill([]); });
  }
  function closeEvidence() {
    if (evidenceLayer) { evidenceLayer.remove(); evidenceLayer = null; }
    document.body.classList.remove("ev-lock");
  }
  function seedNow() { return window.__DRY_BULK_SEED || null; }

  // ---------- 首页搜索（接通占位框）：跨实体模糊匹配 → 下拉结果，点/回车跳工作台档案 + 高亮星系 ----------
  var searchPanel = null;
  function doHomeSearch(q) {
    var inp = $("home-search");
    if (searchPanel) { searchPanel.remove(); searchPanel = null; }
    if (!q) { if (inp) inp.style.borderColor = ""; return; }
    var s = seedNow();
    if (!s) { tfCenterToast(); return; }
    // 跨六类实体模糊匹配（名称优先，含 id）
    var typeMap = { vessels: "vessel", berths: "berth", yards: "yard", equipment: "equipment", constraints: "constraint" };
    var typeCn = { vessel: "船舶", berth: "泊位", yard: "堆场", equipment: "设备", constraint: "约束" };
    var hits = [];
    Object.keys(typeMap).forEach(function (k) {
      (s[k] || []).forEach(function (it) {
        var hay = String(it.name || "") + " " + String(it.id || "");
        if (hay.indexOf(q) >= 0) hits.push({ type: typeMap[k], typeCn: typeCn[typeMap[k]], id: it.id, name: it.name });
      });
    });
    if (inp) inp.style.borderColor = hits.length ? "var(--accent,#38bdf8)" : "var(--warn,#e07b39)";
    // 构建下拉
    searchPanel = document.createElement("div");
    searchPanel.className = "home-search-panel";
    var body = hits.length
      ? hits.map(function (h) {
        return '<div class="hsp-item" data-kind="' + h.type + '" data-id="' + esc(h.id) + '">' +
          '<span class="hsp-type">' + esc(h.typeCn) + '</span>' +
          '<span class="hsp-name">' + esc(h.name) + "</span></div>";
      }).join("")
      : '<div class="hsp-empty">未找到含「' + esc(q) + "」的实体</div>";
    searchPanel.innerHTML = '<div class="hsp-head">搜索「' + esc(q) + '」' + (hits.length ? " · " + hits.length + " 条" : "") + '</div>' + body;
    searchPanel.addEventListener("click", function (e) {
      var it = e.target.closest ? e.target.closest(".hsp-item") : null;
      if (!it) return;
      var kind = it.getAttribute("data-kind"), id = it.getAttribute("data-id");
      // 点结果 → 跳工作台实体档案页
      location.href = "workbench.html#/entity/" + kind + "/" + encodeURIComponent(id);
    });
    // 挂到全局搜索容器下（相对定位）
    var wrap = document.querySelector(".global-search");
    (wrap && wrap.appendChild ? wrap : document.body).appendChild(searchPanel);
  }

  // ---------- 启动 ----------
  function init() {
    if (window.__DRY_BULK_RADAR && window.__DRY_BULK_RADAR.setEvidenceHandler) {
      window.__DRY_BULK_RADAR.setEvidenceHandler(function (kind, id) { renderEvidence(kind, id); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { load(); bindDemo(); });
    else { load(); bindDemo(); }
    // 业务主轴（P-2：三层泳道，全宽主线）
    if (window.SPINE_UI) SPINE_UI.init();
    // T4: KPI 释义 + 页面定位条
    renderHints();
    // 可视化增强（P-3：水深剖面）
    if (window.SPINE_VIZ) SPINE_VIZ.init();
    // P-4 全国 40 万吨泊位地图
    var pmc = document.getElementById('pm-canvas');
    if (pmc && window.PORT_MAP) PORT_MAP.init(pmc);
    // T3: 术语悬浮解释层（扫描主轴/结论区/标题，不全局扫）
    if (window.GLOSSARY_TIP && window.GLOSSARY_TIP.init) {
      window.GLOSSARY_TIP.init([".galaxy-wrap", ".spine-wrap", ".spine", ".concl", ".f-card", "#home-search-panel"]);
    }
    // 刷新按钮
    var rf = $("btn-findings-refresh"); if (rf) rf.addEventListener("click", function () { load(); });
    // 播放按钮（重播当前链）
    var bp = $("btn-play"); if (bp) bp.addEventListener("click", function () { if (currentConclusion) switchToChain(currentConclusion); });
    // 首页搜索框接通（占位→可用）：回车/点按钮 → 下拉结果，点结果跳工作台档案 + 高亮星系节点
    var hs = $("home-search"), hsb = $("btn-search");
    function homeSearch() { if (hs) doHomeSearch(hs.value && hs.value.trim()); }
    if (hsb) hsb.addEventListener("click", homeSearch);
    if (hs) hs.addEventListener("keydown", function (e) { if (e.key === "Enter") homeSearch(); else if (e.key === "Escape") { if (searchPanel) { searchPanel.remove(); searchPanel = null; } if (hs) hs.style.borderColor = ""; } });
    document.addEventListener("click", function (e) { if (searchPanel && e.target !== hs && e.target !== hsb && !searchPanel.contains(e.target)) { searchPanel.remove(); searchPanel = null; if (hs) hs.style.borderColor = ""; } });
  }
  init();
})();