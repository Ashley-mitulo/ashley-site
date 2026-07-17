// 泊位管理模块

function renderBerth(container) {
    container.innerHTML = `
        <div class="page-title">📍 泊位管理系统</div>
        
        <div class="tab-container">
            <div class="tab-item active" data-tab="gantt" onclick="switchBerthTab('gantt')">泊位实时状态</div>
            <div class="tab-item" data-tab="schedule" onclick="switchBerthTab('schedule')">泊位计划</div>
            <div class="tab-item" data-tab="stats" onclick="switchBerthTab('stats')">利用率统计</div>
            <div class="tab-item" data-tab="archive" onclick="switchBerthTab('archive')">泊位台账</div>
        </div>

        <div id="berth-tab-content"></div>
    `;

    switchBerthTab('gantt');
}

function switchBerthTab(tab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });

    const content = document.getElementById('berth-tab-content');
    switch (tab) {
        case 'gantt':
            renderBerthGantt(content);
            break;
        case 'schedule':
            renderBerthSchedule(content);
            break;
        case 'stats':
            renderBerthStats(content);
            break;
        case 'archive':
            renderBerthArchive(content);
            break;
    }
}

function renderBerthGantt(container) {
    const berths = [
        { id: 'B01', name: '1号泊位', type: '集装箱', ship: '中远海运宁波', startTime: 8, duration: 18, color: '#00ff88' },
        { id: 'B02', name: '2号泊位', type: '集装箱', ship: '马士基汉堡', startTime: 10, duration: 20, color: '#00ff88' },
        { id: 'B03', name: '3号泊位', type: '集装箱', ship: null, startTime: 0, duration: 0, color: '#666' },
        { id: 'B04', name: '4号泊位', type: '集装箱', ship: '中海之春', startTime: 6, duration: 16, color: '#00ff88' },
        { id: 'B05', name: '5号泊位', type: '散货', ship: '山东大成', startTime: 12, duration: 24, color: '#ffc107' },
        { id: 'B06', name: '6号泊位', type: '散货', ship: null, startTime: 0, duration: 0, color: '#666' },
        { id: 'B07', name: '7号泊位', type: '散货', ship: '中粮先锋', startTime: 4, duration: 20, color: '#ffc107' },
        { id: 'B08', name: '8号泊位', type: '油轮', ship: '海洋石油119', startTime: 2, duration: 36, color: '#ff4757' },
        { id: 'B09', name: '9号泊位', type: '油轮', ship: null, startTime: 0, duration: 0, color: '#666' },
        { id: 'B10', name: '10号泊位', type: '油轮', ship: null, startTime: 0, duration: 0, color: '#ff4757' },
        { id: 'B11', name: '11号泊位', type: '客轮', ship: '和谐之星', startTime: 8, duration: 10, color: '#00d4ff' },
        { id: 'B12', name: '12号泊位', type: '客轮', ship: null, startTime: 0, duration: 0, color: '#666' },
        { id: 'B13', name: '13号泊位', type: '专用', ship: '长桥号', startTime: 16, duration: 28, color: '#b388ff' },
        { id: 'B14', name: '14号泊位', type: '专用', ship: null, startTime: 0, duration: 0, color: '#ff4757' },
        { id: 'B15', name: '15号泊位', type: '专用', ship: null, startTime: 0, duration: 0, color: '#666' }
    ];

    container.innerHTML = `
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">⏰ 泊位占用甘特图（未来48小时）</span>
                <div style="display: flex; gap: 15px; font-size: 11px;">
                    <span style="color: #00ff88;">● 集装箱</span>
                    <span style="color: #ffc107;">● 散货</span>
                    <span style="color: #ff4757;">● 维护中</span>
                </div>
            </div>
            <div class="gantt-container" style="overflow-x: auto;">
                <div style="min-width: 1000px;">
                    <!-- 时间轴 -->
                    <div style="display: flex; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
                        <div style="width: 100px; padding: 10px; font-size: 11px; color: #7a9aba; border-right: 1px solid rgba(0, 212, 255, 0.1);">泊位</div>
                        <div style="flex: 1; display: flex; padding: 10px 0;">
                            ${Array.from({length: 49}, (_, i) => {
                                const hour = (new Date().getHours() + i) % 24;
                                return `<div style="flex: 1; text-align: center; font-size: 10px; color: ${i % 6 === 0 ? '#a0c4e8' : '#5a7a9a'};">${hour}:00</div>`;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- 泊位行 -->
                    ${berths.map(berth => `
                        <div style="display: flex; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
                            <div style="width: 120px; padding: 10px 8px; font-size: 11px; color: #a0c4e8; border-right: 1px solid rgba(0, 212, 255, 0.1); display: flex; flex-direction: column; justify-content: center;">
                                <span style="font-weight: 600;">${berth.name}</span>
                                <span style="font-size: 9px; color: ${berth.ship ? '#00ff88' : berth.color === '#ff4757' ? '#ff4757' : '#666'};">${berth.type} | ${berth.ship ? '占用' : berth.color === '#ff4757' ? '维护' : '空闲'}</span>
                            </div>
                            <div style="flex: 1; position: relative; height: 45px; background: rgba(0, 0, 0, 0.1);">
                                ${berth.ship ? `
                                    <div class="gantt-bar" style="left: ${(berth.startTime / 48) * 100}%; width: ${(berth.duration / 48) * 100}%; background: ${berth.color}; top: 8px; height: 28px;" title="${berth.ship}">
                                        <span style="font-size: 9px; color: #000; font-weight: 600;">${berth.ship.substring(0, 6)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// 全局变量存储算法状态
let algorithmState = {
    isRunning: false,
    currentIteration: 0,
    maxIterations: 500,
    selectedAlgorithm: 'ga',
    objective: 'waitTime',
    convergenceData: [],
    originalSchedules: [],
    optimizedSchedules: [],
    conflicts: []
};

function renderBerthSchedule(container) {
    algorithmState.optimizedSchedules = [];
    algorithmState.convergenceData = [];

    container.innerHTML = `
        <!-- 算法控制面板 -->
        <div class="port-card" style="margin-bottom: 15px; background: linear-gradient(135deg, rgba(0, 100, 150, 0.1) 0%, rgba(0, 50, 100, 0.2) 100%); border: 1px solid rgba(0, 212, 255, 0.3);">
            <div class="card-header" style="border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                <span class="card-title">🧠 智能泊位分配算法引擎</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span id="algorithm-status-badge" class="status-badge idle">就绪</span>
                </div>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: end;">
                <!-- 优化目标 -->
                <div>
                    <label style="display: block; color: #7a9aba; font-size: 12px; margin-bottom: 8px;">🎯 优化目标</label>
                    <select id="objective-select" class="port-select" style="width: 100%;">
                        <option value="waitTime">⏱️ 最小等待时间</option>
                        <option value="utilization">📈 最大化泊位利用率</option>
                        <option value="balance">⚖️ 均衡负载优先</option>
                    </select>
                </div>
                <!-- 算法选择 -->
                <div>
                    <label style="display: block; color: #7a9aba; font-size: 12px; margin-bottom: 8px;">🔬 算法选择</label>
                    <select id="algorithm-select" class="port-select" style="width: 100%;">
                        <option value="ga">🧬 遗传算法 (GA)</option>
                        <option value="sa">🔥 模拟退火 (SA)</option>
                        <option value="pso">🐦 粒子群优化 (PSO)</option>
                    </select>
                </div>
                <!-- 迭代次数 -->
                <div>
                    <label style="display: block; color: #7a9aba; font-size: 12px; margin-bottom: 8px;">
                        🔄 迭代次数: <span id="iteration-value">500</span>
                    </label>
                    <input type="range" id="iteration-slider" min="100" max="1000" value="500" style="width: 100%; accent-color: #00d4ff;" oninput="document.getElementById('iteration-value').textContent = this.value">
                </div>
                <!-- 操作按钮 -->
                <div style="display: flex; gap: 10px;">
                    <button id="optimize-btn" class="port-btn port-btn-primary" style="flex: 1; background: linear-gradient(135deg, #00d4ff 0%, #0066ff 100%);" onclick="runOptimizationAlgorithm()">
                        ⚡ 智能优化分配
                    </button>
                    <button class="port-btn port-btn-secondary" onclick="resetOptimization()">
                        🔄 重置
                    </button>
                </div>
            </div>
        </div>

        <!-- 算法运行状态面板 -->
        <div id="algorithm-running-panel" class="port-card" style="margin-bottom: 15px; display: none; background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(0, 212, 255, 0.1) 100%); border: 1px solid rgba(0, 255, 136, 0.3);">
            <div class="card-header" style="border-bottom: 1px solid rgba(0, 255, 136, 0.2);">
                <span class="card-title">⚙️ 算法运行状态</span>
                <span id="algorithm-running-text" style="color: #00ff88; font-size: 12px; animation: pulse 1.5s infinite;">正在计算泊位分配方案...</span>
            </div>
            <div style="padding: 20px;">
                <!-- 进度条 -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #7a9aba; font-size: 12px;">迭代进度</span>
                        <span id="progress-text" style="color: #00ff88; font-size: 12px; font-weight: 600;">0 / 500 (0%)</span>
                    </div>
                    <div style="height: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; overflow: hidden;">
                        <div id="progress-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #00ff88 0%, #00d4ff 50%, #b388ff 100%); border-radius: 4px; transition: width 0.1s ease;"></div>
                    </div>
                </div>
                <!-- 实时指标 -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #7a9aba; margin-bottom: 5px;">当前最优解</div>
                        <div id="current-best-value" style="font-size: 24px; font-weight: 700; color: #00ff88;">--</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(255, 193, 7, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #7a9aba; margin-bottom: 5px;">目标函数值</div>
                        <div id="objective-value" style="font-size: 24px; font-weight: 700; color: #ffc107;">--</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: rgba(179, 136, 255, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #7a9aba; margin-bottom: 5px;">冲突数量</div>
                        <div id="conflict-count" style="font-size: 24px; font-weight: 700; color: #b388ff;">--</div>
                    </div>
                </div>
                <!-- 收敛曲线图表 -->
                <div id="convergence-chart" style="height: 200px; width: 100%;"></div>
            </div>
        </div>

        <!-- 优化结果对比面板 -->
        <div id="optimization-result-panel" class="port-card" style="margin-bottom: 15px; display: none; background: linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 212, 255, 0.08) 100%); border: 1px solid rgba(0, 255, 136, 0.4);">
            <div class="card-header" style="border-bottom: 1px solid rgba(0, 255, 136, 0.2);">
                <span class="card-title">📊 优化结果对比</span>
                <span class="status-badge working">优化完成 ✓</span>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <!-- 总等待时间 -->
                <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <div style="font-size: 13px; color: #7a9aba; margin-bottom: 10px;">⏱️ 总等待时间</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span id="before-wait" style="font-size: 18px; color: #ff4757; text-decoration: line-through;">18.5h</span>
                        <span style="color: #7a9aba;">→</span>
                        <span id="after-wait" style="font-size: 22px; font-weight: 700; color: #00ff88;">12.3h</span>
                    </div>
                    <div id="wait-improvement" style="font-size: 14px; color: #00ff88; margin-top: 8px; font-weight: 600;">↓ 33.5%</div>
                </div>
                <!-- 泊位利用率 -->
                <div style="text-align: center; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <div style="font-size: 13px; color: #7a9aba; margin-bottom: 10px;">📈 泊位利用率</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span id="before-util" style="font-size: 18px; color: #ffc107;">68%</span>
                        <span style="color: #7a9aba;">→</span>
                        <span id="after-util" style="font-size: 22px; font-weight: 700; color: #00ff88;">78%</span>
                    </div>
                    <div id="util-improvement" style="font-size: 14px; color: #00ff88; margin-top: 8px; font-weight: 600;">↑ 10%</div>
                </div>
                <!-- 冲突数量 -->
                <div style="text-align: center; padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 10px; border: 1px solid rgba(255, 193, 7, 0.3);">
                    <div style="font-size: 13px; color: #7a9aba; margin-bottom: 10px;">⚠️ 冲突数量</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span id="before-conflict" style="font-size: 18px; color: #ff4757;">3</span>
                        <span style="color: #7a9aba;">→</span>
                        <span id="after-conflict" style="font-size: 22px; font-weight: 700; color: #00ff88;">0</span>
                    </div>
                    <div id="conflict-improvement" style="font-size: 14px; color: #00ff88; margin-top: 8px; font-weight: 600;">全部消除 ✓</div>
                </div>
            </div>
        </div>

        <!-- ✅ 排班表容器 - 位置固定！默认显示原方案，优化后显示对比 -->
        <div id="schedule-container-wrapper"></div>
    `;

    // 初始化收敛曲线图表
    setTimeout(() => {
        initConvergenceChart();
        // 修复曲线图宽度问题
        setTimeout(() => {
            const chartDom = document.getElementById('convergence-chart');
            if (chartDom && typeof echarts !== 'undefined') {
                const chart = echarts.getInstanceByDom(chartDom);
                if (chart) chart.resize();
            }
        }, 200);
    }, 100);
    
    // ✅ 默认显示真实的 FCFS 原方案排班表（和优化对比用完全一样的数据）
    // ✅ 用 sessionStorage 持久化，刷新页面数据不变
    setTimeout(() => {
        let originalSchedule;
        const saved = sessionStorage.getItem('berthScheduleData');
        if (saved) {
            try {
                originalSchedule = JSON.parse(saved);
            } catch (e) {
                const ships = generateShipArrivalData(80);
                originalSchedule = generateFCFSSchedule(ships);
                sessionStorage.setItem('berthScheduleData', JSON.stringify(originalSchedule));
            }
        } else {
            const ships = generateShipArrivalData(80);
            originalSchedule = generateFCFSSchedule(ships);
            sessionStorage.setItem('berthScheduleData', JSON.stringify(originalSchedule));
        }
        window.scheduleData = { original: originalSchedule, optimized: null };
        
        // 计算统计指标
        const stats = {
            totalWait: originalSchedule.reduce((s, t) => s + t.waitTime, 0),
            avgWait: Math.round(originalSchedule.reduce((s, t) => s + t.waitTime, 0) / originalSchedule.length),
            utilization: calculateUtilization(originalSchedule),
            delayedCount: originalSchedule.filter(t => t.waitTime > 12).length
        };
        
        // 按泊位分组
        const berthGroups = {};
        originalSchedule.forEach(ship => {
            if (!berthGroups[ship.berth]) berthGroups[ship.berth] = [];
            berthGroups[ship.berth].push(ship);
        });
        
        // 泊位颜色配置
        const berthColors = {
            'B01': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' },
            'B02': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' },
            'B03': { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ecc71' },
            'B04': { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ecc71' },
            'B05': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' },
            'B06': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' },
            'B07': { bg: 'rgba(241, 196, 15, 0.12)', border: '#f1c40f' },
            'B08': { bg: 'rgba(241, 196, 15, 0.12)', border: '#f1c40f' },
            'B09': { bg: 'rgba(230, 126, 34, 0.12)', border: '#e67e22' },
            'B10': { bg: 'rgba(230, 126, 34, 0.12)', border: '#e67e22' }
        };
        
        let berthTables = '';
        Object.keys(berthGroups).sort().forEach(berth => {
            const ships = berthGroups[berth];
            const colors = berthColors[berth] || { bg: 'rgba(149, 165, 166, 0.12)', border: '#95a5a6' };
            
            berthTables += `
                <div style="margin-bottom: 15px; background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 8px 12px; background: rgba(0,0,0,0.2); font-weight: bold; color: ${colors.border};">
                        🚢 ${berth} - 共 ${ships.length} 艘船作业
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(0,0,0,0.1);">
                                <th style="padding: 6px 10px; text-align: left; font-size: 11px; color: #7a9aba; width: 22%;">船名</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 12%;">货物</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">到港</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">开始</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">离港</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 10%;">工时</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 8%;">等待</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ships.map(s => {
                                const etaDay = Math.floor(s.etaHour / 24) + 1;
                                const etaH = s.etaHour % 24;
                                const startDay = Math.floor(s.startHour / 24) + 1;
                                const startH = s.startHour % 24;
                                const endDay = Math.floor((s.startHour + s.duration) / 24) + 1;
                                const endH = (s.startHour + s.duration) % 24;
                                return `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <td style="padding: 6px 8px; color: #e0e8f0;"><strong>${s.name}</strong></td>
                                        <td style="padding: 6px 8px; text-align: center; color: #7a9aba;">${s.cargoType}</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #95a5a6;">D${etaDay} ${String(etaH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #2ecc71;">D${startDay} ${String(startH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #e74c3c;">D${endDay} ${String(endH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #3498db;">${s.duration}h</td>
                                        <td style="padding: 6px 8px; text-align: center; color: ${s.waitTime > 12 ? '#e74c3c' : '#f39c12'};">${s.waitTime}h</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        const wrapper = document.getElementById('schedule-container-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div id="schedule-comparison-panel" class="port-card" style="margin-top: 15px;">
                    <div class="card-header" style="border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                        <span class="card-title">🚢 80艘船舶排班表 - FCFS先来先服务（原方案）</span>
                        <button onclick="regenerateBerthData()" style="padding: 5px 12px; background: linear-gradient(135deg, #00d4ff, #0066ff); border: none; border-radius: 4px; color: white; font-size: 11px; cursor: pointer;">
                            🎲 重新生成
                        </button>
                        <button onclick="exportScheduleCSV()" style="padding: 5px 12px; background: rgba(0, 212, 255, 0.2); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 4px; color: #a0c4e8; font-size: 11px; cursor: pointer; margin-left: 8px;">
                            📥 导出排班表
                        </button>
                    </div>
                    
                    <!-- 核心指标 -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px;">
                        <div style="text-align: center; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 1px solid rgba(52, 152, 219, 0.3);">
                            <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">总等待时间</div>
                            <div style="font-size: 22px; font-weight: 700; color: #3498db;">${stats.totalWait}h</div>
                            <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">FCFS算法</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3);">
                            <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">平均等待时间</div>
                            <div style="font-size: 22px; font-weight: 700; color: #2ecc71;">${stats.avgWait}h</div>
                            <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">每艘船</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(155, 89, 182, 0.1); border-radius: 8px; border: 1px solid rgba(155, 89, 182, 0.3);">
                            <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">泊位利用率</div>
                            <div style="font-size: 22px; font-weight: 700; color: #9b59b6;">${stats.utilization}%</div>
                            <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">资源利用</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.3);">
                            <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">等待>12h船舶</div>
                            <div style="font-size: 22px; font-weight: 700; color: #e74c3c;">${stats.delayedCount}艘</div>
                            <div style="font-size: 13px; color: #e74c3c; font-weight: bold;">建议优化</div>
                        </div>
                    </div>
                    
                    <!-- 方案说明 -->
                    <div style="padding: 0 15px 15px;">
                        <div style="padding: 12px; background: rgba(127, 140, 141, 0.1); border-radius: 6px; border-left: 4px solid #7f8c8d;">
                            <div style="font-weight: bold; color: #7f8c8d; margin-bottom: 5px;">💡 操作提示</div>
                            <div style="font-size: 12px; color: #a0c4e8; line-height: 1.6;">
                                点击上方「⚡ 智能优化分配」按钮，AI 将通过数千次排列组合计算，自动寻找全局最优的泊位调度方案！
                            </div>
                        </div>
                    </div>
                    
                    <!-- 排班表 -->
                    <div style="padding: 0 15px 15px;">
                        ${berthTables}
                    </div>
                </div>
            `;
        }
    }, 100);
}

function renderBerthStats(container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📈 泊位利用率趋势</span>
                    <select style="background: rgba(30, 55, 85, 0.8); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px; color: #a0c4e8; padding: 4px 8px; font-size: 11px;">
                        <option>最近7天</option>
                        <option>最近30天</option>
                        <option>最近90天</option>
                    </select>
                </div>
                <div id="berth-trend-chart" class="chart-container" style="height: 300px;"></div>
            </div>
            
            <div class="port-card">
                <div class="card-header">
                    <span class="card-title">📊 各泊位对比</span>
                </div>
                <div id="berth-compare-chart" class="chart-container" style="height: 300px;"></div>
            </div>
        </div>
        
        <div class="port-card" style="margin-top: 15px;">
            <div class="card-header">
                <span class="card-title">⏰ 泊位空闲时段分析</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #00ff88;">78%</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">平均利用率</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #00d4ff;">18h</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">今日累计空闲</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #ffc107;">3.2h</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">平均等待时间</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(156, 39, 176, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #b388ff;">8艘</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">今日在港峰值</div>
                </div>
            </div>
        </div>
    `;

    initBerthCharts();
}

function initBerthCharts() {
    const ec = getECharts();
    if (!ec) return;

    // 利用率趋势
    const trendChart = ec.init(document.getElementById('berth-trend-chart'));
    const days = ['5/6', '5/7', '5/8', '5/9', '5/10', '5/11', '5/12'];
    const data1 = [65, 72, 68, 75, 82, 78, 76];
    const data2 = [58, 65, 70, 68, 75, 72, 70];
    
    trendChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['集装箱泊位', '散货泊位'], textStyle: { color: '#a0c4e8', fontSize: 11 } },
        grid: { left: '10%', right: '5%', top: '15%', bottom: '10%' },
        xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba' } },
        yAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
        series: [
            { name: '集装箱泊位', type: 'line', smooth: true, data: data1, lineStyle: { color: '#00ff88', width: 2 }, itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0, 255, 136, 0.1)' } },
            { name: '散货泊位', type: 'line', smooth: true, data: data2, lineStyle: { color: '#00d4ff', width: 2 }, itemStyle: { color: '#00d4ff' }, areaStyle: { color: 'rgba(0, 212, 255, 0.1)' } }
        ]
    });

    // 各泊位对比 - 横向柱状图
    const compareChart = ec.init(document.getElementById('berth-compare-chart'));
    const berthNames = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15'];
    const utilizationData = [82, 76, 65, 78, 71, 68, 74, 85, 62, 70, 92, 58, 79, 45, 55];
    
    compareChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
        grid: { left: '15%', right: '10%', top: '5%', bottom: '5%' },
        xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#1e3a5f' } } },
        yAxis: { type: 'category', data: berthNames, axisLine: { lineStyle: { color: '#1e3a5f' } }, axisLabel: { color: '#7a9aba', fontSize: 10 } },
        series: [{
            type: 'bar',
            data: utilizationData.map((val, idx) => ({
                value: val,
                itemStyle: {
                    color: val >= 80 ? '#00ff88' : val >= 70 ? '#00d4ff' : val >= 60 ? '#ffc107' : '#ff4757'
                }
            })),
            barWidth: '60%',
            label: { show: true, position: 'right', formatter: '{c}%', color: '#a0c4e8', fontSize: 10 }
        }]
    });

    // 图表初始化完成
}

// 渲染泊位计划表
function renderScheduleTable(schedules, highlightChanges = false) {
    const conflicts = detectConflicts(schedules);
    const conflictIds = new Set(conflicts.flatMap(c => [c.id1, c.id2]));
    
    const statusMap = { confirmed: { class: 'working', text: '已确认' }, pending: { class: 'warning', text: '待确认' }, draft: { class: 'idle', text: '草稿' } };
    
    // 计算哪些行被修改了
    const modifiedIds = new Set();
    if (highlightChanges && algorithmState.originalSchedules.length > 0) {
        schedules.forEach((s, idx) => {
            const original = algorithmState.originalSchedules.find(o => o.id === s.id);
            if (original && original.berth !== s.berth) {
                modifiedIds.add(s.id);
            }
        });
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>泊位</th>
                    <th>船名</th>
                    <th>船型</th>
                    <th>预计到港</th>
                    <th>预计离港</th>
                    <th>作业箱量</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${schedules.map(s => {
                    const hasConflict = conflictIds.has(s.id);
                    const isModified = modifiedIds.has(s.id);
                    const conflictInfo = conflicts.filter(c => c.id1 === s.id || c.id2 === s.id)
                        .map(c => `与 ${schedules.find(s2 => s2.id === (c.id1 === s.id ? c.id2 : c.id1))?.ship || '未知'} 时间重叠`)
                        .join('; ');
                    
                    return `
                        <tr style="${hasConflict ? 'background: rgba(255, 71, 87, 0.15);' : ''} ${isModified ? 'background: rgba(0, 255, 136, 0.15);' : ''}" 
                            ${hasConflict ? `title="⚠️ 冲突: ${conflictInfo}"` : ''}
                            ${isModified ? `title="✓ 已优化分配"` : ''}>
                            <td><span class="status-badge ${hasConflict ? 'danger' : 'info'}">${s.berth}</span></td>
                            <td style="color: #00ff88; font-weight: 600;">${s.ship}</td>
                            <td><span class="status-badge idle">${s.shipType}</span></td>
                            <td>${s.eta}</td>
                            <td>${s.etd}</td>
                            <td>${s.boxes > 0 ? s.boxes.toLocaleString() : '-'}</td>
                            <td><span class="status-badge ${statusMap[s.status].class}">${statusMap[s.status].text}</span></td>
                            <td>
                                <button class="port-btn port-btn-secondary port-btn-sm">编辑</button>
                                <button class="port-btn port-btn-danger port-btn-sm" style="margin-left: 5px;">删除</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// 检测泊位时间冲突
function detectConflicts(schedules) {
    const conflicts = [];
    const berthGroups = {};
    
    // 按泊位分组
    schedules.forEach(s => {
        if (!berthGroups[s.berth]) {
            berthGroups[s.berth] = [];
        }
        berthGroups[s.berth].push(s);
    });
    
    // 检查每个泊位内的时间重叠
    Object.values(berthGroups).forEach(ships => {
        for (let i = 0; i < ships.length; i++) {
            for (let j = i + 1; j < ships.length; j++) {
                const aStart = new Date(ships[i].eta).getTime();
                const aEnd = new Date(ships[i].etd).getTime();
                const bStart = new Date(ships[j].eta).getTime();
                const bEnd = new Date(ships[j].etd).getTime();
                
                // 检查时间重叠
                if (aStart < bEnd && bStart < aEnd) {
                    conflicts.push({
                        id1: ships[i].id,
                        id2: ships[j].id,
                        berth: ships[i].berth,
                        ship1: ships[i].ship,
                        ship2: ships[j].ship
                    });
                }
            }
        }
    });
    
    return conflicts;
}

// 初始化收敛曲线图表
let convergenceChart = null;
function initConvergenceChart() {
    const ec = getECharts();
    if (!ec) return;
    
    const chartDom = document.getElementById('convergence-chart');
    if (!chartDom) return;
    
    convergenceChart = ec.init(chartDom);
    updateConvergenceChart([]);
    
    // ✅ 强制修复宽度：初始化后马上 resize
    setTimeout(() => {
        if (convergenceChart) convergenceChart.resize();
    }, 100);
    setTimeout(() => {
        if (convergenceChart) convergenceChart.resize();
    }, 500);
}

// 更新收敛曲线图表
function updateConvergenceChart(data) {
    if (!convergenceChart) return;
    
    const xData = data.map((_, i) => i);
    
    convergenceChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: '迭代 {b}: {c}' },
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' },
        xAxis: {
            type: 'category',
            data: xData,
            axisLine: { lineStyle: { color: '#1e3a5f' } },
            axisLabel: { color: '#7a9aba', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#1e3a5f' } },
            axisLabel: { color: '#7a9aba', fontSize: 10 },
            splitLine: { lineStyle: { color: '#1e3a5f' } }
        },
        series: [{
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: data,
            lineStyle: { color: '#00ff88', width: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(0, 255, 136, 0.3)' },
                        { offset: 1, color: 'rgba(0, 255, 136, 0)' }
                    ]
                }
            }
        }]
    });
    
    // ✅ 每次更新数据也强制 resize
    setTimeout(() => {
        if (convergenceChart) convergenceChart.resize();
    }, 50);
}

// 运行优化算法
function runOptimizationAlgorithm() {
    if (algorithmState.isRunning) return;
    
    // 获取参数
    algorithmState.selectedAlgorithm = document.getElementById('algorithm-select').value;
    algorithmState.objective = document.getElementById('objective-select').value;
    algorithmState.maxIterations = parseInt(document.getElementById('iteration-slider').value);
    algorithmState.currentIteration = 0;
    algorithmState.convergenceData = [];
    algorithmState.isRunning = true;
    
    // 更新UI
    document.getElementById('algorithm-status-badge').className = 'status-badge working';
    document.getElementById('algorithm-status-badge').textContent = '运行中';
    document.getElementById('algorithm-running-panel').style.display = 'block';
    document.getElementById('optimize-btn').disabled = true;
    document.getElementById('optimize-btn').textContent = '⏳ 计算中...';
    document.getElementById('optimization-result-panel').style.display = 'none';
    
    // 显示运行文本动画
    const runningTexts = [
        '正在初始化种群...',
        '正在计算适应度函数...',
        '正在执行选择交叉变异...',
        '正在进行局部搜索优化...',
        '正在优化泊位分配方案...',
        '正在消除时间冲突...',
        '正在收敛到最优解...'
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
        if (!algorithmState.isRunning) {
            clearInterval(textInterval);
            return;
        }
        document.getElementById('algorithm-running-text').textContent = runningTexts[textIndex % runningTexts.length];
        textIndex++;
    }, 800);
    
    // 模拟算法迭代过程
    const targetValue = algorithmState.objective === 'waitTime' ? 12.3 : 
                        algorithmState.objective === 'utilization' ? 0.78 : 0.85;
    const initialValue = algorithmState.objective === 'waitTime' ? 18.5 : 
                         algorithmState.objective === 'utilization' ? 0.68 : 0.72;
    
    function iterate() {
        if (algorithmState.currentIteration >= algorithmState.maxIterations || !algorithmState.isRunning) {
            finishOptimization(textInterval);
            return;
        }
        
        algorithmState.currentIteration++;
        
        // 计算当前值（模拟收敛曲线）
        const progress = algorithmState.currentIteration / algorithmState.maxIterations;
        const noise = (Math.random() - 0.5) * 0.5;
        let currentValue;
        
        if (algorithmState.objective === 'waitTime') {
            // 最小化目标：值逐渐减小
            currentValue = initialValue - (initialValue - targetValue) * (1 - Math.exp(-progress * 5)) + noise;
            currentValue = Math.max(targetValue * 0.9, currentValue);
        } else {
            // 最大化目标：值逐渐增大
            currentValue = initialValue + (targetValue - initialValue) * (1 - Math.exp(-progress * 5)) + noise * 0.1;
            currentValue = Math.min(1, currentValue);
        }
        
        algorithmState.convergenceData.push(currentValue);
        
        // 更新进度条
        const percent = Math.round((algorithmState.currentIteration / algorithmState.maxIterations) * 100);
        document.getElementById('progress-bar').style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = `${algorithmState.currentIteration} / ${algorithmState.maxIterations} (${percent}%)`;
        
        // 更新实时指标
        const bestValue = algorithmState.objective === 'waitTime' ? 
            Math.min(...algorithmState.convergenceData) : 
            Math.max(...algorithmState.convergenceData);
        
        document.getElementById('current-best-value').textContent = algorithmState.objective === 'waitTime' ? 
            bestValue.toFixed(1) + 'h' : (bestValue * 100).toFixed(0) + '%';
        document.getElementById('objective-value').textContent = algorithmState.objective === 'waitTime' ? 
            currentValue.toFixed(1) + 'h' : (currentValue * 100).toFixed(0) + '%';
        
        // 模拟冲突减少
        const remainingConflicts = Math.max(0, Math.floor(3 - progress * 3));
        document.getElementById('conflict-count').textContent = remainingConflicts;
        
        // 更新收敛图表（每10次迭代更新一次，避免卡顿）
        if (algorithmState.currentIteration % 10 === 0) {
            updateConvergenceChart(algorithmState.convergenceData.filter((_, i) => i % 5 === 0));
        }
        
        // 继续迭代
        setTimeout(iterate, 20);
    }
    
    // 开始迭代
    iterate();
}

// 完成优化
function finishOptimization(textInterval) {
    clearInterval(textInterval);
    algorithmState.isRunning = false;
    
    // 更新状态
    document.getElementById('algorithm-status-badge').className = 'status-badge working';
    document.getElementById('algorithm-status-badge').textContent = '优化完成';
    document.getElementById('algorithm-running-text').textContent = '✓ 最优泊位分配方案已生成';
    document.getElementById('optimize-btn').disabled = false;
    document.getElementById('optimize-btn').textContent = '⚡ 智能优化分配';
    
    // 生成优化后的调度方案
    const optimized = JSON.parse(JSON.stringify(algorithmState.originalSchedules));
    
    // 模拟一些泊位分配变更
    const changes = [
        { id: 3, from: 'B03', to: 'B04' },  // 东方海外香港
        { id: 5, from: 'B05', to: 'B06' },  // 山东大成
        { id: 12, from: 'B11', to: 'B12' }, // 海洋绿洲
    ];
    
    changes.forEach(change => {
        const schedule = optimized.find(s => s.id === change.id);
        if (schedule) {
            schedule.berth = change.to;
        }
    });
    
    algorithmState.optimizedSchedules = optimized;
    
    // 最终图表更新
    updateConvergenceChart(algorithmState.convergenceData.filter((_, i) => i % 5 === 0));
    
    showToast('泊位分配优化完成！已消除全部时间冲突', 'success');
    
    // ========== ✨ 显示完整的优化前后排班对比 ==========
    setTimeout(function() {
        showScheduleComparison();
    }, 500);
}

// 重置优化
function resetOptimization() {
    if (algorithmState.isRunning) {
        algorithmState.isRunning = false;
    }
    
    // 重置状态
    algorithmState.currentIteration = 0;
    algorithmState.convergenceData = [];
    algorithmState.optimizedSchedules = [];
    
    // 更新状态徽章
    document.getElementById('algorithm-status-badge').className = 'status-badge idle';
    document.getElementById('algorithm-status-badge').textContent = '就绪';
    
    // 恢复按钮
    document.getElementById('optimize-btn').disabled = false;
    document.getElementById('optimize-btn').textContent = '⚡ 智能优化分配';
    
    // ✅ 重置后重新显示原方案排班表
    const wrapper = document.getElementById('schedule-container-wrapper');
    if (wrapper && window.scheduleData && window.scheduleData.original) {
        const originalSchedule = window.scheduleData.original;
        
        // 计算统计指标
        const stats = {
            totalWait: originalSchedule.reduce((s, t) => s + t.waitTime, 0),
            avgWait: Math.round(originalSchedule.reduce((s, t) => s + t.waitTime, 0) / originalSchedule.length),
            utilization: calculateUtilization(originalSchedule),
            delayedCount: originalSchedule.filter(t => t.waitTime > 12).length
        };
        
        // 按泊位分组
        const berthGroups = {};
        originalSchedule.forEach(ship => {
            if (!berthGroups[ship.berth]) berthGroups[ship.berth] = [];
            berthGroups[ship.berth].push(ship);
        });
        
        // 泊位颜色配置
        const berthColors = {
            'B01': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' },
            'B02': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' },
            'B03': { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ecc71' },
            'B04': { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ecc71' },
            'B05': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' },
            'B06': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' },
            'B07': { bg: 'rgba(241, 196, 15, 0.12)', border: '#f1c40f' },
            'B08': { bg: 'rgba(241, 196, 15, 0.12)', border: '#f1c40f' },
            'B09': { bg: 'rgba(230, 126, 34, 0.12)', border: '#e67e22' },
            'B10': { bg: 'rgba(230, 126, 34, 0.12)', border: '#e67e22' }
        };
        
        let berthTables = '';
        Object.keys(berthGroups).sort().forEach(berth => {
            const ships = berthGroups[berth];
            const colors = berthColors[berth] || { bg: 'rgba(149, 165, 166, 0.12)', border: '#95a5a6' };
            
            berthTables += `
                <div style="margin-bottom: 15px; background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 8px 12px; background: rgba(0,0,0,0.2); font-weight: bold; color: ${colors.border};">
                        🚢 ${berth} - 共 ${ships.length} 艘船作业
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(0,0,0,0.1);">
                                <th style="padding: 6px 10px; text-align: left; font-size: 11px; color: #7a9aba; width: 22%;">船名</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 12%;">货物</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">到港</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">开始</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 16%;">离港</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 10%;">工时</th>
                                <th style="padding: 6px 10px; text-align: center; font-size: 11px; color: #7a9aba; width: 8%;">等待</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ships.map(s => {
                                const etaDay = Math.floor(s.etaHour / 24) + 1;
                                const etaH = s.etaHour % 24;
                                const startDay = Math.floor(s.startHour / 24) + 1;
                                const startH = s.startHour % 24;
                                const endDay = Math.floor((s.startHour + s.duration) / 24) + 1;
                                const endH = (s.startHour + s.duration) % 24;
                                return `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <td style="padding: 6px 8px; color: #e0e8f0;"><strong>${s.name}</strong></td>
                                        <td style="padding: 6px 8px; text-align: center; color: #7a9aba;">${s.cargoType}</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #95a5a6;">D${etaDay} ${String(etaH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #2ecc71;">D${startDay} ${String(startH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #e74c3c;">D${endDay} ${String(endH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #3498db;">${s.duration}h</td>
                                        <td style="padding: 6px 8px; text-align: center; color: ${s.waitTime > 12 ? '#e74c3c' : '#f39c12'};">${s.waitTime}h</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        wrapper.innerHTML = `
            <div id="schedule-comparison-panel" class="port-card" style="margin-top: 15px;">
                <div class="card-header" style="border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                    <span class="card-title">🚢 80艘船舶排班表 - FCFS先来先服务（原方案）</span>
                    <button onclick="exportScheduleCSV()" style="padding: 5px 12px; background: linear-gradient(135deg, #00d4ff, #0066ff); border: none; border-radius: 4px; color: white; font-size: 11px; cursor: pointer;">
                        📥 导出排班表
                    </button>
                </div>
                
                <!-- 核心指标 -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px;">
                    <div style="text-align: center; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 1px solid rgba(52, 152, 219, 0.3);">
                        <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">总等待时间</div>
                        <div style="font-size: 22px; font-weight: 700; color: #3498db;">${stats.totalWait}h</div>
                        <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">FCFS算法</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3);">
                        <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">平均等待时间</div>
                        <div style="font-size: 22px; font-weight: 700; color: #2ecc71;">${stats.avgWait}h</div>
                        <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">每艘船</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: rgba(155, 89, 182, 0.1); border-radius: 8px; border: 1px solid rgba(155, 89, 182, 0.3);">
                        <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">泊位利用率</div>
                        <div style="font-size: 22px; font-weight: 700; color: #9b59b6;">${stats.utilization}%</div>
                        <div style="font-size: 13px; color: #7a9aba; font-weight: bold;">资源利用</div>
                    </div>
                    <div style="text-align: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.3);">
                        <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">等待>12h船舶</div>
                        <div style="font-size: 22px; font-weight: 700; color: #e74c3c;">${stats.delayedCount}艘</div>
                        <div style="font-size: 13px; color: #e74c3c; font-weight: bold;">建议优化</div>
                    </div>
                </div>
                
                <!-- 方案说明 -->
                <div style="padding: 0 15px 15px;">
                    <div style="padding: 12px; background: rgba(127, 140, 141, 0.1); border-radius: 6px; border-left: 4px solid #7f8c8d;">
                        <div style="font-weight: bold; color: #7f8c8d; margin-bottom: 5px;">💡 操作提示</div>
                        <div style="font-size: 12px; color: #a0c4e8; line-height: 1.6;">
                            点击上方「⚡ 智能优化分配」按钮，AI 将通过数千次排列组合计算，自动寻找全局最优的泊位调度方案！
                        </div>
                    </div>
                </div>
                
                <!-- 排班表 -->
                <div style="padding: 0 15px 15px;">
                    ${berthTables}
                </div>
            </div>
        `;
    }
    
    showToast('已重置为原始泊位分配方案', 'info');
}

function renderBerthArchive(container) {
    const berthArchiveData = [
        { id: 'B01', name: '1号泊位', type: '集装箱', length: 400, depth: 15.5, built: '2018-06', status: '正常', totalShips: 1256, totalVolume: 3850000, avgUtil: 78 },
        { id: 'B02', name: '2号泊位', type: '集装箱', length: 400, depth: 15.5, built: '2018-06', status: '正常', totalShips: 1198, totalVolume: 3680000, avgUtil: 76 },
        { id: 'B03', name: '3号泊位', type: '集装箱', length: 380, depth: 14.5, built: '2019-03', status: '正常', totalShips: 1085, totalVolume: 3320000, avgUtil: 65 },
        { id: 'B04', name: '4号泊位', type: '集装箱', length: 380, depth: 14.5, built: '2019-03', status: '正常', totalShips: 1120, totalVolume: 3450000, avgUtil: 78 },
        { id: 'B05', name: '5号泊位', type: '散货', length: 350, depth: 13.5, built: '2016-09', status: '正常', totalShips: 856, totalVolume: 2150000, avgUtil: 71 },
        { id: 'B06', name: '6号泊位', type: '散货', length: 350, depth: 13.5, built: '2016-09', status: '正常', totalShips: 812, totalVolume: 2030000, avgUtil: 68 },
        { id: 'B07', name: '7号泊位', type: '散货', length: 320, depth: 12.0, built: '2017-12', status: '正常', totalShips: 920, totalVolume: 1860000, avgUtil: 74 },
        { id: 'B08', name: '8号泊位', type: '油轮', length: 300, depth: 16.0, built: '2015-05', status: '正常', totalShips: 685, totalVolume: 980000, avgUtil: 85 },
        { id: 'B09', name: '9号泊位', type: '油轮', length: 300, depth: 16.0, built: '2015-05', status: '正常', totalShips: 520, totalVolume: 750000, avgUtil: 62 },
        { id: 'B10', name: '10号泊位', type: '油轮', length: 280, depth: 14.0, built: '2020-11', status: '维护中', totalShips: 412, totalVolume: 590000, avgUtil: 70 },
        { id: 'B11', name: '11号泊位', type: '客轮', length: 250, depth: 10.5, built: '2017-08', status: '正常', totalShips: 2365, totalVolume: 0, avgUtil: 92 },
        { id: 'B12', name: '12号泊位', type: '客轮', length: 220, depth: 9.5, built: '2018-02', status: '正常', totalShips: 1890, totalVolume: 0, avgUtil: 58 },
        { id: 'B13', name: '13号泊位', type: '专用', length: 320, depth: 13.0, built: '2019-07', status: '正常', totalShips: 425, totalVolume: 680000, avgUtil: 79 },
        { id: 'B14', name: '14号泊位', type: '专用', length: 200, depth: 8.5, built: '2021-01', status: '维护中', totalShips: 156, totalVolume: 240000, avgUtil: 45 },
        { id: 'B15', name: '15号泊位', type: '专用', length: 180, depth: 7.5, built: '2022-05', status: '正常', totalShips: 98, totalVolume: 150000, avgUtil: 55 }
    ];

    const maintenanceRecords = [
        { berth: 'B08', date: '2024-04-15', type: '定期维护', content: '系船柱检查、护舷更换', duration: '3天', status: '已完成' },
        { berth: 'B10', date: '2024-05-01', type: '故障维修', content: '岸桥电气系统故障排查', duration: '7天', status: '进行中' },
        { berth: 'B14', date: '2024-04-28', type: '升级改造', content: '泊位深度加深工程', duration: '15天', status: '进行中' },
        { berth: 'B03', date: '2024-03-20', type: '定期维护', content: '码头面层修补', duration: '5天', status: '已完成' },
        { berth: 'B11', date: '2024-02-10', type: '定期维护', content: '客运设施升级', duration: '7天', status: '已完成' }
    ];

    const pageSize = 10;

    container.innerHTML = `
        <div class="port-card">
            <div class="card-header">
                <span class="card-title">📋 泊位基础信息台账</span>
            </div>
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>泊位编号</th>
                            <th>名称</th>
                            <th>类型</th>
                            <th>长度(m)</th>
                            <th>水深(m)</th>
                            <th>建成时间</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${berthArchiveData.slice(0, pageSize).map(b => `
                            <tr>
                                <td><span class="status-badge info">${b.id}</span></td>
                                <td style="font-weight: 600;">${b.name}</td>
                                <td><span class="status-badge ${b.type === '集装箱' ? 'working' : b.type === '散货' ? 'warning' : b.type === '油轮' ? 'danger' : 'idle'}">${b.type}</span></td>
                                <td>${b.length}</td>
                                <td>${b.depth}</td>
                                <td>${b.built}</td>
                                <td><span class="status-badge ${b.status === '正常' ? 'working' : 'danger'}">${b.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding: 0 15px;">
                <span style="color: #7a9aba; font-size: 12px;">共 ${berthArchiveData.length} 条记录</span>
                <div style="display: flex; gap: 8px;">
                    <button class="port-btn port-btn-secondary port-btn-sm" disabled>上一页</button>
                    <button class="port-btn port-btn-primary port-btn-sm">1</button>
                    <button class="port-btn port-btn-secondary port-btn-sm">2</button>
                    <button class="port-btn port-btn-secondary port-btn-sm">下一页</button>
                </div>
            </div>
        </div>

        <div class="port-card" style="margin-top: 15px;">
            <div class="card-header">
                <span class="card-title">📊 历史作业统计</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 15px;">
                <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #00ff88;">${berthArchiveData.reduce((sum, b) => sum + b.totalShips, 0).toLocaleString()}</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">累计靠泊艘次</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #00d4ff;">${(berthArchiveData.reduce((sum, b) => sum + b.totalVolume, 0) / 10000).toFixed(0)}万</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">累计吞吐量(TEU)</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #ffc107;">${Math.round(berthArchiveData.reduce((sum, b) => sum + b.avgUtil, 0) / berthArchiveData.length)}%</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">年均利用率</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(156, 39, 176, 0.1); border-radius: 10px;">
                    <div style="font-size: 28px; font-weight: 700; color: #b388ff;">${berthArchiveData.filter(b => b.status === '维护中').length}</div>
                    <div style="font-size: 12px; color: #7a9aba; margin-top: 5px;">维护中泊位</div>
                </div>
            </div>
        </div>

        <div class="port-card" style="margin-top: 15px;">
            <div class="card-header">
                <span class="card-title">🔧 维修保养记录</span>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>泊位</th>
                        <th>日期</th>
                        <th>类型</th>
                        <th>内容</th>
                        <th>工期</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${maintenanceRecords.map(r => `
                        <tr>
                            <td><span class="status-badge info">${r.berth}</span></td>
                            <td>${r.date}</td>
                            <td>${r.type}</td>
                            <td>${r.content}</td>
                            <td>${r.duration}</td>
                            <td><span class="status-badge ${r.status === '已完成' ? 'working' : 'warning'}">${r.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
// ========== ✨ 船舶泊位智能调度对比系统 ==========
function showScheduleComparison() {
    // ✅ 和原来的逻辑完全一样，不做任何字段转换，避免船名问题
    const ships = generateShipArrivalData(80);
    
    // 2. FCFS先来先服务（原方案）
    const originalSchedule = generateFCFSSchedule(ships);
    
    // 3. 智能优化方案
    const optimizedSchedule = generateOptimizedSchedule(ships);
    
    // ✅ 保存全局数据，确保重置时能用
    window.scheduleData = { original: originalSchedule, optimized: optimizedSchedule };
    
    // 4. 渲染对比面板
    renderComparisonPanel(originalSchedule, optimizedSchedule);
}

// ✅ 用户主动点击才重新生成数据
function regenerateBerthData() {
    // 生成新数据并保存到 sessionStorage
    const ships = generateShipArrivalData(80);
    const originalSchedule = generateFCFSSchedule(ships);
    sessionStorage.setItem('berthScheduleData', JSON.stringify(originalSchedule));
    
    showToast('✅ 已重新生成80艘船舶调度数据', 'success');
    
    // ✅ 只重新加载泊位计划模块，不刷新整个页面，不跳回首页
    window.scheduleData = { original: originalSchedule, optimized: null };
    switchBerthTab('schedule');
}

// ========== 生成船舶到港数据 ==========
function generateShipArrivalData(count) {
    const ships = [];
    const shipNames = ['远洋号', '中远号', '东方号', '中海号', '山东号', '长赐号', 
                       '马士基号', '达飞号', '海运号', '港运号', '新星号', '前进号'];
    const cargoTypes = ['集装箱', '散货', '液体化工', '成品油', 'LNG'];
    
    for (let i = 0; i < count; i++) {
        ships.push({
            id: i + 1,
            name: shipNames[i % shipNames.length] + (Math.floor(i / shipNames.length) > 0 ? '-' + (Math.floor(i / shipNames.length) + 1) : ''),
            cargoType: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
            etaHour: Math.floor(Math.random() * 72),  // 前3天集中到港
            duration: 6 + Math.floor(Math.random() * 18)  // 6-24小时作业
        });
    }
    return ships.sort((a, b) => a.etaHour - b.etaHour);
}

// ========== 计算总等待时间 ==========
function calculateTotalWaitTime(shipOrder, berthCount) {
    const berths = Array(berthCount).fill(0);
    let totalWait = 0;
    shipOrder.forEach(ship => {
        let earliestTime = berths[0];
        let earliestIdx = 0;
        berths.forEach((t, i) => { if (t < earliestTime) { earliestTime = t; earliestIdx = i; } });
        const startTime = Math.max(ship.etaHour, earliestTime);
        totalWait += startTime - ship.etaHour;
        berths[earliestIdx] = startTime + ship.duration;
    });
    return totalWait;
}

// ========== FCFS先来先服务算法 ==========
function generateFCFSSchedule(ships) {
    const berths = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'];
    const berthLastEndTime = {};
    berths.forEach(b => berthLastEndTime[b] = 0);
    const result = [];
    
    ships.forEach(ship => {
        let earliestBerth = berths[0];
        let earliestTime = berthLastEndTime[berths[0]];
        berths.forEach(b => { if (berthLastEndTime[b] < earliestTime) { earliestTime = berthLastEndTime[b]; earliestBerth = b; } });
        const startTime = Math.max(ship.etaHour, earliestTime);
        result.push({ ...ship, berth: earliestBerth, startHour: startTime, endHour: startTime + ship.duration, waitTime: startTime - ship.etaHour });
        berthLastEndTime[earliestBerth] = startTime + ship.duration;
    });
    return result;
}

// ========== 智能优化算法（时间窗口优化 + 短作业优先）==========
function generateOptimizedSchedule(ships) {
    const BERTH_COUNT = 10;
    
    let currentOrder = [...ships];
    let bestOrder = [...currentOrder];
    let bestWait = calculateTotalWaitTime(bestOrder, BERTH_COUNT);
    
    // 策略1：按时间窗口分组排列优化
    for (let winStart = 0; winStart < 72; winStart += 8) {
        const windowEnd = winStart + 16;
        const windowIndices = [];
        for (let i = 0; i < currentOrder.length; i++) {
            if (currentOrder[i].etaHour >= winStart && currentOrder[i].etaHour < windowEnd) {
                windowIndices.push(i);
            }
        }
        
        if (windowIndices.length >= 4) {
            const windowShips = windowIndices.map(i => currentOrder[i]);
            // 尝试1500种排列
            for (let attempt = 0; attempt < 1500; attempt++) {
                windowShips.sort((a, b) => {
                    const r = Math.random();
                    if (r < 0.6) return a.duration - b.duration;
                    if (r < 0.85) return a.etaHour - b.etaHour;
                    return Math.random() - 0.5;
                });
                
                const tryOrder = [...currentOrder];
                for (let k = 0; k < windowShips.length; k++) {
                    tryOrder[windowIndices[k]] = windowShips[k];
                }
                
                const wait = calculateTotalWaitTime(tryOrder, BERTH_COUNT);
                if (wait < bestWait) {
                    bestWait = wait;
                    bestOrder = [...tryOrder];
                    currentOrder = [...tryOrder];
                }
            }
        }
    }
    
    // 策略2：最终精细调整
    for (let iter = 0; iter < 50; iter++) {
        let improved = false;
        for (let i = 0; i < ships.length - 1; i++) {
            if (Math.abs(bestOrder[i].etaHour - bestOrder[i+1].etaHour) > 10) continue;
            [bestOrder[i], bestOrder[i+1]] = [bestOrder[i+1], bestOrder[i]];
            const newWait = calculateTotalWaitTime(bestOrder, BERTH_COUNT);
            if (newWait < bestWait) {
                bestWait = newWait;
                improved = true;
            } else {
                [bestOrder[i], bestOrder[i+1]] = [bestOrder[i+1], bestOrder[i]];
            }
        }
        if (!improved) break;
    }
    
    // 生成最终结果
    const berths = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'];
    const berthLastEndTime = {};
    berths.forEach(b => berthLastEndTime[b] = 0);
    const result = [];
    
    bestOrder.forEach(ship => {
        let earliestBerth = berths[0];
        let earliestTime = berthLastEndTime[berths[0]];
        berths.forEach(b => { if (berthLastEndTime[b] < earliestTime) { earliestTime = berthLastEndTime[b]; earliestBerth = b; } });
        const startTime = Math.max(ship.etaHour, earliestTime);
        result.push({ ...ship, berth: earliestBerth, startHour: startTime, endHour: startTime + ship.duration, waitTime: startTime - ship.etaHour });
        berthLastEndTime[earliestBerth] = startTime + ship.duration;
    });
    
    return result;
}

// ========== 计算泊位利用率 ==========
function calculateUtilization(schedule) {
    const totalHours = 10 * 168; // 10个泊位 * 7天 * 24小时
    const usedHours = schedule.reduce((sum, s) => sum + s.duration, 0);
    return Math.round(usedHours / totalHours * 100 * 10) / 10;
}

// ========== 渲染对比面板 ==========
function renderComparisonPanel(original, optimized) {
    const stats = {
        original: {
            totalWait: original.reduce((s, t) => s + t.waitTime, 0),
            avgWait: Math.round(original.reduce((s, t) => s + t.waitTime, 0) / original.length),
            utilization: calculateUtilization(original),
            delayedCount: original.filter(t => t.waitTime > 12).length
        },
        optimized: {
            totalWait: optimized.reduce((s, t) => s + t.waitTime, 0),
            avgWait: Math.round(optimized.reduce((s, t) => s + t.waitTime, 0) / optimized.length),
            utilization: calculateUtilization(optimized),
            delayedCount: optimized.filter(t => t.waitTime > 12).length
        }
    };
    
    const improvement = {
        totalWait: Math.round((1 - stats.optimized.totalWait / stats.original.totalWait) * 100),
        avgWait: Math.round((1 - stats.optimized.avgWait / stats.original.avgWait) * 100),
        delayed: stats.original.delayedCount - stats.optimized.delayedCount
    };
    
    // ✅ 直接渲染到固定容器里（替换原来的原方案排班表）
    const wrapper = document.getElementById('schedule-container-wrapper');
    if (!wrapper) return;
    
    // 先清空旧内容
    wrapper.innerHTML = '';
    
    const html = `
        <div id="schedule-comparison-panel" class="port-card" style="margin-top: 15px;">
            <div class="card-header" style="border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                <span class="card-title">🚢 80艘船舶排班智能优化结果</span>
                <button onclick="exportScheduleCSV()" style="padding: 5px 12px; background: linear-gradient(135deg, #00d4ff, #0066ff); border: none; border-radius: 4px; color: white; font-size: 11px; cursor: pointer;">
                    📥 导出排班表
                </button>
            </div>
            
            <!-- 核心指标对比 -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px;">
                <div style="text-align: center; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 1px solid rgba(52, 152, 219, 0.3);">
                    <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">总等待时间</div>
                    <div style="font-size: 13px; color: #7f8c8d; text-decoration: line-through;">原方案 ${stats.original.totalWait}h</div>
                    <div style="font-size: 22px; font-weight: 700; color: #2ecc71;">优化后 ${stats.optimized.totalWait}h</div>
                    <div style="font-size: 13px; color: #2ecc71; font-weight: bold;">↓ ${improvement.totalWait}%</div>
                </div>
                <div style="text-align: center; padding: 12px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3);">
                    <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">平均等待时间</div>
                    <div style="font-size: 13px; color: #7f8c8d; text-decoration: line-through;">原方案 ${stats.original.avgWait}h</div>
                    <div style="font-size: 22px; font-weight: 700; color: #2ecc71;">优化后 ${stats.optimized.avgWait}h</div>
                    <div style="font-size: 13px; color: #2ecc71; font-weight: bold;">↓ ${improvement.avgWait}%</div>
                </div>
                <div style="text-align: center; padding: 12px; background: rgba(155, 89, 182, 0.1); border-radius: 8px; border: 1px solid rgba(155, 89, 182, 0.3);">
                    <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">泊位利用率</div>
                    <div style="font-size: 13px; color: #7f8c8d; text-decoration: line-through;">原方案 ${stats.original.utilization}%</div>
                    <div style="font-size: 22px; font-weight: 700; color: #9b59b6;">优化后 ${stats.optimized.utilization}%</div>
                    <div style="font-size: 13px; color: #9b59b6; font-weight: bold;">资源优化</div>
                </div>
                <div style="text-align: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.3);">
                    <div style="font-size: 12px; color: #7a9aba; margin-bottom: 5px;">等待>12h船舶</div>
                    <div style="font-size: 13px; color: #7f8c8d; text-decoration: line-through;">原方案 ${stats.original.delayedCount}艘</div>
                    <div style="font-size: 22px; font-weight: 700; color: #e74c3c;">优化后 ${stats.optimized.delayedCount}艘</div>
                    <div style="font-size: 13px; color: #2ecc71; font-weight: bold;">减少 ${improvement.delayed}艘</div>
                </div>
            </div>
            
            <!-- 方案说明 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px 15px;">
                <div style="padding: 12px; background: rgba(127, 140, 141, 0.1); border-radius: 6px; border-left: 4px solid #7f8c8d;">
                    <div style="font-weight: bold; color: #7f8c8d; margin-bottom: 5px;">📋 原方案（FCFS先来先服务）</div>
                    <div style="font-size: 12px; color: #a0c4e8; line-height: 1.6;">
                        船舶严格按到港时间顺序分配，依次交给最早空闲的泊位。优点：简单公平；缺点：短作业被长作业阻塞，总等待时间长。
                    </div>
                </div>
                <div style="padding: 12px; background: rgba(46, 204, 113, 0.1); border-radius: 6px; border-left: 4px solid #2ecc71;">
                    <div style="font-weight: bold; color: #2ecc71; margin-bottom: 5px;">🧠 优化方案（时间窗口智能调度）</div>
                    <div style="font-size: 12px; color: #a0c4e8; line-height: 1.6;">
                        通过时间窗口分组搜索最优排列，短作业优先减少整体等待时间，同时保证调度合理性。算法尝试数千种排列，选择全局最优。
                    </div>
                </div>
            </div>
            
            <!-- 两个方案Tab切换 -->
            <div style="display: flex; gap: 10px; padding: 0 15px; margin-bottom: 10px;">
                <button onclick="showScheduleDetails('original')" id="btn-view-original" style="flex: 1; padding: 8px; background: rgba(127, 140, 141, 0.3); border: 1px solid #7f8c8d; border-radius: 6px; color: #bdc3c7; cursor: pointer;">
                    📋 查看原方案排班表
                </button>
                <button onclick="showScheduleDetails('optimized')" id="btn-view-optimized" style="flex: 1; padding: 8px; background: rgba(46, 204, 113, 0.3); border: 1px solid #2ecc71; border-radius: 6px; color: #2ecc71; cursor: pointer;">
                    🧠 查看优化方案排班表
                </button>
            </div>
            
            <div id="schedule-details-container" style="padding: 0 15px 15px;">
                <div style="text-align: center; padding: 20px; color: #7a9aba;">
                    👆 点击上方按钮查看详细的7天船舶泊位安排
                </div>
            </div>
        </div>
    `;
    
    // 渲染到固定容器
    wrapper.innerHTML = html;
}

// ========== 显示详细排班表 ==========
window.showScheduleDetails = function(type) {
    const data = window.scheduleData;
    if (!data) return;
    
    const schedule = type === 'original' ? data.original : data.optimized;
    const container = document.getElementById('schedule-details-container');
    
    // 更新按钮样式
    document.getElementById('btn-view-original').style.background = type === 'original' ? 'rgba(127, 140, 141, 0.6)' : 'rgba(127, 140, 141, 0.2)';
    document.getElementById('btn-view-optimized').style.background = type === 'optimized' ? 'rgba(46, 204, 113, 0.6)' : 'rgba(46, 204, 113, 0.2)';
    
    // 按泊位分组
    const berthGroups = {};
    schedule.forEach(ship => {
        if (!berthGroups[ship.berth]) berthGroups[ship.berth] = [];
        berthGroups[ship.berth].push(ship);
    });
    
    // 泊位颜色配置
    const berthColors = {
        'B01': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' }, 'B02': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' },
        'B03': { bg: 'rgba(52, 152, 219, 0.12)', border: '#3498db' }, 'B04': { bg: 'rgba(243, 156, 18, 0.12)', border: '#f39c12' },
        'B05': { bg: 'rgba(243, 156, 18, 0.12)', border: '#f39c12' }, 'B06': { bg: 'rgba(243, 156, 18, 0.12)', border: '#f39c12' },
        'B07': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' }, 'B08': { bg: 'rgba(155, 89, 182, 0.12)', border: '#9b59b6' },
        'B09': { bg: 'rgba(46, 204, 113, 0.12)', border: '#2ecc71' }, 'B10': { bg: 'rgba(231, 76, 60, 0.12)', border: '#e74c3c' }
    };
    
    let html = '<div style="max-height: 800px; overflow-y: auto;">';
    
    // 每个泊位生成一个表格
    const berthOrder = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'];
    berthOrder.forEach(berthId => {
        const berthShips = berthGroups[berthId] || [];
        if (berthShips.length === 0) return;
        
        // 按开始时间排序
        berthShips.sort((a, b) => a.startHour - b.startHour);
        
        const colors = berthColors[berthId] || { bg: 'rgba(127, 140, 141, 0.1)', border: '#95a5a6' };
        
        html += `
            <div style="margin-bottom: 15px; background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 6px; padding: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px; font-weight: 700; color: ${colors.border};">⚓ ${berthId}号泊位</span>
                        <span style="font-size: 11px; color: #7a9aba; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 10px;">
                            ${berthShips.length} 艘次 · 总作业 ${berthShips.reduce((sum, t) => sum + t.duration, 0)}h
                        </span>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; font-size: 12px; border-collapse: collapse; min-width: 700px;">
                        <thead>
                            <tr style="background: rgba(0,0,0,0.15);">
                                <th style="padding: 6px 8px; text-align: left; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 15%;">船名</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 12%;">货物</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 15%;">到港时间</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 15%;">开始作业</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 15%;">结束作业</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 10%;">作业时长</th>
                                <th style="padding: 6px 8px; text-align: center; color: #a0c4e8; border-bottom: 1px solid rgba(255,255,255,0.05); width: 8%;">等待</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${berthShips.map(s => {
                                const startDay = Math.floor(s.startHour / 24) + 1;
                                const startH = s.startHour % 24;
                                const endDay = Math.floor(s.endHour / 24) + 1;
                                const endH = s.endHour % 24;
                                const etaDay = Math.floor(s.etaHour / 24) + 1;
                                const etaH = s.etaHour % 24;
                                return `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <td style="padding: 6px 8px; color: #e0e8f0;"><strong>${s.name}</strong></td>
                                        <td style="padding: 6px 8px; text-align: center; color: #7a9aba;">${s.cargoType}</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #95a5a6;">D${etaDay} ${String(etaH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #2ecc71;">D${startDay} ${String(startH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #e74c3c;">D${endDay} ${String(endH).padStart(2, '0')}:00</td>
                                        <td style="padding: 6px 8px; text-align: center; color: #f39c12; font-weight: bold;">${s.duration}h</td>
                                        <td style="padding: 6px 8px; text-align: center; color: ${s.waitTime <= 3 ? '#2ecc71' : s.waitTime <= 8 ? '#f39c12' : '#e74c3c'};">${s.waitTime}h</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// ========== 导出CSV功能 ==========
window.exportScheduleCSV = function() {
    const data = window.scheduleData;
    if (!data) return;
    
    let csv = '方案,泊位,船名,货物类型,到港时间,开始作业,结束作业,作业时长(小时),等待时间(小时)\n';
    
    // 导出原方案
    data.original.forEach(s => {
        const etaD = Math.floor(s.etaHour / 24) + 1;
        const etaH = s.etaHour % 24;
        const startD = Math.floor(s.startHour / 24) + 1;
        const startH = s.startHour % 24;
        const endD = Math.floor(s.endHour / 24) + 1;
        const endH = s.endHour % 24;
        csv += `原方案,${s.berth},${s.name},${s.cargoType},D${etaD} ${String(etaH).padStart(2, '0')}:00,D${startD} ${String(startH).padStart(2, '0')}:00,D${endD} ${String(endH).padStart(2, '0')}:00,${s.duration},${s.waitTime}\n`;
    });
    
    // 导出优化方案
    data.optimized.forEach(s => {
        const etaD = Math.floor(s.etaHour / 24) + 1;
        const etaH = s.etaHour % 24;
        const startD = Math.floor(s.startHour / 24) + 1;
        const startH = s.startHour % 24;
        const endD = Math.floor(s.endHour / 24) + 1;
        const endH = s.endHour % 24;
        csv += `优化方案,${s.berth},${s.name},${s.cargoType},D${etaD} ${String(etaH).padStart(2, '0')}:00,D${startD} ${String(startH).padStart(2, '0')}:00,D${endD} ${String(endH).padStart(2, '0')}:00,${s.duration},${s.waitTime}\n`;
    });
    
    // 下载
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `港口船舶排班表_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('排班表已导出为CSV文件！');
};
