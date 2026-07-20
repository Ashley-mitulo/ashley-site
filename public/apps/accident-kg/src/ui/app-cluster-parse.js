// ==================== 4. 聚类分析 ====================
function toggleClusterDetail(key) {
  expandedClusterKey = expandedClusterKey === key ? null : key;
  initClusters();
}

function buildFaultCategoryClusters() {
  const grouped = new Map();
  accidentReports.forEach(report => {
    const categories = getReportFaultCategories(report);
    if (!categories.length) categories.push(report.violation || report.type || '未分类原因');
    categories.forEach(category => {
      if (!grouped.has(category)) grouped.set(category, { title: category, reports: [], behaviors: new Map(), factors: new Map(), roads: new Map(), injuries: new Map(), liabilities: new Map() });
      const bucket = grouped.get(category);
      bucket.reports.push(report);
      const road = extractRoadName(report.location);
      if (road) bucket.roads.set(road, (bucket.roads.get(road) || 0) + 1);
      const injury = classifyInjury(report.injury);
      if (injury) bucket.injuries.set(injury, (bucket.injuries.get(injury) || 0) + 1);
      const liability = classifyLiability(report.liability);
      if (liability) bucket.liabilities.set(liability, (bucket.liabilities.get(liability) || 0) + 1);
      getReportFaultItemsByCategory(report, category).forEach(item => {
        const map = item.type === 'fault_factor' ? bucket.factors : bucket.behaviors;
        map.set(item.name, (map.get(item.name) || 0) + 1);
      });
    });
  });
  const totalReports = accidentReports.filter(r => !r.deletedAt).length || accidentReports.length || 1;
  return Array.from(grouped.values())
    .map(c => ({
      ...c,
      count: c.reports.length,
      percent: Math.round(c.reports.length / totalReports * 1000) / 10,
      factorCount: Array.from(c.factors.values()).reduce((sum, n) => sum + n, 0),
      behaviorCount: Array.from(c.behaviors.values()).reduce((sum, n) => sum + n, 0)
    }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'zh-Hans-CN'));
}

function topClusterItems(map, limit) {
  return Array.from((map || new Map()).entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN')).slice(0, limit || 8);
}

function getFaultCategoryMeta(title) {
  return faultCategoryMeta[title] || { icon: '🧭', color: '#7c3aed', bg: '#f8fafc', border: '#e2e8f0', desc: '由解析器基于违法行为、过错表述和事故诱因自动聚合。' };
}

function renderMiniBars(items, color, emptyText) {
  if (!items || !items.length) return '<div style="font-size:12px;color:#94a3b8;line-height:1.8;">' + escapeHtml(emptyText || '暂无数据') + '</div>';
  const max = Math.max(...items.map(x => x[1]), 1);
  return items.map(([name, count]) => {
    const percent = Math.max(8, Math.round(count / max * 100));
    return '<div style="margin:7px 0;"><div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#334155;"><span>' + escapeHtml(name) + '</span><strong style="color:' + color + ';white-space:nowrap;">' + count + '次</strong></div><div style="height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;margin-top:3px;"><div style="height:100%;width:' + percent + '%;background:' + color + ';border-radius:999px;"></div></div></div>';
  }).join('');
}

function buildFaultCategorySummary(clusters) {
  const total = clusters.reduce((sum, c) => sum + c.count, 0) || 1;
  const totalFactors = clusters.reduce((sum, c) => sum + c.factorCount, 0);
  const factorClusters = clusters.filter(c => c.factorCount > 0).length;
  const top = clusters[0];
  let html = '<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:4px;">';
  html += '<div style="padding:14px;background:linear-gradient(135deg,#f5f3ff,#eef2ff);border:1px solid #ddd6fe;border-radius:14px;"><div style="font-size:12px;color:#6d28d9;font-weight:700;">过错大类覆盖</div><div style="font-size:28px;font-weight:900;color:#7c3aed;margin-top:4px;">' + clusters.length + '<span style="font-size:13px;margin-left:4px;">类</span></div><div style="font-size:12px;color:#64748b;">聚合样本 ' + total + ' 起次</div></div>';
  html += '<div style="padding:14px;background:linear-gradient(135deg,#ecfeff,#f0f9ff);border:1px solid #a5f3fc;border-radius:14px;"><div style="font-size:12px;color:#0e7490;font-weight:700;">事故诱因识别</div><div style="font-size:28px;font-weight:900;color:#0891b2;margin-top:4px;">' + totalFactors + '<span style="font-size:13px;margin-left:4px;">次</span></div><div style="font-size:12px;color:#64748b;">分布于 ' + factorClusters + ' 个过错大类</div></div>';
  html += '<div style="padding:14px;background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fed7aa;border-radius:14px;"><div style="font-size:12px;color:#c2410c;font-weight:700;">最高频大类</div><div style="font-size:20px;font-weight:900;color:#ea580c;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(top ? top.title : '暂无') + '</div><div style="font-size:12px;color:#64748b;">' + (top ? (top.count + ' 起次 / ' + Math.round(top.count / total * 1000) / 10 + '%') : '暂无数据') + '</div></div>';
  html += '</div>';
  return html;
}

function renderFaultFactorMatrix(clusters) {
  const factorMap = new Map();
  clusters.forEach(c => {
    c.factors.forEach((count, factor) => {
      if (!factorMap.has(factor)) factorMap.set(factor, { total: 0, categories: new Map() });
      const row = factorMap.get(factor);
      row.total += count;
      row.categories.set(c.title, (row.categories.get(c.title) || 0) + count);
    });
  });
  const rows = Array.from(factorMap.entries()).sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0], 'zh-Hans-CN')).slice(0, 12);
  if (!rows.length) return '';
  let html = '<div style="grid-column:1/-1;margin-bottom:4px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><strong style="color:#0f172a;">🌧️ 事故诱因热度矩阵 TOP12</strong><span style="font-size:12px;color:#64748b;">按诱因出现次数聚合，显示主要归属大类</span></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">';
  rows.forEach(([factor, data]) => {
    const main = topClusterItems(data.categories, 1)[0] || ['', 0];
    const meta = getFaultCategoryMeta(main[0]);
    html += '<div style="padding:10px;border:1px solid ' + meta.border + ';background:#fff;border-radius:12px;">';
    html += '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><strong style="color:#0e7490;">' + escapeHtml(factor) + '</strong><span style="font-size:12px;font-weight:800;color:#0891b2;">' + data.total + '次</span></div>';
    html += '<div style="font-size:12px;color:#64748b;margin-top:6px;">主要归属：<span style="color:' + meta.color + ';font-weight:700;">' + escapeHtml(main[0] || '待归类') + '</span></div>';
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

function detectChainGapInfo(report, steps) {
  const explicit = report && (report.chainGapAnalysis || { gaps: report.chainGaps || [] });
  const explicitGaps = Array.isArray(explicit && explicit.gaps) ? explicit.gaps : [];
  const relations = Array.isArray(report && report.relations) ? report.relations : [];
  const relTypes = new Set(relations.map(r => r.type));
  const details = getReportFaultCategoryDetails(report || {});
  const factors = [...new Set([...(Array.isArray(report && report.faultFactors) ? report.faultFactors : []), ...details.flatMap(d => d.factors || [])].filter(Boolean))];
  const behaviors = [...new Set([...(Array.isArray(report && report.violations) ? report.violations : []), report && report.violation].map(normalizeName).filter(Boolean).filter(x => !/待识别|原因待|无明确/.test(x)))] ;
  const fallbackBehaviorEntities = Array.isArray(report && report.entityDetails) ? report.entityDetails.filter(e => ['violation', 'fault_behavior'].includes(e.type)) : [];
  if (!behaviors.length && fallbackBehaviorEntities.length) fallbackBehaviorEntities.forEach(e => behaviors.push(e.normalizedName || e.name));
  const accidentTypes = Array.isArray(report && report.entityDetails) ? report.entityDetails.filter(e => e.type === 'accident_type') : [];
  const injuries = Array.isArray(report && report.entityDetails) ? report.entityDetails.filter(e => e.type === 'injury') : [];
  const gaps = [...explicitGaps];
  const add = (key, label, level, desc, suggestion) => { if (!gaps.some(g => g.key === key)) gaps.push({ key, label, level, desc, suggestion }); };
  if (!factors.length && !behaviors.length) add('missing-cause', '原因待查', /调查|原因待|正在/.test(report && (report.description || report.liability || '')) ? 'pending' : 'missing', '未见明确事故原因、违法行为或外部诱因。', '补充现场勘查、监控、鉴定或后续通报。');
  if (!behaviors.length) add('missing-violation', '违法事实缺失', 'missing', '未见明确违法/过错行为。', '补充闯红灯、超速、未让行、操作不当等事实。');
  if (!report || !report.liability || /待定|待认定|未知|调查/.test(report.liability)) add('missing-liability', '责任待认定', 'pending', '尚未形成明确责任主体或责任比例。', '等待事故责任认定书或补充主责/次责/全责信息。');
  if (!((report.persons || []).length || (report.vehicles || []).length)) add('missing-subject', '主体身份不明', 'missing', '涉事人/车/行人/非机动车主体不充分。', '补充车辆类型、车牌、驾驶人或行人身份。');
  if (!injuries.length && (!report.injury || /待确认|待核实|未知/.test(report.injury))) add('missing-injury', '伤亡后果待确认', 'pending', '伤亡或损害后果未明确。', '补充死亡、受伤、被困或财产损失信息。');
  if (!accidentTypes.length && !relTypes.has('vehicle_collides_vehicle')) add('missing-collision', '事故形态待补证', 'missing', '未见清晰碰撞/侧翻/追尾/刮擦过程。', '补充事故过程和碰撞关系。');
  const weakRelations = relations.filter(r => (Number(r.confidence) || 0) < 0.65 || r.relationLevel === 'gap' || /weak|fallback|implicit|context|natural/i.test(String(r.ruleId || ''))).length;
  const chainStatus = gaps.length === 0 ? 'strong' : (relations.length > 0 || (steps || []).some(s => (s.items || []).some(x => !/待识别|待确认|待定|暂无/.test(x))) ? 'partial' : 'weak');
  const chainQuality = chainStatus === 'strong' ? '强链路' : (chainStatus === 'partial' ? '待补证链路' : '弱链路');
  return { chainStatus, chainQuality, gaps, weakRelations, relationCount: relations.length, weakReason: gaps.map(g => g.label).join('、') };
}

function gapStepFromKey(gapKey) {
  if (/cause|violation/.test(gapKey || '')) return 'behavior';
  if (/liability/.test(gapKey || '')) return 'liability';
  if (/subject/.test(gapKey || '')) return 'evidence';
  if (/injury/.test(gapKey || '')) return 'injury';
  if (/collision/.test(gapKey || '')) return 'collision';
  return 'evidence';
}

function enrichStepsWithGaps(steps, gapInfo) {
  const next = steps.map(s => ({ ...s, gaps: [] }));
  (gapInfo.gaps || []).forEach(g => {
    const key = gapStepFromKey(g.key);
    const step = next.find(s => s.key === key) || next[next.length - 1];
    step.gaps.push(g);
    if (!(step.items || []).some(x => x === g.label)) step.items = [...(step.items || []).filter(x => !/待识别|待确认|待定|暂无/.test(x)), g.label];
    step.hasGap = true;
  });
  return next;
}

function buildEventChain(report) {
  const details = getReportFaultCategoryDetails(report);
  const factors = [...new Set([...(Array.isArray(report.faultFactors) ? report.faultFactors : []), ...details.flatMap(d => d.factors || [])].map(normalizeName).filter(Boolean))];
  const behaviors = [...new Set([...(Array.isArray(report.violations) ? report.violations : []), report.violation, ...details.flatMap(d => d.behaviors || [])].map(normalizeName).filter(Boolean).filter(x => !/待识别|原因待/.test(x)))];
  const accidentTypes = Array.isArray(report.entityDetails) ? [...new Set(report.entityDetails.filter(e => e.type === 'accident_type').map(e => e.normalizedName || e.name).filter(Boolean))] : [];
  const relation = type => (report.relations || []).filter(r => r.type === type);
  const steps = [
    { key: 'factor', title: '环境/设施诱因', icon: '🌧️', color: '#06b6d4', items: factors.length ? factors : [report.weather, report.location].filter(Boolean), desc: '天气、道路、视距、照明、施工等外部风险。' },
    { key: 'behavior', title: '违法/过错行为', icon: '❌', color: '#a855f7', items: behaviors.length ? behaviors : ['待识别'], desc: '驾驶人、行人、非机动车或管理主体的过错行为。' },
    { key: 'collision', title: '碰撞/事故形态', icon: '⚠️', color: '#f97316', items: accidentTypes.length ? accidentTypes : [report.type || '事故形态待识别'], desc: '追尾、侧碰、刮擦、侧翻、碾压等事故过程。' },
    { key: 'injury', title: '后果损害', icon: '🩹', color: '#dc2626', items: [report.injury || '伤亡待确认'], desc: '人员伤亡、车辆损失、路产损失等后果。' },
    { key: 'liability', title: '责任认定', icon: '⚖️', color: '#10b981', items: [report.liability || '责任待定'], desc: '责任比例、主次责任、全责/无责等认定。' },
    { key: 'evidence', title: '证据关系', icon: '🔗', color: '#2563eb', items: relation('person_drives_vehicle').slice(0, 2).map(r => r.source + '驾驶' + r.target).concat(relation('person_commits_violation').slice(0, 2).map(r => r.source + '→' + r.target)), desc: '解析器从原文抽取的人车、违法、责任、伤亡关系。' }
  ];
  steps.forEach(s => { if (!s.items.length) s.items = ['暂无明确证据']; });
  return enrichStepsWithGaps(steps, detectChainGapInfo(report, steps));
}

function renderEventChainPanel(report) {
  if (!report) return '';
  const steps = buildEventChain(report);
  let html = '<div style="grid-column:1/-1;margin:0 0 4px;padding:14px;background:linear-gradient(135deg,#eff6ff,#f8fafc);border:1px solid #bfdbfe;border-radius:14px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;"><strong style="color:#1d4ed8;">🧬 v3.3.2 弱链路事故事件链</strong><span style="font-size:12px;color:#64748b;">' + escapeHtml(report.title || '当前事故') + '</span></div>';
  html += renderChainStepStrip(steps, false);
  html += '</div>';
  return html;
}

function renderChainStepStrip(steps, interactive) {
  let html = '<div class="chain-step-strip">';
  steps.forEach((s, i) => {
    const active = selectedChainStepKey === s.key ? ' active' : '';
    const click = interactive ? ' onclick="selectChainStep(\'' + escapeHtml(s.key) + '\')"' : '';
    html += '<div class="chain-step-chip' + active + '" style="border-color:' + (s.hasGap ? '#fb923c' : (active ? s.color : '#e2e8f0')) + ';background:' + (s.hasGap ? '#fff7ed' : '#fff') + ';"' + click + '>';
    html += '<div class="chain-step-title" style="color:' + s.color + ';">' + s.icon + ' ' + escapeHtml(s.title) + '</div>';
    html += '<div class="chain-step-items">' + escapeHtml(s.items.slice(0, 3).join('、')) + '</div>';
    if (i < steps.length - 1) html += '<div style="float:right;color:#93c5fd;font-size:18px;margin-top:4px;">→</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function getStepEvidence(report, stepKey) {
  const relations = Array.isArray(report && report.relations) ? report.relations : [];
  const map = {
    factor: ['behavior_belongs_to_category', 'report_has_fault_category'],
    behavior: ['person_commits_violation', 'behavior_belongs_to_category', 'chain_gap'],
    collision: ['vehicle_collides_vehicle', 'chain_gap'],
    injury: ['person_has_injury', 'chain_gap'],
    liability: ['person_bears_liability', 'chain_gap'],
    evidence: ['person_drives_vehicle', 'person_commits_violation', 'person_bears_liability', 'person_has_injury', 'vehicle_collides_vehicle', 'chain_gap']
  };
  const types = map[stepKey] || [];
  return relations.filter(r => types.includes(r.type)).filter(r => r.type !== 'chain_gap' || gapStepFromKey(r.gapKey || r.ruleId || '') === stepKey || stepKey === 'evidence');
}

function relationEvidenceKey(r, idx) {
  return [r.type || '', r.source || '', r.target || '', r.ruleId || '', r.sentenceIndex == null ? '' : r.sentenceIndex, idx == null ? '' : idx].map(safeId).join('__');
}

function selectChainEvidence(key, stepKey) {
  selectedEvidenceKey = key || '';
  if (stepKey) selectedChainStepKey = stepKey;
  initChainView();
  setTimeout(() => {
    const el = document.getElementById('chainOriginalText');
    if (el && selectedEvidenceKey) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 30);
}

function findSelectedEvidence(report) {
  const relations = Array.isArray(report && report.relations) ? report.relations : [];
  for (let i = 0; i < relations.length; i++) {
    if (relationEvidenceKey(relations[i], i) === selectedEvidenceKey) return relations[i];
  }
  return null;
}

function highlightEvidenceText(text, evidence) {
  const raw = String(text || '');
  const ev = normalizeName(evidence || '');
  if (!raw) return '';
  if (!ev) return escapeHtml(raw).replace(/\n/g, '<br>');
  const candidates = [ev, ev.replace(/[。；;，,\s]+$/g, ''), ev.slice(0, 80), ev.slice(0, 40)].filter(x => x && x.length >= 8);
  let best = '';
  candidates.forEach(c => { if (!best && raw.includes(c)) best = c; });
  if (!best) {
    const compact = raw.replace(/\s+/g, '');
    const compactEv = ev.replace(/\s+/g, '').slice(0, 50);
    if (compactEv.length >= 8 && compact.includes(compactEv)) {
      return escapeHtml(raw).replace(/\n/g, '<br>') + '<div style="margin-top:10px;padding:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;"><strong>已选证据：</strong>' + escapeHtml(ev) + '</div>';
    }
  }
  if (!best) return escapeHtml(raw).replace(/\n/g, '<br>') + '<div style="margin-top:10px;padding:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;"><strong>已选证据：</strong>' + escapeHtml(ev) + '</div>';
  const idx = raw.indexOf(best);
  return escapeHtml(raw.slice(0, idx)).replace(/\n/g, '<br>') + '<span class="evidence-hit">' + escapeHtml(raw.slice(idx, idx + best.length)) + '</span>' + escapeHtml(raw.slice(idx + best.length)).replace(/\n/g, '<br>');
}

function renderEvidenceOriginalText(report) {
  const selected = findSelectedEvidence(report);
  const text = report.fullText || report.originalText || report.description || '';
  let html = '<div id="chainOriginalText" style="margin-top:14px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;line-height:1.8;font-size:13px;color:#334155;max-height:320px;overflow:auto;">';
  html += '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;"><strong>原文摘要 / 证据定位</strong><span style="font-size:12px;color:#64748b;">' + (selected ? '已高亮选中证据句' : '点击右侧证据后自动高亮') + '</span></div>';
  html += highlightEvidenceText(text, selected && selected.evidence);
  html += '</div>';
  return html;
}

function buildChainConfidence(report, steps) {
  const relations = Array.isArray(report && report.relations) ? report.relations : [];
  const chainTypes = ['person_drives_vehicle', 'person_commits_violation', 'person_bears_liability', 'person_has_injury', 'vehicle_collides_vehicle', 'behavior_belongs_to_category', 'report_has_fault_category'];
  const chainRelations = relations.filter(r => chainTypes.includes(r.type));
  const gapInfo = detectChainGapInfo(report, steps);
  const gapPenalty = Math.min(0.28, (gapInfo.gaps || []).length * 0.045);
  const avgConfidence = chainRelations.length ? chainRelations.reduce((sum, r) => sum + (Number(r.confidence) || 0.75), 0) / chainRelations.length : 0.45;
  const evidenceCoverage = steps.length ? steps.filter(s => getStepEvidence(report, s.key).length > 0 || (s.items || []).some(x => x && !/待识别|待确认|待定|暂无/.test(x))).length / steps.length : 0;
  const completeness = steps.length ? steps.filter(s => (s.items || []).some(x => x && !/待识别|待确认|待定|暂无/.test(x)) && !(s.gaps && s.gaps.length)).length / steps.length : 0;
  const relationRichness = Math.min(1, chainRelations.length / 8);
  const score = Math.max(0, Math.round((avgConfidence * 0.4 + evidenceCoverage * 0.28 + completeness * 0.22 + relationRichness * 0.1 - gapPenalty) * 100));
  const level = score >= 85 ? '高可信' : score >= 70 ? '较可信' : score >= 55 ? '中等可信' : '证据不足';
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 55 ? '#f59e0b' : '#ef4444';
  return { score, level, color, avgConfidence, evidenceCoverage, completeness, relationRichness, relationCount: chainRelations.length, gapCount: (gapInfo.gaps || []).length, gapPenalty, chainQuality: gapInfo.chainQuality };
}

function renderChainConfidenceCard(report, steps) {
  const c = buildChainConfidence(report, steps);
  const factors = [
    ['关系平均置信度', c.avgConfidence, '#2563eb'],
    ['证据覆盖度', c.evidenceCoverage, '#0891b2'],
    ['关键环节完整度', c.completeness, '#7c3aed'],
    ['关系丰富度', c.relationRichness, '#f97316']
  ];
  let html = '<div class="chain-confidence-card">';
  html += '<div class="confidence-meter" style="background:conic-gradient(' + c.color + ' ' + c.score + '%, #e2e8f0 0);"><div style="width:72px;height:72px;border-radius:50%;background:#fff;display:grid;place-items:center;"><div><div>' + c.score + '</div><div style="font-size:11px;color:#64748b;text-align:center;">' + c.level + '</div></div></div></div>';
  html += '<div><div style="font-weight:900;color:#0f172a;margin-bottom:4px;">链路可信度评分 <span style="font-size:12px;color:#f97316;">' + escapeHtml(c.chainQuality) + '</span></div><div style="font-size:12px;color:#64748b;margin-bottom:8px;">综合关系置信度、证据覆盖、关键环节完整度、关系数量与缺口惩罚生成；当前纳入 ' + c.relationCount + ' 条链路关系，识别 ' + c.gapCount + ' 个待补证缺口。</div>';
  factors.forEach(f => { html += '<div class="confidence-factor"><span style="width:92px;">' + f[0] + '</span><div class="confidence-bar"><span style="width:' + Math.round(f[1] * 100) + '%;background:' + f[2] + ';"></span></div><strong>' + Math.round(f[1] * 100) + '%</strong></div>'; });
  html += '</div></div>';
  return html;
}

function renderChainGapCard(report, steps) {
  const gapInfo = detectChainGapInfo(report, steps);
  const statusClass = gapInfo.chainStatus === 'strong' ? 'chain-status-strong' : (gapInfo.chainStatus === 'partial' ? 'chain-status-partial' : 'chain-status-weak');
  let html = '<div class="chain-gap-card">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;"><div><strong style="color:#9a3412;">🕳️ 新闻短讯弱链路 / 缺口标注</strong><div style="font-size:12px;color:#7c2d12;margin-top:4px;">对原因、违法事实、责任、主体、伤亡和事故形态进行完整性检查；不会凭空补全责任链。</div></div><span class="chain-status-badge ' + statusClass + '">' + escapeHtml(gapInfo.chainQuality) + '</span></div>';
  if (!gapInfo.gaps.length) {
    html += '<div style="margin-top:10px;padding:10px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:13px;">当前报告关键环节较完整，未发现明显待补证缺口。</div>';
  } else {
    html += '<div class="chain-gap-grid">';
    gapInfo.gaps.forEach(g => {
      html += '<div class="chain-gap-item ' + escapeHtml(g.level || 'missing') + '"><strong>' + escapeHtml(g.label) + '</strong><br>' + escapeHtml(g.desc || '') + '<br><span style="color:#64748b;">建议：' + escapeHtml(g.suggestion || '补充原文证据。') + '</span></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function renderChainStepDetail(report, steps) {
  const step = steps.find(s => s.key === selectedChainStepKey) || steps[0];
  const evidence = getStepEvidence(report, step.key).slice(0, 10);
  let html = '<div class="chain-side-card"><div style="font-size:15px;font-weight:900;color:' + step.color + ';margin-bottom:8px;">' + step.icon + ' ' + escapeHtml(step.title) + '</div>';
  html += '<div style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:10px;">' + escapeHtml(step.desc) + '</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">' + step.items.slice(0, 8).map(x => '<span class="report-tag" style="background:' + (/待查|缺失|待认定|不明|待确认|待补证/.test(x) ? '#fff7ed;color:#9a3412;border:1px dashed #fb923c;' : '#eff6ff;color:#1d4ed8;') + '">' + escapeHtml(x) + '</span>').join('') + '</div>';
  if (step.gaps && step.gaps.length) {
    html += '<div style="padding:10px;background:#fff7ed;border:1px dashed #fb923c;border-radius:10px;color:#9a3412;font-size:12px;line-height:1.6;margin-bottom:12px;"><strong>本环节待补证：</strong>' + escapeHtml(step.gaps.map(g => g.label).join('、')) + '<br>' + escapeHtml(step.gaps.map(g => g.suggestion || '').filter(Boolean).join('；')) + '</div>';
  }
  html += '<div style="font-weight:800;color:#0f172a;margin-bottom:8px;">原文证据</div>';
  if (!evidence.length) {
    html += '<div style="font-size:12px;color:#94a3b8;line-height:1.7;">当前环节暂无结构化关系证据，可查看原文摘要或其它链路节点。</div>';
  } else {
    evidence.forEach((r, idx) => {
      const key = relationEvidenceKey(r, idx);
      const active = selectedEvidenceKey === key ? ' active' : '';
      html += '<div class="chain-evidence-item' + active + '" onclick="selectChainEvidence(\'' + escapeHtml(key) + '\',\'' + escapeHtml(step.key) + '\')">';
      html += '<strong>' + escapeHtml(parserRelationLabel(r.type)) + '</strong>：' + escapeHtml(r.source) + ' → ' + escapeHtml(r.target) + '<br>';
      const weakTag = r.relationLevel === 'gap' ? ' ｜ 缺口提示' : ((r.confidence || 1) < 0.65 ? ' ｜ 弱推断' : '');
      html += '<span style="color:#64748b;">置信度 ' + Math.round((r.confidence || 0.75) * 100) + '% ｜ 规则 ' + escapeHtml(r.ruleId || '未标注') + weakTag + ' ｜ 点击定位原文</span>';
      if (r.evidence) html += '<br><span style="color:#475569;">' + escapeHtml(r.evidence) + '</span>';
      html += '</div>';
    });
  }
  html += '</div>';
  return html;
}

function buildChainGraphData(report, steps) {
  const nodes = [];
  const links = [];
  steps.forEach((s, i) => {
    nodes.push({ id: 'step_' + s.key, name: s.icon + '\n' + s.title, stepKey: s.key, value: s.items.length, itemStyle: { color: s.color }, symbolSize: 72, x: 110 + i * 155, y: 170, label: { color: '#fff', fontWeight: 800, fontSize: 12 } });
    if (i > 0) links.push({ source: 'step_' + steps[i - 1].key, target: 'step_' + s.key, label: { show: true, formatter: '推进', color: '#64748b' }, lineStyle: { width: 4, color: '#93c5fd', curveness: 0.08 } });
    s.items.slice(0, 3).forEach((item, j) => {
      const itemId = 'item_' + s.key + '_' + j;
      nodes.push({ id: itemId, name: item.length > 14 ? item.slice(0, 14) + '…' : item, stepKey: s.key, itemValue: item, symbolSize: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? 42 : 34, x: 105 + i * 155, y: 285 + j * 48, itemStyle: { color: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? '#fff7ed' : '#fff', borderColor: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? '#f97316' : s.color, borderWidth: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? 3 : 2 }, label: { color: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? '#9a3412' : '#334155', fontSize: 10, fontWeight: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? 900 : 400 } });
      links.push({ source: 'step_' + s.key, target: itemId, lineStyle: { width: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? 2 : 1.4, color: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? '#f97316' : s.color, type: 'dashed', opacity: /待查|缺失|待认定|不明|待确认|待补证/.test(item) ? 0.9 : 0.55 } });
    });
  });
  return { nodes, links };
}

function renderChainFlowChart(report, steps) {
  const dom = document.getElementById('chainFlowChart');
  if (!dom || typeof echarts === 'undefined') return;
  if (chainFlowChart) { chainFlowChart.dispose(); chainFlowChart = null; }
  chainFlowChart = echarts.init(dom);
  const data = buildChainGraphData(report, steps);
  chainFlowChart.setOption({
    tooltip: {
      formatter: function(params) {
        if (params.dataType === 'node') {
          const step = steps.find(s => s.key === params.data.stepKey);
          return '<div style="max-width:260px;"><strong>' + escapeHtml(step ? step.title : params.data.name) + '</strong><br>' + escapeHtml(params.data.itemValue || (step ? step.items.join('、') : '')) + '</div>';
        }
        return '链路推进';
      }
    },
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 12],
      data: data.nodes,
      links: data.links,
      label: { show: true, formatter: '{b}' },
      lineStyle: { opacity: 0.9 },
      emphasis: { focus: 'adjacency' }
    }]
  });
  chainFlowChart.off('click');
  chainFlowChart.on('click', function(params) {
    if (params.dataType === 'node' && params.data.stepKey) selectChainStep(params.data.stepKey);
  });
}

function renderChainEvidenceGroups(report) {
  const relations = Array.isArray(report && report.relations) ? report.relations : [];
  const groups = [
    ['person_drives_vehicle', '人车关系', '🚗'],
    ['person_commits_violation', '违法责任链', '❌'],
    ['vehicle_collides_vehicle', '车辆碰撞链', '💥'],
    ['person_has_injury', '伤亡后果链', '🩹'],
    ['person_bears_liability', '责任认定链', '⚖️'],
    ['chain_gap', '待补证缺口', '🕳️'],
    ['behavior_belongs_to_category', '过错分类证据', '🧭']
  ];
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:14px;">';
  groups.forEach(([type, title, icon]) => {
    const rows = relations.filter(r => r.type === type).slice(0, 8);
    html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:13px;">';
    html += '<div style="font-weight:900;color:#0f172a;margin-bottom:9px;">' + icon + ' ' + escapeHtml(title) + ' <span style="font-size:12px;color:#94a3b8;">' + rows.length + '</span></div>';
    if (!rows.length) {
      html += '<div style="font-size:12px;color:#94a3b8;line-height:1.6;">暂无明确抽取证据。</div>';
    } else {
      rows.forEach((r, idx) => {
        const globalIdx = relations.indexOf(r);
        const key = relationEvidenceKey(r, globalIdx >= 0 ? globalIdx : idx);
        const active = selectedEvidenceKey === key ? ' active' : '';
        html += '<div class="chain-evidence-item' + active + '" onclick="selectChainEvidence(\'' + escapeHtml(key) + '\')">';
        html += '<strong>' + escapeHtml(r.source) + '</strong> → <strong>' + escapeHtml(r.target) + '</strong><br>';
        html += '<span style="color:#64748b;">置信度 ' + Math.round((r.confidence || 0.75) * 100) + '% ｜ ' + escapeHtml(r.ruleId || '未标注') + (r.relationLevel === 'gap' ? ' ｜ 缺口提示' : ((r.confidence || 1) < 0.65 ? ' ｜ 弱推断' : '')) + ' ｜ 点击定位原文</span>';
        if (r.evidence) html += '<br><span style="color:#64748b;">' + escapeHtml(r.evidence).slice(0, 120) + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function refreshChainAccidentOptions() {
  const select = document.getElementById('chainAccidentSelect');
  if (!select || typeof accidentReports === 'undefined') return;
  const query = normalizeName(chainFilterText || (document.getElementById('chainSearchInput') || {}).value || '').toLowerCase();
  const rows = getSortedReports(accidentReports.filter(r => reportMatchesQuery(r, query))).slice(0, 200);
  let html = '';
  rows.forEach(r => {
    const id = getReportId(r, accidentReports.indexOf(r));
    html += '<option value="' + escapeHtml(id) + '">' + escapeHtml((r.date || '') + '｜' + (r.title || '未命名事故')) + '</option>';
  });
  select.innerHTML = html;
  if (!chainReportId) chainReportId = graphEntryReportId || getLatestReportId();
  if (chainReportId) select.value = chainReportId;
}

function applyChainReport() {
  const select = document.getElementById('chainAccidentSelect');
  chainReportId = select && select.value ? select.value : (chainReportId || getLatestReportId());
  selectedChainStepKey = '';
  selectedEvidenceKey = '';
  initChainView();
}

function selectChainStep(stepKey) {
  selectedChainStepKey = stepKey || selectedChainStepKey || 'factor';
  initChainView();
}

function syncChainWithGraph() {
  chainReportId = graphEntryReportId || getLatestReportId();
  refreshChainAccidentOptions();
  initChainView();
}

function initChainView() {
  const container = document.getElementById('chainContent');
  if (!container) return;
  const input = document.getElementById('chainSearchInput');
  if (input) chainFilterText = input.value || '';
  refreshChainAccidentOptions();
  const report = getReportByGraphId(chainReportId || getLatestReportId()) || accidentReports[0];
  if (!report) {
    container.innerHTML = '<div style="color:#94a3b8;padding:20px;">暂无报告数据。</div>';
    return;
  }
  const details = getReportFaultCategoryDetails(report);
  const steps = buildEventChain(report);
  if (!selectedChainStepKey) selectedChainStepKey = steps[0] && steps[0].key || 'factor';
  let html = '<div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">';
  html += '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:12px;">';
  html += '<div><div style="font-size:22px;font-weight:900;color:#0f172a;">🧬 图形化事故链路：' + escapeHtml(report.title || '未命名事故') + '</div><div style="font-size:13px;color:#64748b;margin-top:5px;">' + escapeHtml(report.date || '') + ' ｜ ' + escapeHtml(report.location || '') + ' ｜ ' + escapeHtml(report.type || '') + '</div></div>';
  html += '<button onclick="viewReportLocalGraph(\'' + escapeHtml(getReportId(report, accidentReports.indexOf(report))) + '\')" style="border:none;background:#2563eb;color:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:800;">跳转局部图谱</button>';
  html += '</div>';
  html += renderChainConfidenceCard(report, steps);
  html += renderChainGapCard(report, steps);
  html += renderChainStepStrip(steps, true);
  html += '<div class="chain-visual-layout">';
  html += '<div class="chain-graph-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="color:#1d4ed8;">流程图：从风险诱因到责任认定</strong><span style="font-size:12px;color:#64748b;">点击节点查看右侧证据</span></div><div id="chainFlowChart"></div></div>';
  html += renderChainStepDetail(report, steps);
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px;">';
  html += '<div class="detail-kv"><strong>过错大类：</strong>' + escapeHtml(details.map(d => d.category).join('、') || '待识别') + '</div>';
  html += '<div class="detail-kv"><strong>事故诱因：</strong>' + escapeHtml([...(report.faultFactors || []), ...details.flatMap(d => d.factors || [])].filter(Boolean).slice(0, 8).join('、') || '无明确诱因') + '</div>';
  html += '<div class="detail-kv"><strong>违法/过错：</strong>' + escapeHtml([...(report.violations || []), report.violation].filter(Boolean).slice(0, 8).join('、') || '待识别') + '</div>';
  html += '<div class="detail-kv"><strong>责任认定：</strong>' + escapeHtml(report.liability || '责任待定') + '</div>';
  const gapInfo = detectChainGapInfo(report, steps);
  html += '<div class="detail-kv"><strong>链路状态：</strong>' + escapeHtml(gapInfo.chainQuality) + ' ｜ ' + escapeHtml(gapInfo.weakReason || '无明显缺口') + '</div>';
  html += '</div>';
  html += renderChainEvidenceGroups(report);
  html += renderEvidenceOriginalText(report);
  html += '</div>';
  container.innerHTML = html;
  setTimeout(() => renderChainFlowChart(report, steps), 0);
}

function initClusters() {
  const container = document.getElementById('clusterContent');
  if (!container) return;
  const clusters = buildFaultCategoryClusters();
  const maxCount = Math.max(...clusters.map(c => c.count), 1);
  let html = buildFaultCategorySummary(clusters);
  const chainReport = graphEntryReportId ? getReportByGraphId(graphEntryReportId) : getReportByGraphId(getLatestReportId());
  html += renderEventChainPanel(chainReport);
  html += renderFaultFactorMatrix(clusters);
  html += '<div style="grid-column:1/-1;margin-bottom:2px;padding:12px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;color:#5b21b6;font-size:13px;line-height:1.6;"><strong>🧭 过错大类统计：</strong>按 parser 输出的 fault_category / legacy faultCategories 聚合；v3.3.2 已接入新闻短讯弱链路与缺口标注，原因待查/责任待认定/违法事实缺失会作为待补证节点展示。</div>';
  clusters.forEach(c => {
    const key = safeId(c.title);
    const expanded = expandedClusterKey === key;
    const meta = getFaultCategoryMeta(c.title);
    const behaviorSamples = topClusterItems(c.behaviors, 5);
    const factorSamples = topClusterItems(c.factors, 5);
    const roadSamples = topClusterItems(c.roads, 5);
    const injurySamples = topClusterItems(c.injuries, 4);
    const liabilitySamples = topClusterItems(c.liabilities, 4);
    const width = Math.max(6, Math.round(c.count / maxCount * 100));
    html += '<div class="cluster-card" onclick="toggleClusterDetail(\'' + escapeHtml(key) + '\')" style="border-color:' + meta.border + ';background:linear-gradient(180deg,#fff 0%,' + meta.bg + ' 100%);">';
    html += '<div class="cluster-header"><span class="cluster-title" style="color:' + meta.color + ';">' + meta.icon + ' ' + escapeHtml(c.title || '未分类原因') + '</span><span class="cluster-count" style="background:' + meta.color + ';">' + c.count + ' 起</span></div>';
    html += '<div style="height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden;margin:-3px 0 10px;"><div style="height:100%;width:' + width + '%;background:' + meta.color + ';border-radius:999px;"></div></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">';
    html += '<div style="padding:8px;background:#fff;border:1px solid ' + meta.border + ';border-radius:10px;"><div style="font-size:11px;color:#64748b;">占比</div><strong style="color:' + meta.color + ';font-size:18px;">' + c.percent + '%</strong></div>';
    html += '<div style="padding:8px;background:#fff;border:1px solid ' + meta.border + ';border-radius:10px;"><div style="font-size:11px;color:#64748b;">行为</div><strong style="color:#a855f7;font-size:18px;">' + c.behaviorCount + '</strong></div>';
    html += '<div style="padding:8px;background:#fff;border:1px solid ' + meta.border + ';border-radius:10px;"><div style="font-size:11px;color:#64748b;">诱因</div><strong style="color:#0891b2;font-size:18px;">' + c.factorCount + '</strong></div>';
    html += '</div>';
    html += '<div style="font-size:12px;color:#64748b;line-height:1.55;margin-bottom:8px;">' + escapeHtml(meta.desc) + '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px;">';
    html += '<div style="padding:9px;background:#fff;border-radius:10px;border:1px solid #ede9fe;"><strong style="font-size:12px;color:#7c3aed;">❌ 高频行为</strong>' + renderMiniBars(behaviorSamples, '#a855f7', '暂无行为样例') + '</div>';
    html += '<div style="padding:9px;background:#fff;border-radius:10px;border:1px solid #cffafe;"><strong style="font-size:12px;color:#0891b2;">🌧️ 事故诱因</strong>' + renderMiniBars(factorSamples, '#06b6d4', '暂无诱因样例') + '</div>';
    html += '</div>';
    html += '<div style="font-size:12px;color:#64748b;margin-top:9px;">重点路段：' + escapeHtml(roadSamples.map(x => x[0] + '×' + x[1]).join('、') || '待识别') + '</div>';
    html += '<div style="color:#64748b;font-size:13px;margin-top:4px;">点击' + (expanded ? '收起' : '展开') + '详情</div>';
    if (expanded) {
      const accidents = c.reports.slice().sort((a, b) => getReportTimeValue(b) - getReportTimeValue(a)).slice(0, 20);
      html += '<div class="cluster-detail" onclick="event.stopPropagation()">';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:10px;">';
      html += '<div style="padding:10px;background:#fffbeb;border-radius:8px;font-size:13px;color:#d97706"><strong>高频地点：</strong><br>' + escapeHtml(roadSamples.map(x => x[0] + '×' + x[1]).join('、') || '待识别') + '</div>';
      html += '<div style="padding:10px;background:#f0fdf4;border-radius:8px;font-size:13px;color:#047857"><strong>责任分布：</strong><br>' + escapeHtml(liabilitySamples.map(x => x[0] + '×' + x[1]).join('、') || '待识别') + '</div>';
      html += '<div style="padding:10px;background:#fef2f2;border-radius:8px;font-size:13px;color:#b91c1c"><strong>伤亡分布：</strong><br>' + escapeHtml(injurySamples.map(x => x[0] + '×' + x[1]).join('、') || '待识别') + '</div>';
      html += '</div>';
      html += '<div style="margin-bottom:10px;padding:10px;background:#eef2ff;border-radius:8px;font-size:13px;color:#4338ca"><strong>具体行为：</strong>' + escapeHtml(topClusterItems(c.behaviors, 12).map(x => x[0] + '×' + x[1]).join('、') || '暂无') + '<br><strong>事故诱因：</strong>' + escapeHtml(topClusterItems(c.factors, 12).map(x => x[0] + '×' + x[1]).join('、') || '暂无') + '</div>';
      html += '<div style="display:grid;gap:8px;">';
      accidents.forEach(r => {
        const faultBrief = getReportFaultCategoryDetails(r).map(d => d.category + '：' + [...new Set([...(d.behaviors || []), ...(d.factors || [])])].slice(0, 4).join('、')).join('；');
        html += '<div style="padding:9px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">';
        html += '<strong>' + escapeHtml(r.title || '未命名事故') + '</strong><br>';
        html += '<span style="font-size:12px;color:#64748b;">事故时间：' + escapeHtml(r.date || '') + ' ｜ 上传时间：' + escapeHtml(getUploadTime(r)) + ' ｜ 地点：' + escapeHtml(r.location || '') + '</span>';
        if (faultBrief) html += '<br><span style="font-size:12px;color:#6d28d9;">' + escapeHtml(faultBrief) + '</span>';
        html += '</div>';
      });
      if (c.count > accidents.length) html += '<div style="font-size:12px;color:#94a3b8;">仅展示前 ' + accidents.length + ' 起，报告库可查看全部。</div>';
      html += '</div></div>';
    }
    html += '</div>';
  });
  container.innerHTML = html;
}


// ==================== 5. 报告解析功能 ====================
function initUpload() {
  // 报告解析页面初始化
}

// 全局变量：存储当前解析的实体
let currentParsedReport = null;

function uniqueNormalizedEntities(type, values, limit) {
  const seen = new Set();
  const out = [];
  (values || []).forEach(v => {
    const n = normalizeEntityName(type, v);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  });
  return typeof limit === 'number' ? out.slice(0, limit) : out;
}

function extractReportDate(text) {
  const m = text.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日(?:[^0-9零一二三四五六七八九十]{0,8})?(?:(\d{1,2})[时:：](\d{1,2})?分?)?/);
  if (!m) return new Date().toISOString().slice(0, 16).replace('T', ' ');
  const pad = n => String(n || '00').padStart(2, '0');
  return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]) + ' ' + pad(m[4] || '00') + ':' + pad(m[5] || '00');
}

function extractReportLocation(text, roads) {
  const road = roads && roads[0] ? roads[0] : '';
  const m = text.match(/(?:在|于|行驶至|经过)([^，。；;]{2,60}(?:高速|公路|大道|国道|省道|路|街|桥|隧道|交叉口|路口|匝道)[^，。；;]*)/);
  return normalizeName(m && m[1] ? m[1] : road || '未知地点');
}

function extractLiability(text) {
  const m = text.match(/(负全部责任|负主要责任|负次要责任|全部责任|主要责任|次要责任|责任待定|无责任)/);
  return m ? m[1].replace(/^负/, '') : '责任待定';
}

function inferAccidentType(entities) {
  const v = (entities.violations && entities.violations[0]) || '';
  const map = [
    ['追尾', '追尾'], ['闯红灯', '闯红灯'], ['闯黄灯', '闯黄灯'], ['酒驾', '酒驾'], ['醉驾', '酒驾'],
    ['疲劳驾驶', '疲劳驾驶'], ['逆行', '逆行'], ['变道', '变道剐蹭'], ['剐蹭', '变道剐蹭'], ['超速', '超速']
  ];
  const hit = map.find(([k]) => v.includes(k));
  return hit ? hit[1] : (v || '解析入库事故');
}

function inferAccidentLevel(injury) {
  if (/死亡|重伤/.test(injury || '')) return '较大事故';
  if (/无人员伤亡/.test(injury || '')) return '轻微事故';
  return '一般事故';
}

function buildStructuredReport(text, entities) {
  const road = extractRoadName(entities.location || (entities.roads && entities.roads[0]) || '未知地点');
  const type = inferAccidentType(entities);
  const id = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const injury = entities.injuries && entities.injuries.length ? entities.injuries.join('，') : '伤亡情况待核实';
  const report = {
    id,
    title: road + type + '事故报告（解析入库）',
    date: entities.date || extractReportDate(text),
    location: entities.location || extractReportLocation(text, entities.roads),
    weather: entities.weather || '天气待核实',
    violation: (entities.violations && entities.violations[0]) || '原因待识别',
    faultCategories: entities.faultCategories || [],
    faultCategoryDetails: entities.faultCategoryDetails || [],
    faultFactors: entities.faultFactors || [],
    injury,
    liability: entities.liability || extractLiability(text),
    persons: uniqueNormalizedEntities('person', entities.persons || [], 10),
    vehicles: uniqueNormalizedEntities('vehicle', entities.vehicles || [], 10),
    description: text,
    creator: '解析入库',
    source: 'server-json',
    uploadedAt: nowUploadTime(),
    type,
    level: inferAccidentLevel(injury),
    parserType: 'v3.3.2-gap-aware-chain'
  };
  if (entities.advanced) {
    const legacy = window.TrafficParser ? TrafficParser.legacyEntitiesFromAdvanced(entities.advanced) : {};
    const gapInfo = detectChainGapInfo({ ...report, entityDetails: entities.advanced.entities || [], relations: entities.advanced.relations || [] }, []);
    report.entityDetails = entities.advanced.entities || [];
    report.relations = [...(entities.advanced.relations || []), ...(gapInfo.gaps || []).map(g => ({ type: 'chain_gap', source: id, target: g.label, confidence: g.level === 'pending' ? 0.52 : 0.42, evidence: g.desc, ruleId: 'v332-chain-gap-' + g.key, relationLevel: 'gap', gapKey: g.key, gapLevel: g.level, suggestion: g.suggestion }))];
    report.chainGapAnalysis = gapInfo;
    report.chainGaps = gapInfo.gaps || [];
    report.chainStatus = gapInfo.chainStatus;
    report.chainQuality = gapInfo.chainQuality;
  }
  return report;
}


function extractSection(text, title) {
  const re = new RegExp('【' + title + '】([\\s\\S]*?)(?=【[^】]+】|$)');
  const m = text.match(re);
  return normalizeName(m && m[1] ? m[1] : '');
}

function splitTypicalCases(text) {
  const matches = [...text.matchAll(/(?:^|\n)\s*案例(\d+)\s+([^\n]+?)\s*(?=\n\s*【基本案情】)/g)];
  if (!matches.length) return [];
  return matches.map((m, idx) => {
    const start = m.index + (m[0].startsWith('\n') ? 1 : 0);
    const end = idx + 1 < matches.length ? matches[idx + 1].index : text.length;
    const chunk = text.slice(start, end).trim();
    const titleLine = '案例' + m[1] + ' ' + m[2].trim();
    return { caseNo: m[1], titleLine, text: chunk };
  });
}

const COMMON_CHINESE_SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉龚程邢裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘斜厉戎祖武符刘景詹束龙叶幸司韶黎乔苍闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公仉督岳帅缑亢况郈有琴归海晋楚闫法汝鄢涂钦商牟佘佴伯赏墨哈谯笪年爱阳佟';

function extractMaskedPersons(text) {
  const re = new RegExp('[' + COMMON_CHINESE_SURNAMES + ']某某?', 'g');
  const names = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = m[0];
    if (n === '某某') continue;
    names.push(n);
  }
  return [...new Set(names)].slice(0, 12);
}

function extractVehicleLikeEntities(text) {
  const vehicles = [];
  const plateMatches = text.match(/[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼]\s*[A-Za-z]\s*[A-Za-z0-9]{5}/g) || [];
  plateMatches.forEach(v => vehicles.push(v));
  ['机动车', '非机动车', '电动自行车', '二轮摩托车', '网约车', '网络预约出租汽车'].forEach(v => {
    if (text.includes(v)) vehicles.push(v);
  });
  return uniqueNormalizedEntities('vehicle', vehicles, 10);
}

function inferViolationFromLegalCase(text, title) {
  const candidates = [
    '开车门未确保安全', '未紧靠道路右侧停车', '好意同乘', '未系安全带', '逆向行驶',
    '操作不当', '操作不规范', '未按照交通信号灯通行', '闯红灯', '非机动车闯红灯',
    '路救基金追偿', '网约车承运人责任', '电动自行车逆向行驶'
  ];
  const hits = [];
  candidates.forEach(k => { if ((text.includes(k) || title.includes(k)) && !hits.includes(k)) hits.push(k); });
  if (/开门|车门/.test(text + title) && !hits.includes('开车门未确保安全')) hits.unshift('开车门未确保安全');
  if (/逆向行驶/.test(text + title) && !hits.includes('逆向行驶')) hits.unshift('逆向行驶');
  if (/信号灯|闯红灯/.test(text + title) && !hits.includes('未按照交通信号灯通行')) hits.unshift('未按照交通信号灯通行');
  if (/网约车/.test(text + title) && !hits.includes('网约车运营安全责任')) hits.unshift('网约车运营安全责任');
  if (/路救基金/.test(text + title) && !hits.includes('路救基金垫付追偿')) hits.unshift('路救基金垫付追偿');
  return hits[0] || '交通事故责任纠纷';
}

function inferCaseType(title, fact) {
  const text = title + ' ' + fact;
  if (/开门|车门/.test(text)) return '开门杀责任纠纷';
  if (/好意同乘/.test(text)) return '好意同乘责任纠纷';
  if (/电动自行车|非机动车/.test(text) && /逆向/.test(text)) return '非机动车逆行责任纠纷';
  if (/网约车/.test(text)) return '网约车乘客损害责任纠纷';
  if (/路救基金/.test(text)) return '路救基金追偿纠纷';
  if (/信号灯|行政处罚|罚款/.test(text)) return '非机动车信号灯违法处罚';
  return '交通事故责任纠纷典型案例';
}

function extractCaseLiability(text) {
  const parts = [];
  const name = '[' + COMMON_CHINESE_SURNAMES + ']某某?';
  const patterns = [
    new RegExp(name + '负事故(?:全部|主要|次要)责任', 'g'),
    new RegExp(name + '无责任', 'g'),
    new RegExp(name + '承担\\d+%赔偿责任', 'g'),
    new RegExp(name + '承担(?:全部|主要|次要|同等)责任', 'g'),
    /某保险公司[^。；]*赔偿责任/g,
    /某科技公司[^。；]*承担赔偿责任/g
  ];
  patterns.forEach(re => (text.match(re) || []).forEach(x => parts.push(x)));
  return [...new Set(parts)].slice(0, 8).join('；') || extractLiability(text);
}

function extractCaseInjury(text) {
  const hits = [];
  ['受伤', '车辆受损', '右手粉碎性骨折', '人身损害', '车辆损坏', '医疗费', '残疾赔偿金'].forEach(k => { if (text.includes(k)) hits.push(k); });
  return hits.length ? [...new Set(hits)].slice(0, 4).join('，') : '损害后果见裁判文书';
}


function chineseCaseNoToNumber(value) {
  const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十') return 10;
  if (value.startsWith('十')) return 10 + (map[value.slice(1)] || 0);
  if (value.includes('十')) {
    const [a, b] = value.split('十');
    return (map[a] || 1) * 10 + (map[b] || 0);
  }
  return map[value] || value;
}

function splitInlineTypicalCases(text) {
  const re = /(?:^|\n)\s*案例([一二三四五六七八九十\d]+)\s*[：:]/g;
  const matches = [...text.matchAll(re)];
  if (!matches.length) return [];
  return matches.map((m, idx) => {
    const start = m.index + m[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index : text.length;
    const body = text.slice(start, end).trim();
    const no = String(chineseCaseNoToNumber(m[1]));
    return { caseNo: no, titleLine: '案例' + m[1] + ' ' + body.slice(0, 36).replace(/\s+/g, ''), text: body };
  }).filter(item => item.text.length >= 20);
}

function inferInlineViolation(text) {
  const quoted = [...text.matchAll(/违反了?[“\"]([^”\"]+)[”\"](?:的规定|之规定)?/g)].map(m => m[1]);
  if (quoted.length) return quoted[0].replace(/[，,。；;]$/g, '').slice(0, 36);
  const rules = [
    ['连续超车', '连续超车/加速超车'], ['加速超车', '连续超车/加速超车'], ['操作不当', '操作不当'],
    ['红灯亮时禁止车辆通行', '闯红灯'], ['闯红灯', '闯红灯'], ['借道通行', '借道通行未让行'],
    ['未按规定掉头', '未按规定掉头'], ['未按规定让行', '未按规定让行'], ['未确保安全', '未确保安全行驶'],
    ['瞭望不周', '瞭望不周'], ['进入环岛', '环岛未让行'], ['环形路口', '环岛未让行'], ['相撞', '碰撞事故']
  ];
  const hit = rules.find(([k]) => text.includes(k));
  return hit ? hit[1] : '交通违法引发事故';
}

function extractInlineLocation(text) {
  const m = text.match(/(?:在|沿|行驶至)([^，。；;]{2,90}(?:处|路口|路段|国道|公里|米处|街|路|线|市|区|县|出口))/);
  let loc = normalizeName(m && m[1] ? m[1] : '');
  if (!loc) {
    const m2 = text.match(/在([^，。；;]{2,50})，/);
    loc = normalizeName(m2 && m2[1] ? m2[1] : '吉林省典型案例');
  }
  loc = loc
    .replace(/与[赵钱孙李周吴郑王冯陈杨朱黄高刘林路廉贺唐袁姜郝金孙王于][某]{1,2}.*$/g, '')
    .replace(/与路$/g, '')
    .replace(/发生交通事故.*$/g, '')
    .replace(/[，,。；;：:]$/g, '')
    .trim();
  return loc || '吉林省典型案例';
}

function extractInlinePersons(text) {
  const names = extractMaskedPersons(text);
  const passenger = [...text.matchAll(/乘车人([^，。；;]{1,8})/g)].map(m => m[1]).filter(x => /某/.test(x));
  return uniqueNormalizedEntities('person', [...names, ...passenger], 12);
}

function extractInlineVehicles(text) {
  const vehicles = [];
  const vehicleTypes = ['小型普通客车', '重型半挂牵引车', '普通二轮摩托车', '二轮摩托车', '二轮电动车', '三轮电动车', '小型轿车', '小型汽车', '越野车', '机动车', '非机动车'];
  vehicleTypes.forEach(v => { if (text.includes(v)) vehicles.push(v); });
  return uniqueNormalizedEntities('vehicle', vehicles, 12);
}

function normalizeResponsibilityText(role) {
  if (/无责任/.test(role)) return '无责任';
  if (/全部责任/.test(role)) return '负全部责任';
  if (/主要责任/.test(role)) return '负主要责任';
  if (/次要责任/.test(role)) return '负次要责任';
  if (/同等责任/.test(role)) return '负同等责任';
  return role;
}

function extractInlineLiability(text) {
  const parts = [];
  const persons = extractInlinePersons(text);
  persons.forEach(person => {
    const re = new RegExp(person + '[^。；]{0,80}?(负事故全部责任|负事故主要责任|负事故次要责任|负全部责任|负主要责任|负次要责任|应负此起事故的全部责任|应负此起事故的主要责任|应负次要责任|承担全部责任|承担主要责任|承担次要责任|无责任)', 'g');
    const m = re.exec(text);
    if (m) parts.push(person + normalizeResponsibilityText(m[1]));
  });
  return [...new Set(parts)].join('；') || extractCaseLiability(text);
}

function extractInlineInjury(text) {
  const hits = [];
  ['多处受伤', '受伤', '被撞飞', '车辆损坏', '车辆受损', '两车损坏'].forEach(k => { if (text.includes(k)) hits.push(k); });
  return hits.length ? [...new Set(hits)].join('，') : '事故损害待核实';
}

function inferInlineType(text, violation) {
  if (/超车/.test(text + violation)) return '超车碰撞';
  if (/红灯|信号灯/.test(text + violation)) return '闯红灯碰撞';
  if (/借道/.test(text + violation)) return '借道通行事故';
  if (/掉头/.test(text + violation)) return '掉头剐蹭';
  if (/让行/.test(text + violation)) return '未让行事故';
  if (/行人/.test(text)) return '机动车碰撞行人';
  if (/半挂牵引车/.test(text)) return '货车相撞';
  if (/环岛|环形路口/.test(text + violation)) return '环岛碰撞';
  return '交通违法典型事故';
}

function buildInlineCaseReports(text) {
  const cases = splitInlineTypicalCases(text);
  if (cases.length <= 1) return [];
  return cases.map(item => {
    const caseText = item.text;
    const violation = inferInlineViolation(caseText);
    const type = inferInlineType(caseText, violation);
    const location = extractInlineLocation(caseText);
    const date = extractReportDate(caseText);
    const persons = extractInlinePersons(caseText);
    const vehicles = extractInlineVehicles(caseText);
    const title = '案例' + item.caseNo + ' ' + location + type;
    return {
      id: 'local-inline-case-' + Date.now() + '-' + item.caseNo + '-' + Math.random().toString(36).slice(2, 6),
      title,
      date,
      location,
      weather: '天气待核实',
      violation,
      injury: extractInlineInjury(caseText),
      liability: extractInlineLiability(caseText),
      persons,
      vehicles,
      description: '案例' + item.caseNo + '：' + caseText,
      creator: '解析入库',
      source: 'server-json',
      uploadedAt: nowUploadTime(),
      type,
      level: /多处受伤|受伤|被撞飞/.test(caseText) ? '典型事故-人员受伤' : '典型事故',
      caseNo: item.caseNo
    };
  });
}

function buildTypicalCaseReports(text) {
  const inlineReports = buildInlineCaseReports(text);
  if (inlineReports.length > 1) return inlineReports;
  const cases = splitTypicalCases(text);
  if (!cases.length) return [];
  const sourceDate = extractReportDate(text);
  return cases.map(item => {
    const fact = extractSection(item.text, '基本案情');
    const judgment = extractSection(item.text, '裁判结果');
    const meaning = extractSection(item.text, '典型意义');
    const title = item.titleLine.replace(/\s+/g, ' ');
    const persons = uniqueNormalizedEntities('person', extractMaskedPersons(fact + ' ' + title + ' ' + judgment), 12);
    const violation = inferViolationFromLegalCase(fact + ' ' + judgment, title);
    const type = inferCaseType(title, fact);
    return {
      id: 'local-case-' + Date.now() + '-' + item.caseNo + '-' + Math.random().toString(36).slice(2, 6),
      title,
      date: sourceDate,
      location: '最高人民法院典型案例',
      weather: '不适用',
      violation,
      injury: extractCaseInjury(fact),
      liability: extractCaseLiability(fact + ' ' + judgment),
      persons,
      vehicles: extractVehicleLikeEntities(fact + ' ' + title),
      description: item.text,
      creator: '解析入库',
      source: 'server-json',
      uploadedAt: nowUploadTime(),
      type,
      level: /死亡|重伤|粉碎性骨折|残疾/.test(fact + judgment) ? '典型案例-人身损害' : '典型案例',
      caseNo: item.caseNo,
      caseFact: fact,
      caseJudgment: judgment,
      caseMeaning: meaning
    };
  });
}

function mergeEntityList(primary, secondary, limit) {
  return uniqueNormalizedEntities('person', [...(primary || []), ...(secondary || [])], limit || 30);
}

function mergeTypedList(type, primary, secondary, limit) {
  return uniqueNormalizedEntities(type, [...(primary || []), ...(secondary || [])], limit || 30);
}

function extractEntitiesFromTextLegacy(text) {
  const entities = {
    persons: [], vehicles: [], roads: [], violations: [], injuries: [], weather: null, date: '', location: '', liability: '', type: ''
  };
  const maskedPersons = extractMaskedPersons(text);
  const personMatches = text.match(/[张王李赵刘陈杨黄周吴徐孙马朱胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤][某明伟芳娜强敏杰磊涛勇杰军强平刚辉]?/g);
  entities.persons = uniqueNormalizedEntities('person', [...maskedPersons, ...((personMatches || []).filter(p => p && p.length >= 2 && p.length <= 4))], 12);
  entities.vehicles = extractVehicleLikeEntities(text);
  const roadKeywords = ['高速', '路', '大道', '街', '国道', '省道', '交叉口', '路口', '匝道'];
  roadKeywords.forEach(keyword => {
    const regex = new RegExp(`[\\u4e00-\\u9fa50-9]+${keyword}`, 'g');
    const matches = text.match(regex);
    if (matches) entities.roads = uniqueNormalizedEntities('road', [...entities.roads, ...matches]);
  });
  const violationKeywords = ['开车门未确保安全', '未紧靠道路右侧停车', '未保持安全车距', '闯红灯', '未按照交通信号灯通行', '闯黄灯', '超速行驶', '超速', '违规变道', '变道', '剐蹭', '醉酒驾驶', '酒驾', '醉驾', '疲劳驾驶', '逆向行驶', '逆行', '未减速', '操作不当', '操作不规范', '未系安全带', '追尾'];
  violationKeywords.forEach(keyword => { if (text.includes(keyword) && !entities.violations.includes(keyword)) entities.violations.push(keyword); });
  const inferredLegal = inferViolationFromLegalCase(text, '');
  if (inferredLegal && inferredLegal !== '交通事故责任纠纷' && !entities.violations.includes(inferredLegal)) entities.violations.unshift(inferredLegal);
  const weatherKeywords = ['暴雨', '大雨', '中雨', '小雨', '多云', '晴', '阴', '雪', '雾', '霾'];
  weatherKeywords.forEach(keyword => { if (text.includes(keyword) && !entities.weather) entities.weather = keyword; });
  const injuryMatches = text.match(/(轻微伤|轻伤|重伤|死亡|骨折|受伤|人身损害)[0-9零一二三四五六七八九十]*人?/g);
  if (injuryMatches) entities.injuries = [...new Set(injuryMatches)];
  if (!entities.injuries.length && /无人员伤亡/.test(text)) entities.injuries = ['无人员伤亡'];
  entities.date = extractReportDate(text);
  entities.location = extractReportLocation(text, entities.roads);
  entities.liability = extractCaseLiability(text);
  entities.type = inferAccidentType(entities);
  return entities;
}

function extractEntitiesFromText(text) {
  const legacy = extractEntitiesFromTextLegacy(text);
  if (!window.TrafficParser) return legacy;
  try {
    const advanced = TrafficParser.extractEntities(text);
    const parsed = TrafficParser.legacyEntitiesFromAdvanced(advanced);
    const entities = {
      persons: mergeTypedList('person', parsed.persons, legacy.persons, 30),
      vehicles: mergeTypedList('vehicle', parsed.vehicles, legacy.vehicles, 30),
      roads: mergeTypedList('road', parsed.roads, legacy.roads, 30),
      violations: mergeTypedList('violation', parsed.violations, legacy.violations, 30),
      injuries: [...new Set([...(parsed.injuries || []), ...(legacy.injuries || [])])],
      weather: parsed.weather || legacy.weather,
      date: parsed.date || legacy.date,
      location: parsed.location || legacy.location,
      liability: parsed.liability || legacy.liability,
      type: parsed.type || legacy.type,
      advanced,
      lowConfidenceEntities: advanced.entities.filter(e => e.confidence < 0.7),
      roadConditions: parsed.roadConditions || [],
      vehicleAttrs: parsed.vehicleAttrs || [],
      faultCategories: parsed.faultCategories || [],
      faultCategoryDetails: parsed.faultCategoryDetails || [],
      faultFactors: parsed.faultFactors || []
    };
    if (!entities.location) entities.location = extractReportLocation(text, entities.roads);
    if (!entities.type) entities.type = inferAccidentType(entities);
    return entities;
  } catch (err) {
    console.warn('TrafficParser 解析失败，回退旧解析器：', err);
    return legacy;
  }
}

// 解析报告文本
function parseReport() {
  const text = document.getElementById('reportText').value.trim();
  if (!text) {
    alert('请先输入报告文本！');
    return;
  }

  const caseReports = buildTypicalCaseReports(text);
  if (caseReports.length > 1) {
    const aggregateEntities = {
      persons: uniqueNormalizedEntities('person', caseReports.flatMap(r => r.persons || []), 30),
      vehicles: uniqueNormalizedEntities('vehicle', caseReports.flatMap(r => r.vehicles || []), 30),
      roads: [...new Set(caseReports.map(r => r.location).filter(Boolean))],
      violations: [...new Set(caseReports.map(r => r.violation).filter(Boolean))],
      injuries: [...new Set(caseReports.map(r => r.injury).filter(Boolean))],
      weather: '不适用',
      date: caseReports[0].date,
      location: '最高人民法院典型案例',
      liability: '多案例责任认定，见各案例裁判结果',
      type: '典型案例合集'
    };
    currentParsedReport = { text, entities: aggregateEntities, reports: caseReports, report: caseReports[0], isBatch: true, source: 'rule' };
    window.__lastRuleParse = currentParsedReport;
    displayParseResult(aggregateEntities);
    return;
  }

  const entities = extractEntitiesFromText(text);
  const structuredReport = buildStructuredReport(text, entities);
  currentParsedReport = { text, entities, report: structuredReport, reports: [structuredReport], isBatch: false, source: 'rule' };
  window.__lastRuleParse = currentParsedReport;
  displayParseResult(entities);
}

// v3.4.8: 用 AI 解析（调用火山方舟 Coding Plan）— 手动触发，不影响主 parser 链路
async function parseReportByLLM() {
  const text = document.getElementById('reportText').value.trim();
  if (!text) { alert('请先输入报告文本！'); return; }
  const btn = document.getElementById('btnParseByLLM');
  const badge = document.getElementById('parseSourceBadge');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⚙️ AI 解析中…'; btn.style.opacity = '0.7'; }
  if (badge) badge.innerHTML = '<span style="color:#7c3aed;">🤖 正在调用火山方舟 Coding Plan，首次抽取约 3-6 秒，命中本地缓存将瞬回…</span>';
  try {
    const resp = await fetch('/api/llm/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    const data = payload.data || {};
    const ai = data.entities || {};
    const entities = {
      persons: Array.isArray(ai.persons) ? ai.persons : [],
      vehicles: Array.isArray(ai.vehicles) ? ai.vehicles : [],
      roads: Array.isArray(ai.roads) ? ai.roads : [],
      violations: ai.violation ? [ai.violation] : [],
      injuries: ai.injury ? [ai.injury] : [],
      weather: ai.weather || '',
      date: ai.date || '',
      location: ai.location || (ai.roads && ai.roads[0]) || '',
      liability: ai.liability || '',
      type: ai.type || '',
      faultCategories: [], faultCategoryDetails: [], faultFactors: []
    };
    const rid = 'llm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const injury = ai.injury || '伤亡情况待核实';
    const structuredReport = {
      id: rid,
      title: ai.title || ((ai.location || '未知地点') + (ai.type || '交通事故') + '报告（AI 解析）'),
      date: ai.date || '',
      location: ai.location || (ai.roads && ai.roads[0]) || '未知地点',
      weather: ai.weather || '天气待核实',
      violation: ai.violation || '原因待识别',
      faultCategories: [], faultCategoryDetails: [], faultFactors: [],
      injury,
      liability: ai.liability || '责任认定待核实',
      persons: uniqueNormalizedEntities('person', ai.persons || [], 20),
      vehicles: uniqueNormalizedEntities('vehicle', ai.vehicles || [], 20),
      description: text,
      creator: 'AI 解析入库',
      source: 'server-json',
      uploadedAt: (typeof nowUploadTime === 'function' ? nowUploadTime() : new Date().toISOString()),
      type: ai.type || '交通事故',
      level: ai.level || '一般事故',
      parserType: 'llm-ark-code-latest'
    };
    currentParsedReport = { text, entities, report: structuredReport, reports: [structuredReport], isBatch: false, source: 'llm', llmMeta: { model: data.model, usage: data.usage, ms: data.ms, cached: !!data.cached } };
    window.__lastLLMParse = currentParsedReport;
    if (badge) {
      const u = data.usage || {};
      badge.innerHTML = '<span style="color:#7c3aed;">🤖 AI 解析完成 · 底层模型 <b>' + escapeHtml(data.model || 'auto') + '</b> · 耗时 ' + (data.ms || 0) + ' ms · tokens ' + (u.total_tokens || '?') + ' (prompt ' + (u.prompt_tokens || '?') + ' / completion ' + (u.completion_tokens || '?') + ')' + (data.cached ? ' · ✅ 本地缓存命中' : '') + '</span>';
    }
    displayParseResult(entities);
  } catch (err) {
    console.error('AI 解析失败', err);
    if (badge) badge.innerHTML = '<span style="color:#dc2626;">❌ AI 解析失败：' + escapeHtml(err.message || String(err)) + '</span>';
    alert('AI 解析失败：' + (err.message || err));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '🤖 用 AI 解析'; btn.style.opacity = '1'; }
  }
}

// 显示解析结果：v2.8 升级为可编辑校对表单
function reportInputValue(idx, field) {
  const el = document.getElementById('review_' + idx + '_' + field);
  return el ? el.value.trim() : '';
}

function splitListValue(value) {
  return String(value || '').split(/[、,，\n]/).map(s => s.trim()).filter(Boolean);
}

function collectReviewedReports() {
  if (!currentParsedReport || !currentParsedReport.reports) return [];
  return currentParsedReport.reports.map((oldReport, idx) => {
    const reviewed = {
      ...oldReport,
      title: reportInputValue(idx, 'title') || oldReport.title,
      date: reportInputValue(idx, 'date') || oldReport.date,
      location: reportInputValue(idx, 'location') || oldReport.location,
      type: reportInputValue(idx, 'type') || oldReport.type,
      level: reportInputValue(idx, 'level') || oldReport.level,
      weather: reportInputValue(idx, 'weather') || oldReport.weather,
      violation: reportInputValue(idx, 'violation') || oldReport.violation,
      faultCategories: oldReport.faultCategories || [],
      faultCategoryDetails: oldReport.faultCategoryDetails || [],
      faultFactors: oldReport.faultFactors || [],
      injury: reportInputValue(idx, 'injury') || oldReport.injury,
      liability: reportInputValue(idx, 'liability') || oldReport.liability,
      persons: splitListValue(reportInputValue(idx, 'persons')),
      vehicles: splitListValue(reportInputValue(idx, 'vehicles')),
      description: reportInputValue(idx, 'description') || oldReport.description,
      source: 'server-json',
      creator: oldReport.creator || (currentParsedReport.source === 'llm' ? 'AI 解析入库' : '解析入库'),
      // v3.4.8: 尊重 oldReport.parserType（AI 解析时为 llm-ark-code-latest），不再硬编码规则版本
      parserType: oldReport.parserType || (currentParsedReport.isBatch ? 'multi-case-v332-gap-aware' : 'v3.3.2-gap-aware-chain')
    };
    return reviewed;
  }).filter(r => !r._skip);
}

function renderReviewForm(reports) {
  let html = '<div style="margin-top:18px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">';
  html += '<div style="font-weight:800;color:#1e293b;margin-bottom:8px;">🧾 入库前字段校对</div>';
  html += '<div style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:12px;">请确认/修改字段后再入库。多人名、车辆可用顿号、逗号或换行分隔。</div>';
  reports.forEach((report, idx) => {
    html += '<details open style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;">';
    html += '<summary style="cursor:pointer;font-weight:800;color:#2563eb;">' + (idx + 1) + '. ' + escapeHtml(report.title || '未命名报告') + '</summary>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;">';
    const input = (field, label, value) => '<label style="font-size:12px;color:#475569;font-weight:700;">' + label + '<input id="review_' + idx + '_' + field + '" value="' + escapeHtml(value || '') + '" style="width:100%;margin-top:4px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;"></label>';
    html += input('title', '标题', report.title);
    html += input('date', '事故时间', report.date);
    html += input('location', '地点', report.location);
    html += input('type', '事故类型', report.type);
    html += input('level', '等级', report.level);
    html += input('weather', '天气', report.weather);
    html += input('violation', '违法/争议', report.violation);
    const faultText = getReportFaultCategoryDetails(report).map(d => d.category + '：' + [...new Set([...(d.behaviors || []), ...(d.factors || [])])].join('、')).join('；');
    if (faultText) html += '<div style="grid-column:1/-1;padding:9px 10px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;font-size:12px;color:#5b21b6;"><strong>过错大类：</strong>' + escapeHtml(faultText) + '</div>';
    if (report.chainGaps && report.chainGaps.length) html += '<div style="grid-column:1/-1;padding:9px 10px;background:#fff7ed;border:1px dashed #fb923c;border-radius:8px;font-size:12px;color:#9a3412;"><strong>待补证缺口：</strong>' + escapeHtml(report.chainGaps.map(g => g.label).join('、')) + '</div>';
    html += input('injury', '伤亡', report.injury);
    html += input('liability', '责任认定', report.liability);
    html += input('persons', '当事人', (report.persons || []).join('、'));
    html += input('vehicles', '车辆', (report.vehicles || []).join('、'));
    html += '</div>';
    html += '<label style="display:block;font-size:12px;color:#475569;font-weight:700;margin-top:10px;">正文/案情<textarea id="review_' + idx + '_description" style="width:100%;height:90px;margin-top:4px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;">' + escapeHtml(report.description || '') + '</textarea></label>';
    html += '</details>';
  });
  html += '</div>';
  return html;
}

function displayParseResult(entities) {
  const container = document.getElementById('parsedEntities');
  const resultDiv = document.getElementById('parseResult');
  const src = (currentParsedReport && currentParsedReport.source) || 'rule';
  const hasRule = !!window.__lastRuleParse;
  const hasLLM  = !!window.__lastLLMParse;
  const srcLabel = src === 'llm'
    ? '<span style="display:inline-block;padding:3px 10px;background:#ede9fe;color:#5b21b6;border-radius:999px;font-size:12px;font-weight:800;">🤖 当前结果来自：AI 解析</span>'
    : '<span style="display:inline-block;padding:3px 10px;background:#dbeafe;color:#1d4ed8;border-radius:999px;font-size:12px;font-weight:800;">🔍 当前结果来自：规则解析</span>';
  let head = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' + srcLabel;
  if (hasRule && hasLLM) head += '<button onclick="showParseCompare()" style="padding:5px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:999px;font-size:12px;font-weight:700;color:#334155;cursor:pointer;">🔀 查看规则 vs AI 对比</button>';
  if (src === 'rule' && !hasLLM) head += '<span style="font-size:12px;color:#94a3b8;">如果漏抽实体或结果不理想，可点击 <b>🤖 用 AI 解析</b> 对比</span>';
  if (src === 'llm' && !hasRule) head += '<span style="font-size:12px;color:#94a3b8;">可点击 <b>🔍 规则解析</b> 对比结果</span>';
  head += '</div>';
  let html = head + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">';
  html += '<div style="padding:15px;background:#dbeafe;border-radius:8px;"><div style="font-weight:600;color:#1d4ed8;margin-bottom:8px;">👤 当事人 (' + entities.persons.length + ')</div><div style="color:#3b82f6;font-size:13px;">' + escapeHtml(entities.persons.length ? entities.persons.join('、') : '未识别') + '</div></div>';
  html += '<div style="padding:15px;background:#fee2e2;border-radius:8px;"><div style="font-weight:600;color:#dc2626;margin-bottom:8px;">🚗 车辆 (' + entities.vehicles.length + ')</div><div style="color:#ef4444;font-size:13px;">' + escapeHtml(entities.vehicles.length ? entities.vehicles.join('、') : '未识别') + '</div></div>';
  html += '<div style="padding:15px;background:#fef3c7;border-radius:8px;"><div style="font-weight:600;color:#d97706;margin-bottom:8px;">🛣️ 道路 (' + entities.roads.length + ')</div><div style="color:#f59e0b;font-size:13px;">' + escapeHtml(entities.roads.length ? entities.roads.join('、') : '未识别') + '</div></div>';
  const faultCategoryDetails = entities.faultCategoryDetails || [];
  html += '<div style="padding:15px;background:#f5f3ff;border-radius:8px;grid-column:1/-1;"><div style="font-weight:600;color:#5b21b6;margin-bottom:8px;">🧭 过错大类 (' + (entities.faultCategories || []).length + ')</div><div style="color:#6d28d9;font-size:13px;line-height:1.7;">' + escapeHtml(faultCategoryDetails.length ? faultCategoryDetails.map(d => d.category + '：' + [...new Set([...(d.behaviors || []), ...(d.factors || [])])].slice(0, 6).join('、')).join('；') : '未识别') + '</div></div>';
  html += '</div>';
  if (currentParsedReport && currentParsedReport.reports) {
    if (entities.advanced) {
      const previewReport = currentParsedReport && currentParsedReport.report ? currentParsedReport.report : null;
      const gapInfo = previewReport ? detectChainGapInfo(previewReport, []) : null;
      const low = entities.lowConfidenceEntities || [];
      html += '<div style="margin-top:15px;padding:14px;background:#eff6ff;border-radius:8px;color:#1e40af;font-size:13px;line-height:1.7;">';
      html += '<strong>🧠 v2.8.5 高级解析：</strong>文档类型 ' + escapeHtml(entities.advanced.documentType) + ' ｜ 切句 ' + entities.advanced.sentences.length + ' 句 ｜ 句子级实体 ' + entities.advanced.entities.length + ' 个';
      if (entities.roadConditions && entities.roadConditions.length) html += '<br>道路条件：' + escapeHtml(entities.roadConditions.join('、'));
      if (entities.faultFactors && entities.faultFactors.length) html += '<br>事故诱因：' + escapeHtml(entities.faultFactors.join('、'));
      if (entities.faultCategories && entities.faultCategories.length) html += '<br>过错大类：' + escapeHtml(entities.faultCategories.join('、'));
      if (entities.vehicleAttrs && entities.vehicleAttrs.length) html += '<br>车辆属性：' + escapeHtml(entities.vehicleAttrs.join('、'));
      html += '</div>';
      if (gapInfo && gapInfo.gaps && gapInfo.gaps.length) {
        html += '<div style="margin-top:10px;padding:12px;background:#fff7ed;border:1px dashed #fb923c;border-radius:8px;color:#9a3412;font-size:13px;line-height:1.7;">';
        html += '<strong>🕳️ v3.3.2 待补证缺口：</strong> ' + escapeHtml(gapInfo.gaps.map(g => g.label).join('、')) + '<br>入库后将在事故链路图中显示为缺口节点/虚线关系。';
        html += '</div>';
      }
      if (low.length) {
        html += '<div style="margin-top:10px;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412;font-size:13px;line-height:1.7;">';
        html += '<strong>⚠️ 低置信实体，请重点校对：</strong> ' + escapeHtml(low.slice(0, 8).map(e => e.normalizedName + '(' + e.type + '/' + Math.round(e.confidence * 100) + '%)').join('、'));
        html += '</div>';
      }
    }
    html += '<div style="margin-top:15px;padding:14px;background:#ecfdf5;border-radius:8px;color:#065f46;font-size:13px;line-height:1.7;">';
    html += '<strong>📚 解析完成：</strong>将入库 ' + currentParsedReport.reports.length + ' 条结构化报告。请先在下方校对字段，再点击“添加到知识图谱”。';
    html += '</div>';
    html += renderReviewForm(currentParsedReport.reports);
  }
  if (entities.advanced) {
    try { html += renderSourceEvidence(entities.advanced); } catch (e) { console.warn('溯源渲染失败', e); }
  }
  container.innerHTML = html;
  resultDiv.style.display = 'block';
}

// 清空解析
function clearParse() {
  document.getElementById('reportText').value = '';
  document.getElementById('parseResult').style.display = 'none';
  currentParsedReport = null;
  window.__lastRuleParse = null;
  window.__lastLLMParse = null;
  var badge = document.getElementById('parseSourceBadge');
  if (badge) badge.textContent = '双路并行：规则解析无需联网，与主 parser 链路一致；AI 解析调用火山方舟 Coding Plan，仅在本页手动触发。';
  var prev = document.getElementById('formPreviewText'); if (prev) prev.value = '';
  var fn = document.getElementById('reportFileName'); if (fn) fn.textContent = '';
  var fi = document.getElementById('reportFileInput'); if (fi) fi.value = '';
  ['datetime','road','p1','v1','vt1','viol','p2','v2','vt2','accform','injury','liab1','liab2'].forEach(function(id){ var el=document.getElementById('rf_'+id); if(el){ if(el.tagName==='SELECT') el.selectedIndex=0; else el.value=''; } });
}

// v3.4.8: 规则 vs AI 对比弹窗
function showParseCompare() {
  var R = window.__lastRuleParse;
  var L = window.__lastLLMParse;
  if (!R && !L) { alert('还没有可对比的解析结果'); return; }
  var rE = (R && R.entities) || {};
  var lE = (L && L.entities) || {};
  var fmt = function (arr) { return Array.isArray(arr) && arr.length ? escapeHtml(arr.join('、')) : '<span style="color:#94a3b8;">—</span>'; };
  var cell = function (v) { return '<td style="padding:8px 10px;vertical-align:top;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.6;">' + v + '</td>'; };
  var rows = [
    ['👤 当事人', fmt(rE.persons), fmt(lE.persons)],
    ['🚗 车辆', fmt(rE.vehicles), fmt(lE.vehicles)],
    ['🛣️ 道路', fmt(rE.roads), fmt(lE.roads)],
    ['📅 时间', escapeHtml(rE.date || '—'), escapeHtml(lE.date || '—')],
    ['📍 地点', escapeHtml(rE.location || '—'), escapeHtml(lE.location || '—')],
    ['⚠️ 违法/原因', fmt(rE.violations), fmt(lE.violations)],
    ['🩹 伤亡', fmt(rE.injuries), fmt(lE.injuries)],
    ['⚖️ 责任', escapeHtml(rE.liability || '—'), escapeHtml(lE.liability || '—')],
  ];
  var html = '<div id="llmCmpMask" onclick="closeParseCompare(event)" style="position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">';
  html += '<div style="background:#fff;border-radius:14px;max-width:900px;width:100%;max-height:82vh;overflow:auto;padding:20px 22px;box-shadow:0 20px 60px rgba(0,0,0,0.35);" onclick="event.stopPropagation()">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div style="font-size:17px;font-weight:800;color:#0f172a;">🔀 规则解析 vs AI 解析 对比</div><button onclick="closeParseCompare()" style="padding:4px 12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;cursor:pointer;">✕ 关闭</button></div>';
  html += '<table style="width:100%;border-collapse:collapse;"><thead><tr>';
  html += '<th style="text-align:left;padding:8px 10px;background:#f8fafc;font-size:12px;color:#475569;width:110px;">字段</th>';
  html += '<th style="text-align:left;padding:8px 10px;background:#dbeafe;font-size:12px;color:#1d4ed8;">🔍 规则解析</th>';
  html += '<th style="text-align:left;padding:8px 10px;background:#ede9fe;font-size:12px;color:#5b21b6;">🤖 AI 解析</th></tr></thead><tbody>';
  rows.forEach(function (r) { html += '<tr><td style="padding:8px 10px;font-size:12px;color:#334155;font-weight:700;border-top:1px solid #e2e8f0;width:110px;">' + r[0] + '</td>' + cell(r[1]) + cell(r[2]) + '</tr>'; });
  html += '</tbody></table>';
  html += '<div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end;">';
  if (R) html += '<button onclick="useParseResult(\'rule\')" style="padding:8px 16px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">✓ 使用规则结果入库</button>';
  if (L) html += '<button onclick="useParseResult(\'llm\')" style="padding:8px 16px;background:#5b21b6;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">✓ 使用 AI 结果入库</button>';
  html += '</div>';
  html += '</div></div>';
  var holder = document.createElement('div'); holder.innerHTML = html; document.body.appendChild(holder.firstChild);
}
function closeParseCompare(ev) { var m = document.getElementById('llmCmpMask'); if (m) m.remove(); }
function useParseResult(which) {
  var target = which === 'llm' ? window.__lastLLMParse : window.__lastRuleParse;
  if (!target) { alert('当前无可用的解析结果'); return; }
  currentParsedReport = target;
  closeParseCompare();
  displayParseResult(target.entities || {});
}

// 添加到知识图谱：v2.8 写入服务端JSON，同时保留 localStorage 兜底
async function addToGraph() {
  if (!currentParsedReport || !currentParsedReport.reports || !currentParsedReport.reports.length) {
    alert('没有可添加的解析结果！');
    return;
  }
  const reports = collectReviewedReports();
  if (!reports.length) {
    alert('没有可入库的校对结果！');
    return;
  }
  if (reports.length === 1) {
    const report = reports[0];
    if (!report.persons.length && !report.vehicles.length && report.location === '未知地点') {
      if (!confirm('本次解析出的核心实体较少，仍要入库吗？')) return;
    }
  } else {
    if (!confirm('已识别为多案例合集，将一次性入库 ' + reports.length + ' 条案例。是否继续？')) return;
  }
  const batchUploadTime = nowUploadTime();
  reports.forEach(report => {
    report.uploadedAt = batchUploadTime;
    report.source = 'server-json';
  });
  try {
    await saveReportsToServer(reports);
  } catch (err) {
    console.warn('服务端保存失败，回退到 localStorage：', err);
    reports.forEach(report => accidentReports.push(report));
    persistCurrentLocalReports();
    alert('⚠️ 服务端保存失败，已临时保存到浏览器 localStorage：' + err.message);
  }
  upsertReportsUnique(reports);
  refreshAllAnalysis();
  const firstReport = reports[0];
  graphEntryAutoMode = false;
  graphEntryReportId = String(firstReport.id);
  graphExpandedNodeId = null;
  graphFocusedNodeId = null;
  const select = document.getElementById('graphAccidentSelect');
  if (select) select.value = graphEntryReportId;
  alert('✅ 解析结果已成功入库！\n\n入库数量：' + reports.length + ' 条\n首条标题：' + firstReport.title + '\n报告库现有：' + accidentReports.length + ' 篇\n\n可前往「报告库」查看详情，或在「知识图谱」查看局部图谱。');
  switchTab('reports');
  showReportDetail(firstReport.id);
}


// ============ 标准事故报告模板功能（v3.4.6 大版本并入）============
// 三种录入模式：write(直接编写) / form(表单填写) / file(文件上传)
var STD_REPORT_TEMPLATE = '2026年__月__日__时__分，当事人___驾驶___号小型轿车，沿___市___区___路由__向__行驶，因___（违法行为），其车___部与___驾驶的___号小型轿车___部相撞，造成两车受损、___受伤（伤情：___）。经认定，___负本次事故的___责任，___负___责任。';

function switchUploadMode(mode) {
  ['write', 'form', 'file'].forEach(function (m) {
    var panel = document.getElementById('upMode-' + m);
    var btn = document.getElementById('upModeBtn-' + m);
    if (panel) panel.style.display = (m === mode) ? '' : 'none';
    if (btn) {
      var on = (m === mode);
      btn.style.background = on ? '#2563eb' : '#fff';
      btn.style.color = on ? '#fff' : '#475569';
      btn.style.borderColor = on ? '#2563eb' : '#cbd5e1';
    }
  });
  if (mode === 'form' && document.getElementById('reportFormFields') && !document.getElementById('reportFormFields').dataset.built) {
    renderReportForm();
  }
}

function insertReportTemplate() {
  var ta = document.getElementById('reportText');
  if (!ta) return;
  if (ta.value.trim() && !confirm('当前已有文本，确定用标准模板覆盖？')) return;
  ta.value = STD_REPORT_TEMPLATE;
  ta.focus();
}

// 表单字段定义：违法行为/责任用受控下拉，从解析器词典取值，杜绝措辞漂移
function getViolationOptions() {
  try {
    if (window.TrafficParser && TrafficParser.dictionaries && TrafficParser.dictionaries.violationAliases) {
      return Object.keys(TrafficParser.dictionaries.violationAliases);
    }
  } catch (e) {}
  return ['未保持安全车距', '超速行驶', '酒后驾驶', '醉酒驾驶', '疲劳驾驶', '逆向行驶', '违法变道', '无证驾驶', '未按交通信号灯通行', '未礼让行人', '未礼让非机动车', '违法停车', '违法横穿', '转弯未让直行', '操作不当'];
}

function renderReportForm() {
  var wrap = document.getElementById('reportFormFields');
  if (!wrap) return;
  var liabOpts = ['全部', '主要', '次要', '同等', '无', '百分之七十', '百分之六十', '百分之四十', '百分之三十'];
  var accForms = ['相撞', '追尾', '刮擦', '碰撞', '碾压', '侧翻', '撞护栏', '撞树', '开门碰撞', '撞倒', '剐蹭'];
  var dirOpts = ['由东向西', '由西向东', '由南向北', '由北向南', '由东北向西南', '由西南向东北', '由西北向东南', '由东南向西北'];
  var posOpts = ['前部', '后部', '左侧部', '右侧部', '左前部', '右前部', '左后部', '右后部', '侧部'];
  var violOpts = getViolationOptions();
  var optHtml = function (arr) { return arr.map(function (v) { return '<option value="' + v + '">' + v + '</option>'; }).join(''); };
  var inp = function (id, ph) { return '<input id="rf_' + id + '" placeholder="' + ph + '" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;width:100%;box-sizing:border-box;">'; };
  var sel = function (id, arr, blank) { return '<select id="rf_' + id + '" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;width:100%;box-sizing:border-box;background:#fff;">' + (blank ? '<option value="">（请选择）</option>' : '') + optHtml(arr) + '</select>'; };
  var cell = function (label, control) { return '<div><div style="font-size:12px;color:#64748b;margin-bottom:4px;">' + label + '</div>' + control + '</div>'; };
  wrap.innerHTML =
    cell('事故时间 *', inp('datetime', '如 2026年3月5日8时20分')) +
    cell('事故地点道路 *', inp('road', '如 济南市历下区经十路')) +
    cell('当事人一(甲) *', inp('p1', '如 张某')) +
    cell('甲车牌号', inp('v1', '如 鲁A12345')) +
    cell('甲车型', inp('vt1', '如 小型轿车')) +
    cell('行驶方向', sel('dir', dirOpts, true)) +
    cell('碰撞部位（甲）', sel('pos1', posOpts, true)) +
    cell('碰撞部位（乙）', sel('pos2', posOpts, true)) +
    cell('甲违法行为 *', sel('viol', violOpts, true)) +
    cell('当事人二(乙)', inp('p2', '如 王某（单方事故可空）')) +
    cell('乙车牌号', inp('v2', '如 鲁A67890')) +
    cell('乙车型', inp('vt2', '如 小型轿车')) +
    cell('事故形态 *', sel('accform', accForms, true)) +
    cell('伤亡情况', inp('injury', '如 王某轻微伤 / 无人员伤亡')) +
    cell('甲方责任 *', sel('liab1', liabOpts, false)) +
    cell('乙方责任', sel('liab2', liabOpts, true));
  wrap.dataset.built = '1';
}

function rfVal(id) { var el = document.getElementById('rf_' + id); return el ? String(el.value || '').trim() : ''; }

function buildTextFromForm() {
  var dt = rfVal('datetime'), road = rfVal('road'), p1 = rfVal('p1'), v1 = rfVal('v1'), vt1 = rfVal('vt1') || '小型轿车';
  var viol = rfVal('viol'), p2 = rfVal('p2'), v2 = rfVal('v2'), vt2 = rfVal('vt2') || '小型轿车';
  var accform = rfVal('accform') || '相撞', injury = rfVal('injury'), liab1 = rfVal('liab1') || '全部', liab2 = rfVal('liab2');
  var dir = rfVal('dir'), pos1 = rfVal('pos1'), pos2 = rfVal('pos2');
  if (!p1 || !road) { alert('请至少填写：事故地点道路、当事人一。'); return; }
  var s = '';
  if (dt) s += dt + '，';
  s += '当事人' + p1 + '驾驶' + (v1 ? v1 + '号' : '') + vt1 + '，沿' + road + (dir ? dir : '') + '行驶';
  if (viol) s += '，因' + viol;
  if (p2) {
    if (pos1 && pos2) {
      s += '，其车' + pos1 + '与' + p2 + '驾驶的' + (v2 ? v2 + '号' : '') + vt2 + pos2 + accform;
    } else if (pos1) {
      s += '，其车' + pos1 + '与' + p2 + '驾驶的' + (v2 ? v2 + '号' : '') + vt2 + '发生' + accform;
    } else {
      s += '，与' + p2 + '驾驶的' + (v2 ? v2 + '号' : '') + vt2 + '发生' + accform;
    }
  } else {
    s += (pos1 ? '，其车' + pos1 + accform : '，车辆发生' + accform);
  }
  if (injury) s += '，造成' + injury; else s += '，造成车辆受损';
  s += '。经认定，' + p1 + '负本次事故的' + (/责任$/.test(liab1) ? liab1 : liab1 + '责任');
  if (p2 && liab2) s += '，' + p2 + (liab2 === '无' ? '无责任' : '负' + (/责任$/.test(liab2) ? liab2 : liab2 + '责任'));
  s += '。';
  var prev = document.getElementById('formPreviewText');
  if (prev) prev.value = s;
  var ta = document.getElementById('reportText');
  if (ta) ta.value = s; // 同步到主解析输入，parseReport 直接可用
  return s;
}

function loadReportFromFile(file) {
  if (!file) return;
  var nameEl = document.getElementById('reportFileName');
  var reader = new FileReader();
  reader.onload = function () {
    var text = String(reader.result || '').trim();
    var ta = document.getElementById('reportText');
    if (ta) ta.value = text;
    if (nameEl) nameEl.textContent = '✅ 已载入：' + file.name + '（' + text.length + ' 字）— 点“解析报告”即可';
  };
  reader.onerror = function () { if (nameEl) nameEl.textContent = '❌ 读取失败：' + file.name; };
  reader.readAsText(file, 'utf-8');
}
