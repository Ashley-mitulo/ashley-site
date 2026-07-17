function renderEvidence(items=[],groups=null){
  if(groups){
    const block=(title,list=[])=>list.length?`<h5>${title}</h5><div class="mini-grid">${list.map(e=>`<div class="evidence-card"><b>${e.title}</b><div>${e.value||e.detail||''}</div><small>${e.type}｜${e.source||''}｜置信度 ${Math.round((e.confidence||0)*100)}%</small></div>`).join('')}</div>`:'';
    return `<div class="qa-section"><h4>依据来源</h4>${block('系统内置业务数据',groups.builtin)}${block('正式接入数据',groups.ingested)}${block('知识库依据',groups.knowledge)}${block('规则/诊断模型依据',groups.rules)}</div>`;
  }
  return `<div class="qa-section"><h4>依据来源</h4><div class="mini-grid">${items.map(e=>`<div class="evidence-card"><b>${e.title}</b><div>${e.value}</div><small>${e.type}｜${e.source}｜置信度 ${Math.round((e.confidence||0)*100)}%</small></div>`).join('')}</div></div>`
}
function renderExplain(explain){ if(!explain)return ''; return `<details class="qa-section"><summary><b>为什么这么判断？</b></summary><div style="margin-top:8px"><p><b>意图：</b>${explain.intent}</p><p><b>命中关键词：</b>${(explain.matchedKeywords||[]).join('、')||'-'}</p><p><b>使用数据源：</b>${(explain.usedDataSources||[]).join('、')||'-'}</p><p><b>证据数量：</b>${explain.evidenceCount}，其中正式接入数据 ${explain.ingestedEvidenceCount}</p><p><b>推理步骤：</b>${(explain.reasoningSteps||[]).join(' → ')}</p><p><b>边界：</b>${(explain.limitations||[]).join('；')}</p></div></details>`; }

function renderReasoning(items=[]){return `<div class="qa-section"><h4>推理链</h4><div class="timeline">${items.map(r=>`<div class="tl"><span>${r.step}</span><b>${r.title}</b><p>${r.detail}</p></div>`).join('')}</div></div>`}
function renderRecs(items=[]){return `<div class="qa-section"><h4>建议清单</h4>${table(['优先级','行动','责任方','时限','预期效果'],items.map(r=>`<tr><td>${tag(r.priority,r.priority)}</td><td>${r.action}</td><td>${r.owner}</td><td>${r.deadline}</td><td>${r.expectedEffect}</td></tr>`))}</div>`}
function renderRelated(items=[]){return `<div class="qa-section"><h4>关联对象</h4><div>${items.map(o=>tag(`${o.type}:${o.name}(${o.relation})`,o.riskLevel)).join('')}</div></div>`}
async function renderQA(root) {
  root.innerHTML = `
    <div class="qa-layout">
      <div class="card"><h3>💬 城市体检式交通智能问答</h3><div id="chat" class="chat"><div class="msg bot">您好，我是山东交通智能体。回答会按“依据 + 推理 + 建议”展开，并关联企业、车辆、司机、违法和信用对象。</div></div><div class="toolbar" style="margin-top:12px"><input id="qInput" class="input" style="flex:1" placeholder="例如：当前哪些路段最拥堵？鲁A-DJ101是否存在异常？山东交运集团信用风险如何？"/><button id="askBtn" class="btn">发送</button></div></div>
      <div class="grid" style="gap:16px">
        <div class="card qa-note">
          <h3>🧠 智能问答是怎么工作的？</h3>
          <p>它不是随便聊天，也不是凭空编答案，而是按一套固定流程回答：</p>
          <div class="qa-flow">
            <div><b>1. 听懂问题</b><span>先判断你问的是路网、车辆、企业信用、物流、执法、应急还是政策知识。</span></div>
            <div><b>2. 查找数据</b><span>再去本系统的数据里找对应的路段、车辆、企业、事件、证据链和知识条目。</span></div>
            <div><b>3. 交通研判</b><span>按照 P-R-D-A：感知现状、分析原因、给出决策、形成行动建议。</span></div>
            <div><b>4. 结构化回答</b><span>最后展示“依据来源、推理链、建议清单、关联对象”，方便核查和汇报。</span></div>
          </div>
          <div class="qa-note-tip">当前版本是规则引擎 + 本地数据 + 诊断模板的智能体原型；后续可接入真实大模型和 RAG 知识库。</div>
        </div>
        <div class="card"><h3>推荐追问</h3><div id="suggestions" class="list">${['当前哪些路段最拥堵？','鲁A-DJ101是否存在异常？','山东交运集团信用风险如何？','物流OD瓶颈在哪里？','CL001证据链是否完整？'].map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join('')}</div></div>
      </div>
    </div>`;
  document.getElementById('askBtn').onclick = askQuestion;
  document.getElementById('qInput').addEventListener('keydown', e => { if (e.key === 'Enter') askQuestion(); });
}
function addMsg(cls, html){ const chat=document.getElementById('chat'); chat.insertAdjacentHTML('beforeend', `<div class="msg ${cls}">${html}</div>`); chat.scrollTop=chat.scrollHeight; }
async function askQuestion(){ const input=document.getElementById('qInput'); const question=input.value.trim(); if(!question) return; input.value=''; addMsg('user', question); const data=await api('/qa/ask',{method:'POST',body:JSON.stringify({question})}); addMsg('bot', `<b>意图：</b><span class="kbd">${data.intent}</span><br><br><div class="answer-text">${data.answer}</div>${prda(data.prda)}${renderExplain(data.explain)}${renderEvidence(data.evidence,data.evidenceGroups)}${renderReasoning(data.reasoningChain)}${renderRecs(data.recommendations)}${renderRelated(data.relatedObjects)}<div class="qa-section"><h4>推荐追问</h4>${data.suggestedQuestions.map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join('')}</div>`); document.getElementById('suggestions').innerHTML = data.suggestedQuestions.map(q=>`<button class="btn secondary" onclick="quickAsk('${q}')">${q}</button>`).join(''); }
function quickAsk(q){ document.getElementById('qInput').value=q; askQuestion(); }
