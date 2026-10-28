{
 const check=(v,m)=>{if(!v)throw Error(m);},f=PassiveSkillFilter;
 const runtime=JSON.parse(readFile('data/runtime-cards.json')),canonical=JSON.parse(readFile('research/canonical-cards.json'));
 const records=new Map(canonical.sourceRecords.map(r=>[r.table+'/'+r.sourceId,r.fields]));
 const effectMap={PERFORMANCE_UP_PERMIL_UP:'performance',TECHNIQUE_UP_PERMIL_UP:'technique',SENSE_UP_PERMIL_UP:'sense',ALL_PARAMETER_UP_PERMIL_UP:'all',LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP:'support'};
 let unknown=0,multiLevel=0,multiTarget=0;const counts={};
 for(const card of canonical.cards){
  const r=runtime.cards.find(r=>r.id===card.identity.sourceIdFact.rawValue),actual=f.units(r),expected=[];
  for(const level of card.skills.passive.levels){
   const source=records.get(level.source.table+'/'+level.source.sourceId);check(source,'raw level exists');
   const hasRef=Object.hasOwn(source,'liveSkillTriggerGroupId');
   check(!hasRef||typeof source.liveSkillTriggerGroupId==='string'&&source.liveSkillTriggerGroupId.length,'no null/empty trigger refs');
   check(Boolean(level.effect.condition)===hasRef,'raw field absence agrees with Canonical condition structure');
   const clauses=level.effect.condition?.sourceFacts||[];if(hasRef)check(clauses.some(x=>x.sourceField==='type'),'present ref has resolved trigger facts');
   const targetFacts=level.effect.target.sourceFacts.filter(x=>x.source.table==='LiveSkillEffectTarget');
   const types=targetFacts.filter(x=>x.sourceField==='type').map(x=>x.rawValue);const targets=[];
   if(types.length&&types.every(t=>t.endsWith('_SELF')))targets.push('self');
   if(types.some(t=>t.endsWith('_CHARACTER_GROUPING')))targets.push('affiliation');
   if(types.some(t=>t.endsWith('_ATTRIBUTE')))targets.push('attribute');
   const effect=level.effect.effect.facts.find(x=>x.sourceField==='type').rawValue;
   expected.push({level:level.levelFact.rawValue,condition:hasRef?'yes':'no',targets,effect:effectMap[effect.replace('LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_','')]||null});
  }
  check(JSON.stringify(actual)===JSON.stringify(expected),'all axes agree with Canonical/raw records '+r.id);
  unknown+=actual.filter(u=>!u.condition||!u.targets.length||!u.effect).length;
  multiTarget+=actual.filter(u=>u.targets.length>1).length;
  if(new Set(actual.map(({level,...rest})=>JSON.stringify(rest))).size>1)multiLevel++;
 }
 for(const [axis,values] of [['condition',['yes','no']],['targets',['self','affiliation','attribute']],['effects',['performance','technique','sense','all','support']]])for(const value of values){const s=f.empty();s[axis]=axis==='condition'?value:[value];counts[axis+':'+value]=runtime.cards.filter(c=>f.matches(c,s)).length;}
 check(counts['targets:affiliation']===41,'previous 41 preserved');check(unknown===0&&multiLevel===0&&multiTarget===0,'actual data fully classified without mixed levels/targets');
 const unit=(condition,targets,effect)=>({condition,targets,effect});
 check(!f.matchesUnits([unit('yes',['self'],'sense'),unit('no',['affiliation'],'all')],{condition:'no',targets:['affiliation'],effects:['sense']}),'cannot combine separate effects/levels');
 check(f.matchesUnits([unit('no',['affiliation'],'all')],{condition:'no',targets:['affiliation','attribute'],effects:['sense','all']}),'OR within axes AND between axes');
 check(!f.matchesUnits([unit('no',['self'],'all')],{condition:'',targets:[],effects:['sense']}),'all never implies sense');
 check(!f.matchesUnits([unit(null,['self'],'sense')],{condition:'no',targets:[],effects:[]}),'unknown condition is not absent');
 check(f.matchesUnits([],f.empty()),'empty filter never excludes cards');


 const makeLevel=(n,condition,target,effect)=>({level:n,condition,target:{selectors:[target]},effect:{raw:{type:'LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_'+effect}}});
 const self={type:'LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_SELF'},aff={type:'LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_CHARACTER_GROUPING',characterGroupingId:'grp-gen_0'};
 const yes={state:'observed',referenceState:'present',clauses:[{type:'trigger'}]},no={state:'unobserved',referenceState:'absent'};
 const fixture={skills:{passive:{levels:[makeLevel(1,yes,self,'SENSE_UP_PERMIL_UP'),makeLevel(2,no,aff,'ALL_PARAMETER_UP_PERMIL_UP')]}}};
 check(!f.matches(fixture,{condition:'no',targets:['affiliation'],effects:['sense']}),'runtime levels never combine');
 check(f.matches(fixture,{condition:'no',targets:['affiliation'],effects:['all']}),'Lv2 independently matches all axes');
 fixture.skills.passive.levels[0].condition={state:'unobserved'};
 check(f.units(fixture)[0].condition===null,'unobserved without evidence of absent reference is unknown');
 fixture.skills.passive.levels[0].effect.raw.type='LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_toString';
 check(f.units(fixture)[0].effect===null,'unrecognized effect is unclassified');
 fixture.skills.passive.levels[1].target.selectors.push(self);
 check(!f.units(fixture)[1].targets.includes('self')&&f.units(fixture)[1].targets.includes('affiliation'),'mixed self and other is not self-only');
 print('Passive axis audit: '+JSON.stringify(counts)+'; unknown levels '+unknown+'; different level classifications '+multiLevel+'; multi-target units '+multiTarget+' PASS');
}
