{
 const check=(ok,m)=>{if(!ok)throw Error(m);};
 const baseline=JSON.parse(readFile('research/card-library-baseline-185.json')),diff=JSON.parse(readFile('research/card-library-update.json'));
 const catalog={...canonicalTestFixture,affiliationCatalog:JSON.parse(readFile('data/runtime-affiliations.json'))};
 check(diff.added.length===catalog.cards.length-diff.beforeCount&&catalog.cards.length===diff.afterCount,'complete additions');
 for(const cardId of Object.keys(baseline.runtimeCardDigests)){
  check(canonicalDatasetMatches({cardId,canonicalSha256:baseline.canonicalSha256},catalog.dataset),'old canonical saved selection');
  check(canonicalDatasetMatches({cardId,legacySourceCommit:baseline.sourceDataset.commitSha},catalog.dataset),'old source saved selection');
  for(const datasetVersion of baseline.runtimeVersions)check(canonicalDatasetMatches({cardId,datasetVersion},catalog.dataset),'old version selection');
 }
 const previous=JSON.parse(readFile('research/card-library-baseline-192.json'));
 for(const cardId of Object.keys(previous.runtimeCardDigests)){
  check(canonicalDatasetMatches({cardId,canonicalSha256:previous.canonicalSha256},catalog.dataset),'192-card saved SHA');
  check(canonicalDatasetMatches({cardId,legacySourceCommit:previous.sourceDataset.commitSha},catalog.dataset),'192-card saved commit');
  for(const datasetVersion of previous.runtimeVersions)check(canonicalDatasetMatches({cardId,datasetVersion},catalog.dataset),'192-card saved version');
 }
 for(const added of diff.added){
  const c=catalog.cards.find(c=>c.id===added.cardId);
  check(!canonicalDatasetMatches({cardId:c.id,canonicalSha256:baseline.canonicalSha256},catalog.dataset),'new card cannot claim old dataset');
  for(const bloom of [0,5]){
   const selections=[c,...catalog.cards.filter(x=>x.id!==c.id).slice(0,4)].map(x=>({cardId:x.id,training:0,bloom,short:0}));
   const model=UnitSimulatorEngine.build(catalog,selections,120);
   check(Number.isFinite(model.unitScore.value)&&model.members[0].expansion.levels.passive===(bloom===5?2:1),'new PTS/Bloom');
   check((UnitParameterEngine.resolveInput(c.skills.passive.levels[bloom===5?1:0]).status==='supported')===(added.passiveStatus==='supported'),'existing Passive gate');
   const sp=model.specialSchedule.entries[0];
   check(sp.effects[0].status==='applied'&&sp.scoreSupportRate===Number(sp.effects[0].effect.raw.value)/10,'new SP primary support');
   check(sp.unresolved.every(e=>e.effect.raw.type.endsWith('_LIVE_ACTIVE_SKILL_ACTIVATION_PROBABILITY_UP_PERMIL_UP')),'only known secondary probability effects remain separate');
   const probability=ActivationProbabilityEngine.fromSchedule({status:'resolved',entries:[sp]});
   for(const source of probability)check(source.applicable===(source.condition.state==='unobserved'),'existing conditional probability policy');
   check(model.specialSchedule.entries.length===5&&model.eventsByMember.length===5,'new Timeline/SP');
   const a=UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(72));
   const b=UnitSimulatorEngine.simulate(model,100,ActiveRandomSimulation.seededRandom(72));
   check(JSON.stringify(a.values)===JSON.stringify(b.values)&&a.values.every(Number.isFinite),'new seeded Simulation');
  }
 }
 print('Card update: all 185 saved references, all new cards x 2 skill levels, parameters/Timeline/SP/seed PASS');
}
