// Expected game transitions are an independent oracle, not the implementation.
const bloomExpected = [
  {passive:1,active:1,special:1}, {passive:1,active:2,special:1},
  {passive:1,active:2,special:1}, {passive:1,active:2,special:2},
  {passive:2,active:2,special:2}, {passive:2,active:2,special:2}
];
const bloomRarities = new Set();
for(const card of canonicalTestFixture.cards){
  bloomRarities.add(card.classification.rarity.mapping.value);
  for(let bloom=0;bloom<=5;bloom++){
    const expansion=expandCanonicalBloom(card,bloom,canonicalTestFixture.dataset);
    assertCanonical(JSON.stringify(expansion.levels)===JSON.stringify(bloomExpected[bloom]), `${card.id} Bloom ${bloom}`);
    const selection=canonicalSelection(expansion);
    assertCanonical(selection.version===2 && selection.bloom===bloom && !('levels' in selection), 'save Bloom only');
    const read=readCanonicalSelection(card.id+':bloom'+bloom,selection,null);
    assertCanonical(JSON.stringify(read)===JSON.stringify(selection), 'Bloom selection roundtrip');
    const restored=expandCanonicalBloom(card,read.bloom,canonicalTestFixture.dataset);
    assertCanonical(JSON.stringify(expansion)===JSON.stringify(restored),'Bloom expansion roundtrip');
    assertCanonical(adaptCanonicalCardToEventCard(card,expansion.levels.active,expansion).id===`canonical:${card.id}:bloom${bloom}`, 'B Bloom identity');
    const text=canonicalExpansionText(expansion);
    assertCanonical(!/Lv|Bloom|特訓/.test(text.replace(expansion.basic.name,'')), 'no redundant growth labels');
    assertCanonical(text.indexOf('SP：')<text.indexOf('\nP：') && text.indexOf('\nP：')<text.indexOf('\nA：'),'SP/P/A display order');
    assertCanonical(!text.includes('出典：') && !text.includes('candidate') && !text.includes('原文と照合') && !text.includes('Library'), 'compact display');
    for(const kind of ['passive','active','special']) assertCanonical(JSON.stringify(expansion[kind].data)===JSON.stringify(card.skills[kind].levels.find(l=>l.level===bloomExpected[bloom][kind])), 'all selected raw conditions/effects retained');
  }
}
assertCanonical([...bloomRarities].sort().join()==='3,4,5','all rarities checked');
for(const invalid of [-1,6,1.5,null,undefined,'3',NaN]){
  let rejected=false;try{canonicalBloomLevels(canonicalTestCard,invalid);}catch(e){rejected=true;}
  assertCanonical(rejected,'invalid Bloom rejected');
}
const changedBloom=JSON.parse(JSON.stringify(canonicalTestCard));
changedBloom.progression.bloomSteps.find(row=>row.step===1).step=2;
changedBloom.progression.bloomSteps.find(row=>row.effectType.endsWith('ALL_PARAMETER_UP_PERMIL_UP')).step=1;
assertCanonical(canonicalBloomLevels(changedBloom,1).active===1 && canonicalBloomLevels(changedBloom,2).active===2,'derive from source stage instead of fixed transition table');
const oldSelection={version:1,cardId:canonicalTestCard.id,levels:{passive:2,active:1,special:2},datasetVersion:'a762a8bf08ea38ff73aba1387e681b9fe0c0fc3f151f2e792fce2d7ed7f514d4'};
assertCanonical(canonicalDatasetMatches(oldSelection,canonicalTestFixture.dataset),'known old dataset migration');
assertCanonical(!canonicalDatasetMatches({...oldSelection,datasetVersion:'different'},canonicalTestFixture.dataset),'unknown dataset not migrated');
const oldRead=readCanonicalSelection(canonicalTestCard.id+':lv1',oldSelection,null);
assertCanonical(!('bloom' in oldRead) && oldRead.levels.passive===2 && oldRead.levels.active===1,'unreachable legacy combination is not guessed into Bloom');
assertCanonical(JSON.stringify(canonicalTestFixture)===originalCanonical,'Bloom expansion does not mutate Runtime');
print('Bloom: 185 cards × 6 stages, rarities 3/4/5, source derivation, compact display, save restoration and legacy compatibility: PASS');

const capOracle={3:[20,30,40,50,60],4:[30,40,50,60,70],5:[40,50,60,70,80]};
let trainingChecks=0;
for(const card of canonicalTestFixture.cards){
  assertCanonical(card.progression.statSnapshots.every(row=>row.level!==1),'no Runtime Lv1 dependency');
  for(const stage of card.progression.trainingStages){
    const stats=canonicalTrainingStats(card,stage.stage);
    assertCanonical(stats.level===capOracle[card.classification.rarity.mapping.value][stage.stage],'rarity/stage oracle');
    assertCanonical(stats.parameterBaseValue===card.progression.statSnapshots.find(row=>row.level===stage.levelCap).raw.parameterBaseValue,'exact source base value');
    for(let bloom=0;bloom<=5;bloom++){
      const e=expandCanonicalBloom(card,bloom,canonicalTestFixture.dataset,stage.stage);
      assertCanonical(JSON.stringify(e.trainingStats)===JSON.stringify(stats),'Bloom leaves base stats unchanged');
      assertCanonical(JSON.stringify(e.levels)===JSON.stringify(bloomExpected[bloom]),'training leaves skill levels unchanged');
      const saved=readCanonicalSelection(card.id+':bloom'+bloom,canonicalSelection(e),null);
      assertCanonical(saved.training===stage.stage,'training save roundtrip');
    }
    trainingChecks++;
  }
}
const changedCap=JSON.parse(JSON.stringify(canonicalTestCard));
changedCap.progression.trainingStages[0].levelCap=50;
assertCanonical(canonicalTrainingStats(changedCap,0).level===50,'cap comes from source, not rarity table');
for(const invalid of [-1,5,null,'0']){
  let rejected=false;try{canonicalTrainingStats(canonicalTestCard,invalid);}catch(e){rejected=true;}
  assertCanonical(rejected,'invalid training does not fall back to Lv1');
}
assertCanonical(trainingChecks===925,'all 185 cards and all training stages');
print('Training caps: 925 source snapshots, Bloom isolation and persistence PASS');
