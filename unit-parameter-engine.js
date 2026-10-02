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
    if(targets?.length!==1 || targets[0].type!=='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_SELF') return unsupported('自己以外の対象・順位選択は未接続');
    const condition=level.condition;
    if(condition?.state!=='observed') return unsupported('条件未観測・未解決');
    const clauses=condition.clauses;
    if(clauses?.length!==1 || clauses[0].type!=='LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_ATTRIBUTE') return unsupported('属性人数以外の条件は未接続');
    const clause=clauses[0], count=Number(clause.threshold);
    if(!/^CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_[123]$/.test(clause.cardAttributeType || '') || clause.threshold==null || !Number.isInteger(count) || count<1) return unsupported('条件の属性・人数未確認');
    return {status:'supported',effect:{type,value:value/10,condition:{kind:'type',value:clause.cardAttributeType},
      conditionCount:count,target:{kind:'self'},targetCount:1}};
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
  function calculateUnitParameter(inputMembers, memoryInput, enhancementInput){
    const memoryState=resolveMemory(memoryInput);
    const bridges=inputMembers.map(member=>resolveInput(member.passiveInput));
    const prepared=inputMembers.map((member,index)=>({slot:member.slot ?? index+1,libraryCardId:member.cardId,
      type:member.attribute,base:{...member.subtotal},card:{skills:{passive:{effect:bridges[index].effect || {type:''}}}}}));
    // Existing accumulation/target resolution/ceil is the single source of calculation.
    const calculated=calculatePassiveEffects(prepared);
    const members=inputMembers.map((member,index)=>{
      const bridge=bridges[index], result=calculated.members[index];
      const resolution=calculated.passiveResults.find(row=>row.sourceSlot===prepared[index].slot);
      const trace={sourceCardId:member.cardId,sourceSlot:prepared[index].slot,level:member.passiveInput?.level,
        source:member.passiveInput?.source,description:member.passiveInput?.description,
        status:bridge.status==='unsupported'?'unsupported':resolution?.status,
        reason:bridge.reason || null,targetSlots:resolution?.targetSlots || [],
        targetCardIds:(resolution?.targetSlots || []).map(slot=>inputMembers[prepared.findIndex(row=>row.slot===slot)].cardId),
        effect:bridge.effect,parameters:[]};
      if(bridge.effect && resolution?.activated===true){
        for(const key of PARAMETER_PASSIVE_TYPES[bridge.effect.type]) trace.parameters.push({
          parameter:key,referenceValue:member.subtotal[key],ratePercent:result.passive.rates[key],
          unrounded:member.subtotal[key]*result.passive.rates[key]/100,added:result.passive[key],
          rounding:'同一parameterの率を合算後にceil',reference:'開花適用後・Passive適用前'});
      }
      const unresolved=bridge.status==='unsupported'?[trace]:[];
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
        corrections:[...member.corrections,...Object.entries({Board:board,衣装:costume}).filter(([,v])=>v.status!=='applied').map(([label,v])=>({label,status:v.status,value:null,reason:v.reason})),...(enhancementBonus.status==='applied'?[]:[{label:'強化ボーナス',status:enhancementBonus.status,value:null,reason:enhancementBonus.reason}]),...(memoryState.status==='applied'?[]:[{label:'Memory',status:memoryState.status,value:null,reason:memoryState.reason}]),...unresolved.map(row=>({label:'Passive',status:'unsupported',value:null,reason:row.reason}))]};
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
