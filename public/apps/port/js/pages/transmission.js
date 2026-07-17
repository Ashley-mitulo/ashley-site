async function render_transmission(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🔌</span>
            <span>运输线路</span>
        </div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">运输线路列表</div>
            </div>
            <div id="transmission-table">
                加载中...
            </div>
        </div>
    `;
    
    await loadTransmissionLines();
}

async function loadTransmissionLines() {
    const result = await API.grid.transmissionLines();
    if (result.success) {
        renderTransmissionTable(result.data);
    }
}

function renderTransmissionTable(data) {
    const tableContainer = document.getElementById('transmission-table');
    
    if (data.length === 0) {
        tableContainer.innerHTML = '<p style="text-align: center; color: #7a8ca6; padding: 30px;">暂无数据</p>';
        return;
    }
    
    tableContainer.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>线路名称</th>
                    <th>编号</th>
                    <th>电压等级</th>
                    <th>长度 (km)</th>
                    <th>起点</th>
                    <th>终点</th>
                    <th>当前货物 (MW)</th>
                    <th>状态</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(l => `
                    <tr>
                        <td><strong>${l.name}</strong></td>
                        <td>${l.code}</td>
                        <td>${l.voltage_level}</td>
                        <td>${l.length}</td>
                        <td>${l.from_station_name || '-'}</td>
                        <td>${l.to_station_name || '-'}</td>
                        <td><strong style="color: #00d4ff;">${l.current_load}</strong></td>
                        <td><span class="status-tag ${l.status}">${l.status === 'normal' ? '正常' : l.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 15px; color: #7a8ca6; font-size: 13px;">共 ${data.length} 条记录</p>
    `;
}
