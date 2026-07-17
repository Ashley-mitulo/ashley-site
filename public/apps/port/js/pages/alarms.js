async function render_alarms(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>⚠️</span>
            <span>告警中心</span>
        </div>
        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
            <div class="stat-card">
                <div class="value" id="alarm-total">--</div>
                <div class="label">告警总数</div>
            </div>
            <div class="stat-card">
                <div class="value" id="alarm-active" style="color: #00ff88;">--</div>
                <div class="label">活跃告警</div>
            </div>
            <div class="stat-card">
                <div class="value" id="alarm-critical" style="color: #ff4444;">--</div>
                <div class="label">严重告警</div>
            </div>
            <div class="stat-card">
                <div class="value" id="alarm-warning" style="color: #ffc107;">--</div>
                <div class="label">警告告警</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">告警列表</div>
                <button class="btn btn-success btn-sm" onclick="simulateAlarms()">
                    <span>🔄</span> 生成模拟告警
                </button>
            </div>
            <div class="filter-bar">
                <div class="filter-group">
                    <label>级别:</label>
                    <select id="alarm-level-filter" onchange="filterAlarms()">
                        <option value="">全部</option>
                        <option value="critical">严重</option>
                        <option value="warning">警告</option>
                        <option value="info">信息</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>状态:</label>
                    <select id="alarm-status-filter" onchange="filterAlarms()">
                        <option value="">全部</option>
                        <option value="active">活跃</option>
                        <option value="acknowledged">已确认</option>
                        <option value="resolved">已解决</option>
                    </select>
                </div>
            </div>
            <div id="alarms-list">
                加载中...
            </div>
        </div>
    `;
    
    await loadAlarmStatistics();
    await loadAlarms();
}

let allAlarms = [];

async function loadAlarmStatistics() {
    const result = await API.alarms.statistics();
    if (result.success) {
        const data = result.data;
        const elTotal = document.getElementById('alarm-total');
        const elActive = document.getElementById('alarm-active');
        const elCritical = document.getElementById('alarm-critical');
        const elWarning = document.getElementById('alarm-warning');
        if (elTotal) elTotal.textContent = data.total;
        if (elActive) elActive.textContent = data.active;
        if (elCritical) elCritical.textContent = data.critical;
        if (elWarning) elWarning.textContent = data.warning;
    }
}

async function loadAlarms() {
    const result = await API.alarms.list({ limit: 50 });
    if (result.success) {
        allAlarms = result.data;
        filterAlarms();
    }
}

function filterAlarms() {
    const level = document.getElementById('alarm-level-filter').value;
    const status = document.getElementById('alarm-status-filter').value;
    
    let filtered = allAlarms;
    
    if (level) {
        filtered = filtered.filter(a => a.level === level);
    }
    if (status) {
        filtered = filtered.filter(a => a.status === status);
    }
    
    renderAlarmsList(filtered);
}

function renderAlarmsList(data) {
    const container = document.getElementById('alarms-list');
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7a8ca6; padding: 30px;">暂无告警</p>';
        return;
    }
    
    container.innerHTML = data.map(a => `
        <div class="alarm-item ${a.level}">
            <div style="font-size: 24px;">
                ${a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟡' : '🔵'}
            </div>
            <div class="alarm-content">
                <div class="alarm-title">${a.title}</div>
                <div style="font-size: 13px; color: #7a8ca6;">${a.description || '无描述'}</div>
                <div class="alarm-time">
                    ${a.device_type} #${a.device_id} | ${new Date(a.timestamp).toLocaleString('zh-CN')}
                </div>
            </div>
            <div>
                <span class="status-tag ${a.status === 'active' ? 'warning' : 'normal'}" style="margin-right: 10px;">
                    ${a.status === 'active' ? '活跃' : a.status}
                </span>
            </div>
            <div>
                ${a.status === 'active' ? `
                    <button class="btn btn-primary btn-sm" onclick="acknowledgeAlarm(${a.id})">确认</button>
                    <button class="btn btn-success btn-sm" onclick="resolveAlarm(${a.id})">解决</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function simulateAlarms() {
    await API.alarms.simulate(3);
    loadAlarmStatistics();
    loadAlarms();
}

async function acknowledgeAlarm(id) {
    await API.alarms.update(id, 'acknowledged');
    loadAlarmStatistics();
    loadAlarms();
}

async function resolveAlarm(id) {
    await API.alarms.update(id, 'resolved');
    loadAlarmStatistics();
    loadAlarms();
}
