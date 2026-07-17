// ==================== 6. 事故报告库 ====================
// 10篇事故报告完整数据
const accidentReports = [
  {
    id: 1,
    title: '长江路追尾事故报告',
    date: '2026-06-15 08:30',
    location: '长江路与中山路交叉口向北50米处',
    type: '追尾',
    level: '一般事故',
    persons: ['张伟', '李娜'],
    vehicles: ['苏A12345', '苏B67890'],
    weather: '晴',
    violation: '未保持安全车距',
    injury: '轻微伤2人',
    description: '2026年6月15日早高峰时段，张伟驾驶车牌号为苏A12345的白色轿车，在长江路与中山路交叉口向北50米处，因未与前车保持安全车距，追尾李娜驾驶的车牌号为苏B67890的黑色SUV。事故造成双方车辆尾部和前部不同程度受损，张伟和李娜均受轻微伤，已送往附近医院检查治疗。经交警现场勘查认定，张伟因未保持安全车距导致追尾事故，应负全部责任。双方已达成赔偿协议，由张伟投保的保险公司承担全部维修费用。'
  },
  {
    id: 2,
    title: '黄河路闯红灯事故报告',
    date: '2026-06-14 14:20',
    location: '黄河路与上海路交叉口',
    type: '闯红灯',
    level: '一般事故',
    persons: ['王强', '赵敏', '刘芳'],
    vehicles: ['苏A12345', '苏C54321'],
    weather: '多云',
    violation: '闯红灯',
    injury: '轻伤1人，轻微伤2人',
    description: '2026年6月14日下午14时20分，王强驾驶车牌号为苏A12345的白色轿车，在黄河路与上海路交叉口由西向东行驶时，无视红灯指示强行通过路口，与由南向北正常行驶的赵敏驾驶的苏C54321出租车相撞。出租车乘客刘芳受轻伤，王强和赵敏均受轻微伤。三人均已送医救治。经交警调取路口监控确认，王强闯红灯是造成事故的直接原因，应负全部责任。王强被依法处以罚款200元、记6分的行政处罚。'
  },
  {
    id: 3,
    title: '长江路车辆侧翻事故报告',
    date: '2026-06-13 22:15',
    location: '长江路快速路出口匝道',
    type: '侧翻',
    level: '较大事故',
    persons: ['陈明'],
    vehicles: ['苏D88888'],
    weather: '晴',
    violation: '弯道超速行驶',
    injury: '重伤1人',
    description: '2026年6月13日晚22时15分，陈明驾驶车牌号为苏D88888的黑色奔驰轿车，在长江路快速路出口匝道处因车速过快，操作不当导致车辆失控侧翻。事故造成陈明重伤，被紧急送往市第一医院抢救，暂无生命危险。经现场勘查和车速鉴定，陈明在进入匝道时时速高达85公里，远超匝道限速40公里/小时的规定。侧翻车辆严重损毁，路政设施也受到一定损坏。陈明因弯道超速行驶负全部责任，待伤情稳定后将接受进一步处理。'
  },
  {
    id: 4,
    title: '中山路变道剐蹭事故报告',
    date: '2026-06-12 17:45',
    location: '中山路与广州路交叉口',
    type: '变道剐蹭',
    level: '轻微事故',
    persons: ['李娜', '周杰'],
    vehicles: ['苏B67890', '苏E24680'],
    weather: '阴',
    violation: '变更车道影响正常行驶车辆',
    injury: '无人员伤亡',
    description: '2026年6月12日晚高峰17时45分，李娜驾驶车牌号为苏B67890的黑色SUV，在中山路与广州路交叉口准备右转时，未观察后视镜便从直行车道强行变道至右转车道，与周杰驾驶的正常行驶的苏E24680白色面包车发生剐蹭。事故造成两车车身不同程度划痕，无人员伤亡。交警到场后认定，李娜在变更车道时影响了正常行驶的车辆，应负事故全部责任。双方同意走快速理赔程序，由李娜承担周杰车辆的维修费用。'
  },
  {
    id: 5,
    title: '黄河路酒驾肇事事故报告',
    date: '2026-06-11 23:30',
    location: '黄河路酒吧一条街路段',
    type: '酒驾',
    level: '一般事故',
    persons: ['吴涛', '张伟'],
    vehicles: ['苏F13579', '苏A12345'],
    weather: '晴',
    violation: '醉酒驾驶',
    injury: '轻伤2人',
    description: '2026年6月11日晚23时30分，吴涛饮酒后驾驶车牌号为苏F13579的红色宝马轿车，在黄河路酒吧一条街路段行驶时，失控撞上停在路边的张伟所有的苏A12345白色轿车。事故造成吴涛和路过行人各受轻伤。交警到场后对吴涛进行呼气式酒精检测，结果为152mg/100ml，涉嫌醉酒驾驶。经血检确认后，吴涛被依法刑事拘留。事故责任认定吴涛因醉酒驾驶负全部责任，其驾驶证将被吊销，且五年内不得重新取得，并将依法追究其刑事责任。'
  },
  {
    id: 6,
    title: '绕城公路超速追尾事故报告',
    date: '2026-06-10 16:00',
    location: '绕城公路东向38公里处',
    type: '超速追尾',
    level: '一般事故',
    persons: ['郑磊', '王芳'],
    vehicles: ['苏G97531', '苏H86420'],
    weather: '多云',
    violation: '超速行驶',
    injury: '轻伤1人，轻微伤1人',
    description: '2026年6月10日下午16时，郑磊驾驶车牌号为苏G97531的重型货车，在绕城公路东向38公里处，因超速行驶未能及时制动，追尾前方因拥堵减速的王芳驾驶的苏H86420小型轿车。事故造成王芳轻伤，郑磊受轻微伤。经车速鉴定，事发时郑磊驾驶的货车时速达98公里，超过该路段80公里/小时的限速规定。交警认定郑磊因超速行驶负事故全部责任，并对其处以罚款200元、记6分的处罚。同时，郑磊因未确保安全车距被批评教育。'
  },
  {
    id: 7,
    title: '京沪高速疲劳驾驶事故报告',
    date: '2026-06-09 05:10',
    location: '京沪高速上海方向256公里处',
    type: '疲劳驾驶',
    level: '一般事故',
    persons: ['孙鹏'],
    vehicles: ['苏J75319'],
    weather: '晴',
    violation: '疲劳驾驶',
    injury: '轻伤1人',
    description: '2026年6月9日凌晨5时10分，孙鹏驾驶车牌号为苏J75319的长途货运卡车，在京沪高速上海方向256公里处，因连续驾驶超过6小时未休息，处于严重疲劳状态，车辆失控撞上右侧护栏。事故造成孙鹏轻伤，车辆和护栏严重受损。交警到场后调取车载GPS和行车记录仪数据，确认孙鹏已连续驾驶8小时，违反了连续驾驶不得超过4小时的规定。孙鹏因疲劳驾驶负事故全部责任，被依法处以罚款200元、记12分的处罚，并被强制要求休息。'
  },
  {
    id: 8,
    title: '上海路逆行撞车事故报告',
    date: '2026-06-08 19:20',
    location: '上海路与北京东路交叉口',
    type: '逆行',
    level: '一般事故',
    persons: ['马超', '刘芳'],
    vehicles: ['苏K42680', '苏C54321'],
    weather: '多云',
    violation: '逆向行驶',
    injury: '轻伤1人，轻微伤1人',
    description: '2026年6月8日晚19时20分，马超驾驶车牌号为苏K42680的银灰色轿车，在上海路与北京东路交叉口因对路况不熟悉，错误驶入对向车道逆行，与正常行驶的刘芳驾驶的苏C54321出租车相撞。事故造成马超受轻伤，出租车驾驶员刘芳受轻微伤。交警到场后根据现场痕迹和证人证言认定，马超逆向行驶是造成事故的根本原因，应负全部责任。马超被依法处以罚款200元、记3分的行政处罚。双方就赔偿事宜已达成初步协议。'
  },
  {
    id: 9,
    title: '广州路闯黄灯转红灯事故报告',
    date: '2026-06-07 12:10',
    location: '广州路与深圳大道交叉口',
    type: '闯黄灯',
    level: '一般事故',
    persons: ['黄磊', '赵敏'],
    vehicles: ['苏L15973', '苏C54321'],
    weather: '晴',
    violation: '闯黄灯加速通过',
    injury: '轻微伤2人',
    description: '2026年6月7日中午12时10分，黄磊驾驶车牌号为苏L15973的商务车，在广州路与深圳大道交叉口看到黄灯亮起后不仅不减速停车，反而加速试图通过路口，在黄灯转红灯的瞬间仍继续行驶，与横向刚变绿灯起步的赵敏驾驶的苏C54321出租车发生碰撞。事故造成黄磊和赵敏均受轻微伤，两车车头均有损坏。交警调取监控后认定，黄磊在黄灯亮起时未越过停止线却加速通过，实际构成闯红灯行为，负事故主要责任；赵敏起步时观察不周，负次要责任。黄磊被处以罚款200元、记6分。'
  },
  {
    id: 10,
    title: '长江路雨天打滑事故报告',
    date: '2026-06-06 09:45',
    location: '长江路积水路段',
    type: '雨天打滑',
    level: '一般事故',
    persons: ['周杰', '陈明'],
    vehicles: ['苏E24680', '苏D88888'],
    weather: '暴雨',
    violation: '雨天未降低行驶速度',
    injury: '轻伤1人，轻微伤1人',
    description: '2026年6月6日上午9时45分，南京遭遇暴雨天气，长江路部分路段积水严重。周杰驾驶车牌号为苏E24680的白色面包车，在经过积水路段时未按规定降低行驶速度，导致车辆打滑失控，撞上正常行驶的陈明驾驶的苏D88888奔驰轿车。事故造成周杰受轻伤，陈明受轻微伤。交警现场勘查认定，周杰在雨天行车时未降低行驶速度是造成事故的主要原因，应负主要责任；陈明车速偏快，观察不足，负次要责任。周杰被处以罚款100元的行政处罚。双方车辆损失由各自保险公司按责任比例赔付。'
  }
];

function getReportCreator(report) {
  return report.creator || report.source || (Number(report.id) <= 10 ? 'writing小虾' : '文档小虾');
}

function getReportId(report, index) {
  return report.id || ('local' + String(index + 1).padStart(3, '0'));
}

// 异步加载文档小虾生成的100篇报告；文件未生成时静默保留当前10篇
function loadExtraReports() {
  if (typeof fetch !== 'function') return;
  fetch('/data/accident-reports-extra-100.json?v=' + Date.now())
    .then(res => res.ok ? res.json() : [])
    .then(extra => {
      if (!Array.isArray(extra) || !extra.length) return;
      mergeReportsUnique(extra);
      mergeReportsUnique(loadLocalReportsFromStorage());
      reloadServerReports();
      if (graphEntryAutoMode) graphEntryReportId = getLatestReportId();
      refreshAllAnalysis();
    })
    .catch(() => {});
}

// 初始化报告库：默认只展示表格摘要，点击单条报告再看详情
function initReports() {
  const container = document.getElementById('reportsList');
  if (!container) return;
  const filteredReports = getSortedReports(accidentReports.filter(r => reportMatchesQuery(r, reportFilterText)));
  const countEl = document.getElementById('reportCount');
  if (countEl) countEl.textContent = filteredReports.length + ' / ' + accidentReports.length;
  
  let html = '';
  filteredReports.forEach((report, index) => {
    const id = getReportId(report, accidentReports.indexOf(report));
    const creator = getReportCreator(report);
    html += '<tr onclick="showReportDetail(\'' + escapeHtml(id) + '\')">';
    html += '<td><strong>' + escapeHtml(report.title) + '</strong></td>';
    html += '<td>' + escapeHtml(report.date) + '</td>';
    html += '<td>' + escapeHtml(getUploadTime(report)) + '</td>';
    html += '<td><span class="report-tag">' + escapeHtml(creator) + '</span></td>';
    html += '<td><span class="report-tag">' + escapeHtml(report.type || '未分类') + '</span></td>';
    html += '<td>' + escapeHtml(report.level || '未定级') + '</td>';
    html += '<td>' + escapeHtml(report.location || '') + '</td>';
    html += '<td onclick="event.stopPropagation()" style="white-space:nowrap;"><button onclick="viewReportLocalGraph(\'' + escapeHtml(id) + '\')" style="padding:5px 8px;border:none;border-radius:6px;background:#dbeafe;color:#1d4ed8;cursor:pointer;">图谱</button> <button onclick="editReport(\'' + escapeHtml(id) + '\')" style="padding:5px 8px;border:none;border-radius:6px;background:#fef3c7;color:#92400e;cursor:pointer;">编辑</button> <button onclick="deleteReport(\'' + escapeHtml(id) + '\')" style="padding:5px 8px;border:none;border-radius:6px;background:#fee2e2;color:#b91c1c;cursor:pointer;">删除</button></td>';
    html += '</tr>';
  });
  
  container.innerHTML = html;
}

function viewReportLocalGraph(reportId) {
  graphEntryAutoMode = false;
  graphEntryReportId = String(reportId || '') || getLatestReportId();
  graphExpandedNodeId = null;
  graphFocusedNodeId = null;
  refreshGraphAccidentOptions();
  const select = document.getElementById('graphAccidentSelect');
  if (select) select.value = graphEntryReportId;
  switchTab('graph');
  setTimeout(() => {
    applyGraphEntry();
    renderSelectedNodeRelations('acc_' + safeId(graphEntryReportId));
  }, 120);
}


function findReportById(reportId) {
  return accidentReports.find((r, i) => String(getReportId(r, i)) === String(reportId));
}

async function deleteReport(reportId) {
  const report = findReportById(reportId);
  if (!report) return alert('未找到报告');
  if (!confirm('确认删除报告：' + report.title + '？\n\n服务端报告将软删除；内置演示数据只会从当前页面隐藏。')) return;
  try {
    if (window.ReportsApi) await ReportsApi.remove(reportId);
    else await apiJson('/api/reports/' + encodeURIComponent(reportId), { method: 'DELETE' });
  } catch (err) {
    console.warn('服务端删除失败，尝试仅本地删除：', err);
  }
  const idx = accidentReports.findIndex((r, i) => String(getReportId(r, i)) === String(reportId));
  if (idx >= 0) accidentReports.splice(idx, 1);
  persistCurrentLocalReports();
  refreshAllAnalysis();
  const panel = document.getElementById('reportDetailPanel');
  if (panel) panel.style.display = 'none';
}

function editReport(reportId) {
  const report = findReportById(reportId);
  const panel = document.getElementById('reportDetailPanel');
  if (!report || !panel) return alert('未找到报告');
  const field = (name, label, value) => '<label style="font-size:12px;color:#475569;font-weight:700;">' + label + '<input id="edit_' + name + '" value="' + escapeHtml(value || '') + '" style="width:100%;margin-top:4px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;"></label>';
  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div class="analysis-title" style="margin:0;">✏️ 编辑报告</div><button onclick="showReportDetail(\'' + escapeHtml(reportId) + '\')" style="border:none;background:#f1f5f9;color:#64748b;border-radius:8px;padding:8px 12px;cursor:pointer;">取消</button></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">';
  html += field('title', '标题', report.title);
  html += field('date', '事故时间', report.date);
  html += field('location', '地点', report.location);
  html += field('type', '事故类型', report.type);
  html += field('level', '等级', report.level);
  html += field('weather', '天气', report.weather);
  html += field('violation', '违法/争议', report.violation);
  html += field('injury', '伤亡', report.injury);
  html += field('liability', '责任认定', report.liability);
  html += field('persons', '当事人', (report.persons || []).join('、'));
  html += field('vehicles', '车辆', (report.vehicles || []).join('、'));
  html += '</div>';
  html += '<label style="display:block;font-size:12px;color:#475569;font-weight:700;margin-top:10px;">正文<textarea id="edit_description" style="width:100%;height:140px;margin-top:4px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;">' + escapeHtml(report.description || '') + '</textarea></label>';
  html += '<div style="margin-top:12px;text-align:right;"><button onclick="saveEditedReport(\'' + escapeHtml(reportId) + '\')" style="border:none;background:#10b981;color:#fff;border-radius:8px;padding:9px 16px;cursor:pointer;font-weight:800;">保存修改</button></div>';
  panel.innerHTML = html;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function saveEditedReport(reportId) {
  const old = findReportById(reportId);
  if (!old) return alert('未找到报告');
  const val = name => (document.getElementById('edit_' + name) || {}).value || '';
  const report = {
    ...old,
    title: val('title').trim() || old.title,
    date: val('date').trim() || old.date,
    location: val('location').trim() || old.location,
    type: val('type').trim() || old.type,
    level: val('level').trim() || old.level,
    weather: val('weather').trim() || old.weather,
    violation: val('violation').trim() || old.violation,
    injury: val('injury').trim() || old.injury,
    liability: val('liability').trim() || old.liability,
    persons: splitListValue(val('persons')),
    vehicles: splitListValue(val('vehicles')),
    description: val('description').trim() || old.description,
    source: old.source || 'server-json'
  };
  try {
    if (window.ReportsApi) await ReportsApi.update(reportId, report);
    else await apiJson('/api/reports/' + encodeURIComponent(reportId), { method: 'PUT', body: JSON.stringify(report) });
  } catch (err) {
    if (!confirm('服务端保存失败：' + err.message + '\n是否只在当前浏览器内更新？')) return;
  }
  upsertReportsUnique([report]);
  persistCurrentLocalReports();
  await reloadServerReports();
  refreshAllAnalysis();
  showReportDetail(reportId);
}

function exportReports(format) {
  if (format === 'csv') {
    window.open(window.ReportsApi ? ReportsApi.exportUrl('csv') : '/api/reports/export?format=csv', '_blank');
  } else {
    window.open(window.ReportsApi ? ReportsApi.exportUrl('json') : '/api/reports/export', '_blank');
  }
}

function importReportsFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      const reports = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : Array.isArray(parsed.reports) ? parsed.reports : [];
      if (!reports.length) return alert('未识别到报告数组');
      const data = window.ReportsApi ? await ReportsApi.importMany(reports) : await apiJson('/api/reports/import', { method: 'POST', body: JSON.stringify({ reports }) });
      await reloadServerReports();
      refreshAllAnalysis();
      alert('✅ 导入完成：新增 ' + data.added + ' 条，更新 ' + data.updated + ' 条，当前服务端 ' + data.total + ' 条');
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.readAsText(file, 'utf-8');
}

function renderReportRelationsPanel(report) {
  if (!report || !Array.isArray(report.relations) || !report.relations.length) return '';
  let html = '<div style="margin-top:14px;padding:14px;background:#fff;border:1px solid #dbeafe;border-radius:12px;">';
  html += '<div class="analysis-title">🔗 v2.9 原文关系证据链</div>';
  html += '<div style="display:grid;gap:8px;">';
  report.relations.slice(0, 18).forEach(rel => {
    const label = parserRelationLabel(rel.type);
    const strength = relationStrength[label] || { color: '#64748b' };
    html += '<div style="padding:9px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;line-height:1.55;">';
    html += '<strong style="color:' + strength.color + ';">' + escapeHtml(label) + '</strong>：' + escapeHtml(rel.source) + ' → ' + escapeHtml(rel.target);
    html += '<br><span style="color:#64748b;">置信度 ' + Math.round((rel.confidence || 0.75) * 100) + '% ｜ 规则 ' + escapeHtml(rel.ruleId || '未标注') + '</span>';
    if (rel.evidence) html += '<br><span style="color:#475569;">证据：' + escapeHtml(rel.evidence) + '</span>';
    html += '</div>';
  });
  if (report.relations.length > 18) html += '<div style="font-size:12px;color:#94a3b8;">仅展示前18条关系，图谱中可继续查看节点关联。</div>';
  html += '</div></div>';
  return html;
}

function showReportDetail(reportId) {
  const panel = document.getElementById('reportDetailPanel');
  if (!panel) return;
  const report = accidentReports.find((r, i) => String(getReportId(r, i)) === String(reportId));
  if (!report) return;
  const creator = getReportCreator(report);
  let html = '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px;">';
  html += '<div><div style="font-size:18px;font-weight:800;color:#1e293b;">' + escapeHtml(report.title) + '</div><div style="font-size:13px;color:#64748b;margin-top:4px;">📅 ' + escapeHtml(report.date) + ' ｜ ⬆️ 上传：' + escapeHtml(getUploadTime(report)) + ' ｜ 👤 创建人：' + escapeHtml(creator) + '</div></div>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;"><button onclick="viewReportLocalGraph(\'' + escapeHtml(reportId) + '\')" style="border:none;background:#2563eb;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:700;">从此报告查看局部图谱</button><button onclick="document.getElementById(\'reportDetailPanel\').style.display=\'none\'" style="border:none;background:#f1f5f9;color:#64748b;border-radius:8px;padding:8px 12px;cursor:pointer;">关闭</button></div>';
  html += '</div>';
  html += '<div class="report-detail-grid">';
  html += '<div class="detail-kv"><strong>事故类型：</strong>' + escapeHtml(report.type || '') + '</div>';
  html += '<div class="detail-kv"><strong>事故等级：</strong>' + escapeHtml(report.level || '') + '</div>';
  html += '<div class="detail-kv"><strong>天气：</strong>' + escapeHtml(report.weather || '') + '</div>';
  html += '<div class="detail-kv"><strong>地点：</strong>' + escapeHtml(report.location || '') + '</div>';
  html += '<div class="detail-kv"><strong>违法/过错行为：</strong>' + escapeHtml(report.violation || '') + '</div>';
  const detailFaultText = getReportFaultCategoryDetails(report).map(d => d.category + '：' + [...new Set([...(d.behaviors || []), ...(d.factors || [])])].join('、')).join('；');
  html += '<div class="detail-kv"><strong>过错大类：</strong>' + escapeHtml(detailFaultText || (report.faultCategories || []).join('、') || '') + '</div>';
  html += '<div class="detail-kv"><strong>伤亡情况：</strong>' + escapeHtml(report.injury || '') + '</div>';
  html += '<div class="detail-kv"><strong>当事人：</strong>' + escapeHtml((report.persons || []).join('、')) + '</div>';
  html += '<div class="detail-kv"><strong>车辆：</strong>' + escapeHtml((report.vehicles || []).join('、')) + '</div>';
  html += '<div class="detail-kv"><strong>责任认定：</strong>' + escapeHtml(report.liability || '') + '</div>';
  html += '</div>';
  html += '<div style="background:#f8fafc;border-radius:10px;padding:14px;color:#334155;line-height:1.8;font-size:14px;"><strong>报告正文：</strong><br>' + escapeHtml(report.description || '') + '</div>';
  html += renderReportRelationsPanel(report);
  panel.innerHTML = html;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

console.log('🚗 交通事故知识图谱 v3.3.2 弱链路缺口标注版已加载完成！');
// ===== 特性6：可解释性——抽取结果溯源到原文 span + 关键词高亮 =====
const EVIDENCE_TYPE_STYLE = {
  violation: { bg: '#fee2e2', border: '#f87171', color: '#b91c1c', label: '违法/过错' },
  fault_factor: { bg: '#fef3c7', border: '#fbbf24', color: '#b45309', label: '诱因' },
  liability: { bg: '#e0e7ff', border: '#818cf8', color: '#4338ca', label: '责任' },
  accident_type: { bg: '#dcfce7', border: '#4ade80', color: '#15803d', label: '事故形态' },
  injury: { bg: '#fce7f3', border: '#f472b6', color: '#be185d', label: '伤亡' }
};
function evidenceStyleFor(type) {
  return EVIDENCE_TYPE_STYLE[type] || { bg: '#f1f5f9', border: '#cbd5e1', color: '#475569', label: type };
}
function renderHighlightedText(text, entities) {
  const HL_TYPES = ['violation', 'fault_factor', 'liability', 'accident_type', 'injury'];
  const spans = (entities || [])
    .filter(e => HL_TYPES.includes(e.type) && Number.isFinite(e.start) && Number.isFinite(e.end) && e.end > e.start)
    .map(e => ({ start: e.start, end: e.end, type: e.type, name: e.normalizedName || e.name, conf: e.confidence, inferred: e.inferred }))
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let out = '', cursor = 0;
  spans.forEach(s => {
    if (s.start < cursor) return;
    out += escapeHtml(text.slice(cursor, s.start));
    const st = evidenceStyleFor(s.type);
    const title = st.label + ' · ' + escapeHtml(String(s.name || '')) + ' · 置信' + Math.round((Number(s.conf) || 1) * 100) + '%' + (s.inferred ? ' · 间接推断' : '');
    out += '<mark title="' + title + '" style="background:' + st.bg + ';border-bottom:2px solid ' + st.border + ';color:' + st.color + ';padding:0 1px;border-radius:3px;">' + escapeHtml(text.slice(s.start, s.end)) + (s.inferred ? '<sup style="font-size:9px;">推</sup>' : '') + '</mark>';
    cursor = s.end;
  });
  out += escapeHtml(text.slice(cursor));
  return out.replace(/\n/g, '<br>');
}
function renderSourceEvidence(advanced) {
  const text = (currentParsedReport && currentParsedReport.text) || '';
  const entities = (advanced && advanced.entities) || [];
  if (!text || !entities.length) return '';
  const HL_TYPES = ['violation', 'fault_factor', 'liability', 'accident_type', 'injury'];
  const evItems = entities.filter(e => HL_TYPES.includes(e.type) && Number.isFinite(e.start));
  let html = '<div style="margin-top:16px;padding:14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">';
  html += '<div style="font-weight:800;color:#1e293b;margin-bottom:6px;">🔍 可解释性：原文溯源高亮</div>';
  html += '<div style="font-size:12px;color:#64748b;margin-bottom:10px;">鼠标悬停高亮段可看到实体类型、规范名与置信度；带“推”上标的为间接推断。</div>';
  html += '<div style="font-size:14px;line-height:2;color:#0f172a;background:#f8fafc;padding:12px;border-radius:8px;">' + renderHighlightedText(text, entities) + '</div>';
  if (evItems.length) {
    html += '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;">';
    html += '<div style="font-weight:700;color:#334155;font-size:13px;">抽取证据清单（命中原文、句位、置信）</div>';
    evItems.sort((a, b) => (a.start - b.start)).forEach(e => {
      const st = evidenceStyleFor(e.type);
      const matched = text.slice(e.start, e.end);
      html += '<div style="display:flex;gap:8px;align-items:flex-start;font-size:12px;padding:6px 8px;background:' + st.bg + ';border-left:3px solid ' + st.border + ';border-radius:6px;">';
      html += '<span style="color:' + st.color + ';font-weight:700;white-space:nowrap;">' + st.label + '</span>';
      html += '<span style="color:#0f172a;"><b>' + escapeHtml(e.normalizedName || e.name) + '</b>';
      html += ' ← “' + escapeHtml(matched) + '”';
      html += ' <span style="color:#64748b;">[句' + (Number(e.sentenceIndex) + 1) + ' · ' + Math.round((Number(e.confidence) || 1) * 100) + '%' + (e.inferred ? ' · 推断' : '') + ' · ' + escapeHtml(String(e.extractor || '')) + ']</span>';
      html += '</span></div>';
    });
    html += '</div>';
  }
  html += renderCorrectionPanel(advanced);
  html += '</div>';
  return html;
}

// ===== 特性8：人工校正回路——一键修正并沉淀为新黄金标注 =====
function renderCorrectionPanel(advanced) {
  const entities = (advanced && advanced.entities) || [];
  const vios = [...new Set(entities.filter(e => e.type === 'violation').map(e => e.normalizedName || e.name))];
  const facs = [...new Set(entities.filter(e => e.type === 'fault_factor').map(e => e.normalizedName || e.name))];
  let html = '<details style="margin-top:14px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;padding:12px;">';
  html += '<summary style="cursor:pointer;font-weight:800;color:#b45309;">✏️ 识别不对？一键校正（会沉淀为黄金标注）</summary>';
  html += '<div style="font-size:12px;color:#78716c;margin:8px 0;line-height:1.6;">勾选要<b>删除</b>的误抽项，或在输入框补<b>漏抽</b>项（顿号分隔）。提交后写入 corrections.json，作为持续扩充的测试集与词典修正依据。</div>';
  const cbList = (arr, kind) => arr.length ? arr.map(n => '<label style="display:inline-flex;align-items:center;gap:4px;margin:3px 8px 3px 0;font-size:12px;"><input type="checkbox" class="corr-' + kind + '-rm" value="' + escapeHtml(n) + '">删除 ' + escapeHtml(n) + '</label>').join('') : '<span style="font-size:12px;color:#a8a29e;">（无）</span>';
  html += '<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:700;color:#b91c1c;margin-bottom:3px;">违法/过错项（当前抽取）：</div>' + cbList(vios, 'vio') + '</div>';
  html += '<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:700;color:#b45309;margin-bottom:3px;">诱因项（当前抽取）：</div>' + cbList(facs, 'fac') + '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
  html += '<label style="font-size:12px;color:#475569;font-weight:700;">补漏·违法/过错（顿号分隔）<input id="corrAddVio" placeholder="如：未让行、超载" style="width:100%;margin-top:4px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;"></label>';
  html += '<label style="font-size:12px;color:#475569;font-weight:700;">补漏·诱因（顿号分隔）<input id="corrAddFac" placeholder="如：视距遮挡、路面遗撒" style="width:100%;margin-top:4px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;"></label>';
  html += '</div>';
  html += '<label style="font-size:12px;color:#475569;font-weight:700;display:block;margin-bottom:8px;">备注（可选）<input id="corrNote" placeholder="为什么这样改" style="width:100%;margin-top:4px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;"></label>';
  html += '<button onclick="submitCorrection()" style="padding:8px 18px;background:#f59e0b;color:#fff;border:none;border-radius:7px;font-weight:700;cursor:pointer;">📝 提交校正</button>';
  html += '<span id="corrStatus" style="margin-left:10px;font-size:12px;color:#059669;"></span>';
  html += '</details>';
  return html;
}
function splitCorrList(v) {
  return String(v || '').split(/[、,，\n]/).map(s => s.trim()).filter(Boolean);
}
async function submitCorrection() {
  const statusEl = document.getElementById('corrStatus');
  const removedViolations = Array.from(document.querySelectorAll('.corr-vio-rm:checked')).map(c => c.value);
  const removedFactors = Array.from(document.querySelectorAll('.corr-fac-rm:checked')).map(c => c.value);
  const addedViolations = splitCorrList(document.getElementById('corrAddVio') && document.getElementById('corrAddVio').value);
  const addedFactors = splitCorrList(document.getElementById('corrAddFac') && document.getElementById('corrAddFac').value);
  const note = (document.getElementById('corrNote') && document.getElementById('corrNote').value) || '';
  if (!removedViolations.length && !removedFactors.length && !addedViolations.length && !addedFactors.length) {
    if (statusEl) { statusEl.style.color = '#dc2626'; statusEl.textContent = '请至少勾选删除项或填写补漏项'; }
    return;
  }
  const payload = {
    text: (currentParsedReport && currentParsedReport.text) || '',
    reportId: (currentParsedReport && currentParsedReport.report && currentParsedReport.report.id) || undefined,
    removedViolations, addedViolations, removedFactors, addedFactors, note
  };
  try {
    const resp = await fetch('/api/corrections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await resp.json();
    if (statusEl) {
      if (data && data.success) { statusEl.style.color = '#059669'; statusEl.textContent = '✅ 已沉淀校正（累计 ' + data.data.total + ' 条），后续可并入黄金集'; }
      else { statusEl.style.color = '#dc2626'; statusEl.textContent = '提交失败：' + ((data && data.error) || '未知错误'); }
    }
  } catch (err) {
    if (statusEl) { statusEl.style.color = '#dc2626'; statusEl.textContent = '提交异常：' + err.message; }
  }
}
