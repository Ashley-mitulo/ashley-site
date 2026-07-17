function render_settings(container) {
    container.innerHTML = `
        <div class="page-title">
            <span>⚙️</span>
            <span>系统设置</span>
        </div>
        
        <div class="grid grid-2" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">主题切换</div>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">选择显示主题</label>
                        <div style="display: flex; gap: 20px;">
                            <div onclick="switchTheme('dark')" style="cursor: pointer; text-align: center; padding: 15px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 255, 136, 0.1); flex: 1;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🌌</div>
                                <div style="font-weight: 600; color: #00ff88;">暗黑科技风</div>
                                <div style="font-size: 11px; color: #7a8ca6; margin-top: 5px;">当前主题</div>
                            </div>
                            <div onclick="switchTheme('light')" style="cursor: pointer; text-align: center; padding: 15px; border: 2px solid #1e3a5f; border-radius: 8px; background: rgba(255, 255, 255, 0.05); flex: 1;">
                                <div style="font-size: 28px; margin-bottom: 8px;">☀️</div>
                                <div style="font-weight: 600; color: #e0e6ed;">浅色商务风</div>
                                <div style="font-size: 11px; color: #7a8ca6; margin-top: 5px;">点击切换</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">自动轮播演示</div>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">展厅演示模式</label>
                        <div style="background: rgba(0, 212, 255, 0.05); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <p style="color: #7a8ca6; margin: 0; font-size: 13px; line-height: 1.6;">
                                开启自动轮播后，系统将自动切换各个页面，适合展厅大屏展示。
                                每个页面停留 8 秒，循环展示所有功能模块。
                            </p>
                        </div>
                        <div style="display: flex; gap: 15px;">
                            <button class="btn btn-success" onclick="startCarousel()" style="flex: 1;">
                                <span>▶️</span> 开始轮播
                            </button>
                            <button class="btn btn-danger" onclick="stopCarousel()" style="flex: 1;">
                                <span>⏹️</span> 停止轮播
                            </button>
                        </div>
                        <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #7a8ca6;">轮播间隔：</span>
                            <select class="form-input" id="carousel-interval" style="width: 120px;">
                                <option value="5000">5 秒</option>
                                <option value="8000" selected>8 秒</option>
                                <option value="10000">10 秒</option>
                                <option value="15000">15 秒</option>
                            </select>
                        </div>
                        <div id="carousel-status" style="margin-top: 10px; color: #ffc107; font-size: 12px; display: none;">
                            <span>⏳</span> 轮播进行中... 下一页倒计时：<span id="carousel-countdown">8</span> 秒
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">v2.0 新功能一览</div>
                <span style="background: linear-gradient(90deg, #00ff88, #00d4ff); color: #000; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700;">NEW</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div style="background: rgba(0, 255, 136, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">⚡</div>
                    <div style="font-weight: 700; color: #00ff88; font-size: 15px;">货物流转动画</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">粒子流动视觉效果</div>
                </div>
                <div style="background: rgba(255, 71, 87, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 71, 87, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">💓</div>
                    <div style="font-weight: 700; color: #ff4757; font-size: 15px;">健康度仪表盘</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">AI 智能健康评估</div>
                </div>
                <div style="background: rgba(0, 212, 255, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">🌱</div>
                    <div style="font-weight: 700; color: #00d4ff; font-size: 15px;">绿色港口展示</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">风光水一体化</div>
                </div>
                <div style="background: rgba(255, 193, 7, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 193, 7, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">🚨</div>
                    <div style="font-weight: 700; color: #ffc107; font-size: 15px;">故障预案推演</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">仿真演练平台</div>
                </div>
                <div style="background: rgba(156, 39, 176, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(156, 39, 176, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">📈</div>
                    <div style="font-weight: 700; color: #9c27b0; font-size: 15px;">货物智能预测</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">AI 算法模型</div>
                </div>
                <div style="background: rgba(0, 255, 136, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">🌌</div>
                    <div style="font-weight: 700; color: #00ff88; font-size: 15px;">双主题切换</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">暗黑/浅色可选</div>
                </div>
                <div style="background: rgba(0, 212, 255, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">🎬</div>
                    <div style="font-weight: 700; color: #00d4ff; font-size: 15px;">自动轮播模式</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">展厅大屏专用</div>
                </div>
                <div style="background: rgba(255, 193, 7, 0.1); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 193, 7, 0.3);">
                    <div style="font-size: 36px; margin-bottom: 10px;">🏗️</div>
                    <div style="font-weight: 700; color: #ffc107; font-size: 15px;">13 个功能模块</div>
                    <div style="font-size: 12px; color: #7a8ca6; margin-top: 5px;">全功能覆盖</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="card-title">系统信息</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <table class="data-table">
                        <tr>
                            <td style="width: 40%;">系统名称</td>
                            <td><strong>港口业务智能优化系统</strong></td>
                        </tr>
                        <tr>
                            <td>版本号</td>
                            <td><span style="color: #00ff88; font-weight: 700;">v2.0.0</span></td>
                        </tr>
                        <tr>
                            <td>后端服务</td>
                            <td>Node.js + Express</td>
                        </tr>
                        <tr>
                            <td>数据库</td>
                            <td>SQLite3</td>
                        </tr>
                        <tr>
                            <td>图表引擎</td>
                            <td>Apache ECharts 5</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <table class="data-table">
                        <tr>
                            <td style="width: 40%;">发布时间</td>
                            <td>2026年5月7日</td>
                        </tr>
                        <tr>
                            <td>系统状态</td>
                            <td><span class="status-tag normal">运行正常</span></td>
                        </tr>
                        <tr>
                            <td>服务端口</td>
                            <td>3003</td>
                        </tr>
                        <tr>
                            <td>功能模块</td>
                            <td><span style="color: #00d4ff; font-weight: 700;">13 个</span></td>
                        </tr>
                        <tr>
                            <td>当前主题</td>
                            <td id="current-theme-name">暗黑科技风</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// 主题切换
let currentTheme = 'dark';

function switchTheme(theme) {
    currentTheme = theme;
    const body = document.body;
    const cards = document.querySelectorAll('.card');
    const cardHeaders = document.querySelectorAll('.card-header');
    const sidebar = document.querySelector('.sidebar');
    
    if (theme === 'light') {
        // 浅色商务风
        body.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
        body.style.color = '#212529';
        
        cards.forEach(card => {
            card.style.background = '#ffffff';
            card.style.boxShadow = '0 2px 15px rgba(0,0,0,0.1)';
            card.style.border = '1px solid #dee2e6';
        });
        
        cardHeaders.forEach(header => {
            header.style.background = 'linear-gradient(90deg, #007bff, #0056b3)';
        });
        
        if (sidebar) {
            sidebar.style.background = '#ffffff';
            sidebar.style.borderRight = '1px solid #dee2e6';
        }
        
        document.getElementById('current-theme-name').textContent = '浅色商务风';
        alert('✅ 已切换到浅色商务风主题！');
    } else {
        // 暗黑科技风（恢复默认）
        body.style.background = 'linear-gradient(135deg, #0c1929 0%, #1a2a4a 100%)';
        body.style.color = '#e0e6ed';
        
        cards.forEach(card => {
            card.style.background = 'rgba(16, 30, 52, 0.95)';
            card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            card.style.border = '1px solid rgba(0, 212, 255, 0.15)';
        });
        
        cardHeaders.forEach(header => {
            header.style.background = 'linear-gradient(90deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 136, 0.1))';
        });
        
        if (sidebar) {
            sidebar.style.background = 'rgba(12, 25, 41, 0.95)';
            sidebar.style.borderRight = '1px solid rgba(0, 212, 255, 0.2)';
        }
        
        document.getElementById('current-theme-name').textContent = '暗黑科技风';
        alert('✅ 已切换到暗黑科技风主题！');
    }
}

// 自动轮播
let carouselTimer = null;
let countdownTimer = null;
let currentPageIndex = 0;
const carouselPages = ['overview', 'topology', 'map', 'health', 'renewable', 'simulation', 'forecast', 'monitoring'];

function startCarousel() {

    if (carouselTimer) {
        alert('轮播已在进行中！');
        return;
    }
    
    const statusEl = document.getElementById('carousel-status');
    if (statusEl) statusEl.style.display = 'block';
    
    const interval = parseInt(document.getElementById('carousel-interval').value) || 8000;
    
    alert('✅ 自动轮播已启动！\n\n轮播页面：8 个核心功能\n切换间隔：' + (interval/1000) + ' 秒\n\n点击「停止轮播」可随时结束');
    
    currentPageIndex = 0;
    doCarousel();
    
    carouselTimer = setInterval(doCarousel, interval);
}

function doCarousel() {
    const page = carouselPages[currentPageIndex];
    
    // 切换页面
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.dataset.page === page) {
            item.click();
        }
    });
    
    // 更新倒计时
    updateCountdown();
    
    // 下一页
    currentPageIndex = (currentPageIndex + 1) % carouselPages.length;
}

function updateCountdown() {
    const interval = parseInt(document.getElementById('carousel-interval').value) / 1000 || 8;
    let countdown = interval;
    
    const countdownEl = document.getElementById('carousel-countdown');
    if (countdownEl) countdownEl.textContent = countdown;
    
    if (countdownTimer) clearInterval(countdownTimer);
    
    countdownTimer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = Math.max(0, countdown);
        if (countdown <= 0) countdown = interval;
    }, 1000);
}

function stopCarousel() {
    if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    const statusEl = document.getElementById('carousel-status');
    if (statusEl) statusEl.style.display = 'none';
    
    // 返回设置页面
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            if (item.dataset.page === 'settings') {
                item.click();
            }
        });
    }, 100);
    
    alert('✅ 自动轮播已停止！');
}
