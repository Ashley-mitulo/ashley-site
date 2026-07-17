// 智能优化模块 - 已整合到堆场管理页面
// 所有功能请在【堆场管理】页面查看

function renderOptimization(container) {
    container.innerHTML = `
        <div class="page-title">🧠 智能优化系统</div>
        
        <div class="port-card" style="text-align: center; padding: 50px 30px;">
            <div style="font-size: 80px; margin-bottom: 30px;">📦</div>
            <h2 style="color: #00d4ff; margin-bottom: 20px;">功能已整合到【堆场管理】</h2>
            <p style="color: #7a9aba; font-size: 15px; line-height: 1.8; margin-bottom: 30px;">
                「算法原理」和「CRP可视化模拟器」功能已移动到【堆场管理】页面<br>
                请点击左侧导航栏的【堆场管理】查看
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <div style="padding: 15px 25px; background: rgba(0,255,136,0.1); border-radius: 8px;">
                    <div style="color: #00ff88; font-size: 16px; font-weight: 700;">📖 算法原理</div>
                    <div style="color: #7a9aba; font-size: 12px; margin-top: 5px;">堆场管理 → 第3个标签页</div>
                </div>
                <div style="padding: 15px 25px; background: rgba(0,212,255,0.1); border-radius: 8px;">
                    <div style="color: #00d4ff; font-size: 16px; font-weight: 700;">🔬 CRP可视化模拟器</div>
                    <div style="color: #7a9aba; font-size: 12px; margin-top: 5px;">堆场管理 → 第4个标签页</div>
                </div>
            </div>
        </div>
    `;
}

console.log('Optimization module loaded - functions moved to yard.js');
