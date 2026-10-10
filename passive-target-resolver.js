// Membership and cardinality only. Deliberately no rank or N-person selection.
const PassiveTargetResolver = (() => {
  function resolve({affiliationId,targetCount,condition,unitMembers,catalog,maximumCount=false}){
    const base={type:'affiliation_members',affiliationId,targetCount,candidates:[],targets:[],excludedMembers:[],status:'unresolved',reason:null};
    if(condition?.result==='unsatisfied') return {...base,excludedMembers:[...unitMembers],status:'inactive',reason:'人数条件不成立'};
    if(condition?.result!=='satisfied') return {...base,reason:'所属人数条件が未解決'};
    const membership=PartyConditionResolver.resolvePartyCondition({type:'affiliation_count',affiliationId,requiredCount:1,unitMembers,catalog});
    base.candidates=membership.countedMembers; base.affiliationName=membership.affiliationName;
    if(membership.result==='unresolved') return {...base,reason:'対象所属の情報不足'};
    base.excludedMembers=unitMembers.filter(m=>!base.candidates.some(c=>c.slot===m.slot));
    if(!Number.isInteger(targetCount)||targetCount<1) return {...base,reason:'対象人数未確認'};
    if(maximumCount ? base.candidates.length>targetCount : base.candidates.length!==targetCount) return {...base,reason:base.candidates.length>targetCount?'target selection unresolved: 候補が対象人数を超過（順位選択未実装）':'対象候補が指定人数に不足'};
    return {...base,targets:[...base.candidates],status:'resolved'};
  }
  function resolveAttribute({attribute,condition,unitMembers}){
    if(condition.result!=='satisfied') return {type:'attribute_members',attribute,candidates:[],targets:[],excludedMembers:[],status:condition.result==='unsatisfied'?'inactive':'unresolved',reason:condition.result==='unsatisfied'?'属性人数条件不成立':'属性人数条件未解決'};
    return {type:'attribute_members',attribute,candidates:unitMembers.filter(m=>m.type===attribute),
      excludedMembers:unitMembers.filter(m=>m.type!==attribute),targets:[],status:'candidates-resolved',reason:null};
  }
  return {resolve,resolveAttribute};
})();
