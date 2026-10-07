{
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const catalog=JSON.parse(JSON.stringify(canonicalTestFixture));catalog.affiliationCatalog=JSON.parse(readFile('data/runtime-affiliations.json'));
const expected=JSON.parse(readFile('tests/affiliation-target-expected-cards.json'));
const partial=catalog.cards.filter(c=>UnitParameterEngine.resolveInput(c.skills.passive.levels[0]).status==='partial').map(c=>c.id).sort();
check(JSON.stringify(partial)===JSON.stringify(expected)&&partial.length===15,'exact partial set');
const slot=card=>({cardId:card.id,training:0,bloom:0,short:0});
for(const id of expected){
 const card=catalog.cards.find(c=>c.id===id),effect=UnitParameterEngine.resolveInput(card.skills.passive.levels[0]).effect;
 const group=catalog.affiliationCatalog.groups[effect.target.value];
 const inside=c=>group.characterIds.includes(catalog.affiliationCatalog.cardCharacters[c.id]);
 const unique=rows=>rows.filter((c,i,a)=>a.findIndex(x=>catalog.affiliationCatalog.cardCharacters[x.id]===catalog.affiliationCatalog.cardCharacters[c.id])===i);
 const peers=unique(catalog.cards.filter(c=>inside(c)&&catalog.affiliationCatalog.cardCharacters[c.id]!==catalog.affiliationCatalog.cardCharacters[id]));
 const others=unique(catalog.cards.filter(c=>!inside(c)));
 for(const n of [1,2,3]){
  const slots=[card,...peers.slice(0,n-1),...others.slice(0,5-n)].map(slot);
  const m=UnitSimulatorEngine.build(catalog,slots,120);
  const t=m.parameters.members[0].trace[0];
  check(t.condition.actualCount===n && t.condition.result===(n===1?'unsatisfied':'satisfied'),'independent condition');
  check(t.status===(n===1?'inactive':n===2?'resolved':'unresolved'),'three states');
  check(t.targetSlots.length===(n===2?2:0),'no selection above 2');
  if(n===2){check(t.targetSlots.includes(1)&&t.targetSlots.includes(2),'source included');check(t.parameters.every(p=>p.targetSlot<=2),'only affiliated targets');}
  if(n===3){check(t.targetResolution.candidates.length===3&&t.reason.includes('target selection unresolved'),'candidates and reason');check(m.parameters.members[1].unresolved.some(r=>r.sourceSlot===1),'unresolved recipient basis');}
 }
 // Multiple identical source effects: aggregate rates before ceil.
 const slots=[slot(card),slot(card),...others.slice(0,3).map(slot)];
 const clean=JSON.parse(JSON.stringify(catalog));
 for(const c of clean.cards)if(c.id!==id)c.skills.passive.levels.forEach(p=>p.condition.state='unobserved');
 const m=UnitSimulatorEngine.build(clean,slots,120,{kind:'manual-rate',percent:'6.4'},{kind:'manual-rate',percent:'2.43'});
 const key=PARAMETER_PASSIVE_TYPES[effect.type][0],target=m.parameters.members[0];
 check(target.passive[key]===Math.ceil((target.base[key]+target.opening[key])*effect.value*2/100),'combined ceil');
 check(m.parameters.members[0].trace[0].parameters[0].combinedRatePercent===effect.value*2,'aggregate trace');
 const missing=JSON.parse(JSON.stringify(clean));delete missing.affiliationCatalog.cardCharacters[slots[4].cardId];
 const u=UnitSimulatorEngine.build(missing,slots,120,{kind:'manual-rate',percent:'6.4'},{kind:'manual-rate',percent:'2.43'});
 check(u.parameters.members[0].trace[0].status==='unresolved','missing data');
 check(JSON.stringify(m.parameters.members[0].memory)===JSON.stringify(u.parameters.members[0].memory),'Memory independent');
 check(JSON.stringify(m.segments)===JSON.stringify(u.segments),'Timeline independent');
 check(JSON.stringify(UnitSimulatorEngine.simulate(m,100,ActiveRandomSimulation.seededRandom(3)).normalized)===JSON.stringify(UnitSimulatorEngine.simulate(u,100,ActiveRandomSimulation.seededRandom(3)).normalized),'seed unchanged');
}
print('Partial affiliation targets: 15 cards, inactive/resolved/unresolved, self inclusion, multiple sources, aggregate ceil, missing data, Memory/Timeline/seed PASS');
}
