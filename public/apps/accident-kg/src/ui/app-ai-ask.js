// src/ui/app-ai-ask.js — v3.5.0 Phase B+C: 自然语言问答 - 前端 UI
const AI_ASK_EXAMPLES = [
  '总共死亡多少人？分事故等级看',
  '死亡2人以上的重大事故有哪些？',
  '周末发生的事故多不多？',
  '按事故类型×天气做个交叉分析',
  '发生过 2 起以上事故的路段有哪些？',
  '高速公路上发生的追尾事故有多少起？',
  '疲劳驾驶引发的事故都发生在什么时段？',
  '每个时段的事故分布如何？',
];
const aiAskHistory = [];
let aiAskInflight = false;

function renderAiAskTab() {
  const c = document.getElementById('aiAskContent');
  if (!c) return;
  let h = '<div style="max-width:900px;margin:0 auto;padding:20px;">';
  h += '<div style="text-align:center;margin-bottom:20px;">';
  h += '<div style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent;">🧠 智能问答</div>';
  h += '<div style="color:#64748b;font-size:14px;margin-top:6px;">用自然语言直接查询报告库；AI 把问题翻译成 DSL 在本地执行，答案基于真实数据，不联网、不编数字。</div>';
  h += '</div>';
  h += '<div id="aiSuggestBox" style="margin-bottom:14px;"></div>';
  h += '<div style="display:flex;gap:10px;margin-bottom:14px;">';
  h += '<input id="aiAskInput" placeholder="例如：疲劳驾驶事故都发生在什么时段？" style="flex:1;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;" onkeydown="if(event.key===&quot;Enter&quot;){submitAiAsk();return false;}">';
  h += '<button id="aiAskBtn" onclick="submitAiAsk()" style="padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;box-shadow:0 2px 8px rgba(124,58,237,0.3);">🚀 提问</button>';
  h += '</div>';
  h += '<div style="margin-bottom:16px;"><div style="font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:600;">💡 试试这些示例问题：</div><div>';
  AI_ASK_EXAMPLES.forEach(function(q){
    h += '<span onclick="useAiAskExample(this)" data-q="' + escapeHtml(q) + '" style="display:inline-block;margin:3px 4px 3px 0;padding:5px 12px;background:#f5f3ff;color:#5b21b6;border-radius:999px;font-size:12px;cursor:pointer;">' + escapeHtml(q) + '</span>';
  });
  h += '</div></div><div id="aiAskResult"></div><div id="aiAskHistory" style="margin-top:24px;"></div></div>';
  c.innerHTML = h;
  renderAiAskHistory();
  // v3.5.1：首次进入问答页自动拉取 AI 推荐问题
  if (typeof loadAiSuggestions === 'function') loadAiSuggestions(false);
}

function useAiAskExample(el) {
  const q = el.getAttribute('data-q') || '';
  const input = document.getElementById('aiAskInput');
  if (input) { input.value = q; input.focus(); }
  submitAiAsk();
}

async function submitAiAsk() {
  const input = document.getElementById('aiAskInput');
  const btn = document.getElementById('aiAskBtn');
  const box = document.getElementById('aiAskResult');
  if (!input || !box) return;
  const q = input.value.trim();
  if (!q) { alert('请先输入问题'); return; }
  if (aiAskInflight) return;
  aiAskInflight = true;
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = '⏳ AI 分析中…'; }
  box.innerHTML = '<div style="padding:16px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;color:#7c3aed;font-weight:600;">🧠 正在分两步调用 AI（生成 DSL → 用真实数据回答）… 6-15 秒</div>';
  try {
    const resp = await fetch('/api/llm/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    aiAskHistory.unshift({ q: q, data: payload.data, ts: new Date().toISOString() });
    if (aiAskHistory.length > 20) aiAskHistory.length = 20;
    renderAiAskResult(box, payload.data);
    renderAiAskHistory();
  } catch (err) {
    console.error('AI 问答失败', err);
    box.innerHTML = '<div style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;">❌ ' + escapeHtml(err.message || String(err)) + '</div>';
  } finally {
    aiAskInflight = false;
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.textContent = '🚀 提问'; }
  }
}

function renderAiAskResult(container, data) {
  const answer = data.answer;
  const dsl = data.dsl;
  const execResult = data.execResult || {};
  const totalReports = data.totalReports;
  const ms = data.ms;
  const usage = data.usage || {};
  const stages = data.stages || {};
  const cached = data.cached;
  let h = '<div style="padding:16px;background:linear-gradient(135deg,#f5f3ff,#eff6ff);border:1px solid #e9d5ff;border-radius:12px;">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
  h += '<div style="font-weight:800;color:#5b21b6;font-size:15px;">🧠 AI 回答' + (cached ? ' <span style="font-size:11px;color:#94a3b8;font-weight:500;">✅ 缓存命中</span>' : '') + '</div>';
  h += '<div style="margin-left:auto;font-size:12px;color:#94a3b8;">耗时 ' + (ms || 0) + 'ms · tokens ' + (usage.total_tokens || '?') + '</div>';
  h += '</div>';
  h += '<div style="padding:14px;background:#fff;border-radius:10px;color:#1e293b;font-size:14px;line-height:1.8;white-space:pre-wrap;">' + escapeHtml(answer || '(AI 未返回)') + '</div>';
  h += '<details style="margin-top:12px;background:#fff;border-radius:10px;padding:10px 12px;">';
  h += '<summary style="cursor:pointer;font-weight:700;color:#334155;font-size:13px;">🔎 展开查看 AI 生成的 DSL 与本地执行结果</summary>';
  h += '<div style="margin-top:10px;">';
  h += '<div style="font-size:12px;color:#64748b;margin-bottom:4px;">Stage 1 · AI → DSL（' + (stages.dslMs || '?') + 'ms）：</div>';
  h += '<pre style="background:#0f172a;color:#a7f3d0;padding:10px;border-radius:8px;font-size:12px;overflow:auto;">' + escapeHtml(JSON.stringify(dsl, null, 2)) + '</pre>';
  h += '<div style="font-size:12px;color:#64748b;margin:8px 0 4px;">Stage 2 · 本地执行（全库 ' + (totalReports || '?') + ' 条 → 命中 ' + (execResult.filteredCount || 0) + ' 条）：</div>';
  h += renderExecResult(execResult);
  h += '</div></details></div>';
  container.innerHTML = h;
}

function renderExecResult(exec) {
  const agg = exec.aggregate || {};
  let h = '';
  if (agg.kind === 'count') {
    h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;color:#334155;font-size:13px;">数量：<b style="color:#2563eb;font-size:16px;">' + agg.total + '</b> 条</div>';
  } else if (agg.kind === 'sumField') {
    if (agg.by) {
      const list = agg.buckets || [];
      h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;"><div style="font-size:12px;color:#64748b;margin-bottom:6px;">按 ' + escapeHtml(agg.by) + ' 合计 <b>' + escapeHtml(agg.field) + '</b>（总和 ' + agg.sumTotal + '）</div>';
      h += '<table style="width:100%;font-size:12px;border-collapse:collapse;"><thead><tr style="background:#e2e8f0;"><th style="text-align:left;padding:4px 8px;">键</th><th style="text-align:right;padding:4px 8px;width:80px;">合计</th></tr></thead><tbody>';
      list.slice(0, 20).forEach(function(b){
        h += '<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:4px 8px;">' + escapeHtml(b.key || '(空)') + '</td><td style="text-align:right;padding:4px 8px;font-weight:700;color:#dc2626;">' + b.sum + '</td></tr>';
      });
      h += '</tbody></table></div>';
    } else {
      h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;color:#334155;font-size:13px;"><b>' + escapeHtml(agg.field) + '</b> 合计：<b style="color:#dc2626;font-size:16px;">' + agg.sumTotal + '</b>（基于 ' + agg.total + ' 条报告）</div>';
    }
  } else if (agg.kind === 'crosstab') {
    const cols = agg.colKeys || [];
    const mat = agg.matrix || [];
    h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;overflow:auto;"><div style="font-size:12px;color:#64748b;margin-bottom:6px;">交叉分组：<b>' + escapeHtml(agg.rowBy) + '</b> × <b>' + escapeHtml(agg.colBy) + '</b></div>';
    h += '<table style="font-size:12px;border-collapse:collapse;min-width:100%;"><thead><tr style="background:#e2e8f0;"><th style="text-align:left;padding:4px 8px;">' + escapeHtml(agg.rowBy) + ' \\ ' + escapeHtml(agg.colBy) + '</th>';
    cols.forEach(function(c){ h += '<th style="text-align:right;padding:4px 8px;">' + escapeHtml(c) + '</th>'; });
    h += '<th style="text-align:right;padding:4px 8px;color:#dc2626;">总</th></tr></thead><tbody>';
    mat.forEach(function(row){
      h += '<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:4px 8px;font-weight:600;">' + escapeHtml(row.row) + '</td>';
      row.cells.forEach(function(c){
        const alpha = c.count > 0 ? Math.min(0.08 + c.count * 0.05, 0.4) : 0;
        const bg = alpha > 0 ? 'background:rgba(37,99,235,' + alpha + ');' : '';
        h += '<td style="text-align:right;padding:4px 8px;' + bg + '">' + (c.count || '') + '</td>';
      });
      h += '<td style="text-align:right;padding:4px 8px;font-weight:700;color:#dc2626;">' + row.rowTotal + '</td></tr>';
    });
    h += '</tbody></table></div>';
  } else if (agg.kind === 'groupBy' || agg.kind === 'top') {
    const list = agg.buckets || agg.top || [];
    const title = agg.kind === 'groupBy' ? ('按 ' + agg.by + ' 分组') : (agg.field + ' Top' + list.length);
    h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;"><div style="font-size:12px;color:#64748b;margin-bottom:6px;">' + escapeHtml(title) + '</div>';
    h += '<table style="width:100%;font-size:12px;border-collapse:collapse;"><thead><tr style="background:#e2e8f0;"><th style="text-align:left;padding:4px 8px;">键</th><th style="text-align:right;padding:4px 8px;width:60px;">条数</th></tr></thead><tbody>';
    list.slice(0, 20).forEach(function(b){
      h += '<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:4px 8px;">' + escapeHtml(b.key || '(空)') + '</td><td style="text-align:right;padding:4px 8px;font-weight:700;color:#2563eb;">' + b.count + '</td></tr>';
    });
    h += '</tbody></table></div>';
  } else if (agg.kind === 'list') {
    const rows = agg.rows || [];
    h += '<div style="padding:10px;background:#f8fafc;border-radius:8px;">';
    if (!rows.length) h += '<div style="color:#94a3b8;font-size:13px;">(无命中报告)</div>';
    else rows.slice(0, 15).forEach(function(r){
      h += '<div style="padding:6px 0;border-bottom:1px dashed #e2e8f0;">';
      h += '<a href="javascript:void(0)" onclick="showReportDetail(&quot;' + escapeHtml(String(r.id)) + '&quot;);switchTab(&quot;reports&quot;);return false;" style="color:#2563eb;font-weight:600;font-size:13px;">' + escapeHtml(r.title || '(未命名)') + '</a>';
      h += '<span style="font-size:12px;color:#64748b;margin-left:8px;">' + escapeHtml(r.date || '') + '｜' + escapeHtml(r.location || '') + '</span>';
      h += '<div style="font-size:12px;color:#64748b;margin-top:2px;">违法：' + escapeHtml((r.violation || '').slice(0, 50)) + (r.injury ? ' ｜ 伤亡：' + escapeHtml(r.injury.slice(0, 40)) : '') + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }
  return h;
}

function renderAiAskHistory() {
  const c = document.getElementById('aiAskHistory');
  if (!c) return;
  if (!aiAskHistory.length) { c.innerHTML = ''; return; }
  let h = '<div style="font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:8px;">📜 会话历史（仅本页面内）</div>';
  aiAskHistory.forEach(function(item, i){
    if (i === 0) return; // 当前那条已在上方展示
    h += '<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;margin-bottom:6px;">';
    h += '<summary style="cursor:pointer;color:#334155;font-size:13px;"><b>❓ ' + escapeHtml(item.q) + '</b> <span style="color:#94a3b8;font-size:11px;margin-left:8px;">' + escapeHtml((item.ts || '').slice(0,19).replace('T',' ')) + '</span></summary>';
    h += '<div style="margin-top:8px;padding:10px;background:#fff;border-radius:8px;color:#1e293b;font-size:13px;line-height:1.7;white-space:pre-wrap;">' + escapeHtml(item.data.answer || '') + '</div>';
    h += '</details>';
  });
  c.innerHTML = h;
}
