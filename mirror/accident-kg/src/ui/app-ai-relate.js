// src/ui/app-ai-relate.js
// v3.5.0 Phase A: 跨报告实体关联 - 前端 UI

const NODE_TYPE_TO_INDEX_TYPE = {
  person: 'person',
  vehicle: 'vehicle',
  road: 'location',
  fault_category: 'fault_category',
  fault_factor: 'fault_factor',
  violation: 'violation',
  accident_category: 'accident_type',
  accident: 'accident_type',
};

const aiRelateCache = new Map();
let aiRelateInflight = null;

function getRelateIndexType(nodeType) {
  return NODE_TYPE_TO_INDEX_TYPE[nodeType] || null;
}

async function runAiRelateAnalysis(nodeType, nodeName, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const indexType = getRelateIndexType(nodeType);
  if (!indexType) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:10px;">当前实体类型暂不支持跨报告 AI 分析。</div>';
    return;
  }
  const cacheKey = indexType + '::' + nodeName;
  if (aiRelateCache.has(cacheKey)) {
    renderRelateInsight(container, aiRelateCache.get(cacheKey));
    return;
  }
  if (aiRelateInflight && aiRelateInflight.key === cacheKey) return;
  aiRelateInflight = { key: cacheKey };
  container.innerHTML = '<div style="padding:14px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;color:#7c3aed;font-size:14px;font-weight:600;">🧠 正在调用 AI 分析全库同类事故……首次约需 6-15 秒</div>';
  try {
    const findResp = await fetch('/api/relations/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: indexType, name: nodeName }),
    });
    const findPayload = await findResp.json();
    const count = (findPayload && findPayload.data && findPayload.data.count) || 0;
    if (!count) {
      const empty = { insight: null, count: 0, reports: [], entity: { type: indexType, name: nodeName } };
      aiRelateCache.set(cacheKey, empty);
      renderRelateInsight(container, empty);
      return;
    }
    if (count === 1) {
      const single = { insight: null, count: 1, reports: findPayload.data.reports || [], entity: { type: indexType, name: nodeName }, singleOnly: true };
      aiRelateCache.set(cacheKey, single);
      renderRelateInsight(container, single);
      return;
    }
    const resp = await fetch('/api/llm/relate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: indexType, name: nodeName, maxReports: 20 }),
    });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    aiRelateCache.set(cacheKey, payload.data);
    renderRelateInsight(container, payload.data);
  } catch (err) {
    console.error('AI 关联分析失败', err);
    container.innerHTML = '<div style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:13px;">❌ AI 关联分析失败：' + escapeHtml(err.message || String(err)) + '</div>';
  } finally {
    aiRelateInflight = null;
  }
}

function riskBadge(level) {
  const map = {
    '极高': { bg: '#fee2e2', color: '#991b1b', emoji: '🚨' },
    '高':   { bg: '#ffedd5', color: '#c2410c', emoji: '⚠️' },
    '中':   { bg: '#fef3c7', color: '#a16207', emoji: '⚡' },
    '低':   { bg: '#dcfce7', color: '#166534', emoji: '✅' },
  };
  const c = map[level] || map['中'];
  return '<span style="display:inline-block;padding:3px 12px;background:' + c.bg + ';color:' + c.color + ';border-radius:999px;font-size:12px;font-weight:800;">' + c.emoji + ' ' + escapeHtml(level || '中') + '风险</span>';
}

function renderRelateInsight(container, data) {
  if (!data) { container.innerHTML = ''; return; }
  const { entity, count, sampledCount, insight, reports, cached, singleOnly } = data;
  const entityLabel = (entity && entity.type) + ' · ' + (entity && entity.name);
  let html = '<div style="padding:14px;background:linear-gradient(135deg,#faf5ff,#f0f9ff);border:1px solid #e9d5ff;border-radius:12px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;">';
  html += '<div style="font-weight:800;color:#5b21b6;font-size:15px;">🧠 AI 跨报告关联分析' + (cached ? ' <span style="font-size:11px;color:#94a3b8;font-weight:500;">✅ 缓存命中</span>' : '') + '</div>';
  html += '<div style="font-size:12px;color:#64748b;">焦点实体：<b style="color:#5b21b6;">' + escapeHtml(entityLabel) + '</b> · 全库命中 <b>' + count + '</b> 条' + (sampledCount && sampledCount < count ? '（抽样 ' + sampledCount + ' 条送 AI）' : '') + '</div>';
  html += '</div>';

  if (!count) {
    html += '<div style="padding:12px;background:#fff;border-radius:8px;color:#64748b;">该实体在全库仅出现于当前报告，暂无其它关联案例可分析。</div></div>';
    container.innerHTML = html;
    return;
  }
  if (singleOnly) {
    html += '<div style="padding:12px;background:#fff;border-radius:8px;color:#64748b;">该实体在全库仅涉及 <b>1</b> 条报告，样本过少，AI 无法归纳规律。</div>';
    if (reports && reports.length) {
      html += '<div style="margin-top:10px;font-size:12px;color:#64748b;">相关报告：<a href="javascript:void(0)" onclick="showReportDetail(\'' + escapeHtml(reports[0].id) + '\');switchTab(\'reports\');return false;" style="color:#2563eb;font-weight:600;">' + escapeHtml(reports[0].title || '(未命名)') + '</a></div>';
    }
    html += '</div>';
    container.innerHTML = html;
    return;
  }
  if (!insight) {
    html += '<div style="padding:12px;background:#fff;border-radius:8px;color:#64748b;">AI 未返回结论，请稍后重试。</div></div>';
    container.innerHTML = html;
    return;
  }

  html += '<div style="padding:12px;background:#fff;border-radius:10px;border:1px solid #e9d5ff;margin-bottom:10px;">';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' + riskBadge(insight.riskLevel) + '<span style="font-size:12px;color:#94a3b8;">AI 综合结论</span></div>';
  html += '<div style="color:#1e293b;font-size:14px;line-height:1.7;">' + escapeHtml(insight.summary || '(无)') + '</div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">';
  html += '<div style="padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;">';
  html += '<div style="font-size:12px;font-weight:800;color:#7c3aed;margin-bottom:6px;">🔑 高频共性因素</div>';
  if (insight.commonFactors && insight.commonFactors.length) {
    html += '<div>' + insight.commonFactors.map(f => '<span style="display:inline-block;margin:3px 4px 3px 0;padding:3px 10px;background:#f5f3ff;color:#5b21b6;border-radius:999px;font-size:12px;">' + escapeHtml(f) + '</span>').join('') + '</div>';
  } else {
    html += '<div style="color:#94a3b8;font-size:13px;">(未提炼)</div>';
  }
  html += '</div>';
  html += '<div style="padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;">';
  html += '<div style="font-size:12px;font-weight:800;color:#c2410c;margin-bottom:6px;">⏰ 时段/情境规律</div>';
  html += '<div style="color:#1e293b;font-size:13px;line-height:1.6;">' + (insight.timePattern ? escapeHtml(insight.timePattern) : '<span style="color:#94a3b8;">(无明显规律)</span>') + '</div>';
  html += '</div></div>';

  html += '<div style="padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:10px;">';
  html += '<div style="font-size:12px;font-weight:800;color:#0369a1;margin-bottom:6px;">💡 治理建议</div>';
  if (insight.suggestions && insight.suggestions.length) {
    html += '<ol style="margin:0;padding-left:20px;color:#1e293b;font-size:13px;line-height:1.9;">';
    html += insight.suggestions.map(s => '<li>' + escapeHtml(s) + '</li>').join('');
    html += '</ol>';
  } else {
    html += '<div style="color:#94a3b8;font-size:13px;">(未生成)</div>';
  }
  html += '</div>';

  if (reports && reports.length) {
    html += '<div style="padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">';
    html += '<div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:6px;">📋 涉及报告（' + reports.length + '）· 点击标题查看详情</div>';
    reports.slice(0, 15).forEach(r => {
      html += '<div style="padding:6px 0;border-bottom:1px dashed #e2e8f0;">';
      html += '<a href="javascript:void(0)" onclick="showReportDetail(\'' + escapeHtml(String(r.id)) + '\');switchTab(\'reports\');return false;" style="color:#2563eb;font-weight:600;font-size:13px;">' + escapeHtml(r.title || '(未命名)') + '</a>';
      html += '<span style="font-size:12px;color:#64748b;margin-left:8px;">' + escapeHtml(r.date || '') + '｜' + escapeHtml(r.location || '') + '</span>';
      html += '<div style="font-size:12px;color:#64748b;margin-top:2px;">• ' + escapeHtml((r.violation || '').slice(0, 60)) + (r.injury ? ' • ' + escapeHtml(r.injury.slice(0, 40)) : '') + '</div>';
      html += '</div>';
    });
    if (reports.length > 15) html += '<div style="padding:6px 0;color:#94a3b8;font-size:12px;">…共 ' + reports.length + ' 条，已展示前 15 条</div>';
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}
