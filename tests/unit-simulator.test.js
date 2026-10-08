{
const assertUnit=(ok,msg)=>{if(!ok)throw Error(msg);};
const catalog=canonicalTestFixture;
const slots=catalog.cards.slice(0,5).map(card=>({cardId:card.id,training:4,bloom:5,short:12}));
const model=UnitSimulatorEngine.build(catalog,slots,120);
assertUnit(model.members.length===5 && model.unitScore.value===model.parameters.subtotal.total && model.unitScore.status==='provisional','five members, provisional score');
for(let i=0;i<5;i++){
  const member=model.members[i], expected=calculateCardParameters(catalog.cards[i],4,5);
  for(const key of ['performance','technique','sense','total']){
    assertUnit(member.parameters.subtotal[key]===expected[key]+member.parameters.passive[key],'shared parameter values');
    assertUnit(member.parameters.base[key]+member.parameters.opening[key]+member.parameters.passive[key]===member.parameters.subtotal[key],'traceable breakdown');
  }
  assertUnit(member.parameters.final===null && member.parameters.corrections.every(c=>c.value===null),'unknown corrections not zero');
  assertUnit(JSON.stringify(member.expansion.levels)===JSON.stringify(canonicalBloomLevels(catalog.cards[i],5)),'shared skill levels');
}
assertUnit(model.parameters.subtotal.total===model.members.reduce((s,m)=>s+m.parameters.subtotal.total,0),'unit sum');
const first=UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(4));
assertUnit(JSON.stringify(first)===JSON.stringify(UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(4))),'shared reproducible simulation');
assertUnit(model.activeOnlyX===ActiveRandomSimulation.trial(ActiveRandomSimulation.prepare(model.activeMembers,120,ActiveTimelineEngine.events,()=>1),ActiveTimelineEngine.maxSegments,()=>0),'all-success integral');
assertUnit(first.values.every((value,i)=>value===first.normalized.values[i]*model.unitScore.value),'every trial scales exactly once');
assertUnit(model.allSuccessScore===model.allSuccessX*model.parameters.subtotal.total,'Timeline uses current total');
assertUnit(JSON.stringify(first.statistics)===JSON.stringify(ActiveRandomSimulation.statistics(first.values)),'numeric statistics');
assertUnit(model.unitScore.hasUnresolved && model.unitScore.unresolved.length>0,'unknowns retained beside number');
const grown=UnitSimulatorEngine.build(catalog,slots.map(s=>({...s,bloom:0})),120);
assertUnit(grown.unitScore.value!==model.unitScore.value,'Bloom updates score');
const replaced=UnitSimulatorEngine.build(catalog,slots.map((s,i)=>i===0?{...s,cardId:catalog.cards[10].id}:s),120);
assertUnit(replaced.unitScore.value!==model.unitScore.value,'member updates score');
const memory=UnitSimulatorEngine.build(catalog,slots,120,{kind:'manual-rate',percent:6.4});
const enhanced=UnitSimulatorEngine.build(catalog,slots,120,{kind:'manual-rate',percent:6.4},{kind:'manual-rate',percent:2.43});
assertUnit(memory.unitScore.value===model.unitScore.value+memory.parameters.memory.total,'Memory counted once');
assertUnit(enhanced.unitScore.value===memory.unitScore.value+enhanced.parameters.enhancementBonus.total,'Enhancement counted once');
const raw=ActiveRandomSimulation.run(ActiveRandomSimulation.prepare(model.activeMembers,120,ActiveTimelineEngine.events,q=>ActivationProbabilityRules.probability(q)),100,ActiveTimelineEngine.maxSegments,ActiveRandomSimulation.seededRandom(4));
assertUnit(JSON.stringify(UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(4),{support:false}).normalized)===JSON.stringify(raw),'seeded engine unchanged');
const empty=UnitSimulatorEngine.build(catalog,Array.from({length:5},()=>({cardId:'',training:0,bloom:0,short:0})),120);
assertUnit(empty.parameters.status==='incomplete' && empty.allSuccessX===120,'empty is incomplete');
let refused=false;try{UnitSimulatorEngine.simulate(empty,100);}catch(e){refused=true;}assertUnit(refused,'require five cards');
for(const card of catalog.cards){
  for(let bloom=0;bloom<=5;bloom++){
    const x=UnitSimulatorEngine.build(catalog,Array.from({length:5},()=>({cardId:card.id,training:0,bloom,short:0})),120);
    assertUnit(x.members.every(m=>m.expansion.levels.active===canonicalBloomLevels(card,bloom).active),'all cards and growth states');
  }
}
print('Unit simulator: 185 cards × 6 growth states, breakdowns, pending corrections, provisional score, shared Timeline and seeded simulation PASS');

}
