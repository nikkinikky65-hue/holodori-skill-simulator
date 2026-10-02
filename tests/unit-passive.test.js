{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const noel=canonicalTestFixture.cards.find(card=>card.id==='card-00022-3-nrml-0018-00');
const make=()=>UnitParameterEngine.calculateMemberParameter(noel,0,4);
const source=make();
// Existing CASE C: isolate Noel's verified self 16%, not the other ranked Passives.
source.subtotal={performance:2883,technique:2210,sense:2299,total:7392};
const partner=make();partner.passiveInput={condition:{state:'unobserved'}};
const x=UnitParameterEngine.calculateUnitParameter([source,partner]);
check(x.members[0].passive.performance===462 && x.members[0].passive.technique===354 && x.members[0].passive.sense===368,'Noel CASE C self component');
check(x.members[0].trace[0].status==='resolved' && x.members[0].trace[0].parameters[0].referenceValue===2883 && x.members[0].trace[0].parameters[0].added===462,'trace exact reference and ceil');
check(x.members[1].unresolved.length===1 && x.members[1].corrections.some(c=>c.label==='Passive'&&c.value===null),'unsupported remains unknown');
for(const [suffix,key] of [['PERFORMANCE','performance'],['TECHNIQUE','technique'],['SENSE','sense']]){
 const m=make();m.passiveInput.effect.raw.type=`LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_${suffix}_UP_PERMIL_UP`;m.passiveInput.effect.raw.value='100';
 m.subtotal={performance:101,technique:103,sense:105,total:309};
 const out=UnitParameterEngine.calculateUnitParameter([m,partner]);
 check(out.members[0].passive[key]===11,'self single-stat ceil');
 check(['performance','technique','sense'].filter(k=>k!==key).every(k=>out.members[0].passive[k]===0),'only intended stat');
}
const before=JSON.stringify(source);
const two=UnitParameterEngine.calculateUnitParameter([source,{...source,cardId:'second'}]);
check(two.passive.total===2*x.members[0].passive.total,'multiple self effects stay isolated');
check(two.subtotal.total===two.members.reduce((s,m)=>s+m.subtotal.total,0),'sum of member subtotals');
check(JSON.stringify(source)===before,'inputs unchanged');
const inactive=UnitParameterEngine.calculateUnitParameter([source]);
check(inactive.members[0].trace[0].status==='inactive' && inactive.passive.total===0 && !inactive.unresolved.length,'known condition false distinguished');
for(const change of [m=>{m.passiveInput.condition={state:'unobserved'};},m=>{m.passiveInput.target.selectors[0].type='unknown';},m=>{m.passiveInput.condition.clauses.push({...m.passiveInput.condition.clauses[0]});}]){
 const m=make();change(m);const result=UnitParameterEngine.calculateUnitParameter([m,partner]);
 check(result.members[0].unresolved.length===1 && result.members[0].subtotal.total===m.subtotal.total,'unresolved not applied');
}
const gap=UnitParameterEngine.calculateUnitParameter([{...source,slot:3},{...partner,slot:5}]);
check(gap.members[0].trace[0].sourceSlot===3 && gap.members[0].trace[0].targetSlots[0]===3,'slot identity survives empty slots');
const slots=Array.from({length:5},()=>({cardId:noel.id,training:0,bloom:4,short:12}));
const baseline=UnitSimulatorEngine.build(canonicalTestFixture,slots,120);
const edited=JSON.parse(JSON.stringify(canonicalTestFixture));edited.cards.find(c=>c.id===noel.id).skills.passive.levels.forEach(p=>p.condition.state='unobserved');
const pending=UnitSimulatorEngine.build(edited,slots,120);
check(baseline.parameters.passive.total>0 && pending.parameters.unresolved.length===5,'real Runtime connection');
check(JSON.stringify(baseline.segments)===JSON.stringify(pending.segments),'Timeline independent');
check(JSON.stringify(UnitSimulatorEngine.simulate(baseline,100,ActiveRandomSimulation.seededRandom(4)))===JSON.stringify(UnitSimulatorEngine.simulate(pending,100,ActiveRandomSimulation.seededRandom(4))),'Simulation independent');
print('Unit Passive: self P/T/S/all, CASE C self component, ceil, trace, unsupported, slot gaps, Timeline/Simulation isolation PASS');
}
