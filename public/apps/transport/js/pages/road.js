async function renderRoad(root) {
  const [roads, congestion, events] = await Promise.all([api('/road/network'), api('/road/congestion'), api('/road/events')]);
  const stats = { total: roads.length, high: roads.filter(r=>r.riskLevel==='高').length, jam: roads.filter(r=>r.status==='拥堵').length, event: events.length };
  root.innerHTML = `
    <div class="grid grid-4">${metric('路段总数',stats.total,'高速/国省道/桥隧','cyan')}${metric('拥堵路段',stats.jam,'实时拥堵','red')}${metric('高风险路段',stats.high,'需重点监测','yellow')}${metric('事件数量',stats.event,'今日事件','green')}</div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><h3>拥堵排行</h3><div id="roadRank" class="chart-sm"></div></div><div class="card"><h3>状态分布</h3><div id="roadPie" class="chart-sm"></div></div></div>
    <div class="card" style="margin-top:16px"><div class="toolbar"><select id="roadFilter" class="select"><option value="">全部状态</option><option>畅通</option><option>缓行</option><option>拥堵</option><option>施工</option><option>管制</option></select><span class="muted">点击筛选路段表格</span></div><div id="roadTable"></div></div>
    <div class="card" style="margin-top:16px"><h3>事件列表</h3>${table(['类型','标题','位置','等级','状态'], events.map(e=>`<tr><td>${tag(e.type,e.level)}</td><td>${e.title}</td><td>${e.location}</td><td>${e.level}</td><td>${e.status}</td></tr>`))}</div>`;
  const renderTable = (status='') => { const list = status ? roads.filter(r=>r.status===status) : roads; document.getElementById('roadTable').innerHTML = table(['ID','名称','类型','起终点','里程','区域','状态','风险'], list.map(r=>`<tr><td>${r.id}</td><td>${r.name}</td><td>${r.roadType}</td><td>${r.startPoint}→${r.endPoint}</td><td>${r.mileage}km</td><td>${r.adminRegion}</td><td>${tag(r.status,r.riskLevel)}</td><td>${tag(r.riskLevel,r.riskLevel)}</td></tr>`)); };
  renderTable(); document.getElementById('roadFilter').onchange = e => renderTable(e.target.value);
  chart('roadRank', { ...baseChart(), xAxis:{type:'category',data:congestion.slice(0,8).map(r=>r.name.slice(0,6))}, yAxis:{type:'value'}, series:[{type:'bar',data:congestion.slice(0,8).map(r=>r.congestionIndex), itemStyle:{color:'#ff4560'}}] });
  const groups = {}; roads.forEach(r=>groups[r.status]=(groups[r.status]||0)+1); chart('roadPie', { tooltip:{trigger:'item'}, series:[{type:'pie',radius:['45%','70%'],data:Object.entries(groups).map(([name,value])=>({name,value}))}] });
}
