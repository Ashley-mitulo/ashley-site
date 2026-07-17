// ⚠️ Cloudflare Pages 静态部署：所有 GET API 已冻结为 ./api-static/*.json；写操作降级为演示提示。
// 后端源：/mnt/d/openclaw/workspace/transport-agent-system (v1.3-prda-intelligent-qa, 端口 3009)
const API = '/api/agent';
const STATIC_API_BASE = './api-static';
const STATIC_API_MAP = {
  '/geo/shandong':'geo/shandong.json','/graph/overview':'graph/overview.json','/diagnosis/topics':'diagnosis/topics.json',
  '/dashboard/summary':'dashboard/summary.json','/dashboard/indicators':'dashboard/indicators.json','/dashboard/risk-alerts':'dashboard/risk-alerts.json',
  '/road/network':'road/network.json','/road/congestion':'road/congestion.json','/road/events':'road/events.json',
  '/vehicle/list':'vehicle/list.json','/vehicle/anomalies':'vehicle/anomalies.json',
  '/logistics/channels':'logistics/channels.json','/logistics/od':'logistics/od.json','/logistics/hotspots':'logistics/hotspots.json','/logistics/restrictions':'logistics/restrictions.json',
  '/enforcement/clues':'enforcement/clues.json','/enforcement/overload':'enforcement/overload.json','/enforcement/cases':'enforcement/cases.json',
  '/credit/companies':'credit/companies.json','/credit/high-risk':'credit/high-risk.json',
  '/emergency/incidents':'emergency/incidents.json','/emergency/resources':'emergency/resources.json',
  '/knowledge':'knowledge/list.json','/knowledge/categories':'knowledge/categories.json',
  '/data-ingest/stats':'data-ingest/stats.json','/data-ingest/batches?limit=10':'data-ingest/batches.json',
  '/data-ingest/entities?keyword=&type=&limit=20':'data-ingest/entities-all.json','/report/daily':'report/daily.json'
};
function resolveStaticPath(pathWithQuery){
  if(STATIC_API_MAP[pathWithQuery]) return STATIC_API_MAP[pathWithQuery];
  const [pure,query='']=pathWithQuery.split('?');
  if(STATIC_API_MAP[pure]) return STATIC_API_MAP[pure];
  if(pure==='/knowledge') return {synth:'knowledgeSearch',query};
  if(pure==='/data-ingest/entities') return {synth:'entitiesFilter',query};
  let m;
  if((m=pure.match(/^\/vehicle\/([A-Za-z0-9_-]+)$/)))              return `vehicle/detail/${m[1]}.json`;
  if((m=pure.match(/^\/vehicle\/([A-Za-z0-9_-]+)\/trajectory$/)))   return `vehicle/trajectory/${m[1]}.json`;
  if((m=pure.match(/^\/credit\/company\/([A-Za-z0-9_-]+)$/)))      return `credit/company/${m[1]}.json`;
  if((m=pure.match(/^\/graph\/company\/([A-Za-z0-9_-]+)$/)))       return `graph/company/${m[1]}.json`;
  if((m=pure.match(/^\/enforcement\/clue\/([A-Za-z0-9_-]+)$/)))    return `enforcement/clue/${m[1]}.json`;
  if((m=pure.match(/^\/road\/segment\/([A-Za-z0-9_-]+)$/)))        return `road/segment/${m[1]}.json`;
  if((m=pure.match(/^\/emergency\/incident\/([A-Za-z0-9_-]+)$/)))  return `emergency/incident/${m[1]}.json`;
  return null;
}
const PAGES = [
  { id: 'dashboard', icon: '🏠', title: '交通运行驾驶舱', render: renderDashboard },
  { id: 'road', icon: '🛣️', title: '路网监测', render: renderRoad },
  { id: 'vehicle', icon: '🚛', title: '车辆监管', render: renderVehicle },
  { id: 'logistics', icon: '📦', title: '物流一张图', render: renderLogistics },
  { id: 'enforcement', icon: '⚖️', title: '执法监管', render: renderEnforcement },
  { id: 'credit', icon: '🏢', title: '信用画像', render: renderCredit },
  { id: 'emergency', icon: '🚨', title: '应急指挥', render: renderEmergency },
  { id: 'qa', icon: '💬', title: '智能问答', render: renderQA },
  { id: 'data-ingest', icon: '📥', title: '数据接入', render: renderDataIngest },
  { id: 'knowledge', icon: '📚', title: '知识库', render: renderKnowledge },
  { id: 'report', icon: '📝', title: '报告中心', render: renderReport }
];

async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    if (path === '/qa/ask') {
      let q=''; try{ q=JSON.parse(options.body||'{}').question||''; }catch(e){}
      return {
        version:'demo-static', intent:'static-demo',
        explain:{primaryIntent:'静态展示', engine:'demo-static'},
        answer: `⚠️ 当前为 <b>Cloudflare Pages 静态展示部署</b>，智能问答需要后端 P-R-D-A 推理引擎（本地 3009 端口）支撑，浏览器里无法直接跑。<br><br>你的问题：<span class="kbd">${q||'（空）'}</span><br><br>如需完整能力：<br>1) 打开独立版 <code>transport-agent-system v1.3-prda-intelligent-qa</code><br>2) <code>npm start</code> 后访问 <code>http://localhost:3009</code><br>3) 支持全库真实推理 + 证据链回溯 + P-R-D-A 四段展示`,
        prda:{perception:'静态 JSON（不带 QA 引擎）',reasoning:'未接入 prdaQaEngine',decision:'展示提示',action:'引导本地部署'},
        suggestedQuestions:['查看车辆监管仪表盘','打开执法监管线索','看看信用画像 TOP','查看应急指挥资源']
      };
    }
    throw new Error(`静态展示环境不支持写操作（${path}）。请本地部署独立版（端口 3009）体验完整功能。`);
  }
  const target = resolveStaticPath(path);
  if (target && target.synth === 'knowledgeSearch') {
    const r = await fetch(`${STATIC_API_BASE}/knowledge/list.json`); const j = await r.json();
    const all = j.data || []; const q = new URLSearchParams(target.query).get('q') || '';
    if (!q) return all;
    const kw = q.trim().toLowerCase();
    return all.filter(k => (k.title||'').toLowerCase().includes(kw) || (k.content||'').toLowerCase().includes(kw) || (k.category||'').toLowerCase().includes(kw));
  }
  if (target && target.synth === 'entitiesFilter') {
    const r = await fetch(`${STATIC_API_BASE}/data-ingest/entities-all.json`); const j = await r.json();
    const p = new URLSearchParams(target.query);
    const kw = (p.get('keyword')||'').toLowerCase(); const ty = p.get('type')||'';
    let arr = (j.data && (j.data.entities || j.data)) || [];
    if (!Array.isArray(arr)) arr = [];
    if (kw) arr = arr.filter(e => JSON.stringify(e).toLowerCase().includes(kw));
    if (ty) arr = arr.filter(e => e.type === ty);
    const limit = parseInt(p.get('limit')||'20',10);
    return { entities: arr.slice(0, limit), total: arr.length };
  }
  if (!target) {
    console.warn('[static-api] unmapped GET', path);
    throw new Error(`静态部署未打包该接口：${path}`);
  }
  const r = await fetch(`${STATIC_API_BASE}/${target}`);
  if (!r.ok) throw new Error(`静态资源加载失败 ${target} (${r.status})`);
  const j = await r.json();
  if (j && j.success === false) throw new Error(j.message || 'API Error');
  return j && Object.prototype.hasOwnProperty.call(j, 'data') ? j.data : j;
}

function el(id) { return document.getElementById(id); }
function fmt(n) { return Number(n).toLocaleString('zh-CN'); }
function levelClass(level) { return level === '高' || String(level).includes('严重') ? 'high' : level === '中' || String(level).includes('中') ? 'mid' : 'low'; }
function tag(text, level) { return `<span class="tag ${levelClass(level || text)}">${text}</span>`; }
function metric(label, value, desc, color = 'cyan') { return `<div class="card metric"><div class="label">${label}</div><div class="value ${color}">${value}</div><div class="desc">${desc || ''}</div></div>`; }
function table(headers, rows) { return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`; }
function prda(p) { if (!p) return ''; return `<div class="prda"><div><b class="cyan">P 感知</b><br>${p.perception}</div><div><b class="yellow">R 研判</b><br>${p.reasoning}</div><div><b class="green">D 决策</b><br>${p.decision}</div><div><b class="red">A 行动</b><br>${p.action}</div></div>`; }

function chart(id, option) {
  const dom = document.getElementById(id);
  if (!dom) return;
  const c = echarts.init(dom);
  c.setOption(option);
  window.addEventListener('resize', () => c.resize());
}

function baseChart() {
  return { textStyle: { color: '#d7ecff' }, grid: { left: 36, right: 18, top: 36, bottom: 28 }, tooltip: { trigger: 'axis', backgroundColor: '#0d2137', borderColor: '#1a3a5c', textStyle: { color: '#fff' } } };
}

function getInitialPage() {
  // 优先级：#hash > URL ?page= 参数 > 默认 dashboard。
  // 这样既能支持外层 iframe 初始定位，也不会让内层菜单点击后被 ?page 固定住。
  const hashPage = (location.hash || '').replace('#', '').trim();
  if (PAGES.some(p => p.id === hashPage)) return hashPage;
  const params = new URLSearchParams(location.search);
  const pageParam = params.get('page');
  return PAGES.some(p => p.id === pageParam) ? pageParam : 'dashboard';
}

function renderNav() {
  const activePage = getInitialPage();
  el('nav').innerHTML = PAGES.map((p) => `<button class="nav-item ${p.id===activePage?'active':''}" data-page="${p.id}">${p.icon} ${p.title}</button>`).join('');
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
    location.hash = btn.dataset.page;
    loadPage(btn.dataset.page);
  }));
}

async function loadPage(id) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  const page = PAGES.find(p => p.id === id) || PAGES[0];
  el('pageTitle').textContent = page.title;
  el('content').innerHTML = '<div class="card">数据加载中...</div>';
  try { await page.render(el('content')); } catch (e) { el('content').innerHTML = `<div class="card red">加载失败：${e.message}</div>`; }
}

function startClock() {
  const tick = () => { el('clock').textContent = new Date().toLocaleString('zh-CN', { hour12:false }); };
  tick(); setInterval(tick, 1000);
}

// 监听外层 postMessage 切页（避免 iframe 整体刷新）
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'agent-navigate' && e.data.page) {
    const page = e.data.page;
    if (PAGES.some(p => p.id === page)) {
      location.hash = page;
      loadPage(page);
    }
  }
});

if (new URLSearchParams(location.search).get('embed') === '1') {
  document.body.classList.add('embedded');
}
renderNav();
startClock();
loadPage(getInitialPage());
window.addEventListener('hashchange', () => loadPage(getInitialPage()));
