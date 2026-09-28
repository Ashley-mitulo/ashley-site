/* graph-ui.js — 知识图谱视图通用渲染器（GF-2，港口通用知识库 v0.1）
 * 双模式：force（G2 关联图谱）/ layered（G1 证据链 DAG）
 * 铁律：节点必带 source；失效法规降饱和+虚线；点节点出档案卡（复用 ar-card 样式）
 */
(function () {
  var API = (window.PKG_API || {});
  function $ (id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var wb = window.__WB;
  function err(m) { if (wb && wb.showError) wb.showError(m); }

  // —— 节点类型配色/形状（配置只配结构：颜色来自域配置或此处常量；铁律二：无逻辑） ——
  var NODE_STYLE = {
    regulation: { color: "#b28cff", shape: "roundRect", label: "法规" },
    clause: { color: "#cdb4ff", shape: "roundRect", label: "条款" },
    goods: { color: "#b5651d", shape: "circle", label: "货种" },
    accident: { color: "#E24B4A", shape: "diamond", label: "事故" },
    constraint: { color: "#3a7bd5", shape: "circle", label: "约束" },
    entity: { color: "#2dd4a7", shape: "circle", label: "实体" },
    chainstep: { color: "#5b8def", shape: "roundRect", label: "步骤" }
  };
  var STATUS_CN = { "in-force": "现行", superseded: "失效", draft: "征求意见稿", "to-verify": "待核" };
  var entityCN = { vessel: "船舶", berth: "泊位", yard: "堆场", equipment: "设备" };
  // P0-2：ECharts 合法 shape 白名单——配置给了合法值就用，不在白名单才回退 roundRect（配置即结构）
  var SHAPE_OK = { circle: 1, rect: 1, roundRect: 1, diamond: 1, triangle: 1 };

  function nodeItem(n) {
    var st = NODE_STYLE[n.type] || NODE_STYLE.goods;
    var size = 30;
    var it = {
      id: n.id, name: n.label || n.id, value: 3, category: n.type,
      symbol: st.shape, symbolSize: size,
      itemStyle: { color: st.color, borderWidth: 0 }
    };
    // 失效法规：降饱和 + 红虚线边框（时效可视化）
    if (n.type === "regulation" && n.status === "superseded") {
      it.itemStyle = { color: "#6b6580", borderColor: "#E24B4A", borderWidth: 2, borderType: "dashed" };
    } else if (n.type === "regulation" && (n.status === "draft" || n.status === "to-verify")) {
      it.itemStyle = { color: "#8f86a8", borderColor: "#f0a500", borderWidth: 1.5 };
    }
    it._raw = n;
    return it;
  }

  function cardHtml(n) {
    var st = NODE_STYLE[n.type] || {};
    var typeCn = st.label || (entityCN[n.entityType] || n.type || "节点");
    var body = "";
    if (n.status) body += '<div class="ar-row"><span class="ar-k">时效</span><span class="ar-v">' + esc(STATUS_CN[n.status] || n.status) + (n.effectiveFrom ? '（' + esc(n.effectiveFrom) + '施行）' : "") + "</span></div>";
    if (n.text) body += '<div class="ar-row"><span class="ar-k">条款</span><span class="ar-v">' + esc(n.text) + "</span></div>";
    if (n.use) body += '<div class="ar-row"><span class="ar-k">用途</span><span class="ar-v">' + esc(n.use) + "</span></div>";
    if (n.formula) body += '<div class="ar-row"><span class="ar-k">规则</span><span class="ar-v">' + esc(n.formula) + "</span></div>";
    if (n.note) body += '<div class="ar-row"><span class="ar-k">要点</span><span class="ar-v">' + esc(n.note) + "</span></div>";
    if (n.applicableRegulation) body += '<div class="ar-row"><span class="ar-k">适用</span><span class="ar-v">' + esc(n.applicableRegulation) + "</span></div>";
    if (n.docNumber) body += '<div class="ar-row"><span class="ar-k">文号</span><span class="ar-v">' + esc(n.docNumber) + "</span></div>";
    // P1-6：事故卡补「违规条款关联」行——日期/伤亡有值但无 violates 边时显示 「—（资料缺口）」，绝不静默
    if (n.type === "accident") {
      var violText = n.hasViolation ? "有关联（图谱中violates边）" : "—（资料缺口，见 03 号资料 B10）";
      body += '<div class="ar-row"><span class="ar-k">违规条款关联</span><span class="ar-v">' + violText + "</span></div>";
    }
    var chainRefs = (n.chainRefs || []).length ? '<div class="ar-row"><span class="ar-k">所属链</span><span class="ar-v">' + n.chainRefs.map(function (c) { return esc(c); }).join("、") + "</span></div>" : "";
    return '<div class="ar-card"><div class="ar-card-h"><span class="ar-type">' + typeCn + '</span><span class="ar-name">' + esc(n.label || n.id) + "</span></div>" +
      (body ? '<div class="ar-rows">' + body + "</div>" : "") + chainRefs +
      '<div class="ar-src">出处：' + esc(n.source || "—") + "</div></div>";
  }

  // P2-1：中心下拉从域配置 defaultCenters 渲染（配置即结构，不写死），保留全域总览
  function centerOptions(centers) {
    var opts = [];
    (centers || window.__GRAPH_CENTERS || ['GOODS-铁矿石', 'GOODS-煤炭', 'GOODS-硝酸铵']).forEach(function (cid) {
      var nm = cid.replace(/^GOODS-/, '');
      opts.push('<option value="' + cid + '">' + nm + "</option>");
    });
    opts.push('<option value="">全域总览</option>');
    return opts.join('');
  }

  // —— G2 关联图谱（force），domain 支持多域：coal/grain/general-cargo + dry-bulk(默认) ——
  function domainPath(d) { return d && d !== "dry-bulk" ? "/api/graph/" + d : "/api/graph/dry-bulk"; }
  function renderRelation(container, centerDefault, domain, centers) {
    var center = centerDefault || "GOODS-煤炭";
    var baseUrl = domainPath(domain);
    var h = '<div class="gr-toolbar">' +
      '<span class="gr-title">关联图谱</span>' +
      '<span class="gr-center">中心：<select id="gr-center">' + centerOptions(centers) + "</select></span>" +
      '<input id="gr-search" placeholder="定位节点…" />' +
      "<span class=\"gr-hint\">双击节点以其为中心</span></div>" +
      '<div id="gr-canvas" style="width:100%;height:520px"></div>' +
      '<div id="gr-detail" class="gr-detail"></div>';
    container.innerHTML = h;
    var sel = $("gr-center"); if (sel) sel.value = center;
    var chart = echarts.init($("gr-canvas"));
    function load() {
      var url = baseUrl + (sel.value ? "?center=" + encodeURIComponent(sel.value) + "&depth=1" : "");
      API.get(url).then(function (g) {
        var cats = Object.keys(NODE_STYLE).map(function (k) { return { name: k }; });
        var nodes = (g.nodes || []).map(nodeItem);
        var links = (g.edges || []).map(function (e) { return { source: e.source, target: e.target, data: { _rel: e.rel }, lineStyle: { width: (e.rel === "supersededBy" ? 2 : 1), color: (e.rel === "supersededBy" ? "#3fae6a" : (e.rel === "violates" ? "#E24B4A" : "#555")), type: (e.rel === "violates" ? "dashed" : "solid") } }; });
        var opt = {
          backgroundColor: "transparent",
          legend: { textStyle: { color: "#ccc" }, top: 4 },
          tooltip: { formatter: function (p) { return p.dataType === "edge" ? (p.data._rel || "") : esc(p.data.name); } },
          series: [{
            type: "graph", layout: "force", roam: true, draggable: true,
            categories: cats, data: nodes, links: links,
            force: { repulsion: 420, edgeLength: 90, gravity: 0.08 },
            label: { show: true, position: "right", color: "#ccc", fontSize: 11, formatter: function (p) { return p.data.name; } },
            labelLayout: { hideOverlap: true },
            lineStyle: { color: "#555", curveness: 0.1 }
          }]
        };
        chart.setOption(opt, true);
        // P2-2：孤点中心提示——搜到 1 节点 0 边不静默，显式说明资料缺口
        var isolated = g.nodes.length === 1 && g.edges.length === 0;
        $("gr-detail").innerHTML = '<div class="gr-summary">' + g.nodes.length + " 节点 / " + g.edges.length + " 边（" + (g.center || "全域") + "）"
          + (isolated ? '<span class="gr-badge gr-badge-warn">该节点暂无关联边（资料缺口）</span>' : "") + "</div>";
        chart.off("click").on("click", function (p) { if (p.dataType === "node") $("gr-detail").innerHTML = cardHtml(p.data && p.data._raw ? p.data._raw : {}); });
        chart.off("dblclick").on("dblclick", function (p) { if (p.dataType === "node" && p.data._raw) { loadCenter(p.data._raw.id); } });
      }).catch(function (e) { $("gr-detail").innerHTML = '<div class="wb-empty">图谱加载失败：' + esc(e.message) + "</div>"; err(e.message); });
    }
    function loadCenter(id) { sel.value = id; if (!$("gr-center").querySelector('option[value="' + id + '"]')) { var o = document.createElement("option"); o.value = id; o.text = id; sel.appendChild(o); } load(); }
    sel.onchange = load;
    var sx = $("gr-search");
    sx.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var q = sx.value.trim(); if (!q) return;
      API.get(sel.value ? baseUrl + "?center=" + encodeURIComponent(sel.value) + "&depth=1" : baseUrl).then(function (g) {
        var hit = (g.nodes || []).filter(function (n) { return (n.label || "").indexOf(q) >= 0 || (n.id || "").indexOf(q) >= 0; });
        if (hit.length) { loadCenter(hit[0].id); } else { $("gr-detail").innerHTML = '<div class="wb-empty">未找到「' + esc(q) + "」节点</div>"; }
      }).catch(function (e) { err(e.message); });
    });
    window.addEventListener("resize", function () { chart.resize(); });
    load();
  }

  // G1 证据链角色配色（与 legend 五色对应；同 source 铁律：无硬编码穿色）
  var ROLE_COLOR = {
    fact: "#2dd4a7", constraint: "#3a7bd5", conflict: "#E24B4A",
    alternative: "#b5651d", recommendation: "#b28cff"
  };

  // —— G1 证据链分层 DAG（layered） ——
  function renderChain(container, chainId) {
    container.innerHTML = '<div id="gr-canvas" style="width:100%;height:460px"></div><div id="gr-detail" class="gr-detail"></div>';
    API.get("/api/graph/dry-bulk/chain/" + encodeURIComponent(chainId)).then(function (g) {
      var chart = echarts.init($("gr-canvas"));
      // P2-3：按层数自适应——层多间距收紧、层少在画布内紧凑不偏上空，避免下半空
      var layerCount = (g.layers || []).length || 5;
      var yGap = layerCount >= 6 ? 66 : (layerCount >= 4 ? 78 : 96);
      var xmap = {}; var ycount = {};
      var nodes = g.nodes.map(function (n) {
        var x = n.layer * 190;
        ycount[n.layer] = (ycount[n.layer] || 0) + 1;
        var y = (ycount[n.layer] - 1) * yGap;
        // P1-1：按 role 取五色（同源 legend），不再统一穿 #5b8def；缺角色回退蓝
        var c = ROLE_COLOR[n.role] || "#5b8def";
        return { id: n.id, name: n.label, x: x, y: y, symbolSize: 34, category: n.role,
          itemStyle: { color: c, borderColor: n.hasSource === false ? "#E24B4A" : "#333", borderWidth: n.hasSource === false ? 2 : 1 },
          label: { show: true, position: "bottom", color: "#ccc", fontSize: 11 }, _raw: n };
      });
      var links = g.edges.map(function (e) { return { source: e.source, target: e.target, lineStyle: { color: "#777" } }; });
      var opt = { backgroundColor: "transparent",
        legend: { textStyle: { color: "#ccc" }, top: 2, data: ["fact", "constraint", "conflict", "alternative", "recommendation"] },
        tooltip: { formatter: function (p) { return p.dataType === "node" ? esc(p.data.name) : ""; } },
        series: [{ type: "graph", layout: "none", roam: true, draggable: true,
          categories: [{ name: "fact" }, { name: "constraint" }, { name: "conflict" }, { name: "alternative" }, { name: "recommendation" }],
          data: nodes, links: links, lineStyle: { color: "#777", curveness: 0.1 },
          labelLayout: { hideOverlap: true } }] };
      chart.setOption(opt, true);
      // P1-3：缺段徽标——五段链(fact/constraint/conflict/alternative/recommendation)缺哪段显式暴露，图谱替北极星说话
      var ROLES = ["fact", "constraint", "conflict", "alternative", "recommendation"];
      var present = {}; (g.nodes || []).forEach(function (n) { present[n.role] = 1; });
      var missing = ROLES.filter(function (r) { return !present[r]; });
      var ROLE_CN = { fact: "事实", constraint: "约束", conflict: "冲突", alternative: "备选", recommendation: "建议" };
      var badge = missing.length ? '<span class="gr-badge gr-badge-warn">' + g.nodes.length + "/5 段 · 缺 " + missing.map(function (r) { return ROLE_CN[r] || r; }).join("/") + "</span>" : '<span class="gr-badge gr-badge-ok">五段完整</span>';
      $("gr-detail").innerHTML = '<div class="gr-summary">' + g.name + " · " + g.nodes.length + " 步 / " + g.edges.length + " 条流向 " + badge + "</div>";
      chart.off("click").on("click", function (p) { if (p.dataType === "node") $("gr-detail").innerHTML = chainCard(p.data._raw || {}); });
      window.addEventListener("resize", function () { chart.resize(); });
    }).catch(function (e) { $("gr-detail").innerHTML = '<div class="wb-empty">链图谱加载失败：' + esc(e.message) + "</div>"; });
  }
  function chainCard(n) {
    var rows = "";
    (n.items || []).forEach(function (it) { rows += '<div class="ar-row"><span class="ar-k">' + esc(it.label) + '</span><span class="ar-v">' + esc(it.value) + "</span></div>"; });
    (n.results || []).forEach(function (r) { rows += '<div class="ar-row"><span class="ar-k">' + esc(r.title || "结果") + '</span><span class="ar-v">' + esc(r.verdict || "") + (r.margin != null ? "（余量" + r.margin + "）" : "") + "</span></div>"; });
    if (n.formula) rows += '<div class="ar-row"><span class="ar-k">公式</span><span class="ar-v">' + esc(n.formula) + "</span></div>";
    return '<div class="ar-card"><div class="ar-card-h"><span class="ar-type">' + esc(n.role) + '</span><span class="ar-name">' + esc(n.label) + "</span></div>" +
      (rows ? '<div class="ar-rows">' + rows + "</div>" : "") +
      '<div class="ar-src">出处：' + esc(n.source ? n.source : (n.hasSource === false ? "✗ 缺出处" : "—")) + "</div></div>";
  }

  // 渲染入口：route {id, params} —— graph 关联图谱 / graph-chain:ID 链图谱
  // 关联图谱支持多域：route.params.domain = coal/grain/general-cargo/dry-bulk
  function render(route) {
    var main = $("wb-main");
    if (!main) return;
    var domain = (route && route.params && route.params.domain) || undefined;
    applyConfig(domain, function (centers) {
      if (route && route.type === "graph-chain") { renderChain(main, route.id); return; }
      var defCenter = (route && route.params && route.params.center) || (centers && centers.length ? centers[0] : "GOODS-煤炭");
      renderRelation(main, defCenter, domain, centers);
    });
  }

  // 读域配置 graph 节（铁律二：配置只配结构——颜色/形状/标签，无逻辑）；按域缓存，回调回传该域 defaultCenters
  var configApplied = {};
  function applyConfig(domain, cb) {
    var key = domain || "dry-bulk";
    var done = function (centers) { configApplied[key] = true; if (cb) cb(centers); };
    API.get("/api/domains/" + encodeURIComponent(key) + "/config").then(function (cfg) {
      var centers = (cfg && cfg.graph && cfg.graph.defaultCenters && cfg.graph.defaultCenters.length) ? cfg.graph.defaultCenters : null;
      if (centers) window.__GRAPH_CENTERS = centers;
      if (cfg && cfg.graph && cfg.graph.nodeTypes) {
        Object.keys(cfg.graph.nodeTypes).forEach(function (k) {
          var g = cfg.graph.nodeTypes[k];
          if (NODE_STYLE[k]) NODE_STYLE[k] = { color: g.color || NODE_STYLE[k].color, shape: g.shape && SHAPE_OK[g.shape] ? g.shape : NODE_STYLE[k].shape, label: g.label || NODE_STYLE[k].label };
        });
      }
      done(centers);
    }).catch(function () { done(null); });
  }

  window.__WB && window.__WB.register("graph", render);
})();