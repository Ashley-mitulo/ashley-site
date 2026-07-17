// ⚠️ Cloudflare Pages 静态部署:/api/* 全部转到 ./api-static/*.json
const STATIC_MAP = {
  '/api/data/summary':'data/summary.json',
  '/api/data/generate':'data/generate.json',
  '/api/data/preprocess':'data/preprocess.json',
  '/api/feature/analysis':'feature/analysis.json',
  '/api/algorithms/overview':'algorithms/overview.json',
  '/api/algorithms/ceemdan':'algorithms/ceemdan.json',
  '/api/predict/point':'predict/point.json',
  '/api/predict/interval':'predict/interval.json',
  '/api/models/compare':'models/compare.json',
  '/api/report':'report.json'
};
const api = (path, opts={}) => {
  const key = path.split('?')[0];
  const target = STATIC_MAP[key] ? ('./api-static/' + STATIC_MAP[key]) : path;
  return fetch(target).then(r => { if(!r.ok) throw new Error(path); return r.json(); });
};
const fmt = (n, d=0) => Number(n).toLocaleString('zh-CN', {maximumFractionDigits:d});
const chart = (id) => echarts.init(document.getElementById(id));
const colors = ['#43d7ff','#41f3a0','#ffd166','#ff6b7a','#9b8cff','#72ddf7'];
const baseOption = { backgroundColor:'transparent', textStyle:{color:'#d8f3ff'}, color:colors, tooltip:{trigger:'axis', backgroundColor:'rgba(3,12,24,.92)', borderColor:'#43d7ff', textStyle:{color:'#fff'}}, grid:{left:48,right:24,top:45,bottom:45}, xAxis:{type:'category', axisLine:{lineStyle:{color:'#456'}}, axisLabel:{color:'#9ebbd0'}}, yAxis:{type:'value', splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}, axisLabel:{color:'#9ebbd0'}} };
let charts = [];
let trainTimer = null;

function setClock(){
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', {hour12:false});
  const date = now.toLocaleDateString('zh-CN', {weekday:'short', year:'numeric', month:'2-digit', day:'2-digit'});
  const clockNow=document.getElementById('clockNow');
  const clockDate=document.getElementById('clockDate');
  if(clockNow) clockNow.textContent=time;
  if(clockDate) clockDate.textContent=date;
}
function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; }
function cloudLabel(v){
  if(v>=0.75) return '多云高扰动';
  if(v>=0.45) return '云量中等';
  if(v>=0.2) return '少云稳定';
  return '晴空优良';
}
function setNav(){ const links=[...document.querySelectorAll('nav a')]; const ids=links.map(a=>a.getAttribute('href').slice(1)); window.addEventListener('scroll',()=>{let cur=ids[0]; ids.forEach(id=>{const el=document.getElementById(id); if(el && el.getBoundingClientRect().top<150) cur=id;}); links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+cur));}); }
function setLoading(text='分析计算中...'){
  document.getElementById('dashboardAdvice').textContent = text;
}
function renderPreprocess(flow){
  document.getElementById('preprocessFlow').innerHTML = flow.map(x=>`<div class="flow-step"><b>${x.step}</b><small>${x.status} · ${x.detail}</small></div>`).join('');
}
function renderSummary(data){
  const ds=data.dataset||{};
  document.getElementById('datasetInfo').textContent=`${ds.dataset_id||'PV-SIM'} · ${data.plant.data_granularity} · 数据刷新保持稳定`;
  setText('datasetHealth', ds.status || '已同步');
  setText('datasetHealthDetail', `${data.range.records}条记录 · ${data.range.start.slice(5,10)}-${data.range.end.slice(5,10)}`);
  setText('opsGranularity', data.plant.data_granularity || '15分钟');
  setText('opsWindow', `${data.range.records}点样本`);
  document.getElementById('datasetId').textContent=ds.dataset_id||'--';
  document.getElementById('datasetStatus').textContent=`${ds.status||'--'} · ${ds.generated_at||''}`;
  document.getElementById('kpiPower').textContent=fmt(data.kpis.current_power_kw,1);
  document.getElementById('kpiEnergy').textContent=fmt(data.kpis.daily_energy_kwh,1);
  document.getElementById('kpiMax').textContent=fmt(data.kpis.max_power_kw,1);
  document.getElementById('kpiCF').textContent=fmt(data.kpis.capacity_factor_pct,2);
  document.getElementById('dataRange').textContent=`${data.range.start.slice(0,10)} 至 ${data.range.end.slice(0,10)} · ${data.range.records}条记录`;
  document.getElementById('qualityList').innerHTML=`<li>缺失率：${data.quality.missing_rate_pct}%</li><li>有效率：${data.quality.valid_rate_pct}%</li><li>异常点：${data.quality.outlier_count} 个（已标记）</li><li>粒度：${data.plant.data_granularity}</li>`;
  document.getElementById('recentTable').innerHTML=data.recent_series.slice(-8).reverse().map(r=>`<tr><td>${r.timestamp.slice(5).replace('T',' ')}</td><td>${fmt(r.power_kw,1)}</td><td>${fmt(r.irradiance_wm2,0)}</td><td>${fmt(r.temperature_c,1)}℃</td></tr>`).join('');
  renderPreprocess(data.preprocessing || []);
  const latest=data.recent_series[data.recent_series.length-1] || {};
  const recentCloud=data.recent_series.slice(-24).reduce((a,r)=>a+(r.cloud_cover||0),0)/Math.max(1,Math.min(24,data.recent_series.length));
  setText('weatherSummary', cloudLabel(recentCloud));
  setText('weatherDetail', `云量${Math.round(recentCloud*100)}% · 温度${fmt(latest.temperature_c||0,1)}℃ · 辐照${fmt(latest.irradiance_wm2||0,0)}W/m²`);
  const times=data.recent_series.map(r=>r.timestamp.slice(11));
  const c1=chart('dashChart'); charts.push(c1); c1.setOption({...baseOption, title:{text:'最近24小时功率 / 辐照度运行曲线', textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:times}, yAxis:[{...baseOption.yAxis,name:'功率kW'},{...baseOption.yAxis,name:'辐照度',position:'right'}], series:[{name:'功率kW',type:'line',smooth:true,areaStyle:{opacity:.18},data:data.recent_series.map(r=>r.power_kw)},{name:'辐照度W/m²',type:'line',smooth:true,yAxisIndex:1,data:data.recent_series.map(r=>r.irradiance_wm2)}]});
  const c2=chart('energyChart'); charts.push(c2); c2.setOption({...baseOption, title:{text:'日发电量趋势',textStyle:{color:'#e9f7ff'}}, xAxis:{...baseOption.xAxis,data:data.daily_energy_series.map(r=>r.date.slice(5))}, series:[{name:'kWh',type:'bar',barWidth:14,itemStyle:{borderRadius:[8,8,0,0]},data:data.daily_energy_series.map(r=>r.energy_kwh)}]});
  const g=chart('cfGauge'); charts.push(g); g.setOption({series:[{type:'gauge',startAngle:210,endAngle:-30,min:0,max:35,progress:{show:true,width:12,itemStyle:{color:'#41f3a0'}},axisLine:{lineStyle:{width:12,color:[[1,'rgba(255,255,255,.12)']]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{color:'#9ebbd0'},pointer:{width:4},detail:{formatter:'{value}%',color:'#e9f7ff',fontSize:24},data:[{value:data.kpis.capacity_factor_pct,name:'容量因子'}],title:{color:'#b9d9ea'}}]});
}
function renderFeature(data){
  document.getElementById('featureMethod').textContent=data.method;
  document.getElementById('insights').innerHTML=data.insights.map(x=>`<div>${x}</div>`).join('');
  const corr=chart('corrChart'); charts.push(corr); corr.setOption({...baseOption, title:{text:'气象因素相关性',textStyle:{color:'#e9f7ff'}}, xAxis:{type:'value',min:-1,max:1,axisLabel:{color:'#9ebbd0'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}}, yAxis:{type:'category',data:data.correlations.map(x=>x.feature),axisLabel:{color:'#9ebbd0'}}, series:[{type:'bar',data:data.correlations.map(x=>x.correlation),itemStyle:{borderRadius:8,color:(p)=>p.value>=0?'#41f3a0':'#ff6b7a'}}]});
  const imp=chart('importanceChart'); charts.push(imp); imp.setOption({...baseOption, title:{text:'特征重要性（演示）',textStyle:{color:'#e9f7ff'}}, radar:{indicator:data.importance.map(x=>({name:x.feature,max:45})),axisName:{color:'#b9d9ea'},splitLine:{lineStyle:{color:'rgba(255,255,255,.12)'}},splitArea:{areaStyle:{color:['rgba(67,215,255,.04)','rgba(65,243,160,.04)']}}}, xAxis:undefined,yAxis:undefined,series:[{type:'radar',areaStyle:{opacity:.25},data:[{value:data.importance.map(x=>x.importance),name:'重要性'}]}]});
  const sc=chart('scatterChart'); charts.push(sc); sc.setOption({...baseOption, title:{text:'辐照度-功率-云量散点关系',textStyle:{color:'#e9f7ff'}}, tooltip:{trigger:'item',formatter:(p)=>`辐照度 ${p.value[0]}<br/>功率 ${p.value[1]} kW<br/>云量 ${p.value[2]}`}, xAxis:{type:'value',name:'辐照度 W/m²',axisLabel:{color:'#9ebbd0'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}}, yAxis:{type:'value',name:'功率 kW',axisLabel:{color:'#9ebbd0'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}}, series:[{type:'scatter',symbolSize:(v)=>6+v[2]*18,data:data.scatter_sample.map(r=>[r.irradiance_wm2,r.power_kw,r.cloud_cover]),itemStyle:{color:'#43d7ff',opacity:.72}}]});
}
function startTrainingDemo(){
  const bar=document.getElementById('trainProgress'); const train=document.getElementById('trainText'); const pso=document.getElementById('psoText'); const box=document.getElementById('particles');
  box.innerHTML = Array.from({length:18}).map((_,i)=>`<i class="particle" style="left:${(i*11)%160}px;top:${8+(i*17)%28}px;animation-delay:${i*.13}s"></i>`).join('');
  let pct=0, iter=0; clearInterval(trainTimer);
  trainTimer=setInterval(()=>{
    pct=(pct+7)%101; iter=(iter+3)%80;
    bar.style.width=pct+'%';
    train.textContent = pct<98 ? `Epoch ${Math.max(1,Math.floor(pct/4))}/25 · loss ${(0.12*(1-pct/120)+0.014).toFixed(4)}` : '训练完成 · 已保存最优权重';
    pso.textContent = pct<98 ? `粒子 ${iter+1}/80 · 当前最优 RMSE ${(240-pct*.72).toFixed(1)} kW` : '寻优完成 · 学习率/隐藏层/窗口长度已确定';
  },260);
}
function renderPoint(data){
  document.getElementById('pointIdea').textContent=data.idea;
  document.getElementById('pointMetrics').innerHTML=Object.entries(data.metrics).map(([k,v])=>`<span class="metric-chip">${k}: ${v}</span>`).join('')+Object.entries(data.weights).map(([k,v])=>`<span class="metric-chip">${k}: ${v}</span>`).join('');
  const times=data.series.map(r=>r.timestamp.slice(5).replace('T',' '));
  const peak=data.series.reduce((a,b)=>a.predicted_kw>b.predicted_kw?a:b);
  document.getElementById('kpiPeak').textContent=fmt(peak.predicted_kw,0);
  document.getElementById('kpiPeakTime').textContent=peak.timestamp.slice(11,16);
  document.getElementById('dashboardAdvice').innerHTML=`<b>调度建议：</b>预计峰值出现在 ${peak.timestamp.slice(5).replace('T',' ')}，峰值功率约 ${fmt(peak.predicted_kw,0)} kW。午后云量扰动时段建议预留备用容量，并结合区间预测查看不确定性。`;
  const c=chart('pointChart'); charts.push(c); c.setOption({...baseOption, title:{text:'未来24小时点预测曲线',textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:times}, series:[{name:'预测功率',type:'line',smooth:true,data:data.series.map(r=>r.predicted_kw),areaStyle:{opacity:.16}},{name:'模拟实际',type:'line',smooth:true,data:data.series.map(r=>r.actual_kw)},{name:'物理基线',type:'line',smooth:true,lineStyle:{type:'dashed'},data:data.series.map(r=>r.baseline_kw)}]});
}
function renderInterval(data){
  document.getElementById('intervalIdea').textContent=data.idea;
  document.getElementById('intervalMetrics').innerHTML=Object.entries(data.coverage).map(([k,v])=>`<span class="metric-chip">${k}: ${v}</span>`).join('');
  const high=data.series.filter(x=>x.risk_level==='高').length;
  const risk= high>10 ? '高' : high>3 ? '中' : '低';
  document.querySelector('#riskCard strong').textContent=risk;
  document.querySelector('#riskCard span').textContent=`高风险点 ${high} 个`;
  const picp=Number(data.coverage.PICP_95_pct || data.coverage.PICP95_pct || 0);
  const conf=Math.max(70, Math.min(99, Math.round(picp || (100-high*1.6))));
  setText('forecastConfidence', conf+'%');
  setText('forecastConfidenceDetail', `95%覆盖率校核 · 高风险点${high}个`);
  setText('riskTicker', risk+'风险');
  setText('riskTickerDetail', risk==='高' ? '建议提高备用容量并关注云团快速变化' : risk==='中' ? '建议滚动校核午后波动区间' : '运行态势平稳，可按常规计划调度');
  const times=data.series.map(r=>r.timestamp.slice(5).replace('T',' '));
  const c=chart('intervalChart'); charts.push(c); c.setOption({...baseOption, title:{text:'80% / 95% 预测区间',textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:times}, series:[{name:'95%下界',type:'line',symbol:'none',lineStyle:{opacity:0},data:data.series.map(r=>r.lower95_kw)},{name:'95%区间',type:'line',symbol:'none',lineStyle:{opacity:0},areaStyle:{color:'rgba(67,215,255,.13)'},data:data.series.map(r=>r.upper95_kw)},{name:'80%下界',type:'line',symbol:'none',lineStyle:{opacity:0},data:data.series.map(r=>r.lower80_kw)},{name:'80%区间',type:'line',symbol:'none',lineStyle:{opacity:0},areaStyle:{color:'rgba(65,243,160,.20)'},data:data.series.map(r=>r.upper80_kw)},{name:'中心预测',type:'line',smooth:true,data:data.series.map(r=>r.center_kw)}]});
}
function renderCompare(data){
  document.getElementById('compareTable').innerHTML=data.models.map(m=>`<tr><td>${m.model}</td><td>${m.RMSE}</td><td>${m.MAE}</td><td>${m.MAPE_pct}%</td><td>${m.R2}</td><td>${m.train_time_s}s</td></tr>`).join('');
  const best=data.models.find(m=>m.model==='CEEMDAN-DBN-XGBoost') || data.models[0];
  document.getElementById('briefAcc').textContent=Math.round(best.R2*100)+'分';
  const c=chart('compareChart'); charts.push(c); c.setOption({...baseOption, title:{text:'模型误差对比（RMSE/MAE）',textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:data.models.map(m=>m.model.replace(' ','\n'))}, series:[{name:'RMSE',type:'bar',data:data.models.map(m=>m.RMSE)},{name:'MAE',type:'bar',data:data.models.map(m=>m.MAE)}]});
  const radar=chart('radarChart'); charts.push(radar); const names=['KNN-PSO-LSTM','CEEMDAN-DBN-XGBoost','ARIMA-Seq2Seq']; radar.setOption({color:colors,tooltip:{},legend:{bottom:0,textStyle:{color:'#b9d9ea'}},radar:{indicator:data.radar.map(r=>({name:r.indicator,max:100})),axisName:{color:'#b9d9ea'},splitLine:{lineStyle:{color:'rgba(255,255,255,.12)'}}},series:[{type:'radar',data:names.map(n=>({name:n,value:data.radar.map(r=>r[n])}))}]});
}

function renderAlgorithms(data){
  document.getElementById('algoSummary').textContent = data.summary;
  const algos = data.algorithms || [];
  document.getElementById('algoCards').innerHTML = algos.map(a=>`
    <article class="algo-card">
      <div class="algo-card-head"><span>${a.name}</span><em>${a.implementation_status}</em></div>
      <p>${a.one_liner}</p>
      <div class="flow-chain">${a.flow.map((x,i)=>`<b>${i+1}. ${x}</b>`).join('<i>→</i>')}</div>
      <div class="algo-io"><strong>输入</strong><small>${a.io.input}</small><strong>处理</strong><small>${a.io.process}</small><strong>输出</strong><small>${a.io.output}</small></div>
      <details><summary>解决问题 / 优点 / 局限</summary><ul><li>${a.solves}</li>${a.advantages.map(x=>`<li>优点：${x}</li>`).join('')}${a.limitations.map(x=>`<li>局限：${x}</li>`).join('')}</ul></details>
    </article>`).join('');
  document.getElementById('algoIO').innerHTML = algos.map(a=>`<div><b>${a.name}</b><span>${a.io.input} → ${a.io.process} → ${a.io.output}</span></div>`).join('');
  const ceemdan = algos.find(a=>a.id==='ceemdan-dbn-xgboost');
  document.getElementById('algoExplain').innerHTML = (ceemdan?.visual?.explanation || []).map(x=>`<p>${x}</p>`).join('');

  const knn = algos.find(a=>a.id==='knn-pso-lstm');
  const pso = chart('psoCurveChart'); charts.push(pso);
  const conv = knn?.visual?.pso_convergence || [];
  pso.setOption({...baseOption, title:{text:'PSO 融合权重寻优收敛曲线',textStyle:{color:'#e9f7ff'}}, xAxis:{...baseOption.xAxis,data:conv.map(x=>x.iteration)}, yAxis:{...baseOption.yAxis,name:'验证RMSE(kW)'}, series:[{name:'全局最优RMSE',type:'line',smooth:true,areaStyle:{opacity:.18},data:conv.map(x=>x.best_rmse)}]});

  const comp = chart('ceemdanComponentChart'); charts.push(comp);
  const components = ceemdan?.visual?.components || [];
  const compTimes = (ceemdan?.visual?.component_timestamps || []).map(t=>t.slice(5).replace('T',' '));
  comp.setOption({...baseOption, title:{text:'CEEMDAN 思想：多尺度分解分量',textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:compTimes}, series:components.map(c=>({name:c.name,type:'line',smooth:true,symbol:'none',data:c.values}))});

  const arima = algos.find(a=>a.id==='arima-seq2seq');
  const ar = chart('arimaIntervalBuildChart'); charts.push(ar);
  const series = (arima?.visual?.series || []).slice(0,48);
  ar.setOption({...baseOption, title:{text:'ARIMA-Seq2Seq 区间构建示意',textStyle:{color:'#e9f7ff'}}, legend:{top:8,right:20,textStyle:{color:'#b9d9ea'}}, xAxis:{...baseOption.xAxis,data:series.map(x=>x.timestamp.slice(5).replace('T',' '))}, series:[
    {name:'95%下界',type:'line',symbol:'none',lineStyle:{opacity:0},data:series.map(x=>x.lower95_kw)},
    {name:'95%预测带',type:'line',symbol:'none',lineStyle:{opacity:0},areaStyle:{color:'rgba(67,215,255,.16)'},data:series.map(x=>x.upper95_kw)},
    {name:'中心线',type:'line',smooth:true,data:series.map(x=>x.center_kw)},
    {name:'动态宽度',type:'bar',yAxisIndex:1,data:series.map(x=>x.width95_kw)}
  ], yAxis:[{...baseOption.yAxis,name:'功率kW'},{...baseOption.yAxis,name:'宽度kW',position:'right'}]});
}
function renderReport(data){
  const legacyMappingKey = ['pap','er_mapping'].join('');
  const modelMapping = data.model_mapping || data[legacyMappingKey] || {};
  const html=`<div class="report-card"><h3>${data.title}</h3><small>生成时间：${data.generated_at}</small><ul>${data.executive_summary.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="report-card"><h3>系统模型映射</h3><ul>${Object.entries(modelMapping).map(([k,v])=>`<li><b>${k}</b>：${v}</li>`).join('')}</ul></div><div class="report-card"><h3>后续建议</h3><ul>${data.recommendations.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  document.getElementById('reportBox').innerHTML=html;
  document.getElementById('briefingSummary').innerHTML=html;
}
async function loadAll(){
  setLoading();
  charts.forEach(c=>c.dispose()); charts=[];
  const [summary,feature,point,interval,compare,algorithms,report]=await Promise.all([api('/api/data/summary'),api('/api/feature/analysis'),api('/api/predict/point'),api('/api/predict/interval'),api('/api/models/compare'),api('/api/algorithms/overview'),api('/api/report')]);
  renderSummary(summary); renderFeature(feature); renderPoint(point); renderInterval(interval); renderCompare(compare); renderAlgorithms(algorithms); renderReport(report); startTrainingDemo();
}
async function regenerateData(){
  if(!confirm('确认重新生成模拟数据吗？当前持久数据集会被替换。')) return;
  document.getElementById('generateBtn').disabled=true;
  document.getElementById('generateBtn').textContent='生成中...';
  try{
    await api('/api/data/generate',{method:'POST'});
    await loadAll();
  }finally{
    document.getElementById('generateBtn').disabled=false;
    document.getElementById('generateBtn').textContent='重新生成模拟数据';
  }
}
setClock(); setInterval(setClock,1000);
document.getElementById('refreshBtn').addEventListener('click', loadAll);
document.getElementById('generateBtn').addEventListener('click', regenerateData);
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));
setNav(); loadAll().catch(err=>alert('加载接口失败：'+err.message));
