// ==================== Tab 切换功能 ====================
function switchTab(tabId) {
  const tabs = ['graph', 'chain', 'cluster', 'entities', 'upload', 'reports', 'aiAsk'];
  const legendPanel = document.querySelector ? document.querySelector('.legend-panel') : null;
  if (legendPanel) legendPanel.style.display = tabId === 'graph' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach((tab, i) => {
    tab.classList.toggle('active', tabs[i] === tabId);
  });
  
  tabs.forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === tabId);
  });
  
  setTimeout(() => {
    if (tabId === 'graph') initGraph();
    if (tabId === 'chain') initChainView();
    if (tabId === 'cluster') initClusters();
    if (tabId === 'entities') {
      const input = document.getElementById('entitySearchInput');
      if (input && input.value !== entityFilterText) input.value = entityFilterText;
      initEntityCategories();
    }
    if (tabId === 'reports') initReports();
    if (tabId === 'aiAsk' && typeof renderAiAskTab === 'function') renderAiAskTab();
  }, 100);
}

// ==================== 关联分析工具函数 ====================
function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNodeById(id) {
  return graphData.nodes.find(n => n.id === id);
}

function getTypeInfo(type) {
  return entityColors[type] || { name: type || '未知类型', color: '#94a3b8' };
}

function getIncidentContext(edge, fromNode, toNode) {
  if (edge && edge.virtual && edge.evidence) return edge.evidence;
  const accident = [fromNode, toNode].find(n => n && n.type === 'accident');
  const title = edge && edge.sourceTitle ? '来源报告「' + edge.sourceTitle + '」' : '';
  const excerpt = edge && edge.sourceExcerpt ? ' 原文片段：' + edge.sourceExcerpt : '';
  const base = edge && edge.evidence ? edge.evidence : (accident ? '二者在事故「' + accident.name + '」中被同一报告同时抽取，因此建立直接关联。' : '二者在同一事故报告或同一责任链条中共同出现，属于可追溯的实体关系。');
  return (title ? title + '；' : '') + base + excerpt;
}

function explainRelation(fromNode, toNode, edge) {
  const label = edge.label;
  const strength = relationStrength[label] || { name: edge && edge.relationLevel === 'weakerDashed' ? '更弱关联' : (edge && edge.relationLevel === 'weakExpand' ? '弱关联拓展' : '弱关联') };
  const fromType = getTypeInfo(fromNode.type).name;
  const toType = getTypeInfo(toNode.type).name;
  const context = getIncidentContext(edge, fromNode, toNode);
  const templates = {
    '同类违法事故': '点击违法行为节点后，系统横向拓展同一违法类型下的其它事故，帮助发现重复违法模式。',
    '其它违法事故': '点击违法行为节点后，系统用更弱虚线列举其它违法类型事故，帮助进行横向比较。',
    '人车关系': '解析器从原文句子中抽取到人员与车辆之间的驾驶/乘坐关系，边上保留证据句、规则编号和置信度。',
    '违法责任链': '解析器将具体违法/过错行为绑定到对应人员，用于构建“人 → 行为 → 事故”的责任链。',
    '伤亡后果链': '解析器将伤亡描述绑定到相关人员，用于构建“事故 → 后果 → 人员”的后果链。',
    '车辆碰撞链': '解析器从同句车辆共现和碰撞语义中抽取车辆之间的碰撞关系。',
    '过错分类证据': '解析器将具体行为或诱因上卷到过错大类，形成可追溯分类证据。',
    '报告过错证据': '解析器判断该报告包含此过错大类，作为报告级聚类和统计依据。',
    '驾驶': '报告中明确描述「' + fromNode.name + '」驾驶「' + toNode.name + '」，属于人车直接行为关系。',
    '涉及': '报告将「' + fromNode.name + '」列为事故「' + toNode.name + '」的涉事车辆/实体，因此与事故形成中强关联。',
    '发生在': '事故报告中地点字段或正文指出事故发生于「' + fromNode.name + '」，道路与事故属于场景位置关系。',
    '事故原因': '报告将「' + fromNode.name + '」识别为事故「' + toNode.name + '」的直接或主要原因，因此为强关联。',
    '违法人': '报告中违法/过错行为「' + fromNode.name + '」归因到当事人「' + toNode.name + '」，形成违法行为责任链。',
    '归属大类': '解析器将具体行为/诱因「' + fromNode.name + '」归入过错大类「' + toNode.name + '」，用于从平铺违法行为上卷到二级分类。',
    '过错大类': '报告包含过错大类「' + fromNode.name + '」，可用于按驾驶人违规、道路环境隐患、外部诱因等维度聚类。',
    '具体过错': '具体违法/过错行为「' + fromNode.name + '」归入过错大类「' + toNode.name + '」，便于从大类继续下钻到行为证据。',
    '诱因': '报告中识别到天气或道路条件诱因「' + fromNode.name + '」，作为事故风险因素与过错大类形成关联。',
    '事故诱因': '事故报告识别出诱因「' + fromNode.name + '」，系统以弱关联直连事故，用于在图谱中突出环境/外部风险因素。',
    '责任认定': '报告包含事故责任认定结论「' + fromNode.name + '」，并指向对应事故。',
    '承担': '责任认定或处罚描述显示「' + toNode.name + '」承担「' + fromNode.name + '」，属于责任归属强关联。',
    '天气': '报告记录事故发生时天气为「' + fromNode.name + '」，天气作为环境因素与事故形成弱关联。',
    '造成': '事故报告记录事故造成「' + fromNode.name + '」，属于事故后果强关联。'
  };
  return {
    label,
    strengthName: strength.name,
    reason: templates[label] || ('报告中识别到 ' + fromType + '「' + fromNode.name + '」与 ' + toType + '「' + toNode.name + '」存在「' + label + '」关系。'),
    evidence: context
  };
}

function getNodeFromCurrentGraph(id) {
  const viewData = getGraphViewData();
  return viewData.nodes.find(n => n.id === id) || getNodeById(id);
}

function getDirectRelations(nodeId, sourceLinks) {
  const relations = [];
  const links = sourceLinks || getGraphViewData().links;
  links.forEach(edge => {
    if (edge.source === nodeId || edge.target === nodeId) {
      const otherId = edge.source === nodeId ? edge.target : edge.source;
      const sourceNode = getNodeFromCurrentGraph(edge.source);
      const targetNode = getNodeFromCurrentGraph(edge.target);
      const otherNode = getNodeFromCurrentGraph(otherId);
      if (sourceNode && targetNode && otherNode) {
        relations.push({ edge, sourceNode, targetNode, otherNode });
      }
    }
  });
  return relations;
}

function renderSelectedNodeRelations(nodeId) {
  const panel = document.getElementById('nodeRelationPanel');
  if (!panel) return;
  const node = getNodeById(nodeId);
  if (!node) return;
  const typeInfo = getTypeInfo(node.type);
  const relations = getDirectRelations(nodeId);

  // v3.5.0 收尾：顶部"节点信息卡" + "AI 关联分析按钮"（与实体分析 Tab 共享同一白名单与后端 API）
  let html = '';
  // 卡片：节点名/类型/关联数/归属事故(如果是 accident 节点)
  html += '<div style="padding:12px;background:linear-gradient(135deg,' + typeInfo.color + '10,' + typeInfo.color + '05);border:1px solid ' + typeInfo.color + '40;border-radius:10px;margin-bottom:12px;">';
  html += '<div class="analysis-title" style="margin:0 0 6px;">🎯 已选节点：<span style="color:' + typeInfo.color + '">' + escapeHtml(node.name) + '</span> <span style="font-size:12px;color:#64748b;font-weight:500;">' + escapeHtml(typeInfo.name) + '</span></div>';
  html += '<div style="font-size:12px;color:#475569;line-height:1.6;">一层直接关系：<b style="color:' + typeInfo.color + '">' + relations.length + '</b> 条';
  if (node.type === 'accident' && node.reportId) {
    html += ' ・ 归属报告：<b>' + escapeHtml(node.name) + '</b>';
  }
  if (node.roadCategory) html += ' ・ 道路大类：<b>' + escapeHtml(node.roadCategory) + '</b>';
  if (node.weatherCategory) html += ' ・ 天气大类：<b>' + escapeHtml(node.weatherCategory) + '</b>';
  if (node.timeCategory) html += ' ・ 时间段：<b>' + escapeHtml(node.timeCategory) + '</b>';
  if (node.injuryCategory) html += ' ・ 伤亡类：<b>' + escapeHtml(node.injuryCategory) + '</b>';
  if (node.liabilityCategory) html += ' ・ 责任大类：<b>' + escapeHtml(node.liabilityCategory) + '</b>';
  html += '</div>';
  // AI 关联按钮（同实体白名单）
  if (typeof getRelateIndexType === 'function' && getRelateIndexType(node.type)) {
    const btnId = 'aiRelateBtn_graph_' + safeId(nodeId);
    const boxId = 'aiRelateBox_graph_' + safeId(nodeId);
    html += '<div style="margin-top:10px;"><button id="' + btnId + '" onclick="runAiRelateAnalysis(\'' + escapeHtml(node.type) + '\',\'' + escapeHtml(node.name).replace(/'/g, '\\&#39;') + '\',\'' + boxId + '\')" style="padding:8px 16px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;box-shadow:0 2px 6px rgba(124,58,237,0.25);">🧠 用 AI 分析全库同类事故</button><span style="margin-left:10px;font-size:12px;color:#94a3b8;">结果仅展示，不写入图谱</span></div>';
    html += '<div id="' + boxId + '" style="margin-top:10px;"></div>';
  } else {
    html += '<div style="margin-top:8px;font-size:11px;color:#94a3b8;">当前节点类型暂不支持跨报告 AI 关联分析。</div>';
  }
  html += '</div>';

  html += '<div style="color:#64748b;font-size:13px;margin-bottom:12px;">共发现 <strong>' + relations.length + '</strong> 条一层直接关系。点击图谱其它节点可切换分析对象。</div>';
  if (!relations.length) {
    html += '<div style="color:#94a3b8;font-size:14px;">暂无直接连接关系。</div>';
    panel.innerHTML = html;
    return;
  }
  relations.forEach(item => {
    const fromNode = item.sourceNode;
    const toNode = item.targetNode;
    const other = item.otherNode;
    const otherType = getTypeInfo(other.type);
    const analysis = explainRelation(fromNode, toNode, item.edge);
    const strength = relationStrength[item.edge.label] || { color: '#94a3b8', width: 1, name: '弱关联' };
    html += '<div class="relation-card">';
    html += '<div class="relation-path"><span style="color:' + getTypeInfo(fromNode.type).color + '">' + escapeHtml(fromNode.name) + '</span> <span style="color:' + strength.color + '">—' + escapeHtml(item.edge.label) + ' / ' + escapeHtml(analysis.strengthName) + '→</span> <span style="color:' + getTypeInfo(toNode.type).color + '">' + escapeHtml(toNode.name) + '</span></div>';
    html += '<div style="font-size:12px;color:#64748b;margin-bottom:6px;">关联对象：<span style="color:' + otherType.color + ';font-weight:700;">' + escapeHtml(other.name) + '</span>（' + escapeHtml(otherType.name) + '）</div>';
    html += '<div class="relation-reason"><strong>分析过程：</strong>' + escapeHtml(analysis.reason) + '<br><strong>来源报告：</strong>' + escapeHtml(item.edge.sourceTitle || item.edge.reportId || '内置关系') + (item.edge.confidence ? '<br><strong>置信度：</strong>' + Math.round(item.edge.confidence * 100) + '%' + (item.edge.confidence < 0.6 ? ' <span style="background:#fef3c7;color:#b45309;padding:1px 6px;border-radius:6px;font-size:12px;">弱推断</span>' : '') + ' ｜ 规则：' + escapeHtml(item.edge.ruleId || '未标注') : '') + '<br><strong>关联依据：</strong>' + escapeHtml(analysis.evidence) + '</div>';
    html += '</div>';
  });
  panel.innerHTML = html;
}

function getAssociationsByDepth(startId, maxDepth, scope) {
  const sourceLinks = scope === 'global' ? graphData.links : getGraphViewData().links;
  const visited = new Set([startId]);
  let frontier = new Set([startId]);
  const result = {};
  for (let depth = 1; depth <= maxDepth; depth++) {
    const next = new Set();
    const items = [];
    frontier.forEach(id => {
      getDirectRelations(id, sourceLinks).forEach(rel => {
        const otherId = rel.otherNode.id;
        if (!visited.has(otherId)) {
          visited.add(otherId);
          next.add(otherId);
          items.push({ ...rel, via: id, depth });
        }
      });
    });
    result[depth] = items;
    frontier = next;
  }
  return result;
}

function flattenAssociationDepths(depths) {
  return Object.values(depths || {}).flat();
}

function summarizeAssociationsByType(depths) {
  const grouped = {};
  flattenAssociationDepths(depths).forEach(item => {
    const type = item.otherNode && item.otherNode.type || 'unknown';
    if (!grouped[type]) grouped[type] = { type, count: 0, uniqueIds: new Set(), items: [], labels: new Set(), sampleNames: [] };
    const g = grouped[type];
    if (!g.uniqueIds.has(item.otherNode.id)) {
      g.uniqueIds.add(item.otherNode.id);
      g.count++;
      if (g.sampleNames.length < 5) g.sampleNames.push(item.otherNode.name);
    }
    g.items.push(item);
    if (item.edge && item.edge.label) g.labels.add(item.edge.label);
  });
  return Object.values(grouped).sort((a, b) => b.count - a.count || getTypeInfo(a.type).name.localeCompare(getTypeInfo(b.type).name, 'zh-Hans-CN'));
}

function renderEntityAssociationDetails(groupedItems, filterType) {
  let html = '';
  const items = filterType && filterType !== 'all' ? groupedItems.filter(item => item.otherNode.type === filterType) : groupedItems;
  const byDepth = {};
  items.forEach(item => {
    if (!byDepth[item.depth]) byDepth[item.depth] = [];
    byDepth[item.depth].push(item);
  });
  [1,2,3].forEach(depth => {
    const rows = byDepth[depth] || [];
    html += '<div class="depth-section"><div class="depth-badge">' + depth + ' 层关联 · ' + rows.length + ' 个</div>';
    if (!rows.length) {
      html += '<div style="color:#94a3b8;font-size:13px;">该类型在本层暂无关联实体。</div>';
    } else {
      rows.forEach(item => {
        const other = item.otherNode;
        const otherInfo = getTypeInfo(other.type);
        const analysis = explainRelation(item.sourceNode, item.targetNode, item.edge);
        const strength = relationStrength[item.edge.label] || { color: '#94a3b8', name: '弱关联' };
        html += '<div class="relation-card">';
        html += '<div class="relation-path"><span style="color:' + otherInfo.color + '">' + escapeHtml(other.name) + '</span> <span style="font-size:12px;color:#64748b;">' + escapeHtml(otherInfo.name) + '</span> <span style="color:' + strength.color + ';font-size:12px;">' + escapeHtml(item.edge.label) + ' / ' + escapeHtml(analysis.strengthName) + '</span></div>';
        html += '<div class="relation-reason"><strong>为什么有关联：</strong>' + escapeHtml(analysis.reason) + '<br><strong>来源报告：</strong>' + escapeHtml(item.edge.sourceTitle || item.edge.reportId || '内置关系') + (item.edge.confidence ? '<br><strong>置信度：</strong>' + Math.round(item.edge.confidence * 100) + '%' + (item.edge.confidence < 0.6 ? ' <span style="background:#fef3c7;color:#b45309;padding:1px 6px;border-radius:6px;font-size:12px;">弱推断</span>' : '') + ' ｜ 规则：' + escapeHtml(item.edge.ruleId || '未标注') : '') + '<br><strong>证据链：</strong>' + escapeHtml(analysis.evidence) + '</div>';
        html += '</div>';
      });
    }
    html += '</div>';
  });
  return html;
}

function setEntityAssociationExpandedType(type, nodeId) {
  entityAssociationExpandedType = type || 'all';
  showEntityAssociations(nodeId);
}

function setEntityFilter(value) {
  entityFilterText = value || '';
  initEntityCategories();
}

function toggleEntityCategory(type) {
  if (!entityCategoryUiState[type]) entityCategoryUiState[type] = { collapsed: false, limit: 15 };
  entityCategoryUiState[type].collapsed = !entityCategoryUiState[type].collapsed;
  initEntityCategories();
}

function loadMoreEntityCategory(type) {
  if (!entityCategoryUiState[type]) entityCategoryUiState[type] = { collapsed: false, limit: 15 };
  entityCategoryUiState[type].collapsed = false;
  entityCategoryUiState[type].limit = (entityCategoryUiState[type].limit || 15) + 15;
  initEntityCategories();
}

function resetEntityCategoryLimit(type) {
  if (!entityCategoryUiState[type]) entityCategoryUiState[type] = { collapsed: false, limit: 15 };
  entityCategoryUiState[type].limit = 15;
  initEntityCategories();
}

function initEntityCategories() {
  const categoryContainer = document.getElementById('entityCategoryList');
  if (!categoryContainer) return;
  const search = normalizeName(entityFilterText).toLowerCase();
  const grouped = {};
  graphData.nodes.forEach(node => {
    const info = getTypeInfo(node.type);
    const hay = [node.name, node.type, info.name, node.reportId].join(' ').toLowerCase();
    if (search && !hay.includes(search)) return;
    if (!grouped[node.type]) grouped[node.type] = [];
    grouped[node.type].push(node);
  });
  let html = '';
  const entries = Object.entries(grouped);
  if (!entries.length) {
    categoryContainer.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:14px;background:#fff;border-radius:10px;border:1px dashed #cbd5e1;">未找到匹配实体，请换个关键词。</div>';
    return;
  }
  // 先收集所有违法/过错行为，用于后续归入过错大类
  const violationNodes = grouped.violation || [];
  // 按过错大类归类违法/过错行为
  const violationsByCategory = {};
  violationNodes.forEach(node => {
    const cat = node.faultCategory || '未分类';
    if (!violationsByCategory[cat]) violationsByCategory[cat] = [];
    violationsByCategory[cat].push(node);
  });
  // 收集所有伤亡情况，用于二级分类
  const injuryNodes = grouped.injury || [];
  const injuriesByCategory = {};
  injuryNodes.forEach(node => {
    const cat = node.injuryCategory || classifyInjury(node.name) || '未分类';
    if (!injuriesByCategory[cat]) injuriesByCategory[cat] = [];
    injuriesByCategory[cat].push(node);
  });
  // 收集所有责任认定，用于二级分类
  const liabilityNodes = grouped.liability || [];
  const liabilitiesByCategory = {};
  liabilityNodes.forEach(node => {
    const cat = node.liabilityCategory || classifyLiability(node.name) || '未分类';
    if (!liabilitiesByCategory[cat]) liabilitiesByCategory[cat] = [];
    liabilitiesByCategory[cat].push(node);
  });
  // 收集所有天气，用于二级分类
  const weatherAllNodes = grouped.weather || [];
  const weatherByCategory = {};
  weatherAllNodes.forEach(node => {
    const cat = node.weatherCategory || classifyWeather(node.name) || '未分类';
    if (!weatherByCategory[cat]) weatherByCategory[cat] = [];
    weatherByCategory[cat].push(node);
  });
  // 收集所有车辆，用于二级分类
  const vehicleAllNodes = grouped.vehicle || [];
  const vehiclesByCategory = {};
  vehicleAllNodes.forEach(node => {
    const cat = node.vehicleCategory || classifyVehicle(node.name) || '未分类';
    if (!vehiclesByCategory[cat]) vehiclesByCategory[cat] = [];
    vehiclesByCategory[cat].push(node);
  });
  // 收集所有道路，用于二级分类
  const roadAllNodes = grouped.road || [];
  const roadsByCategory = {};
  roadAllNodes.forEach(node => {
    const cat = node.roadCategory || classifyRoad(node.name) || '未分类';
    if (!roadsByCategory[cat]) roadsByCategory[cat] = [];
    roadsByCategory[cat].push(node);
  });
  // 收集所有时间，用于二级分类
  const timeAllNodes = grouped.time || [];
  const timesByCategory = {};
  timeAllNodes.forEach(node => {
    const cat = node.timeCategory || classifyTime(node.name) || '未分类';
    if (!timesByCategory[cat]) timesByCategory[cat] = [];
    timesByCategory[cat].push(node);
  });
  // 收集所有事故，用于二级分类
  const accidentAllNodes = grouped.accident || [];
  const accidentsByCategory = {};
  accidentAllNodes.forEach(node => {
    const cat = node.accidentType || classifyAccident(node) || '未分类';
    if (!accidentsByCategory[cat]) accidentsByCategory[cat] = [];
    accidentsByCategory[cat].push(node);
  });

  entries.forEach(([type, nodes]) => {
    // 跳过单独的违法/过错行为、伤亡情况、责任认定、具体天气、具体车辆、具体道路、具体时间、具体事故，已归入对应大类下
    if (type === 'violation' || type === 'injury' || type === 'liability' || type === 'weather' || type === 'vehicle' || type === 'road' || type === 'time' || type === 'accident') return;

    const info = getTypeInfo(type);
    nodes.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hans-CN'));
    const state = entityCategoryUiState[type] || (entityCategoryUiState[type] = { collapsed: false, limit: 15 });
    const limit = state.limit || 15;
    const visibleNodes = state.collapsed ? [] : nodes.slice(0, limit);
    html += '<div class="entity-type-card">';
    html += '<div class="entity-type-header" style="color:' + info.color + ';"><span>' + escapeHtml(info.name) + ' <span style="font-size:12px;color:#64748b;">' + nodes.length + ' 个</span></span><span class="entity-type-actions"><button class="entity-mini-btn" onclick="toggleEntityCategory(\'' + escapeHtml(type) + '\')">' + (state.collapsed ? '展开' : '收缩') + '</button></span></div>';
    if (!state.collapsed) {
      visibleNodes.forEach(node => {
        html += '<span class="entity-chip" title="' + escapeHtml(info.name + '｜' + node.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(node.id) + '\')">' + escapeHtml(node.name) + '</span>';
        // 如果是过错大类，下面显示归属该类的具体违法/过错行为（二级折叠）
        if (type === 'fault_category') {
          const categoryViolations = violationsByCategory[node.name] || [];
          if (categoryViolations.length) {
            const catState = entityCategoryUiState['sub_' + node.name] || (entityCategoryUiState['sub_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#faf5ff;border-radius:6px;border:1px solid #e9d5ff;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#9333ea;">📌 归属该类的违法/过错行为（' + categoryViolations.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryViolations.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#f3e8ff;color:#7c3aed;margin:2px;" title="违法/过错行为｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是伤亡分类，下面显示具体伤亡情况
        if (type === 'injury_category') {
          const categoryInjuries = injuryNodes.filter(n => n.injuryCategory === node.name) || [];
          if (categoryInjuries.length) {
            const catState = entityCategoryUiState['sub_injury_' + node.name] || (entityCategoryUiState['sub_injury_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#fef3c7;border-radius:6px;border:1px solid #fde68a;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#92400e;">🩹 具体伤亡情况（' + categoryInjuries.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_injury_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryInjuries.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#fffbeb;color:#b45309;margin:2px;" title="伤亡情况｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是责任分类，下面显示具体责任认定
        if (type === 'liability_category') {
          const categoryLiabilities = liabilityNodes.filter(n => n.liabilityCategory === node.name) || [];
          if (categoryLiabilities.length) {
            const catState = entityCategoryUiState['sub_liability_' + node.name] || (entityCategoryUiState['sub_liability_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px;border:1px solid #bbf7d0;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#166534;">⚖️ 具体责任认定（' + categoryLiabilities.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_liability_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryLiabilities.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#dcfce7;color:#15803d;margin:2px;" title="责任认定｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是天气分类，下面显示具体天气
        if (type === 'weather_category') {
          const categoryWeather = weatherAllNodes.filter(n => n.weatherCategory === node.name) || [];
          if (categoryWeather.length) {
            const catState = entityCategoryUiState['sub_weather_' + node.name] || (entityCategoryUiState['sub_weather_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#e0f2fe;border-radius:6px;border:1px solid #bae6fd;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#0369a1;">🌦️ 具体天气情况（' + categoryWeather.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_weather_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryWeather.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#f0f9ff;color:#0284c7;margin:2px;" title="天气情况｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是车辆分类，下面显示具体车辆
        if (type === 'vehicle_category') {
          const categoryVehicles = vehicleAllNodes.filter(n => n.vehicleCategory === node.name) || [];
          if (categoryVehicles.length) {
            const catState = entityCategoryUiState['sub_vehicle_' + node.name] || (entityCategoryUiState['sub_vehicle_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#991b1b;">🚗 具体车辆类型（' + categoryVehicles.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_vehicle_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryVehicles.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#fee2e2;color:#dc2626;margin:2px;" title="车辆类型｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是道路分类，下面显示具体道路
        if (type === 'road_category') {
          const categoryRoads = roadAllNodes.filter(n => n.roadCategory === node.name) || [];
          if (categoryRoads.length) {
            const catState = entityCategoryUiState['sub_road_' + node.name] || (entityCategoryUiState['sub_road_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#f5f5f4;border-radius:6px;border:1px solid #d6d3d1;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#44403c;">📍 具体道路（' + categoryRoads.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_road_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryRoads.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#e7e5e4;color:#78716c;margin:2px;" title="道路｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是时间分类，下面显示具体时间
        if (type === 'time_category') {
          const categoryTimes = timeAllNodes.filter(n => n.timeCategory === node.name) || [];
          if (categoryTimes.length) {
            const catState = entityCategoryUiState['sub_time_' + node.name] || (entityCategoryUiState['sub_time_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#fffbeb;border-radius:6px;border:1px solid #fde68a;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#92400e;">🕒 具体事故时间（' + categoryTimes.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_time_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryTimes.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#fef3c7;color:#d97706;margin:2px;" title="事故时间｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name) + '</span>';
              });
            }
            html += '</div>';
          }
        }
        // 如果是事故分类，下面显示具体事故
        if (type === 'accident_category') {
          const categoryAccidents = accidentAllNodes.filter(n => n.accidentType === node.name) || [];
          if (categoryAccidents.length) {
            const catState = entityCategoryUiState['sub_accident_' + node.name] || (entityCategoryUiState['sub_accident_' + node.name] = { collapsed: true });
            html += '<div style="margin-left:20px;margin-top:8px;padding:8px;background:#fff7ed;border-radius:6px;border:1px solid #fed7aa;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;font-weight:600;color:#9a3412;">⚠️ 具体事故（' + categoryAccidents.length + '个）</span><button class="entity-mini-btn" onclick="toggleEntityCategory(\'sub_accident_' + escapeHtml(node.name) + '\')" style="font-size:11px;padding:2px 8px;">' + (catState.collapsed ? '展开' : '收缩') + '</button></div>';
            if (!catState.collapsed) {
              categoryAccidents.forEach(v => {
                html += '<span class="entity-chip" style="font-size:11px;padding:2px 8px;background:#ffedd5;color:#ea580c;margin:2px;" title="事故报告｜' + escapeHtml(v.name) + '" onclick="showEntityAssociations(\'' + escapeHtml(v.id) + '\')">' + escapeHtml(v.name).substring(0, 15) + '...' + '</span>';
              });
            }
            html += '</div>';
          }
        }
      });
      if (nodes.length > limit) {
        html += '<div style="margin-top:10px;display:flex;gap:8px;"><button class="entity-mini-btn" onclick="loadMoreEntityCategory(\'' + escapeHtml(type) + '\')">再显示15个（' + Math.min(limit, nodes.length) + '/' + nodes.length + '）</button></div>';
      } else if (nodes.length > 15) {
        html += '<div style="margin-top:10px;"><button class="entity-mini-btn" onclick="resetEntityCategoryLimit(\'' + escapeHtml(type) + '\')">收回到15个</button></div>';
      }
    } else {
      html += '<div style="color:#94a3b8;font-size:13px;">已收缩，点击“展开”查看实体。</div>';
    }
    html += '</div>';
  });
  categoryContainer.innerHTML = html;
}

// ========== 高频关系对统计面板 ==========
function rebuildRelationStats() {
  const statsPanel = document.getElementById('relation-stats-panel');
  if (!statsPanel) return;
  
  // 只统计分类节点之间的跨类型关联
  // 过滤掉：
  // 1. 分类体系内部的父子关系（如"晴→晴阴天"）
  // 2. 具体个体（车牌号、人名、具体道路等）
  // 3. 同一维度的互相关系（如两个事故分类之间）
  const categoryTypes = [
    'accident_category', // 事故分类
    'fault_category',    // 过错大类
    'vehicle_category',  // 车辆分类
    'weather_category',  // 天气分类
    'time_category',     // 时间分类
    'road_category',     // 道路分类
    'injury_category',   // 伤亡分类
    'liability_category' // 责任分类
  ];
  
  // 过滤掉的关键词/分类（这些分类没有分析价值，不参与规律统计）
  const filterKeywords = [
    '具体', '分类',
    '其他车辆', '其他天气', '其他事故', '其他道路', 
    '待认定', '未分类', '未识别', '责任待定', '时间不详',
    '无伤亡', '其他'
  ];
  
  const relationCounter = {};
  
  // 直接从报告数据统计：两个分类维度的共现关系
  accidentReports.forEach(report => {
    const dimensions = [];
    
    // 提取这个报告的各个分类维度
    if (report.location) dimensions.push(['道路类型', classifyRoad(report.location)]);
    if (report.weather) dimensions.push(['天气', classifyWeather(report.weather)]);
    if (report.date) dimensions.push(['时间', classifyTime(report.date)]);
    if (report.injury) dimensions.push(['伤亡程度', classifyInjury(report.injury)]);
    if (report.liability) dimensions.push(['责任类型', classifyLiability(report.liability)]);
    // 事故类型
    dimensions.push(['事故类型', classifyAccident(report)]);
    // 过错类型（从faultCategories中取）
    if (report.faultCategories && report.faultCategories.length) {
      report.faultCategories.slice(0, 2).forEach(cat => dimensions.push(['过错类型', cat]));
    }
    // 车辆类型（从vehicles中分析）
    if (report.vehicles && report.vehicles.length) {
      report.vehicles.slice(0, 2).forEach(v => dimensions.push(['车辆类型', classifyVehicle(v)]));
    }
    
    // 统计两个不同维度之间的共现
    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i + 1; j < dimensions.length; j++) {
        // 跳过同一维度的自相关
        if (dimensions[i][0] === dimensions[j][0]) continue;
        // 跳过包含过滤关键词的
        if (filterKeywords.some(k => dimensions[i][1].includes(k) || dimensions[j][1].includes(k))) continue;
        
        // 两个方向都统计，保证一致性
        let key = `${dimensions[i][1]} → ${dimensions[j][1]}`;
        let reverseKey = `${dimensions[j][1]} → ${dimensions[i][1]}`;
        // 优先按字典序排列，避免统计双向重复
        if (dimensions[i][1] > dimensions[j][1]) {
          key = reverseKey;
        }
        relationCounter[key] = (relationCounter[key] || 0) + 1;
      }
    }
  });
  
  // 按次数排序取TOP50
  const topRelations = Object.entries(relationCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
  
  let html = '<div class="panel-title">📊 高频关系统计 TOP50</div>';
  html += '<div style="padding:12px 16px;max-height:420px;overflow-y:auto;">';
  const faultClusters = buildFaultCategoryClusters();
  const topFaults = faultClusters.slice(0, 5);
  const totalFactors = faultClusters.reduce((sum, c) => sum + c.factorCount, 0);
  html += '<div style="margin-bottom:12px;padding:10px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;">';
  html += '<div style="font-size:12px;color:#5b21b6;font-weight:800;margin-bottom:7px;">🧭 过错大类快览 · 诱因 ' + totalFactors + ' 次</div>';
  topFaults.forEach(c => {
    const meta = getFaultCategoryMeta(c.title);
    const percent = Math.max(5, Math.round(c.count / Math.max(topFaults[0].count, 1) * 100));
    html += '<div style="margin:6px 0;"><div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:' + meta.color + ';font-weight:700;">' + escapeHtml(c.title) + '</span><span style="color:#64748b;">' + c.count + '起 / 诱因' + c.factorCount + '</span></div><div style="height:5px;background:#ede9fe;border-radius:999px;overflow:hidden;"><div style="height:100%;width:' + percent + '%;background:' + meta.color + ';"></div></div></div>';
  });
  html += '</div>';
  html += '<div style="font-size:12px;color:#64748b;margin-bottom:10px;">统计不同维度分类之间的共现规律（滚动查看更多，可对比多组关系强弱）</div>';
  
  if (!topRelations.length) {
    html += '<div style="color:#94a3b8;font-size:12px;padding:10px 0;text-align:center;">暂无有效统计数据，数据导入中...</div>';
  } else {
    topRelations.forEach(([key, count], index) => {
      const percent = Math.round(count / topRelations[0][1] * 100);
      const color = index < 3 ? '#ef4444' : (index < 7 ? '#f59e0b' : '#10b981');
      html += `<div style="margin-bottom:8px;">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">`;
      html += `<span style="font-size:12px;color:#1e293b;font-weight:500;">${index + 1}. ${key}</span>`;
      html += `<span style="font-size:11px;color:${color};font-weight:600;">${count}次</span>`;
      html += `</div>`;
      html += `<div style="width:100%;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;">`;
      html += `<div style="width:${percent}%;height:100%;background:${color};border-radius:3px;"></div>`;
      html += `</div></div>`;
    });
  }
  
  html += '</div>';
  statsPanel.innerHTML = html;
}

function showEntityAssociations(nodeId) {
  const panel = document.getElementById('entityAssociationPanel');
  if (!panel) return;
  const node = getNodeById(nodeId);
  if (!node) return;
  const info = getTypeInfo(node.type);
  const depths = getAssociationsByDepth(nodeId, 3, 'global');
  const allItems = flattenAssociationDepths(depths);
  const summaries = summarizeAssociationsByType(depths);
  if (entityAssociationExpandedType !== 'all' && !summaries.some(s => s.type === entityAssociationExpandedType)) entityAssociationExpandedType = 'all';
  let html = '<div class="analysis-title">🔍 实体：<span style="color:' + info.color + '">' + escapeHtml(node.name) + '</span> <span style="font-size:12px;color:#64748b;font-weight:500;">' + escapeHtml(info.name) + '</span></div>';
  html += '<div style="color:#64748b;font-size:13px;margin-bottom:14px;">先按实体大类汇总该实体在全库事故报告中的关联数量；点击任一类型卡片，再展开该类型的详细证据链。</div>';
  // v3.5.0 Phase A: AI 跨报告关联分析入口
  if (typeof getRelateIndexType === 'function' && getRelateIndexType(node.type)) {
    const btnId = 'aiRelateBtn_' + safeId(nodeId);
    const boxId = 'aiRelateBox_' + safeId(nodeId);
    html += '<div style="margin-bottom:14px;"><button id="' + btnId + '" onclick="runAiRelateAnalysis(\'' + escapeHtml(node.type) + '\',\'' + escapeHtml(node.name).replace(/'/g, '\\&#39;') + '\',\'' + boxId + '\')" style="padding:8px 16px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;box-shadow:0 2px 6px rgba(124,58,237,0.25);">🧠 用 AI 分析全库同类事故</button><span style="margin-left:10px;font-size:12px;color:#94a3b8;">结果仅展示，不写入图谱</span></div>';
    html += '<div id="' + boxId + '" style="margin-bottom:14px;"></div>';
  }
  html += '<div class="entity-summary-grid">';
  const allActive = entityAssociationExpandedType === 'all' ? ' active' : '';
  html += '<div class="entity-summary-card' + allActive + '" onclick="setEntityAssociationExpandedType(&quot;all&quot;, &quot;' + escapeHtml(nodeId) + '&quot;)"><div style="font-weight:700;color:#334155;">全部关联</div><div class="entity-summary-count" style="color:#334155;">' + allItems.length + '</div><div class="entity-summary-desc">展示所有类型的一至三层关联详情。</div></div>';
  summaries.forEach(summary => {
    const tInfo = getTypeInfo(summary.type);
    const active = entityAssociationExpandedType === summary.type ? ' active' : '';
    html += '<div class="entity-summary-card' + active + '" onclick="setEntityAssociationExpandedType(&quot;' + escapeHtml(summary.type) + '&quot;, &quot;' + escapeHtml(nodeId) + '&quot;)">';
    html += '<div style="font-weight:700;color:' + tInfo.color + ';">' + escapeHtml(tInfo.name) + '</div>';
    html += '<div class="entity-summary-count" style="color:' + tInfo.color + ';">' + summary.count + '</div>';
    html += '<div class="entity-summary-desc">关系：' + escapeHtml(Array.from(summary.labels).slice(0, 4).join('、') || '关联') + '<br>示例：' + escapeHtml(summary.sampleNames.join('、') || '暂无') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  const currentTitle = entityAssociationExpandedType === 'all' ? '全部关联详情' : (getTypeInfo(entityAssociationExpandedType).name + '详情');
  const currentCount = entityAssociationExpandedType === 'all' ? allItems.length : allItems.filter(item => item.otherNode.type === entityAssociationExpandedType).length;
  html += '<div class="entity-detail-toolbar"><strong>' + escapeHtml(currentTitle) + ' · ' + currentCount + ' 条</strong><span style="font-size:12px;color:#64748b;">点击上方卡片切换详情类型</span></div>';
  html += renderEntityAssociationDetails(allItems, entityAssociationExpandedType);
  panel.innerHTML = html;
  switchTab('entities');
}

// ==================== 1. 知识图谱渲染 ====================
function initGraph() {
  const chartDom = document.getElementById('knowledgeGraph');
  if (!chartDom || !echarts) return;
  
  if (graphChart) {
    graphChart.dispose();
    graphChart = null;
  }
  graphChart = echarts.init(chartDom);
  const chart = graphChart;
  const viewData = getGraphViewData();
  const baseReport = getReportByGraphId(graphEntryReportId);
  
  const option = {
    backgroundColor: '#fff',
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      formatter: function(params) {
        if (params.dataType === 'node') {
          // 从原始数据中查找节点类型
          const nodeId = params.data.id;
          const originalNode = graphData.nodes.find(n => n.id === nodeId);
          if (originalNode) {
            const typeInfo = entityColors[originalNode.type] || { name: originalNode.type };
            return '<div style="padding:10px"><strong style="font-size:14px">' + params.name + '</strong><br><span style="color:#64748b;font-size:12px">类型: ' + typeInfo.name + '</span></div>';
          }
          return '<div style="padding:8px"><strong>' + params.name + '</strong></div>';
        }
        if (params.dataType === 'edge') {
          const label = params.data.label || '';
          const strength = relationStrength[label] || { name: '' };
          return '<div style="padding:8px"><strong>关系: ' + label + '</strong><br><span style="color:#64748b">强度: ' + strength.name + '</span>' + (params.data.confidence ? '<br><span style="color:#64748b">置信度: ' + Math.round(params.data.confidence * 100) + '%</span>' : '') + (params.data.ruleId ? '<br><span style="color:#64748b">规则: ' + params.data.ruleId + '</span>' : '') + '</div>';
        }
        return '';
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      force: { 
        repulsion: viewData.nodes.length > 160 ? 250 : (viewData.nodes.length > 80 ? 320 : 400),
        edgeLength: viewData.nodes.length > 160 ? 82 : (viewData.nodes.length > 80 ? 105 : 130),
        gravity: 0.1,
        layoutAnimation: viewData.nodes.length < 220
      },
      emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
      label: { 
        show: true, 
        position: 'inside', 
        color: '#fff', 
        fontSize: 10, 
        fontWeight: 600,
        formatter: function(params) {
          return params.name;
        }
      },
      lineStyle: { color: '#94a3b8', width: 1.5, curveness: 0.1 },
      edgeLabel: { 
        show: true, 
        formatter: function(params) {
          const strength = relationStrength[params.data.label] || { name: '' };
          return params.data.label + (strength.name ? '\n[' + strength.name + ']' : '');
        }, 
        fontSize: 9, 
        color: '#64748b', 
        backgroundColor: '#fff', 
        padding: [2, 4] 
      },
      data: viewData.nodes.map(node => {
        const typeInfo = entityColors[node.type] || { name: node.type, color: '#94a3b8' };
        return {
          id: node.id,
          name: node.name,
          type: node.type,
          nodeType: node.type,
          typeName: typeInfo.name,
          symbolSize: node.symbolSize,
          virtual: !!node.virtual,
          categoryHint: node.categoryHint || '',
          itemStyle: { color: node.virtual ? '#cbd5e1' : typeInfo.color, borderColor: node.id === graphFocusedNodeId ? '#111827' : '#fff', borderWidth: node.id === graphFocusedNodeId ? 3 : 1 }
        };
      }),
      links: viewData.links.map(link => {
        const strength = relationStrength[link.label] || { color: '#94a3b8', width: 1, name: '弱关联' };
        const relationLevel = link.relationLevel || '';
        const isWeakExpand = relationLevel === 'weakExpand';
        const isWeakerDashed = relationLevel === 'weakerDashed';
        const isGap = relationLevel === 'gap';
        // v3.3.4 建议4：置信度分档。<0.6 弱推断（0.6~0.75 中，≥高），用于着色与标签。
        const conf = typeof link.confidence === 'number' ? link.confidence : null;
        const isWeakInfer = conf !== null && conf < 0.6 && !isGap;
        const confTier = conf === null ? '' : (conf < 0.6 ? 'low' : (conf < 0.75 ? 'mid' : 'high'));
        return {
          source: link.source,
          target: link.target,
          label: link.label,
          strength: strength.strength,
          strengthName: isGap ? '待补证缺口' : (isWeakInfer ? '弱推断' : (isWeakExpand ? '弱关联拓展' : (isWeakerDashed ? '更弱关联' : strength.name))),
          relationLevel: relationLevel,
          confTier: confTier,
          isWeakInfer: isWeakInfer,
          virtual: !!link.virtual,
          reportId: link.reportId,
          confidence: link.confidence,
          ruleId: link.ruleId,
          parserRelationType: link.parserRelationType,
          evidence: link.evidence,
          sourceTitle: link.sourceTitle,
          sourceExcerpt: link.sourceExcerpt,
          lineStyle: {
            color: isGap ? '#f97316' : (isWeakInfer ? '#f59e0b' : (confTier === 'mid' ? '#3b82f6' : (isWeakExpand ? '#94a3b8' : (isWeakerDashed ? '#cbd5e1' : strength.color)))),
            width: isGap ? 2 : (conf ? Math.max(1, Math.min(3.5, strength.width * (0.75 + conf / 2))) : (isWeakExpand ? 1.5 : (isWeakerDashed ? 1 : strength.width))),
            type: isGap || isWeakerDashed || isWeakInfer || (conf && conf < 0.65) ? 'dashed' : 'solid',
            opacity: isWeakInfer ? 0.7 : 1,
            curveness: isGap ? 0.32 : (isWeakerDashed ? 0.25 : 0.1)
          }
        };
      })
    }]
  };
  
  chart.setOption(option);
  
  // 节点点击选中：高亮邻接关系，并在下方展示一层关系和分析过程
  // v3.5.1: 兼容 edge 命中——密集连线区域鼠标点在节点附近常被拾取为 edge，兜底解析为起点节点，
  // 避免"点击无反应"。
  if (chart.off) chart.off('click');
  chart.on('click', function(params) {
    let nodeId = null;
    if (params.dataType === 'node') {
      nodeId = params.data && params.data.id;
    } else if (params.dataType === 'edge') {
      // edge 兜底：优先取起点节点，其次终点节点
      const src = params.data && params.data.source;
      const tgt = params.data && params.data.target;
      nodeId = (src && getNodeById(src)) ? src : (tgt && getNodeById(tgt) ? tgt : null);
    }
    if (!nodeId) return;
    const node = getNodeById(nodeId);
    if (!node) return;
    if (node.type === 'accident' && node.reportId && String(node.reportId) !== String(graphEntryReportId)) {
      graphEntryAutoMode = false;
      viewReportLocalGraph(node.reportId);
      return;
    }
    graphExpandedNodeId = nodeId;
    graphFocusedNodeId = nodeId;
    initGraph();
    renderSelectedNodeRelations(nodeId);
  });
  
  if (!graphResizeHandlerBound) {
    graphResizeHandlerBound = true;
    window.addEventListener('resize', function() {
      if (graphChart) graphChart.resize();
    });
  }
}

