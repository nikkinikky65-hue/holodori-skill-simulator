{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const rates=percent=>({kind:'manual-rate',percent});
const card=canonicalTestFixture.cards.find(c=>c.id==='card-00022-3-nrml-0018-00');
const slots=Array.from({length:5},()=>({cardId:card.id,training:0,bloom:4,short:0}));
const build=(memory,enhancement)=>UnitSimulatorEngine.build(canonicalTestFixture,slots,120,rates(memory),enhancement);
const before=build('6.4'),zero=build('6.4',rates('0')),after=build('6.4',rates('2.43'));
check(before.parameters.enhancementBonus.status==='unset'&&before.parameters.enhancementBonus.total===null,'unset');
check(zero.parameters.enhancementBonus.total===0&&zero.parameters.subtotal.total===before.parameters.subtotal.total,'explicit zero');
for(let i=0;i<5;i++){
 const m=after.parameters.members[i],old=before.parameters.members[i];
 check(JSON.stringify(m.passive)===JSON.stringify(old.passive)&&JSON.stringify(m.memory)===JSON.stringify(old.memory),'P/Memory unchanged');
 check(JSON.stringify(m.trace.find(t=>t.kind==='Memory'))===JSON.stringify(old.trace.find(t=>t.kind==='Memory')),'Memory trace unchanged');
 const basis=m.base.total+m.opening.total+m.passive.total;
 check(m.enhancementBonus.total===calculateEnhancementBonus(basis,.0243),'existing per-member ceil');
 check(m.enhancementBonus.performance===null && m.enhancementBonus.technique===null && m.enhancementBonus.sense===null,'no invented distribution');
 const trace=m.trace.find(t=>t.kind==='Enhancement Bonus');
 check(trace.basis===basis && trace.components.board===null && trace.memoryIncluded===false,'trace basis and unknown components');
 check(m.subtotal.total===old.subtotal.total+m.enhancementBonus.total,'subtotal');
}
check(after.parameters.enhancementBonus.total===after.parameters.members.reduce((s,m)=>s+m.enhancementBonus.total,0),'sum member rounding');
check(build('50',rates('2.43')).parameters.enhancementBonus.total===after.parameters.enhancementBonus.total,'memory excluded');
check(JSON.stringify(after.segments)===JSON.stringify(before.segments)&&after.unitScore.value===null,'Timeline and X unchanged');
check(JSON.stringify(UnitSimulatorEngine.simulate(after,100,ActiveRandomSimulation.seededRandom(1)))===JSON.stringify(UnitSimulatorEngine.simulate(before,100,ActiveRandomSimulation.seededRandom(1))),'seed unchanged');
for(const input of [rates('-1'),rates('invalid'),{kind:'unknown',percent:'2.43'}])check(build('6.4',input).parameters.enhancementBonus.status==='unsupported','unsupported');
print('Enhancement: unchanged Memory/Passive, scalar ceil, basis trace, null/zero/unsupported, partial scope and Timeline/Simulation PASS');
}
