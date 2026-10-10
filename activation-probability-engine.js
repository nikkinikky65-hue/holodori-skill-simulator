// Rates are fractions (40% = .4). No timing/frequency or Parameter calculation.
const ActivationProbabilityEngine = (() => {
  const effectType='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_LIVE_ACTIVE_SKILL_ACTIVATION_PROBABILITY_UP_PERMIL_UP';
  function fromSchedule(schedule){
    return schedule.entries.flatMap(sp=>sp.effects.flatMap((entry,index)=>{
      if(entry.effect.raw.type!==effectType)return [];
      // This effect is scoped to activation starts, not selected members.
      // User-confirmed no-condition SP policy; keep raw condition metadata intact.
      const noCondition=entry.condition.state==='unobserved' && !entry.condition.clauses?.length;
      const validRate=entry.effect.raw.value!=null && String(entry.effect.raw.value).trim()!=='' && Number.isFinite(Number(entry.effect.raw.value)) && Number(entry.effect.raw.value)>=0;
      const reasons=[];
      if(!noCondition)reasons.push('condition-evaluation-deferred');
      if(!validRate)reasons.push('invalid-rate');
      if(schedule.status!=='resolved')reasons.push('schedule-unresolved');
      return [{sourceType:'sp',sourceId:`${sp.cardId}:SP:${sp.level}:${index}`,sourceSlot:sp.slot,
        level:sp.level,source:entry.effect.source,rate:Number(entry.effect.raw.value)/1000,
        scope:'activation-start',targetMembers:null,start:sp.start,end:sp.end,timing:'limited',
        conditionState:noCondition?'satisfied':'unresolved',condition:entry.condition,applicable:reasons.length===0,aggregationGroup:'external-additive',
        conditionPolicy:'user-confirmed-no-condition-SP-probability',
        unresolvedReasons:reasons,
        scheduleStatus:schedule.status}];
    }));
  }
  function resolve({baseProbability,member,time,sources=[],spEnabled=true,allowHypothesis=false}){
    if(!Number.isFinite(baseProbability)||baseProbability<0||baseProbability>1||!Number.isFinite(time))throw Error('Invalid probability context');
    const rows=sources.map(source=>{
      let reason=null;
      if(source.sourceType==='sp'&&!spEnabled)reason='sp-disabled';
      else if(source.conditionState==='unsatisfied')reason='condition-inactive';
      else if(source.conditionState!=='satisfied'||source.applicable!==true)reason='unresolved';
      else if(!(source.sourceType==='sp'&&source.scope==='activation-start')&&!Array.isArray(source.targetMembers))reason='target-unresolved';
      else if(!(source.sourceType==='sp'&&source.scope==='activation-start')&&!source.targetMembers.includes(member))reason='not-target';
      else if(!Number.isFinite(source.rate)||source.rate<0)reason='invalid-rate';
      else if(source.timing!=='constant' && source.timing!=='limited')reason='timing-unresolved';
      else if(source.timing==='limited'&&(!Number.isFinite(source.start)||!Number.isFinite(source.end)||source.end<=source.start))reason='invalid-interval';
      else if(source.timing==='limited'&&!(source.start<=time&&time<source.end))reason='outside-interval';
      else if(source.aggregationGroup!=='external-additive' && !(allowHypothesis&&source.aggregationGroup==='hypothesis-board-sp'))reason='aggregation-unresolved';
      return {...source,applied:reason===null,reason};
    });
    // Mixing groups needs its own evidence; never silently merge them.
    if(new Set(rows.filter(r=>r.applied).map(r=>r.aggregationGroup)).size>1){
      rows.filter(r=>r.applied).forEach(r=>{r.applied=false;r.reason='mixed-groups-unresolved';});
    }
    const rate=rows.filter(r=>r.applied).map(r=>r.rate).sort((a,b)=>a-b).reduce((a,b)=>a+b,0);
    const rawProbability=baseProbability*(1+rate);
    return {member,time,baseProbability,rate,rawProbability,probability:Math.max(0,Math.min(1,rawProbability)),
      clampPolicy:'mathematical-draw-bound-not-game-evidence',sources:rows};
  }
  return {fromSchedule,resolve};
})();
