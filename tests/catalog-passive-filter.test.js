{
 const check=(v,m)=>{if(!v)throw Error(m);},prefix='LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_';
 const runtime=JSON.parse(readFile('data/runtime-cards.json')),canonical=JSON.parse(readFile('research/canonical-cards.json')),groups=JSON.parse(readFile('data/runtime-affiliations.json')).groups;
 let count=0,levels=0,conditionOnly=0;const rarities={},groupCounts={};
 for(const c of canonical.cards){
  let matched=false;
  for(const l of c.skills.passive.levels){
   check([1,2].includes(l.levelFact.rawValue),'known level');
   check(l.sourceReferences.filter(r=>r.target.table==='LivePassiveSkillEffect').length===1,'no omitted additional effects in projection');
   const targets=new Map();
   for(const f of l.effect.target.sourceFacts || [])if(f.source.table==='LiveSkillEffectTarget'){
    if(!targets.has(f.source.sourceId))targets.set(f.source.sourceId,{});targets.get(f.source.sourceId)[f.sourceField]=f.rawValue;
   }
   check(targets.size>0,'target facts present');
   const raw=[...targets.values()];for(const t of raw)check(['SELF','ATTRIBUTE','CHARACTER_GROUPING','ALL'].some(type=>t.type===prefix+type),'target kind is understood');
   const hits=raw.filter(t=>t.type===prefix+'CHARACTER_GROUPING');
   for(const t of hits)check(Object.hasOwn(groups,t.characterGroupingId),'group reference exists');
   const r=runtime.cards.find(x=>x.id===c.identity.sourceIdFact.rawValue),rl=r.skills.passive.levels.find(x=>x.level===l.levelFact.rawValue);
   const pairs=xs=>xs.map(t=>[t.type,t.characterGroupingId??null]).sort();
   check(JSON.stringify(pairs(raw))===JSON.stringify(pairs(rl.target.selectors)),'Runtime preserves Canonical selectors');
   if(hits.length){matched=true;levels++;for(const t of hits)groupCounts[t.characterGroupingId]=(groupCounts[t.characterGroupingId]||0)+1;}
   else if((l.effect.condition?.sourceFacts||[]).some(f=>f.sourceField==='characterGroupingId'))conditionOnly++;
  }
  const r=runtime.cards.find(x=>x.id===c.identity.sourceIdFact.rawValue);check(hasAffiliationTargetPassive(r)===matched,'predicate agrees with Canonical '+c.identity.sourceIdFact.rawValue);
  if(matched){count++;const rarity=r.classification.rarity.mapping.value;rarities[rarity]=(rarities[rarity]||0)+1;}
 }
 check(count===41&&levels===82,'audited card/level count');check(conditionOnly>0,'real affiliation-trigger-only cases excluded');
 const target=type=>({type:prefix+type,characterGroupingId:type==='CHARACTER_GROUPING'?'grp-gen_0':undefined});
 const level=(n,selectors)=>({level:n,effect:{raw:{type:'test-effect'}},target:{selectors},condition:{clauses:[{characterGroupingId:'grp-gen_0'}]},description:'所属への効果という説明は判定に使わない'});
 const card=ls=>({skills:{passive:{levels:ls}}});
 for(const t of ['SELF','ATTRIBUTE','ALL'])check(!hasAffiliationTargetPassive(card([level(1,[target(t)]),level(2,[target(t)])])),'exclude '+t+' even with affiliation trigger');
 check(hasAffiliationTargetPassive(card([level(1,[target('SELF')]),level(2,[target('CHARACTER_GROUPING')])])),'Lv2-only included');
 check(hasAffiliationTargetPassive(card([level(1,[target('CHARACTER_GROUPING')]),level(2,[target('SELF')])])),'Lv1-only included');
 check(hasAffiliationTargetPassive(card([level(1,[target('SELF'),target('CHARACTER_GROUPING')])])),'coexisting targets included');
 check(!hasAffiliationTargetPassive(card([level(1,[{type:prefix+'CHARACTER_GROUPING'}])])),'missing group ID excluded');
 check(!hasAffiliationTargetPassive(card([level(3,[target('CHARACTER_GROUPING')])])),'unknown level excluded');
 check(!hasAffiliationTargetPassive({}),'missing skill excluded');
 print('Passive affiliation: '+count+' cards / '+levels+' levels; rarity '+JSON.stringify(rarities)+'; affiliation-condition-only excluded levels '+conditionOnly+'; ambiguous/unknown references 0 PASS');
 print('Group target level counts: '+JSON.stringify(groupCounts));
}
