{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const ids=JSON.parse(readFile('tests/attribute-target-expected-cards.json'));
const catalog=canonicalTestFixture;
const enabled=catalog.cards.filter(c=>UnitParameterEngine.resolveInput(c.skills.passive.levels[0]).effect?.target.kind==='type' && !UnitParameterEngine.resolveInput(c.skills.passive.levels[0]).interpretation).map(c=>c.id).sort();
check(JSON.stringify(ids)===JSON.stringify(enabled)&&ids.length===35,'exact audited 35');
const json=JSON.stringify;
for(const id of ids){
 const card=catalog.cards.find(c=>c.id===id);
 for(const level of card.skills.passive.levels){
  const effect=UnitParameterEngine.resolveInput(level).effect;
  for(const count of [1,2,3,4,5]){
   const members=Array.from({length:5},(_,i)=>{
    const m=UnitParameterEngine.calculateMemberParameter(card,i%5,level.level===2?4:0);
    m.slot=5-i; // Tie-break must use input order, not slot number.
    m.attribute=i<count?effect.target.value:'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_'+(effect.target.value.endsWith('1')?'2':'1');
    if(i!==0)m.passiveInput=null;else m.passiveInput=level;
    m.totalAdjustmentInputs={board:{kind:'external-total',value:i===4?999999:0},costume:{kind:'external-total',value:0}};
    return m;
   });
   const output=UnitParameterEngine.calculateUnitParameter(members,{kind:'manual-rate',percent:6.4},{kind:'manual-rate',percent:2.43});
   const legacy=calculatePassiveEffects(members.map(m=>({slot:m.slot,base:m.subtotal,type:m.attribute,card:{skills:{passive:{effect:m.passiveInput?effect:{type:''}}}}})));
   check(json(output.members.map(m=>m.passive))===json(legacy.members.map(m=>m.passive)),'shared legacy result all 70 rows/count boundaries');
   const t=output.members[0].trace[0];
   check(t.condition.actualCount===count,'condition count');
   check(t.status===(count<2?'inactive':'resolved'),'condition states');
   if(count<2)check(!t.targetResolution.selection,'no selection while inactive');
   else{
    check(t.targetSlots.length===Math.min(count,effect.targetCount),'N is maximum available targets');
    check(t.targetResolution.selection.candidates.every(r=>r.baseTotal===members.find(m=>m.slot===r.slot).subtotal.total),'only post-Bloom baseTotal');
    check(t.parameters.every(p=>p.added===Math.ceil(p.unrounded)),'combined ceil trace');
   }
   output.members.forEach((m,i)=>{
    check(m.memory.total===calculateMemory(members[i].subtotal,.064).total,'Memory independent');
    check(m.enhancementBonus.basis===members[i].subtotal.total+m.passive.total+(i===4?999999:0),'Enhancement includes new Passive, excludes Memory');
   });
   const unknown=members.map(m=>({...m}));unknown[4].attribute=null;
   check(UnitParameterEngine.calculateUnitParameter(unknown).members[0].trace[0].status==='unresolved','missing attribute unresolved');
  }
 }
}
const candidates=[{slot:5,formationIndex:0,baseTotal:100},{slot:1,formationIndex:1,baseTotal:100},{slot:2,formationIndex:2,baseTotal:200}];
const selection=PassiveSelectionResolver.resolve({candidates,selectCount:2,rule:'attribute-baseTotal'});
check(selection.selected.map(m=>m.slot).join(',')==='2,5'&&selection.ties.length===1,'ties use input order');
check(PassiveSelectionResolver.resolve({candidates,selectCount:2,rule:'affiliation-baseTotal'}).status==='unresolved','affiliation ranking not enabled');
// Feed the existing CASE C fixture through the new bridge, without inventing values.
const fixtureSource=readFile('tests/parameter-rules.test.js');
const caseData=eval('(()=>{'+fixtureSource.slice(fixtureSource.indexOf('const caseCCards='),fixtureSource.indexOf('const caseC=calculateUnitParameterBreakdown'))+'return {cards:caseCCards,base:caseCBaseStats};})()');
const template=catalog.cards.find(c=>c.id===ids[0]);
const attr='CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1';
const caseMembers=caseData.cards.map((card,i)=>{
 const m=UnitParameterEngine.calculateMemberParameter(template,0,0),e=card.skills.passive.effect;
 m.slot=i+1;m.attribute=attr;m.subtotal={...caseData.base[i],total:Object.values(caseData.base[i]).reduce((a,b)=>a+b,0)};
 const p=JSON.parse(json(template.skills.passive.levels[0]));
 p.effect.raw.type='LivePassiveSkillEffectType_LIVE_PASSIVE_SKILL_EFFECT_TYPE_'+({performance_up:'PERFORMANCE',technique_up:'TECHNIQUE',sense_up:'SENSE',all_parameters_up:'ALL_PARAMETER'}[e.type])+'_UP_PERMIL_UP';
 p.effect.raw.value=String(e.value*10);
 p.target.selectors=[{type:'LiveSkillEffectTargetType_LIVE_SKILL_EFFECT_TARGET_TYPE_'+(i===2?'SELF':'ATTRIBUTE'),cardAttributeType:attr,targetCount:e.targetCount}];
 p.condition.clauses=[{type:'LiveSkillTriggerType_LIVE_SKILL_TRIGGER_TYPE_DECK_CARD_ATTRIBUTE',threshold:'2',cardAttributeType:attr}];
 // CASE C source 1 is unconditional. With all five matching it is active in both models.
 m.passiveInput=p;m.totalAdjustmentInputs={board:{kind:'external-total',value:2937},costume:{kind:'external-total',value:0}};return m;
});
const result=UnitParameterEngine.calculateUnitParameter(caseMembers,{kind:'manual-rate',percent:6.4},{kind:'manual-rate',percent:2.43});
check(result.passive.total===4532&&result.memory.total===2451&&result.enhancementBonus.total===1397,'CASE C totals through bridge');
check(result.members.map(m=>m.enhancementBonus.total).join(',')==='248,300,301,297,251','CASE C members');
check(result.members[1].trace[0].targetSlots.join(',')==='2,4,3','CASE C target order and tie');
const slots=Array.from({length:5},()=>({cardId:ids[0],training:0,bloom:4,short:0}));
const active=UnitSimulatorEngine.build(catalog,slots,120);
const disabled=JSON.parse(json(catalog));disabled.cards.find(c=>c.id===ids[0]).skills.passive.levels.forEach(p=>p.condition.state='unobserved');
const baseline=UnitSimulatorEngine.build(disabled,slots,120);
check(json(active.segments)===json(baseline.segments),'Timeline unchanged');
check(json(UnitSimulatorEngine.simulate(active,100,ActiveRandomSimulation.seededRandom(8)).normalized)===json(UnitSimulatorEngine.simulate(baseline,100,ActiveRandomSimulation.seededRandom(8)).normalized),'seed unchanged');
print('Attribute selection: 35 cards/70 rows, counts 1–5, legacy parity, ties, CASE C, multiple sources, Memory/Enhancement/Timeline/seed PASS');
}
