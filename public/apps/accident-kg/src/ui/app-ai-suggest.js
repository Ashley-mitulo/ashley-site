// src/ui/app-ai-suggest.js — v3.5.1 P0-①：AI 引导式提问推荐
// 问答页顶部按需拉取 10 个数据驱动的推荐问题；点击 chip 自动填入问答框并触发查询。

let aiSuggestCache = null;
let aiSuggestInflight = false;

async function loadAiSuggestions(force) {
  const box = document.getElementById('aiSuggestBox');
  if (!box) return;
  if (aiSuggestCache && !force) { renderAiSuggestions(box, aiSuggestCache); return; }
  if (aiSuggestInflight) return;
  aiSuggestInflight = true;
  box.innerHTML = '<div style="padding:10px 12px;background:#f5f3ff;border:1px dashed #c084fc;border-radius:10px;color:#7c3aed;font-size:12px;font-weight:600;">🧠 AI 正在根据当前数据库画像挑选推荐问题…（≈5s）</div>';
  try {
    const resp = await fetch('/api/llm/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: !!force }),
    });
    const payload = await resp.json();
    if (!payload || !payload.success) throw new Error((payload && payload.error) || ('HTTP ' + resp.status));
    aiSuggestCache = payload.data;
    renderAiSuggestions(box, aiSuggestCache);
  } catch (err) {
    console.error('AI 推荐问题失败', err);
    box.innerHTML = '<div style="padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:12px;">❌ AI 推荐失败：' + escapeHtml(err.message || String(err)) + ' · <a href="javascript:void(0)" onclick="loadAiSuggestions(true)" style="color:#2563eb;">重试</a></div>';
  } finally {
    aiSuggestInflight = false;
  }
}

function renderAiSuggestions(box, data) {
  const questions = (data && data.questions) || [];
  const profile = (data && data.profile) || {};
  const cached = data && data.cached;
  const ms = data && data.ms;
  let h = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">';
  h += '<div style="font-size:13px;font-weight:800;color:#7c3aed;">🧠 AI 推荐（点击直接提问）</div>';
  if (cached) h += '<span style="font-size:11px;color:#94a3b8;">✅ 缓存</span>';
  if (ms) h += '<span style="font-size:11px;color:#94a3b8;">耗时 ' + ms + 'ms</span>';
  if (profile.totalReports) h += '<span style="font-size:11px;color:#94a3b8;">基于全库 ' + profile.totalReports + ' 条报告的分布</span>';
  h += '<button onclick="loadAiSuggestions(true)" style="margin-left:auto;padding:3px 10px;background:#f5f3ff;color:#5b21b6;border:1px solid #e9d5ff;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;">🔄 换一批</button>';
  h += '</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
  questions.forEach(function(q){
    const text = String(q || '').trim();
    if (!text) return;
    h += '<span onclick="useAiSuggestion(this)" data-q="' + escapeHtml(text) + '" title="点击自动提问" style="display:inline-block;padding:6px 14px;background:linear-gradient(135deg,#faf5ff,#eff6ff);color:#5b21b6;border:1px solid #e9d5ff;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s;" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(124,58,237,.18)\';" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\';">💡 ' + escapeHtml(text) + '</span>';
  });
  h += '</div>';
  box.innerHTML = h;
}

function useAiSuggestion(el) {
  const q = el.getAttribute('data-q') || '';
  const input = document.getElementById('aiAskInput');
  if (input) { input.value = q; input.focus(); }
  if (typeof submitAiAsk === 'function') submitAiAsk();
}
