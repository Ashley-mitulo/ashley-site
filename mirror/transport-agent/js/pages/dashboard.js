async function renderDashboard(root) {
  const [s, ind, alerts, roads, events, topics, geo] = await Promise.all([
    api('/dashboard/summary'), api('/dashboard/indicators'), api('/dashboard/risk-alerts'), api('/road/congestion'), api('/road/events'), api('/diagnosis/topics'), api('/geo/shandong')
  ]);
  root.innerHTML = `
    <div class="grid grid-4">${metric('监测路网', s.totalRoads, `拥堵/缓行 ${s.congested+s.slow} 段`, 'cyan')}${metric('车辆在线率', `${s.onlineRate}%`, `在线 ${s.online}/${s.totalVehicles}`, 'green')}${metric('在办事件', s.ongoingEvents, '事故/管制/施工/天气', 'yellow')}${metric('高风险企业', s.highRiskCompanies, `执法线索 ${s.activeClues} 条`, 'red')}</div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>🗺️ 山东交通空间态势</h3><div id="sdMap" class="chart"></div></div><div class="card"><h3>🚛 车辆在线趋势 / 货运活跃度</h3><div id="vehicleTrend" class="chart"></div></div></div>
    <div class="card" style="margin-top:16px"><h3>🧭 专题诊断卡片</h3><div class="topic-grid">${topics.map(t=>`<details class="topic-card"><summary><b>${t.title}</b>${tag(t.riskLevel,t.riskLevel)}<span class="score">${t.score}</span></summary><p>${t.summary}</p><b>关键发现</b><ul>${t.keyFindings.map(x=>`<li>${x}</li>`).join('')}</ul><b>建议</b><div>${t.recommendations.map(x=>tag(x,'中')).join('')}</div><small>依据：${t.evidence.join('；')}｜关联：${(t.relatedObjects||[]).map(o=>o.name).join('、')}</small></details>`).join('')}</div></div>
    <div class="grid grid-3" style="margin-top:16px"><div class="card"><h3>⚠️ 风险预警</h3><div class="list">${alerts.slice(0,6).map(a=>`<div class="item"><div class="item-title">${tag(a.type,a.level)} ${a.title}</div><div class="muted">${a.prda.reasoning}</div></div>`).join('')}</div></div><div class="card"><h3>🔥 拥堵排行</h3>${table(['路段','状态','指数'], roads.slice(0,8).map(r=>`<tr><td>${r.name}</td><td>${tag(r.status,r.riskLevel)}</td><td>${r.congestionIndex}</td></tr>`))}</div><div class="card"><h3>📌 今日事件</h3><div class="list">${events.slice(0,8).map(e=>`<div class="item"><div class="item-title">${tag(e.type,e.level)} ${e.title}</div><div class="muted">${e.location}｜${e.status}</div></div>`).join('')}</div></div></div>`;
  const cities = geo?.cities || {};
  const roadLines = Array.isArray(geo?.roadLines) ? geo.roadLines : [];
  const cityData=Object.entries(cities).map(([name,value])=>({name,value:[...value,8]}));
  const lines=roadLines.flatMap(line=>line.slice(1).map((n,i)=>({coords:[cities[line[i]],cities[n]]})).filter(x=>x.coords[0]&&x.coords[1]));
  // 使用 cartesian2d 经纬度散点/飞线即可，不再配置 ECharts 地图组件，避免查找未注册地图导致首页崩溃。
  chart('sdMap',{...baseChart(),xAxis:{show:false,min:115,max:122.5},yAxis:{show:false,min:34.5,max:38},tooltip:{trigger:'item'},series:[{type:'lines',coordinateSystem:'cartesian2d',data:lines,lineStyle:{color:'#00d4ff',width:2,opacity:.45},effect:{show:true,symbolSize:4}},{type:'effectScatter',coordinateSystem:'cartesian2d',data:cityData,label:{show:true,formatter:'{b}',color:'#d7ecff',position:'right'},symbolSize:v=>v[2]+3,itemStyle:{color:'#00e396'}}]});
  chart('vehicleTrend', { ...baseChart(), legend:{textStyle:{color:'#d7ecff'}}, xAxis:{type:'category',data:ind.timeLabels}, yAxis:{type:'value'}, series:[{name:'在线率',type:'line',smooth:true,data:ind.onlineTrend,itemStyle:{color:'#00e396'}},{name:'货运活跃度',type:'line',smooth:true,data:ind.freightActive,itemStyle:{color:'#feb019'}}] });
}
