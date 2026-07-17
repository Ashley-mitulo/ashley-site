async function renderDataIngest(root) {
  root.innerHTML = `
    <div class="card ingest-hero">
      <h3>📥 正式数据接入</h3>
      <p class="muted">这是交通智能体从模拟原型走向真实应用的数据入口。支持导入交通运行日报、执法台账、车辆台账、企业信用清单、路网事件表等文件；系统会解析原始内容，抽取路段、车辆、企业、事件、知识条目等对象，并沉淀到本地 SQLite 数据库，供后续智能问答、诊断和报告生成调用。</p>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <h3>上传文件</h3>
        <div class="toolbar">
          <select id="ingestSourceType" class="select">
            <option value="auto">自动识别数据类型</option>
            <option value="daily_report">交通运行日报</option>
            <option value="enforcement_ledger">执法台账</option>
            <option value="vehicle_ledger">车辆台账</option>
            <option value="company_credit">企业信用清单</option>
            <option value="road_event">路网事件表</option>
          </select>
        </div>
        <input id="ingestFile" class="input" type="file" accept=".json,.csv,.xlsx,.xls,.txt,.md,.docx,.pdf" />
        <p class="muted" style="line-height:1.7">支持 .json、.csv、.xlsx/.xls、.txt、.md、.docx；如后端 pdf-parse 可用也支持 .pdf。解析不出的内容也会以 raw 文档/文本片段入库，不丢失原始信息。</p>
        <button id="ingestUploadBtn" class="btn">开始上传解析入库</button>
        <div id="ingestMsg" style="margin-top:12px"></div>
      </div>
      <div class="card">
        <h3>入库统计</h3>
        <div id="ingestStats">加载中...</div>
      </div>
    </div>
    <div id="ingestResult" style="margin-top:16px"></div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><h3>最近上传批次</h3><div id="ingestBatches">加载中...</div></div>
      <div class="card"><h3>入库实体预览</h3><div class="toolbar"><input id="entityKeyword" class="input" placeholder="按关键词检索，如 鲁A、G20、物流"/><select id="entityType" class="select"><option value="">全部类型</option><option value="road">road 路段</option><option value="vehicle">vehicle 车辆</option><option value="company">company 企业</option><option value="driver">driver 司机</option><option value="event">event 事件</option><option value="knowledge">knowledge 知识</option><option value="logistics">logistics 物流</option><option value="enforcement">enforcement 执法</option><option value="unknown">unknown 未识别</option></select><button id="entitySearchBtn" class="btn secondary">查询</button></div><div id="ingestEntities">加载中...</div></div>
    </div>`;

  async function loadStats() {
    const stats = await api('/data-ingest/stats');
    root.querySelector('#ingestStats').innerHTML = `<div class="grid grid-3">${metric('上传批次', stats.batches.total || 0, `成功 ${stats.batches.completed || 0} / 失败 ${stats.batches.failed || 0}`, 'cyan')}${metric('原始记录', stats.records || 0, 'records / chunks', 'green')}${metric('抽取实体', stats.entities || 0, 'entities', 'yellow')}</div><div style="margin-top:10px">${(stats.entityTypeBreakdown || []).map(x => tag(`${x.entity_type}: ${x.count}`, x.entity_type === 'unknown' ? '中' : '低')).join('') || '<span class="muted">暂无实体</span>'}</div>`;
  }
  async function loadBatches() {
    const batches = await api('/data-ingest/batches?limit=10');
    root.querySelector('#ingestBatches').innerHTML = batches.length ? table(['批次', '文件', '状态', '记录/实体'], batches.map(b => `<tr><td>#${b.id}<br><span class="muted">${b.batch_no}</span></td><td>${b.original_name}<br><span class="muted">${b.parser_type || '-'}</span></td><td>${tag(b.status, b.status === 'failed' ? '高' : '低')}</td><td>${b.record_count}/${b.entity_count}</td></tr>`)) : '<div class="muted">暂无上传批次</div>';
  }
  async function loadEntities() {
    const keyword = encodeURIComponent(root.querySelector('#entityKeyword')?.value || '');
    const type = encodeURIComponent(root.querySelector('#entityType')?.value || '');
    const entities = await api(`/data-ingest/entities?keyword=${keyword}&type=${type}&limit=20`);
    root.querySelector('#ingestEntities').innerHTML = entities.length ? table(['类型', '名称', '来源片段'], entities.map(e => `<tr><td>${tag(e.entity_type, e.entity_type === 'unknown' ? '中' : '低')}</td><td>${e.name}</td><td><span class="muted">${(e.source_text || '').slice(0, 90)}</span></td></tr>`)) : '<div class="muted">暂无实体，可先上传文件。</div>';
  }
  function showError(message) { root.querySelector('#ingestMsg').innerHTML = `<div class="red">${message}</div>`; }

  root.querySelector('#ingestUploadBtn').addEventListener('click', async () => {
    const file = root.querySelector('#ingestFile').files[0];
    if (!file) return showError('请先选择要上传的文件。');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sourceType', root.querySelector('#ingestSourceType').value);
    root.querySelector('#ingestMsg').innerHTML = '<span class="cyan">上传解析中，请稍候...</span>';
    root.querySelector('#ingestResult').innerHTML = '';
    // [静态部署] 本地演示环境：模拟一个失败结果，提示用户本地部署
    if (typeof STATIC_API_MAP !== 'undefined') {
      setTimeout(() => {
        root.querySelector('#ingestMsg').innerHTML = '<div class="card" style="border:1px solid #f6c85f;background:rgba(246,200,95,.08);padding:12px"><b>静态展示环境不支持文件解析入库</b><br><span class="muted">此页为 Cloudflare Pages 静态部署，处于展示模式，无法写 SQLite。<br>如需体验完整数据接入：下载独立版 <code>transport-agent-system</code>，本地 <code>npm start</code> 后访问 <code>http://localhost:3009</code> 同页上传即可。</span></div>';
      }, 400);
      return;
    }
    try {
      const res = await fetch(`${API}/data-ingest/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '上传失败');
      const b = json.data;
      root.querySelector('#ingestMsg').innerHTML = '<span class="green">上传解析入库成功。</span>';
      root.querySelector('#ingestResult').innerHTML = `<div class="card"><h3>解析结果摘要</h3><div class="grid grid-4">${metric('批次号', `#${b.id}`, b.batch_no, 'cyan')}${metric('记录数', b.record_count, '原始行/文本片段', 'green')}${metric('实体数', b.entity_count, '结构化对象', 'yellow')}${metric('解析器', b.parser_type || '-', b.original_name, 'cyan')}</div><div style="margin-top:12px"><b>识别类型统计：</b>${Object.entries(b.type_stats || {}).map(([k, v]) => tag(`${k}: ${v}`, k === 'unknown' ? '中' : '低')).join('') || '<span class="muted">暂无</span>'}</div></div>`;
      await Promise.all([loadStats(), loadBatches(), loadEntities()]);
    } catch (e) { showError(e.message); }
  });
  root.querySelector('#entitySearchBtn').addEventListener('click', loadEntities);
  await Promise.all([loadStats(), loadBatches(), loadEntities()]);
}
