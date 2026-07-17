// 缺口分析共享模块 v1.0（特性4：消除逻辑漂移）
// 服务端 server.js 与 eval 脚本 (eval-accuracy.js / eval-accuracy-blind.js) 均 require 同一份，
// 杜绝"复刻逻辑随服务端演进而漂移"的历史坑（见 v3.3.6 教训）。
// 双模式导出：Node 用 module.exports；浏览器挂到 global。
(function (global) {
  const PENDING_RE = /(?:事故原因|具体原因|详细原因|责任|事故责任|原因)[^。；;]{0,18}(?:正在|还在|尚在|仍在)?(?:调查|调查中|进一步调查|核查|认定中)|(?:排除酒驾毒驾|未发现酒驾|暂无生命危险)/;

  // v3.3.6 起：统计"已认定原因/违法"时排除间接推断(inferred)与 <0.6 低置信弱信号——弱信号不应压制缺口判定。
  function isSolid(e) {
    return !e.inferred && (Number(e.confidence) || 1) >= 0.6;
  }

  function analyzeChainGapsFromAdvanced(advanced, legacy, text = '') {
    const entities = Array.isArray(advanced && advanced.entities) ? advanced.entities : [];
    const relations = Array.isArray(advanced && advanced.relations) ? advanced.relations : [];
    const byType = type => entities.filter(e => e.type === type);
    const relByType = type => relations.filter(r => r.type === type);
    const legacySafe = legacy || {};
    const hasInvestigationPending = PENDING_RE.test(text || '');
    const solidFactors = byType('fault_factor').filter(isSolid);
    const solidViolations = byType('violation').filter(isSolid);
    const hasSolidCause = solidViolations.length > 0 || byType('fault_behavior').length > 0 || solidFactors.length > 0;
    const gaps = [];
    const add = (key, label, level, desc, suggestion, evidence = '') => {
      if (!gaps.some(g => g.key === key)) gaps.push({ key, label, level, desc, suggestion, evidence });
    };
    if (!hasSolidCause) {
      add('missing-cause', '原因待查', hasInvestigationPending ? 'pending' : 'missing', '原文未提供明确违法行为、过错行为或外部诱因。', '建议补充现场勘查、监控、鉴定或警方后续通报。', hasInvestigationPending ? '原文存在“调查中/原因待查”类表述。' : '未识别到高置信原因类实体（间接推断诱因不计入）。');
    }
    if (!solidViolations.length && !byType('fault_behavior').length) {
      add('missing-violation', '违法事实缺失', 'missing', '未抽取到明确违法/过错行为。', '若有闯红灯、超速、未让行、操作不当等表述，应补充至事故经过或责任认定。');
    }
    if (!byType('liability').length && !relByType('person_bears_liability').length && !legacySafe.liability) {
      add('missing-liability', '责任待认定', hasInvestigationPending ? 'pending' : 'missing', '原文没有明确责任比例或责任主体。', '建议等待事故责任认定书或补充主责/次责/全责信息。');
    }
    const subjectCount = byType('person').length + byType('vehicle').length + byType('vehicle_instance').length;
    if (!subjectCount) {
      add('missing-subject', '主体身份不明', 'missing', '未识别到明确当事人、车辆或事故主体。', '建议补充涉事车辆类型、车牌、驾驶人/行人/非机动车等主体。');
    }
    // r28 X7：casualty_status(无伤亡结论)存在即视为后果已明确，不报 missing-injury（原文已确认无伤亡，非“待确认”）。
    if (!byType('injury').length && !byType('casualty_status').length && !(legacySafe.injuries && legacySafe.injuries.length)) {
      add('missing-injury', '伤亡后果待确认', 'pending', '原文未明确人员伤亡或损害后果。', '建议补充死亡、受伤、被困、车辆/路产损失等后果信息。');
    }
    if (!byType('accident_type').length && !relByType('vehicle_collides_vehicle').length) {
      add('missing-collision', '事故形态待补证', 'missing', '未识别到追尾、碰撞、侧翻、刮擦、碾轧等事故形态。', '建议补充事故过程和碰撞关系。');
    }
    const weakRelations = relations.filter(r => (Number(r.confidence) || 0) < 0.65 || /weak|fallback|implicit|context|natural/i.test(String(r.ruleId || ''))).length;
    const chainStatus = gaps.length === 0 ? 'strong' : (relations.length > 0 || subjectCount > 0 || byType('injury').length > 0 ? 'partial' : 'weak');
    const weakReason = gaps.map(g => g.label).join('、') || '';
    const chainQuality = chainStatus === 'strong' ? '强链路' : (chainStatus === 'partial' ? '待补证链路' : '弱链路');
    return {
      chainStatus,
      chainQuality,
      weakReason,
      gaps,
      missingKeys: gaps.map(g => g.key),
      pendingInvestigation: hasInvestigationPending,
      weakRelations,
      relationCount: relations.length
    };
  }

  // eval 脚本便捷入口：只要缺口 key 数组（与 analyzeChainGapsFromAdvanced 完全同源）
  function detectGapKeys(advanced, legacy, text = '') {
    return analyzeChainGapsFromAdvanced(advanced, legacy, text).missingKeys;
  }

  function makeGapRelations(reportId, gapInfo) {
    return ((gapInfo && gapInfo.gaps) || []).map(g => ({
      type: 'chain_gap',
      source: reportId || '事故报告',
      target: g.label,
      confidence: g.level === 'pending' ? 0.52 : 0.42,
      evidence: g.evidence || g.desc,
      ruleId: 'v332-chain-gap-' + g.key,
      relationLevel: 'gap',
      gapKey: g.key,
      gapLevel: g.level,
      suggestion: g.suggestion
    }));
  }

  const api = { analyzeChainGapsFromAdvanced, detectGapKeys, makeGapRelations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.GapAnalyzer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
