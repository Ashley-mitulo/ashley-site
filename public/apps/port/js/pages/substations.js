/**
 * 泊位管理页面 - 包含泊位列表和泊位智能调度功能
 */

let ganttChart = null;
let comparisonChart = null;
let currentTab = 'list';
let allShips = [];
let allBerths = [];
let schedulingResults = null;
let isOptimizing = false;

async function render_substations(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>🏭</span>
            <span>泊位管理</span>
        </div>
        
        <!-- Tab 导航 -->
        <div class="tab-nav" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
            <button class="tab-btn" id="tab-list" onclick="switchTab('list')" style="padding: 10px 20px; background: #1e3a5f; border: none; border-radius: 5px; color: #00d4ff; cursor: pointer; font-weight: 600;">
                📋 泊位列表
            </button>
            <button class="tab-btn" id="tab-scheduling" onclick="switchTab('scheduling')" style="padding: 10px 20px; background: #0a1628; border: none; border-radius: 5px; color: #7a8ca6; cursor: pointer;">
                🚢 泊位计划
            </button>
        </div>
        
        <!-- 泊位列表 Tab 内容 -->
        <div id="tab-content-list">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">泊位列表</div>
                    <button class="btn btn-primary" onclick="openAddSubstationModal()">
                        <span>+</span> 添加泊位
                    </button>
                </div>
                <div class="filter-bar">
                    <div class="filter-group">
                        <label>电压等级:</label>
                        <select id="filter-voltage" onchange="filterSubstations()">
                            <option value="">全部</option>
                            <option value="500kV">500kV</option>
                            <option value="220kV">220kV</option>
                            <option value="110kV">110kV</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>状态:</label>
                        <select id="filter-status" onchange="filterSubstations()">
                            <option value="">全部</option>
                            <option value="normal">正常</option>
                            <option value="warning">告警</option>
                            <option value="fault">故障</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>搜索:</label>
                        <input type="text" id="filter-search" placeholder="输入名称搜索..." onkeyup="filterSubstations()">
                    </div>
                </div>
                <div id="substations-table">
                    加载中...
                </div>
            </div>
        </div>
        
        <!-- 泊位计划 Tab 内容 -->
        <div id="tab-content-scheduling" style="display: none;">
            <div style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
                <!-- 左侧面板 -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- 船舶清单 -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">🚢 未来7天船舶到港清单</div>
                        </div>
                        <div class="filter-bar" style="flex-wrap: wrap;">
                            <div class="filter-group">
                                <label>货物类型:</label>
                                <select id="filter-cargo" onchange="filterShips()">
                                    <option value="">全部</option>
                                    <option value="container">集装箱</option>
                                    <option value="bulk">散货</option>
                                    <option value="liquid">液体化工</option>
                                    <option value="oil">成品油</option>
                                    <option value="lng">LNG</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>优先级:</label>
                                <select id="filter-priority" onchange="filterShips()">
                                    <option value="">全部</option>
                                    <option value="high">高</option>
                                    <option value="medium">中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>
                        </div>
                        <div id="ships-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 10px; background: #0a1628; border-radius: 5px; margin-bottom: 10px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #00d4ff;" id="stat-total">-</div>
                                <div style="font-size: 11px; color: #7a8ca6;">总船数</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #2ecc71;" id="stat-today">-</div>
                                <div style="font-size: 11px; color: #7a8ca6;">今日到港</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #f39c12;" id="stat-tomorrow">-</div>
                                <div style="font-size: 11px; color: #7a8ca6;">明日到港</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #e74c3c;" id="stat-pending">-</div>
                                <div style="font-size: 11px; color: #7a8ca6;">待分配</div>
                            </div>
                        </div>
                        <div id="ships-table" style="max-height: 300px; overflow-y: auto;">
                            加载中...
                        </div>
                    </div>
                    
                    <!-- 泊位资源面板 -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">⚓ 港口泊位资源</div>
                        </div>
                        <div id="berths-panel" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            加载中...
                        </div>
                    </div>
                </div>
                
                <!-- 右侧主面板 -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- 优化参数配置 -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">🧠 智能优化算法配置</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                            <!-- 优化目标 -->
                            <div>
                                <label style="font-weight: 600; color: #00d4ff; display: block; margin-bottom: 10px;">优化目标</label>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="radio" name="target" value="waitTime" checked>
                                        <span>⏱️ 最小化船舶等待时间</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="radio" name="target" value="utilization">
                                        <span>📊 最大化泊位利用率</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="radio" name="target" value="balance">
                                        <span>⚖️ 均衡负载分配</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="radio" name="target" value="cost">
                                        <span>💰 最小化综合作业成本</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- 算法参数 -->
                            <div>
                                <label style="font-weight: 600; color: #00d4ff; display: block; margin-bottom: 10px;">算法参数</label>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <div>
                                        <label style="font-size: 12px; color: #7a8ca6;">种群大小</label>
                                        <input type="number" id="param-population" value="50" min="10" max="200" style="width: 100%; padding: 8px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 4px; color: #e0e8f0;">
                                    </div>
                                    <div>
                                        <label style="font-size: 12px; color: #7a8ca6;">迭代次数</label>
                                        <input type="number" id="param-iterations" value="100" min="10" max="500" style="width: 100%; padding: 8px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 4px; color: #e0e8f0;">
                                    </div>
                                    <div>
                                        <label style="font-size: 12px; color: #7a8ca6;">交叉概率 (%)</label>
                                        <input type="number" id="param-crossover" value="80" min="50" max="95" style="width: 100%; padding: 8px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 4px; color: #e0e8f0;">
                                    </div>
                                    <div>
                                        <label style="font-size: 12px; color: #7a8ca6;">变异概率 (%)</label>
                                        <input type="number" id="param-mutation" value="15" min="5" max="50" style="width: 100%; padding: 8px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 4px; color: #e0e8f0;">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 约束开关 -->
                            <div>
                                <label style="font-weight: 600; color: #00d4ff; display: block; margin-bottom: 10px;">约束条件</label>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="constraint-cargo" checked>
                                        <span>🚫 严格匹配货物类型</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="constraint-window">
                                        <span>⏰ 考虑泊位作业时间窗口</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="constraint-priority" checked>
                                        <span>🎯 高优先级船舶优先</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="constraint-emergency">
                                        <span>🛟 预留应急泊位</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 操作按钮 -->
                        <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #1e3a5f;">
                            <button class="btn btn-primary" id="btn-optimize" onclick="runOptimization()" style="flex: 1;">
                                🚀 开始智能分配
                            </button>
                            <button class="btn btn-danger" onclick="resetScheduling()">
                                🔄 重置
                            </button>
                            <button class="btn btn-success" onclick="saveScheduling()">
                                💾 保存方案
                            </button>
                        </div>
                    </div>
                    
                    <!-- 算法原理说明（可折叠） -->
                    <div class="card">
                        <div class="card-header" onclick="toggleAlgorithmInfo()" style="cursor: pointer;">
                            <div class="card-title">📖 算法原理说明</div>
                            <span id="alg-info-toggle">▼</span>
                        </div>
                        <div id="algorithm-info" style="display: none; padding-top: 15px; font-size: 13px; line-height: 1.8;">
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #00d4ff;">调度问题说明：</strong>
                                <p>船舶泊位调度是典型的"资源约束作业车间调度问题"。在满足泊位能力、时间窗口、货物匹配等约束下，为每艘船分配最优的作业泊位和时间。</p>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #00d4ff;">遗传算法调度流程：</strong>
                                <ol style="padding-left: 20px; margin: 10px 0;">
                                    <li><strong>编码：</strong>每条染色体 = 100艘船的泊位分配序列</li>
                                    <li><strong>初始化：</strong>随机生成多个可行分配方案</li>
                                    <li><strong>适应度评估：</strong>根据选择的优化目标计算</li>
                                    <li><strong>选择：</strong>轮盘赌保留优良方案</li>
                                    <li><strong>交叉：</strong>两点交叉产生新方案</li>
                                    <li><strong>变异：</strong>随机调整某艘船的泊位</li>
                                    <li><strong>修复：</strong>确保约束满足（货物匹配等）</li>
                                </ol>
                            </div>
                            <div>
                                <strong style="color: #00d4ff;">目标函数详解：</strong>
                                <ul style="padding-left: 20px; margin: 10px 0;">
                                    <li><strong>等待时间：</strong>Σ(开始作业时间 - 到港时间)</li>
                                    <li><strong>泊位利用率：</strong>Σ(作业时长) / (泊位数量 × 7天 × 24h)</li>
                                    <li><strong>负载均衡：</strong>各泊位作业时长的标准差</li>
                                    <li><strong>综合成本：</strong>加权求和各项指标</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 执行结果可视化 -->
            <div class="card" id="results-card" style="margin-top: 20px; display: none;">
                <div class="card-header">
                    <div class="card-title">📊 调度结果可视化</div>
                </div>
                
                <!-- 结果统计面板 -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="padding: 15px; background: linear-gradient(135deg, #0a1628, #1e3a5f); border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #3498db;" id="res-total-wait">-</div>
                        <div style="font-size: 12px; color: #7a8ca6;">总等待时间 (小时)</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #0a1628, #1e3a5f); border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #2ecc71;" id="res-avg-wait">-</div>
                        <div style="font-size: 12px; color: #7a8ca6;">平均等待时间 (小时/船)</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #0a1628, #1e3a5f); border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #f39c12;" id="res-utilization">-</div>
                        <div style="font-size: 12px; color: #7a8ca6;">泊位平均利用率 (%)</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #0a1628, #1e3a5f); border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #9b59b6;" id="res-balance">-</div>
                        <div style="font-size: 12px; color: #7a8ca6;">负载均衡度</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #0a1628, #1e3a5f); border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #e74c3c;" id="res-delayed">-</div>
                        <div style="font-size: 12px; color: #7a8ca6;">延期作业船舶 (艘)</div>
                    </div>
                </div>
                
                <!-- 甘特图 -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="color: #00d4ff; margin: 0;">泊位作业甘特图</h4>
                        <div style="display: flex; gap: 10px;">
                            <select id="gantt-view" onchange="updateGanttView()" style="padding: 5px 10px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 4px; color: #e0e8f0;">
                                <option value="optimized">优化方案</option>
                                <option value="baseline">人工方案</option>
                            </select>
                        </div>
                    </div>
                    <div id="gantt-chart" style="width: 100%; height: 400px; background: #0a1628; border-radius: 8px;"></div>
                </div>
                
                <!-- 泊位详情表格 -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #00d4ff; margin: 0 0 10px 0;">泊位作业详情</h4>
                    <div id="berth-details-table"></div>
                </div>
                
                <!-- 优化前后对比 -->
                <div>
                    <h4 style="color: #00d4ff; margin: 0 0 10px 0;">优化前后对比</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- 对比表格 -->
                        <div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>指标</th>
                                        <th>人工分配</th>
                                        <th>智能优化</th>
                                        <th>优化幅度</th>
                                    </tr>
                                </thead>
                                <tbody id="comparison-table">
                                </tbody>
                            </table>
                        </div>
                        <!-- 对比柱状图 -->
                        <div id="comparison-chart" style="width: 100%; height: 300px; background: #0a1628; border-radius: 8px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 初始化泊位列表
    await loadSubstations();
    
    // 初始化调度数据
    await initSchedulingData();
}

// ========== Tab 切换 ==========
function switchTab(tab) {
    currentTab = tab;
    
    // 更新按钮样式
    document.getElementById('tab-list').style.background = tab === 'list' ? '#1e3a5f' : '#0a1628';
    document.getElementById('tab-list').style.color = tab === 'list' ? '#00d4ff' : '#7a8ca6';
    document.getElementById('tab-scheduling').style.background = tab === 'scheduling' ? '#1e3a5f' : '#0a1628';
    document.getElementById('tab-scheduling').style.color = tab === 'scheduling' ? '#00d4ff' : '#7a8ca6';
    
    // 切换内容
    document.getElementById('tab-content-list').style.display = tab === 'list' ? 'block' : 'none';
    document.getElementById('tab-content-scheduling').style.display = tab === 'scheduling' ? 'block' : 'none';
    
    // 如果切换到调度tab且有结果，重新渲染图表
    if (tab === 'scheduling' && schedulingResults) {
        setTimeout(() => {
            renderGanttChart();
            renderComparisonChart();
        }, 100);
    }
}

// ========== 算法说明折叠 ==========
function toggleAlgorithmInfo() {
    const info = document.getElementById('algorithm-info');
    const toggle = document.getElementById('alg-info-toggle');
    if (info.style.display === 'none') {
        info.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        info.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// ========== 调度数据初始化 ==========
async function initSchedulingData() {
    try {
        const result = await API.fetch('/api/scheduling/init?count=100');
        if (result.success) {
            allShips = result.data.ships;
            allBerths = result.data.berths;
            
            renderShipsTable(allShips);
            renderShipsStats(allShips);
            renderBerthsPanel();
        }
    } catch (error) {
        console.error('初始化调度数据失败:', error);
    }
}

// ========== 船舶列表渲染 ==========
function renderShipsStats(ships) {
    document.getElementById('stat-total').textContent = ships.length;
    document.getElementById('stat-today').textContent = ships.filter(s => s.etaHours < 24).length;
    document.getElementById('stat-tomorrow').textContent = ships.filter(s => s.etaHours >= 24 && s.etaHours < 48).length;
    document.getElementById('stat-pending').textContent = ships.length;
}

function renderShipsTable(ships) {
    const container = document.getElementById('ships-table');
    
    const cargoLabels = {
        container: '集装箱',
        bulk: '散货',
        liquid: '液体化工',
        oil: '成品油',
        lng: 'LNG'
    };
    
    const priorityColors = {
        high: '#e74c3c',
        medium: '#f39c12',
        low: '#2ecc71'
    };
    
    container.innerHTML = `
        <table class="data-table" style="font-size: 12px;">
            <thead>
                <tr>
                    <th>船名</th>
                    <th>货物</th>
                    <th>到港(h)</th>
                    <th>时长(h)</th>
                    <th>优先级</th>
                </tr>
            </thead>
            <tbody>
                ${ships.slice(0, 20).map(s => `
                    <tr>
                        <td><strong>${s.name}</strong></td>
                        <td>${cargoLabels[s.type]}</td>
                        <td>${s.etaHours}</td>
                        <td>${s.duration}</td>
                        <td><span style="color: ${priorityColors[s.priority]};">${s.priority === 'high' ? '高' : s.priority === 'medium' ? '中' : '低'}</span></td>
                    </tr>
                `).join('')}
                ${ships.length > 20 ? `<tr><td colspan="5" style="text-align: center; color: #7a8ca6;">... 还有 ${ships.length - 20} 艘船舶</td></tr>` : ''}
            </tbody>
        </table>
    `;
}

function filterShips() {
    const cargo = document.getElementById('filter-cargo').value;
    const priority = document.getElementById('filter-priority').value;
    
    let filtered = [...allShips];
    
    if (cargo) filtered = filtered.filter(s => s.type === cargo);
    if (priority) filtered = filtered.filter(s => s.priority === priority);
    
    renderShipsTable(filtered);
}

// ========== 泊位资源面板渲染 ==========
function renderBerthsPanel() {
    const container = document.getElementById('berths-panel');
    
    const berthColors = {
        container: '#3498db',
        bulk: '#e67e22',
        liquid: '#9b59b6',
        oil: '#1abc9c',
        lng: '#e74c3c'
    };
    
    container.innerHTML = allBerths.map(b => `
        <div style="padding: 10px; background: #0a1628; border-radius: 6px; border-left: 3px solid ${berthColors[b.allowedTypes[0]] || '#95a5a6'};">
            <div style="font-weight: 600; font-size: 13px;">${b.id}</div>
            <div style="font-size: 11px; color: #7a8ca6; margin-top: 4px;">${b.name}</div>
            <div style="font-size: 10px; color: #95a5a6; margin-top: 2px;">日处理: ${b.capacity}吨</div>
        </div>
    `).join('');
}

// ========== 执行优化 ==========
async function runOptimization() {
    if (isOptimizing) return;
    
    isOptimizing = true;
    const btn = document.getElementById('btn-optimize');
    btn.textContent = '⏳ 优化计算中...';
    btn.disabled = true;
    
    try {
        // 获取优化目标
        const target = document.querySelector('input[name="target"]:checked').value;
        
        // 获取算法参数
        const params = {
            target: target,
            populationSize: parseInt(document.getElementById('param-population').value),
            maxIterations: parseInt(document.getElementById('param-iterations').value),
            crossoverRate: parseInt(document.getElementById('param-crossover').value) / 100,
            mutationRate: parseInt(document.getElementById('param-mutation').value) / 100,
            constraints: {
                strictCargoMatch: document.getElementById('constraint-cargo').checked,
                respectWorkWindow: document.getElementById('constraint-window').checked,
                priorityFirst: document.getElementById('constraint-priority').checked,
                reserveEmergency: document.getElementById('constraint-emergency').checked
            }
        };
        
        const result = await API.fetch('/api/scheduling/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        if (result.success) {
            schedulingResults = result.data;
            
            // 显示结果面板
            document.getElementById('results-card').style.display = 'block';
            
            // 渲染统计数据
            renderResultStatistics();
            
            // 渲染对比表格
            renderComparisonTable();
            
            // 渲染甘特图
            setTimeout(renderGanttChart, 100);
            
            // 渲染对比图表
            setTimeout(renderComparisonChart, 200);
            
            // 渲染泊位详情
            await renderBerthDetails();
        }
    } catch (error) {
        console.error('优化失败:', error);
        alert('优化计算失败: ' + error.message);
    } finally {
        isOptimizing = false;
        btn.textContent = '🚀 开始智能分配';
        btn.disabled = false;
    }
}

// ========== 渲染结果统计 ==========
function renderResultStatistics() {
    const stats = schedulingResults.optimized.statistics;
    
    document.getElementById('res-total-wait').textContent = stats.totalWaitTime;
    document.getElementById('res-avg-wait').textContent = stats.avgWaitTime.toFixed(1);
    document.getElementById('res-utilization').textContent = (stats.avgUtilization * 100).toFixed(1);
    document.getElementById('res-balance').textContent = stats.loadBalance.toFixed(1);
    document.getElementById('res-delayed').textContent = stats.delayedShips;
}

// ========== 渲染对比表格 ==========
function renderComparisonTable() {
    const baseline = schedulingResults.baseline.statistics;
    const optimized = schedulingResults.optimized.statistics;
    const comparison = schedulingResults.comparison;
    
    const formatImprovement = (value, isBetterDown) => {
        const isGood = isBetterDown ? value > 0 : value < 0;
        const color = isGood ? '#2ecc71' : '#e74c3c';
        const arrow = isBetterDown ? (value >= 0 ? '↓' : '↑') : (value <= 0 ? '↑' : '↓');
        return `<span style="color: ${color}; font-weight: 600;">${arrow} ${Math.abs(value).toFixed(1)}%</span>`;
    };
    
    document.getElementById('comparison-table').innerHTML = `
        <tr>
            <td><strong>总等待时间</strong></td>
            <td>${baseline.totalWaitTime}h</td>
            <td>${optimized.totalWaitTime}h</td>
            <td>${formatImprovement(comparison.waitTimeImprovement, true)}</td>
        </tr>
        <tr
            <td><strong>平均泊位利用率</strong></td>
            <td>${(baseline.avgUtilization * 100).toFixed(1)}%</td>
            <td>${(optimized.avgUtilization * 100).toFixed(1)}%</td>
            <td>${formatImprovement(comparison.utilizationImprovement, false)}</td>
        </tr>
        <tr>
            <td><strong>负载均衡度</strong></td>
            <td>${baseline.loadBalance.toFixed(1)}</td>
            <td>${optimized.loadBalance.toFixed(1)}</td>
            <td>${formatImprovement(comparison.balanceImprovement, true)}</td>
        </tr>
        <tr>
            <td><strong>延期作业船舶</strong></td>
            <td>${baseline.delayedShips}艘</td>
            <td>${optimized.delayedShips}艘</td>
            <td><span style="color: ${comparison.delayedReduction >= 0 ? '#2ecc71' : '#e74c3c'}; font-weight: 600;">${comparison.delayedReduction >= 0 ? '↓' : '↑'} ${Math.abs(comparison.delayedReduction)}艘</span></td>
        </tr>
    `;
}

// ========== 渲染甘特图 ==========
async function renderGanttChart() {
    try {
        const viewType = document.getElementById('gantt-view').value;
        const result = await API.fetch(`/api/scheduling/gantt?type=${viewType}`);
        
        if (!result.success) {
            console.error('获取甘特图数据失败');
            return;
        }
        
        const tasks = result.data.tasks;
        const berthNames = allBerths.map(b => b.name);
        
        // 准备ECharts数据
        const seriesData = tasks.map(task => ({
            name: task.shipName,
            value: [
                task.berthIndex,
                task.startTime,
                task.endTime,
                task.duration
            ],
            itemStyle: {
                color: task.color
            },
            tooltip: {
                formatter: () => `
                    <div style="padding: 5px;">
                        <div><strong>${task.shipName}</strong></div>
                        <div>泊位: ${task.berthName}</div>
                        <div>货物: ${task.cargoType}</div>
                        <div>到港: ${task.etaHours}h</div>
                        <div>开始: ${task.startTime}h</div>
                        <div>结束: ${task.endTime}h</div>
                        <div>作业时长: ${task.duration}h</div>
                        <div>等待时间: ${task.waitTime}h</div>
                    </div>
                `
            }
        }));
        
        // 初始化ECharts
        const chartDom = document.getElementById('gantt-chart');
        if (!chartDom) return;
        
        if (ganttChart) {
            ganttChart.dispose();
        }
        
        ganttChart = echarts.init(chartDom, 'dark');
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: 180,
                right: 30,
                top: 30,
                bottom: 50
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: 168,
                name: '时间 (小时)',
                nameLocation: 'middle',
                nameGap: 30,
                axisLabel: {
                    formatter: '{value}h'
                },
                splitLine: {
                    lineStyle: {
                        color: '#1e3a5f'
                    }
                }
            },
            yAxis: {
                type: 'category',
                data: berthNames,
                axisLabel: {
                    fontSize: 11
                },
                splitLine: {
                    show: false
                }
            },
            series: [{
                type: 'custom',
                renderItem: function (params, api) {
                    const categoryIndex = api.value(0);
                    const start = api.coord([api.value(1), categoryIndex]);
                    const end = api.coord([api.value(2), categoryIndex]);
                    const height = api.size([0, 1])[1] * 0.6;
                    
                    return {
                        type: 'rect',
                        shape: {
                            x: start[0],
                            y: start[1] - height / 2,
                            width: end[0] - start[0],
                            height: height
                        },
                        style: api.style(),
                        styleEmphasis: api.style({
                            stroke: '#00d4ff',
                            lineWidth: 2
                        })
                    };
                },
                dimensions: ['泊位', '开始', '结束', '时长'],
                encode: {
                    x: [1, 2],
                    y: 0
                },
                data: seriesData
            }]
        };
        
        ganttChart.setOption(option);
        
        // 响应式
        window.addEventListener('resize', () => {
            ganttChart && ganttChart.resize();
        });
        
    } catch (error) {
        console.error('渲染甘特图失败:', error);
    }
}

function updateGanttView() {
    renderGanttChart();
}

// ========== 渲染对比图表 ==========
function renderComparisonChart() {
    const baseline = schedulingResults.baseline.statistics;
    const optimized = schedulingResults.optimized.statistics;
    
    const chartDom = document.getElementById('comparison-chart');
    if (!chartDom) return;
    
    if (comparisonChart) {
        comparisonChart.dispose();
    }
    
    comparisonChart = echarts.init(chartDom, 'dark');
    
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['人工分配', '智能优化'],
            textStyle: {
                color: '#7a8ca6'
            }
        },
        grid: {
            left: 60,
            right: 30,
            top: 40,
            bottom: 60
        },
        xAxis: {
            type: 'category',
            data: ['总等待(h)', '利用率(%)', '均衡度', '延期(艘)'],
            axisLabel: {
                color: '#7a8ca6'
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#7a8ca6'
            },
            splitLine: {
                lineStyle: {
                    color: '#1e3a5f'
                }
            }
        },
        series: [
            {
                name: '人工分配',
                type: 'bar',
                data: [
                    baseline.totalWaitTime,
                    (baseline.avgUtilization * 100).toFixed(1),
                    baseline.loadBalance.toFixed(1),
                    baseline.delayedShips
                ],
                itemStyle: {
                    color: '#e74c3c'
                }
            },
            {
                name: '智能优化',
                type: 'bar',
                data: [
                    optimized.totalWaitTime,
                    (optimized.avgUtilization * 100).toFixed(1),
                    optimized.loadBalance.toFixed(1),
                    optimized.delayedShips
                ],
                itemStyle: {
                    color: '#2ecc71'
                }
            }
        ]
    };
    
    comparisonChart.setOption(option);
    
    window.addEventListener('resize', () => {
        comparisonChart && comparisonChart.resize();
    });
}

// ========== 渲染泊位详情 ==========
async function renderBerthDetails() {
    try {
        const result = await API.fetch('/api/scheduling/berth-details?type=optimized');
        
        if (!result.success) return;
        
        const berths = result.data.berths;
        
        document.getElementById('berth-details-table').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>泊位</th>
                        <th>作业船舶数</th>
                        <th>总作业时长(h)</th>
                        <th>空闲时长(h)</th>
                        <th>利用率(%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${berths.map(b => `
                        <tr>
                            <td><strong>${b.berthName}</strong></td>
                            <td>${b.shipCount}</td>
                            <td>${b.totalHours}</td>
                            <td>${b.idleHours}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 80px; height: 8px; background: #1e3a5f; border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${(b.utilization * 100).toFixed(0)}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #2ecc71);"></div>
                                    </div>
                                    <span>${(b.utilization * 100).toFixed(1)}%</span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('渲染泊位详情失败:', error);
    }
}

// ========== 重置调度 ==========
async function resetScheduling() {
    if (!confirm('确定要重置调度数据吗？')) return;
    
    try {
        await API.fetch('/api/scheduling/reset', { method: 'POST' });
        schedulingResults = null;
        document.getElementById('results-card').style.display = 'none';
        await initSchedulingData();
    } catch (error) {
        console.error('重置失败:', error);
    }
}

// ========== 保存方案 ==========
function saveScheduling() {
    if (!schedulingResults) {
        alert('没有可保存的调度方案');
        return;
    }
    
    const dataStr = JSON.stringify(schedulingResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `berth-scheduling-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// ========== 原有泊位列表功能 (保持兼容) ==========
let allSubstations = [];

async function loadSubstations() {
    const result = await API.grid.substations();
    if (result.success) {
        allSubstations = result.data;
        renderSubstationsTable(allSubstations);
    }
}

function renderSubstationsTable(data) {
    const tableContainer = document.getElementById('substations-table');
    
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
                    <th>电压等级</th>
                    <th>容量 (MW)</th>
                    <th>位置</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(s => `
                    <tr>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.code}</td>
                        <td>${s.voltage_level}</td>
                        <td>${s.capacity}</td>
                        <td>${s.city}</td>
                        <td><span class="status-tag ${s.status}">${s.status === 'normal' ? '正常' : s.status}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editSubstation(${s.id})">编辑</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSubstation(${s.id})">删除</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 15px; color: #7a8ca6; font-size: 13px;">共 ${data.length} 条记录</p>
    `;
}

function filterSubstations() {
    const voltage = document.getElementById('filter-voltage').value;
    const status = document.getElementById('filter-status').value;
    const search = document.getElementById('filter-search').value.toLowerCase();
    
    let filtered = allSubstations;
    
    if (voltage) {
        filtered = filtered.filter(s => s.voltage_level === voltage);
    }
    if (status) {
        filtered = filtered.filter(s => s.status === status);
    }
    if (search) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(search) || 
            s.code.toLowerCase().includes(search)
        );
    }
    
    renderSubstationsTable(filtered);
}

function openAddSubstationModal() {
    const formHtml = `
        <form onsubmit="submitAddSubstation(event)">
            <div class="form-group">
                <label>泊位名称 *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>编号 *</label>
                <input type="text" name="code" required>
            </div>
            <div class="form-group">
                <label>电压等级</label>
                <select name="voltage_level">
                    <option value="500kV">500kV</option>
                    <option value="220kV">220kV</option>
                    <option value="110kV">110kV</option>
                </select>
            </div>
            <div class="form-group">
                <label>容量 (MW)</label>
                <input type="number" name="capacity" value="1000">
            </div>
            <div class="form-group">
                <label>省份</label>
                <input type="text" name="province" value="江苏">
            </div>
            <div class="form-group">
                <label>城市</label>
                <input type="text" name="city" value="南京">
            </div>
            <div class="form-group">
                <label>纬度</label>
                <input type="number" step="0.01" name="latitude" value="32.06">
            </div>
            <div class="form-group">
                <label>经度</label>
                <input type="number" step="0.01" name="longitude" value="118.79">
            </div>
            <div class="form-group">
                <label>建设年份</label>
                <input type="number" name="build_year" value="2020">
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `;
    
    openModal('添加泊位', formHtml);
}

async function submitAddSubstation(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        code: form.code.value,
        voltage_level: form.voltage_level.value,
        capacity: parseFloat(form.capacity.value),
        province: form.province.value,
        city: form.city.value,
        latitude: parseFloat(form.latitude.value),
        longitude: parseFloat(form.longitude.value),
        build_year: parseInt(form.build_year.value),
        description: form.description.value
    };
    
    const result = await API.grid.addSubstation(data);
    if (result.success) {
        closeModal();
        loadSubstations();
    } else {
        alert('添加失败: ' + result.error);
    }
}

async function editSubstation(id) {
    const result = await API.grid.getSubstation(id);
    if (!result.success) {
        alert('获取数据失败');
        return;
    }
    
    const s = result.data;
    const formHtml = `
        <form onsubmit="submitEditSubstation(event, ${id})">
            <div class="form-group">
                <label>泊位名称 *</label>
                <input type="text" name="name" value="${s.name}" required>
            </div>
            <div class="form-group">
                <label>编号 *</label>
                <input type="text" name="code" value="${s.code}" required>
            </div>
            <div class="form-group">
                <label>电压等级</label>
                <select name="voltage_level">
                    <option value="500kV" ${s.voltage_level === '500kV' ? 'selected' : ''}>500kV</option>
                    <option value="220kV" ${s.voltage_level === '220kV' ? 'selected' : ''}>220kV</option>
                    <option value="110kV" ${s.voltage_level === '110kV' ? 'selected' : ''}>110kV</option>
                </select>
            </div>
            <div class="form-group">
                <label>容量 (MW)</label>
                <input type="number" name="capacity" value="${s.capacity}">
            </div>
            <div class="form-group">
                <label>状态</label>
                <select name="status">
                    <option value="normal" ${s.status === 'normal' ? 'selected' : ''}>正常</option>
                    <option value="warning" ${s.status === 'warning' ? 'selected' : ''}>告警</option>
                    <option value="fault" ${s.status === 'fault' ? 'selected' : ''}>故障</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-danger" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `;
    
    openModal('编辑泊位', formHtml);
}

async function submitEditSubstation(e, id) {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        code: form.code.value,
        voltage_level: form.voltage_level.value,
        capacity: parseFloat(form.capacity.value),
        status: form.status.value
    };
    
    const result = await API.grid.updateSubstation(id, data);
    if (result.success) {
        closeModal();
        loadSubstations();
    } else {
        alert('更新失败: ' + result.error);
    }
}

async function deleteSubstation(id) {
    if (!confirm('确定要删除这个泊位吗？')) {
        return;
    }
    
    const result = await API.grid.deleteSubstation(id);
    if (result.success) {
        loadSubstations();
    } else {
        alert('删除失败: ' + result.error);
    }
}
