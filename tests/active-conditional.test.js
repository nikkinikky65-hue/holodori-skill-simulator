(()=>{
 const check=(x,m)=>{if(!x)throw Error(m);};
 const catalog=canonicalTestFixture, affiliation=JSON.parse(readFile('data/runtime-affiliations.json'));
 let count=0;
 for(const card of catalog.cards)for(const level of card.skills.active.levels){
  if(!level.conditionalOverrides.length)continue;
  count++;const clause=level.conditionalOverrides[0].condition.clauses[0];
  let members=catalog.cards.slice(0,5).map((c,i)=>({slot:i+1,cardId:c.id,libraryCardId:c.id,type:clause.cardAttributeType||c.classification.attributeType.raw}));
  if(clause.characterGroupingId){const group=affiliation.groups[clause.characterGroupingId];const cards=catalog.cards.filter(c=>group.characterIds.includes(affiliation.cardCharacters[c.id]));members=Array.from({length:5},(_,i)=>({slot:i+1,cardId:cards[i%cards.length].id}));}
  const result=ActiveConditionalRules.resolve(level,members,affiliation);
  check(result.boost===Number(level.conditionalOverrides[0].replacementEffect.raw.value)/10,'replacement '+card.id+' Lv'+level.level);
  check(result.baseBoost===Number(level.baseEffect.raw.value)/10,'base preserved');
  if(clause.cardAttributeType||clause.characterGroupingId){
   const others=catalog.cards.filter(c=>clause.cardAttributeType?c.classification.attributeType.raw!==clause.cardAttributeType:!affiliation.groups[clause.characterGroupingId].characterIds.includes(affiliation.cardCharacters[c.id]));
   const outside=others.slice(0,5).map((c,i)=>({slot:i+1,cardId:c.id,type:c.classification.attributeType.raw}));
   check(ActiveConditionalRules.resolve(level,outside,affiliation).status==='base','false');
   outside[0]=members[0];check(ActiveConditionalRules.resolve(level,outside,affiliation).status==='base','one');
   outside[1]=members[1];check(ActiveConditionalRules.resolve(level,outside,affiliation).status==='replaced','two');
   check(ActiveConditionalRules.resolve(level,[{},...members.slice(1)],affiliation).status==='unresolved','unknown');
  }else check(ActiveConditionalRules.resolve(level,members,affiliation,'auto').status===(clause.type.endsWith('_COMBO_GTE')?'base':'replaced'),'future policy');
 }
 check(count===148,'all 148');
 const card=catalog.cards.find(c=>c.skills.active.levels[0].conditionalOverrides.some(o=>o.condition.clauses[0].type.endsWith('_COMBO_GTE')));
 const expansion=expandCanonicalBloom(card,0,catalog.dataset,0);
 const input={slot:1,boost:35,interval:26,duration:9,short:0,prob:'mid'};
 const applied=ActiveConditionalRules.apply([input],[expansion],affiliation)[0];
 check(applied.boost===Number(expansion.active.data.conditionalOverrides[0].replacementEffect.raw.value)/10,'apply');
 check(JSON.stringify(ActiveTimelineEngine.events(input,120).map(e=>[e.start,e.end]))===JSON.stringify(ActiveTimelineEngine.events(applied,120).map(e=>[e.start,e.end])),'timing unchanged');
 check(ActiveConditionalRules.apply([input],[null])[0]===input,'manual unchanged');
 const support=calculateSupportBoost(applied.boost,60);check(support.effectiveBoost===applied.boost*1.6,'support after replacement');
 const prep=ActiveRandomSimulation.prepare([applied],120,ActiveTimelineEngine.events,()=>1);
 check(ActiveRandomSimulation.trial(prep,ActiveTimelineEngine.maxSegments,()=>0)===ActiveRandomSimulation.integrate(ActiveTimelineEngine.maxSegments(ActiveTimelineEngine.events(applied,120),120),120),'timeline/random parity');
 print('Active conditional: all 148 levels, conditions, mode, missing data, timing and Support: PASS');
})();
