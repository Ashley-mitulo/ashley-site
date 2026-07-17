// Ashley 个人站 - 通用前端脚本

// === 主题切换（浅/深色）===
(function initTheme() {
  const saved = localStorage.getItem('ashley-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ashley-theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

function mountThemeToggle() {
  const host = document.getElementById('navUser');
  if (!host || document.getElementById('themeToggle')) return;
  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.className = 'theme-toggle';
  btn.title = '切换深浅色';
  btn.setAttribute('aria-label', '切换主题');
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  btn.textContent = cur === 'dark' ? '☀️' : '🌙';
  btn.onclick = toggleTheme;
  host.insertBefore(btn, host.firstChild);
}

const api = {
  async get(path) {
    const r = await fetch(path, { credentials: 'same-origin' });
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return r.json();
  },
};

async function currentUser() {
  try {
    const r = await api.get('/api/me');
    return r.ok ? r.user : null;
  } catch (e) { return null; }
}

async function renderNavUser() {
  const el = document.getElementById('navUser');
  if (!el) return;
  const user = await currentUser();
  if (user) {
    el.innerHTML = `<span>👤 ${user.display_name || user.username}</span>
      <button class="btn-outline" onclick="doLogout()">退出</button>`;
  } else {
    el.innerHTML = `<a href="/login.html" class="btn-login">登录</a>
      <a href="/register.html" class="btn-outline">注册</a>`;
  }
  mountThemeToggle();
  return user;
}

async function doLogout() {
  await api.post('/api/logout');
  location.href = '/';
}

function showMsg(id, text, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'msg ' + type;
  el.textContent = text;
  el.style.display = 'block';
}

function hideMsg(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function fmtTime(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
