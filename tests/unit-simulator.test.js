{
const assertUnit=(ok,msg)=>{if(!ok)throw Error(msg);};
const catalog=canonicalTestFixture;
const slots=catalog.cards.slice(0,5).map(card=>({cardId:card.id,training:4,bloom:5,short:12}));
const model=UnitSimulatorEngine.build(catalog,slots,120);
assertUnit(model.members.length===5 && model.unitScore.value===null && model.unitScore.symbol==='X','five members, symbolic score');
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
assertUnit(model.allSuccessX===ActiveRandomSimulation.trial(ActiveRandomSimulation.prepare(model.activeMembers,120,ActiveTimelineEngine.events,()=>1),ActiveTimelineEngine.maxSegments,()=>0),'all-success integral');
const empty=UnitSimulatorEngine.build(catalog,Array.from({length:5},()=>({cardId:'',training:0,bloom:0,short:0})),120);
assertUnit(empty.parameters.status==='incomplete' && empty.allSuccessX===120,'empty is incomplete');
let refused=false;try{UnitSimulatorEngine.simulate(empty,100);}catch(e){refused=true;}assertUnit(refused,'require five cards');
for(const card of catalog.cards){
  for(let bloom=0;bloom<=5;bloom++){
    const x=UnitSimulatorEngine.build(catalog,Array.from({length:5},()=>({cardId:card.id,training:0,bloom,short:0})),120);
    assertUnit(x.members.every(m=>m.expansion.levels.active===canonicalBloomLevels(card,bloom).active),'all cards and growth states');
  }
}
print('Unit simulator: 185 cards × 6 growth states, breakdowns, pending corrections, symbolic X, shared Timeline and seeded simulation PASS');

}
