// src/ui/app-ai-audit.js — v3.5.1 P1-④：AI 报告事实一致性质检
// 在报告详情面板底部插入"🔍 AI 质检当前报告"按钮，展示 conflicts / missing / warnings。

const aiAuditCache = new Map();
let aiAuditInflight = null;

async function runAiAudit(reportId, btn) {
  if (!reportId) return;
  const boxId = 'aiAuditBox_' + reportId;
  const box = document.getElementById(boxId);
  if (!box) return;
  if (aiAuditCache.has(reportId)) {
    renderAiAudit(box, aiAuditCache.get(reportId));
    return;
  }
  if (aiAuditInflight === reportId) return;
  aiAuditInflight = reportId;
  const originalText = btn && btn.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ AI 质检中(≈5s)…'; btn.style.opacity = '0.7'; }
  box.innerHTML = '<div style="padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#c2410c;font-size:12px;font-weight:600;">🔍 正在调用 AI 对比结构化字段与原文…（≈5s）</div>';
  try {
    // v3.5.1：同时尝试 reportId 与本地 accidentReports 对象（兼容内嵌样本报告）
    let localReport = null;
    if (typeof accidentReports !== 'undefined' && Array.isArray(accidentReports)) {
      localReport = accidentReports.find(function(r){ return String(r.id) === String(reportId); }) || null;
    }
    const body = localReport ? { reportId: String(reportId), report: localReport } : { reportId: String(reportId) };
    const resp = await fetch('/api/llm/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    aiAuditCache.set(reportId, payload.data);
    renderAiAudit(box, payload.data);
  } catch (err) {
    console.error('AI 质检失败', err);
    box.innerHTML = '<div style="padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:12px;">❌ AI 质检失败：' + escapeHtml(err.message || String(err)) + '</div>';
  } finally {
    aiAuditInflight = null;
    if (btn) { btn.disabled = false; btn.textContent = originalText || '🔍 AI 质检当前报告'; btn.style.opacity = '1'; }
  }
}

function statusBadge(status) {
  const map = {
    'ok':      { bg: '#dcfce7', color: '#166534', emoji: '✅', label: '一致' },
    'warning': { bg: '#fef3c7', color: '#92400e', emoji: '⚠️', label: '疑点' },
    'error':   { bg: '#fee2e2', color: '#991b1b', emoji: '🚨', label: '冲突' },
  };
  const c = map[status] || map['warning'];
  return '<span style="display:inline-block;padding:3px 12px;background:' + c.bg + ';color:' + c.color + ';border-radius:999px;font-size:12px;font-weight:800;">' + c.emoji + ' ' + c.label + '</span>';
}

function renderAiAudit(box, data) {
  if (!data) { box.innerHTML = ''; return; }
  const status = data.status || 'warning';
  const conflicts = data.conflicts || [];
  const missing = data.missing || [];
  const warnings = data.warnings || [];
  const notes = data.notes || '';
  const ms = data.ms;
  const cached = data.cached;
  let h = '<div style="padding:12px 14px;background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid #fed7aa;border-radius:12px;">';
  h += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">';
  h += '<div style="font-weight:800;color:#c2410c;font-size:14px;">🔍 AI 事实质检结果</div>';
  h += statusBadge(status);
  if (cached) h += '<span style="font-size:11px;color:#94a3b8;">✅ 缓存命中</span>';
  if (ms) h += '<span style="font-size:11px;color:#94a3b8;">耗时 ' + ms + 'ms</span>';
  h += '</div>';
  if (notes) h += '<div style="padding:8px 10px;background:#fff;border-radius:8px;font-size:13px;color:#1e293b;margin-bottom:8px;line-height:1.6;">📝 ' + escapeHtml(notes) + '</div>';

  function renderList(title, items, iconColor, iconEmoji) {
    if (!items || !items.length) return '';
    let s = '<div style="padding:10px 12px;background:#fff;border-radius:8px;margin-bottom:6px;">';
    s += '<div style="font-size:12px;font-weight:800;color:' + iconColor + ';margin-bottom:6px;">' + iconEmoji + ' ' + title + '（' + items.length + '）</div>';
    s += '<ul style="margin:0;padding-left:20px;color:#1e293b;font-size:13px;line-height:1.75;">';
    items.forEach(function(it){
      const field = it.field ? '<code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:12px;color:#7c3aed;">' + escapeHtml(it.field) + '</code>' : '';
      s += '<li>' + field + ' ' + escapeHtml(it.hint || '') + '</li>';
    });
    s += '</ul></div>';
    return s;
  }
  h += renderList('字段冲突', conflicts, '#991b1b', '🚨');
  h += renderList('原文有但字段缺失', missing, '#c2410c', '⚠️');
  h += renderList('警告 / 录入疑点', warnings, '#92400e', '⚡');
  if (!conflicts.length && !missing.length && !warnings.length) {
    h += '<div style="padding:10px 12px;background:#fff;border-radius:8px;color:#166534;font-size:13px;">✅ AI 未发现字段与原文冲突或明显疑点。</div>';
  }
  h += '</div>';
  box.innerHTML = h;
}

// 供报告详情面板调用：注入按钮 + 结果容器占位
function renderAiAuditButton(reportId) {
  const rid = String(reportId || '');
  if (!rid) return '';
  const boxId = 'aiAuditBox_' + rid;
  let h = '<div style="margin:14px 0;padding:12px 14px;background:linear-gradient(135deg,#fef9c3,#fff7ed);border:1px dashed #fcd34d;border-radius:12px;">';
  h += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
  h += '<div style="font-weight:800;color:#92400e;font-size:13px;">🔍 AI 事实一致性质检</div>';
  h += '<span style="font-size:11px;color:#78716c;">对比结构化字段与原文是否一致，找出冲突/缺失/录入疑点</span>';
  h += '<button onclick="runAiAudit(\'' + rid.replace(/'/g, "\\'") + '\',this)" style="margin-left:auto;padding:6px 14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(245,158,11,.3);">🔍 AI 质检当前报告</button>';
  h += '</div>';
  h += '<div id="' + boxId + '" style="margin-top:10px;"></div>';
  h += '</div>';
  return h;
}
