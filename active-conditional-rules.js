// Active replacement only. Player-state assumptions are mode policy, not game observations.
const ActiveConditionalRules = (() => {
  let affiliations = null;
  const policies = {current:{combo:true,life:true}, auto:{combo:false,life:true}};
  function condition(clause, members, catalog, policy){
    const type=String(clause.type || ''), requiredCount=Number(clause.threshold);
    if(type.endsWith('_DECK_CARD_ATTRIBUTE')) return PartyConditionResolver.resolveAttributeCondition({attribute:clause.cardAttributeType,requiredCount,unitMembers:members});
    if(type.endsWith('_DECK_CARD_CHARACTER_GROUPING')) return PartyConditionResolver.resolvePartyCondition({type:'affiliation_count',affiliationId:clause.characterGroupingId,requiredCount,unitMembers:members,catalog});
    if(type.endsWith('_COMBO_GTE') && requiredCount===40) return {result:policy.combo?'satisfied':'unsatisfied',basis:'mode-assumption',type,requiredCount};
    if(type.endsWith('_LIFE_GTE') && requiredCount===600) return {result:policy.life?'satisfied':'unsatisfied',basis:'mode-assumption',type,requiredCount};
    return {result:'unresolved',reason:'unsupported-condition'};
  }
  function resolve(level,members,catalog=affiliations,mode='current'){
    const baseBoost=Number(level.baseEffect.raw.value)/10, trace=[];
    const policy=policies[mode];
    for(const override of level.conditionalOverrides){
      const clauses=override.condition.clauses || [];
      const evaluations=policy&&override.condition.state==='observed'?clauses.map(c=>condition(c,members,catalog,policy)):[];
      const result=!evaluations.length||evaluations.some(c=>c.result==='unresolved')?'unresolved':evaluations.every(c=>c.result==='satisfied')?'satisfied':'unsatisfied';
      trace.push({condition:override.condition,evaluations,result,replacementBoost:Number(override.replacementEffect.raw.value)/10});
    }
    const matched=trace.filter(t=>t.result==='satisfied');
    const ambiguous=matched.length>1 || trace.some(t=>t.result==='unresolved');
    return {baseBoost,boost:!ambiguous&&matched.length===1?matched[0].replacementBoost:baseBoost,status:ambiguous?'unresolved':matched.length?'replaced':'base',mode,trace};
  }
  function apply(members,expansions,catalog=affiliations){
    const contexts=members.map((m,i)=>({slot:m.slot,cardId:expansions[i]?.source.cardId,libraryCardId:expansions[i]?.source.cardId,type:expansions[i]?.basic.classification.attributeType.rawValue || expansions[i]?.basic.classification.attributeType.raw}));
    return members.map((m,i)=>{const level=expansions[i]?.active.data;if(!level)return m;const resolution=resolve(level,contexts,catalog);return {...m,boost:resolution.boost,activeReplacement:resolution};});
  }
  const ready=typeof document!=='undefined'&&typeof fetch==='function'?fetch(new URL('data/runtime-affiliations.json',document.baseURI)).then(r=>{if(!r.ok)throw Error('affiliations');return r.json();}).then(c=>{affiliations=c;}).catch(()=>{}):Promise.resolve();
  return {resolve,apply,ready};
})();
