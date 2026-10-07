// Verified card values plus narrowly resolved Passive. Other corrections remain unknown.
const UnitParameterEngine = (() => {
  const keys=['performance','technique','sense'];
  const pending=['Leader','その他'];
  function calculateMemberParameter(card, training, bloom){
    const cardParameters=calculateCardParameters(card,training,bloom);
    const base={...cardParameters.base};
    base.total=keys.reduce((sum,key)=>sum+base[key],0);
    const opening=Object.fromEntries(keys.map(key=>[key,cardParameters[key]-base[key]]));
    opening.total=keys.reduce((sum,key)=>sum+opening[key],0);
    const subtotal=Object.fromEntries([...keys,'total'].map(key=>[key,cardParameters[key]]));
    const passiveLevel=card.skills.passive.levels.find(level=>level.level===canonicalBloomLevels(card,bloom).passive);
    return {passiveInput:passiveLevel ? JSON.parse(JSON.stringify(passiveLevel)) : null, attribute:card.classification.attributeType.raw, cardId:card.id, training, bloom, level:cardParameters.level, base, opening, subtotal,
      corrections:pending.map(label=>({label,status:'not-connected',value:null})), final:null};
  }
  // Narrow bridge: never route an unknown condition through Card v2's defaults.
  function resolveInput(level){
    const unsupported=reason=>({status:'unsupported',reason,effect:null});
    if(!level) return unsupported('Passiveデータ未確認');
    const raw=level.effect?.raw;
    const types={
      PERFORMANCE_UP_PERMIL_UP:'performance_up',TECHNIQUE_UP_PERMIL_UP:'technique_up',
      SENSE_UP_PERMIL_UP:'sense_up',ALL_PARAMETER_UP_PERMIL_UP:'all_parameters_up'
    };
    const prefix='LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_';
    const type=raw?.type?.startsWith(prefix) ? types[raw.type.slice(prefix.length)] : null;
    if(!type) return unsupported('未対応の効果（Support等）');
    const value=Number(raw.value);
    if(raw.number!==1 || raw.value==null || raw.value==='' || !Number.isSafeInteger(value) || value<=0) return unsupported('効果量未確認');
    const targets=level.target?.selectors;
    const groupTarget=targets?.length===1 && targets[0].type==='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_CHARACTER_GROUPING';
    const attributeTarget=targets?.length===1 && targets[0].type==='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_ATTRIBUTE';
    if(targets?.length!==1 || (!attributeTarget && !groupTarget && targets[0].type!=='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_SELF')) return unsupported('自己以外の対象・順位選択は未接続');
    const condition=level.condition;
    if(condition?.state!=='observed') return unsupported('条件未観測・未解決');
    const clauses=condition.clauses;
    if(clauses?.length!==1) return unsupported('複数条件・条件情報不足');
    if(clauses[0].type==='LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_CHARACTER_GROUPING'){
      if(attributeTarget) return unsupported('属性対象と所属条件の組合せは未検証');
      const clause=clauses[0],count=Number(clause.threshold);
      if(typeof clause.characterGroupingId!=='string'||!clause.characterGroupingId||clause.threshold==null||!Number.isInteger(count)||count<1) return unsupported('所属ID・人数未確認');
      if(groupTarget && (typeof targets[0].characterGroupingId!=='string'||targets[0].targetCount!==2)) return unsupported('所属対象のID・人数未確認');
      return {status:groupTarget?'partial':'supported',effect:{type,value:value/10,condition:{kind:'affiliation',value:clause.characterGroupingId},conditionCount:count,target:groupTarget?{kind:'affiliation',value:targets[0].characterGroupingId}:{kind:'self'},targetCount:groupTarget?targets[0].targetCount:1}};
    }
    if(groupTarget) return unsupported('所属対象＋所属人数条件以外は未接続');
    if(clauses[0].type!=='LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_ATTRIBUTE') return unsupported('未対応の条件');
    const clause=clauses[0], count=Number(clause.threshold);
    if(!/^CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_[123]$/.test(clause.cardAttributeType || '') || clause.threshold==null || !Number.isInteger(count) || count<1) return unsupported('条件の属性・人数未確認');
    if(attributeTarget && (targets[0].cardAttributeType!==clause.cardAttributeType || count!==2 || ![2,3].includes(targets[0].targetCount))) return unsupported('属性対象・条件の組合せは未検証');
    return {status:'supported',effect:{type,value:value/10,condition:{kind:'type',value:clause.cardAttributeType},
      conditionCount:count,target:attributeTarget?{kind:'type',value:targets[0].cardAttributeType}:{kind:'self'},targetCount:attributeTarget?targets[0].targetCount:1}};
  }
  function resolveMemory(input){
    const source=input==null ? {kind:'manual-rate',percent:''} : JSON.parse(JSON.stringify(input));
    if(source.kind!=='manual-rate') return {status:'unsupported',source,rate:null,reason:'未対応のMemory効果形式'};
    if(source.percent==null || (typeof source.percent==='string' && !source.percent.trim())) return {status:'unset',source,rate:null,reason:'Memory率未設定'};
    if(!['number','string'].includes(typeof source.percent) || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(source.percent).trim())) return {status:'unsupported',source,rate:null,reason:'Memory率は0以上の数値で指定してください'};
    const percent=Number(source.percent),rate=percent/100;
    if(!Number.isFinite(percent) || !Number.isFinite(rate)) return {status:'unsupported',source,rate:null,reason:'Memory率が計算範囲外です'};
    return {status:'applied',source,percent,rate,reason:null};
  }
  function calculateEnhancementLayer(components, input){
    // Same input unit as Memory (%); the existing calculator takes a decimal rate.
    const state=resolveMemory(input);
    if(state.reason) state.reason=state.reason.replace(/Memory/g,'Enhancement Bonus');
    const included=Object.fromEntries(Object.entries(components).filter(([,value])=>value!==null));
    const excluded=Object.keys(components).filter(key=>components[key]===null);
    if(Object.values(included).some(value=>!Number.isSafeInteger(value)||value<0)) throw Error('強化ボーナス基数が不正です');
    const basis=Object.values(included).reduce((sum,value)=>sum+value,0);
    const total=state.status==='applied' ? calculateEnhancementBonus(basis,state.rate) : null;
    if(total!==null && !Number.isSafeInteger(total)) throw Error('強化ボーナスが安全な整数範囲を超えています');
    return {...state,performance:null,technique:null,sense:null,total,
      scope:excluded.length?'calculated-components-only':'complete-basis',
      basis,components:{...components},excluded,unrounded:total===null?null:basis*state.rate,
      rounding:'メンバーごとの合計基数に対して1回ceil',distribution:'P/T/S配分未定義（TOTALのみ）'};
  }
  function resolveTotalAdjustment(input){
    const source=input==null?{kind:'external-total',value:''}:JSON.parse(JSON.stringify(input));
    const output=(status,total,reason)=>({source,status,total,reason,performance:null,technique:null,sense:null});
    if(source.kind!=='external-total') return output('unsupported',null,'未対応の入力形式');
    if(source.value==null || typeof source.value==='string'&&!source.value.trim()) return output('unset',null,'未設定');
    if(!['string','number'].includes(typeof source.value)||!/^\d+$/.test(String(source.value).trim())||!Number.isSafeInteger(Number(source.value))) return output('invalid',null,'0以上の安全な整数TOTALを入力してください');
    return output('applied',Number(source.value),null);
  }
  function calculateUnitParameter(inputMembers, memoryInput, enhancementInput, affiliationCatalog){
    const memoryState=resolveMemory(memoryInput);
    const bridges=inputMembers.map(member=>resolveInput(member.passiveInput));
    const conditionResults=bridges.map(bridge=>bridge.effect?.condition.kind==='affiliation' ? PartyConditionResolver.resolvePartyCondition({
      type:'affiliation_count',affiliationId:bridge.effect.condition.value,requiredCount:bridge.effect.conditionCount,
      unitMembers:inputMembers.map((member,index)=>({cardId:member.cardId,slot:member.slot ?? index+1})),catalog:affiliationCatalog}) : null);
    const prepared=inputMembers.map((member,index)=>({slot:member.slot ?? index+1,libraryCardId:member.cardId,
      affiliations:Object.entries(affiliationCatalog?.groups || {}).filter(([,group])=>group.characterIds?.includes(affiliationCatalog?.cardCharacters?.[member.cardId])).map(([id])=>id),
      type:member.attribute,base:{...member.subtotal},card:{skills:{passive:{effect:conditionResults[index]?.result==='unresolved'?{type:''}:bridges[index].effect || {type:''}}}}}));
    const targetResults=bridges.map((bridge,index)=>bridge.status==='partial'?PassiveTargetResolver.resolve({
      affiliationId:bridge.effect.target.value,targetCount:bridge.effect.targetCount,condition:conditionResults[index],
      unitMembers:inputMembers.map((m,i)=>({cardId:m.cardId,slot:m.slot ?? i+1})),catalog:affiliationCatalog}):null);
    // Existing accumulation/target resolution/ceil is the single source of calculation.
    const calculated=calculatePassiveEffects(prepared,(source,effect,members)=>{
      const index=prepared.findIndex(m=>m.slot===source.slot),target=targetResults[index];
      if(effect.target?.kind==='type' && bridges[index].status==='supported'){
        const condition=PartyConditionResolver.resolveAttributeCondition({attribute:effect.condition.value,requiredCount:effect.conditionCount,unitMembers:members});
        conditionResults[index]=condition;
        const resolved=PassiveTargetResolver.resolveAttribute({attribute:effect.target.value,condition,unitMembers:members});
        if(resolved.status==='candidates-resolved'){
          resolved.selection=PassiveSelectionResolver.resolve({candidates:resolved.candidates,selectCount:effect.targetCount,rule:'attribute-baseTotal'});
          resolved.status=resolved.selection.status;resolved.reason=resolved.selection.reason;
          resolved.targets=resolved.selection.selected;
        }
        // Keep trace detached from calculator's mutable member/rate objects.
        resolved.candidates=resolved.candidates.map(m=>({slot:m.slot,cardId:m.libraryCardId,baseTotal:m.baseTotal,formationIndex:m.formationIndex}));
        resolved.excludedMembers=resolved.excludedMembers.map(m=>({slot:m.slot,cardId:m.libraryCardId}));
        targetResults[index]=resolved;
        return {activated:condition.result==='satisfied',status:resolved.status,conditionCount:effect.conditionCount,targetCount:effect.targetCount,
          candidateSlots:resolved.candidates.map(m=>m.slot),targetSlots:resolved.targets.map(m=>m.slot),targets:members.filter(m=>resolved.targets.some(t=>t.slot===m.slot))};
      }
      if(!target) return resolvePassiveTargets(source,effect,members);
      return {activated:conditionResults[index].result==='satisfied',status:target.status,
        conditionCount:effect.conditionCount,targetCount:effect.targetCount,candidateSlots:target.candidates.map(m=>m.slot),
        targetSlots:target.targets.map(m=>m.slot),targets:members.filter(m=>target.targets.some(t=>t.slot===m.slot))};
    });
    const members=inputMembers.map((member,index)=>{
      const bridge=bridges[index], result=calculated.members[index];
      const resolution=calculated.passiveResults.find(row=>row.sourceSlot===prepared[index].slot);
      const trace={sourceCardId:member.cardId,sourceSlot:prepared[index].slot,level:member.passiveInput?.level,
        source:member.passiveInput?.source,description:member.passiveInput?.description,
        status:bridge.status==='unsupported'?'unsupported':conditionResults[index]?.result==='unresolved'?'unresolved':resolution?.status,
        condition:conditionResults[index],targetResolution:targetResults[index],
        reason:bridge.reason || targetResults[index]?.reason || (conditionResults[index]?.result==='unresolved'?'所属情報または5人編成が不足':null),targetSlots:resolution?.targetSlots || [],
        targetCardIds:(resolution?.targetSlots || []).map(slot=>inputMembers[prepared.findIndex(row=>row.slot===slot)].cardId),
        effect:bridge.effect,parameters:[]};
      if(bridge.effect && !targetResults[index] && (resolution?.activated===true || conditionResults[index]?.result==='unsatisfied')){
        for(const key of PARAMETER_PASSIVE_TYPES[bridge.effect.type]) trace.parameters.push({
          parameter:key,referenceValue:member.subtotal[key],ratePercent:conditionResults[index]?bridge.effect.value:result.passive.rates[key],appliedRatePercent:result.passive.rates[key],
          unrounded:member.subtotal[key]*result.passive.rates[key]/100,added:result.passive[key],
          rounding:'同一parameterの率を合算後にceil',reference:'開花適用後・Passive適用前'});
      }
      if(targetResults[index] && resolution?.status==='resolved'){
        for(const slot of resolution.targetSlots){
          const target=calculated.members.find(m=>m.slot===slot);
          for(const key of PARAMETER_PASSIVE_TYPES[bridge.effect.type]) trace.parameters.push({
            targetSlot:slot,targetCardId:target.libraryCardId,parameter:key,referenceValue:target.base[key],
            sourceRatePercent:bridge.effect.value,sourceRaw:target.base[key]*bridge.effect.value/100,
            combinedRatePercent:target.passive.rates[key],unrounded:target.base[key]*target.passive.rates[key]/100,
            added:target.passive[key],rounding:'全sourceの率を合算後にceil（このaddedは対象parameter全体の合算値）'});
        }
      }
      const unresolved=['unsupported','unresolved'].includes(trace.status)?[trace]:[];
      targetResults.forEach((target,sourceIndex)=>{
        if(sourceIndex!==index && target?.status==='unresolved' && (!target.candidates.length||target.candidates.some(m=>m.slot===prepared[index].slot))) unresolved.push({
          sourceCardId:inputMembers[sourceIndex].cardId,sourceSlot:prepared[sourceIndex].slot,status:'unresolved',reason:target.reason,targetResolution:target});
      });
      const memoryValues=memoryState.status==='applied' ? calculateMemory(member.subtotal,memoryState.rate) : null;
      if(memoryValues && Object.values(memoryValues).some(value=>!Number.isSafeInteger(value))) throw Error('Memory計算値が安全な整数範囲を超えています');
      const memory={...memoryState,...Object.fromEntries([...keys,'total'].map(key=>[key,memoryValues ? memoryValues[key] : null]))};
      const memoryTrace={kind:'Memory',source:memoryState.source,status:memoryState.status,reason:memoryState.reason,
        targetCardId:member.cardId,targetSlot:prepared[index].slot,reference:'開花適用後・Passive適用前（Board等を除く）',
        parameters:keys.map(key=>({parameter:key,referenceValue:member.subtotal[key],rate:memoryState.rate,
          unrounded:memoryValues ? member.subtotal[key]*memoryState.rate : null,
          added:memoryValues ? memoryValues[key] : null,rounding:'各カード・各parameterごとにceil'}))};
      const subtotal=Object.fromEntries([...keys,'total'].map(key=>[key,member.subtotal[key]+result.passive[key]+(memoryValues ? memoryValues[key] : 0)]));
      const board=resolveTotalAdjustment(member.totalAdjustmentInputs?.board);
      const costume=resolveTotalAdjustment(member.totalAdjustmentInputs?.costume);
      const enhancementBonus=calculateEnhancementLayer({cardAfterBloom:member.subtotal.total,
        appliedPassive:result.passive.total,unresolvedPassive:unresolved.length?null:0,board:board.total,outfit:costume.total},enhancementInput);
      const enhancementTrace={kind:'Enhancement Bonus',targetCardId:member.cardId,targetSlot:prepared[index].slot,
        ...enhancementBonus,parameter:'total',added:enhancementBonus.total,memoryIncluded:false};
      const adjustmentTraces=Object.entries({board,costume}).map(([kind,value])=>({kind,targetCardId:member.cardId,targetSlot:prepared[index].slot,
        ...value,parameter:'total',includedInEnhancementBasis:value.status==='applied',enhancementCalculated:enhancementBonus.status==='applied'}));
      subtotal.total+=(board.total ?? 0)+(costume.total ?? 0)+(enhancementBonus.total ?? 0);
      return {...member,board,costume,totalAdjustments:{board,costume,enhancementBonus},enhancementBonus,passive:{...result.passive},memory,subtotal,unresolved,trace:[trace,memoryTrace,...adjustmentTraces,enhancementTrace],
        corrections:[...member.corrections,...Object.entries({Board:board,衣装:costume}).filter(([,v])=>v.status!=='applied').map(([label,v])=>({label,status:v.status,value:null,reason:v.reason})),...(enhancementBonus.status==='applied'?[]:[{label:'強化ボーナス',status:enhancementBonus.status,value:null,reason:enhancementBonus.reason}]),...(memoryState.status==='applied'?[]:[{label:'Memory',status:memoryState.status,value:null,reason:memoryState.reason}]),...unresolved.map(row=>({label:'Passive',status:row.status,value:null,reason:row.reason}))]};
    });
    const sum=part=>Object.fromEntries([...keys,'total'].map(key=>[key,members.reduce((total,member)=>total+member[part][key],0)]));
    const enhancementState=calculateEnhancementLayer({cardAfterBloom:0,appliedPassive:0,board:null,outfit:null},enhancementInput);
    const enhancementBonus={...enhancementState,total:enhancementState.status==='applied'?members.reduce((sum,m)=>sum+m.enhancementBonus.total,0):null};
    delete enhancementBonus.basis;delete enhancementBonus.components;delete enhancementBonus.unrounded;
    enhancementBonus.excluded=[...new Set(members.flatMap(member=>member.enhancementBonus.excluded))];
    enhancementBonus.scope=members.length===5 && !enhancementBonus.excluded.length?'complete-basis':'calculated-components-only';
    const adjustmentSum=kind=>({performance:null,technique:null,sense:null,
      total:members.some(m=>m[kind].status==='applied')?members.reduce((sum,m)=>sum+(m[kind].total ?? 0),0):null,
      status:members.length===5&&members.every(m=>m[kind].status==='applied')?'applied':'partial',
      states:members.map((m,i)=>({slot:m.slot ?? i+1,status:m[kind].status,reason:m[kind].reason}))});
    const board=adjustmentSum('board'),costume=adjustmentSum('costume');
    return {board,costume,totalAdjustments:{board,costume,enhancementBonus},enhancementBonus,members,base:sum('base'),opening:sum('opening'),passive:sum('passive'),memory:{...memoryState,...(memoryState.status==='applied'?sum('memory'):Object.fromEntries([...keys,'total'].map(key=>[key,null])))},subtotal:sum('subtotal'),final:null,
      unresolved:members.flatMap(member=>member.unresolved),trace:members.flatMap(member=>member.trace),
      status:members.length===5?'card-only':'incomplete',corrections:pending.map(label=>({label,status:'not-connected',value:null}))};
  }
  return {calculateMemberParameter,calculateUnitParameter,resolveInput,resolveMemory,calculateEnhancementLayer,resolveTotalAdjustment};
})();
