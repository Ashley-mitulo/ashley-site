async function renderVehicle(root) {
  const [vehicles, anomalies] = await Promise.all([api('/vehicle/list'), api('/vehicle/anomalies')]);
  root.innerHTML = `
    <div class="grid grid-4">${metric('车辆总数',vehicles.length,'模拟监管车辆','cyan')}${metric('在线车辆',vehicles.filter(v=>v.online).length,'实时定位在线','green')}${metric('异常车辆',anomalies.length,'需核查处置','red')}${metric('两客一危',vehicles.filter(v=>v.type==='两客一危').length,'重点营运车辆','yellow')}</div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>车型分布</h3><div id="vehiclePie" class="chart-sm"></div></div><div class="card"><h3>异常车辆</h3><div class="list">${anomalies.slice(0,6).map(a=>`<div class="item"><div class="item-title">${tag(a.plateNo,a.level)} ${a.type}</div><div class="muted">${a.companyName}｜${a.riskTags.join('、')}</div>${prda(a.prda)}</div>`).join('')}</div></div></div>
    <div class="card" style="margin-top:16px"><div class="toolbar"><select id="vehicleType" class="select"><option value="">全部类型</option><option>普通货运</option><option>两客一危</option><option>大件运输</option><option>城市客运</option></select><span class="muted">点击车牌查看企业、司机、违法线索和轨迹回放。</span></div><div id="vehicleTable"></div></div>
    <div class="card" style="margin-top:16px"><h3>车辆详情 / 轨迹回放</h3><div id="vehicleDetail" class="muted">点击表格中的车牌查看轨迹点。</div></div>`;
  const drawTable=(type='')=>{const list=type?vehicles.filter(v=>v.type===type):vehicles;document.getElementById('vehicleTable').innerHTML=table(['车牌','类型','企业','驾驶员','位置','速度','状态','风险标签'],list.map(v=>`<tr><td><a class="download" href="javascript:showVehicle('${v.id}')">${v.plateNo}</a></td><td>${v.type}</td><td>${v.companyName}</td><td>${v.driver}</td><td>${v.location}</td><td>${v.speed}</td><td>${tag(v.status,v.status==='异常'?'高':v.status==='关注'?'中':'低')}</td><td>${v.riskTags.map(t=>tag(t,'中')).join('')}</td></tr>`));};
  drawTable(); document.getElementById('vehicleType').onchange=e=>drawTable(e.target.value);
  const groups={}; vehicles.forEach(v=>groups[v.type]=(groups[v.type]||0)+1); chart('vehiclePie',{tooltip:{trigger:'item'},series:[{type:'pie',radius:'70%',data:Object.entries(groups).map(([name,value])=>({name,value}))}]});
}
async function showVehicle(id){ const v=await api(`/vehicle/${id}`); const t=await api(`/vehicle/${id}/trajectory`); const color=s=>({'正常行驶':'#00e396','停留':'#feb019','偏航':'#775dd0','超速':'#ff4560','低速拥堵':'#f6c85f','离线':'#999'}[s]||'#00d4ff'); document.getElementById('vehicleDetail').innerHTML=`<div class="grid grid-2"><div><div class="item"><div class="item-title">${v.plateNo}｜${v.type}｜${tag(v.status,v.status==='异常'?'高':'中')}</div><div>企业：${v.company?.name||v.companyName}（信用${v.company?.creditScore||'-'} / ${v.company?.riskLevel||'-'}）</div><div>司机：${v.driverInfo?.name||v.driver}（资质：${v.driverInfo?.qualification||'-'}，风险分${v.driverInfo?.riskScore||'-'}）</div><div>线索：${(v.clues||[]).map(c=>tag(c.id+':'+c.type,c.level)).join('')||'无'}</div><div class="muted">${v.creditBackground?.explanation||''}</div><div style="margin-top:10px"><button class="btn" onclick="runAiVehicleProfile('${id}')">🤖 AI 风险画像</button> <button class="btn secondary" onclick="alert(\'静态展示版不支持 Markdown 下载。请本地部署 transport-agent-system v2.0（端口 3009）体验完整 AI + 下载能力。\')">📄 下载 Markdown</button></div><div id="aiVehiclePanel-${id}" style="margin-top:12px"></div></div><h4>轨迹点列表</h4><div class="track-list">${(Array.isArray(t)?t:(t.trajectory||[])).map(p=>`<div><b>${p.time}</b> ${tag(p.status,p.status==='超速'||p.status==='偏航'?'高':p.status==='低速拥堵'||p.status==='停留'?'中':'低')} ${p.speed}km/h ${p.roadSegmentId}</div>`).join('')}</div></div><div><div id="trajectoryChart" class="chart"></div></div></div>`; const pts=(Array.isArray(t)?t:(t.trajectory||[])).map(p=>[p.lng,p.lat,p.speed,p.status,p.time]); chart('trajectoryChart',{...baseChart(),xAxis:{show:false,min:115,max:122.5},yAxis:{show:false,min:34.5,max:38},tooltip:{formatter:p=>`${p.data[4]}<br>${p.data[3]} ${p.data[2]}km/h`},series:[{type:'lines',coordinateSystem:'cartesian2d',data:[{coords:pts.map(p=>[p[0],p[1]])}],lineStyle:{color:'#00d4ff',width:3},effect:{show:true,symbol:'arrow',symbolSize:8}},{type:'scatter',coordinateSystem:'cartesian2d',data:pts,symbolSize:p=>p[3]==='停留'?12:8,itemStyle:{color:p=>color(p.data[3])}}]}); }

async function runAiVehicleProfile(id){
  const panel=document.getElementById(`aiVehiclePanel-${id}`);
  if (window.__TRANSPORT_STATIC__) {
    panel.innerHTML = `<div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px"><h4 style="margin:0 0 8px 0">🤖 车辆风险画像 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助 · 静态演示)</small></h4>
      <p><b>⚠️ 当前为 Cloudflare Pages 静态展示部署</b>。AI 车辆风险画像需要接入豆包 ark-code-latest 模型。</p>
      <p><b>本地体验：</b>启动 <code>transport-agent-system v2.0-ai-enhanced</code>（端口 3009）→ 车辆监管页 → 车牌 → 🤖 AI 风险画像</p>
      <p><b>AI 会给出：</b>7 大板块（车/司/企/轨迹/风险等级/风险标签/干预建议）（实测 V001 输出 803 字，风险等级"中高"+ 4 类风险标签，附 Markdown 下载）</p>
    </div>`;
    return;
  }
  panel.innerHTML='<div class="muted">🤖 AI 生成车辆风险画像中（预计10-25s）…</div>';
  try{
    const r=await api(`/ai/profile/vehicle/${id}`,{method:'POST',body:'{}'});
    const p=r.aiProfile;
    const factsHtml=(p.enforcementFacts||[]).map(x=>`<li>${x}</li>`).join('');
    const tagsHtml=(p.keyRiskTags||[]).map(x=>tag(x,'中')).join('');
    const sugRows=(p.suggestions||[]).map(s=>`<tr><td>${tag(s.priority,s.priority)}</td><td>${s.action}</td><td>${s.rationale}</td><td>${s.owner}</td><td>${s.timeframe}</td></tr>`);
    panel.innerHTML=`
      <div style="background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(120,80,255,.06));border:1px solid rgba(120,180,255,.25);border-radius:8px;padding:12px 14px">
        <h4 style="margin:0 0 8px 0">🤖 ${p.plateNo} 风险画像 <small style="color:#7ea7ce;font-weight:normal">(AI 建议性辅助)</small></h4>
        <p><b>AI 建议风险：</b>${tag(p.riskLevelSuggested,p.riskLevelSuggested)}</p>
        <p><b>💡 总体：</b>${p.executiveSummary}</p>
        <h5>🚛 车辆状态</h5><p>${p.vehicleStatus}</p>
        <h5>👤 驾驶员风险</h5><p>${p.driverRisk}</p>
        <h5>🏢 所属企业风险</h5><p>${p.companyRisk}</p>
        <h5>🗺️ 轨迹洞察</h5><p>${p.trajectoryInsight}</p>
        ${tagsHtml?`<h5>🏷️ 主要风险标签</h5><div>${tagsHtml}</div>`:''}
        ${factsHtml?`<h5>⚖️ 执法事实</h5><ul>${factsHtml}</ul>`:''}
        ${sugRows.length?`<h5>✅ 处置建议（仅辅助，非指令）</h5>${table(['优先级','建议行动','依据','责任方','时限'],sugRows)}`:''}
        <p><b>🧠 研判依据：</b>${p.reasoning}</p>
        <div style="font-size:11px;color:#7ea7ce">模型：${r.model} · 耗时 ${r.totalMs}ms${r.cached?' · ✅ 缓存命中':''}</div>
      </div>`;
  }catch(e){
    panel.innerHTML=`<div class="red">AI 失败：${e.message}</div>`;
  }
}
