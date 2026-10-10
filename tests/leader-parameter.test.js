{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rules=JSON.parse(readFile('data/leader-parameter-rules.json'));
const catalog=JSON.parse(JSON.stringify(canonicalTestFixture));catalog.affiliationCatalog=JSON.parse(readFile('data/runtime-affiliations.json'));
const slots=catalog.cards.slice(0,5).map(c=>({cardId:c.id,training:4,bloom:4,short:0,totalAdjustments:{board:{kind:'external-total',value:0},costume:{kind:'external-total',value:0}}}));
const plain=UnitSimulatorEngine.build(catalog,slots,120,{kind:'manual-rate',percent:5},{kind:'manual-rate',percent:2.43});
const members=plain.members.map(m=>({...UnitParameterEngine.calculateMemberParameter(m.card,4,4),slot:m.slot}));
const counts={supported:0,partial:0,unsupported:0},parameterCounts={applied:0,unresolved:0,support:0};
for(const leader of rules.leaders){
 // Real data, condition satisfied by a synthetic party (not a game observation).
 const condition=leader.effects.find(e=>e.parameter!=='score_support')?.condition;
 let party=members.map(m=>({...m}));
 if(condition?.type==='attribute_count')party=party.map(m=>({...m,attribute:condition.attribute}));
 if(condition?.type==='affiliation_count'){
  const ids=Object.keys(catalog.affiliationCatalog.cardCharacters).filter(id=>catalog.affiliationCatalog.groups[condition.affiliationId].characterIds.includes(catalog.affiliationCatalog.cardCharacters[id]));
  party=party.map((m,i)=>({...m,cardId:ids[i%ids.length]}));
 }
 const result=LeaderParameterEngine.calculate(leader,party,catalog.affiliationCatalog);
 if(leader.kind==='card')counts[result.status]++;
 for(const row of result.trace){
  if(row.effect.parameter==='score_support'){check(row.status==='unsupported','support excluded');if(leader.kind==='card')parameterCounts.support++;continue;}
  if(row.effect.condition.type==='unknown'){check(row.status==='unresolved','missing Promise reference');if(leader.kind==='card')parameterCounts.unresolved++;continue;}
  check(row.status==='applied','all known parameter effects applied: '+leader.id);
  if(leader.kind==='card')parameterCounts.applied++;
  for(const p of row.parameters)check(p.added===Math.ceil(p.reference*row.effect.percent/100),'library percentage ceil');
 }
 check(result.values.every((v,i)=>v.total===v.performance+v.technique+v.sense),'PTS sum');
 if(condition && ['attribute_count','affiliation_count'].includes(condition.type)){
  const alternate=condition.type==='attribute_count' ? {...members[0],attribute:condition.attribute.endsWith('_1')?'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2':'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1'} : {...members[0],cardId:Object.keys(catalog.affiliationCatalog.cardCharacters).find(id=>!catalog.affiliationCatalog.groups[condition.affiliationId].characterIds.includes(catalog.affiliationCatalog.cardCharacters[id]))};
  const fail=LeaderParameterEngine.calculate(leader,Array.from({length:5},(_,i)=>({...alternate,slot:i+1})),catalog.affiliationCatalog);
  check(fail.values.every(v=>v.total===0),'condition false means zero');
 }
}
check(same(counts,{supported:105,partial:16,unsupported:10}),'card coverage '+JSON.stringify(counts));
check(same(parameterCounts,{applied:121,unresolved:0,support:26}),'effect coverage');
const common=rules.leaders.find(l=>l.kind==='common');
const withLeader=UnitSimulatorEngine.build(catalog,slots,120,{kind:'manual-rate',percent:5},{kind:'manual-rate',percent:2.43},{},true,common);
for(let i=0;i<5;i++){
 const old=plain.parameters.members[i],m=withLeader.parameters.members[i];
 check(same(old.passive,m.passive)&&same(old.memory,m.memory),'Passive/Memory unchanged');
 check(same(old.trace.find(t=>t.kind==='Memory'),m.trace.find(t=>t.kind==='Memory')),'Memory trace unchanged');
 check(m.enhancementBonus.basis===old.enhancementBonus.basis+m.leader.total,'Leader in Enhancement basis');
 check(m.enhancementBonus.total===Math.ceil(m.enhancementBonus.basis*.0243),'existing Enhancement ceil');
 check(m.subtotal.total===old.subtotal.total+m.leader.total+m.enhancementBonus.total-old.enhancementBonus.total,'independent layer');
}
check(withLeader.parameters.leader.total===withLeader.parameters.members.reduce((s,m)=>s+m.leader.total,0),'unit Leader total');
check(same(plain.eventsByMember,withLeader.eventsByMember),'Timeline unchanged');
const simulate=m=>UnitSimulatorEngine.simulate(m,100,ActiveRandomSimulation.seededRandom(2)).normalized;
check(same(simulate(plain),simulate(withLeader)),'normalized seeded Simulation unchanged');
const testEffect={parameter:'P',percent:45,target:'all_members',condition:{type:'not_stated'}};
const multi=LeaderParameterEngine.calculate({id:'synthetic',effects:[testEffect,{...testEffect,parameter:'T'}]},members,catalog.affiliationCatalog);
check(multi.values.every((v,i)=>v.performance===Math.ceil(members[i].subtotal.performance*.45)&&v.technique===Math.ceil(members[i].subtotal.technique*.45)&&v.sense===0),'multiple distinct parameters');
const unknown=LeaderParameterEngine.calculate({id:'synthetic',effects:[{...testEffect,target:'unknown'}]},members,catalog.affiliationCatalog);
check(unknown.status==='unsupported'&&unknown.values.every(v=>v.total===0),'unknown target not all members');
print('Leader: 131 cards / 147 effects, 54 explicit common effects, ceil, conditions, compound isolation, Enhancement, Timeline and seed PASS');
}

{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const catalog=canonicalTestFixture,aff=JSON.parse(readFile('data/runtime-affiliations.json'));
const leaders=JSON.parse(readFile('data/leader-parameter-rules.json')).leaders.filter(l=>l.effects.some(e=>e.condition.affiliationId==='grp-promise'));
check(leaders.length===2,'two Promise leaders');
const promise=aff.groups['grp-promise'].characterIds.map(id=>catalog.cards.find(c=>aff.cardCharacters[c.id]===id)).filter(Boolean);
const others=catalog.cards.filter(c=>!aff.groups['grp-promise'].characterIds.includes(aff.cardCharacters[c.id]));
for(const leader of leaders){
 check(leader.effects[0].condition.resolutionEvidence.rawTriggerRecordMissing,'retain missing raw evidence');
 for(const n of [0,1,2,3]){
  const cards=[...promise.slice(0,n),...others.slice(0,5-n)];
  const members=cards.map((c,i)=>({...UnitParameterEngine.calculateMemberParameter(c,0,0),slot:i+1}));
  const result=LeaderParameterEngine.calculate(leader,members,aff);
  check(result.trace[0].condition.actualCount===n,'exact Promise count');
  check(result.trace[0].status===(n>=2?'applied':'inactive'),'threshold '+n);
  check(result.values.every(v=>n>=2?v.total>0:v.total===0),'all members affected including non-Promise');
  check(LeaderParameterEngine.calculate(leader,members,null).trace[0].status==='unresolved','missing membership not false');
 }
}
print('Promise: both leaders, 0/1/2/3 counts, all targets, missing membership PASS');
}
