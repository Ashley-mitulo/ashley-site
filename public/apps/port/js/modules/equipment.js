// 设备管理模块

function renderEquipment(container) {
    container.innerHTML = `
        <div class="page-title">🏭 设备管理系统</div>
        
        <div class="tab-container">
            <div class="tab-item active" data-tab="map" onclick="switchEquipmentTab('map')">设备实时地图</div>
            <div class="tab-item" data-tab="monitor" onclick="switchEquipmentTab('monitor')">设备状态监控</div>
            <div class="tab-item" data-tab="utilization" onclick="switchEquipmentTab('utilization')">利用率统计</div>
            <div class="tab-item" data-tab="alarm" onclick="switchEquipmentTab('alarm')">故障告警</div>
        </div>

        <div id="equipment-tab-content"></div>
    `;

    switchEquipmentTab('map');
}

function switchEquipmentTab(tab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });

    const content = document.getElementById('equipment-tab-content');
    switch (tab) {
        case 'map':
            renderEquipmentMap(content);
            break;
        case 'monitor':
            renderEquipmentMonitor(content);
            break;
        case 'utilization':
            renderEquipmentUtilization(content);
            break;
        case 'alarm':
            renderEquipmentAlarm(content);
            break;
    }
}

function renderEquipmentMap(container) {
    container.innerHTML = `
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">🗺️ 设备实时位置地图</span>
                <div style="display: flex; gap: 20px; font-size: 11px;">
                    <span style="color: #00ff88;">● 桥吊</span>
                    <span style="color: #00d4ff;">● 轮胎吊</span>
                    <span style="color: #ffc107;">● AGV</span>
                </div>
            </div>
            <div class="equipment-map" id="equipment-map-container" style="height: 450px; position: relative;">
                <svg width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
                    <!-- 背景 -->
                    <rect x="0" y="0" width="800" height="450" fill="rgba(10, 40, 80, 0.3)" />
                    
                    <!-- 水域 -->
                    <rect x="0" y="0" width="800" height="100" fill="rgba(0, 100, 150, 0.3)" />
                    <text x="400" y="55" text-anchor="middle" fill="#3a7a9a" font-size="14">航道水域</text>
                    
                    <!-- 泊位线 -->
                    <line x1="50" y1="100" x2="750" y2="100" stroke="#00d4ff" stroke-width="3" opacity="0.5" />
                    
                    <!-- 堆场区域 -->
                    <rect x="50" y="130" width="700" height="120" fill="rgba(0, 212, 255, 0.05)" stroke="rgba(0, 212, 255, 0.2)" />
                    <text x="400" y="190" text-anchor="middle" fill="#5a7a9a" font-size="12">集装箱堆场</text>
                    
                    <!-- 道路 -->
                    <rect x="50" y="270" width="700" height="30" fill="rgba(100, 100, 100, 0.2)" />
                    <text x="400" y="290" text-anchor="middle" fill="#5a7a9a" font-size="10">集卡通道</text>
                    
                    <!-- 堆场网格线 -->
                    ${Array.from({length: 7}, (_, i) => `<line x1="${100 + i * 100}" y1="130" x2="${100 + i * 100}" y2="250" stroke="rgba(0, 212, 255, 0.1)" stroke-width="1" />`).join('')}
                    
                    <!-- 区域标注 -->
                    <text x="100" y="145" fill="#5a7a9a" font-size="10">A区</text>
                    <text x="200" y="145" fill="#5a7a9a" font-size="10">B区</text>
                    <text x="300" y="145" fill="#5a7a9a" font-size="10">C区</text>
                    <text x="400" y="145" fill="#5a7a9a" font-size="10">D区</text>
                    <text x="500" y="145" fill="#5a7a9a" font-size="10">E区</text>
                    <text x="600" y="145" fill="#5a7a9a" font-size="10">F区</text>
                </svg>
                
                <!-- 桥吊 -->
                <div class="equipment-icon crane" style="left: 12%; top: 18%;" title="桥吊1号 - 作业中">🏗️</div>
                <div class="equipment-icon crane" style="left: 22%; top: 18%;" title="桥吊2号 - 作业中">🏗️</div>
                <div class="equipment-icon crane" style="left: 32%; top: 18%;" title="桥吊3号 - 作业中">🏗️</div>
                <div class="equipment-icon crane" style="left: 52%; top: 18%;" title="桥吊4号 - 空闲">🏗️</div>
                <div class="equipment-icon crane" style="left: 72%; top: 18%;" title="桥吊5号 - 作业中">🏗️</div>
                <div class="equipment-icon crane" style="left: 88%; top: 18%; background: rgba(255, 71, 87, 0.3); border-color: #ff4757;" title="桥吊6号 - 故障">⚠️</div>
                
                <!-- 轮胎吊 -->
                <div class="equipment-icon rtg" style="left: 15%; top: 38%;" title="轮胎吊1号 - 作业中">🔧</div>
                <div class="equipment-icon rtg" style="left: 28%; top: 42%;" title="轮胎吊2号 - 作业中">🔧</div>
                <div class="equipment-icon rtg" style="left: 45%; top: 35%;" title="轮胎吊3号 - 空闲">🔧</div>
                <div class="equipment-icon rtg" style="left: 62%; top: 45%;" title="轮胎吊4号 - 作业中">🔧</div>
                
                <!-- AGV -->
                <div class="equipment-icon agv" style="left: 20%; top: 65%;" title="AGV01 - 运输中">🚛</div>
                <div class="equipment-icon agv" style="left: 35%; top: 68%;" title="AGV02 - 运输中">🚛</div>
                <div class="equipment-icon agv" style="left: 55%; top: 62%;" title="AGV03 - 充电中">🔋</div>
                <div class="equipment-icon agv" style="left: 70%; top: 70%;" title="AGV04 - 运输中">🚛</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
            <div class="port-card">
                <div style="text-align: center;">
                    <div style="font-size: 32px; color: #00ff88; margin-bottom: 5px;">🏗️</div>
                    <div style="font-size: 24px; font-weight: 700; color: #00ff88;">5 / 6</div>
                    <div style="font-size: 12px; color: #7a9aba;">桥吊在线</div>
                </div>
            </div>
            <div class="port-card">
                <div style="text-align: center;">
                    <div style="font-size: 32px; color: #00d4ff; margin-bottom: 5px;">🔧</div>
                    <div style="font-size: 24px; font-weight: 700; color: #00d4ff;">4 / 4</div>
                    <div style="font-size: 12px; color: #7a9aba;">轮胎吊在线</div>
                </div>
            </div>
            <div class="port-card">
                <div style="text-align: center;">
                    <div style="font-size: 32px; color: #ffc107; margin-bottom: 5px;">🚛</div>
                    <div style="font-size: 24px; font-weight: 700; color: #ffc107;">15 / 16</div>
                    <div style="font-size: 12px; color: #7a9aba;">AGV在线</div>
                </div>
            </div>
        </div>
    `;
}

function renderEquipmentMonitor(container) {
    const equipment = [
        { id: 'QC01', name: '桥吊1号', type: '桥吊', status: 'working', location: 'B01', currentOp: '中远海运宁波', todayMoves: 128, efficiency: 32 },
        { id: 'QC02', name: '桥吊2号', type: '桥吊', status: 'working', location: 'B02', currentOp: '马士基汉堡', todayMoves: 115, efficiency: 28 },
        { id: 'QC03', name: '桥吊3号', type: '桥吊', status: 'working', location: 'B04', currentOp: '中海之春', todayMoves: 142, efficiency: 35 },
        { id: 'QC04', name: '桥吊4号', type: '桥吊', status: 'idle', location: 'B03', currentOp: '-', todayMoves: 89, efficiency: 0 },
        { id: 'QC05', name: '桥吊5号', type: '桥吊', status: 'working', location: 'B06', currentOp: '达飞塔霍', todayMoves: 121, efficiency: 30 },
        { id: 'QC06', name: '桥吊6号', type: '桥吊', status: 'maintenance', location: '维修区', currentOp: '液压系统故障', todayMoves: 0, efficiency: 0 },
        { id: 'RT01', name: '轮胎吊1号', type: '轮胎吊', status: 'working', location: 'A区', currentOp: '卸船作业', todayMoves: 98, efficiency: 24 },
        { id: 'RT02', name: '轮胎吊2号', type: '轮胎吊', status: 'working', location: 'B区', currentOp: '集卡装箱', todayMoves: 87, efficiency: 22 },
        { id: 'AG01', name: 'AGV01', type: 'AGV', status: 'working', location: 'B01→A区', currentOp: '运输中', battery: 85, deliveries: 156 }
    ];

    container.innerHTML = `
        <div class="filter-bar">
            <div class="filter-group">
                <label>设备类型</label>
                <select>
                    <option>全部</option>
                    <option>桥吊</option>
                    <option>轮胎吊</option>
                    <option>AGV</option>
                </select>
            </div>
            <div class="filter-group">
                <label>状态筛选</label>
                <select>
                    <option>全部</option>
                    <option>作业中</option>
                    <option>空闲</option>
                    <option>故障</option>
                </select>
            </div>
        </div>
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📋 设备状态监控列表</span>
                <span class="status-badge info" style="font-size: 11px;">共 ${equipment.length} 台</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>设备编号</th>
                        <th>类型</th>
                        <th>状态</th>
                        <th>位置</th>
                        <th>当前作业</th>
                        <th>今日作业量</th>
                        <th>效率</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${equipment.map(eq => {
                        const statusMap = { working: { class: 'working', text: '作业中' }, idle: { class: 'idle', text: '空闲' }, maintenance: { class: 'stopped', text: '故障' } };
                        return `
                            <tr>
                                <td style="color: #00ff88; font-weight: 600;">${eq.name}</td>
                                <td>${eq.type}</td>
                                <td><span class="status-badge ${statusMap[eq.status].class}">${statusMap[eq.status].text}</span></td>
                                <td>${eq.location}</td>
                                <td style="color: #a0c4e8;">${eq.currentOp}</td>
                                <td>${eq.todayMoves} 次</td>
                                <td>${eq.efficiency > 0 ? eq.efficiency + ' 次/小时' : '-'}</td>
                                <td><button class="port-btn port-btn-secondary port-btn-sm" onclick="showEquipmentDetail('${eq.id}')">详情</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderEquipmentUtilization(container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 各类设备利用率</span>
                </div>
                <div id="equipment-utilization-chart" class="chart-container" style="height: 300px;"></div>
            </div>
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">🏆 设备作业量排名</span>
                </div>
                <div id="equipment-rank-chart" class="chart-container" style="height: 300px;"></div>
            </div>
        </div>
        <div class="kpi-dashboard">
            <div class="kpi-card">
                <div class="kpi-value">78%</div>
                <div class="kpi-label">桥吊平均利用率</div>
                <div class="kpi-target">目标: 85%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">72%</div>
                <div class="kpi-label">轮胎吊平均利用率</div>
                <div class="kpi-target">目标: 80%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">68%</div>
                <div class="kpi-label">AGV平均利用率</div>
                <div class="kpi-target">目标: 75%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">99.2%</div>
                <div class="kpi-label">设备完好率</div>
                <div class="kpi-target">目标: 99%</div>
            </div>
        </div>
    `;
}
