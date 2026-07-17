function renderEvidence(items=[],groups=null){
  const card=e=>`<div class="evidence-card"><b>${e.rank?`#${e.rank} `:''}${e.title||e.name||e.type}</b><div>${e.value||e.detail||''}</div><small>${e.type||''}｜${e.source||''}｜${e.evidenceLevel||'证据'} ${e.evidenceScore?Math.round(e.evidenceScore*100)+'分':''}｜置信度 ${Math.round((e.confidence||0)*100)}%</small></div>`;
  if(groups){
    const block=(title,list=[])=>list.length?`<h5>${title}</h5><div class="mini-grid">${list.map(card).join('')}</div>`:'';
    return `<div class="qa-section"><h4>依据来源 / 证据评分</h4>${block('系统内置业务数据',groups.builtin)}${block('正式接入数据',groups.ingested)}${block('知识库依据',groups.knowledge)}${block('规则/诊断模型依据',groups.rules)}</div>`;
  }
  return `<div class="qa-section"><h4>依据来源 / 证据评分</h4><div class="mini-grid">${items.map(card).join('')}</div></div>`;
}
function renderExplain(explain){ if(!explain)return ''; return `<details class="qa-section" open><summary><b>为什么这么判断？</b></summary><div style="margin-top:8px"><p><b>引擎：</b>${explain.engine||'qa'}</p><p><b>主意图：</b>${explain.primaryIntent||explain.intent}</p><p><b>副意图：</b>${(explain.secondaryIntents||[]).join('、')||'-'}</p><p><b>命中关键词：</b>${(explain.matchedKeywords||[]).join('、')||'-'}</p><p><b>使用数据源：</b>${(explain.usedDataSources||[]).join('、')||'-'}</p><p><b>证据：</b>共 ${explain.evidenceCount||0} 条，正式接入数据 ${explain.ingestedEvidenceCount||0} 条，强证据 ${explain.strongEvidenceCount||0} 条，冲突/缺口 ${explain.conflictCount||0} 类</p><p><b>综合风险：</b>${explain.risk?`${explain.risk.level}（${explain.risk.score}/100）`:'-'}</p><p><b>推理步骤：</b>${(explain.reasoningSteps||[]).join(' → ')}</p><p><b>边界：</b>${(explain.limitations||[]).join('；')}</p></div></details>`; }
function renderConflicts(items=[]){ if(!items.length) return ''; return `<div class="qa-section"><h4>⚠️ 数据冲突/缺口</h4><div class="timeline">${items.map((c,i)=>`<div class="tl"><span>${i+1}</span><b>${c.type}｜${c.level}</b><p>${c.description}</p><small>${c.suggestion||''}</small></div>`).join('')}</div></div>`; }
function renderPrdaCore(core){ if(!core) return ''; const a=core.analysis||{}; const risk=core.risk||{}; return `<div class="qa-section"><h4>🧠 v1.3 问答中枢</h4><div class="mini-grid"><div class="evidence-card"><b>问题理解</b><div>主意图：${a.primaryIntentLabel||a.primaryIntent}<br>任务类型：${a.taskType||'-'}<br>时间范围：${a.timeRange?.label||'-'}</div></div><div class="evidence-card"><b>实体链接</b><div>${(core.resolvedEntities||[]).map(e=>`${e.type}:${e.name}`).join('、')||'未命中内置对象'}</div></div><div class="evidence-card"><b>证据排序</b><div>强证据 ${(core.rankedEvidence||[]).filter(e=>e.evidenceLevel==='强证据').length} 条 / 总证据 ${(core.rankedEvidence||[]).length} 条</div></div><div class="evidence-card"><b>综合风险</b><div>${risk.level||'-'} ${risk.score!=null?`（${risk.score}/100）`:''}</div></div></div></div>`; }
function renderReasoning(items=[]){return items.length?`<div class="qa-section"><h4>推理链</h4><div class="timeline">${items.map(r=>`<div class="tl"><span>${r.step}</span><b>${r.title}</b><p>${r.detail}</p></div>`).join('')}</div></div>`:''}
function renderRecs(items=[]){return items.length?`<div class="qa-section"><h4>建议清单</h4>${table(['优先级','行动','责任方','时限','预期效果'],items.map(r=>`<tr><td>${tag(r.priority,r.priority)}</td><td>${r.action}</td><td>${r.owner}</td><td>${r.deadline}</td><td>${r.expectedEffect}</td></tr>`))}</div>`:''}
function renderRelated(items=[]){return items.length?`<div class="qa-section"><h4>关联对象</h4><div>${items.map(o=>tag(`${o.type}:${o.name}(${o.relation})`,o.riskLevel)).join('')}</div></div>`:''}
async function renderQA(root) {
  root.innerHTML = `
    <div class="qa-layout">
      <div class="card"><h3>💬 P-R-D-A智能问答中枢 v1.3</h3><div id="chat" class="chat"><div class="msg bot">您好，我是山东交通智能体 v1.3。现在会按“多意图理解 → 实体链接 → 多源证据评分 → 冲突检测 → P-R-D-A综合研判”回答，并让正式入库数据参与主结论。</div></div><div class="toolbar" style="margin-top:12px"><input id="qInput" class="input" style="flex:1" placeholder="例如：鲁A-DJ101所属企业信用怎么样？最近有没有执法风险？"/><button id="askBtn" class="btn">发送</button></div></div>
      <div class="grid" style="gap:16px">
        <div class="card qa-note">
          <h3>🧠 v1.3 是怎么工作的？</h3>
          <p>本版沿用 P-R-D-A，但不再只是展示模板，而是作为问答推理骨架。</p>
          <div class="qa-flow">
            <div><b>1. 多意图理解</b><span>同时识别车辆、企业、执法、路网、应急等复合问题，不再只命中单一意图。</span></div>
            <div><b>2. 实体链接</b><span>抽取车牌、企业、路段等主体，并和内置对象库、正式入库数据建立关联。</span></div>
            <div><b>3. 证据驱动研判</b><span>正式接入数据不再只做附加证据，而是参与主回答、风险等级和建议生成。</span></div>
            <div><b>4. 冲突检测闭环</b><span>当内置数据和正式台账存在状态冲突或主体缺口时，显式提示并建议人工核查。</span></div>
          </div>
          <div class="qa-note-tip">当前版本：v1.3-prda-intelligent-qa。定位是“P-R-D-A智能问答中枢增强版”。</div>
        </div>
        <div class="card"><h3>推荐追问</h3><div id="suggestions" class="list">${['鲁A-DJ101所属企业信用怎么样？最近有没有执法风险？','当前哪些路段最拥堵？','山东交运集团信用风险如何？','是否存在数据冲突？','基于这些证据生成处置单'].map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join('')}</div></div>
      </div>
    </div>`;
  document.getElementById('askBtn').onclick = askQuestion;
  document.getElementById('qInput').addEventListener('keydown', e => { if (e.key === 'Enter') askQuestion(); });
}
function addMsg(cls, html){ const chat=document.getElementById('chat'); chat.insertAdjacentHTML('beforeend', `<div class="msg ${cls}">${html}</div>`); chat.scrollTop=chat.scrollHeight; }
async function askQuestion(){ const input=document.getElementById('qInput'); const question=input.value.trim(); if(!question) return; input.value=''; addMsg('user', question); try{ const data=await api('/qa/ask',{method:'POST',body:JSON.stringify({question})}); addMsg('bot', `<b>引擎：</b><span class="kbd">${data.version||data.explain?.engine||'qa'}</span> <b>主意图：</b><span class="kbd">${data.explain?.primaryIntent||data.intent}</span><br><br><div class="answer-text">${data.answer}</div>${prda(data.prda)}${renderPrdaCore(data.prdaCore)}${renderExplain(data.explain)}${renderConflicts(data.conflicts)}${renderEvidence(data.evidence,data.evidenceGroups)}${renderReasoning(data.reasoningChain)}${renderRecs(data.recommendations)}${renderRelated(data.relatedObjects)}<div class="qa-section"><h4>推荐追问</h4>${(data.suggestedQuestions||[]).map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join('')}</div>`); document.getElementById('suggestions').innerHTML = (data.suggestedQuestions||[]).map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join(''); }catch(e){ addMsg('bot', `<span class="red">问答失败：${e.message}</span>`); } }
function quickAsk(q){ document.getElementById('qInput').value=q; askQuestion(); }
