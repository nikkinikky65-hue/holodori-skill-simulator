{
const check=(ok,message)=>{if(!ok)throw Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const entries=Array.from({length:5},(_,i)=>({slot:i+1,duration:8,effects:[],scoreSupportRate:0}));
for(const [duration,expected] of [[150,[15,45,75,105,135]],[120,[12,36,60,84,108]]]){
 const schedule=SpecialScheduleEngine.place(entries,duration);
 check(same(schedule.entries.map(e=>e.start),expected),'provisional midpoint placement');
}
const tens=entries.map(e=>({...e,duration:10}));
const pushed=SpecialScheduleEngine.place(tens,100,{1:80});
check(same(pushed.entries.map(e=>e.start),[50,60,70,80,90]),'chain pushing and end reservation');
check(pushed.entries.every((e,i)=>e.duration===10&&e.end<=100&&(!i||e.start>=pushed.entries[i-1].end)),'no overlap/truncation');
check(pushed.entries[0].placement==='manual'&&pushed.entries[1].placement==='provisional'&&pushed.entries[1].adjusted,'placement provenance');
check(SpecialScheduleEngine.place(tens,40).status==='unresolved','infeasible song is not shortened');
check(SpecialScheduleEngine.place(tens,100,{2:-50}).entries[1].start===20,'cannot cross previous SP');
let invalid=false;try{SpecialScheduleEngine.place(tens,100,{1:NaN});}catch(e){invalid=true;}check(invalid,'invalid input rejected');
const catalog=JSON.parse(JSON.stringify(canonicalTestFixture));catalog.affiliationCatalog=JSON.parse(readFile('data/runtime-affiliations.json'));
for(const card of catalog.cards)for(const bloom of [0,3]){
 const expansion=expandCanonicalBloom(card,bloom,catalog.dataset,0);
 const sp=SpecialScheduleEngine.describe({slot:1,card,expansion});
 check(sp.duration===expansion.special.data.raw.effectDurationMillisecond/1000,'all 370 durations');
 check(sp.scoreSupportRate===Number(expansion.special.data.effects[0].effect.raw.value)/10,'all primary support rates');
 check(sp.effects.length===expansion.special.data.effects.length,'independent effects preserved');
 check(sp.effects.slice(1).every(e=>e.status==='unresolved'),'other effects deferred');
 check(expansion.special.data.effects[0].condition.state==='unobserved','source metadata not rewritten');
}
const member={slot:1};
const event={start:5,end:25,boost:50,m:member};
const schedule={status:'resolved',entries:[{slot:2,start:10,end:20,duration:10,scoreSupportRate:120}]};
const passive={targets:[{slot:1,rate:8,modifiers:[{sourceType:'passive',value:8,applied:true}]}]};
const supported=ScheduledSupportEngine.evaluate([event],30,schedule,passive);
// 10s without Active + 10s Active54% + 10s Active114%.
check(Math.abs(ActiveRandomSimulation.integrate(supported.segments,30)-46.8)<1e-9,'SP+Passive support uses existing additive rate formula only in overlap');
check(supported.intervals.some(i=>i.state==='neither')&&supported.intervals.some(i=>i.state==='active-only')&&supported.intervals.some(i=>i.state==='active+sp'),'interval states');
const idle=ScheduledSupportEngine.evaluate([],30,schedule,passive);
check(ActiveRandomSimulation.integrate(idle.segments,30)===30&&idle.intervals.some(i=>i.state==='sp-only'),'SP alone has no score multiplier');
const second={start:5,end:25,boost:100,m:{slot:2}};
const maxed=ScheduledSupportEngine.evaluate([event,second],30,schedule,passive);
check(maxed.segments.every(s=>s.slot===2),'same existing maximum policy with overlapping Actives');
check(maxed.segments.find(s=>s.start===10).boost===220,'SP boosts active effect, not base unit score');
check(supported.intervals.find(i=>i.state==='active+sp').active[0].additionalSupportRate===8,'Passive contribution traced separately');
const excluded=ScheduledSupportEngine.evaluate([event],30,schedule,{targets:[{slot:1,rate:0,modifiers:[{value:8,applied:false,status:'unresolved-target-selection'}]}]});
check(excluded.segments.find(s=>s.start===10).boost===110,'unresolved Passive excluded from SP sum');
const noSupport=ScheduledSupportEngine.evaluate([event],30,{status:'resolved',entries:[{...schedule.entries[0],scoreSupportRate:0}]},{targets:[]});
check(same(noSupport.segments,ActiveTimelineEngine.maxSegments([event],30)),'zero support identical segments');
const conditional=JSON.parse(JSON.stringify(catalog.cards[0]));conditional.skills.special.levels[0].effects[0].condition={state:'observed',clauses:[{type:'unknown'}]};
check(SpecialScheduleEngine.describe({slot:1,card:conditional,expansion:expandCanonicalBloom(conditional,0,catalog.dataset,0)}).scoreSupportRate===0,'conditional primary deferred');
const allCards=catalog.cards;
const sourceCard=allCards.find(c=>{const p=c.skills.passive.levels[0];return p.effect.raw.type.endsWith('_LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP')&&p.condition.clauses?.[0]?.cardAttributeType;});
function supportMembers(count,unknown=false){
 const level=sourceCard.skills.passive.levels[0],attribute=level.target.selectors[0].cardAttributeType;
 return Array.from({length:5},(_,i)=>{
  const card=JSON.parse(JSON.stringify(sourceCard));card.classification.attributeType.raw=i<count?attribute:attribute.endsWith('1')?'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2':'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1';
  const expansion=expandCanonicalBloom(card,0,catalog.dataset,0);
  if(i!==0)expansion.passive.data.effect.raw.type='parameter-not-support';
  if(unknown)expansion.passive.data.condition.state='unobserved';
  return {slot:i+1,card,expansion};
 });
}
for(const [count,status] of [[2,'inactive'],[3,'resolved'],[4,'unresolved-target-selection']]){
 const p=ScheduledSupportEngine.passive(supportMembers(count),catalog.affiliationCatalog);
 check(p.sources[0].status===status,'condition vs selection state');
 check(p.targets.filter(t=>t.rate>0).length===(count===3?3:0),'unique targets only');
}
check(ScheduledSupportEngine.passive(supportMembers(3,true),catalog.affiliationCatalog).sources[0].status==='unresolved-condition','unobserved not always');
const multiple=supportMembers(3);multiple[1].expansion.passive.data=JSON.parse(JSON.stringify(multiple[0].expansion.passive.data));
const stack=ScheduledSupportEngine.passive(multiple,catalog.affiliationCatalog);
check(stack.targets.every(t=>t.rate===0)&&stack.stackingUnresolved.length===3,'multiple Passive stacking deferred like A');
const missing=supportMembers(3);missing[4].card.classification.attributeType.raw=null;
check(ScheduledSupportEngine.passive(missing,catalog.affiliationCatalog).sources[0].status==='unresolved-condition','missing attribute not false');
const small=supportMembers(1);small[0].expansion.passive.data.condition.clauses[0].threshold='1';
check(ScheduledSupportEngine.passive(small,catalog.affiliationCatalog).targets.filter(t=>t.rate>0).length===1,'below target cap unique');
const conditionAttribute=small[0].expansion.passive.data.condition.clauses[0].cardAttributeType;
small.forEach(m=>m.card.classification.attributeType.raw=conditionAttribute);
small[0].expansion.passive.data.target.selectors[0].cardAttributeType=conditionAttribute.endsWith('1')?'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2':'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1';
const zero=ScheduledSupportEngine.passive(small,catalog.affiliationCatalog);
check(zero.sources[0].status==='resolved'&&zero.sources[0].targetSlots.length===0&&zero.targets.every(t=>t.rate===0),'satisfied but zero candidates applies nothing');
// Actual observed Passive Support rows: attribute 9 cards and affiliation 10 cards.
let observedRows=0;
for(const source of catalog.cards)for(const data of source.skills.passive.levels){
 if(!data.effect.raw.type.endsWith('_LIVE_ACTIVE_SKILL_EFFECT_UP_PERMIL_UP')||data.condition.state!=='observed')continue;
 observedRows++;
 const clause=data.condition.clauses[0],threshold=Number(clause.threshold),selector=data.target.selectors[0];
 const isInside=c=>clause.cardAttributeType?c.classification.attributeType.raw===clause.cardAttributeType:catalog.affiliationCatalog.groups[clause.characterGroupingId].characterIds.includes(catalog.affiliationCatalog.cardCharacters[c.id]);
 const inside=catalog.cards.filter(isInside),outside=catalog.cards.filter(c=>!isInside(c));
 for(const count of [threshold-1,threshold,threshold+1]){
  const cards=[...inside.slice(0,count),...outside.slice(0,5-count)];
  const ms=cards.map((card,i)=>{
   const expansion=expandCanonicalBloom(card,0,catalog.dataset,0);
   expansion.passive.data=i===0?JSON.parse(JSON.stringify(data)):{effect:{raw:{type:'not-support'}}};
   return {slot:i+1,card,expansion};
  });
  const result=ScheduledSupportEngine.passive(ms,catalog.affiliationCatalog);
  check(result.sources[0].status===(count<threshold?'inactive':count>selector.targetCount?'unresolved-target-selection':'resolved'),'all observed Support rows preserve target limits');
  if(!clause.cardAttributeType){
   const unknown=JSON.parse(JSON.stringify(catalog.affiliationCatalog));delete unknown.cardCharacters[ms[4].card.id];
   check(ScheduledSupportEngine.passive(ms,unknown).sources[0].status==='unresolved-condition','missing affiliation deferred');
  }
 }
}
check(observedRows===38,'19 observed Support cards / 38 levels');
const slots=Array.from({length:5},()=>({cardId:catalog.cards[0].id,training:0,bloom:0,short:0}));
const model=UnitSimulatorEngine.build(catalog,slots,120);
check(model.specialSchedule.entries.length===5,'five SP slots');
const run=seed=>UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(seed));
check(same(run(19),run(19)),'fixed seed SP simulation');
const prepared=ActiveRandomSimulation.prepare(model.activeMembers,120,ActiveTimelineEngine.events,q=>ActivationProbabilityRules.probability(q));
let calls=0;UnitSimulatorEngine.simulate(model,2,()=>{calls++;return .5;});
check(calls===prepared.candidates.length*2,'SP is deterministic; no extra random draws');
const clone={...model,specialSchedule:{status:'resolved',entries:model.specialSchedule.entries.map(e=>({...e,scoreSupportRate:0}))},passiveSupport:{targets:[]}};
check(same(UnitSimulatorEngine.simulate(clone,100,ActiveRandomSimulation.seededRandom(3)).normalized,UnitSimulatorEngine.simulate(clone,100,ActiveRandomSimulation.seededRandom(3),{support:false}).normalized),'zero support seeded parity');
check(model.allSuccessX>=model.activeOnlyX,'Support applies to integrated score');
check(UnitSimulatorEngine.simulate(model,10000,ActiveRandomSimulation.seededRandom(7)).values.length===10000,'10000 scheduled trials');
print('SP schedule/Support: 370 levels, midpoint starts, cascading constraints, interval support, unique Passive targets, deferred states, deterministic simulation PASS');
}
