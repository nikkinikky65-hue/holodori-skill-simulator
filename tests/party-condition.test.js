{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const catalog=JSON.parse(JSON.stringify(canonicalTestFixture));
catalog.affiliationCatalog=JSON.parse(readFile('data/runtime-affiliations.json'));
// Isolate Passive regressions from newly connected Active affiliation replacement.
catalog.cards.forEach(c=>c.skills.active.levels.forEach(l=>{l.conditionalOverrides=[];}));
const expected=JSON.parse(readFile('tests/affiliation-expected-cards.json'));
const enabledAll=catalog.cards.filter(card=>card.skills.passive.levels.some(p=>UnitParameterEngine.resolveInput(p).status==='supported' && UnitParameterEngine.resolveInput(p).effect?.condition.kind==='affiliation' && UnitParameterEngine.resolveInput(p).effect.target.kind==='self')).map(c=>c.id).sort();
// Freeze the regression population, not the total number of matches in future releases.
const enabled=enabledAll.filter(id=>releaseBaselineIds.has(id));
check(expected.every(id=>releaseBaselineIds.has(id)), 'audited IDs must belong to preserved baseline');
if(JSON.stringify(enabled)!==JSON.stringify(expected)){
 print('REGRESSION_DIAGNOSTIC '+JSON.stringify({
  test:'tests/party-condition.test.js: exact audited 12',
  expected,actual:enabled,
  added:enabled.filter(id=>!expected.includes(id)),
  missing:expected.filter(id=>!enabled.includes(id)),
  orderOnly:enabled.length===expected.length && enabled.every(id=>expected.includes(id))
 }));
}
check(JSON.stringify(enabled)===JSON.stringify(expected),'exact audited 12');
const gateCounts={};for(const card of catalog.cards.filter(c=>releaseBaselineIds.has(c.id)))for(const p of card.skills.passive.levels){const status=UnitParameterEngine.resolveInput(p).status;gateCounts[status]=(gateCounts[status]||0)+1;}
check(gateCounts.supported===304,'152 cards / 304 levels supported');
const slot=id=>({cardId:id,training:0,bloom:0,short:0});
for(const id of expected){
 const card=catalog.cards.find(c=>c.id===id),effect=UnitParameterEngine.resolveInput(card.skills.passive.levels[0]).effect;
 const group=catalog.affiliationCatalog.groups[effect.condition.value];
 const belongs=c=>group.characterIds.includes(catalog.affiliationCatalog.cardCharacters[c.id]);
 const unique=rows=>rows.filter((c,i,a)=>a.findIndex(x=>catalog.affiliationCatalog.cardCharacters[x.id]===catalog.affiliationCatalog.cardCharacters[c.id])===i);
 const peers=unique(catalog.cards.filter(c=>belongs(c)&&catalog.affiliationCatalog.cardCharacters[c.id]!==catalog.affiliationCatalog.cardCharacters[id]));
 const others=unique(catalog.cards.filter(c=>!belongs(c)));
 for(const n of [1,2,3]){
  const slots=[card,...peers.slice(0,n-1),...others.slice(0,5-n)].map(c=>slot(c.id));
  const isolated=JSON.parse(JSON.stringify(catalog));
  isolated.cards.filter(c=>c.id!==id).forEach(c=>c.skills.passive.levels.forEach(p=>p.condition={state:'unobserved'}));
  const model=UnitSimulatorEngine.build(isolated,slots,120,{kind:'manual-rate',percent:'6.4'},{kind:'manual-rate',percent:'2.43'});
  const trace=model.parameters.members[0].trace[0];
  check(trace.condition.actualCount===n && trace.condition.countedMembers.some(m=>m.slot===1),'self counted, different groups excluded');
  check(trace.status===(n<2?'inactive':'resolved'),'below/exact/above');
  check((model.parameters.members[0].passive.total>0)===(n>=2),'conditional addition');
  const missing=JSON.parse(JSON.stringify(isolated));delete missing.affiliationCatalog.cardCharacters[slots[4].cardId];
  const unknown=UnitSimulatorEngine.build(missing,slots,120,{kind:'manual-rate',percent:'6.4'},{kind:'manual-rate',percent:'2.43'});
  check(unknown.parameters.members[0].trace[0].status==='unresolved','missing identity not false');
  check(JSON.stringify(model.parameters.members[0].memory)===JSON.stringify(unknown.parameters.members[0].memory),'Memory unchanged');
  check(JSON.stringify(model.segments)===JSON.stringify(unknown.segments),'Timeline unchanged');
  check(JSON.stringify(UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(9)).normalized)===JSON.stringify(UnitSimulatorEngine.simulate(unknown,100,ActiveRandomSimulation.seededRandom(9)).normalized),'seed unchanged');
 }
}
// Existing self+attribute gate produces identical results with/without affiliations.
for(const card of catalog.cards.filter(c=>UnitParameterEngine.resolveInput(c.skills.passive.levels[0]).effect?.condition.kind==='type')){
 const slots=Array.from({length:5},()=>slot(card.id));const plain={...catalog,affiliationCatalog:null};
 const rate={kind:'manual-rate',percent:'2.43'},memory={kind:'manual-rate',percent:'6.4'};
 const a=UnitSimulatorEngine.build(catalog,slots,120,memory,rate),b=UnitSimulatorEngine.build(plain,slots,120,memory,rate);
 check(JSON.stringify(a.parameters)===JSON.stringify(b.parameters),'29 existing cards unchanged');
}
print('Affiliations: exact 11 cards, below/exact/above, self counting, missing data unresolved, 29 existing cards, Memory/Timeline/seed isolation PASS');
}
