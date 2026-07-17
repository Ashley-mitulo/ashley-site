// 静态部署:/api/* 全部转到 ./api-static/*.json
function _apiStaticPath(u){
  const key = u.split('?')[0];
  return './api-static' + (key === '/' ? '/index' : key) + '.json';
}
const api = {
  async get(url) {
    const r = await fetch(_apiStaticPath(url));
    if (!r.ok) throw new Error('静态数据未预置: '+url);
    const j = await r.json();
    if (!j.success && j.status !== 'ok') throw new Error(j.error || '请求失败');
    return j.data || j;
  },
  async post(url, body) {
    // 写操作在静态展示中不保持, 返回内置提示
    console.info('[static demo] POST '+url+' -> 仅展示模式');
    return { message: '静态展示版本, 写入不持久化. 完整能力请本地运行 city-health-agent-system。', static: true };
  }
};

const state = { indicators: [], overview: null, topics: [], currentReport: null, categories: ['安全','绿色','协调','创新','开放','共享'] };
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function statusClass(s){ return s || 'normal'; }
function statusText(s){ return ({normal:'正常',attention:'关注',warning:'预警',risk:'风险'})[s] || s; }
function pageTitle(page){ return ({dashboard:'城市体检驾驶舱',indicators:'指标监测',diagnosis:'智能诊断',spatial:'空间体检',graph:'诊断图谱',qa:'智能问答',knowledge:'知识库',reports:'报告中心'})[page] || '城市体检智能诊断系统'; }

function initNav(){
  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page-' + btn.dataset.page).classList.add('active');
    $('#pageTitle').textContent = pageTitle(btn.dataset.page);
    if (btn.dataset.page === 'indicators') loadIndicators();
    if (btn.dataset.page === 'diagnosis') initDiagnosisTargets();
    if (btn.dataset.page === 'spatial') loadSpatial();
    if (btn.dataset.page === 'graph') loadGraph();
    if (btn.dataset.page === 'qa') loadSuggestions();
    if (btn.dataset.page === 'knowledge') loadKnowledge();
  }));
}

async function loadDashboard(){
  const [overview, trend, diagnosis] = await Promise.all([
    api.get('/dashboard/overview'),
    api.get('/dashboard/trend'),
    api.get('/diagnosis/overall')
  ]);
  state.overview = overview;
  $('#totalScore').textContent = overview.totalScore;
  $('#healthLevel').textContent = overview.healthLevel;
  $('#overviewSummary').textContent = overview.summary;
  $('#indicatorCount').textContent = overview.indicatorCount;
  $('#normalCount').textContent = overview.normalCount;
  $('#warningCount').textContent = overview.warningCount;
  $('#riskCount').textContent = overview.riskCount;
  renderRadar(overview.categoryStats);
  renderTrend(trend);
  renderRiskList(overview.riskTop);
  $('#aiSummary').innerHTML = `<b>综合结论：</b>${diagnosis.conclusion}\n\n<b>治理建议：</b>${diagnosis.suggestion}`;
  fillSelects();
}

function renderRadar(stats){
  const chart = echarts.init($('#radarChart'));
  chart.setOption({ tooltip:{}, radar:{ indicator: stats.map(s => ({ name:s.category, max:100 })), axisName:{ color:'#cde7ff' }, splitLine:{ lineStyle:{ color:'rgba(255,255,255,.15)' } }, splitArea:{ areaStyle:{ color:['rgba(40,214,255,.04)','rgba(90,167,255,.08)'] } } }, series:[{ type:'radar', data:[{ value:stats.map(s=>s.score), name:'健康得分', areaStyle:{ color:'rgba(40,214,255,.28)' }, lineStyle:{ color:'#28d6ff' } }] }] });
}

function renderTrend(trend){
  const chart = echarts.init($('#trendChart'));
  chart.setOption({ tooltip:{ trigger:'axis' }, legend:{ textStyle:{color:'#cde7ff'} }, grid:{ left:40,right:20,bottom:30,top:35 }, xAxis:{ type:'category', data:trend.map(t=>t.year), axisLabel:{color:'#8fb2d2'} }, yAxis:{ type:'value', axisLabel:{color:'#8fb2d2'}, splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}} }, series:[{ name:'综合得分', type:'line', smooth:true, data:trend.map(t=>t.totalScore), lineStyle:{color:'#44e28d',width:3}, areaStyle:{color:'rgba(68,226,141,.12)'} },{ name:'预警数', type:'bar', data:trend.map(t=>t.warningCount), itemStyle:{color:'#ffd166'} },{ name:'风险数', type:'bar', data:trend.map(t=>t.riskCount), itemStyle:{color:'#ff5c7a'} }] });
}

function renderRiskList(list){
  $('#riskList').innerHTML = list.map(i => `<div class="risk-item" onclick="openIndicator('${i.id}')"><div class="item-head"><b>${i.name}</b><span class="tag ${statusClass(i.status)}">${i.statusText}</span></div><div class="muted">${i.category} · 当前值 ${i.value}${i.unit} · 得分 ${i.score}</div></div>`).join('');
}

async function fillSelects(){
  const cats = state.overview?.categoryStats?.map(s=>s.category) || state.categories;
  $('#categoryFilter').innerHTML = '<option value="">全部维度</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  $('#reportCategory').innerHTML = '<option value="">综合报告</option>' + cats.map(c=>`<option value="${c}">${c}专题报告</option>`).join('');
}

async function loadIndicators(){
  const cat = $('#categoryFilter').value; const status = $('#statusFilter').value;
  state.indicators = await api.get(`/indicators?category=${encodeURIComponent(cat)}&status=${encodeURIComponent(status)}`);
  $('#indicatorList').innerHTML = state.indicators.map(i => `<div class="indicator-item" onclick="selectIndicator('${i.id}')"><div class="item-head"><b>${i.name}</b><span class="tag ${i.status}">${i.statusText}</span></div><div class="muted">${i.category}/${i.subcategory} · ${i.value}${i.unit} · ${i.trend.text}</div></div>`).join('');
  if (state.indicators[0]) selectIndicator(state.indicators[0].id);
}

async function selectIndicator(id){
  const [ind, dia] = await Promise.all([api.get('/indicators/' + id), api.get('/diagnosis/indicator/' + id)]);
  $('#indicatorDetailTitle').textContent = ind.name;
  $('#indicatorDetail').innerHTML = `<b>状态：</b>${ind.statusText}｜<b>当前值：</b>${ind.value}${ind.unit}｜<b>目标：</b>${Array.isArray(ind.target)?ind.target.join('-'):ind.target}${ind.unit}\n\n<b>S 表征：</b>${dia.sed.symptom}\n\n<b>E 解释：</b>${dia.sed.explanation}\n\n<b>D 决策：</b>${dia.sed.decision}`;
  const chart = echarts.init($('#indicatorTrend'));
  chart.setOption({ tooltip:{trigger:'axis'}, grid:{left:45,right:20,bottom:30,top:30}, xAxis:{type:'category',data:ind.series.map(s=>s.year),axisLabel:{color:'#8fb2d2'}}, yAxis:{type:'value',axisLabel:{color:'#8fb2d2'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}}, series:[{name:ind.name,type:'line',smooth:true,data:ind.series.map(s=>s.value),lineStyle:{color:'#28d6ff',width:3},areaStyle:{color:'rgba(40,214,255,.12)'},markLine:{data:[{yAxis:Array.isArray(ind.target)?ind.target[0]:ind.target,name:'目标'}]}}] });
}
window.selectIndicator = selectIndicator;
window.openIndicator = (id) => { document.querySelector('[data-page="indicators"]').click(); setTimeout(()=>selectIndicator(id), 200); };

function initFilters(){ $('#categoryFilter').addEventListener('change', loadIndicators); $('#statusFilter').addEventListener('change', loadIndicators); }

async function initDiagnosisTargets(){
  if (!state.indicators.length) state.indicators = await api.get('/indicators');
  if (!state.topics.length) state.topics = await api.get('/diagnosis/topics');
  renderTopics();
  const type = $('#diagnosisType').value;
  if (type === 'overall') $('#diagnosisTarget').innerHTML = '<option value="overall">南京市综合诊断</option>';
  if (type === 'category') $('#diagnosisTarget').innerHTML = state.categories.map(c=>`<option value="${c}">${c}维度</option>`).join('');
  if (type === 'indicator') $('#diagnosisTarget').innerHTML = state.indicators.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
}

function renderTopics(){
  const el = $('#topicGrid'); if (!el) return;
  el.innerHTML = state.topics.map(t => `<div class="topic-card" onclick="runTopic('${t.id}')"><b>${t.name}</b><p>${t.desc}</p></div>`).join('');
}
window.runTopic = async (category) => { $('#diagnosisType').value='category'; await initDiagnosisTargets(); $('#diagnosisTarget').value=category; await runDiagnosis(); };

async function runDiagnosis(){
  const type = $('#diagnosisType').value; const target = $('#diagnosisTarget').value;
  let d;
  if (type === 'overall') d = await api.get('/diagnosis/overall');
  if (type === 'category') d = await api.get('/diagnosis/category/' + encodeURIComponent(target));
  if (type === 'indicator') d = await api.get('/diagnosis/indicator/' + encodeURIComponent(target));
  renderDiagnosis(d, type);
}

function renderDiagnosis(d, type){
  let html = '';
  if (type === 'overall') {
    html += `<div class="sed-card"><h4>总体结论</h4><p>${d.conclusion}</p></div>`;
    html += `<div class="sed-card"><h4>重点风险指标</h4>${d.riskIndicators.slice(0,8).map(i=>`<p>• ${i.name}：${i.statusText}，${i.value}${i.unit}，${i.trend.text}</p>`).join('')}</div>`;
    html += `<div class="sed-card"><h4>治理建议</h4><p>${d.suggestion}</p></div>`;
  } else {
    const sed = d.sed;
    html += `<div class="sed-card"><h4>S 表征：状态感知与偏离识别</h4><p>${sed.symptom}</p></div>`;
    html += `<div class="sed-card"><h4>E 解释：情境归因与路径识别</h4><p>${sed.explanation}</p></div>`;
    html += `<div class="sed-card"><h4>D 决策：策略生成与治理输出</h4><p>${sed.decision}</p></div>`;
    if (d.causalChain) html += `<div class="sed-card"><h4>因果链条</h4>${d.causalChain.map(x=>`<p>→ ${x}</p>`).join('')}</div>`;
  }
  $('#diagnosisResult').innerHTML = html;
}

async function loadSuggestions(){
  const suggestions = await api.get('/qa/suggestions');
  $('#suggestions').innerHTML = suggestions.map(q=>`<button onclick="askQuestion('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('');
  if (!$('#chatMessages').innerHTML) addBot('你好，我是城市体检智能问答助手。你可以询问总体情况、风险指标、某个维度或单个指标，我会按照 S-E-D 结构回答。');
}
function addUser(text){ $('#chatMessages').insertAdjacentHTML('beforeend', `<div class="msg user">${escapeHtml(text)}</div>`); $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight; }
function addBot(text){ $('#chatMessages').insertAdjacentHTML('beforeend', `<div class="msg bot">${escapeHtml(text)}</div>`); $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight; }
function addBotRich(result){
  const related = (result.relatedIndicators||[]).slice(0,5).map(i=>`<span class="mini-indicator">${escapeHtml(i.name)} · ${escapeHtml(i.statusText||statusText(i.status))}</span>`).join('');
  const sources = (result.sources||[]).slice(0,4).map(s=>`<div class="source">${escapeHtml(s.title||s.id||'指标数据')} ${s.type?`｜${escapeHtml(s.type)}`:''}</div>`).join('');
  const follow = (result.followUps||[]).map(q=>`<button onclick="askQuestion('${String(q).replace(/'/g,"\\'")}')">${escapeHtml(q)}</button>`).join('');
  $('#chatMessages').insertAdjacentHTML('beforeend', `<div class="msg bot">${escapeHtml(result.answer)}<div class="qa-extra"><h5>关联指标</h5><div class="mini-indicators">${related||'<span class="muted">暂无</span>'}</div><h5>依据来源</h5>${sources||'<div class="source">南京城市体检样例指标库</div>'}<h5>推荐追问</h5><div class="followups">${follow}</div></div></div>`);
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
}
function escapeHtml(s){ return String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
async function askQuestion(q){
  const text = q || $('#questionInput').value.trim(); if (!text) return;
  $('#questionInput').value=''; addUser(text); addBot('正在检索指标数据和规划知识库，生成 S-E-D 诊断回答...');
  const r = await api.post('/qa/ask', { question: text });
  $$('#chatMessages .msg.bot').at(-1).remove();
  addBotRich(r);
}
window.askQuestion = askQuestion;

function toast(text){ const div=document.createElement('div'); div.className='toast'; div.textContent=text; document.body.appendChild(div); setTimeout(()=>div.remove(),2600); }

async function uploadKnowledge(){
  const title=$('#knowledgeTitle').value.trim(); const tags=$('#knowledgeTags').value.trim(); const content=$('#knowledgeContent').value.trim();
  if(!content) return toast('请先填写知识内容');
  await api.post('/knowledge/upload',{title,tags,type:'custom',content});
  $('#knowledgeTitle').value=''; $('#knowledgeTags').value=''; $('#knowledgeContent').value='';
  toast('知识片段已上传');
  await loadKnowledge();
}

async function loadSpatial(){
  const data = await api.get('/spatial/overview');
  const map = $('#districtMap');
  map.innerHTML = data.districts.map(d => {
    const cls = d.totalScore >= 82 ? 'good' : d.totalScore >= 76 ? 'mid' : 'risk';
    return `<div class="district-node ${cls}" style="left:${d.x}%;top:${d.y}%" onclick="selectDistrict('${d.id}')"><b>${d.name}</b><span>${d.totalScore}</span></div>`;
  }).join('');
  $('#districtRank').innerHTML = data.riskDistricts.map(d => `<div class="risk-item" onclick="selectDistrict('${d.id}')"><div class="item-head"><b>${d.name}</b><span class="tag ${d.level==='良好'||d.level==='优秀'?'normal':'attention'}">${d.level}</span></div><div class="muted">综合得分 ${d.totalScore}｜重点：${d.focus.join('、')}</div></div>`).join('');
  const chart = echarts.init($('#districtDimChart'));
  chart.setOption({ tooltip:{}, grid:{left:45,right:20,bottom:30,top:20}, xAxis:{type:'category',data:data.dimensionAvg.map(x=>x.category),axisLabel:{color:'#8fb2d2'}}, yAxis:{type:'value',max:100,axisLabel:{color:'#8fb2d2'},splitLine:{lineStyle:{color:'rgba(255,255,255,.08)'}}}, series:[{type:'bar',data:data.dimensionAvg.map(x=>x.score),itemStyle:{color:'#28d6ff'},barWidth:24}] });
}
window.selectDistrict = async (id) => {
  const d = await api.get('/spatial/district/' + id);
  $('#districtTitle').textContent = `${d.district.name} S-E-D 空间诊断`;
  $('#districtDiagnosis').innerHTML = `<b>S 表征：</b>${d.sed.symptom}\n\n<b>E 解释：</b>${d.sed.explanation}\n\n<b>D 决策：</b>${d.sed.decision}\n\n<b>重点风险：</b>${d.district.risks.join('；')}\n<b>治理重点：</b>${d.district.focus.join('、')}`;
};

async function loadGraph(){
  const g = await api.get('/graph/diagnosis');
  const chart = echarts.init($('#diagnosisGraph'));
  const color = {city:'#28d6ff',category:'#5aa7ff',indicator:'#ffd166',problem:'#ff5c7a',cause:'#a78bfa',strategy:'#44e28d',knowledge:'#9ee9ff'};
  chart.setOption({ tooltip:{formatter:p=>p.data.name||p.data.relation}, legend:{textStyle:{color:'#cde7ff'}}, series:[{ type:'graph', layout:'force', roam:true, draggable:true, force:{repulsion:180,edgeLength:90}, label:{show:true,color:'#e8f4ff',fontSize:11}, edgeLabel:{show:true,formatter:p=>p.data.relation,color:'#8fb2d2',fontSize:10}, data:g.nodes.map(n=>({ ...n, symbolSize:n.type==='city'?76:n.type==='category'?56:n.type==='indicator'?46:38, itemStyle:{color:color[n.type]||'#ccc'}, category:n.type })), links:g.links.map(l=>({ ...l, label:{show:true,formatter:l.relation}, lineStyle:{color:'rgba(160,210,255,.35)',curveness:.12} })), categories:Object.keys(color).map(k=>({name:k})) }] });
}

async function loadKnowledge(){
  const list = await api.get('/knowledge');
  $('#knowledgeList').innerHTML = list.map(k=>`<div class="knowledge-item"><button class="delete-k" onclick="deleteKnowledge('${k.id}')">删除</button><div class="item-head"><b>${k.title}</b><span class="tag normal">${k.type}</span></div><div class="muted">${(k.tags||[]).join(' / ')}</div><p>${k.content}</p></div>`).join('');
}
window.deleteKnowledge = async (id) => { toast('静态展示版本不支持删除。'); };

async function generateReport(){
  const category = $('#reportCategory').value;
  const report = await api.post('/reports/generate', category ? { category, type:'category' } : { type:'annual' });
  state.currentReport = report;
  $('#reportContent').textContent = report.content;
  const summary = await api.get('/reports/' + report.id + '/summary');
  $('#reportSummary').innerHTML = `<b>领导摘要：</b>\n${summary.summary}\n\n<b>问题清单：</b>\n${summary.problemList.map((x,i)=>`${i+1}. ${x}`).join('\n') || '暂无'}\n\n<b>整改建议台账：</b>\n${summary.actionList.map((x,i)=>`${i+1}. ${x}`).join('\n') || '暂无'}`;
}
function downloadReport(){
  if(!state.currentReport){ toast('请先生成报告'); return; }
  window.open(`/api/reports/${state.currentReport.id}/export`, '_blank');
}
async function copyReport(){
  if(!state.currentReport){ toast('请先生成报告'); return; }
  await navigator.clipboard.writeText(state.currentReport.content);
  toast('报告 Markdown 已复制');
}

function initEvents(){
  $('#diagnosisType').addEventListener('change', initDiagnosisTargets);
  $('#runDiagnosis').addEventListener('click', runDiagnosis);
  $('#askBtn').addEventListener('click', () => askQuestion());
  $('#questionInput').addEventListener('keydown', e => { if (e.key === 'Enter') askQuestion(); });
  $('#generateReport').addEventListener('click', generateReport);
  $('#downloadReport').addEventListener('click', downloadReport);
  $('#copyReport').addEventListener('click', copyReport);
  $('#uploadKnowledge').addEventListener('click', uploadKnowledge);
}

async function bootstrap(){
  initNav(); initFilters(); initEvents();
  await loadDashboard();
  await loadIndicators();
  await initDiagnosisTargets();
  await runDiagnosis();
}
bootstrap().catch(err => { console.error(err); alert('系统初始化失败：' + err.message); });
