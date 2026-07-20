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
// v3.5.1：默认开启语义扩展（同义词/Jaccard）
let aiRelateSemantic = true;

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
  const cacheKey = indexType + '::' + nodeName + '::sem=' + (aiRelateSemantic ? 1 : 0);
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
      body: JSON.stringify({ type: indexType, name: nodeName, useSemantic: aiRelateSemantic }),
    });
    const findPayload = await findResp.json();
    const count = (findPayload && findPayload.data && findPayload.data.count) || 0;
    const neighbors = (findPayload && findPayload.data && findPayload.data.neighbors) || null;
    if (!count) {
      const empty = { insight: null, count: 0, reports: [], entity: { type: indexType, name: nodeName }, neighbors };
      aiRelateCache.set(cacheKey, empty);
      renderRelateInsight(container, empty);
      return;
    }
    if (count === 1) {
      const single = { insight: null, count: 1, reports: findPayload.data.reports || [], entity: { type: indexType, name: nodeName }, singleOnly: true, neighbors };
      aiRelateCache.set(cacheKey, single);
      renderRelateInsight(container, single);
      return;
    }
    const resp = await fetch('/api/llm/relate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: indexType, name: nodeName, maxReports: 20, useSemantic: aiRelateSemantic }),
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
  const { entity, count, sampledCount, insight, reports, cached, singleOnly, neighbors } = data;
  const entityLabel = (entity && entity.type) + ' · ' + (entity && entity.name);
  const eType = escapeHtml(entity.type);
  const eName = escapeHtml(entity.name).replace(/'/g, '\\&#39;');
  const cId = escapeHtml(container.id);
  let html = '<div style="padding:14px;background:linear-gradient(135deg,#faf5ff,#f0f9ff);border:1px solid #e9d5ff;border-radius:12px;">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px;">';
  html += '<div style="font-weight:800;color:#5b21b6;font-size:15px;">🧠 AI 跨报告关联分析' + (cached ? ' <span style="font-size:11px;color:#94a3b8;font-weight:500;">✅ 缓存命中</span>' : '') + '</div>';
  html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
  html += '<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-weight:700;color:#7c3aed;font-size:12px;"><input type="checkbox" ' + (aiRelateSemantic ? 'checked' : '') + ' onchange="toggleAiRelateSemantic(this.checked,\'' + eType + '\',\'' + eName + '\',\'' + cId + '\')">✨语义扩展</label>';
  html += '<button onclick="downloadAiRelateReport(\'' + eType + '\',\'' + eName + '\',this)" style="padding:6px 14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,.25);">📄 生成治理专题报告</button>';
  html += '</div></div>';
  html += '<div style="font-size:12px;color:#64748b;margin-bottom:10px;">焦点实体：<b style="color:#5b21b6;">' + escapeHtml(entityLabel) + '</b> · 全库命中 <b>' + count + '</b> 条' + (sampledCount && sampledCount < count ? '（抽样 ' + sampledCount + ' 条送 AI）' : '') + '</div>';
  if (neighbors && neighbors.length > 1) {
    html += '<div style="padding:8px 10px;background:#fff;border:1px dashed #c084fc;border-radius:8px;margin-bottom:10px;font-size:12px;color:#5b21b6;">✨ 语义扩展命中同义/近似实体：' + neighbors.slice(0, 8).map(function(n){ return '<span style="display:inline-block;margin:2px 3px;padding:2px 8px;background:#f5f3ff;border-radius:999px;font-weight:700;">' + escapeHtml(n.name) + ' <span style="color:#94a3b8;font-weight:400;">×' + n.count + '</span></span>'; }).join('') + '</div>';
  }

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

// v3.5.1 P0-②：语义扩展开关
function toggleAiRelateSemantic(checked, nodeType, nodeName, containerId) {
  aiRelateSemantic = !!checked;
  aiRelateCache.clear();
  runAiRelateAnalysis(nodeType, nodeName, containerId);
}

// v3.5.1 P1-③：一键生成治理专题报告 Markdown 并下载
async function downloadAiRelateReport(nodeType, nodeName, btn) {
  const indexType = getRelateIndexType(nodeType);
  if (!indexType) { alert('当前实体类型不支持生成专题报告'); return; }
  const originalText = btn && btn.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中(15-40s)…'; btn.style.opacity = '0.7'; }
  try {
    const resp = await fetch('/api/llm/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: indexType, name: nodeName, useSemantic: aiRelateSemantic, maxReports: 20 }),
    });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    const md = payload.data.markdown || '';
    if (!md) throw new Error('AI 未返回报告正文');
    const now = new Date();
    const stamp = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    const safe = String(nodeName).replace(/[^\w\u4e00-\u9fa5]+/g, '_').slice(0, 30);
    const fname = 'AI治理报告-' + indexType + '-' + safe + '-' + stamp + '.md';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname; document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    if (btn) { btn.textContent = '✅ 已下载 ' + fname; setTimeout(function(){ btn.textContent = originalText || '📄 生成治理专题报告'; btn.disabled = false; btn.style.opacity = '1'; }, 3000); }
  } catch (err) {
    console.error('生成治理报告失败', err);
    alert('❌ 生成治理报告失败：' + (err.message || String(err)));
    if (btn) { btn.disabled = false; btn.textContent = originalText || '📄 生成治理专题报告'; btn.style.opacity = '1'; }
  }
}
