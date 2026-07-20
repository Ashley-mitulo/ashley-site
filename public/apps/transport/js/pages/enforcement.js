async function renderEnforcement(root) {
  const [clues, overload, cases] = await Promise.all([api('/enforcement/clues'), api('/enforcement/overload'), api('/enforcement/cases')]);
  root.innerHTML = `<div class="grid grid-4">${metric('执法线索',clues.length,'AI识别线索','cyan')}${metric('高等级线索',clues.filter(c=>c.level==='高').length,'优先处置','red')}${metric('超限记录',overload.length,'治超站/非现场','yellow')}${metric('案件数量',cases.length,'在办案件','green')}</div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>线索分类统计</h3><div id="clueChart" class="chart-sm"></div></div><div class="card"><h3>证据链详情</h3><div id="clueDetail" class="muted">点击线索编号查看诊断和证据链。</div></div></div><div class="card" style="margin-top:16px"><h3>线索表</h3>${table(['编号','类型','对象','位置','等级','状态','证据数','时间'], clues.map(c=>`<tr><td><a class="download" href="javascript:showClue('${c.id}')">${c.id}</a></td><td>${c.type}</td><td>${c.target}</td><td>${c.location}</td><td>${tag(c.level,c.level)}</td><td>${c.status}</td><td>${c.evidenceChain?.length||0}</td><td>${c.time}</td></tr>`))}</div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>超限记录</h3>${table(['车牌','治超站','超限率','总重','企业'], overload.map(o=>`<tr><td>${o.plateNo}</td><td>${o.station}</td><td>${o.overloadRate}%</td><td>${o.weight}t</td><td>${o.company}</td></tr>`))}</div><div class="card"><h3>案件列表</h3>${table(['案件','类型','状态','处罚','办理'], cases.map(c=>`<tr><td>${c.title}</td><td>${c.type}</td><td>${c.status}</td><td>${c.penalty}</td><td>${c.handler}</td></tr>`))}</div></div>`;
  const groups={}; clues.forEach(c=>groups[c.type]=(groups[c.type]||0)+1); chart('clueChart',{tooltip:{trigger:'item'},series:[{type:'pie',radius:['45%','70%'],data:Object.entries(groups).map(([name,value])=>({name,value}))}]});
}
async function showClue(id){ const c=await api(`/enforcement/clue/${id}`); document.getElementById('clueDetail').innerHTML=`<div class="item"><div class="item-title">${c.id}｜${c.type}｜${c.target} ${tag(c.level,c.level)}</div><div>关联：车辆 ${c.vehicle?.plateNo||c.vehicleId||'-'}｜企业 ${c.company?.name||c.companyId||'-'}｜司机 ${c.driver?.name||'-'}</div><div class="timeline">${(c.evidenceChain||[]).map(e=>`<div class="tl"><span>${e.step}</span><b>${e.type}｜${e.title}</b><p>${e.detail}</p><small>${e.time}｜${e.source}｜置信度 ${Math.round(e.confidence*100)}%</small></div>`).join('')}</div><h4>处置建议</h4><div>${c.disposalAdvice}</div>${prda(c.diagnosis?.prda)}<div style="margin-top:12px"><button class="btn" onclick="runAiClueAudit('${id}')">🤖 AI 证据质检</button></div><div id="aiCluePanel-${id}" style="margin-top:12px"></div></div>`; }

async function runAiClueAudit(id){
  const panel=document.getElementById(`aiCluePanel-${id}`);
  if (window.__TRANSPORT_STATIC__) {
    panel.innerHTML = `<div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px"><h4 style="margin:0 0 8px 0">🤖 执法证据质检 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助 · 静态演示)</small></h4>
      <p><b>⚠️ 当前为 Cloudflare Pages 静态展示部署</b>。AI 证据质检需要接入豆包 ark-code-latest 模型。</p>
      <p><b>本地体验：</b>启动 <code>transport-agent-system v2.0-ai-enhanced</code>（端口 3009）→ 执法监管页 → 线索编号 → 🤖 AI 证据质检</p>
      <p><b>AI 会给出：</b>结论 · 置信度 · 一致性问题 · 证据缺口 · 补查建议（实测 CL001 输出 916 字，结论"证据基本充分"置信度 82，主动识别视频置信度短板）</p>
    </div>`;
    return;
  }
  panel.innerHTML='<div class="muted">🤖 AI 交叉审查证据链中（预计10-25s）…</div>';
  try{
    const r=await api(`/ai/audit/clue/${id}`,{method:'POST',body:'{}'});
    const a=r.aiAudit;
    const scoreColor=a.confidenceScore>=80?'#00e396':a.confidenceScore>=60?'#feb019':'#ff4560';
    const issuesHtml=(a.consistencyIssues||[]).map(x=>`<li>${tag(x.severity,x.severity)} <b>${x.type}</b>：${x.description}${x.evidencePoints?.length?`<br><small class="muted">涉及：${x.evidencePoints.join('、')}</small>`:''}</li>`).join('');
    const missHtml=(a.missingEvidence||[]).map(x=>`<li>${x}</li>`).join('');
    const crossHtml=(a.crossCheckFindings||[]).map(x=>`<li>${x}</li>`).join('');
    const sugRows=(a.suggestedActions||[]).map(s=>`<tr><td>${tag(s.priority,s.priority)}</td><td>${s.action}</td><td>${s.rationale}</td><td>${s.owner}</td><td>${s.timeframe}</td></tr>`);
    const cs=a.chainStrength||{};
    panel.innerHTML=`
      <div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px">
        <h4 style="margin:0 0 8px 0">🤖 ${a.clueId} 证据质检 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助)</small></h4>
        <p><b>整体结论：</b>${a.overallVerdict} <b style="margin-left:16px">置信度：</b><span style="color:${scoreColor};font-size:18px;font-weight:bold">${a.confidenceScore}</span></p>
        <p><b>🔗 证据链强度：</b>${cs.complete?'✅ 完整':'⚠️ 不完整'} · 强证据 ${cs.strongLinks??'-'} · 弱证据 ${cs.weakLinks??'-'}<br><small class="muted">${cs.explanation||''}</small></p>
        ${issuesHtml?`<h5>⚠️ 一致性问题</h5><ul>${issuesHtml}</ul>`:'<p class="green">✅ 未发现明显一致性问题</p>'}
        ${missHtml?`<h5>🕳️ 缺失证据</h5><ul>${missHtml}</ul>`:''}
        ${crossHtml?`<h5>🔍 交叉核对发现</h5><ul>${crossHtml}</ul>`:''}
        ${sugRows.length?`<h5>✅ 补查建议（仅辅助，非指令）</h5>${table(['优先级','建议行动','依据','责任方','时限'],sugRows)}`:''}
        <p><b>🧠 研判依据：</b>${a.reasoning}</p>
        <div style="font-size:11px;color:#7ea7ce">模型：${r.model} · 耗时 ${r.totalMs}ms${r.cached?' · ✅ 缓存命中':''}</div>
      </div>`;
  }catch(e){
    panel.innerHTML=`<div class="red">AI 失败：${e.message}</div>`;
  }
}
