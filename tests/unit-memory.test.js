{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const card=canonicalTestFixture.cards.find(c=>c.id==='card-00022-3-nrml-0018-00');
const rates=percent=>({kind:'manual-rate',percent});
const make=()=>UnitParameterEngine.calculateMemberParameter(card,0,4);
const inputs=[make(),make()];const original=JSON.stringify(inputs);
const unset=UnitParameterEngine.calculateUnitParameter(inputs);
const zero=UnitParameterEngine.calculateUnitParameter(inputs,rates('0'));
const withMemory=UnitParameterEngine.calculateUnitParameter(inputs,rates('6.4'));
check(unset.memory.status==='unset' && unset.memory.total===null,'unset is unknown, not zero');
check(zero.memory.status==='applied' && zero.memory.total===0 && zero.subtotal.total===unset.subtotal.total,'explicit zero');
for(let i=0;i<inputs.length;i++){
 const result=withMemory.members[i];const expected=calculateMemory(inputs[i].subtotal,.064);
 check(result.memory.total===expected.total,'reuse existing calculation');
 check(result.subtotal.total===unset.members[i].subtotal.total+expected.total,'current subtotal adds Memory only once');
 const trace=result.trace.find(t=>t.kind==='Memory');
 check(trace.parameters[0].referenceValue===inputs[i].subtotal.performance && trace.parameters[0].rate===.064,'trace reads pre-Passive value');
 check(trace.parameters[0].added===expected.performance && trace.source.percent==='6.4','trace retains input and rounded value');
}
check(withMemory.passive.total===unset.passive.total && JSON.stringify(inputs)===original,'Passive and input unchanged');
const fixture=make();fixture.subtotal={performance:101,technique:102,sense:103,total:306};
check(UnitParameterEngine.calculateUnitParameter([fixture],rates('6.4')).memory.total===21,'per-stat ceil, not aggregate ceil');
const caseC=[[3415,2123,1730],[3231,2472,2375],[2883,2210,2299],[2281,3304,2475],[2210,2299,2883]].map(values=>({...make(),subtotal:{performance:values[0],technique:values[1],sense:values[2],total:values.reduce((a,b)=>a+b)}}));
const measured=UnitParameterEngine.calculateUnitParameter(caseC,rates('6.4'));
check(measured.memory.total===2451 && measured.members.map(m=>m.memory.total).join(',')==='466,518,475,517,475','existing measured CASE C Memory fixture');
for(const input of [rates('-1'),rates('abc'),rates('Infinity'),rates(true),{kind:'other',percent:'6.4'}]){
 const out=UnitParameterEngine.calculateUnitParameter(inputs,input);
 check(out.memory.status==='unsupported' && out.memory.total===null && out.subtotal.total===unset.subtotal.total,'unsupported not applied or silently zeroed');
 check(out.members.every(m=>m.corrections.some(c=>c.label==='Memory' && c.value===null)),'unknown correction retained');
}
check(UnitParameterEngine.resolveMemory(rates(' ')).status==='unset','blank remains unset');
const slots=Array.from({length:5},()=>({cardId:card.id,training:0,bloom:4,short:0}));
const before=UnitSimulatorEngine.build(canonicalTestFixture,slots,120);
const after=UnitSimulatorEngine.build(canonicalTestFixture,slots,120,rates('6.4'));
check(after.parameters.subtotal.total===after.parameters.members.reduce((sum,m)=>sum+m.subtotal.total,0),'unit sum');
check(after.unitScore.value===after.parameters.subtotal.total && JSON.stringify(before.segments)===JSON.stringify(after.segments),'provisional score and Timeline unchanged');
check(JSON.stringify(UnitSimulatorEngine.simulate(before,100,ActiveRandomSimulation.seededRandom(12)).normalized)===JSON.stringify(UnitSimulatorEngine.simulate(after,100,ActiveRandomSimulation.seededRandom(12)).normalized),'Simulation unchanged');
check(after.parameters.members.every(m=>m.corrections.some(c=>c.label==='強化ボーナス'&&c.value===null)),'Enhancement remains unconnected');
print('Memory: shared formula, CASE C 2451, pre-Passive basis, per-stat ceil, unset/zero/unsupported, trace, totals and isolation PASS');
}
