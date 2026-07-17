
// 渲染交通事故分析知识图谱 - 完整实现（含5大功能）
function renderAccidentKnowledgeGraph() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <style>
      #accKgBrowseContainer * { margin: 0; padding: 0; box-sizing: border-box; }
      #accKgBrowseContainer { display: flex; flex-direction: column; height: calc(100vh - 200px); gap: 16px; padding: 0; }
      /* Tab切换样式 */
      .accKg-tabs { display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0; flex-shrink: 0; }
      .accKg-tab { padding: 10px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-bottom: none; border-radius: 8px 8px 0 0; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; color: #64748b; }
      .accKg-tab:hover { background: #f1f5f9; }
      .accKg-tab.active { background: #fff; color: #2563eb; border-color: #2563eb; border-bottom: 2px solid #fff; margin-bottom: -2px; }
      .accKg-tab-content { display: none; flex: 1; min-height: 0; }
      .accKg-tab-content.active { display: flex; }
      /* 三栏布局 */
      .accKg-main-row { display: flex; flex: 1; gap: 16px; height: 100%; min-height: 0; }
      #accKgLegendPanel { width: 200px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 220px); overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #94a3b8 #e2e8f0; flex-shrink: 0; }
      .accKg-panel-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; color: #1e293b; }
      #accKgLegendPanel::-webkit-scrollbar { width: 8px; }
      #accKgLegendPanel::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 10px; }
      #accKgLegendPanel::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
      .accKg-legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border-radius: 6px; transition: all 0.2s; border: 1px solid #e2e8f0; }
      .accKg-legend-color { width: 20px; height: 20px; border-radius: 4px; }
      .accKg-graph-container { flex: 1; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; position: relative; min-height: 400px; }
      #accidentKnowledgeGraph { width: 100%; height: 100%; position: relative; z-index: 1; cursor: grab !important; }
      #accidentKnowledgeGraph:active { cursor: grabbing !important; }
      #accidentTimeline { width: 100%; height: 100%; position: relative; }
      #accidentHeatmap { width: 100%; height: 100%; position: relative; }
      #accidentCluster { width: 100%; height: 100%; position: relative; overflow-y: auto; padding: 20px; }
      #accKgPropertyPanel { width: 260px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; flex-shrink: 0; }
      .accKg-empty-state { text-align: center; margin-top: 40px; opacity: 0.5; color: #64748b; }
      .accKg-entity-info { display: none; }
      .accKg-entity-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
      .accKg-entity-icon { width: 36px; height: 36px; border-radius: 50%; border: 3px solid rgba(0,0,0,0.1); }
      .accKg-entity-name { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
      .accKg-entity-type { font-size: 11px; padding: 2px 6px; border-radius: 8px; background: #e2e8f0; display: inline-block; color: #475569; }
      .accKg-properties-list { display: flex; flex-direction: column; gap: 10px; }
      .accKg-property-item { background: #fff; padding: 10px; border-radius: 6px; border-left: 3px solid var(--prop-color); }
      .accKg-property-name { font-size: 11px; color: #64748b; margin-bottom: 3px; }
      .accKg-property-value { font-size: 13px; font-weight: 500; color: #1e293b; }
      .accKg-toolbar { position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; gap: 6px; }
      .accKg-upload-area { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; transition: all 0.2s; max-width: 180px; }
      .accKg-upload-btn { width: 100%; padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(46, 204, 113, 0.6); color: #fff; cursor: pointer; font-size: 11px; margin-bottom: 4px; }
      .accKg-upload-btn:hover { background: rgba(46, 204, 113, 0.8); }
      .accKg-parse-btn { background: rgba(155, 89, 182, 0.6); }
      .accKg-file-input { display: none; }
      .accKg-tool-btn { width: 32px; height: 32px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; }
      .accKg-loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); padding: 24px 40px; border-radius: 12px; text-align: center; display: none; z-index: 100; color: #fff; }
      .accKg-loading.show { display: block; }
      .accKg-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #2ECC71; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .accKg-hint { margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; opacity: 0.6; line-height: 1.6; color: #64748b; }
      .accKg-toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%) translateY(-100%); padding: 10px 20px; border-radius: 8px; background: rgba(0,0,0,0.8); color: #fff; font-size: 13px; z-index: 2000; opacity: 0; transition: all 0.3s; }
      .accKg-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
      .accKg-toast.success { background: rgba(46, 204, 113, 0.9); }
      .accKg-toast.error { background: rgba(231, 76, 60, 0.9); }
      /* 时间轴样式 */
      .timeline-container { padding: 20px; height: 100%; overflow-y: auto; }
      .timeline-item { position: relative; padding-left: 30px; padding-bottom: 30px; border-left: 2px solid #e2e8f0; }
      .timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
      .timeline-dot { position: absolute; left: -8px; top: 0; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .timeline-dot.level-1 { background: #10b981; }
      .timeline-dot.level-2 { background: #f59e0b; }
      .timeline-dot.level-3 { background: #ef4444; }
      .timeline-date { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
      .timeline-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .timeline-title { font-weight: 600; color: #1e293b; margin-bottom: 6px; }
      .timeline-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; flex-wrap: wrap; }
      .timeline-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
      .tag-type { background: #dbeafe; color: #1d4ed8; }
      .tag-weather { background: #dcfce7; color: #15803d; }
      .tag-cause { background: #fef3c7; color: #b45309; }
      .tag-level { background: #fee2e2; color: #dc2626; }
      /* 聚类分析样式 */
      .cluster-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      .cluster-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .cluster-title { font-weight: 600; color: #1e293b; font-size: 15px; }
      .cluster-count { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .cluster-locations { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .cluster-location { font-size: 11px; padding: 3px 8px; background: #f1f5f9; border-radius: 4px; color: #475569; }
    </style>

    <div id="accKgBrowseContainer">
      <!-- Tab切换 -->
      <div class="accKg-tabs">
        <button class="accKg-tab active" data-tab="graph" onclick="accKgSwitchTab('graph')">🧩 知识图谱</button>
        <button class="accKg-tab" data-tab="timeline" onclick="accKgSwitchTab('timeline')">📅 事故时间轴</button>
        <button class="accKg-tab" data-tab="heatmap" onclick="accKgSwitchTab('heatmap')">🗺️ 事故热力图</button>
        <button class="accKg-tab" data-tab="cluster" onclick="accKgSwitchTab('cluster')">📊 聚类分析</button>
        <button class="accKg-tab" data-tab="upload" onclick="accKgSwitchTab('upload')">📄 报告解析</button>
      </div>

      <div class="accKg-main-row">
        <!-- 左侧面板（仅图谱和报告解析显示） -->
        <div id="accKgLegendPanel">
          <h3 class="accKg-panel-title">🎨 实体类型图例</h3>
          <div class="space-y-2 mb-4 pb-3 border-b border-gray-200" id="accKgLegendList">
            ${Object.entries(accidentEntityTypes).map(([type, info]) => `
              <div class="flex items-center gap-2 p-2">
                <div class="accKg-legend-color" style="background-color: ${info.color}; width: 16px; height: 16px; border-radius: 50%;"></div>
                <span class="text-sm">${info.name}</span>
              </div>
            `).join('')}
          </div>
          <div class="accKg-hint" id="accKgHint"><strong>操作提示:</strong><br>• 拖拽节点可移动位置<br>• 滚轮缩放视图<br>• 点击节点查看详情</div>
        </div>

        <!-- 中间内容区域 -->
        <div class="accKg-graph-container">
          <!-- 图谱Tab -->
          <div id="tab-graph" class="accKg-tab-content active">
            <div class="accKg-toolbar">
              <button class="accKg-tool-btn" onclick="accKgResetView()" title="🔄 重置视图">🔄</button>
              <button class="accKg-tool-btn" onclick="accKgRenderGraph()" title="🔃 刷新图谱">🔃</button>
            </div>
            <div id="accidentKnowledgeGraph"></div>
          </div>
          
          <!-- 时间轴Tab -->
          <div id="tab-timeline" class="accKg-tab-content">
            <div id="accidentTimeline" class="timeline-container">
              <div class="accKg-loading" id="timelineLoading"><div class="accKg-spinner"></div><div>加载中...</div></div>
            </div>
          </div>
          
          <!-- 热力图Tab -->
          <div id="tab-heatmap" class="accKg-tab-content">
            <div id="accidentHeatmap