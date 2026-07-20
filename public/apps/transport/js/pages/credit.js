async function renderCredit(root) {
  const [companies, highRisk, graph] = await Promise.all([api('/credit/companies'), api('/credit/high-risk'), api('/graph/overview')]);
  root.innerHTML = `
    <div class="grid grid-4">${metric('监管企业',companies.length,'客货/危化/物流','cyan')}${metric('高风险主体',highRisk.length,'重点监管','red')}${metric('信用优秀',companies.filter(c=>c.creditScore>=85).length,'信用A级','green')}${metric('平均信用分',(companies.reduce((a,b)=>a+b.creditScore,0)/companies.length).toFixed(1),'总体信用水平','yellow')}</div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>🏢 企业信用表</h3>${table(['企业名称','城市','类型','信用分','风险','违法次数'], companies.map(c=>`<tr><td><a class="download" href="javascript:showCompany('${c.id}')">${c.name}</a></td><td>${c.city}</td><td>${c.businessType}</td><td class="${c.creditScore>=85?'green':c.creditScore>=70?'yellow':'red'}">${c.creditScore}</td><td>${tag(c.riskLevel,c.riskLevel)}</td><td>${c.violations}</td></tr>`))}</div><div class="card"><h3>🕸️ 对象关联图谱</h3><div id="graphChart" class="chart"></div></div></div>
    <div class="card" style="margin-top:16px"><h3>企业详情</h3><div id="creditDetail" class="muted">点击企业名称查看车辆、司机、执法案件、信用风险。</div></div>`;
  const catIndex={'企业':0,'车辆':1,'司机':2,'违法/案件':3,'信用':4};
  chart('graphChart',{tooltip:{},legend:[{data:graph.categories.map(c=>c.name),textStyle:{color:'#d7ecff'}}],series:[{type:'graph',layout:'force',roam:true,categories:graph.categories,data:graph.nodes.map(n=>({...n,category:catIndex[n.type]||0,symbolSize:n.type==='企业'?38:n.type==='信用'?30:22,itemStyle:{color:n.riskLevel==='高'?'#ff4560':n.riskLevel==='中'?'#feb019':'#00e396'}})),links:graph.edges.map(e=>({source:e.source,target:e.target,label:{show:false,formatter:e.name}})),label:{show:true,color:'#d7ecff'},force:{repulsion:130,edgeLength:90},lineStyle:{color:'#82a7c7',opacity:.55}}]});
}
async function showCompany(id){ const c=await api(`/credit/company/${id}`); const g=await api(`/graph/company/${id}`); document.getElementById('creditDetail').innerHTML=`<div class="item"><div class="item-title">${c.name} ${tag(c.riskLevel,c.riskLevel)}</div><div>信用分 ${c.creditScore}｜违法 ${c.violations} 起｜车辆 ${c.vehicleList?.length||0} 辆｜司机 ${c.driverList?.length||0} 名</div><div class="muted">${c.riskExplanation}</div><div style="margin-top:10px"><button class="btn" onclick="runAiCompanyProfile('${id}')">🤖 AI 治理专题</button> <button class="btn secondary" onclick="alert(\'静态展示版不支持 Markdown 下载。请本地部署 transport-agent-system v2.0（端口 3009）体验完整 AI + 下载能力。\')">📄 下载 Markdown</button></div><div id="aiCompanyPanel-${id}" style="margin-top:12px"></div><h4>关联车辆</h4><div>${(c.vehicleList||[]).map(v=>tag(v.plateNo,v.status==='异常'?'高':'低')).join('')}</div><h4>关联司机</h4><div>${(c.driverList||[]).map(d=>tag(`${d.name}(${d.riskScore})`,d.status==='重点关注'?'中':'低')).join('')}</div><h4>执法线索/案件</h4><div>${(c.enforcementClues||[]).map(x=>tag(x.id+':'+x.type,x.level)).join('')||'无'}</div></div>`; }

async function runAiCompanyProfile(id){
  const panel=document.getElementById(`aiCompanyPanel-${id}`);
  if (window.__TRANSPORT_STATIC__) {
    panel.innerHTML = `<div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px"><h4 style="margin:0 0 8px 0">🤖 企业治理专题 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助 · 静态演示)</small></h4>
      <p><b>⚠️ 当前为 Cloudflare Pages 静态展示部署</b>。AI 治理专题需要接入豆包 ark-code-latest 模型，浏览器无法直接调用。</p>
      <p><b>本地体验完整能力：</b></p>
      <ol style="line-height:1.8"><li>克隆独立版 <code>transport-agent-system v2.0-ai-enhanced</code></li><li><code>npm start</code> 启动，访问 <code>http://localhost:3009</code></li><li>在信用画像页点企业 → 🤖 AI 治理专题</li></ol>
      <p><b>AI 会给出：</b>关键发现 · 信用重评 · 治理缺口 · 优先级建议表 · 研判依据（实测 C001 输出 1228 字，把"低信用"修正为"中"，附 6 项建议 + Markdown 下载）</p>
    </div>`;
    return;
  }
  panel.innerHTML='<div class="muted">🤖 AI 生成治理专题中（预计10-25s）…</div>';
  try{
    const r=await api(`/ai/profile/company/${id}`,{method:'POST',body:'{}'});
    const p=r.aiProfile;
    const kfHtml=(p.keyFindings||[]).map(x=>`<li>${x}</li>`).join('');
    const gapHtml=(p.governanceGaps||[]).map(x=>`<li>${x}</li>`).join('');
    const sugRows=(p.suggestions||[]).map(s=>`<tr><td>${tag(s.priority,s.priority)}</td><td>${s.action}</td><td>${s.rationale}</td><td>${s.owner}</td><td>${s.timeframe}</td></tr>`);
    panel.innerHTML=`
      <div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px">
        <h4 style="margin:0 0 8px 0">🤖 ${p.companyName} 治理专题 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助)</small></h4>
        <p><b>内置风险：</b>${tag(r.input.builtinRiskLevel,r.input.builtinRiskLevel)} → <b>AI 建议：</b>${tag(p.riskLevelSuggested,p.riskLevelSuggested)}</p>
        <p><b>💡 总体：</b>${p.executiveSummary}</p>
        ${kfHtml?`<h5>🔑 关键发现</h5><ul>${kfHtml}</ul>`:''}
        <h5>📊 信用分析</h5><p>${p.creditAnalysis}</p>
        <h5>🚛 关联车辆与司机风险</h5><p>${p.vehicleRiskProfile}</p>
        <h5>⚖️ 执法历史</h5><p>${p.enforcementHistory}</p>
        ${gapHtml?`<h5>⚠️ 治理缺口</h5><ul>${gapHtml}</ul>`:''}
        ${sugRows.length?`<h5>✅ 处置建议（仅辅助，非指令）</h5>${table(['优先级','建议行动','依据','责任方','时限'],sugRows)}`:''}
        <p><b>🧠 研判依据：</b>${p.reasoning}</p>
        <div style="font-size:11px;color:#7ea7ce">模型：${r.model} · 耗时 ${r.totalMs}ms${r.cached?' · ✅ 缓存命中':''}</div>
      </div>`;
  }catch(e){
    panel.innerHTML=`<div class="red">AI 失败：${e.message}</div>`;
  }
}
