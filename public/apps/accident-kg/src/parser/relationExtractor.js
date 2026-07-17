// v3.1 RelationExtractor: 独立关系抽取器
// 输入 TrafficParser 已抽取的 sentences/entities 和上下文工具，输出带 confidence/evidence/ruleId 的关系。
(function (global) {
  function createRelationExtractor(ctx) {
    const {
      normalizeEntity,
      isValidVehicleTarget,
      firstPersonInText,
      allPersonsInText,
      vehicleTokensInText,
      isPrimaryLiabilityName,
      enrichFaultBehaviorEntity
    } = ctx || {};

    function isGenericVehicle(token) {
      return /^(?:轿车|货车|客车|公交|公交车|自行车|电动车|电动自行车|面包车|大巴|小轿车|小客车)$/.test(String(token || ''));
    }

    // v3.3.3 建议1：把句子按标点切成分句，用于"同分句主体绑定"和免责判断。
    function splitClauses(text) {
      const raw = String(text || '');
      const clauses = [];
      let cursor = 0;
      const re = /[，。；;、,]/g;
      let m;
      while ((m = re.exec(raw))) {
        clauses.push({ text: raw.slice(cursor, m.index), start: cursor, end: m.index });
        cursor = m.index + 1;
      }
      if (cursor < raw.length) clauses.push({ text: raw.slice(cursor), start: cursor, end: raw.length });
      return clauses;
    }

    // v3.3.3 建议1：免责/受害方信号——命中则该主体不应被绑为过错方。
    const EXCULPATE_RE = /(正常行驶|正常通行|正常直行|无明显过错|无明显违法|未发现明显违法|未发现违法|未发现明显过错|无违法行为|无责|不承担责任|不负责任|静止等待|停车等待|等待通行|被撞|被追尾|被刮|遵章行驶|按规定行驶|依法行驶|已停让|已让行|让行到位|来不及避让|避让不及|躲避不及)/;
    function clauseOfIndex(clauses, idx) {
      return clauses.find(c => idx >= c.start && idx < c.end) || null;
    }
    function isExculpatedSubject(text, token) {
      const raw = String(text || '');
      const tk = String(token || '');
      if (!tk) return false;
      const clauses = splitClauses(raw);
      // 找到含该主体的分句，若分句内有免责信号则判为受害/无责方。
      for (const c of clauses) {
        if (c.text.includes(tk) && EXCULPATE_RE.test(c.text)) return true;
      }
      return false;
    }

    // v3.3.3 建议2：特定违法/诱因对主体类型的语义亲和（遗撒→货车类，无证→摩托/非机动等）。
    function behaviorPrefersSubject(behavior, token) {
      const b = String(behavior || '');
      const t = String(token || '');
      if (/遗撒|货物固定|未密闭|篷布|超限超载|超载/.test(b)) return /货车|渣土车|罐车|槽罐|自卸|半挂|牵引|冷藏车|农用/.test(t) ? 1 : (/轿车|客车|网约车|出租车|SUV|面包车|小客车/.test(t) ? -1 : 0);
      if (/无证|无相应准驾资格|无驾驶资格/.test(b)) return /摩托车|三轮车|电动|自行车|骑行/.test(t) ? 1 : 0;
      if (/逆向|逆行|横穿|未走人行横道/.test(b)) return /电动|自行车|三轮车|摩托车|骑行|行人|共享/.test(t) ? 1 : (/轿车|客车|货车|SUV/.test(t) ? -0.5 : 0);
      return 0;
    }

    // v3.3.3 建议2：在同一分句内，优先选与违法词同分句且非免责的主体（人或车）。
    // behaviorIdx 优先使用实体真实字符偏移（规范名可能不在原文逐字出现）。
    function subjectInSameClause(sentenceText, behavior, subjects, behaviorIdx) {
      const raw = String(sentenceText || '');
      let idx = (typeof behaviorIdx === 'number' && behaviorIdx >= 0) ? behaviorIdx : raw.indexOf(String(behavior || ''));
      if (idx < 0) return '';
      const clauses = splitClauses(raw);
      const behaviorClause = clauseOfIndex(clauses, idx);
      if (!behaviorClause) return '';
      // 候选主体 = 传入的实体主体 + 从本分句直接扫描到的广义主体（行人/骑行人/XX车等）
      const localSubjects = [...(subjects || [])];
      const nounRe = /(?:一辆|后方|前方|对向|同向)?([一-龥A-Za-z]{0,4}(?:渣土车|槽罐车|罐车|自卸车|半挂车|牵引车|冷藏车|农用车|摩托车|三轮车|电动三轮车|共享单车|共享电单车|自行车|电动自行车|电动车|货车|客车|轿车|面包车|公交车|大巴|中巴|SUV|网约车|出租车|皮卡|校车|新能源车|洒水车)|外卖骑手|骑手|送餐员|骑车人|骑行人|非机动车驾驶人|电动车驾驶人|驾驶人|驾驶员|行人|行人类|乘客|老人|学生)/g;
      let nm;
      // 剥叙述性动词前缀，避免主体被污染成“调查发现罐车/发现货车/经查轿车”等（应为纯“罐车/货车/轿车”）。
      const stripNarr = t => String(t || '').replace(/^(?:调查发现|经调查发现|经查明|查明|经调查|经查|调查|认定|据查|据|发现|随后|事后|当时|涉事|事发)+/, '');
      while ((nm = nounRe.exec(behaviorClause.text))) { if (nm[1]) { const s = stripNarr(nm[1]); if (s) localSubjects.push(s); } }
      const uniq = [...new Set(localSubjects)];
      // v3.3.3+ 宾语/受事位置判定：主体词紧邻前置"的"（定语中心词）或被"未注意/避让/撞/碰/将/把/撞上/碰倒"支配时，为受害/受事方，不当过错主体。
      // v3.4.5 N1/N2：补两类宾语/受害位信号。①前置：主体前为“追尾/追撞/顶撞 + 前方/后方/对向/同向/前车/后车”（被撞的对方，如“追尾前方王某驾驶的货车”）。②后置：主体后紧跟碰撞受害标记“撞倒/撞伤/碰倒/碰伤/撞飞/被撞/被碰”（受害者，如“行人刘某某撞倒”）。
      function isObjectPosition(clauseText, token) {
        // r30 V17：token 可能带脏前缀（如"行的曹某""事人孔某"），先剥到真人名核心再定位，
        // 否则前置"的"判受事位会因脏前缀而失效（"未让直行的曹某"中曹某是被让直行方）。
        const nameCore = (String(token).match(/[A-Z]某|[\u4e00-\u9fa5]{1,2}某某?|[甲乙丙丁戊己庚辛壬癸]/) || [])[0];
        const seek = nameCore || token;
        const t = clauseText.indexOf(seek);
        if (t <= 0) return false;
        if (clauseText[t - 1] === '的') return true;
        // "未让/未避让/让 + (直行|对向|右方|主路|环岛内|正常行驶) + 的?" 修饰的主体为被让行方（受害）。
        const beforeName = clauseText.slice(0, t);
        if (/(?:未让|未避让|未礼让|让)(?:直行|对向|右方|左方|主路|环岛内|正常行驶|先行)(?:的)?[^，。；;]{0,4}$/.test(beforeName)) return true;
        const before = clauseText.slice(Math.max(0, t - 10), t);
        if (/(?:未注意|注意|避让|未避让|撞上|撞倒|撞到|撞及|碰倒|碰伤|撞|碰|将|把|撞击|剔倒|拖行|扫到)$/.test(before)) return true;
        // r28 X2：碰撞动词后接受害角色词再接人名（“撞倒行人尤某/碰伤骑车人钱某”），该人名为受害者，非违法主体。
        if (/(?:撞倒|撞伤|撞到|撞及|撞飞|碰倒|碰伤|剔倒|拖行|扫到|撞上|碾压|刮倒|刮伤)(?:正在[\u4e00-\u9fa5]{0,8})?(?:行人|骑车人|骑行人|骑车群众|乘客|学生|儿童|老人|路人|群众|非机动车驾驶人|电动车驾驶人)$/.test(before)) return true;
        // ①前置位置词：“追尾/追撞/顶撞/剔撞… + (前方|后方|对向|同向|前车|后车)”，主体为被撞对方。
        if (/(?:追尾|追撞|顶撞|剔撞|撞上|撞到|撞及|撞了)(?:前方|后方|对向|同向|前车|后车|旁边)$/.test(before)) return true;
        // ①b 宾语 NP 泛化：分句内出现“碰撞动词+方位词”（如“追尾前方”），则碰撞动词之后的人/车 token（含方位词前缀）均属被撞对方。markerEnd 取动词末尾（不含方位词），使“前方王某”这类 token 落在 marker 之后。
        const objMarker = /(?:追尾|追撞|顶撞|剔撞|碰撞|撞上|撞到|撞及)(?=前方|后方|对向|同向|前车|后车|旁边)/g;
        let om, lastMarkerEnd = -1;
        while ((om = objMarker.exec(clauseText))) lastMarkerEnd = om.index + om[0].length;
        if (lastMarkerEnd >= 0 && t >= lastMarkerEnd) return true;
        // ②后置受害标记：主体后紧跟“撞倒/撞伤/碰倒/碰伤/撞飞/被撞/被碰/受伤”，主体为受害者。
        const after = clauseText.slice(t + token.length, t + token.length + 4);
        if (/^(?:撞倒|撞伤|碰倒|碰伤|撞飞|撞出|被撞|被碰|被剔|被撞倒)/.test(after)) return true;
        return false;
      }
      const inClause = uniq.filter(s => s && behaviorClause.text.includes(s) && !EXCULPATE_RE.test(behaviorClause.text.slice(0, behaviorClause.text.indexOf(s))));
      const scored = inClause.map(s => ({ s, score: 1 + behaviorPrefersSubject(behavior, s) - (isExculpatedSubject(raw, s) ? 5 : 0) - (isObjectPosition(behaviorClause.text, s) ? 5 : 0) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.length && scored[0].score > 0 ? scored[0].s : '';
    }

    function inferVehicleSubjectFromSentence(sentenceText, violationName) {
      const text = String(sentenceText || '');
      const behavior = String(violationName || '');
      const vehicles = vehicleTokensInText ? vehicleTokensInText(text) : [];
      const candidates = [];
      vehicles.forEach(v => {
        const idx = text.indexOf(v);
        if (idx < 0) return;
        let score = 0.35;
        if (idx <= Math.max(0, text.indexOf(behavior)) + 12) score += 0.12;
        if (/货车|客车|轿车|面包车|渣土车|罐车|大巴|公交|出租车|网约车|小车|车辆|驾驶人|司机/.test(text.slice(Math.max(0, idx - 8), Math.min(text.length, idx + v.length + 18)))) score += 0.12;
        candidates.push({ v, score });
      });
      if (!candidates.length) return '';
      candidates.sort((a, b) => b.score - a.score || (isGenericVehicle(a.v) ? 1 : -1));
      return candidates[0].v;
    }

    // v3.4.4 Bug1: 人名类关系的 source 落库前统一归一，杜绝“随后赵某/与陈某/车的杨某/后方施某”等脏前缀 token 泄漏到 pcv/pdv/责任关系。
    const PERSON_SOURCE_RELATIONS = new Set(['person_commits_violation', 'person_drives_vehicle', 'person_bears_liability', 'person_has_injury']);
    function cleanPersonToken(token) {
      const raw = String(token || '').trim();
      if (!raw) return raw;
      const norm = normalizeEntity ? normalizeEntity('person', raw) : raw;
      // 仅当归一结果是合法人名占位（X某/双字某/甲乙丙…）才替换；否则保留原值（可能是车辆等广义主体）。
      return /^(?:[A-Z]某|[\u4e00-\u9fa5]{1,2}某某?|[甲乙丙丁戊己庚辛壬癸])$/.test(norm) ? norm : raw;
    }
    function addRelation(relations, seen, relation) {
      if (!relation || !relation.source || !relation.target || !relation.type) return;
      if (PERSON_SOURCE_RELATIONS.has(relation.type)) relation = { ...relation, source: cleanPersonToken(relation.source) };
      if (relation.type === 'person_commits_violation' && /^(?:unknown|未知)$/i.test(String(relation.source).trim())) return;
      const key = [relation.type, relation.source, relation.target, relation.sentenceIndex, relation.ruleId].join('|');
      if (seen.has(key)) return;
      seen.add(key);
      relations.push({ confidence: 0.75, evidence: '', sentenceIndex: -1, ruleId: 'relation-rule', ...relation });
    }

    function extract({ sentences, entities }) {
      const relations = [];
      const relSeen = new Set();
      const vehicleToPerson = new Map();
      const personLiability = new Map();

      sentences.forEach(sentence => {
        const sentEntities = entities.filter(e => e.sentenceIndex === sentence.index);
        sentEntities.filter(e => e.type === 'liability' && e.relatedPerson).forEach(e => {
          const existing = personLiability.get(e.relatedPerson);
          if (!existing || (!isPrimaryLiabilityName(existing) && isPrimaryLiabilityName(e.normalizedName))) personLiability.set(e.relatedPerson, e.normalizedName);
          addRelation(relations, relSeen, { type: 'person_bears_liability', source: e.relatedPerson, target: e.normalizedName, confidence: 0.9, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: 'liability-relatedPerson' });
        });

        const vehicleMentions = [...sentence.text.matchAll(/(?:([A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[\u4e00-\u9fa5]{1,3}某某?)\s*)?(?:驾驶|骑|驾驶的|乘坐|搭载)(?:的)?\s*([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9*×X]{3,6}|无牌[^，。；、 ]{0,8}车|无号牌[^，。；、 ]{0,8}车|(?:小型普通客车|小型客车|小客车|小型轿车|轿车|网约车|出租车|厢式货车|轻型厢货|轻型货车|小货车|货车|重型货车|冷藏车|商务车|半挂牵引车|半挂车|牵引车|SUV|农用车|农用三轮车|电动自行车|电动车|自行车|校车|公交车|公交|旅游客车|危化品运输车|危化品槽罐车|电动三轮车|快递电动三轮|快递三轮|儿童滑板车|学生自行车|共享电动自行车|园区电动三轮搬运车|三轮搬运车|二轮摩托车|摩托车|救护车|叉车))/g)];
        vehicleMentions.forEach(m => {
          // v3.4.4 Bug2: “骑/开<车>的<人名>”（如“骑自行车的杨某”），车后紧跟“的+人名”时该人才是驾驶人，不能回退到句首人。
          const after = sentence.text.slice(m.index + m[0].length);
          const trailingOwner = after.match(/^的\s*([A-Z]某|[甲乙丙丁戊己庚辛壬癸]|[\u4e00-\u9fa5]{1,3}某某?)/);
          const driver = m[1] || (trailingOwner && trailingOwner[1]) || firstPersonInText(sentence.text);
          const target = normalizeEntity('vehicle_instance', m[2]);
          if (!driver || !isValidVehicleTarget(target)) return;
          vehicleToPerson.set(target, driver);
          addRelation(relations, relSeen, { type: 'person_drives_vehicle', source: driver, target, confidence: 0.82, evidence: sentence.text, sentenceIndex: sentence.index, ruleId: 'drive-verb-near-vehicle' });
        });
      });

      sentences.forEach((sentence, idx) => {
        if (!/(涉及车辆包括|相关人员包括)/.test(sentence.text)) return;
        const vehiclesInSentence = vehicleTokensInText(sentence.text);
        let peopleInSentence = allPersonsInText(sentence.text).filter(p => !/A某|B某|C某/.test(p));
        const next = sentences[idx + 1] && /(相关人员包括|驾驶人|骑行人)/.test(sentences[idx + 1].text) ? sentences[idx + 1].text : '';
        if (next) peopleInSentence = peopleInSentence.concat(allPersonsInText(next).filter(p => !/A某|B某|C某/.test(p)));
        peopleInSentence = [...new Set(peopleInSentence)];
        const n = Math.min(vehiclesInSentence.length, peopleInSentence.length);
        for (let i = 0; i < n; i++) {
          const target = normalizeEntity('vehicle_instance', vehiclesInSentence[i]);
          if (!target || !peopleInSentence[i] || vehicleToPerson.has(target) || !isValidVehicleTarget(target)) continue;
          vehicleToPerson.set(target, peopleInSentence[i]);
          addRelation(relations, relSeen, { type: 'person_drives_vehicle', source: peopleInSentence[i], target, confidence: 0.58, evidence: sentence.text, sentenceIndex: sentence.index, ruleId: 'vehicle-person-list-order-weak' });
        }
      });

      const personRoles = new Map();
      entities.filter(e => e.type === 'person' && e.role).forEach(e => { if (!personRoles.has(e.normalizedName) || /驾驶人|骑行人|行人/.test(e.role)) personRoles.set(e.normalizedName, e.role); });
      entities.filter(e => e.type === 'liability' && e.relatedPerson).forEach(e => {
        if (!personLiability.has(e.relatedPerson) || /全部责任|主要责任|全责|主责|\d+%责任/.test(e.normalizedName)) personLiability.set(e.relatedPerson, e.normalizedName);
      });

      function inferViolationSubject(sentence, sentEntities, violationName, entity) {
        const behavior = String(violationName || '');
        // 候选主体集：句子内人名 + 车辆token
        const personTokens = allPersonsInText(sentence.text);
        const vehicleTokens = vehicleTokensInText(sentence.text);
        const allSubjects = [...personTokens, ...vehicleTokens];
        // 实体在句中的真实字符偏移（规范名可能不逐字出现，故用 start 定位分句）
        const localIdx = entity && typeof entity.start === 'number' ? entity.start - sentence.start : -1;

        // 优先级1：v3.3.3 同分句且非免责的主体（建议1+2 核心）
        const sameClause = subjectInSameClause(sentence.text, behavior, allSubjects, localIdx);
        if (sameClause) {
          if (personTokens.includes(sameClause)) return { source: sameClause, confidence: 0.8, ruleId: 'violation-same-clause-person-v333' };
          const backPerson = vehicleToPerson.get(normalizeEntity('vehicle_instance', sameClause));
          if (backPerson) return { source: backPerson, confidence: 0.78, ruleId: 'violation-same-clause-subject-v333' };
          // 测试阶段修（无版本号）：same-clause 命中车辆但无驾驶人回映时，优先取该车所在分句内的非免责人名（“X驾驶Y车…逆向骑行”中的 X），避免把车辆名当违法主体。
          const clauseText = ((sentence.text.split(/[，。；;、,]/).find(seg => seg.includes(sameClause))) || '');
          const personInSameClause = personTokens.find(p => clauseText.includes(p) && !isExculpatedSubject(sentence.text, p));
          if (personInSameClause) return { source: personInSameClause, confidence: 0.74, ruleId: 'violation-same-clause-vehicle-driver-fallback' };
          return { source: sameClause, confidence: 0.72, ruleId: 'violation-same-clause-subject-v333' };
        }

        // 优先级2：句中唯一人名且非免责
        const explicit = firstPersonInText(sentence.text);
        // r30 V21：违法词处于"(来不及)避让/未避让 + [对向/对方] + 违法车"的宾语从句中时，
        // 句首人名是"避让方"（受害），违法归被避让的对向车 → 优先绑该车所在事故的主责/全责人，而非句首受害人。
        const behaviorGlobalIdx = entity && typeof entity.start === 'number' ? entity.start : sentence.text.indexOf(behavior);
        const preBehavior = behaviorGlobalIdx >= 0 ? sentence.text.slice(0, behaviorGlobalIdx) : sentence.text;
        const inAvoidObjectClause = /(?:来不及避让|未能避让|未及避让|避让不及|躲避不及|来不及躲避)[^，。；;]{0,8}(?:对向|对方|对面|旁边|前方|后方)?[^，。；;]{0,6}$/.test(preBehavior);
        if (inAvoidObjectClause) {
          const primary = [...personLiability.entries()].filter(([, l]) => /全部责任|主要责任|全责|主责/.test(l));
          if (primary.length) return { source: primary[0][0], confidence: 0.6, ruleId: 'violation-avoid-object-liable-subject-r30' };
          // 无主责人可绑时，宁可不绑（不误绑受害的避让方）。
          return null;
        }
        if (explicit && !isExculpatedSubject(sentence.text, explicit)) return { source: explicit, confidence: 0.7, ruleId: 'violation-sentence-person' };

        // 优先级3：车辆回映驾驶人（排除免责车）
        for (const token of vehicleTokens) {
          if (isExculpatedSubject(sentence.text, token)) continue;
          if (vehicleToPerson.has(normalizeEntity('vehicle_instance', token))) return { source: vehicleToPerson.get(normalizeEntity('vehicle_instance', token)), confidence: 0.66, ruleId: 'violation-vehicle-backref' };
        }

        // 优先级4：责任认定附近的主责人（弱）
        const nearbyLiability = [...personLiability.entries()].filter(([, l]) => /全部责任|主要责任|全责|主责|\d+%责任/.test(l));
        if (/(过错|责任|原因认定|事故原因|经对道路条件|主要过错)/.test(sentence.text) && nearbyLiability.length) {
          return { source: nearbyLiability[0][0], confidence: 0.52, ruleId: 'violation-liability-nearby-weak' };
        }

        // 优先级5：句中唯一人名（非免责）
        const persons = sentEntities.filter(e => e.type === 'person' && !isExculpatedSubject(sentence.text, e.normalizedName));
        if (persons.length === 1) return { source: persons[0].normalizedName, confidence: 0.62, ruleId: 'violation-single-person-sentence' };

        // 优先级6：语义亲和的车辆主体（弱，已内建免责过滤）
        const vehicleSubject = inferVehicleSubjectFromSentence(sentence.text, behavior);
        if (vehicleSubject && !isExculpatedSubject(sentence.text, vehicleSubject)) return { source: vehicleSubject, confidence: 0.5, ruleId: 'violation-vehicle-subject-weak' };
        return null;
      }

      sentences.forEach(sentence => {
        const sentEntities = entities.filter(e => e.sentenceIndex === sentence.index);
        const vehicles = sentEntities.filter(e => e.type === 'vehicle' || e.type === 'vehicle_instance');
        sentEntities.filter(e => e.type === 'violation' || e.type === 'fault_factor').forEach(e => {
          // r30 共同违法："X与Y均存在…违法行为"/"双方均…" 集合句式，违法应绑该句全部当事人（多条 pcv），
          // 而非单一主体。命中集合标记时优先按多主体绑定；否则回退单主体推断。
          const collectiveMark = e.type === 'violation' && /(?:均|都|皆|各自?|分别|共同|双方|两方|二人|两人)(?:存在|有|实施|均有)/.test(sentence.text) && /违法|过错/.test(sentence.text);
          let boundCollective = false;
          if (collectiveMark) {
            const ps = (typeof allPersonsInText === 'function' ? allPersonsInText(sentence.text) : [])
              .filter(p => p && !isExculpatedSubject(sentence.text, p));
            const uniqPs = [...new Set(ps)];
            if (uniqPs.length >= 2) {
              uniqPs.forEach(p => addRelation(relations, relSeen, { type: 'person_commits_violation', source: p, target: e.normalizedName, confidence: 0.78, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: 'violation-collective-multi-subject-r30' }));
              e.relatedPerson = e.relatedPerson || uniqPs[0];
              boundCollective = true;
            }
          }
          const inferred = (!boundCollective && e.type === 'violation') ? inferViolationSubject(sentence, sentEntities, e.normalizedName || e.name, e) : null;
          if (inferred) {
            e.relatedPerson = e.relatedPerson || inferred.source;
            addRelation(relations, relSeen, { type: 'person_commits_violation', source: inferred.source, target: e.normalizedName, confidence: inferred.confidence, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: inferred.ruleId });
          }
          enrichFaultBehaviorEntity(e, { subjectPerson: e.relatedPerson || (inferred && inferred.source), personRoles, personLiability });
          addRelation(relations, relSeen, { type: 'behavior_belongs_to_category', source: e.normalizedName, target: e.faultCategory, confidence: e.categoryConfidence || 0.75, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: e.type === 'fault_factor' ? 'fault-taxonomy-factor-category' : 'fault-taxonomy-behavior-category' });
          addRelation(relations, relSeen, { type: 'report_has_fault_category', source: 'report', target: e.faultCategory, confidence: e.categoryConfidence || 0.75, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: 'fault-taxonomy-report-category' });
        });
        const injEntities = sentEntities.filter(e => e.type === 'injury');
        const hasSubjectBoundInjury = injEntities.some(e => e.relatedPerson);
        injEntities.forEach(e => {
          if (e.relatedPerson) addRelation(relations, relSeen, { type: 'person_has_injury', source: e.relatedPerson, target: e.normalizedName, confidence: 0.88, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: 'injury-relatedPerson' });
          else {
            // 测试阶段修（injury精度）：同句已有带主体的 injury 时，无主体的“受伤”不再弱绑到句首人名（避免把伤情安到无伤者头上，如 #12 蒋某~受伤）。
            if (hasSubjectBoundInjury) return;
            // 数字型群体伤亡（“3人死亡”“造成2人受伤”“一死一伤”）不绑定具体人（非具名伤者，不应归到胇事者）。
            if (/\d+人|造成|一死|多人|若干人|数人|多名/.test(e.normalizedName)) return;
            // 若伤情词紧邻上下文为群体量词（一死一伤/造成…伤/N人…伤/一死两伤），也不弱绑具名人。
            const injCtx = String(e.evidence || sentence.text || '');
            if (/一死[一两三四五\d]|造成[^。，]{0,6}(?:死亡|伤)|\d+死\d+伤|[一两三四五\d]+人(?:死亡|受伤|重伤|轻伤)/.test(injCtx) && !e.relatedPerson) return;
            const victim = firstPersonInText(e.evidence || sentence.text) || inferVehicleSubjectFromSentence(sentence.text, e.normalizedName);
            if (victim && !/^(死亡|受伤|轻伤|重伤)/.test(victim)) addRelation(relations, relSeen, { type: 'person_has_injury', source: victim, target: e.normalizedName, confidence: 0.5, evidence: e.evidence, sentenceIndex: e.sentenceIndex, ruleId: 'injury-context-subject-weak' });
          }
        });
        if (/(相撞|碰撞|追尾|刮擦|刮碰|侧碰|挤碰|碾轧)/.test(sentence.text) && vehicles.length >= 2) {
          addRelation(relations, relSeen, { type: 'vehicle_collides_vehicle', source: vehicles[0].normalizedName, target: vehicles[1].normalizedName, confidence: 0.74, evidence: sentence.text, sentenceIndex: sentence.index, ruleId: 'vehicle-collision-same-sentence' });
        }
      });

      const allVehicles = entities.filter(e => e.type === 'vehicle' || e.type === 'vehicle_instance');
      if (!relations.some(r => r.type === 'vehicle_collides_vehicle') && allVehicles.length >= 2) {
        addRelation(relations, relSeen, { type: 'vehicle_collides_vehicle', source: allVehicles[0].normalizedName, target: allVehicles[1].normalizedName, confidence: 0.6, evidence: allVehicles[0].evidence, sentenceIndex: allVehicles[0].sentenceIndex, ruleId: 'vehicle-collision-fallback' });
      }
      return relations;
    }

    return { extract, addRelation };
  }

  global.RelationExtractor = { create: createRelationExtractor };
  if (typeof module !== 'undefined') module.exports = global.RelationExtractor;
})(typeof window !== 'undefined' ? window : globalThis);
