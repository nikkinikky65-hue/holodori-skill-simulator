// Support rates and time intersections only. No Parameter/Leader/ranking formulas.
const ScheduledSupportEngine = (() => {
  const passiveType='LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP';
  const attributeValid=value=>/^CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_[123]$/.test(value||'');
  function passive(members,catalog){
    const unitMembers=members.filter(Boolean).map(m=>({slot:m.slot,cardId:m.card.id,libraryCardId:m.card.id,type:m.card.classification.attributeType.raw}));
    const sources=[];
    const targets=unitMembers.map(m=>({...m,modifiers:[],rate:0}));
    for(const member of members.filter(Boolean)){
      const data=member.expansion.passive.data,raw=data.effect.raw;
      if(raw.type!==passiveType)continue;
      const source={sourceType:'passive',sourceSlot:member.slot,sourceCardId:member.card.id,description:data.description,level:data.level,
        raw:data,condition:null,candidates:[],targetSlots:[],status:'unresolved-condition',rate:null};
      sources.push(source);
      const rate=Number(raw.value);
      if(raw.value==null||String(raw.value).trim()===''||!Number.isFinite(rate)||rate<0||raw.number!==1){source.status='unresolved-effect';continue;}
      source.rate=rate/10;
      const clauses=data.condition.clauses;
      if(data.condition.state!=='observed'||clauses?.length!==1)continue;
      const c=clauses[0],requiredCount=Number(c.threshold);
      if(c.type==='LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_ATTRIBUTE'){
        source.condition=PartyConditionResolver.resolveAttributeCondition({attribute:c.cardAttributeType,requiredCount,unitMembers});
      }else if(c.type==='LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_CHARACTER_GROUPING'){
        source.condition=PartyConditionResolver.resolvePartyCondition({type:'affiliation_count',affiliationId:c.characterGroupingId,requiredCount,unitMembers,catalog});
      }
      if(!source.condition||source.condition.result==='unresolved')continue;
      if(source.condition.result==='unsatisfied'){source.status='inactive';continue;}
      const selectors=data.target.selectors;
      if(selectors?.length!==1){source.status='unresolved-target';continue;}
      const target=selectors[0];source.target=target;
      let candidates;
      if(target.type==='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_ATTRIBUTE'){
        if(!attributeValid(target.cardAttributeType)||unitMembers.some(m=>!attributeValid(m.type))){source.status='unresolved-target';continue;}
        candidates=unitMembers.filter(m=>m.type===target.cardAttributeType);
      }else if(target.type==='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_CHARACTER_GROUPING'){
        const membership=PartyConditionResolver.resolvePartyCondition({type:'affiliation_count',affiliationId:target.characterGroupingId,requiredCount:1,unitMembers,catalog});
        if(membership.result==='unresolved'){source.status='unresolved-target';continue;}
        candidates=membership.countedMembers;
      }else{source.status='unresolved-target';continue;}
      source.candidates=candidates;
      const resolution=resolveSupportTargets(candidates,target.targetCount);
      source.status=resolution.status;source.targetSlots=resolution.targets.map(t=>t.slot);
      for(const candidate of candidates){
        targets.find(t=>t.slot===candidate.slot).modifiers.push({sourceType:'passive',sourceSlot:member.slot,sourceCardId:member.card.id,value:source.rate,
          status:resolution.status,applied:resolution.status==='resolved'});
      }
    }
    for(const target of targets){target.rate=resolveSupportStacking(target.modifiers);}
    return {sources,targets,unresolved:sources.filter(s=>s.status.startsWith('unresolved')),
      stackingUnresolved:targets.filter(t=>t.modifiers.some(m=>m.status==='unresolved-stacking'))};
  }
  function evaluate(events,duration,schedule,passiveSupport,{trace=true}={}){
    const spans=schedule.status==='resolved'?schedule.entries:[];
    const points=[...new Set([0,duration,...events.flatMap(e=>[e.start,e.end]),...spans.flatMap(s=>[s.start,s.end])])].filter(t=>t>=0&&t<=duration).sort((a,b)=>a-b);
    const boosted=[],intervals=[];
    for(let i=0;i<points.length-1;i++){
      const start=points[i],end=points[i+1];if(end<=start)continue;
      const mid=(start+end)/2,sp=spans.find(s=>s.start<=mid&&mid<s.end);
      const active=events.filter(e=>e.start<=mid&&mid<e.end);
      const calculations=[];
      for(const event of active){
        const p=passiveSupport.targets.find(t=>t.slot===event.m.slot);
        const values=calculateSupportBoost(event.boost,sp?.scoreSupportRate||0,p?.rate||0);
        boosted.push({...event,start,end,boost:values.effectiveBoost});
        if(trace)calculations.push({slot:event.m.slot,...values,spSlot:sp?.slot??null,passiveModifiers:p?.modifiers||[]});
      }
      if(trace)intervals.push({start,end,state:active.length?(sp?'active+sp':'active-only'):(sp?'sp-only':'neither'),spSlot:sp?.slot??null,active:calculations});
    }
    // Existing max-overlap policy is the only winner selection rule.
    return {segments:ActiveTimelineEngine.maxSegments(boosted,duration),intervals};
  }
  return {passive,evaluate};
})();
