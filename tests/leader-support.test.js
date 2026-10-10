{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const data=JSON.parse(readFile('research/score-support-display-observations.json'));
let rows=0;
for(const session of data.sessions)for(const row of session.rows){
 if(row.status!=='recorded')continue;
 const result=LeaderSupportEngine.atActivation({start:20,boost:row.baseBoostPercent,m:{slot:1}},
  {status:'resolved',entries:[{slot:3,start:15,end:25,scoreSupportRate:row.spPercent}]},
  {targets:[{slot:1,rate:row.applicablePassivePercentForReportedModel}]},{targets:[{slot:1,rate:session.leaderSupportPercent}]});
 check(result.displayAdditional===row.observedAdditionalPercent,'observation '+session.id+':'+row.no);rows++;
 if(row.baseBoostPercent===70&&row.observedAdditionalPercent===47)check(result.supportBoost===47.6,'no floor in internal value');
}
check(rows===21,'21 measured rows');
const schedule={status:'resolved',entries:[{start:15,end:25,scoreSupportRate:80}]},passive={targets:[{slot:1,rate:8}]},leader={targets:[{slot:1,rate:60}]};
for(const [start,expected] of [[14.9,68],[15,148],[24.9,148],[25,68]]){
 const result=LeaderSupportEngine.atActivation({start,end:start+10,boost:100,m:{slot:1}},schedule,passive,leader);
 check(result.displayAdditional===expected,'activation boundary');
}
check(LeaderSupportEngine.atActivation({start:20,boost:100,m:{slot:2}},schedule,passive,leader).displayAdditional===80,'non-target excluded');
check(LeaderSupportEngine.atActivation({start:20,boost:100,m:{slot:1}},schedule,passive,leader,false).displayAdditional===60,'Leader remains when SP off');
const rules=JSON.parse(readFile('data/leader-parameter-rules.json')).leaders;
const members=Array.from({length:5},(_,i)=>({slot:i+1,cardId:'test'+i,attribute:'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1',subtotal:{performance:100,technique:100,sense:100,total:300}}));
let count=0;
for(const l of rules.filter(l=>l.effects.some(e=>e.parameter==='score_support'))){
 const effect=l.effects.find(e=>e.parameter==='score_support');
 const party=members.map(m=>({...m,attribute:effect.condition.attribute||m.attribute}));
 const supported=LeaderSupportEngine.resolve(l,party,null);
 check(supported.sources.length===1&&supported.sources[0].status==='applied','all 26 support effects');
 check(supported.targets.every(t=>t.rate===effect.percent),'library rates');count++;
 if(effect.condition.type==='attribute_count'){
  const other=effect.condition.attribute.endsWith('_1')?'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2':'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1';
  const inactive=LeaderSupportEngine.resolve(l,party.map(m=>({...m,attribute:other})),null);
  check(inactive.sources[0].status==='inactive'&&inactive.targets.every(t=>t.rate===0),'condition false');
 }
}
check(count===26,'26 cards / rows');
const invalidLeader={id:'synthetic',effects:[{parameter:'score_support',percent:60,target:'unknown',condition:{type:'not_stated'}}]};
check(LeaderSupportEngine.resolve(invalidLeader,members,null).sources[0].status==='unresolved','unknown target excluded');
const missing={...invalidLeader,effects:[{...invalidLeader.effects[0],target:'all_members',condition:{type:'unknown'}}]};
check(LeaderSupportEngine.resolve(missing,members,null).sources[0].status==='unresolved','unknown condition excluded');

const compound=rules.find(l=>l.effects.length===2&&l.effects[1].parameter==='score_support');
const single={...compound,effects:compound.effects.filter(e=>e.parameter!=='score_support')};
check(JSON.stringify(LeaderParameterEngine.calculate(compound,members,null).values)===JSON.stringify(LeaderParameterEngine.calculate(single,members,null).values),'compound Parameter preserved');
const ev={start:10,end:30,boost:70,m:{slot:1}};
const evaluated=ScheduledSupportEngine.evaluate([ev],40,schedule,passive,{leaderSupport:leader});
check(evaluated.intervals.some(i=>i.active.some(a=>a.supportBoost===47.6)),'decimal calculation retained');
const catalog=canonicalTestFixture,slots=catalog.cards.slice(0,5).map(c=>({cardId:c.id,training:4,bloom:0,short:0}));
const chosen=rules.find(l=>l.effects.length===1&&l.effects[0].parameter==='score_support'&&l.effects[0].percent===60);
check(!!chosen,'real Leader60');
const plain=UnitSimulatorEngine.build(catalog,slots,120),withLeader=UnitSimulatorEngine.build(catalog,slots,120,undefined,undefined,{},true,chosen);
check(JSON.stringify(plain.eventsByMember)===JSON.stringify(withLeader.eventsByMember),'events unchanged');
check(plain.unitScore.value===withLeader.unitScore.value,'support not parameter');
check(withLeader.activationSupport.every(r=>r.leaderRate===60),'selected Leader flows to display');
const run=m=>UnitSimulatorEngine.simulate(m,100,ActiveRandomSimulation.seededRandom(5));
check(JSON.stringify(run(withLeader).values)===JSON.stringify(run(withLeader).values),'seed reproducibility');
check(run(withLeader).statistics.mean>run(plain).statistics.mean,'Leader included without floor in Simulation');
print('Leader Support: 26 cards/effects, 21 observations, boundaries, compound, decimals, seed PASS');
}
