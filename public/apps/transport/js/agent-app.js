const API = '/api/agent';
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
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API Error');
  return json.data;
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
