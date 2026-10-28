// Search classification only. No activation evaluation or parameter calculation.
const PassiveSkillFilter = (() => {
  const effectPrefix='LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_';
  const effectKinds={PERFORMANCE_UP_PERMIL_UP:'performance',TECHNIQUE_UP_PERMIL_UP:'technique',SENSE_UP_PERMIL_UP:'sense',ALL_PARAMETER_UP_PERMIL_UP:'all',LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP:'support'};
  const targetPrefix='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_';
  function units(card){
    return (card.skills?.passive?.levels || []).filter(l=>[1,2].includes(l.level)&&typeof l.effect?.raw?.type==='string').map(l=>{
      const c=l.condition;
      let condition=null;
      if(c?.referenceState==='present'&&c.state==='observed'&&c.clauses?.length&&c.clauses.every(x=>typeof x.type==='string'&&x.type))condition='yes';
      else if(c?.referenceState==='absent'&&c.state==='unobserved'&&!c.clauses?.length&&!c.referenceId)condition='no';
      const selectors=l.target?.selectors || [],targets=[];
      // SELF means only self, not a mixed self + other selector.
      if(selectors.length&&selectors.every(s=>s.type===targetPrefix+'SELF'))targets.push('self');
      if(selectors.some(s=>s.type===targetPrefix+'CHARACTER_GROUPING'&&typeof s.characterGroupingId==='string'&&s.characterGroupingId.trim()))targets.push('affiliation');
      if(selectors.some(s=>s.type===targetPrefix+'ATTRIBUTE'&&/^CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_[123]$/.test(s.cardAttributeType||'')))targets.push('attribute');
      const type=l.effect.raw.type,kind=type.startsWith(effectPrefix)?type.slice(effectPrefix.length):'';
      return {level:l.level,condition,targets,effect:Object.hasOwn(effectKinds,kind)?effectKinds[kind]:null};
    });
  }
  const empty=()=>({condition:'',targets:[],effects:[]});
  const active=s=>Boolean(s.condition||s.targets.length||s.effects.length);
  function matchesUnits(items,s){
    if(!active(s))return true;
    return items.some(u=>(!s.condition||u.condition===s.condition)&&(!s.targets.length||s.targets.some(t=>u.targets.includes(t)))&&(!s.effects.length||s.effects.includes(u.effect)));
  }
  return {empty,active,units,matchesUnits,matches:(card,s)=>matchesUnits(units(card),s)};
})();
