{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const near=(a,b)=>Math.abs(a-b)<1e-12;
const sp={sourceType:'sp',sourceId:'sp-test',targetMembers:[1],rate:.4,start:10,end:20,timing:'limited',conditionState:'satisfied',applicable:true,aggregationGroup:'external-additive'};
const resolve=(sources,time=10,extra={})=>ActivationProbabilityEngine.resolve({baseProbability:.45,member:1,time,sources,...extra});
check(near(resolve([sp]).probability,.63),'45 * 1.4');
for(const [time,p] of [[9.999,.45],[10,.63],[19.999,.63],[20,.45],[20.001,.45]])check(near(resolve([sp],time).probability,p),'half-open boundary');
check(resolve([sp],10,{spEnabled:false}).probability===.45,'SP off');
check(resolve([sp],10,{member:2}).probability===.45,'member isolation');
check(resolve([{...sp,conditionState:'unresolved'}]).probability===.45,'unknown condition');
check(resolve([{...sp,targetMembers:null}]).probability===.45,'unknown targets');
check(resolve([{...sp,rate:0}]).probability===.45,'explicit zero');
const over=resolve([{...sp,rate:2}]);check(near(over.rawProbability,1.35)&&over.probability===1,'raw vs clamped');
const board={...sp,sourceType:'board',sourceId:'board-test',timing:'constant',rate:.12,aggregationGroup:'hypothesis-board-sp'};
const hypotheticalSP={...sp,aggregationGroup:'hypothesis-board-sp'};
check(resolve([board]).probability===.45,'hypothesis opt in required');
check(near(resolve([board],0,{allowHypothesis:true}).probability,.504),'board model');
check(near(resolve([board,hypotheticalSP],10,{allowHypothesis:true}).probability,.684),'board plus SP model');
check(resolve([board,hypotheticalSP],10,{allowHypothesis:true}).rawProbability===resolve([hypotheticalSP,board],10,{allowHypothesis:true}).rawProbability,'order independent');
const member={slot:1,prob:'mid',interval:10,duration:3,boost:50,short:0};
const prepare=callback=>ActiveRandomSimulation.prepare([member],40,ActiveTimelineEngine.events,()=>.45,callback);
const old=prepare(), plain=prepare(({member,event,baseProbability})=>ActivationProbabilityEngine.resolve({member:member.slot,time:event.start,baseProbability}));
const corrected=prepare(({member,event,baseProbability})=>ActivationProbabilityEngine.resolve({member:member.slot,time:event.start,baseProbability,sources:[sp]}));
check(JSON.stringify(old.candidates.map(c=>c.event))===JSON.stringify(corrected.candidates.map(c=>c.event)),'periods untouched');
const run=p=>ActiveRandomSimulation.run(p,100,ActiveTimelineEngine.maxSegments,ActiveRandomSimulation.seededRandom(12));
check(JSON.stringify(run(old))===JSON.stringify(run(plain)),'legacy seed parity');
check(JSON.stringify(run(corrected))===JSON.stringify(run(corrected)),'corrected seed reproducibility');
let calls=0;ActiveRandomSimulation.trial(corrected,ActiveTimelineEngine.maxSegments,()=>{calls++;return .5;});check(calls===old.candidates.length,'draw count unchanged');
let count=0, applied=0, deferred=0;
for(const card of canonicalTestFixture.cards)for(const level of card.skills.special.levels){
 const schedule={status:'resolved',entries:[{cardId:card.id,slot:1,level:level.level,start:10,end:10+level.raw.effectDurationMillisecond/1000,effects:level.effects}]};
 const sources=ActivationProbabilityEngine.fromSchedule(schedule);count+=sources.length;
 for(const source of sources){
  check(source.scope==='activation-start','SP activation scope');
  if(source.applicable){applied++;check(near(resolve([source]).probability,.45*(1+source.rate)),'real SP enabled');}
  else{deferred++;check(source.unresolvedReasons.join()==='condition-evaluation-deferred'&&resolve([source]).probability===.45,'conditional SP withheld');}
 }
}
check(count===84&&applied===48&&deferred===36,'84 rows: 48 enabled / 36 conditional');
const windowSP={...sp,scope:'activation-start',targetMembers:null,start:15,end:25};
const starts=[14,14.9,15,20,24,24.9,25];
const boundary=ActiveRandomSimulation.prepare([member],40,()=>starts.map(start=>({start,end:start+10,boost:50,m:member})),()=>.45,
 ({event,baseProbability,member})=>ActivationProbabilityEngine.resolve({baseProbability,member:member.slot,time:event.start,sources:[windowSP]}));
check(boundary.candidates.every((c,i)=>near(c.probability,starts[i]>=15&&starts[i]<25?.63:.45)),'start boundaries regardless of overlapping duration');
check(resolve([windowSP],20,{member:5}).probability===resolve([windowSP],20).probability,'SP not member selection');

const slots=canonicalTestFixture.cards.slice(0,5).map(c=>({cardId:c.id,training:4,bloom:3,short:0}));
const model=UnitSimulatorEngine.build(canonicalTestFixture,slots,120);
const injected={...sp,start:0,end:120,targetMembers:[1,2,3,4,5],rate:2};
const result=UnitSimulatorEngine.simulate(model,10,ActiveRandomSimulation.seededRandom(1),{probabilitySources:[injected]});
check(result.probabilityTrace.some(t=>t.rate===2),'same simulation consumes sources');
const off={...model,specialEnabled:false};
const a=UnitSimulatorEngine.simulate(off,10,ActiveRandomSimulation.seededRandom(1));
const b=UnitSimulatorEngine.simulate(off,10,ActiveRandomSimulation.seededRandom(1),{probabilitySources:[injected]});
check(JSON.stringify(a.values)===JSON.stringify(b.values),'SP off legacy simulation');
print('Activation probability: formula, gates, boundaries, hypothesis, traces, 84 rows, seed and timing parity PASS');
}

{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const cards=canonicalTestFixture.cards;
const ak=cards.find(c=>c.id==='card-00004-5-uniq-0005-00');
const slots=[ak,...cards.filter(c=>c.id!==ak.id).slice(0,4)].map(c=>({cardId:c.id,training:4,bloom:0,short:0}));
const on=UnitSimulatorEngine.build(canonicalTestFixture,slots,120,undefined,undefined,{1:15});
const off=UnitSimulatorEngine.build(canonicalTestFixture,slots,120,undefined,undefined,{1:15},false);
const run=m=>UnitSimulatorEngine.simulate(m,100,ActiveRandomSimulation.seededRandom(23));
const result=run(on);
check(result.probabilityTrace.some(t=>t.time>=15&&t.time<25&&t.rate===.4),'real scheduled SP reaches simulation');
check(result.probabilityTrace.every(t=>t.time>=15&&t.time<25||t.rate===0),'no probability outside real SP');
check(JSON.stringify(result.values)===JSON.stringify(run(on).values),'real SP fixed seed');
check(JSON.stringify(on.eventsByMember)===JSON.stringify(off.eventsByMember),'SP does not change candidates');
const legacy=ActiveRandomSimulation.prepare(off.activeMembers,off.duration,ActiveTimelineEngine.events,q=>ActivationProbabilityRules.probability(q));
const old=ActiveRandomSimulation.run(legacy,100,ActiveTimelineEngine.maxSegments,ActiveRandomSimulation.seededRandom(23));
check(JSON.stringify(old.values)===JSON.stringify(run(off).normalized.values),'SP OFF exact legacy parity');
print('Real unconditional SP and activation-start boundary integration PASS');
}
