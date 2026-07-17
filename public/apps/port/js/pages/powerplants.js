async function render_powerplants(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🔋</span>
            <span>码头管理</span>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">码头列表</div>
                <button class="btn btn-primary" onclick="alert('添加功能开发中...')">
                    <span>+</span> 添加码头
                </button>
            </div>
            <div id="powerplants-table">
                加载中...
            </div>
        </div>
    `;
    
    await loadPowerPlants();
}

async function loadPowerPlants() {
    const result = await API.grid.powerPlants();
    if (result.success) {
        renderPowerPlantsTable(result.data);
    }
}

function renderPowerPlantsTable(data) {
    const tableContainer = document.getElementById('powerplants-table');
    
    if (data.length === 0) {
        tableContainer.innerHTML = '<p style="text-align: center; color: #7a8ca6; padding: 30px;">暂无数据</p>';
        return;
    }
    
    tableContainer.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>名称</th>
                    <th>编号</th>
                    <th>类型</th>
                    <th>总容量 (MW)</th>
                    <th>当前出力 (MW)</th>
                    <th>位置</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.code}</td>
                        <td>${p.type}</td>
                        <td>${p.capacity}</td>
                        <td><strong style="color: #00ff88;">${p.current_output}</strong></td>
                        <td>${p.city}</td>
                        <td><span class="status-tag ${p.status}">${p.status === 'normal' ? '正常' : p.status}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm">查看</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 15px; color: #7a8ca6; font-size: 13px;">共 ${data.length} 条记录</p>
    `;
}
