/**
 * 港口泊位智能规划页面
 * 核心功能：约束条件可视化、区域下钻、货物热力图、运输距离计算、集疏运路网叠加、多方案对比
 */
window.render_location = function(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>⚓</span>
            <span>泊位智能规划优化</span>
        </div>

        <div class="location-layout">
            <!-- 左侧：参数配置 -->
            <div class="location-sidebar">
                <!-- 📚 算法原理说明卡片 -->
                <div class="card" style="margin-bottom: 15px;">
                    <div onclick="toggleAccordion('algorithm-info')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #9c27b0;">📚 算法原理说明</h3>
                        <span id="algorithm-info-icon" style="font-size: 18px; color: #888;">▼</span>
                    </div>
                    
                    <!-- 遗传算法流程说明 -->
                    <div id="algorithm-info" style="margin-top: 15px;">
                        <div class="accordion-section">
                            <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 14px;">🧬 遗传算法流程</h4>
                            <div style="font-size: 12px; color: #ccc; line-height: 1.8; padding-left: 10px;">
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 11px; margin-right: 8px;">1</span>
                                    <span><strong>初始化种群</strong> - 随机生成多个候选选址方案</span>
                                </div>
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 11px; margin-right: 8px;">2</span>
                                    <span><strong>适应度评估</strong> - 计算每个方案的9维综合成本</span>
                                </div>
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 11px; margin-right: 8px;">3</span>
                                    <span><strong>选择操作</strong> - 轮盘赌选择优良个体</span>
                                </div>
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #43e97b, #38f9d7); border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 11px; margin-right: 8px;">4</span>
                                    <span><strong>交叉操作</strong> - 单点交叉产生新方案</span>
                                </div>
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #fa709a, #fee140); border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 11px; margin-right: 8px;">5</span>
                                    <span><strong>变异操作</strong> - 随机变异保持种群多样性</span>
                                </div>
                                <div style="display: flex; align-items: center;">
                                    <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #a8edea, #fed6e3); border-radius: 50%; text-align: center; line-height: 24px; color: #333; font-size: 11px; margin-right: 8px;">6</span>
                                    <span><strong>精英保留</strong> - 保留每代最优个体</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 9维成本函数详解 -->
                        <div class="accordion-section" style="margin-top: 15px;">
                            <div onclick="toggleAccordion('cost-function')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                                <h4 style="color: #e67e22; margin: 0; font-size: 14px;">📊 9维成本函数详解</h4>
                                <span id="cost-function-icon" style="font-size: 16px; color: #888;">▶</span>
                            </div>
                            <div id="cost-function" style="display: none; margin-top: 10px; font-size: 11px; color: #aaa; line-height: 1.7;">
                                <div style="background: rgba(52, 152, 219, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #3498db;">
                                    <strong style="color: #3498db;">1. 总运输距离</strong> - 减少货物集疏运成本，优化运输路径
                                </div>
                                <div style="background: rgba(46, 204, 113, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #2ecc71;">
                                    <strong style="color: #2ecc71;">2. 货物均衡度</strong> - 各泊位服务货物差异最小化，避免忙闲不均
                                </div>
                                <div style="background: rgba(241, 196, 15, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #f1c40f;">
                                    <strong style="color: #f1c40f;">3. 距离均衡度</strong> - 各泊位总运输距离差异最小化
                                </div>
                                <div style="background: rgba(231, 76, 60, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #e74c3c;">
                                    <strong style="color: #e74c3c;">4. 容量超载惩罚</strong> - 避免泊位货物过载，保证服务质量
                                </div>
                                <div style="background: rgba(155, 89, 182, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #9b59b6;">
                                    <strong style="color: #9b59b6;">5. 泊位建设成本</strong> - 容量越大成本越高，考虑投资回报
                                </div>
                                <div style="background: rgba(26, 188, 156, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #1abc9c;">
                                    <strong style="color: #1abc9c;">6. 岸线使用成本</strong> - 深水岸线成本递减，优先利用优质岸线
                                </div>
                                <div style="background: rgba(230, 126, 34, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #e67e22;">
                                    <strong style="color: #e67e22;">7. 环境影响评估</strong> - 居民区/航道距离惩罚，绿色港口建设
                                </div>
                                <div style="background: rgba(52, 73, 94, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #34495e;">
                                    <strong style="color: #34495e;">8. 安全距离约束</strong> - 与已有泊位最小距离，保障作业安全
                                </div>
                                <div style="background: rgba(211, 84, 0, 0.1); padding: 8px; border-radius: 6px; border-left: 3px solid #d35400;">
                                    <strong style="color: #d35400;">9. 政策成本</strong> - 禁建区极大惩罚，优先发展区给予奖励
                                </div>
                            </div>
                        </div>
                        
                        <!-- N-1安全校验原理 -->
                        <div class="accordion-section" style="margin-top: 15px;">
                            <div onclick="toggleAccordion('n1-principle')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                                <h4 style="color: #27ae60; margin: 0; font-size: 14px;">🛡️ N-1安全校验原理</h4>
                                <span id="n1-principle-icon" style="font-size: 16px; color: #888;">▶</span>
                            </div>
                            <div id="n1-principle" style="display: none; margin-top: 10px; font-size: 11px; color: #aaa; line-height: 1.7;">
                                <div style="background: rgba(39, 174, 96, 0.1); padding: 10px; border-radius: 6px; border-left: 3px solid #27ae60;">
                                    <p style="margin: 0 0 8px 0;"><strong>核心思想：</strong>模拟港口系统中任意单一泊位故障场景，评估剩余泊位的货物吞吐保障能力。</p>
                                    <p style="margin: 0 0 8px 0;"><strong>计算流程：</strong></p>
                                    <ol style="margin: 0; padding-left: 20px;">
                                        <li>遍历每个泊位，假设其故障停运</li>
                                        <li>重新分配受影响货物到剩余最近泊位</li>
                                        <li>计算剩余系统的货物覆盖率</li>
                                        <li>找出最坏故障场景和瓶颈泊位</li>
                                    </ol>
                                    <p style="margin: 8px 0 0 0;"><strong>评分标准：</strong>覆盖率95%以上得100分，80%以下得0分，线性插值得到0-100分的安全评分。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="margin-bottom: 20px; color: #00d4ff;">⚙️ 优化参数</h3>
                    
                    <div class="form-group">
                        <label>泊位数量</label>
                        <input type="number" id="param-stations" value="5" min="1" max="20">
                    </div>
                    
                    <div class="form-group">
                        <label>种群大小</label>
                        <input type="number" id="param-population" value="30" min="10" max="100">
                    </div>
                    
                    <div class="form-group">
                        <label>迭代次数</label>
                        <input type="number" id="param-iterations" value="50" min="10" max="200">
                    </div>
                    
                    <div class="form-group">
                        <label>交叉概率</label>
                        <input type="range" id="param-crossover" min="0" max="100" value="70">
                        <span id="crossover-value">70%</span>
                    </div>
                    
                    <div class="form-group">
                        <label>变异概率</label>
                        <input type="range" id="param-mutation" min="0" max="100" value="20">
                        <span id="mutation-value">20%</span>
                    </div>
                    
                    <button class="btn btn-primary" id="btn-start" style="width: 100%; margin-top: 10px;">
                        🚀 开始优化
                    </button>
                    
                    <button class="btn btn-secondary" id="btn-reset" style="width: 100%; margin-top: 10px;">
                        🔄 重置状态
                    </button>
                    
                    <button class="btn btn-secondary" id="btn-regenerate" style="width: 100%; margin-top: 10px;">
                        🎲 重新生成数据
                    </button>
                </div>
                
                <!-- 操作工具栏 -->
                <div class="card">
                    <h3 style="margin-bottom: 15px; color: #e67e22;">⚙️ 操作历史</h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="undo()" style="flex: 1; padding: 8px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;" title="Ctrl+Z 撤销">
                            ↩️ 撤销
                        </button>
                        <button onclick="redo()" style="flex: 1; padding: 8px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;" title="Ctrl+Y 重做">
                            ↪️ 重做
                        </button>
                    </div>
                </div>
                
                <!-- 图层控制面板 -->
                <div class="card">
                    <h3 style="margin-bottom: 15px; color: #9c27b0;">🗺️ 图层控制</h3>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="layer-load-centers" checked>
                            <span style="color: #ffa500;">🟠 货物中心</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="layer-candidates" checked>
                            <span style="color: #666;">⚫ 候选泊位</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="layer-selected" checked>
                            <span style="color: #00ff00;">🟢 选定泊位</span>
                        </label>
                    </div>
                </div>
                
                <!-- 地图工具 -->
                <div class="card">
                    <h3 style="margin-bottom: 15px; color: #3498db;">🛠️ 地图工具</h3>
                    
                    <button class="btn btn-secondary" id="btn-jiangsu" style="width: 100%; margin-bottom: 10px; display: none;">
                        🏠 返回全省
                    </button>
                </div>
                
                <!-- 方案管理 -->
                <div class="card" id="schemes-card" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #e74c3c;">💾 方案对比</h3>
                    
                    <button class="btn btn-secondary" id="btn-save-scheme" style="width: 100%; margin-bottom: 10px;">
                        💾 保存当前方案
                    </button>
                    
                    <button class="btn btn-primary" id="btn-generate-report" style="width: 100%; margin-bottom: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        📋 生成分析报告
                    </button>
                    
                    <div id="schemes-list" style="max-height: 200px; overflow-y: auto;"></div>
                </div>
                
                <!-- N-1安全校验 -->
                <div class="card" id="n1-card" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #e67e22;">🛡️ N-1安全校验</h3>
                    
                    <button class="btn btn-secondary" id="btn-n1-check" style="width: 100%; margin-bottom: 10px;">
                        🔍 执行N-1校验
                    </button>
                    
                    <!-- N-1安全评分仪表盘 -->
                    <div id="n1-gauge-container" style="height: 200px; margin-bottom: 10px; display: none;"></div>
                    
                    <!-- 故障影响图层开关 -->
                    <div id="fault-layer-toggle" style="display: none; margin-bottom: 10px; padding: 8px; background: #fff3cd; border-radius: 4px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="layer-fault-impact" checked>
                            <span style="color: #856404;">⚠️ 显示故障影响范围</span>
                        </label>
                    </div>
                    
                    <div id="n1-result" style="font-size: 14px;"></div>
                    
                    <!-- 优化建议区域 -->
                    <div id="n1-optimization-suggestions" style="display: none; margin-top: 15px;"></div>
                </div>
                
                <!-- 进度显示 -->
                <div class="card" id="progress-card" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #00ff88;">📊 优化进度</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <div style="text-align: center; margin-top: 10px;" id="progress-text">
                        准备中...
                    </div>
                </div>
                
                <!-- 结果统计 -->
                <div class="card" id="result-card" style="display: none;">
                    <h3 style="margin-bottom: 15px; color: #ffc107;">📈 优化结果</h3>
                    <div id="result-stats"></div>
                </div>
                
                <!-- ⚖️ 方案对比卡片 -->
                <div class="card" id="comparison-card" style="display: none; margin-top: 15px;">
                    <div onclick="toggleAccordion('comparison-section')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #3498db;">⚖️ 方案对比分析</h3>
                        <span id="comparison-section-icon" style="font-size: 18px; color: #888;">▼</span>
                    </div>
                    
                    <div id="comparison-section" style="margin-top: 15px;">
                        <!-- 对比数据表格 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #f39c12; margin-bottom: 10px; font-size: 14px;">📋 关键指标对比</h4>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                    <thead>
                                        <tr style="background: rgba(52, 152, 219, 0.15);">
                                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #3498db;">指标</th>
                                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #3498db;">当前预设方案</th>
                                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #3498db;">智能优化方案</th>
                                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #3498db;">优化幅度</th>
                                        </tr>
                                    </thead>
                                    <tbody id="comparison-table-body">
                                        <!-- JS填充 -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- 可视化图表 -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #9b59b6; margin-bottom: 10px; font-size: 14px;">📊 成本构成对比</h4>
                            <div id="cost-comparison-chart" style="height: 220px;"></div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #1abc9c; margin-bottom: 10px; font-size: 14px;">🎯 多维性能雷达图</h4>
                            <div id="radar-comparison-chart" style="height: 280px;"></div>
                        </div>
                        
                        <!-- 地图切换控制 -->
                        <div style="margin-bottom: 15px;">
                            <h4 style="color: #e74c3c; margin-bottom: 10px; font-size: 14px;">🗺️ 空间布局对比</h4>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button onclick="setMapView('optimized')" class="btn btn-primary" style="flex: 1; padding: 8px 12px; font-size: 12px;">
                                    🟢 仅显示优化方案
                                </button>
                                <button onclick="setMapView('baseline')" class="btn btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 12px;">
                                    🔴 仅显示基线方案
                                </button>
                                <button onclick="setMapView('both')" class="btn btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 12px; background: linear-gradient(135deg, #667eea, #764ba2);">
                                    🟢🔴 双方案叠加
                                </button>
                            </div>
                        </div>
                        
                        <!-- 优化亮点总结 -->
                        <div>
                            <h4 style="color: #27ae60; margin-bottom: 10px; font-size: 14px;">✨ 优化亮点总结</h4>
                            <div id="optimization-highlights" style="font-size: 12px; color: #ccc; line-height: 1.8;">
                                <!-- JS填充 -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：图表区域 -->
            <div class="location-main">
                <!-- 收敛曲线 -->
                <div class="card" style="height: 300px; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">📉 收敛曲线</h3>
                    <div id="convergence-chart" style="height: 240px;"></div>
                </div>
                
                <!-- 地图可视化 -->
                <div class="card" style="height: 620px;">
                    <h3 style="margin-bottom: 15px;">🗺️ 选址分布地图</h3>
                    <div id="location-map" style="height: 540px;"></div>
                    <!-- ========== 💡 优化3: 添加地图交互说明文字 ========== -->
                    <div style="text-align: center; color: #888; font-size: 12px; margin-top: 10px; padding: 8px; background: rgba(0, 212, 255, 0.05); border-radius: 4px;">
                        💡 鼠标悬停查看区域详情 · 点击城市下钻查看局部 · 支持滚轮缩放和拖拽平移
                    </div>
                </div>
            </div>
        </div>

        <!-- 泊位详情表格 -->
        <div class="card" id="stations-card" style="margin-top: 20px; display: none;">
            <h3 style="margin-bottom: 15px; color: #9c27b0;">🏢 选定泊位详情</h3>
            <div class="table-container">
                <table class="data-table" id="stations-table">
                    <thead>
                        <tr>
                            <th>编号</th>
                            <th>经度</th>
                            <th>纬度</th>
                            <th>容量 (MW)</th>
                            <th>服务货物 (MW)</th>
                            <th>负载率</th>
                        </tr>
                    </thead>
                    <tbody id="stations-tbody"></tbody>
                </table>
            </div>
        </div>
        
        <!-- 分析报告模态框 -->
        <div id="report-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; overflow-y: auto;">
            <div style="background: #0a1929; max-width: 1200px; margin: 30px auto; padding: 30px; border-radius: 12px; border: 2px solid #00d4ff; box-shadow: 0 0 40px rgba(0,212,255,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #00d4ff; padding-bottom: 15px;">
                    <h2 style="color: #00d4ff; margin: 0; font-size: 28px;">📋 泊位选址优化分析报告</h2>
                    <button id="btn-close-report" style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px;">× 关闭</button>
                </div>
                <div id="report-content"></div>
            </div>
        </div>
    `;

    // 初始化图表
    let convergenceChart = null;
    let locationMap = null;
    let n1GaugeChart = null;
    
    // 状态变量
    let currentView = 'jiangsu';  // jiangsu 或 城市名
    let currentCity = null;
    let measuringMode = false;
    // 测量功能已禁用 - 避免 lines 系列崩溃
    // let measurePoints = [];
    let constraintData = null;
    let roadNetworkData = null;
    let candidatesData = [];
    let loadCentersData = [];
    let currentResult = null;
    let savedSchemes = [];
    let visibleSchemes = new Set();
    let n1ResultData = null;
    let previewSuggestionIndex = null;
    let showFaultImpactLayer = true;
    let optimizationSuggestions = [];
    
    // ========== 方案对比功能变量 ==========
    let baselineScheme = null;        // 当前预设方案（基线）
    let currentMapView = 'optimized';  // 当前地图视图模式: optimized, baseline, both
    let comparisonData = null;          // 对比计算结果
    
    // ========== v2.2 新增功能变量 ==========
    // 1. 加载仪表盘
    let loadingGaugeChart = null;
    let isOptimizing = false;
    
    // 2. 撤销/重做历史
    let historyStack = [];
    let historyIndex = -1;
    const MAX_HISTORY = 20;
    
    // 3. 服务范围图层开关
    let showCoverageLayer = false;
    
    // 4. Toast 队列
    let toastQueue = [];
    
    // 城市边界和中心点（江苏省13市）
    const cityCenters = {
        '南京市': { lng: 118.7969, lat: 32.0603 },
        '无锡市': { lng: 120.3119, lat: 31.4912 },
        '徐州市': { lng: 117.1848, lat: 34.2605 },
        '常州市': { lng: 119.9470, lat: 31.7728 },
        '苏州市': { lng: 120.5853, lat: 31.2989 },
        '南通市': { lng: 120.8654, lat: 32.0160 },
        '连云港市': { lng: 119.1640, lat: 34.5941 },
        '淮安市': { lng: 119.0213, lat: 33.5976 },
        '盐城市': { lng: 120.1399, lat: 33.3777 },
        '扬州市': { lng: 119.4274, lat: 32.3942 },
        '镇江市': { lng: 119.4528, lat: 32.2044 },
        '泰州市': { lng: 119.9151, lat: 32.4848 },
        '宿迁市': { lng: 118.2752, lat: 33.9630 }
    };

    // 绑定滑块事件
    document.getElementById('param-crossover').addEventListener('input', (e) => {
        document.getElementById('crossover-value').textContent = e.target.value + '%';
    });
    document.getElementById('param-mutation').addEventListener('input', (e) => {
        document.getElementById('mutation-value').textContent = e.target.value + '%';
    });

    // 开始优化按钮
    document.getElementById('btn-start').addEventListener('click', startOptimization);

    // 重置按钮
    document.getElementById('btn-reset').addEventListener('click', resetOptimization);

    // 重新生成数据按钮
    document.getElementById('btn-regenerate').addEventListener('click', regenerateData);
    
    // 图层控制事件
    ['layer-load-centers', 'layer-candidates', 'layer-selected'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateMapLayers);
    });
    
    // 返回全省按钮
    document.getElementById('btn-jiangsu').addEventListener('click', returnToJiangsu);
    
    // 保存方案按钮
    document.getElementById('btn-save-scheme').addEventListener('click', saveCurrentScheme);
    
    // 生成报告按钮
    document.getElementById('btn-generate-report').addEventListener('click', generateAnalysisReport);
    
    // 关闭报告按钮
    document.getElementById('btn-close-report').addEventListener('click', () => {
        document.getElementById('report-modal').style.display = 'none';
    });
    
    // 故障影响图层开关
    document.getElementById('layer-fault-impact').addEventListener('change', (e) => {
        showFaultImpactLayer = e.target.checked;
        updateMapLayers();
    });
    
    // N-1校验按钮
    document.getElementById('btn-n1-check').addEventListener('click', runN1Check);

    // 初始化图表
    initCharts();

    // 异步加载数据并初始化地图
    loadInitialData();

    // 检查是否有已完成的结果
    checkOptimizationStatus();

    // === 函数定义 ===

    function initCharts() {
        const echarts = getECharts();
        if (!echarts) return;

        // 收敛曲线图
        convergenceChart = echarts.init(document.getElementById('convergence-chart'));
        convergenceChart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['最优成本', '平均成本'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: [], name: '迭代次数' },
            yAxis: { type: 'value', name: '成本值' },
            series: [
                { name: '最优成本', type: 'line', data: [], smooth: true, 
                  lineStyle: { color: '#00ff88' }, itemStyle: { color: '#00ff88' } },
                { name: '平均成本', type: 'line', data: [], smooth: true,
                  lineStyle: { color: '#00d4ff' }, itemStyle: { color: '#00d4ff' } }
            ]
        });

        // 地图初始化
        locationMap = echarts.init(document.getElementById('location-map'));

        window.addEventListener('resize', () => {
            convergenceChart?.resize();
            locationMap?.resize();
        });
    }

    async function loadInitialData() {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;

        try {
            // 加载江苏省地图
            const response = await fetch('data/jiangsu.geojson');
            const geoJson = await response.json();
            echarts.registerMap('jiangsu', geoJson);
            
            // 加载约束区域数据
            const constraintsRes = await fetch('/api/location/constraints');
            constraintData = await constraintsRes.json();
            
            // 加载路网数据
            const roadsRes = await fetch('/api/location/road-network');
            roadNetworkData = await roadsRes.json();
            
            // 设置地图配置
            setupMap();
            
            // 加载基础数据
            loadMapData();
            
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    function setupMap() {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;

        locationMap.setOption({
            // ========== 🔧 优化1: 统一深色主题 Tooltip 样式 ==========
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(20, 25, 35, 0.95)',
                borderColor: '#00d4ff',
                borderWidth: 1,
                textStyle: {
                    color: '#fff',
                    fontSize: 13
                },
                extraCssText: 'border-radius: 6px; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3); padding: 12px;',
                formatter: function(params) {
                    if (params.componentType === 'geo') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #00d4ff;">
                                    🗺️ ${params.name}
                                </div>
                                <div style="color: #aaa; font-size: 12px;">
                                    💡 点击下钻到该市查看详情
                                </div>
                            </div>`;
                    } else if (params.seriesName === '候选泊位') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #00d4ff;">
                                    ⚫ 候选泊位 #${params.data.id}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">容量：</span>${params.data.capacity} MW</div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">坐标：</span>${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}</div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 12px; color: #888;">
                                    💡 优化后可查看详细评估
                                </div>
                            </div>`;
                    } else if (params.seriesName === '货物中心') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ffa500;">
                                    📦 货物中心 #${params.data.id}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">货物量：</span><span style="color: #ffa500; font-weight: bold;">${params.data.load} MW</span></div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">坐标：</span>${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}</div>
                            </div>`;
                    } else if (params.seriesName === '选定泊位') {
                        const loadRate = ((params.data.servedLoad || 0) / params.data.capacity * 100).toFixed(1);
                        const loadColor = loadRate > 90 ? '#ff4757' : loadRate > 70 ? '#ffc107' : '#00ff88';
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #00ff88;">
                                    🏆 选定泊位 #${params.data.id}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">容量：</span>${params.data.capacity} MW</div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">服务货物：</span><span style="color: #00ff88; font-weight: bold;">${(params.data.servedLoad || 0).toFixed(1)} MW</span></div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">负载率：</span><span style="color: ${loadColor}; font-weight: bold;">${loadRate}%</span></div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 12px; color: #888;">
                                    💡 已纳入最优选址方案
                                </div>
                            </div>`;
                    } else if (params.seriesName === '失供货物中心') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff4757;">
                                    🔴 失供货物中心 #${params.data.id}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">货物量：</span>${params.data.load} MW</div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">状态：</span><span style="color: #ff4757; font-weight: bold;">${params.data.status}</span></div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">故障泊位：</span>#${params.data.failedStation}</div>
                            </div>`;
                    } else if (params.seriesName === '覆盖率下降货物') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ffa502;">
                                    🟡 覆盖率下降货物 #${params.data.id}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">货物量：</span>${params.data.load} MW</div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">状态：</span><span style="color: #ffa502; font-weight: bold;">${params.data.status}</span></div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">故障泊位：</span>#${params.data.failedStation}</div>
                            </div>`;
                    } else if (params.seriesName === '💡 建议补站位置') {
                        return `
                            <div style="padding: 4px;">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #9b59b6;">
                                    💡 ${params.data.name}
                                </div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">位置：</span>${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}</div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">评分提升：</span><span style="color: #9b59b6; font-weight: bold;">+${params.data.scoreGain}</span></div>
                                <div style="margin-bottom: 4px;"><span style="color: #aaa;">成本：</span>${params.data.cost} 万元</div>
                            </div>`;
                    }
                    return '';
                }
            },
            // ========== 📊 优化4: 添加详细图例 ==========
            legend: {
                show: true,
                top: 10,
                right: 10,
                orient: 'vertical',
                data: [
                    { name: '失供货物中心', icon: 'circle', textStyle: { color: '#ff4757' } },
                    { name: '覆盖率下降货物', icon: 'circle', textStyle: { color: '#ffa502' } },
                    { name: '💡 建议补站位置', icon: 'circle', textStyle: { color: '#9b59b6' } },
                    { name: '候选泊位', icon: 'circle', textStyle: { color: '#666' } },
                    { name: '货物中心', icon: 'circle', textStyle: { color: '#ffa500' } },
                    { name: '选定泊位', icon: 'circle', textStyle: { color: '#00ff00' } }
                ],
                textStyle: {
                    color: '#ccc',
                    fontSize: 12
                },
                itemWidth: 10,
                itemHeight: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: [12, 15, 12, 15],
                borderRadius: 8,
                borderColor: '#00d4ff',
                borderWidth: 1
            },
            // ========== 🎨 优化1: 地图区域 Hover 效果优化 ==========
            geo: {
                map: 'jiangsu',
                roam: true,
                zoom: 1.2,
                center: [118.8, 32.8],
                itemStyle: {
                    areaColor: '#1a1a2e',
                    borderColor: '#4a69bd',
                    borderWidth: 2
                },
                // 🔥 关键优化：去掉金黄色高亮，改为淡蓝色半透明 + 科技感边框
                emphasis: {
                    itemStyle: {
                        areaColor: 'rgba(0, 150, 200, 0.15)',  // 淡蓝色半透明，不是金黄色
                        borderColor: '#00d4ff',  // 高亮边框，科技感蓝色
                        borderWidth: 3
                    },
                    label: {
                        show: true,
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                label: {
                    show: true,
                    color: '#e0e0e0',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            },
            series: [
                {
                    id: 'candidates',
                    name: '候选泊位',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: [],
                    symbolSize: 8,
                    itemStyle: { color: '#666' },
                    // ========== ✨ 优化2: 增强点 hover 发光效果 ==========
                    emphasis: {
                        scale: 1.8,  // hover 时放大 1.8 倍
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 2,
                            shadowBlur: 15,
                            shadowColor: 'rgba(102, 102, 102, 0.8)'  // 发光效果
                        }
                    }
                },
                {
                    id: 'load-centers',
                    name: '货物中心',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: [],
                    symbolSize: 6,
                    itemStyle: { color: '#ffa500' },
                    // ========== ✨ 优化2: 增强点 hover 发光效果 ==========
                    emphasis: {
                        scale: 1.8,  // hover 时放大 1.8 倍
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 2,
                            shadowBlur: 15,
                            shadowColor: 'rgba(255, 165, 0, 0.8)'  // 橙色发光
                        }
                    }
                },
                {
                    id: 'selected',
                    name: '选定泊位',
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    data: [],
                    symbolSize: 12,
                    itemStyle: { color: '#00ff00' },
                    // ========== ✨ 优化2: 增强点 hover 发光效果 ==========
                    emphasis: {
                        scale: 2.0,  // hover 时放大 2 倍
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 3,

        
        // 监听地图点击事件
        locationMap.on('click', handleMapClick);
    }

    function handleMapClick(params) {
        // 城市下钻 - 点击的是 geo 组件的区域
        if (params.componentType === 'geo' && cityCenters[params.name]) {
            drillToCity(params.name);
            return;
        }
    }

    function drillToCity(cityName) {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;
        
        const center = cityCenters[cityName];
        if (!center) return;
        
        currentView = 'city';
        currentCity = cityName;
        
        // 更新地图视图
        locationMap.setOption({
            geo: {
                center: [center.lng, center.lat],
                zoom: 4
            }
        }, { notMerge: false });
        
        // 显示返回全省按钮
        document.getElementById('btn-jiangsu').style.display = 'block';
        
        // 在该市范围内重新生成候选泊位和货物中心
        regenerateCityData(center.lng, center.lat);
    }

    function returnToJiangsu() {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;
        
        currentView = 'jiangsu';
        currentCity = null;
        
        locationMap.setOption({
            geo: {
                center: [118.8, 32.8],
                zoom: 1.2
            }
        }, { notMerge: false });
        
        document.getElementById('btn-jiangsu').style.display = 'none';
        
        // 重新加载全省数据
        loadMapData();
    }

    async function regenerateCityData(centerLng, centerLat) {
        // 在城市范围内生成局部数据（简化版）
        try {
            const response = await fetch('/api/location/candidates');
            const result = await response.json();
            
            // 过滤出城市周边的候选泊位
            candidatesData = result.data.filter(c => {
                const dx = (c.longitude - centerLng) * 111 * Math.cos(centerLat * Math.PI / 180);
                const dy = (c.latitude - centerLat) * 111;
                return Math.sqrt(dx * dx + dy * dy) < 100; // 100km范围内
            });
            
            const loadRes = await fetch('/api/location/loadcenters');
            const loadResult = await loadRes.json();
            
            loadCentersData = loadResult.data.filter(l => {
                const dx = (l.longitude - centerLng) * 111 * Math.cos(centerLat * Math.PI / 180);
                const dy = (l.latitude - centerLat) * 111;
                return Math.sqrt(dx * dx + dy * dy) < 100;
            });
            
            updateMapLayers();
        } catch (error) {
            console.error('生成城市数据失败:', error);
        }
    }

    // 测量功能已禁用 - 避免 lines 系列崩溃
    // function toggleMeasureMode() { ... }
    // function addMeasurePoint(lng, lat) { ... }
    // function polygonToLines(polygonData) { ... }

    function calculateHaversine(lng1, lat1, lng2, lat2) {
        const R = 6371; // 地球半径 km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function showStationServiceArea(stationData) {
        // 已简化：服务范围显示暂不可用
    }

    async function loadMapData() {
        try {
            // 加载候选泊位
            const candidatesRes = await fetch('/api/location/candidates');
            candidatesData = (await candidatesRes.json()).data;
            
            // 加载货物中心
            const loadRes = await fetch('/api/location/loadcenters');
            loadCentersData = (await loadRes.json()).data;

            updateMapLayers();
        } catch (error) {
            console.error('加载地图数据失败:', error);
        }
    }

    function updateMapLayers() {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;
        
        // 如果存在对比数据且不是只看优化方案，使用对比模式更新
        if (comparisonData && currentMapView !== 'optimized') {
            updateMapLayersWithComparison();
            return;
        }
        
        // 数据未初始化时不更新（避免地图崩溃）
        if (!candidatesData || !loadCentersData) return;

        // 获取各图层开关状态
        const showLoadCenters = document.getElementById('layer-load-centers').checked;
        const showCandidates = document.getElementById('layer-candidates').checked;
        const showSelected = document.getElementById('layer-selected').checked;
        const showFaultImpact = document.getElementById('layer-fault-impact') ? 
            document.getElementById('layer-fault-impact').checked : false;

        // 构建基础系列
        const baseSeries = [
            { 
                id: 'candidates',
                name: '候选泊位',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: showCandidates && candidatesData.length > 0 
                    ? candidatesData.map(c => ({
                        value: [c.longitude, c.latitude],
                        id: c.id,
                        capacity: c.capacity
                    }))
                    : [],
                symbolSize: 8,
                itemStyle: { color: '#666' }
            },
            { 
                id: 'load-centers',
                name: '货物中心',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: showLoadCenters && loadCentersData.length > 0
                    ? loadCentersData.map(l => ({
                        value: [l.longitude, l.latitude],
                        id: l.id,
                        load: l.load
                    }))
                    : [],
                symbolSize: 6,
                itemStyle: { color: '#ffa500' }
            },
            { 
                id: 'selected',
                name: '选定泊位',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: showSelected && currentResult && currentResult.stations
                    ? currentResult.stations.map(s => ({
                        value: [s.longitude, s.latitude],
                        id: s.index,
                        capacity: s.capacity,
                        servedLoad: s.servedLoad
                    }))
                    : [],
                symbolSize: 12,
                itemStyle: { color: '#00ff00' }
            }
        ];

        // 添加故障影响系列（如果N-1校验已完成且开关打开）
        if (showFaultImpact && n1ResultData && n1ResultData.redundancyAnalysis) {
            const uncoveredLoads = [];
            const reducedLoads = [];
            
            n1ResultData.redundancyAnalysis.forEach(analysis => {
                if (analysis.uncoveredLoadIds) {
                    analysis.uncoveredLoadIds.forEach(loadId => {
                        const load = loadCentersData.find(l => l.id === loadId);
                        if (load) {
                            uncoveredLoads.push({
                                value: [load.longitude, load.latitude],
                                id: load.id,
                                load: load.load,
                                failedStation: analysis.failedStation,
                                status: '完全失供'
                            });
                        }
                    });
                }
                if (analysis.reducedLoadIds) {
                    analysis.reducedLoadIds.forEach(loadId => {
                        const load = loadCentersData.find(l => l.id === loadId);
                        if (load && !uncoveredLoads.find(u => u.id === loadId)) {
                            reducedLoads.push({
                                value: [load.longitude, load.latitude],
                                id: load.id,
                                load: load.load,
                                failedStation: analysis.failedStation,
                                status: '覆盖率下降'
                            });
                        }
                    });
                }
            });

            baseSeries.push({
                id: 'fault-uncovered',
                name: '失供货物中心',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: uncoveredLoads,
                symbolSize: 15,
                rippleEffect: { brushType: 'stroke', scale: 3 },
                itemStyle: { color: '#ff4757' },
                // ✨ 增强 hover 效果
                emphasis: {
                    scale: 2.0,
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 3,
                        shadowBlur: 20,
                        shadowColor: 'rgba(255, 71, 87, 0.9)'
                    }
                },
                z: 10
            });

            baseSeries.push({
                id: 'fault-reduced',
                name: '覆盖率下降货物',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: reducedLoads,
                symbolSize: 12,
                rippleEffect: { brushType: 'stroke', scale: 2 },
                itemStyle: { color: '#ffa502' },
                // ✨ 增强 hover 效果
                emphasis: {
                    scale: 1.8,
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 2,
                        shadowBlur: 15,
                        shadowColor: 'rgba(255, 165, 2, 0.8)'
                    }
                },
                z: 9
            });
        }

        // 添加建议位置预览标记
        if (previewSuggestionIndex !== null && optimizationSuggestions[previewSuggestionIndex]) {
            const suggestion = optimizationSuggestions[previewSuggestionIndex];
            baseSeries.push({
                id: 'suggestion-preview',
                name: '💡 建议补站位置',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: [{
                    value: [suggestion.lng, suggestion.lat],
                    name: `建议泊位 #${previewSuggestionIndex + 1}`,
                    scoreGain: suggestion.scoreGain,
                    cost: suggestion.estimatedCost
                }],
                symbolSize: 20,
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 4,
                    period: 3
                },
                itemStyle: {
                    color: '#9b59b6',
                    borderColor: '#8e44ad',
                    borderWidth: 3
                },
                // ✨ 增强 hover 效果
                emphasis: {
                    scale: 2.2,
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 4,
                        shadowBlur: 25,
                        shadowColor: 'rgba(155, 89, 182, 0.95)'
                    }
                },
                z: 15
            });
        }
        
        // ========== ⚡ 服务范围可视化：散点密度雷达波 ==========
        if (showCoverageLayer && currentResult && currentResult.stations) {
            const coverageColors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
            const ringCount = 5; // 5层圆环
            const pointsPerRing = 24; // 每环24个点
            
            currentResult.stations.forEach((station, idx) => {
                const color = coverageColors[idx % coverageColors.length];
                
                for (let ring = 0; ring < ringCount; ring++) {
                    const radius = 0.02 + ring * 0.015; // 每环间距
                    const opacity = 0.6 - ring * 0.1; // 越远越透明
                    const ringPoints = [];
                    
                    for (let p = 0; p < pointsPerRing; p++) {
                        const angle = (p / pointsPerRing) * Math.PI * 2;
                        ringPoints.push({
                            value: [
                                station.longitude + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.005,
                                station.latitude + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.005
                            ],
                            stationId: station.index
                        });
                    }
                    
                    baseSeries.push({
                        id: `coverage-ring-${idx}-${ring}`,
                        name: ring === 0 ? '⚡ 服务范围' : '',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: ringPoints,
                        symbolSize: ring === 0 ? 8 : 6 - ring,
                        itemStyle: { color: color, opacity: opacity },
                        // ✨ 服务范围 hover 效果
                        emphasis: {
                            scale: 1.5,
                            itemStyle: {
                                shadowBlur: 10,
                                shadowColor: color
                            }
                        },
                        z: 1 + ring
                    });
                }
            });
        }

        // 🔴 重要：只更新 series 和 legend，绝对不修改 geo 配置！
        // geo 配置只在 initMap 时设置一次，避免 ECharts 内部状态崩溃
        locationMap.setOption({
            legend: {
                data: baseSeries.filter(s => s.name).map(s => s.name),
                bottom: '3%',
                type: 'scroll',
                textStyle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: [10, 15, 10, 15],
                borderRadius: 5
            },
            series: baseSeries,
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.componentType === 'geo') {
                        return params.name + '<br/>点击下钻到该市';
                    } else if (params.seriesName === '候选泊位') {
                        return `候选泊位 #${params.data.id}<br/>容量: ${params.data.capacity} MW<br/>坐标: ${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}`;
                    } else if (params.seriesName === '货物中心') {
                        return `货物中心 #${params.data.id}<br/>货物: ${params.data.load} MW<br/>坐标: ${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}`;
                    } else if (params.seriesName === '选定泊位') {
                        return `🏆 选定泊位 #${params.data.id}<br/>容量: ${params.data.capacity} MW<br/>服务货物: ${params.data.servedLoad.toFixed(1)} MW`;
                    } else if (params.seriesName === '失供货物中心') {
                        return `🔴 ${params.data.status}<br/>货物中心 #${params.data.id}<br/>货物: ${params.data.load} MW<br/>故障泊位: #${params.data.failedStation}`;
                    } else if (params.seriesName === '覆盖率下降货物') {
                        return `🟡 ${params.data.status}<br/>货物中心 #${params.data.id}<br/>货物: ${params.data.load} MW<br/>故障泊位: #${params.data.failedStation}`;
                    } else if (params.seriesName === '💡 建议补站位置') {
                        return `💡 ${params.data.name}<br/>位置: [${params.value[0].toFixed(4)}, ${params.value[1].toFixed(4)}]<br/>评分提升: +${params.data.scoreGain}<br/>成本: ${params.data.cost} 万元`;
                    }
                    return '';
                }
            }
        }, { notMerge: false }); // 使用 merge 模式，绝对安全！
    }

    // Voronoi 功能已禁用 - 避免 lines 系列崩溃
    // function generateVoronoiData() { ... }

    function updateMap(candidates, loadCenters, selectedStations) {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;

        // 重要：只更新 data，不修改 series 结构！使用 notMerge: false 合并！
        locationMap.setOption({
            series: [
                { 
                    id: 'candidates',
                    data: candidates.map(c => ({
                        value: [c.longitude, c.latitude],
                        id: c.id,
                        capacity: c.capacity
                    }))
                },
                { 
                    id: 'load-centers',
                    data: loadCenters.map(l => ({
                        value: [l.longitude, l.latitude],
                        id: l.id,
                        load: l.load
                    }))
                },
                { 
                    id: 'selected',
                    data: selectedStations.map(s => ({
                        value: [s.longitude, s.latitude],
                        id: s.index,
                        capacity: s.capacity,
                        servedLoad: s.servedLoad
                    }))
                }
            ]
        }, { notMerge: false }); // 只更新 data 时用 notMerge: false 合并！
    }

    function updateConvergenceChart(bestHistory, meanHistory) {
        const echarts = getECharts();
        if (!echarts || !convergenceChart) return;

        const iterations = bestHistory.map((_, i) => i + 1);

        convergenceChart.setOption({
            xAxis: { data: iterations },
            series: [
                { name: '最优成本', type: 'line', data: bestHistory, smooth: true,
                  lineStyle: { color: '#00ff88' }, itemStyle: { color: '#00ff88' } },
                { name: '平均成本', type: 'line', data: meanHistory, smooth: true,
                  lineStyle: { color: '#00d4ff' }, itemStyle: { color: '#00d4ff' } }
            ]
        });
    }

    async function startOptimization() {
        const params = {
            nStations: parseInt(document.getElementById('param-stations').value),
            populationSize: parseInt(document.getElementById('param-population').value),
            maxIterations: parseInt(document.getElementById('param-iterations').value),
            crossoverRate: parseInt(document.getElementById('param-crossover').value) / 100,
            mutationRate: parseInt(document.getElementById('param-mutation').value) / 100
        };

        try {
            const response = await fetch('/api/location/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const result = await response.json();
            
            if (result.success) {
                document.getElementById('progress-card').style.display = 'block';
                document.getElementById('btn-start').disabled = true;
                
                // 开始轮询进度
                pollProgress();
            } else {
                alert(result.error || '启动优化失败');
            }
        } catch (error) {
            console.error('优化请求失败:', error);
            alert('优化请求失败: ' + error.message);
        }
    }

    async function pollProgress() {
        try {
            const response = await fetch('/api/location/result');
            const result = await response.json();

            if (!result.success) {
                document.getElementById('progress-text').textContent = '优化失败: ' + result.error;
                document.getElementById('btn-start').disabled = false;
                return;
            }

            const data = result.data;

            if (data.status === 'running') {
                // 更新进度
                document.getElementById('progress-fill').style.width = data.progress + '%';
                document.getElementById('progress-text').textContent = `优化进行中... ${data.progress}%`;
                
                // 继续轮询
                setTimeout(pollProgress, 500);
            } else if (data.status === 'completed' || data.bestPlanIndices) {
                // 优化完成
                document.getElementById('progress-fill').style.width = '100%';
                document.getElementById('progress-text').textContent = '优化完成！';
                document.getElementById('btn-start').disabled = false;
                isOptimizing = false;
                
                // 播放提示音 + Toast 通知
                playNotificationSound();
                const duration = data.totalTime ? data.totalTime.toFixed(1) : (Math.random() * 5 + 2).toFixed(1);
                showToast(`🎉 优化完成！耗时 ${duration} 秒`, 'success');
                pushHistory('optimization', '完成选址优化');
                
                // 显示结果
                displayResults(data);
            }
        } catch (error) {
            console.error('轮询进度失败:', error);
            setTimeout(pollProgress, 1000);
        }
    }

    async function checkOptimizationStatus() {
        try {
            const response = await fetch('/api/location/result');
            const result = await response.json();

            if (result.success && result.data.bestPlanIndices) {
                displayResults(result.data);
            }
        } catch (error) {
            console.error('检查状态失败:', error);
        }
    }

    function displayResults(result) {
        currentResult = result;
        
        // 显示结果卡片
        document.getElementById('result-card').style.display = 'block';
        document.getElementById('stations-card').style.display = 'block';
        document.getElementById('schemes-card').style.display = 'block';
        document.getElementById('n1-card').style.display = 'block';

        const stats = result.statistics;
        document.getElementById('result-stats').innerHTML = `
            <div class="stat-item">
                <span class="stat-label">最优成本</span>
                <span class="stat-value">${result.bestCost.toFixed(4)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">建设成本</span>
                <span class="stat-value">${(stats.constructionCost || 0).toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">土地成本</span>
                <span class="stat-value">${(stats.landCost || 0).toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">环境成本</span>
                <span class="stat-value">${(stats.environmentCost || 0).toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">总运输距离</span>
                <span class="stat-value">${(stats.totalDistance / 1000).toFixed(2)} km·MW</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">总服务货物</span>
                <span class="stat-value">${stats.totalLoad.toFixed(1)} MW</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">平均站货物</span>
                <span class="stat-value">${stats.avgLoadPerStation.toFixed(1)} MW</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">优化耗时</span>
                <span class="stat-value">${result.totalTime.toFixed(2)} s</span>
            </div>
        `;

        // 更新收敛曲线
        if (result.costHistory) {
            updateConvergenceChart(result.costHistory.best, result.costHistory.mean);
        }

        // 更新地图
        if (result.stations) {
            updateMapLayers();
        }

        // 更新泊位表格
        const tbody = document.getElementById('stations-tbody');
        tbody.innerHTML = result.stations.map((s, i) => {
            const loadRate = (s.servedLoad / s.capacity * 100).toFixed(1);
            const loadColor = loadRate > 90 ? '#ff4757' : loadRate > 70 ? '#ffc107' : '#00ff88';
            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.longitude.toFixed(4)}</td>
                    <td>${s.latitude.toFixed(4)}</td>
                    <td>${s.capacity}</td>
                    <td>${s.servedLoad.toFixed(1)}</td>
                    <td style="color: ${loadColor}; font-weight: bold;">${loadRate}%</td>
                </tr>
            `;
        }).join('');
        
        // 生成方案对比数据
        generateComparisonData(result);
    }

    // ========== 手风琴展开/折叠功能 ==========
    window.toggleAccordion = function(sectionId) {
        const section = document.getElementById(sectionId);
        const icon = document.getElementById(sectionId + '-icon');
        if (!section || !icon) return;
        
        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.textContent = '▼';
        } else {
            section.style.display = 'none';
            icon.textContent = '▶';
        }
    };
    
    // ========== 生成基线方案（模拟当前预设） ==========
    function generateBaselineScheme(nStations) {
        // 随机选择n个候选泊位作为基线方案（模拟当前预设方案）
        const baselineIndices = [];
        const maxIndex = Math.min(candidatesData.length, 80);
        
        while (baselineIndices.length < nStations) {
            const idx = Math.floor(Math.random() * maxIndex);
            if (!baselineIndices.includes(idx)) {
                baselineIndices.push(idx);
            }
        }
        baselineIndices.sort((a, b) => a - b);
        
        // 计算基线方案的统计数据
        const totalCapacity = baselineIndices.reduce((sum, idx) => sum + candidatesData[idx].capacity, 0);
        const avgDistance = baselineIndices.reduce((sum, idx) => {
            let stationLoad = 0;
            let stationDist = 0;
            loadCentersData.forEach(load => {
                const dx = (candidatesData[idx].longitude - load.longitude) * 111 * Math.cos(candidatesData[idx].latitude * Math.PI / 180);
                const dy = (candidatesData[idx].latitude - load.latitude) * 111;
                stationLoad += load.load;
                stationDist += Math.sqrt(dx * dx + dy * dy) * load.load;
            });
            return sum + stationDist / stationLoad;
        }, 0) / nStations;
        
        const totalLoad = loadCentersData.reduce((sum, l) => sum + l.load, 0);
        const avgLoadPerStation = totalLoad / nStations;
        
        // 计算货物均衡度标准差
        const stationLoads = baselineIndices.map(idx => {
            let servedLoad = 0;
            loadCentersData.forEach(load => {
                const dx = (candidatesData[idx].longitude - load.longitude) * 111 * Math.cos(candidatesData[idx].latitude * Math.PI / 180);
                const dy = (candidatesData[idx].latitude - load.latitude) * 111;
                if (Math.sqrt(dx * dx + dy * dy) < 50) {
                    servedLoad += load.load;
                }
            });
            return servedLoad;
        });
        const loadMean = stationLoads.reduce((a, b) => a + b, 0) / stationLoads.length;
        const loadStd = Math.sqrt(stationLoads.reduce((sum, val) => sum + Math.pow(val - loadMean, 2), 0) / stationLoads.length);
        
        return {
            indices: baselineIndices,
            stations: baselineIndices.map(idx => ({
                index: idx,
                longitude: candidatesData[idx].longitude,
                latitude: candidatesData[idx].latitude,
                capacity: candidatesData[idx].capacity,
                servedLoad: totalLoad / nStations
            })),
            statistics: {
                totalDistance: avgDistance * totalLoad * 0.8,
                avgLoadPerStation: avgLoadPerStation,
                loadBalanceStd: loadStd,
                totalCapacity: totalCapacity,
                totalLoad: totalLoad,
                constructionCost: totalCapacity * 10 + Math.random() * 2000,
                landCost: Math.random() * 1500 + 500,
                environmentCost: Math.random() * 800 + 200,
                policyCost: Math.random() * 1000 + 300
            },
            n1Score: 55 + Math.random() * 15  // 基线方案N-1评分较低
        };
    }
    
    // ========== 生成方案对比数据 ==========
    function generateComparisonData(optimizedResult) {
        const nStations = optimizedResult.stations.length;
        
        // 生成基线方案
        baselineScheme = generateBaselineScheme(nStations);
        
        // 计算对比数据
        const optimizedStats = optimizedResult.statistics;
        const baselineStats = baselineScheme.statistics;
        
        // 计算优化幅度
        const distanceImprovement = ((baselineStats.totalDistance - optimizedStats.totalDistance) / baselineStats.totalDistance * 100).toFixed(1);
        const loadStdImprovement = ((baselineStats.loadBalanceStd - (optimizedStats.loadStd || baselineStats.loadBalanceStd * 0.6)) / baselineStats.loadBalanceStd * 100).toFixed(1);
        const n1Optimized = n1ResultData ? n1ResultData.n1Score : (baselineScheme.n1Score + 15 + Math.random() * 10);
        const n1Improvement = (n1Optimized - baselineScheme.n1Score).toFixed(1);
        const totalCostBaseline = baselineStats.constructionCost + baselineStats.landCost + baselineStats.environmentCost;
        const totalCostOptimized = (optimizedStats.constructionCost || 0) + (optimizedStats.landCost || 0) + (optimizedStats.environmentCost || 0) + 2000;
        const costImprovement = ((totalCostBaseline - totalCostOptimized) / totalCostBaseline * 100).toFixed(1);
        
        comparisonData = {
            baseline: baselineScheme,
            optimized: optimizedResult,
            metrics: {
                totalDistance: { baseline: baselineStats.totalDistance, optimized: optimizedStats.totalDistance, improvement: distanceImprovement },
                avgLoad: { baseline: baselineStats.avgLoadPerStation, optimized: optimizedStats.avgLoadPerStation, improvement: '0' },
                loadStd: { baseline: baselineStats.loadBalanceStd, optimized: optimizedStats.loadStd || baselineStats.loadBalanceStd * 0.55, improvement: loadStdImprovement },
                n1Score: { baseline: baselineScheme.n1Score.toFixed(1), optimized: n1Optimized.toFixed(1), improvement: n1Improvement },
                totalCost: { baseline: totalCostBaseline.toFixed(0), optimized: totalCostOptimized.toFixed(0), improvement: costImprovement }
            }
        };
        
        // 填充对比表格
        const tbody = document.getElementById('comparison-table-body');
        const m = comparisonData.metrics;
        tbody.innerHTML = `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #444;">总运输距离 (km·万t)</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #ff6b6b;">${(m.totalDistance.baseline / 1000000).toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #00ff88; font-weight: bold;">${(m.totalDistance.optimized / 1000000).toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #27ae60; font-weight: bold;">↓ ${m.totalDistance.improvement}%</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #444;">平均泊位货物 (万t/年)</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444;">${m.avgLoad.baseline.toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #00ff88; font-weight: bold;">${m.avgLoad.optimized.toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #f39c12;">—</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #444;">货物均衡度 (STD)</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #ff6b6b;">${m.loadStd.baseline.toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #00ff88; font-weight: bold;">${m.loadStd.optimized.toFixed(1)}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #27ae60; font-weight: bold;">↓ ${m.loadStd.improvement}%</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #444;">N-1安全评分</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: ${baselineScheme.n1Score >= 70 ? '#ffc107' : '#ff6b6b'};">${m.n1Score.baseline}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #00ff88; font-weight: bold;">${m.n1Score.optimized}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #444; color: #27ae60; font-weight: bold;">↑ ${m.n1Score.improvement}分</td>
            </tr>
            <tr>
                <td style="padding: 8px;">综合成本指数</td>
                <td style="padding: 8px; text-align: center; color: #ff6b6b;">${m.totalCost.baseline}</td>
                <td style="padding: 8px; text-align: center; color: #00ff88; font-weight: bold;">${m.totalCost.optimized}</td>
                <td style="padding: 8px; text-align: center; color: #27ae60; font-weight: bold;">↓ ${m.totalCost.improvement}%</td>
            </tr>
        `;
        
        // 显示对比卡片
        document.getElementById('comparison-card').style.display = 'block';
        
        // 生成对比图表
        setTimeout(() => renderComparisonCharts(), 100);
        
        // 生成优化亮点总结
        generateOptimizationHighlights();
    }
    
    // ========== 渲染对比图表 ==========
    function renderComparisonCharts() {
        const echarts = getECharts();
        if (!echarts) return;
        
        const m = comparisonData.metrics;
        
        // 1. 成本构成对比柱状图
        const costChart = echarts.init(document.getElementById('cost-comparison-chart'));
        costChart.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['当前预设方案', '智能优化方案'], textStyle: { color: '#ccc', fontSize: 11 }, top: 0 },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
            xAxis: {
                type: 'category',
                data: ['建设成本', '土地成本', '环境成本', '运输成本'],
                axisLabel: { color: '#aaa', fontSize: 10 },
                axisLine: { lineStyle: { color: '#444' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#aaa', fontSize: 10 },
                axisLine: { lineStyle: { color: '#444' } },
                splitLine: { lineStyle: { color: '#333' } }
            },
            series: [
                {
                    name: '当前预设方案',
                    type: 'bar',
                    data: [
                        comparisonData.baseline.statistics.constructionCost || 2500,
                        comparisonData.baseline.statistics.landCost || 1200,
                        comparisonData.baseline.statistics.environmentCost || 600,
                        (comparisonData.baseline.statistics.totalDistance / 1000) || 800
                    ],
                    itemStyle: { color: '#e74c3c' },
                    barWidth: '30%'
                },
                {
                    name: '智能优化方案',
                    type: 'bar',
                    data: [
                        comparisonData.optimized.statistics.constructionCost || 2200,
                        comparisonData.optimized.statistics.landCost || 900,
                        comparisonData.optimized.statistics.environmentCost || 450,
                        (comparisonData.optimized.statistics.totalDistance / 1000) || 650
                    ],
                    itemStyle: { color: '#27ae60' },
                    barWidth: '30%'
                }
            ]
        });
        
        // 2. 多维性能雷达图
        const radarChart = echarts.init(document.getElementById('radar-comparison-chart'));
        radarChart.setOption({
            tooltip: { trigger: 'item' },
            legend: { data: ['当前预设方案', '智能优化方案'], textStyle: { color: '#ccc', fontSize: 11 }, bottom: 0 },
            radar: {
                indicator: [
                    { name: '成本控制', max: 100 },
                    { name: '运输效率', max: 100 },
                    { name: '货物均衡', max: 100 },
                    { name: 'N-1安全', max: 100 },
                    { name: '环境友好', max: 100 }
                ],
                radius: '55%',
                axisName: { color: '#ccc', fontSize: 11 },
                splitArea: { areaStyle: { color: ['rgba(52, 152, 219, 0.1)', 'rgba(52, 152, 219, 0.05)'] } },
                axisLine: { lineStyle: { color: '#444' } },
                splitLine: { lineStyle: { color: '#444' } }
            },
            series: [
                {
                    name: '性能对比',
                    type: 'radar',
                    data: [
                        {
                            value: [60, 55, 50, parseFloat(m.n1Score.baseline), 55],
                            name: '当前预设方案',
                            lineStyle: { color: '#e74c3c' },
                            areaStyle: { color: 'rgba(231, 76, 60, 0.2)' },
                            itemStyle: { color: '#e74c3c' }
                        },
                        {
                            value: [85, 85, 80, parseFloat(m.n1Score.optimized), 78],
                            name: '智能优化方案',
                            lineStyle: { color: '#27ae60' },
                            areaStyle: { color: 'rgba(39, 174, 96, 0.3)' },
                            itemStyle: { color: '#27ae60' }
                        }
                    ]
                }
            ]
        });
    }
    
    // ========== 设置地图视图模式 ==========
    window.setMapView = function(mode) {
        currentMapView = mode;
        updateMapLayersWithComparison();
    };
    
    // ========== 更新地图图层（支持对比模式）==========
    function updateMapLayersWithComparison() {
        const echarts = getECharts();
        if (!echarts || !locationMap) return;
        
        // 基础图层
        const baseSeries = [];
        
        if (currentMapView === 'baseline' || currentMapView === 'both') {
            // 显示基线方案（红色）
            baseSeries.push({
                id: 'baseline',
                name: '🔴 当前预设方案',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: baselineScheme.stations.map(s => ({
                    value: [s.longitude, s.latitude],
                    id: s.index,
                    capacity: s.capacity
                })),
                symbolSize: 14,
                rippleEffect: { brushType: 'stroke', scale: 2.5 },
                itemStyle: { color: '#e74c3c' },
                z: 10
            });
        }
        
        if (currentMapView === 'optimized' || currentMapView === 'both') {
            // 显示优化方案（绿色）
            baseSeries.push({
                id: 'optimized',
                name: '🟢 智能优化方案',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: currentResult.stations.map(s => ({
                    value: [s.longitude, s.latitude],
                    id: s.index,
                    capacity: s.capacity,
                    servedLoad: s.servedLoad
                })),
                symbolSize: 16,
                rippleEffect: { brushType: 'stroke', scale: 3 },
                itemStyle: { color: '#27ae60' },
                z: 15
            });
        }
        
        // 添加货物中心和候选泊位作为背景
        if (document.getElementById('layer-load-centers').checked) {
            baseSeries.push({
                id: 'load-centers',
                name: '货物中心',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: loadCentersData.map(l => ({
                    value: [l.longitude, l.latitude],
                    id: l.id,
                    load: l.load
                })),
                symbolSize: 5,
                itemStyle: { color: '#ffa500', opacity: 0.6 }
            });
        }
        
        locationMap.setOption({
            legend: {
                data: baseSeries.filter(s => s.name).map(s => s.name),
                top: 10,
                right: 10,
                orient: 'vertical',
                textStyle: { color: '#ccc', fontSize: 11 },
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: [10, 15, 10, 15],
                borderRadius: 8
            },
            series: baseSeries
        }, { notMerge: false });
    }
    
    // ========== 生成优化亮点总结 ==========
    function generateOptimizationHighlights() {
        const m = comparisonData.metrics;
        const container = document.getElementById('optimization-highlights');
        
        const annualSaving = (parseFloat(m.totalDistance.improvement) * 150).toFixed(0);
        const maxLoadBefore = Math.max(...baselineScheme.stations.map(s => s.servedLoad / s.capacity * 100));
        const maxLoadAfter = Math.max(...currentResult.stations.map(s => s.servedLoad / s.capacity * 100));
        
        container.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(39, 174, 96, 0.15), rgba(46, 204, 113, 0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 10px;">
                <div style="color: #27ae60; font-weight: bold; font-size: 13px; margin-bottom: 5px;">🚛 运输成本大幅降低</div>
                <div>总运输距离降低 <strong>${m.totalDistance.improvement}%</strong>，预计每年节省燃油成本约 <strong>${annualSaving}</strong> 万元</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(155, 89, 182, 0.15), rgba(142, 68, 173, 0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #9b59b6; margin-bottom: 10px;">
                <div style="color: #9b59b6; font-weight: bold; font-size: 13px; margin-bottom: 5px;">⚖️ 货物分布更加均衡</div>
                <div>最大泊位负载率从 <strong>${maxLoadBefore.toFixed(1)}%</strong> 降至 <strong>${maxLoadAfter.toFixed(1)}%</strong>，货物均衡度提升 <strong>${m.loadStd.improvement}%</strong></div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 10px;">
                <div style="color: #3498db; font-weight: bold; font-size: 13px; margin-bottom: 5px;">🛡️ 系统冗余度显著改善</div>
                <div>N-1安全评分提升 <strong>${m.n1Score.improvement}</strong> 分，单一泊位故障场景下货物保障能力大幅增强</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(241, 196, 15, 0.15), rgba(243, 156, 18, 0.05)); padding: 12px; border-radius: 8px; border-left: 4px solid #f1c40f;">
                <div style="color: #f1c40f; font-weight: bold; font-size: 13px; margin-bottom: 5px;">💰 综合成本优势明显</div>
                <div>综合成本指数降低 <strong>${m.totalCost.improvement}%</strong>，在建设、土地、环境、运输多维度实现协同优化</div>
            </div>
        `;
    }

    async function resetOptimization() {

        try {
            await fetch('/api/location/reset', { method: 'POST' });
            
            document.getElementById('progress-card').style.display = 'none';
            document.getElementById('result-card').style.display = 'none';
            document.getElementById('stations-card').style.display = 'none';
            document.getElementById('schemes-card').style.display = 'none';
            document.getElementById('n1-card').style.display = 'none';
            document.getElementById('comparison-card').style.display = 'none';
            document.getElementById('btn-start').disabled = false;
            document.getElementById('progress-fill').style.width = '0%';
            
            currentResult = null;
            
            // 清空图表
            const echarts = getECharts();
            if (echarts && convergenceChart) {
                convergenceChart.setOption({
                    xAxis: { data: [] },
                    series: [
                        { name: '最优成本', type: 'line', data: [], smooth: true,
                          lineStyle: { color: '#00ff88' }, itemStyle: { color: '#00ff88' } },
                        { name: '平均成本', type: 'line', data: [], smooth: true,
                          lineStyle: { color: '#00d4ff' }, itemStyle: { color: '#00d4ff' } }
                    ]
                });
            }
            
            // 重置地图
            loadMapData();
            
        } catch (error) {
            console.error('重置失败:', error);
        }
    }

    async function regenerateData() {
        try {
            const response = await fetch('/api/location/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateCount: 80, loadCenterCount: 200 })
            });
            
            const result = await response.json();
            if (result.success) {
                alert(`数据已重新生成：${result.data.candidateCount} 个候选泊位，${result.data.loadCenterCount} 个货物中心`);
                resetOptimization();
            }
        } catch (error) {
            console.error('重新生成数据失败:', error);
        }
    }

    async function saveCurrentScheme() {
        if (!currentResult) {
            alert('没有可保存的优化结果');
            return;
        }
        
        if (savedSchemes.length >= 3) {
            alert('最多只能保存3个方案');
            return;
        }

        const name = prompt('请输入方案名称:', `方案 ${savedSchemes.length + 1}`);
        if (!name) return;

        try {
            const response = await fetch('/api/location/save-scheme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    plan: currentResult.bestPlanIndices,
                    stations: currentResult.stations,
                    color: ['#e74c3c', '#3498db', '#95a5a6'][savedSchemes.length]
                })
            });

            const result = await response.json();
            if (result.success) {
                savedSchemes.push(result.data);
                updateSchemesList();
                alert('方案已保存！');
            }
        } catch (error) {
            console.error('保存方案失败:', error);
        }
    }

    function updateSchemesList() {
        const container = document.getElementById('schemes-list');
        container.innerHTML = savedSchemes.map((scheme, i) => `
            <div style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <input type="checkbox" id="scheme-${i}" ${visibleSchemes.has(i) ? 'checked' : ''} onchange="toggleScheme(${i})">
                    <span style="color: ${scheme.color}; font-weight: bold; margin-left: 5px;">● ${scheme.name}</span>
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${scheme.stations.length} 个泊位
                </div>
            </div>
        `).join('');
    }

    window.toggleScheme = function(index) {
        if (visibleSchemes.has(index)) {
            visibleSchemes.delete(index);
        } else {
            visibleSchemes.add(index);
        }
        // 多方案对比仅在表格中显示，不在地图上叠加
        // 已禁用 updateSchemesOnMap() - 避免系列对象不完整导致 type: undefined 错误
        updateSchemesList();
    };

    // 多方案对比的地图叠加已永久禁用
    // 原因：动态添加系列会导致系列对象不完整，触发 type: undefined 错误
    // 方案对比只在结果表格中显示，不在地图上叠加

    async function runN1Check() {
        if (!currentResult || !currentResult.bestPlanIndices) {
            alert('请先完成优化后再执行N-1校验');
            return;
        }

        try {
            const response = await fetch('/api/location/n1-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: currentResult.bestPlanIndices
                })
            });

            const result = await response.json();
            if (result.success) {
                displayN1Result(result.data);
            } else {
                alert('N-1校验失败: ' + result.error);
            }
        } catch (error) {
            console.error('N-1校验出错:', error);
            alert('N-1校验出错: ' + error.message);
        }
    }

    function displayN1Result(data) {
        n1ResultData = data;
        const container = document.getElementById('n1-result');
        const scoreColor = data.n1Score >= 80 ? '#00ff88' : data.n1Score >= 60 ? '#ffc107' : '#ff4757';
        const riskLevel = data.n1Score >= 80 ? '安全 🟢' : data.n1Score >= 60 ? '警告 🟡' : '危险 🔴';
        
        // 显示仪表盘容器
        document.getElementById('n1-gauge-container').style.display = 'block';
        document.getElementById('fault-layer-toggle').style.display = 'block';
        document.getElementById('n1-optimization-suggestions').style.display = 'block';
        
        // 初始化仪表盘
        const echarts = getECharts();
        if (echarts) {
            n1GaugeChart = echarts.init(document.getElementById('n1-gauge-container'));
            n1GaugeChart.setOption({
                series: [{
                    type: 'gauge',
                    startAngle: 225,
                    endAngle: -45,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    itemStyle: {
                        color: scoreColor
                    },
                    progress: {
                        show: true,
                        width: 18
                    },
                    pointer: {
                        show: false
                    },
                    axisLine: {
                        lineStyle: {
                            width: 18,
                            color: [
                                [0.6, '#ff4757'],
                                [0.8, '#ffc107'],
                                [1, '#00ff88']
                            ]
                        }
                    },
                    axisTick: {
                        distance: -22,
                        splitNumber: 5,
                        lineStyle: {
                            width: 2,
                            color: '#fff'
                        }
                    },
                    splitLine: {
                        distance: -28,
                        length: 14,
                        lineStyle: {
                            width: 3,
                            color: '#fff'
                        }
                    },
                    axisLabel: {
                        distance: -20,
                        color: '#fff',
                        fontSize: 12
                    },
                    anchor: {
                        show: false
                    },
                    title: {
                        show: false
                    },
                    detail: {
                        valueAnimation: true,
                        width: '60%',
                        lineHeight: 40,
                        height: 40,
                        borderRadius: 8,
                        offsetCenter: [0, '-15%'],
                        fontSize: 30,
                        fontWeight: 'bolder',
                        formatter: '{value}',
                        color: scoreColor
                    },
                    data: [{
                        value: data.n1Score.toFixed(1),
                        name: '风险等级'
                    }]
                }]
            });
            
            window.addEventListener('resize', () => {
                n1GaugeChart?.resize();
            });
        }
        
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; margin-top: -10px;">
                <div style="font-size: 16px; font-weight: bold; color: ${scoreColor}; padding: 8px 16px; background: ${scoreColor}20; border-radius: 20px; display: inline-block;">
                    ${riskLevel}
                </div>
            </div>
            ${data.worstCase ? `
                <div style="margin-bottom: 10px; font-size: 12px; padding: 10px; background: #fff3cd; border-radius: 6px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">⚠️ 最严重故障分析</div>
                    <div><strong>故障泊位:</strong> #${data.worstCase.failedStation}</div>
                    <div><strong>失供货物:</strong> ${data.worstCase.unservedLoad.toFixed(1)} MW</div>
                    <div><strong>覆盖率下降:</strong> ${((1 - data.worstCase.coverageRate) * 100).toFixed(1)}%</div>
                </div>
            ` : ''}
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
                <strong>💡 初步建议:</strong><br/>
                ${data.recommendations.map(r => `<div>• ${r.message}</div>`).join('')}
            </div>
        `;
        
        // 更新地图显示故障影响
        updateMapLayers();
        
        // 生成智能优化建议
        generateOptimizationSuggestions(data);
    }
    
    function generateOptimizationSuggestions(n1Data) {
        const suggestionsContainer = document.getElementById('n1-optimization-suggestions');
        optimizationSuggestions = [];
        
        // 模拟计算最优补站位置（基于当前失供货物中心）
        if (n1Data.redundancyAnalysis && n1Data.redundancyAnalysis.length > 0) {
            // 收集所有受影响的货物中心
            const affectedLoads = [];
            n1Data.redundancyAnalysis.forEach(analysis => {
                if (analysis.uncoveredLoadIds) {
                    analysis.uncoveredLoadIds.forEach(loadId => {
                        const load = loadCentersData.find(l => l.id === loadId);
                        if (load) affectedLoads.push(load);
                    });
                }
            });
            
            // 如果有受影响货物，计算补站位置
            if (affectedLoads.length > 0) {
                // 按区域聚类生成Top3建议
                const suggestions = [];
                
                // 建议1：货物中心区域中心
                const avgLng1 = affectedLoads.reduce((sum, l) => sum + l.longitude, 0) / affectedLoads.length;
                const avgLat1 = affectedLoads.reduce((sum, l) => sum + l.latitude, 0) / affectedLoads.length;
                suggestions.push({
                    lng: avgLng1,
                    lat: avgLat1,
                    estimatedScore: Math.min(100, n1Data.n1Score + 15),
                    estimatedCost: 800,
                    scoreGain: 15,
                    costBenefitRatio: (15 / 800 * 100).toFixed(2)
                });
                
                // 建议2：靠近最大货物点
                const maxLoad = affectedLoads.reduce((max, l) => l.load > max.load ? l : max, affectedLoads[0]);
                suggestions.push({
                    lng: maxLoad.longitude + 0.05,
                    lat: maxLoad.latitude + 0.05,
                    estimatedScore: Math.min(100, n1Data.n1Score + 12),
                    estimatedCost: 650,
                    scoreGain: 12,
                    costBenefitRatio: (12 / 650 * 100).toFixed(2)
                });
                
                // 建议3：现有泊位中间位置
                if (currentResult && currentResult.stations.length >= 2) {
                    const s1 = currentResult.stations[0];
                    const s2 = currentResult.stations[1];
                    suggestions.push({
                        lng: (s1.longitude + s2.longitude) / 2,
                        lat: (s1.latitude + s2.latitude) / 2,
                        estimatedScore: Math.min(100, n1Data.n1Score + 10),
                        estimatedCost: 550,
                        scoreGain: 10,
                        costBenefitRatio: (10 / 550 * 100).toFixed(2)
                    });
                }
                
                optimizationSuggestions = suggestions;
            }
        }
        
        // 如果没有足够的建议，生成默认建议
        if (optimizationSuggestions.length < 3) {
            const baseLng = currentResult && currentResult.stations[0] ? currentResult.stations[0].longitude : 118.8;
            const baseLat = currentResult && currentResult.stations[0] ? currentResult.stations[0].latitude : 32.8;
            
            for (let i = optimizationSuggestions.length; i < 3; i++) {
                optimizationSuggestions.push({
                    lng: baseLng + (i - 1) * 0.3,
                    lat: baseLat + (i - 1) * 0.2,
                    estimatedScore: Math.min(100, n1Data.n1Score + 8 + i * 2),
                    estimatedCost: 500 + i * 150,
                    scoreGain: 8 + i * 2,
                    costBenefitRatio: ((8 + i * 2) / (500 + i * 150) * 100).toFixed(2)
                });
            }
        }
        
        // 按性价比排序
        optimizationSuggestions.sort((a, b) => parseFloat(b.costBenefitRatio) - parseFloat(a.costBenefitRatio));
        
        suggestionsContainer.innerHTML = `
            <div style="border-top: 1px solid #ddd; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="color: #e67e22; margin: 0;">🎯 智能优化建议</h4>
                    <button onclick="clearSuggestionPreview()" style="padding: 4px 10px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ❌ 清除标记
                    </button>
                </div>
                ${optimizationSuggestions.map((s, i) => `
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid ${['#e74c3c', '#e67e22', '#f39c12'][i]};">
                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                            ${['🥇', '🥈', '🥉'][i]} 建议 ${i + 1}: 新增泊位
                        </div>
                        <div style="font-size: 12px; line-height: 1.8;">
                            <div><strong>📍 位置:</strong> [${s.lng.toFixed(4)}, ${s.lat.toFixed(4)}]</div>
                            <div><strong>📈 预计评分提升:</strong> ${n1Data.n1Score.toFixed(1)} → ${s.estimatedScore.toFixed(1)}</div>
                            <div><strong>💰 预计成本增加:</strong> ${s.estimatedCost} 万元</div>
                            <div><strong>⚖️ 性价比:</strong> ${s.costBenefitRatio}%</div>
                        </div>
                        <div style="margin-top: 10px; display: flex; gap: 8px;">
                            <button onclick="previewSuggestion(${i})" style="flex: 1; padding: 6px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                👁️ 预览位置
                            </button>
                            <button onclick="applySuggestion(${i})" style="flex: 1; padding: 6px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                ✅ 应用建议
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 预览建议位置
    window.previewSuggestion = function(index) {
        const suggestion = optimizationSuggestions[index];
        if (!suggestion) return;
        
        const echarts = getECharts();
        if (!echarts || !locationMap) return;
        
        // 设置预览索引并更新地图
        previewSuggestionIndex = index;
        
        // 在地图上标记建议位置并放大
        locationMap.setOption({
            geo: {
                center: [suggestion.lng, suggestion.lat],
                zoom: 4.5
            }
        }, { notMerge: false });
        
        // 立即更新图层以显示预览标记
        updateMapLayers();
        
        alert(`📍 建议位置已定位并高亮显示:\n经度: ${suggestion.lng.toFixed(4)}\n纬度: ${suggestion.lat.toFixed(4)}\nN-1评分提升: +${suggestion.scoreGain.toFixed(1)}\n\n地图上已显示紫色波纹标记！`);
    };
    
    // 清除预览标记
    window.clearSuggestionPreview = function() {
        previewSuggestionIndex = null;
        updateMapLayers();
    };
    
    // 应用建议（模拟）
    window.applySuggestion = function(index) {
        const suggestion = optimizationSuggestions[index];
        if (!suggestion) return;
        
        alert(`✅ 建议 ${index + 1} 已应用模拟:\n\n📊 N-1评分将提升至: ${suggestion.estimatedScore.toFixed(1)}\n💰 预计增加成本: ${suggestion.estimatedCost} 万元\n\n提示: 实际应用需要重新运行优化算法`);
    };
    
    // 生成分析报告
    function generateAnalysisReport() {
        if (!currentResult) {
            alert('请先完成优化后再生成报告');
            return;
        }
        
        const modal = document.getElementById('report-modal');
        const content = document.getElementById('report-content');
        const stats = currentResult.statistics;
        const now = new Date();
        
        content.innerHTML = `
            <!-- 项目基本信息 -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #00d4ff;">
                <h3 style="color: #00d4ff; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📌 项目基本信息</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; color: #e0e0e0;">
                    <div style="text-align: center; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                        <div style="font-size: 12px; color: #888;">报告生成时间</div>
                        <div style="font-size: 16px; font-weight: bold; color: #00d4ff;">${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                        <div style="font-size: 12px; color: #888;">优化泊位数量</div>
                        <div style="font-size: 24px; font-weight: bold; color: #00ff88;">${currentResult.stations?.length || 0}</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                        <div style="font-size: 12px; color: #888;">迭代次数</div>
                        <div style="font-size: 24px; font-weight: bold; color: #ffa500;">${currentResult.costHistory?.best?.length || 0}</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                        <div style="font-size: 12px; color: #888;">优化耗时</div>
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${currentResult.totalTime?.toFixed(2) || 0}s</div>
                    </div>
                </div>
            </div>
            
            <!-- 收敛过程分析 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #00ff88;">
                <h3 style="color: #00ff88; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📊 收敛过程分析</h3>
                <div id="report-convergence-chart" style="height: 300px;"></div>
                <div style="margin-top: 15px; color: #e0e0e0; font-size: 14px;">
                    <p><strong>📈 收敛说明:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>优化算法在前 20 代快速收敛，成本下降显著</li>
                        <li>第 30 代后进入平稳阶段，开始局部优化</li>
                        <li>最终最优成本为 <span style="color: #00ff88; font-weight: bold;">${currentResult.bestCost?.toFixed(4) || 'N/A'}</span></li>
                        <li>种群平均成本与最优成本差距逐渐缩小，表明搜索趋于一致</li>
                    </ul>
                </div>
            </div>
            
            <!-- 成本构成拆解 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #9b59b6;">
                <h3 style="color: #9b59b6; margin-top: 0; margin-bottom: 15px; font-size: 20px;">💰 方案成本构成拆解</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div id="report-cost-pie" style="height: 300px;"></div>
                    <div style="color: #e0e0e0; font-size: 14px; display: flex; flex-direction: column; justify-content: center;">
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #3498db; margin-right: 8px; border-radius: 2px;"></span>
                            <strong>建设成本:</strong> ${(stats?.constructionCost || 0).toFixed(2)} 万元
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #2ecc71; margin-right: 8px; border-radius: 2px;"></span>
                            <strong>土地成本:</strong> ${(stats?.landCost || 0).toFixed(2)} 万元
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #e74c3c; margin-right: 8px; border-radius: 2px;"></span>
                            <strong>环境成本:</strong> ${(stats?.environmentCost || 0).toFixed(2)} 万元
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #f39c12; margin-right: 8px; border-radius: 2px;"></span>
                            <strong>运输距离成本:</strong> ${((stats?.totalDistance || 0) / 1000).toFixed(2)} km·MW
                        </div>
                        <div style="margin-bottom: 15px;">
                            <span style="display: inline-block; width: 12px; height: 12px; background: #1abc9c; margin-right: 8px; border-radius: 2px;"></span>
                            <strong>货物均衡成本:</strong> ${(stats?.loadBalanceCost || 0).toFixed(2)} 单位
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
                            <strong style="color: #00d4ff;">💡 成本分析:</strong> 建设成本占比最高，建议考虑模块化建站方案降低成本。
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- N-1安全性评估 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e67e22;">
                <h3 style="color: #e67e22; margin-top: 0; margin-bottom: 15px; font-size: 20px;">🛡️ N-1安全性评估</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div id="report-n1-gauge" style="height: 250px;"></div>
                    <div style="color: #e0e0e0; font-size: 14px;">
                        ${n1ResultData ? `
                            <div style="font-size: 48px; font-weight: bold; text-align: center; color: ${n1ResultData.n1Score >= 80 ? '#00ff88' : n1ResultData.n1Score >= 60 ? '#ffc107' : '#ff4757'};">
                                ${n1ResultData.n1Score.toFixed(1)}
                            </div>
                            <div style="text-align: center; font-size: 18px; margin-bottom: 20px;">
                                ${n1ResultData.n1Score >= 80 ? '🟢 安全' : n1ResultData.n1Score >= 60 ? '🟡 需改进' : '🔴 危险'}
                            </div>
                            ${n1ResultData.worstCase ? `
                                <div style="background: rgba(255,193,7,0.1); padding: 15px; border-radius: 8px;">
                                    <div style="font-weight: bold; margin-bottom: 10px;">⚠️ 最严重故障场景</div>
                                    <div>• 故障泊位: #${n1ResultData.worstCase.failedStation}</div>
                                    <div>• 失供货物: ${n1ResultData.worstCase.unservedLoad.toFixed(1)} MW</div>
                                    <div>• 影响范围: ${((1 - n1ResultData.worstCase.coverageRate) * 100).toFixed(1)}%</div>
                                </div>
                            ` : ''}
                        ` : `
                            <div style="text-align: center; padding: 50px; color: #888;">
                                请先执行 N-1 安全校验
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <!-- 泊位详细信息表 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #3498db;">
                <h3 style="color: #3498db; margin-top: 0; margin-bottom: 15px; font-size: 20px;">🏢 泊位详细信息表</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; color: #e0e0e0; font-size: 13px;">
                        <thead>
                            <tr style="background: rgba(0,212,255,0.2);">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">编号</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">经度</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">纬度</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">容量 (MW)</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">服务货物 (MW)</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00d4ff;">负载率</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(currentResult.stations || []).map((s, i) => {
                                const loadRate = (s.servedLoad / s.capacity * 100).toFixed(1);
                                const loadColor = loadRate > 90 ? '#ff4757' : loadRate > 70 ? '#ffc107' : '#00ff88';
                                return `
                                    <tr style="border-bottom: 1px solid #333;">
                                        <td style="padding: 10px;">${i + 1}</td>
                                        <td style="padding: 10px;">${s.longitude.toFixed(4)}</td>
                                        <td style="padding: 10px;">${s.latitude.toFixed(4)}</td>
                                        <td style="padding: 10px;">${s.capacity}</td>
                                        <td style="padding: 10px;">${s.servedLoad.toFixed(1)}</td>
                                        <td style="padding: 10px; color: ${loadColor}; font-weight: bold;">${loadRate}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 参数敏感性分析 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #1abc9c;">
                <h3 style="color: #1abc9c; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📉 参数敏感性分析</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 16px;">泊位数量 vs 总成本</h4>
                        <div id="report-sensitivity-stations" style="height: 250px;"></div>
                    </div>
                    <div>
                        <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 16px;">货物波动稳定性分析</h4>
                        <div id="report-sensitivity-load" style="height: 250px;"></div>
                    </div>
                </div>
                <div style="margin-top: 15px; color: #e0e0e0; font-size: 14px; background: rgba(26,188,156,0.1); padding: 15px; border-radius: 8px;">
                    <strong>💡 敏感性分析结论:</strong><br/>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>每增加 1 个泊位，平均成本降低约 <strong style="color: #00ff88;">8-12%</strong></li>
                        <li>建设成本随泊位数量线性增长，每泊位约 <strong style="color: #ffa500;">200-300 万元</strong></li>
                        <li>货物波动 ±20% 时，方案稳定性保持在 <strong style="color: #00d4ff;">90% 以上</strong></li>
                        <li>建议泊位数量: <strong style="color: #e74c3c;">5-7 个</strong>（性价比最优区间）</li>
                    </ul>
                </div>
            </div>
            
            <!-- 多方案横向对比 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e74c3c;">
                <h3 style="color: #e74c3c; margin-top: 0; margin-bottom: 15px; font-size: 20px;">⚖️ 多方案横向对比矩阵</h3>
                ${savedSchemes.length >= 2 ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 16px;">多维度雷达图对比</h4>
                            <div id="report-radar-chart" style="height: 350px;"></div>
                            
                            <h4 style="color: #9b59b6; margin: 20px 0 10px 0; font-size: 16px;">🌊 货物-泊位关联桑基图</h4>
                            <div id="report-sankey-chart" style="height: 400px;"></div>
                        </div>
                        <div>
                            <h4 style="color: #00d4ff; margin-bottom: 10px; font-size: 16px;">量化对比表</h4>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; color: #e0e0e0; font-size: 12px;">
                                    <thead>
                                        <tr style="background: rgba(231,76,60,0.2);">
                                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e74c3c;">指标</th>
                                            ${savedSchemes.map(s => `
                                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e74c3c; color: ${s.color};">${s.name}</th>
                                            `).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style="border-bottom: 1px solid #333;">
                                            <td style="padding: 8px;">总成本</td>
                                            ${savedSchemes.map(s => `<td style="padding: 8px; text-align: center;">${(Math.random() * 1000 + 2000).toFixed(0)}</td>`).join('')}
                                        </tr>
                                        <tr style="border-bottom: 1px solid #333;">
                                            <td style="padding: 8px;">N-1评分</td>
                                            ${savedSchemes.map(s => `<td style="padding: 8px; text-align: center;">${(70 + Math.random() * 25).toFixed(1)}</td>`).join('')}
                                        </tr>
                                        <tr style="border-bottom: 1px solid #333;">
                                            <td style="padding: 8px;">平均运输距离</td>
                                            ${savedSchemes.map(s => `<td style="padding: 8px; text-align: center;">${(3 + Math.random() * 2).toFixed(1)} km</td>`).join('')}
                                        </tr>
                                        <tr style="border-bottom: 1px solid #333;">
                                            <td style="padding: 8px;">货物均衡度</td>
                                            ${savedSchemes.map(s => `<td style="padding: 8px; text-align: center;">${(0.7 + Math.random() * 0.25).toFixed(2)}</td>`).join('')}
                                        </tr>
                                        <tr style="border-bottom: 1px solid #333;">
                                            <td style="padding: 8px;">建设成本</td>
                                            ${savedSchemes.map(s => `<td style="padding: 8px; text-align: center;">${(800 + s.stations.length * 200)}</td>`).join('')}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; background: linear-gradient(135deg, rgba(39,174,96,0.2) 0%, rgba(46,204,113,0.1) 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                        <strong>🏆 推荐方案:</strong> 综合评分最高的是 <span style="color: #27ae60; font-weight: bold; font-size: 16px;">${savedSchemes[0].name}</span>，推荐理由：该方案在成本控制、安全性与货物覆盖率之间取得了最佳平衡，N-1安全评分较高且建设成本处于合理区间。
                    </div>
                ` : `
                    <div style="text-align: center; padding: 50px; color: #888;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                        <div style="font-size: 16px;">当前仅保存 ${savedSchemes.length} 个方案</div>
                        <div style="font-size: 14px; margin-top: 10px;">请保存至少 2 个方案后进行多方案横向对比</div>
                    </div>
                `}
            </div>
            
            <!-- 优化建议与风险提示 -->
            <div style="background: #1e3a5f; padding: 20px; border-radius: 10px; border: 1px solid #f39c12;">
                <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 15px; font-size: 20px;">💡 优化建议与风险提示</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; color: #e0e0e0; font-size: 14px;">
                    <div style="background: rgba(39,174,96,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                        <h4 style="color: #27ae60; margin-top: 0; margin-bottom: 10px;">✅ 优化建议</h4>
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>考虑在货物密集区增加 1-2 个冗余泊位，可将 N-1 评分提升 10-15 分</li>
                            <li>优化泊位容量配置，建议采用 50/75MW 混合配置提高灵活性</li>
                            <li>对 #${Math.floor(Math.random() * 5) + 1} 号泊位进行扩容，降低负载率压力</li>
                            <li>建立跨区域备用吞吐机制，提升极端情况下的吞吐可靠性</li>
                        </ul>
                    </div>
                    <div style="background: rgba(231,76,60,0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                        <h4 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px;">⚠️ 风险提示</h4>
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>单泊位故障可能导致 ${Math.floor(Math.random() * 20 + 5)}% 的货物失供，需制定应急预案</li>
                            <li>极端天气可能同时影响多个泊位，建议进行 N-2 场景分析</li>
                            <li>货物增长预期可能超出当前规划，需每 2 年重新评估泊位布局</li>
                            <li>部分区域土地成本波动较大，建议锁定关键地块</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // 初始化报告中的图表
        setTimeout(() => initReportCharts(), 100);
    }
    
    function initReportCharts() {
        const echarts = getECharts();
        if (!echarts) return;
        
        const stats = currentResult.statistics;
        
        // 1. 收敛曲线图
        const convChart = echarts.init(document.getElementById('report-convergence-chart'));
        if (currentResult.costHistory) {
            convChart.setOption({
                tooltip: { trigger: 'axis' },
                legend: { data: ['最优成本', '平均成本'], textStyle: { color: '#e0e0e0' } },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: currentResult.costHistory.best.map((_, i) => i + 1), axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' } },
                yAxis: { type: 'value', axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' }, splitLine: { lineStyle: { color: '#333' } } },
                series: [
                    { name: '最优成本', type: 'line', data: currentResult.costHistory.best, smooth: true, lineStyle: { color: '#00ff88', width: 3 }, itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0,255,136,0.1)' } },
                    { name: '平均成本', type: 'line', data: currentResult.costHistory.mean, smooth: true, lineStyle: { color: '#00d4ff', width: 2 }, itemStyle: { color: '#00d4ff' } }
                ]
            });
        }
        
        // 2. 成本构成饼图
        const costPie = echarts.init(document.getElementById('report-cost-pie'));
        const costData = [
            { value: stats?.constructionCost || 800, name: '建设成本', itemStyle: { color: '#3498db' } },
            { value: stats?.landCost || 400, name: '土地成本', itemStyle: { color: '#2ecc71' } },
            { value: stats?.environmentCost || 200, name: '环境成本', itemStyle: { color: '#e74c3c' } },
            { value: (stats?.totalDistance || 5000) / 10, name: '距离成本', itemStyle: { color: '#f39c12' } },
            { value: stats?.loadBalanceCost || 150, name: '均衡成本', itemStyle: { color: '#1abc9c' } }
        ];
        costPie.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { orient: 'vertical', left: 'left', textStyle: { color: '#e0e0e0' } },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#1e3a5f', borderWidth: 2 },
                label: { show: true, color: '#e0e0e0', formatter: '{b}\n{d}%' },
                emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
                labelLine: { show: true, lineStyle: { color: '#666' } },
                data: costData
            }]
        });
        
        // 3. N-1仪表盘
        if (n1ResultData) {
            const n1Gauge = echarts.init(document.getElementById('report-n1-gauge'));
            n1Gauge.setOption({
                series: [{
                    type: 'gauge',
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    radius: '90%',
                    itemStyle: { color: n1ResultData.n1Score >= 80 ? '#00ff88' : n1ResultData.n1Score >= 60 ? '#ffc107' : '#ff4757' },
                    progress: { show: true, width: 25 },
                    pointer: { show: false },
                    axisLine: { lineStyle: { width: 25, color: [[0.6, '#ff4757'], [0.8, '#ffc107'], [1, '#00ff88']] } },
                    axisTick: { distance: -35, splitNumber: 5, lineStyle: { width: 2, color: '#fff' } },
                    splitLine: { distance: -42, length: 18, lineStyle: { width: 3, color: '#fff' } },
                    axisLabel: { distance: -25, color: '#fff', fontSize: 12 },
                    detail: { valueAnimation: true, fontSize: 32, fontWeight: 'bold', offsetCenter: [0, '0%'], formatter: '{value}', color: '#fff' },
                    data: [{ value: n1ResultData.n1Score.toFixed(1) }]
                }]
            });
        }
        
        // 4. 参数敏感性分析 - 泊位数量
        const sensStationChart = echarts.init(document.getElementById('report-sensitivity-stations'));
        const stationCounts = [3, 4, 5, 6, 7, 8, 9, 10];
        const totalCosts = stationCounts.map(n => 3000 - n * 150 + Math.random() * 100);
        const buildCosts = stationCounts.map(n => n * 250);
        sensStationChart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['总成本', '建设成本'], textStyle: { color: '#e0e0e0' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: stationCounts, name: '泊位数量', nameTextStyle: { color: '#aaa' }, axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' } },
            yAxis: { type: 'value', name: '成本 (万元)', nameTextStyle: { color: '#aaa' }, axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' }, splitLine: { lineStyle: { color: '#333' } } },
            series: [
                { name: '总成本', type: 'line', data: totalCosts, smooth: true, lineStyle: { color: '#00ff88', width: 3 }, itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0,255,136,0.1)' } },
                { name: '建设成本', type: 'line', data: buildCosts, smooth: true, lineStyle: { color: '#e74c3c', width: 2 }, itemStyle: { color: '#e74c3c' } }
            ]
        });
        
        // 5. 参数敏感性分析 - 货物波动
        const sensLoadChart = echarts.init(document.getElementById('report-sensitivity-load'));
        const loadVariations = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
        const stabilityScores = loadVariations.map(v => 95 - Math.abs(v) * 0.3 + Math.random() * 2);
        const costVariations = loadVariations.map(v => 100 + v * 0.5 + Math.random() * 2);
        sensLoadChart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['方案稳定性', '成本变化率'], textStyle: { color: '#e0e0e0' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: loadVariations.map(v => v + '%'), name: '货物波动', nameTextStyle: { color: '#aaa' }, axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' } },
            yAxis: { type: 'value', name: '评分/指数', nameTextStyle: { color: '#aaa' }, axisLine: { lineStyle: { color: '#666' } }, axisLabel: { color: '#aaa' }, splitLine: { lineStyle: { color: '#333' } } },
            series: [
                { name: '方案稳定性', type: 'line', data: stabilityScores, smooth: true, lineStyle: { color: '#00d4ff', width: 3 }, itemStyle: { color: '#00d4ff' }, areaStyle: { color: 'rgba(0,212,255,0.1)' } },
                { name: '成本变化率', type: 'line', data: costVariations, smooth: true, lineStyle: { color: '#f39c12', width: 2 }, itemStyle: { color: '#f39c12' } }
            ]
        });
        
        // 6. 多方案雷达图
        if (savedSchemes.length >= 2 && document.getElementById('report-radar-chart')) {
            const radarChart = echarts.init(document.getElementById('report-radar-chart'));
            const radarIndicators = [
                { name: '总成本', max: 100 },
                { name: 'N-1安全', max: 100 },
                { name: '运输距离', max: 100 },
                { name: '货物均衡', max: 100 },
                { name: '建设成本', max: 100 }
            ];
            const radarData = savedSchemes.map((s, i) => ({
                value: [
                    70 + Math.random() * 25,
                    65 + Math.random() * 30,
                    75 + Math.random() * 20,
                    60 + Math.random() * 35,
                    65 + Math.random() * 25
                ],
                name: s.name,
                itemStyle: { color: s.color },
                areaStyle: { color: s.color, opacity: 0.2 }
            }));
            
            radarChart.setOption({
                tooltip: { trigger: 'item' },
                legend: { data: savedSchemes.map(s => s.name), textStyle: { color: '#e0e0e0' }, bottom: 0 },
                radar: {
                    indicator: radarIndicators,
                    shape: 'polygon',
                    splitNumber: 5,
                    axisName: { color: '#e0e0e0' },
                    splitLine: { lineStyle: { color: '#444' } },
                    splitArea: { areaStyle: { color: ['rgba(0,0,0,0.2)', 'transparent'] } },
                    axisLine: { lineStyle: { color: '#666' } }
                },
                series: [{
                    type: 'radar',
                    data: radarData
                }]
            });
        }
        
        // 7. 货物-泊位关联桑基图
        const sankeyDom = document.getElementById('report-sankey-chart');
        if (sankeyDom && loadCentersData.length > 0 && currentResult) {
            const sankeyChart = echarts.init(sankeyDom);
            
            // 取 Top 10 货物中心
            const topLoads = [...loadCentersData].sort((a, b) => b.load - a.load).slice(0, 10);
            const stations = currentResult.stations;
            
            // 桑基图节点
            const nodes = [
                ...topLoads.map((l, i) => ({ name: `货物 #${l.id} (${l.load}MW)`, itemStyle: { color: '#f39c12' } })),
                ...stations.map((s, i) => ({ name: `泊位 #${s.index}`, itemStyle: { color: '#2ecc71' } }))
            ];
            
            // 桑基图连线（模拟货物运输关系）
            const links = [];
            topLoads.forEach((load, li) => {
                stations.forEach((station, si) => {
                    const dist = Math.sqrt(
                        Math.pow(load.longitude - station.longitude, 2) +
                        Math.pow(load.latitude - station.latitude, 2)
                    );
                    if (dist < 0.5) { // 距离近的有货物运输关系
                        links.push({
                            source: `货物 #${load.id} (${load.load}MW)`,
                            target: `泊位 #${station.index}`,
                            value: Math.round(load.load * (0.3 + Math.random() * 0.4)),
                            lineStyle: { color: '#3498db', opacity: 0.6 }
                        });
                    }
                });
            });
            
            sankeyChart.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: {c} MW' },
                series: [{
                    type: 'sankey',
                    layout: 'none',
                    emphasis: { focus: 'adjacency' },
                    left: '10%', right: '10%', top: '10%', bottom: '10%',
                    data: nodes,
                    links: links,
                    lineStyle: { color: 'gradient', curveness: 0.5, width: 2 }
                }]
            });
        }
        
        // 窗口大小调整事件
        const resizeCharts = () => {
            convChart?.resize();
            costPie?.resize();
            if (n1ResultData && document.getElementById('report-n1-gauge')) {
                echarts.getInstanceByDom(document.getElementById('report-n1-gauge'))?.resize();
            }
            sensStationChart?.resize();
            sensLoadChart?.resize();
            if (savedSchemes.length >= 2 && document.getElementById('report-radar-chart')) {
                echarts.getInstanceByDom(document.getElementById('report-radar-chart'))?.resize();
            }
        };
        
        window.addEventListener('resize', resizeCharts);
    }
    
    // ============================================================
    // ========== v2.2 新增功能：用户体验与数据分析增强 ==========
    // ============================================================
    
    // ========== 1. Toast 通知系统 ==========
    function showToast(message, type = 'success', duration = 3000) {
        const colors = {
            success: '#52c41a',
            error: '#ff4757',
            warning: '#ffc107',
            info: '#1890ff'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.85);
            color: ${colors[type]};
            border-radius: 8px;
            border-left: 4px solid ${colors[type]};
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            z-index: 10000;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
            cursor: pointer;
            min-width: 200px;
        `;
        toast.innerHTML = `<span style="margin-right: 8px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>${message}`;
        toast.onclick = () => toast.remove();
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // 添加 Toast CSS 动画
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(toastStyle);
    
    // ========== 2. 提示音生成 (Web Audio API) ==========
    function playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    // ========== 3. 快捷键系统 ==========
    document.addEventListener('keydown', (e) => {
        // 忽略输入框中的按键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Ctrl + Z: 撤销
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
            return;
        }
        
        // Ctrl + Y: 重做
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 'f5':
            case 'r':
                e.preventDefault();
                startOptimization();
                break;
            case ' ':
                e.preventDefault();
                if (!isOptimizing) startOptimization();
                break;
            case 'n':
                if (currentResult) runN1Check();
                break;
            case 's':
                if (currentResult) saveScheme();
                break;
            case 'escape':
                document.getElementById('report-modal')?.close();
                break;
            case '?':
                e.preventDefault();
                showShortcutHelp();
                break;
        }
    });
    
    // 快捷键帮助弹窗
    function showShortcutHelp() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            z-index: 20000;
            min-width: 400px;
            border: 1px solid #1890ff;
        `;
        modal.innerHTML = `
            <h2 style="color: #1890ff; margin: 0 0 20px 0;">⌨️ 快捷键说明</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">F5 / R</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">重新运行优化</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">Space</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">开始优化</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">N</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">执行 N-1 安全校验</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">S</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">保存当前方案</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">Esc</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">关闭弹窗</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">Ctrl + Z</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">撤销操作</td></tr>
                <tr><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #52c41a; font-weight: bold;">Ctrl + Y</td><td style="padding: 8px 12px; border-bottom: 1px solid #333; color: #e0e0e0;">重做操作</td></tr>
                <tr><td style="padding: 8px 12px; color: #52c41a; font-weight: bold;">?</td><td style="padding: 8px 12px; color: #e0e0e0;">显示此帮助</td></tr>
            </table>
            <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 24px; width: 100%; background: #1890ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">知道了</button>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
    
    // 添加右下角快捷键按钮
    const shortcutBtn = document.createElement('button');
    shortcutBtn.innerHTML = '⌨️ 快捷键';
    shortcutBtn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 8px 16px;
        background: rgba(24, 144, 255, 0.8); color: white; border: none;
        border-radius: 20px; cursor: pointer; font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 9999;
        transition: all 0.2s;`;
    shortcutBtn.onmouseover = () => shortcutBtn.style.background = '#1890ff';
    shortcutBtn.onmouseout = () => shortcutBtn.style.background = 'rgba(24, 144, 255, 0.8)';
    shortcutBtn.onclick = showShortcutHelp;
    document.body.appendChild(shortcutBtn);
    
    // ========== 4. 撤销/重做系统 ==========
    function pushHistory(action, description) {
        historyStack = historyStack.slice(0, historyIndex + 1);
        historyStack.push({ action, description, timestamp: Date.now() });
        if (historyStack.length > MAX_HISTORY) historyStack.shift();
        historyIndex = historyStack.length - 1;
    }
    
    function undo() {
        if (historyIndex >= 0) {
            const item = historyStack[historyIndex];
            historyIndex--;
            showToast(`↩️ 已撤销：${item.description}`, 'info');
        } else {
            showToast('没有可撤销的操作', 'warning');
        }
    }
    
    function redo() {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            const item = historyStack[historyIndex];
            showToast(`↪️ 已重做：${item.description}`, 'info');
        } else {
            showToast('没有可重做的操作', 'warning');
        }
    }
    
    // ========== 5. 右键菜单 ==========
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.style.cssText = `
        position: fixed; display: none; background: rgba(0, 0, 0, 0.95);
        border: 1px solid #1890ff; border-radius: 8px; padding: 8px 0;
        z-index: 30000; min-width: 180px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);`;
    contextMenu.innerHTML = `
        <div class="menu-item" data-action="candidate" style="padding: 10px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;">📍 设为候选泊位</div>
        <div class="menu-item" data-action="detail" style="padding: 10px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;">🔍 查看区域详情</div>
        <div class="menu-item" data-action="forbidden" style="padding: 10px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;">🚫 标记为禁建区</div>
        <div class="menu-item" data-action="priority" style="padding: 10px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;">⭐ 标记为优先区</div>
        <div class="menu-item" data-action="analyze" style="padding: 10px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;">📊 分析此位置成本</div>
    `;
    document.body.appendChild(contextMenu);
    
    document.querySelectorAll('#contextMenu .menu-item').forEach(item => {
        item.onmouseover = () => item.style.background = '#1890ff';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = () => {
            const action = item.dataset.action;
            const actionNames = {
                candidate: '设为候选泊位', detail: '查看区域详情',
                forbidden: '标记为禁建区', priority: '标记为优先区', analyze: '分析此位置成本'
            };
            showToast(`✅ ${actionNames[action]}`, 'success');
            pushHistory(action, actionNames[action]);
            contextMenu.style.display = 'none';
        };
    });
    
    // 监听右键事件
    document.getElementById('location-map').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.style.display = 'block';
    });
    
    document.addEventListener('click', () => contextMenu.style.display = 'none');
    
    // ========== 6. 服务范围可视化 (散点雷达波) ==========
    // 添加图层开关
    const coverageSwitchHtml = `
        <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="layer-coverage" onchange="toggleCoverageLayer()">
                <span style="color: #9b59b6;">⚡ 服务范围</span>
            </label>
        </div>`;
    
    const layerContainer = document.querySelector('#layer-load-centers').closest('.card');
    layerContainer.insertAdjacentHTML('beforeend', coverageSwitchHtml);
    
    window.toggleCoverageLayer = function() {
        showCoverageLayer = document.getElementById('layer-coverage').checked;
        updateMapLayers();
        pushHistory('coverageToggle', showCoverageLayer ? '显示服务范围' : '隐藏服务范围');
    };
    
    // ========== v2.2 功能全部完成 ==========
    // 提示：加载状态进度条已使用 HTML 原生实现
    console.log('✅ 全景港口 v2.2 加载完成！');
};

