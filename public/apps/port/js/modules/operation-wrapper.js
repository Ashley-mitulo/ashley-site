// ============================================
// 作业监控 - Tab 包装器（v1.10 → 双模式）
// 用 iframe 隔离两个 operation 模块，确保互不污染 window
// ============================================

window.__operationActiveMode = window.__operationActiveMode || '1';

function renderOperationWrapper(container) {
    const activeMode = window.__operationActiveMode || '1';

    const tabBtn = (mode, label) => {
        const active = mode === activeMode;
        const bg = active ? 'linear-gradient(135deg,#00c8ff 0%, #0078d4 100%)' : 'rgba(255,255,255,0.05)';
        const color = active ? '#fff' : '#a8b4d4';
        const border = active ? '#00c8ff' : 'rgba(255,255,255,0.1)';
        return `<button onclick="switchOperationMode('${mode}')" style="
            padding: 10px 24px;
            background: ${bg};
            color: ${color};
            border: 1px solid ${border};
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
        ">${label}</button>`;
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; width:100%;">
            <!-- Tab 头（sticky，滚动不遮挡） -->
            <div style="
                position: sticky;
                top: 0;
                z-index: 100;
                display:flex;
                gap: 4px;
                padding: 0 15px;
                border-bottom: 2px solid #00c8ff;
                background: rgba(10,14,26,0.95);
                backdrop-filter: blur(8px);
            ">
                ${tabBtn('1', '🔵 作业监控模式1')}
                ${tabBtn('2', '🟣 作业监控模式2')}
                <div style="flex:1"></div>
                <div style="padding: 10px 8px; color:#7a9aba; font-size:11px;">
                    当前：模式${activeMode} ｜ 两个模式相互独立，互不影响
                </div>
            </div>
            <!-- 内容（iframe 隔离）— 高度动态随iframe内容自适应 -->
            <iframe
                id="operation-iframe"
                src="operation-mode.html?mode=${activeMode}&t=${Date.now()}"
                style="width:100%; min-height:3200px; border:none; background:#0a0e1a; display:block;"
                onload="resizeOperationIframe()"
            ></iframe>
        </div>
    `;
}

window.switchOperationMode = function(mode) {
    if (window.__operationActiveMode === mode) return;
    window.__operationActiveMode = mode;
    const container = document.getElementById('page-content');
    if (container) renderOperationWrapper(container);
};

// iframe 内容高度自适应（避免双重滚动条、保证能滚到底）
window.resizeOperationIframe = function() {
    const iframe = document.getElementById('operation-iframe');
    if (!iframe) return;
    const fit = () => {
        try {
            const doc = iframe.contentDocument;
            if (!doc || !doc.body) return;
            const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 1200);
            iframe.style.height = (h + 40) + 'px';
        } catch (e) { /* 跨域忽略 */ }
    };
    fit();
    // 定期重算，应对内部动态渲染后的高度变化
    if (iframe._fitTimer) clearInterval(iframe._fitTimer);
    iframe._fitTimer = setInterval(fit, 1000);
};

// 暴露给路由
window.renderOperation = renderOperationWrapper;
