/* app.js — 页面主逻辑
 * 加载真实后端图谱，失败则回退 mock 离线演示。 */
(function () {
  var API = window.PKG_API;
  var G = window.PKG_GRAPH;
  var MOCK = window.PKG_MOCK;
  var isMock = false;
  var TYPE_LABEL = {
    dangerous_goods: "危险货物", enterprise: "企业", accident: "历史事故",
    emergency_measure: "应急处置", chemical_reaction: "化学反应", regulation: "法规标准"
  };
  var curType = "dangerous_goods";
  var currentEntity = "";   // P1-1 全局当前货种（六维透镜）
  var emgScenario = "";     // 应急页·当前选中的情景过滤关键词（chips 点击累计）
  var selectedNode = null;   // {id,name,type}
  var selectedTab = null;    // 当前高亮所在图表容器(用于取消)
  var graphTopology = null;  // 全景拓扑缓存
  // 下钻历史栈：每个视图一份，存 {containerId, panelId, stack:[{id,name,type}]}
  var drillStacks = {};

  var $ = function (id) { return document.getElementById(id); };

  function setApiStatus(ok, text) {
    var el = $("api-status");
    if (!el) return;
    el.classList.toggle("online", ok);
    el.classList.toggle("offline", !ok);
    var txt = el.querySelector(".api-status-text");
    if (txt) txt.textContent = text;
  }

  // ---------- 视图切换 ----------
  function bindNav() {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".nav-item").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        showView(btn.getAttribute("data-view"));
      });
    });
  }
  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    var v = $("view-" + name);
    if (v) v.classList.add("active");
    if (name === "graph") G.resize();
    if (name === "query") runQuery();
    if (name === "profile") runProfile();
    if (name === "emergency") buildEmergencyTree();
    if (name === "accident") { buildAccidentTimeline(); if ($("acc-goods").value) runAccidents(); }
    // P1-1 六维透镜：已设全局货种则切任一分析视图自动带当前对象渲染
    if (currentEntity) {
      if (name === "similar") { $("sim-goods").value = currentEntity; runSimilar(); }
      else if (name === "emergency") { $("emg-key").value = currentEntity; buildEmergencyTree(); if ($("emg-key").value) runEmergency(); }
      else if (name === "accident") { $("acc-goods").value = currentEntity; runAccidents(); }
      else if (name === "chem") { $("chem-goods").value = currentEntity; runChem(); }
      else if (name === "profile") { $("profile-goods").value = currentEntity; }
    }
  }
  function bindObjTabs() {
    document.querySelectorAll(".obj-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".obj-tab").forEach(function (b) { b.classList.remove("active"); });
        t.classList.add("active");
        curType = t.getAttribute("data-type");
        $("q-list-title").textContent = TYPE_LABEL[curType] || curType;
        runQuery("");
      });
    });
  }

  // ---------- 图谱全景 ----------
  // N6 图谱性能保护：loadGraph 支持 {minDegree, edgeTypes}，节点>500 默认折叠低度节点
  function loadGraph(topology, opts) {
    if (!topology) return;
    opts = opts || {};
    graphTopology = topology;
    G.render("graph-container", topology, function (nid, nname, ntype) {
      onEntityClick("graph-container", "graph-panel", nid, nname, ntype);
    });
    $("graph-count").textContent = topology.nodes.length + " 节点 · " + topology.links.length + " 关系"
      + (opts.folded ? "（核心视图，已折叠低度节点）" : "");
    $("data-source").textContent = "数据源：" + (isMock ? "离线演示(Mock)" : "seed 知识库");
    // 重新加载后继续应用图例反选集合（隐藏的类型在新图上仍生效）
    applyGraphTypeVisible();
  }
  // 向后端请求图谱（带 N6 过滤参数），节点>500 默认 minDegree=1 折叠孤立节点
  function fetchGraph(opts, cb) {
    opts = opts || {};
    var params = {};
    var rel = $("graph-relation-filter");
    if (rel && rel.value) params.edgeTypes = rel.value;
    API.fetchTopology(params).then(function (t) {
      // 节点超阈值且未显式给 minDegree：默认折叠孤立节点，保护性能
      if (t && t.nodes && t.nodes.length > 500 && !opts.forceFull) {
        params.minDegree = 1;
        API.fetchTopology(params).then(function (t2) {
          if (cb) cb(t2, { folded: t2 && t.nodes.length > 500 });
        });
      } else if (cb) { cb(t, {}); }
    });
  }
  // N6 图谱关系过滤：按关系类型重新向后端拉取（区别于实体类型前端过滤）
  function applyGraphRelationFilter() {
    fetchGraph({}, function (t, o) {
      if (t) loadGraph(t, o);
      // 实体类型改为图例反选隐藏，这里保留用户已反选的隐藏集合（不清空）
      // 注：旧版依赖实体类型下拉，下拉已移除，隐藏集合在 loadGraph 中统一应用
    });
  }
  // P1-3 图谱类型可视过滤：基于图例反选集合（graphHiddenTypes）过滤节点+连带边重新渲染
  var graphHiddenTypes = {};  // 被隐藏的实体类型集合，key = 类型 key（dangerous_goods/enterprise/...）
  function applyGraphTypeVisible() {
    if (!graphTopology) return;
    var nodes, links;
    var hideSet = {};
    Object.keys(graphHiddenTypes).forEach(function (k) { if (graphHiddenTypes[k]) hideSet[k] = 1; });
    var hasHidden = Object.keys(hideSet).length > 0;
    if (!hasHidden) {
      nodes = graphTopology.nodes;
      links = graphTopology.links;
    } else {
      var keepSet = {};
      nodes = graphTopology.nodes.filter(function (n) {
        var t = n.type || n.category;
        if (hideSet[t]) return false;
        keepSet[n.id] = 1;
        return true;
      });
      links = graphTopology.links.filter(function (l) { return keepSet[l.source] && keepSet[l.target]; });
    }
    G.render("graph-container", { nodes: nodes, links: links }, function (nid, nname, ntype) {
      onEntityClick("graph-container", "graph-panel", nid, nname, ntype);
    });
    $("graph-count").textContent = nodes.length + " 节点 · " + links.length + " 关系";
    syncGraphLegendState();
  }
  // 同步图例项视觉状态：被隐藏的类型加 .off（删除线/置灰/半透明），并显示已隐藏计数
  function syncGraphLegendState() {
    document.querySelectorAll(".side-legend .legend-item").forEach(function (el) {
      var type = el.getAttribute("data-type");
      var hidden = !!graphHiddenTypes[type];
      if (hidden) { el.classList.add("off"); }
      else { el.classList.remove("off"); }
      var cnt = el.querySelector(".legend-count");
      if (hidden) {
        if (!cnt) { cnt = document.createElement("span"); cnt.className = "legend-count"; el.appendChild(cnt); }
        cnt.textContent = "已隐藏 " + (countNodesOfType(graphTopology, type) || 0);
      } else if (cnt) { cnt.remove(); }
    });
  }
  function countNodesOfType(topology, type) {
    if (!topology || !topology.nodes) return 0;
    return topology.nodes.filter(function (n) { return (n.type || n.category) === type; }).length;
  }
  // 点击图例项：反选该类型（加入/移出隐藏集合），随后重渲染
  function bindGraphLegend() {
    document.querySelectorAll(".side-legend .legend-item").forEach(function (el) {
      var type = el.getAttribute("data-type");
      el.addEventListener("click", function () {
        if (graphHiddenTypes[type]) delete graphHiddenTypes[type];
        else graphHiddenTypes[type] = true;
        applyGraphTypeVisible();
      });
    });
  }
  // 在高亮容器中搜索选中节点，返回其直接邻居
  function directNeighbors(elId, nodeId) {
    if (!graphTopology) return [];
    var out = [];
    (graphTopology.links || []).forEach(function (l) {
      var nb = null;
      if (l.source === nodeId) nb = graphTopology.nodes.find(function (n) { return n.id === l.target; });
      else if (l.target === nodeId) nb = graphTopology.nodes.find(function (n) { return n.id === l.source; });
      if (nb && !out.some(function (x) { return x.id === nb.id; })) out.push({ id: nb.id, type: nb.type, name: nb.name, label: nb.label });
    });
    return out;
  }
  // 图谱高亮：选中节点+直接邻居；点同一节点取消，点其他切换。tab=图表容器id
  function highlightNodeInGraph(tab, nodeId) {
    if (selectedTab === tab && selectedNode && selectedNode.id === nodeId) {
      // 再次点击同一节点 -> 取消高亮
      G.highlight(tab, null);
      selectedNode = null; selectedTab = null;
      return true; // 表示已取消
    }
    var nbs = directNeighbors(tab, nodeId);
    G.highlight(tab, nodeId, nbs);
    selectedNode = { id: nodeId, name: nodeId, type: "" };
    selectedTab = tab;
    return false;
  }
  // 统一节点点击：高亮（或取消）+ 在指定面板展示关联分析
  // containerId=图表容器id, panelId=内嵌面板id, id/name/type=节点
  function onEntityClick(containerId, panelId, id, name, type) {
    var cancelled = highlightNodeInGraph(containerId, id);
    if (cancelled) {
      // 取消高亮时同时收起面板
      var p = $(panelId);
      if (p) { p.classList.add("hidden"); p.innerHTML = ""; }
      return;
    }
    openEntityPanel(containerId, panelId, id, name, type, true);
  }

  // 打开内嵌关联面板：展示实体信息 + 一二三级关联，支持下钻
  function openEntityPanel(containerId, panelId, id, name, type, pushStack) {
    var panel = $(panelId);
    if (!panel) return;
    // 下钻栈管理
    if (!drillStacks[panelId]) drillStacks[panelId] = [];
    var stack = drillStacks[panelId];
    if (pushStack !== false) {
      // 避免重复入栈同节点
      var top = stack[stack.length - 1];
      if (!top || top.id !== id) stack.push({ id: id, name: name, type: type });
    }
    panel.classList.remove("hidden");
    panel.innerHTML =
      '<div class="rp-head">' +
        '<span class="rp-title">' + esc(name || "") + '</span>' +
        '<span class="rp-type">' + (TYPE_LABEL[type] || type || "") + '</span>' +
        '<span class="rp-spacer"></span>' +
        '<button class="btn btn-ghost rp-back" id="' + panelId + '-back">← 返回上级</button>' +
        '<button class="btn btn-ghost rp-close" id="' + panelId + '-close">✕</button>' +
      '</div>' +
      '<div class="rp-body" id="' + panelId + '-body"><div class="empty">加载关联…</div></div>';
    var backBtn = $(panelId + '-back');
    if (backBtn) {
      backBtn.style.display = stack.length > 1 ? "" : "none";
      backBtn.addEventListener("click", function () {
        stack.pop();
        var prev = stack[stack.length - 1];
        if (prev) { openEntityPanel(containerId, panelId, prev.id, prev.name, prev.type, false); }
        else { panel.classList.add("hidden"); panel.innerHTML = ""; }
      });
    }
    var closeBtn = $(panelId + '-close');
    if (closeBtn) closeBtn.addEventListener("click", function () {
      panel.classList.add("hidden"); panel.innerHTML = ""; drillStacks[panelId] = [];
      G.highlight(containerId, null);
      selectedNode = null; selectedTab = null;
    });
    // 加载关联内容（邻居 + 一二三级）
    renderEntityPanelBody(panelId, containerId, id);
  }

  // 渲染面板主体：分层关联（一/二/三级），每项显示关系类型（P1-2 去重+关系可解释）
  function renderEntityPanelBody(panelId, containerId, id) {
    var body = $(panelId + '-body');
    if (!body) return;
    body.innerHTML = '<div class="empty">加载关联…</div>';
    // 只渲染分层关联（一/二/三级），不再重复渲染 fetchNeighbors 的直接关联（与深度1重复）
    API.fetchRelations(id, 3).then(function (rd) {
      var dh = '<div class="rp-sec-title">关联层级（关系类型可解释）</div>';
      if (rd && rd.depths) {
        for (var d = 1; d <= 3; d++) {
          var items = rd.depths['depth' + d] || [];
          dh += '<div class="depth-badge">' + (d === 1 ? '一' : d === 2 ? '二' : '三') + '级关联 · ' + items.length + ' 个</div>';
          if (items.length) {
            dh += '<div class="rp-grid">';
            items.forEach(function (it) {
              // 从 rels 提取关系标签（如 经营/禁配/涉及…）与方向
              var relInfo = (it.rels || []).map(function (r) {
                var dir = (String(r.source) === id) ? '→' : '←'; // 以当前节点为参照
                return (r.label || r.type) + ' ' + dir;
              }).join("、") || "关联";
              dh += '<div class="rp-item clickable" data-id="' + esc(it.id) + '" data-name="' + esc(it.name || it.label) + '" data-type="' + esc(it.type) + '">' +
                '<span class="nd-item-type" style="background:' + colorOf(it.type) + '"></span>' +
                '<div class="rp-item-main"><div class="rp-item-name">' + esc(it.name || it.label) + '</div>' +
                '<div class="rp-item-rel">' + esc(relInfo) + '</div>' +
                ((it.props && it.props.source) || it.source ? '<div class="rp-source" title="' + esc((it.props && it.props.source) || it.source) + '">📎 ' + esc(String((it.props && it.props.source) || it.source).slice(0, 30)) + (String((it.props && it.props.source) || it.source).length > 30 ? '…' : '') + '</div>' : '') +
                (it.confidence !== undefined && it.confidence < 1 ? '<span class="rp-conf" title="依据置信度（1=高可信原文，越低越需人工复核）">🛡 置信 ' + (Number(it.confidence).toFixed(2)) + '</span>' : '') +
                '</div></div>';
            });
            dh += '</div>';
          } else {
            dh += '<div class="empty" style="padding:6px">无' + (d === 1 ? '一' : d === 2 ? '二' : '三') + '级关联</div>';
          }
        }
      }
      body.innerHTML = dh;
      bindDrill(panelId, containerId);
    });
  }

  // 绑定面板中可点击项的点击 -> 下钻
  function bindDrill(panelId, containerId) {
    var body = $(panelId + '-body');
    if (!body) return;
    var items = body.querySelectorAll('.rp-item.clickable');
    items.forEach(function (it) {
      it.addEventListener("click", function () {
        var nid = it.getAttribute('data-id'), nname = it.getAttribute('data-name'), ntype = it.getAttribute('data-type');
        // 下钻：以该实体为中心重构图谱 + 列它的关联
        drillTo(containerId, panelId, nid, nname, ntype);
      });
    });
  }

  // 下钻：以新实体为中心重构图谱子图（2跳）+ 切换面板内容，并可高亮
  function drillTo(containerId, panelId, id, name, type) {
    // 更新该视图的中心实体子图
    var stack = drillStacks[panelId] || [];
    var top = stack[stack.length - 1];
    if (!top || top.id !== id) stack.push({ id: id, name: name, type: type });
    // 重绘该容器子图为中心实体
    drawSubGraph(containerId, id, name, type, 2, function () {
      // 子图重绘后高亮中心 + 列关联
      highlightNodeInGraph(containerId, id);
      openEntityPanel(containerId, panelId, id, name, type, false);
    });
  }

  // 绘制以某实体为中心的多跳子图到容器
  function drawSubGraph(containerId, centerId, centerName, centerType, depth, cb) {
    API.fetchRelations(centerId, depth || 2).then(function (d) {
      var box = $(containerId);
      if (!d || !d.depths) { if (cb) cb(); return; }
      var nodes = [{ id: centerId, name: centerName || centerId, type: centerType || '' }];
      var links = {};
      var linkKey = function (s, t) { return s + '->' + t; };
      Object.keys(d.depths).forEach(function (dk) {
        (d.depths[dk] || []).forEach(function (it) {
          if (!nodes.some(function (n) { return n.id === it.id; })) nodes.push({ id: it.id, name: it.name || it.label, type: it.type });
          (it.rels || []).forEach(function (r) {
            var k = linkKey(r.source, r.target);
            if (nodes.some(function (n) { return n.id === r.source; }) && nodes.some(function (n) { return n.id === r.target; })) {
              if (!links[k]) links[k] = { source: r.source, target: r.target, label: r.label || r.type };
            }
          });
        });
      });
      G.render(box, { nodes: nodes, links: Object.keys(links).map(function (k) { return links[k]; }) }, function (nid, nname, ntype) {
        onEntityClick(containerId, panelIdFor(containerId), nid, nname, ntype);
      });
      if (cb) cb();
    });
  }

  // 容器 -> 面板 id 映射
  function panelIdFor(containerId) {
    if (containerId === 'graph-container') return 'graph-panel';
    if (containerId === 'query-graph') return 'query-panel';
    return null;
  }

  function colorOf(type) {
    var m = { dangerous_goods: "#ff9f43", enterprise: "#2dd4a7", accident: "#ff5c5c", emergency_measure: "#4dc3ff", chemical_reaction: "#b28cff", regulation: "#67e3a1" };
    return m[type] || "#ccc";
  }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- 对象查询 ----------
  function runQuery(keyword) {
    var kw = (keyword !== undefined) ? keyword : $("q-keyword").value;
    var list = $("query-list");
    list.innerHTML = '<div class="empty">检索中…</div>';
    API.fetchEntities(curType, kw).then(function (data) {
      if (!data || !data.items) { list.innerHTML = '<div class="empty">离线：样例数据</div>'; return; }
      $("q-list-count").textContent = data.count + " 条";
      list.innerHTML = data.items.length ? "" : '<div class="empty">无结果</div>';
      data.items.forEach(function (it) {
        var row = document.createElement("div");
        row.className = "query-item";
        row.innerHTML = '<span class="qi-dot" style="background:' + colorOf(it.type) + '"></span>' +
          '<span class="qi-name">' + esc(it.name || it.label) + '</span><span class="qi-type">' + (TYPE_LABEL[it.type] || it.type) + '</span>' +
          '<span class="qi-drill" title="六维下钻">↗</span>';
        row.addEventListener("click", function () { selectQueryEntity(it.id, it.name || it.label, it.type); });
        var drillBtn = row.querySelector(".qi-drill");
        drillBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (window.PKG_DRILL) {
            var isTank = /tank|储罐|罐/.test(it.name || "");
            window.PKG_DRILL.openL2(it.name || it.label, it.type === "dangerous_goods" ? "goods" : (isTank ? "tank" : it.type), "", "");
          }
        });
        list.appendChild(row);
      });
      if (kw && data.items.length) selectQueryEntity(data.items[0].id, data.items[0].name || data.items[0].label, data.items[0].type);
    });
  }

  // 对象查询：渲染选中实体在图谱中的位置（多跳子图）+ 内嵌关联面板
  function selectQueryEntity(id, name, type) {
    // 渲染以该实体为中心的子图到 query-graph
    drawSubGraph("query-graph", id, name, type, 2, function () {
      // 子图渲染后高亮中心 + 打开下方关联面板
      highlightNodeInGraph("query-graph", id);
      openEntityPanel("query-graph", "query-panel", id, name, type, true);
    });
  }

  // ---------- 分析场景渲染 ----------
  function renderResults(elId, html) { $(elId).innerHTML = html; }
  function cardWrap(items, type) {
    if (!items || !items.length) return '<div class="empty">未查询到相关' + (type || "") + '，换个货种试试。</div>';
    return '<div class="result-grid">' + items.map(function (it) {
      var head = esc(it.name || it.label || "");
      var sub = esc(it.region || it.time || it.type || it.scenario || "");
      return '<div class="result-card"><div class="rc-title">' + head + '</div>' +
        (sub ? '<div class="rc-sub">' + sub + '</div>' : '') + '</div>';
    }).join("") + '</div>';
  }

  function runSimilar() {
    var gd = $("sim-goods").value;
    $("sim-result").innerHTML = '<div class="empty">分析中…</div>';
    API.analyzeSimilar(gd).then(function (d) {
      if (!d) { $("sim-result").innerHTML = cardWrap((MOCK.analyze.similar || {}).enterprises, "企业"); return; }
      var list = d.enterprises || [];
      $("sim-result").innerHTML = '<div class="result-head">货种「' + esc(gd) + '」同类型企业 <b>' + (d.count || list.length) + '</b> 家</div>' +
        list.map(function (e) {
          var html = '<div class="ent-card"><div class="rc-title">' + esc(e.name || e.label) + '</div>';
          if (typeof e.similarity === 'number') {
            var sp = Math.round(e.similarity * 100);
            html += '<div class="sim-score"><span>相似度</span><div class="sim-bar"><i style="width:' + sp + '%"></i></div><b>' + sp + '%</b></div>';
          }
          if (e.similarTo) html += '<div class="rc-sub">最相似：' + esc(e.similarTo) + '</div>';
          if (e.matchedGoods && e.matchedGoods.length) html += '<div class="rc-sub">共营货种：' + esc(e.matchedGoods.join("、")) + '</div>';
          if (e.region) html += '<div class="rc-sub">区域：' + esc(e.region) + '</div>';
          if (e.port) html += '<div class="rc-sub">港口：' + esc(e.port) + '</div>';
          if (e.enterpriseType) html += '<div class="rc-sub">类型：' + esc(e.enterpriseType) + '</div>';
          if (e.majorHazardLevel) html += '<div class="rc-sub danger">重大危险源：' + esc(e.majorHazardLevel) + '</div>';
          if (e.hazardousGoods && e.hazardousGoods.length) html += '<div class="rc-sub">经营货种：' + esc(e.hazardousGoods.map(function (g) { return g.name; }).join("、")) + '</div>';
          if (e.id) html += '<div class="acc-graph"><div class="acc-graph-title">企业关联图谱</div><div class="mini-graph" id="ent-mini-' + esc(e.id.replace(/[^\w-]/g,'')) + '"></div></div>';
          return html + '</div>';
        }).join("") || '<div class="empty">未找到同类型企业（离线）。</div>';
      list.forEach(function (e) { if (e.id) renderMiniGraph("ent-mini-" + e.id.replace(/[^\w-]/g,''), e.id); });
    });
  }
  // ---------- P1-4 应急处置：事故情景决策树 ----------
  // 决策树按事故情景逐级下钻，叶节点带情景关键词；点击后按「当前货种 + 情景」调 analyzeEmergency 过滤渲染
  var EMG_TREE = [
    { branch: "泄漏", leafs: [
      { name: "可燃气体/液化气泄漏", kw: ["液化", "泄漏"] },
      { name: "剧毒气体泄漏(氯气/液氨等)", kw: ["剧毒气体", "泄漏"] },
      { name: "易燃液体泄漏(苯系/油品)", kw: ["液体泄漏", "罐"] },
      { name: "遇湿易燃起火泄漏(金属钠等)", kw: ["遇湿易燃"] },
      { name: "腐蚀性化学品泄漏(强酸强碱)", kw: ["腐蚀性"] },
      { name: "氧化性物质泄漏", kw: ["氧化性", "泄漏"] }
    ]},
    { branch: "火灾", leafs: [
      { name: "气体喷射火/储罐火灾", kw: ["火灾", "喷射火"] },
      { name: "热分解火灾", kw: ["火灾", "热分解"] },
      { name: "氧化性物质火灾", kw: ["氧化性", "火灾"] }
    ]},
    { branch: "中毒", leafs: [
      { name: "剧毒气体中毒事故", kw: ["剧毒气体"] },
      { name: "毒性气体扩散与疏散", kw: ["剧毒气体", "疏散"] }
    ]},
    { branch: "热敏感", leafs: [
      { name: "热敏危货升温/暴晒", kw: ["热敏", "暴晒", "升温"] }
    ]},
    { branch: "检修作业", leafs: [
      { name: "储罐/罐区动火检修", kw: ["动火", "检修", "受限空间"] }
    ]}
  ];
  function buildEmergencyTree() {
    var box = $("emg-tree");
    if (!box) return;
    var html = '<div class="emg-tree-title">事故情景决策树</div>';
    html += EMG_TREE.map(function (b) {
      var items = b.leafs.map(function (l, i) {
        return '<button class="emg-leaf" data-kw="' + esc((l.kw||[]).join(" ")) + '">' + esc(l.name) + '</button>';
      }).join("");
      return '<div class="emg-branch">▸ ' + esc(b.branch) + '</div>' + items;
    }).join("");
    html += '<div class="emg-tree-note">💡 选择上方情景→按当前货种过滤匹配的处置措施。切换货种后请重选情景。</div>';
    box.innerHTML = html;
    // 叶节点点击
    box.querySelectorAll(".emg-leaf").forEach(function (btn) {
      btn.addEventListener("click", function () {
        box.querySelectorAll(".emg-leaf.active").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var kw = btn.getAttribute("data-kw");
        var goods = $("emg-key").value;
        $("emg-tree-info").innerHTML = '<b>' + esc(goods || "未选货种") + '</b> · ' + (btn.textContent || "") + ' → 匹配处置措施：';
        runEmergency(goods, kw);
      });
    });
  }
  // 渲染处置卡列表（右栏）
  function renderEmergencyCards(measures, headText, queryGoods) {
    if (!measures || !measures.length) {
      $("emg-result").innerHTML = (headText ? '<div class="result-head">' + headText + '</div>' : '') + '<div class="empty">未匹配到该情景下的处置措施，试试其他情景或切回全部。</div>';
      return;
    }
    var html = (headText ? '<div class="result-head">' + headText + '</div>' : '') + measures.map(function (m) {
      var h = '<div class="emg-card"><div class="rc-title">' + esc(m.name || m.label) + '</div>';
      // 当前检索货种命中标记：若本处置的适用货种含检索货种，标题加醒目徽章，消除“是不是查到我了”的疑虑
      if (queryGoods && (m.applies_goods || []).indexOf(String(queryGoods).trim()) !== -1) {
        h = h.replace('<div class="rc-title">', '<div class="rc-title"><span class="hit-badge">✓ 适用于“' + esc(queryGoods) + '”</span>');
      }
      var forbids = m.forbidden_actions || m.forbidden || m.forbidden_extinguisher;
      if (forbids && forbids.length) {
        h += '<div class="forbid-banner">🚫 <b>严禁：</b>' + (forbids.map ? forbids.map(function (f) { return esc(f); }).join("；") : esc(forbids)) + '</div>';
      }
      if (m.scenario) h += '<div class="rc-sub">适用场景：' + esc(m.scenario) + '</div>';
      if (m.steps) h += '<div class="emg-steps"><b>处置流程：</b>' + esc(m.steps) + '</div>';
      if (m.materials) h += '<div class="emg-meta"><b>应急物资：</b>' + esc(m.materials) + '</div>';
      if (m.protection) h += '<div class="emg-meta"><b>人员防护：</b>' + esc(m.protection) + '</div>';
      if (m.applies_goods) h += '<div class="emg-meta"><b>适用货种：</b>' + esc((m.applies_goods||[]).join("、")) + '</div>';
      if (m.source) h += '<div class="emg-meta"><b>依据：</b>' + esc(m.source) + '</div>';
      return h + '</div>';
    }).join("");
    $("emg-result").innerHTML = html;
  }
  function runEmergency(goods, scenarioKw) {
    var kw = (goods != null) ? goods : $("emg-key").value;
    $("emg-result").innerHTML = '<div class="empty">检索中…</div>';
    API.analyzeEmergency(kw).then(function (d) {
      if (!d) { $("emg-result").innerHTML = cardWrap((MOCK.analyze.emergency || {}).measures, "处置措施"); return; }
      var measures = d.measures || [];
      // 情景关键词过滤：命中 name 或 scenario 任一关键词
      var filtered = measures;
      if (scenarioKw) {
        var kws = String(scenarioKw).split(/\s+/).filter(Boolean);
        filtered = measures.filter(function (m) {
          var hay = (m.name || "") + " " + (m.scenario || "") + " " + ((m.applies_goods||[]).join(" "));
          return kws.every(function (k) { return hay.indexOf(k) !== -1; });
        });
      }
      var headText = '<div class="result-head">「' + esc(kw) + '」应急处置措施 <b>' + filtered.length + '</b> 项' +
        (scenarioKw ? '（情景：' + esc(scenarioKw.split(/\s+/).filter(Boolean).join("、")) + '）' : '') + '</div>';
      renderEmergencyCards(filtered, headText, kw);
    });
  }
  function runAccidents() {
    var gd = $("acc-goods").value;
    buildAccidentTimeline(); // P1-5 时间轴（每次进事故视图刷新）
    $("acc-result").innerHTML = '<div class="empty">查询中…</div>';
    API.analyzeAccidents(gd).then(function (d) {
      if (!d) { $("acc-result").innerHTML = cardWrap((MOCK.analyze.accidents || {}).accidents, "事故"); return; }
      var list = d.accidents || [];
      $("acc-result").innerHTML = '<div class="result-head">「' + esc(gd) + '」相关历史事故 <b>' + (d.count || list.length) + '</b> 起</div>' +
        list.map(function (a) {
          var html = '<div class="acc-card"><div class="rc-title">' + esc(a.name || a.label) + '</div>';
          if (a.time) html += '<div class="rc-sub">时间：' + esc(a.time) + (a.place ? '　地点：' + esc(a.place) : '') + '</div>';
          if (a.enterprises && a.enterprises.length) html += '<div class="rc-sub">涉事企业：' + esc(a.enterprises.join("、")) + '</div>';
          if (a.cause) html += '<div class="acc-conseq"><b>事故原因：</b>' + esc(a.cause) + '</div>';
          if (a.consequence) html += '<div class="acc-conseq"><b>后果：</b>' + esc(a.consequence) + '</div>';
          if (a.process) html += '<div class="acc-conseq">' + esc(a.process) + '</div>';
          if (a.link) html += '<div class="emg-meta">来源：' + esc(a.link) + '</div>';
          if (a.id) html += '<div class="acc-graph"><div class="acc-graph-title">事故关联图谱</div><div class="mini-graph" id="acc-mini-' + esc(a.id.replace(/[^\w-]/g,'')) + '"></div></div>';
          return html + '</div>';
        }).join("") || '<div class="empty">无相关事故（离线）。</div>';
      // 渲染每个事故的关联子图
      list.forEach(function (a) { if (a.id) renderMiniGraph("acc-mini-" + a.id.replace(/[^\w-]/g,''), a.id); });
    });
  }

  // 渲染一个实体的多跳关联子图（用于事故/企业关联）
  function renderMiniGraph(elId, nodeId, depth) {
    API.fetchRelations(nodeId, depth || 3).then(function (d) {
      var box = document.getElementById(elId);
      if (!box) return;
      if (!d || !d.depths) { box.innerHTML = '<div class="empty">无关联数据</div>'; return; }
      var nodes = [];
      var links = [];
      var start = d.start || {};
      nodes.push({ id: nodeId, name: (start.name || start.label) || nodeId, type: start.type || '' });
      Object.keys(d.depths).forEach(function (dk) {
        (d.depths[dk] || []).forEach(function (it) {
          if (!nodes.some(function (n) { return n.id === it.id; })) nodes.push({ id: it.id, name: it.name || it.label, type: it.type });
          // 与经由节点连边
          (it.rels || []).forEach(function (r) {
            links.push({ source: r.source, target: r.target, label: r.label || r.type });
          });
        });
      });
      if (nodes.length <= 1) { box.innerHTML = '<div class="empty">无关联数据</div>'; return; }
      G.render(box, { nodes: nodes, links: links }, function (nid, nname, ntype) {
        // 点实体：留在本页用六维下钻抽屉展示详情（不切视图、不跳全景页）
        if (window.PKG_DRILL) {
          var isTank = /tank|储罐|罐/.test(nname || "");
          window.PKG_DRILL.openL2(nname, ntype === "dangerous_goods" ? "goods" : (isTank ? "tank" : ntype), "", "");
        }
      });
    });
  }
  // P1-5 事故历史时间轴：按时间排序渲染全部事故
  function buildAccidentTimeline() {
    var box = $("acc-timeline");
    if (!box) return;
    API.fetchEntities("accident").then(function (d) {
      var items = (d && d.items) || [];
      if (!items.length) { box.style.display = "none"; return; }
      // 按时间排序（有time的在前，无time的排最后）
      var sorted = items.slice().sort(function (a, b) { return (a.time || "") > (b.time || "") ? 1 : -1; });
      var html = '<div class="tl-title">📅 历史事故时间轴（' + sorted.length + ' 起，按时间序）</div><div class="tl-track">';
      sorted.forEach(function (it) {
        var year = (it.time || "").slice(0, 4) || "—";
        html += '<div class="tl-item" title="' + esc(it.name) + (it.place ? '（' + it.place + '）' : '') + '">' +
          '<div class="tl-dot"></div><div class="tl-year">' + esc(year) + '</div>' +
          '<div class="tl-name">' + esc(it.name.slice(0, 16)) + (it.name.length > 16 ? '…' : '') + '</div>' +
          (it.place ? '<div class="tl-place">' + esc(it.place.slice(0, 14)) + '</div>' : '') +
          '</div>';
      });
      html += '</div>';
      box.innerHTML = html;
      box.style.display = "block";
    });
  }

  function runChem() {
    var gd = $("chem-goods").value;
    $("chem-result").innerHTML = '<div class="empty">查询中…（推理推演）</div>';
    API.analyzeIncompatibleExtended(gd).then(function (d) {
      if (!d || d.hint) {
        // 回退到旧接口
        API.analyzeIncompatible(gd).then(function (d2) {
          if (!d2) { var mc = MOCK.analyze.incompatible || {}; renderMockChem(mc.incompatible, mc.reactions); return; }
          renderMockChem(d2.incompatible, d2.reactions);
        });
        return;
      }
      renderChemExtended(gd, d);
    }).catch(function () {
      API.analyzeIncompatible(gd).then(function (d2) {
        if (!d2) { var mc = MOCK.analyze.incompatible || {}; renderMockChem(mc.incompatible, mc.reactions); return; }
        renderMockChem(d2.incompatible, d2.reactions);
      });
    });

    function renderChemExtended(gd, d) {
      var html = '<div class="result-head">「' + esc(gd) + '」禁配推演与化学反应 <b>' + (d.count || 0) + '</b> 条风险</div>';
      // 直接禁配
      html += '<div class="chem-split">';
      html += '<div class="chem-col"><div class="chem-col-title">⚠ 直接禁配 (' + (d.direct || []).length + ')</div>' +
        (d.direct && d.direct.length ? d.direct.map(function (i) {
          return '<div class="chem-item warn">' + esc(i.name) + (i.reason ? '<span class="chem-reason">' + esc(i.reason) + '</span>' : '') + '</div>';
        }).join("") : '<div class="empty">无直接禁配</div>') + '</div>';
      // 传递禁配
      html += '<div class="chem-col"><div class="chem-col-title">♻ 传递/间接禁配 (' + (d.transitive || []).length + ')<span class="reasoning-badge">系统推理</span></div>' +
        (d.transitive && d.transitive.length ? d.transitive.map(function (i) {
          return '<div class="chem-item transitive">' + esc(i.name) + (i.ruleId ? '<span class="chem-reason">规则 ' + esc(i.ruleId) + '</span>' : '') + '<span class="chem-reason">经「' + esc(i.via) + '」间接关联</span></div>';
        }).join("") : '<div class="empty">无间接关联</div>') + '</div>';
      html += '</div>';
      // 混存风险
      if (d.mixingRisk && d.mixingRisk.length) {
        html += '<div class="mix-risk"><div class="mix-risk-title">🚨 企业混存混运禁忌风险 (' + d.mixingRisk.length + ')<span class="reasoning-badge">系统推理 · 非原文记录</span></div>' +
          d.mixingRisk.map(function (m) {
            return '<div class="mix-risk-item">' + esc(m.enterpriseName) + '：同时经营 ' + esc(m.goods.join('、')) + '<span class="chem-reason">' + esc(m.reason) + '</span></div>';
          }).join("") + '</div>';
      }
      $("chem-result").innerHTML = html;
    }

    function renderMockChem(inc, react) {
      var html = '<div class="result-head">「' + esc(gd) + '」禁配物质与化学反应</div>';
      html += '<div class="chem-split">';
      html += '<div class="chem-col"><div class="chem-col-title">⚠ 禁配 / 混存混运风险</div>' +
        (inc && inc.length ? inc.map(function (i) { return '<div class="chem-item warn">' + esc(i.name || i.label) + '</div>'; }).join("")
          : '<div class="empty">无禁配记录</div>') + '</div>';
      html += '<div class="chem-col"><div class="chem-col-title">⚗ 相关化学反应</div>' +
        (react && react.length ? react.map(function (r) { return '<div class="chem-item info">' + esc(r.name || r.label) + '</div>'; }).join("")
          : '<div class="empty">无化学反应记录</div>') + '</div>';
      html += '</div>';
      $("chem-result").innerHTML = html;
    }
  }

  // ---------- 货种画像 · 危险特性（P0-1） ----------
  function runProfile() {
    var gd = ($("profile-goods").value || "").trim();
    if (!gd) { $("profile-result").innerHTML = '<div class="empty">请输入货种名</div>'; return; }
    $("profile-result").innerHTML = '<div class="empty">查询中…</div>';
    API.analyzeGoodsProfile(gd).then(function (d) {
      if (!d || (!d.stats && !d.assessment)) {
        $("profile-result").innerHTML = '<div class="empty warn">未找到货种「' + esc(gd) + '」的危险特性数据，请检查名称（支持 液化气/双氧水/LPG 等别名）。</div>';
        return;
      }
      renderProfile(gd, d);
    }).catch(function () {
      $("profile-result").innerHTML = '<div class="empty">查询失败，请检查后端服务</div>';
    });

    function renderProfile(gd, d) {
      var st = d.stats || {};
      var s = d.assessment || "";
      // 风险评分（用户确认口径：事故×3 + 禁配×2 + 反应×2 + 企业×0.5）
      var riskScore = (st.accidents || 0) * 3 + (st.incompatible || 0) * 2 + (st.reactions || 0) * 2 + (st.enterprises || 0) * 0.5;
      var lv = st.safetyLevel || "unknown";
      var lvLabel = { low: "低", medium: "中", high: "高", unknown: "未知" }[lv] || lv;
      var lvColor = { low: "#2dd4a7", medium: "#ff9f43", high: "#ff5c5c", unknown: "#aaa" }[lv] || "#aaa";

      var html = '<div class="result-head">「' + esc(gd) + '」危险特性画像' +
        ' <button class="btn-ghost drill-l3" data-goods="' + esc(gd) + '" style="font-size:11px;margin-left:8px">🔍 溯源证据 (L3)</button></div>';
      // 结果渲染后绑定 L3 溯源按钮
      var pid = $("profile-result");
      setTimeout(function () { var b = pid && pid.querySelector(".drill-l3"); if (b) b.addEventListener("click", function () { if (window.PKG_DRILL) window.PKG_DRILL.openL3(b.getAttribute("data-goods"), "goods", gd + " · 证据"); }); }, 30);
      // 危险特性卡 + 风险评分
      html += '<div class="chem-split">';
      // 左：统计卡
      html += '<div class="chem-col"><div class="chem-col-title">🔬 风险维度统计</div>' +
        '<div class="kv-grid">' +
        '<div class="kv"><span>经营企业</span><b>' + (st.enterprises || 0) + '</b></div>' +
        '<div class="kv"><span>历史事故</span><b>' + (st.accidents || 0) + '</b></div>' +
        '<div class="kv"><span>应急处置</span><b>' + (st.emergency || 0) + '</b></div>' +
        '<div class="kv"><span>化学反应</span><b>' + (st.reactions || 0) + '</b></div>' +
        '<div class="kv"><span>禁配关系</span><b>' + (st.incompatible || 0) + '</b></div>' +
        '<div class="kv"><span>危险等级</span><b style="color:' + lvColor + '">' + lvLabel + '</b></div>' +
        '</div></div>';
      // 右：风险评分仪表
      html += '<div class="chem-col"><div class="chem-col-title">📊 风险评分（口径：事故×3 + 禁配×2 + 反应×2 + 企业×0.5）</div>' +
        '<div class="risk-gauge"><span class="risk-num" style="color:' + lvColor + '">' + riskScore.toFixed(1) + '</span><span class="risk-ratio"> / 高</span></div>' +
        '<div class="risk-bar"><div class="risk-bar-fill" style="width:' + Math.min(100, riskScore * 8) + '%;background:' + lvColor + '"></div></div>' +
        '<p class="risk-formula muted">评分公式：事故数×3 + 禁配数×2 + 反应数×2 + 企业数×0.5</p>' +
        '</div>';
      html += '</div>';

      // 自然语言结论
      if (s) html += '<div class="profile-assess"><div class="chem-col-title">📝 综合评估（系统推理）</div><p class="profile-assess-text">' + esc(s) + '</p></div>';

      // 事故 / 应急 / 反应 明细
      html += '<div class="chem-split">';
      html += '<div class="chem-col"><div class="chem-col-title">📉 相关历史事故 (' + (d.accidents || []).length + ')</div>' +
        (d.accidents && d.accidents.length ? d.accidents.map(function (a) {
          return '<div class="chem-item info">' + esc(a.name) + (a.time ? '<span class="chem-reason">' + esc(a.time) + '</span>' : '') + '</div>';
        }).join("") : '<div class="empty">无相关事故</div>') + '</div>';
      html += '<div class="chem-col"><div class="chem-col-title">🚒 应急处置 (' + (d.emergency || []).length + ')</div>' +
        (d.emergency && d.emergency.length ? d.emergency.map(function (e) {
          return '<div class="chem-item warn">' + esc(e.name) + (e.scenario ? '<span class="chem-reason">' + esc(e.scenario) + '</span>' : '') + '</div>';
        }).join("") : '<div class="empty">无适用处置</div>') + '</div>';
      html += '</div>';

      // 化学反应
      if (d.reactions && d.reactions.length) {
        html += '<div class="chem-col-title">⚗ 相关化学反应 (' + d.reactions.length + ')</div>';
        html += d.reactions.map(function (r) {
          return '<div class="chem-item info">' + esc(r.name) + (r.hazard ? '<span class="chem-reason">' + esc(r.hazard) + '</span>' : '') + '</div>';
        }).join("");
      }

      $("profile-result").innerHTML = html;
    }
  }

  // ---------- 知识库·法规出处检索（P0-5） ----------
  function runKnowledge() {
    var kw = ($("kq-keyword").value || "").trim();
    $("kq-result").innerHTML = '<div class="empty">检索中…</div>';
    API.fetchKnowledge(kw).then(function (d) {
      if (!d) { $("kq-result").innerHTML = '<div class="empty warn">知识库检索失败，请检查后端服务</div>'; return; }
      if (!d.items || !d.items.length) { $("kq-result").innerHTML = '<div class="empty">无相关出处（' + esc(kw || "全部") + '）</div>'; return; }
      var html = '<div class="result-head">知识出处 <b>' + d.count + '</b> 条<span class="muted" style="margin-left:8px;font-size:12px">点击条目查看条文要点并定位命中词</span></div>';
      html += d.items.map(function (it, idx) {
        var prov = (it.provisions || []);
        var btn = prov.length ? ' <button class="btn btn-ghost kq-open" data-idx=' + idx + ' style="margin-left:8px;font-size:12px;padding:2px 10px">查看条文 ▸</button>' : '';
        return '<div class="chem-item info kq-item" style="cursor:pointer" data-idx=' + idx + '><b>' + esc(it.type) + '</b> ' + esc(it.name) + btn + '</div>';
      }).join("");
      $("kq-result").innerHTML = html;
      // 绑定点击 → 弹条文要点
      var ctx = { kqItems: d.items, kw: kw };
      Array.prototype.forEach.call($("kq-result").querySelectorAll(".kq-item"), function (el) {
        el.addEventListener("click", function () { openProvisionModal(ctx.kqItems[Number(el.getAttribute("data-idx"))], ctx.kw); });
      });
    }).catch(function () {
      $("kq-result").innerHTML = '<div class="empty">检索失败</div>';
    });
  }

  // 高亮函数：把 text 中的命中词（多个）用 <mark> 包裹
  function highlightKw(text, kw) {
    if (!text || !kw) return esc(text);
    var words = String(kw).split(/[\s,，、;；]+/).filter(Boolean);
    var out = esc(text);
    words.forEach(function (w) {
      if (!w) return;
      out = out.replace(new RegExp(esc(w), "gi"), function (m) { return "<mark class=\"kq-mark\">" + m + "</mark>"; });
    });
    return out;
  }

  // 弹出条文要点弹窗
  function openProvisionModal(it, kw) {
    var prov = (it.provisions || []);
    if (!prov.length) { alert("该条目暂无条文要点内容"); return; }
    var wrap = document.getElementById("kq-modal") || document.createElement("div");
    wrap.id = "kq-modal";
    wrap.className = "kq-modal-wrap";
    var body = '<div class="kq-modal"><div class="kq-m-head"><div class="kq-m-title">' + esc(it.type) + ' · ' + esc(it.name) + '</div>' +
      (it.number ? '<div class="kq-m-sub">' + esc(it.number) + '</div>' : '') + '</div>' +
      (it.summary ? '<div class="kq-m-sum">📌 概述：' + highlightKw(it.summary, kw) + '</div>' : '') +
      '<div class="kq-m-provs">' + prov.map(function (p) {
        return '<div class="kq-m-prov"><span class="kq-m-dot"></span>' + highlightKw(p, kw) + '</div>';
      }).join("") + '</div>' +
      (it.source ? '<div class="kq-m-src">来源：' + esc(it.source) + '</div>' : '') +
      '<button class="btn btn-ghost kq-m-close" style="margin-top:12px">关闭</button></div>';
    wrap.innerHTML = body;
    wrap.style.display = "flex";
    document.body.appendChild(wrap);
    wrap.querySelector(".kq-m-close").addEventListener("click", function () { wrap.style.display = "none"; });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) wrap.style.display = "none"; });
  }

  // ---------- 知识抽取与融合工作台（P0-2） ----------
  var extractState = null; // 保存抽取结果供复核
  function runExtract() {
    var text = ($("ext-text").value || "").trim();
    if (!text) { $("ext-result").innerHTML = '<div class="empty warn">请先输入案例文本</div>'; return; }
    $("ext-result").innerHTML = '<div class="empty">抽取中…（LLM 优先，失败回退规则）</div>';
    $("btn-ext-commit").style.display = "none";
    API.uploadCase(text).then(function (d) {
      if (!d) { $("ext-result").innerHTML = '<div class="empty warn">抽取失败，请检查后端服务</div>'; return; }
      var ex = d.extracted || d; // 结构兼容：extracted.matches / 顶层 matches
      var matches = (ex.matches || []).filter(function (m) { return m.matched; });
      var unmatched = (ex.matches || []).filter(function (m) { return !m.matched; });
      extractState = { matches: matches, unmatched: unmatched };
      var html = '<div class="result-head">抽取结果 <b>' + (ex.matches || []).length + '</b> 个实体（LLM' + (d.usedLLM ? ' ✓' : ' ✗→规则') + '）</div>';
      // 已匹配（绿）
      html += '<div class="chem-col-title">✅ 已匹配图谱实体 (' + matches.length + ')</div>';
      html += matches.length ? matches.map(function (m) {
        return '<div class="chem-item info">' + esc(m.name) + ' → <b>' + esc(m.standardName) + '</b></div>';
      }).join("") : '<div class="empty">无</div>';
      // 未匹配（黄）→ 人工映射
      html += '<div class="chem-col-title" style="margin-top:10px">⚠️ 未匹配实体 — 需人工映射或新建 (' + unmatched.length + ')</div>';
      html += unmatched.length ? unmatched.map(function (m, idx) {
        var tid = "ext-map-" + idx;
        return '<div class="chem-item transitive">' + esc(m.name) +
          '<div style="display:flex;gap:6px;margin-top:6px">' +
          '<input id="' + tid + '" type="text" placeholder="映射到已有货种，或留空新建" style="flex:1;padding:5px"/>' +
          '</div></div>';
      }).join("") : '<div class="empty">无未匹配</div>';
      html += '<div class="empty" style="padding:12px">确认无误后点击下方「③ 确认入库」；未匹配项如填映射名将归并到已有实体，留空则新建独立实体</div>';
      $("ext-result").innerHTML = html;
      $("btn-ext-commit").style.display = "inline-block";
    });
  }

  // 确认入库：构造 nodes/edges 提交。N3：新建实体前先做同名校验，命中强制弹窗选归并 or 仍新建
  function runCommit() {
    if (!extractState) return;
    var nodes = [], edges = [];
    var used = {};
    var matchedResolved = [];
    (extractState.matches || []).forEach(function (m) { if (m && m.name) matchedResolved.push(m.name); });
    // 待新建实体名（未匹配且未填映射）——N3 逐个同名校验
    var toCreate = [];
    (extractState.unmatched || []).forEach(function (m, idx) {
      var mapInput = $("ext-map-" + idx);
      var mappedTo = mapInput ? (mapInput.value || "").trim() : "";
      if (mappedTo) used[m.name] = mappedTo;        // 用户已填映射 → 归并不建
      else toCreate.push({ name: m.name, idx: idx }); // 留空 → 候选新建，需 N3 校验
    });
    if (!toCreate.length) { doCommit(nodes, edges, used, matchedResolved); return; }
    // N3 逐实体 check-name：命中 → confirm 归并 or 仍新建；未命中 → 直接新建
    $("ext-result").innerHTML = '<div class="empty">同名校验中…</div>';
    var chain = Promise.resolve();
    toCreate.forEach(function (c) {
      chain = chain.then(function () {
        return API.checkName(c.name).then(function (r) {
          var cand = (r && r.candidates) || [];
          if (!cand.length) { // 无相似 → 直接新建
            var nid = "kg_new_" + (c.idx + 1);
            nodes.push({ id: nid, type: "dangerous_goods", label: c.name, name: c.name, props: { source: "人工复核入库" } });
            used[c.name] = nid;
            return Promise.resolve();
          }
          var top = cand[0];
          // 强制确认：归并 or 仍新建（3.5.5 知识融合，防脏数据）
          var msg = "「" + c.name + "」与已有货种「" + top.name + "」" +
            (top.kind === "exact" ? "完全相同" : "高度相似") + "（相似度 " + Math.round(top.score * 100) + "%）。\n\n" +
            "点【确定】归并到已有货种「" + top.name + "」（推荐，避免脏数据）；\n点【取消】仍新建独立实体。";
          if (window.confirm(msg)) {
            used[c.name] = top.name; // 归并到已有
          } else {
            var nid = "kg_new_" + (c.idx + 1);
            nodes.push({ id: nid, type: "dangerous_goods", label: c.name, name: c.name, props: { source: "人工复核入库" } });
            used[c.name] = nid;      // 仍新建
          }
          return Promise.resolve();
        });
      });
    });
    chain.then(function () { afterNameCheck(nodes, edges, used, matchedResolved); });
  }
  // N3 校验完成后：建 N1 同案关联边 + 提交
  function afterNameCheck(nodes, edges, used, matchedResolved) {
    var newIds = Object.keys(used).filter(function (k) { return /^kg_new_/.test(used[k]); });
    var matchedRes = [];
    matchedResolved.forEach(function (r) { if (used[r]) matchedRes.push(used[r]); });
    newIds.forEach(function (nid) {
      matchedRes.forEach(function (r) {
        if (nid === r) return;
        var has = edges.some(function (e) { return (e.source === nid && e.target === r) || (e.source === r && e.target === nid); });
        if (!has) edges.push({ type: "related_to", source: nid, target: r, label: "同案关联", props: { source: "人工复核入库" }, confidence: 0.6, ruleId: "manual-related" });
      });
    });
    doCommit(nodes, edges, used, []);
  }
  function doCommit(nodes, edges) {
    $("ext-result").innerHTML = '<div class="empty">入库中…</div>';
    API.kgCommit(nodes, edges).then(function (r) {
      if (!r) { $("ext-result").innerHTML = '<div class="empty warn">入库失败</div>'; return; }
      $("btn-ext-commit").style.display = "none";
      $("ext-result").innerHTML = '<div class="result-head">✅ 入库完成</div>' +
        '<div class="chem-item info">新增节点 <b>' + r.addedNodes + '</b> 个，新增边 <b>' + r.addedEdges + '</b> 条（图现共 ' + r.totalNodes + ' 节点 / ' + r.totalEdges + ' 边）</div>' +
        '<div class="empty">可切换到「图谱全景」查看新实体</div>';
      extractState = null;
    });
  }

  // ---------- 初始化 ----------
  // P1-1 动态加载全部货种到各分析视图的下拉（同类型企业/事故/化学）
  function loadGoodsOptions() {
    API.fetchEntities("dangerous_goods").then(function (d) {
      var items = (d && d.items) || [];
      if (!items.length) return; // 失败保持原有
      ["sim-goods", "acc-goods", "chem-goods", "emg-key"].forEach(function (sid) {
        var sel = $(sid);
        if (!sel) return;
        var v = sel.value;
        sel.innerHTML = items.map(function (n) {
          return '<option value="' + esc(n.name) + '">' + esc(n.name) + '</option>';
        }).join("");
        sel.value = items.some(function (n) { return n.name === v; }) ? v : (items[0].name || "");
      });
    });
  }

  // ---------- 初始化 ----------
  function init() {
    bindNav();
    bindObjTabs();
    loadGoodsOptions(); // P1-1 动态加载全部货种到各分析视图下拉
    $("btn-layout").addEventListener("click", function () { G.resize(); });
    $("graph-relation-filter").addEventListener("change", applyGraphRelationFilter);
    bindGraphLegend(); // 图例项点击 隐藏/恢复 对应实体类型
    $("q-search").addEventListener("click", function () { runQuery(); });
    $("q-keyword").addEventListener("keydown", function (e) { if (e.key === "Enter") runQuery(); });
    $("btn-sim").addEventListener("click", runSimilar);
    $("btn-emg").addEventListener("click", function () { buildEmergencyTree(); runEmergency($("emg-key").value, emgScenario); });
    // 事故类型下拉（emg-accident）：从情景 chips 提取类型，选中即作为情景过滤（等价点击对应 chip）
    (function initEmgAccident() {
      var sel = $("emg-accident");
      if (!sel) return;
      var types = [];
      document.querySelectorAll(".emg-suggest[data-kw]").forEach(function (c) {
        var k = c.getAttribute("data-kw");
        if (k && types.indexOf(k) < 0) types.push(k);
      });
      types.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t; o.textContent = t;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        var t = sel.value;
        emgScenario = t;           // 单选事故类型作为情景过滤
        document.querySelectorAll(".emg-suggest").forEach(function (c) { c.classList.toggle("used", c.getAttribute("data-kw") === t); });
        buildEmergencyTree();
        runEmergency($("emg-key").value, emgScenario);
      });
    })();
    // 货种下拉切换 → 自动重检
    $("emg-key").addEventListener("change", function () { buildEmergencyTree(); runEmergency($("emg-key").value, emgScenario); });
    // 常用检索关键词 chips：作为情景过滤选择（点击切换选中，不影响输入框货种）
    Array.prototype.forEach.call(document.querySelectorAll(".emg-suggest"), function (chip) {
      chip.addEventListener("click", function () {
        var kw = chip.getAttribute("data-kw");
        // 点击已选中的 chip → 取消该情景过滤
        var wasUsed = chip.classList.contains("used");
        chip.classList.toggle("used");
        var words = emgScenario.split(/\s+/).filter(Boolean);
        if (wasUsed) { words = words.filter(function (w) { return w !== kw; }); }
        else if (words.indexOf(kw) < 0) { words.push(kw); }
        emgScenario = words.join(" ");
        buildEmergencyTree();
        runEmergency($("emg-key").value, emgScenario);
      });
    });
    $("btn-acc").addEventListener("click", runAccidents);
    $("btn-chem").addEventListener("click", runChem);
    $("btn-profile").addEventListener("click", runProfile);
    $("profile-goods").addEventListener("keydown", function (e) { if (e.key === "Enter") runProfile(); });
    $("btn-kq").addEventListener("click", runKnowledge);
    $("kq-keyword").addEventListener("keydown", function (e) { if (e.key === "Enter") runKnowledge(); });
    $("btn-ext-extract").addEventListener("click", runExtract);
    $("btn-ext-commit").addEventListener("click", runCommit);
    window.addEventListener("resize", function () { G.resize(); });

    // 连接后端
    API.getBackendStatus().then(function (st) {
      if (st) {
        isMock = false;
        setApiStatus(true, "已连接后端 · " + st.nodeCount + " 节点");
        window.PKG_IS_MOCK = false;
        API.fetchTopology().then(loadGraph);
      } else {
        isMock = true;
        setApiStatus(false, "离线演示模式");
        loadGraph(MOCK.topology);
      }
      applyUrlParams(); // home.html 跳转：?view=&goods= 支持（放拓扑之后，确保视图/货种可用）
    });
  }

  // 第三批：从首页跳转打开下钻抽屉（?domain=域key&entity=实体名）
  function openDrilldownFromHome(dom, ent, goods) {
    if (!window.PKG_DRILL) return false;
    if (ent) {
      // 直接打开实体 L2（goods 为货种名时为危货画像）
      var isTank = /tank|储罐|罐/.test(ent);
      window.PKG_DRILL.openL2(ent, isTank ? "tank" : "goods", dom || "", "");
      return true;
    }
    if (!dom) return false;
    // 打开 L1 分类清单：按域拉实体清单
    var typeMap = {
      hazard: "dangerous_goods", incompatible: "dangerous_goods", reaction: "chemical_reaction",
      emergency: "emergency_measure", accident: "accident", enterprise: "enterprise"
    };
    var titleMap = {
      hazard: "危险特性 · 危货清单", incompatible: "禁配关系 · 高危货种", reaction: "化学反应 · 清单",
      emergency: "应急处置 · 措施清单", accident: "历史事故 · 清单", enterprise: "同类型企业 · 清单"
    };
    var type = typeMap[dom] || "dangerous_goods";
    var title = titleMap[dom] || "分类清单";
    API.fetchEntities(type).then(function (list) {
      var items = (list && list.items) || [];
      items = items.map(function (n) {
        var nm = (n && (n.name || n.label)) || "";
        return { name: nm, kind: type === "dangerous_goods" ? "goods" : (type === "enterprise" ? "enterprise" : type), meta: n && n.type || type, riskScore: n && n.riskScore };
      }).filter(function (x) { return x.name; });
      window.PKG_DRILL.openL1(dom, title, items, type === "dangerous_goods" ? "goods" : "");
    });
    return true;
  }

  // 读取 URL 参数：?view=视图&goods=货种&domain=域&entity=实体  （home.html 星系/入口/TOP5 跳转链路 + 下钻抽屉）
  function applyUrlParams() {
    var qs = (window.location.search || "").replace(/^\?/, "");
    if (!qs) return;
    var params = {};
    qs.split("&").forEach(function (kv) {
      var p = kv.split("="); if (p[0]) params[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join("=") || "");
    });
    var view = params.view || params.focus;
    var goods = params.goods || "";
    if (goods) {
      currentEntity = goods;
    }
    // 第三批：下钻抽屉直达（?domain=xxx&entity=yyy）——来自首页点选实体
    var dom = params.domain, ent = params.entity;
    if (dom) {
      // 打开对应域分类清单（L1）或直接定位到实体（L2）
      var opened = openDrilldownFromHome(dom, ent, goods);
      if (opened) return;
    }
    if (view) {
      if (view === "profile" || view === "hazard" || view === "危货透镜") view = "profile";
      if (view === "类似" || view === "同行" || view === "企业画像") view = "similar";
      if (view === "emergency" || view === "应急" || view === "应急情景") view = "emergency";
      var nav = document.querySelector('.nav-item[data-view="' + view + '"]');
      if (nav) { document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); }); nav.classList.add("active"); }
      showView(view);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();