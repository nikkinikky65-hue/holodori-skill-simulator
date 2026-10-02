{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const input=value=>({kind:'external-total',value});
for(const value of ['',null])check(UnitParameterEngine.resolveTotalAdjustment(input(value)).status==='unset','unset');
check(UnitParameterEngine.resolveTotalAdjustment(input('0')).total===0,'explicit zero');
for(const value of ['-1','1.5','bad',true,'9007199254740992'])check(UnitParameterEngine.resolveTotalAdjustment(input(value)).status==='invalid','invalid');
const card=canonicalTestFixture.cards.find(c=>c.id==='card-00022-3-nrml-0018-00');
const slots=Array.from({length:5},()=>({cardId:card.id,training:0,bloom:4,short:0}));
const build=(rows,memory='6.4')=>UnitSimulatorEngine.build(canonicalTestFixture,rows,120,{kind:'manual-rate',percent:memory},{kind:'manual-rate',percent:'2.43'});
const before=build(slots);
const filled=slots.map(s=>({...s,totalAdjustments:{board:input('2937'),costume:input('0')}}));
const after=build(filled);
check(after.parameters.enhancementBonus.scope==='complete-basis','complete explicit basis');
check(before.parameters.enhancementBonus.scope!=='complete-basis','unset partial');
for(let i=0;i<5;i++){
 const a=after.parameters.members[i],b=before.parameters.members[i];
 check(a.board.total===2937&&a.costume.total===0&&a.board.performance===null,'TOTAL only');
 check(JSON.stringify(a.passive)===JSON.stringify(b.passive)&&JSON.stringify(a.memory)===JSON.stringify(b.memory),'P/Memory unchanged');
 check(a.enhancementBonus.basis===b.enhancementBonus.basis+2937,'Board basis');
 check(a.subtotal.performance===b.subtotal.performance&&a.subtotal.technique===b.subtotal.technique&&a.subtotal.sense===b.subtotal.sense,'no distribution');
 check(a.subtotal.total===b.subtotal.total+2937+a.enhancementBonus.total-b.enhancementBonus.total,'current total adds each once');
 check(a.trace.find(t=>t.kind==='board').includedInEnhancementBasis===true,'trace');
}
const costume=filled.map(s=>({...s,totalAdjustments:{...s.totalAdjustments,costume:input('100')}}));
check(build(costume).parameters.members[0].enhancementBonus.basis===after.parameters.members[0].enhancementBonus.basis+100,'costume basis');
check(build(filled,'50').parameters.enhancementBonus.total===after.parameters.enhancementBonus.total,'Memory excluded');
check(JSON.stringify(after.segments)===JSON.stringify(before.segments),'Timeline same');
check(JSON.stringify(UnitSimulatorEngine.simulate(after,100,ActiveRandomSimulation.seededRandom(2)))===JSON.stringify(UnitSimulatorEngine.simulate(before,100,ActiveRandomSimulation.seededRandom(2))),'Simulation same');
filled[0].totalAdjustments.board=input('bad');
check(build(filled).parameters.enhancementBonus.scope!=='complete-basis','invalid partial');
print('Board/costume: state distinctions, external TOTAL, basis, trace, PTS/Passive/Memory and Timeline/Simulation isolation PASS');
}
