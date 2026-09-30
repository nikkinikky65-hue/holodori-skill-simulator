// Run via tests/verify.py, which supplies fixture JSON and DOM-free adapter setup.
const assertCanonical = (value, message) => { if(!value) throw Error(message); };
const originalCanonical = JSON.stringify(canonicalTestFixture);
const canonicalTestCard = canonicalTestFixture.cards.find(card => card.id==='card-00015-5-uniq-0003-00');
for(const passive of [1,2]) for(const active of [1,2]) for(const special of [1,2]){
  const expanded = expandCanonicalCard(canonicalTestCard, {passive, active, special}, canonicalTestFixture.dataset);
  assertCanonical(expanded.levels.passive===passive && expanded.levels.active===active && expanded.levels.special===special, 'independent P/A/SP levels');
  assertCanonical(expanded.activeInput.boost===(active===1 ? 45 : 55), 'Active base projection');
  assertCanonical(expanded.passive.conditionStatus==='unresolved' && expanded.passive.data.condition.state==='unobserved', 'missing condition must not become none');
  assertCanonical(expanded.special.data.effects.length===2 && expanded.special.durationMilliseconds===10000, 'SP effects and level duration');
  assertCanonical(expanded.special.data.effects.every(item => !('duration' in item.effect)), 'no inferred per-effect duration');
  const eventCard = adaptCanonicalCardToEventCard(canonicalTestCard, active, expanded);
  assertCanonical(Object.keys(eventCard.skills).join()==='active' && !('short' in eventCard) && !('scoreSupportRate' in eventCard), 'only Active enters runtime');
  assertCanonical(eventCard.id.endsWith(`:p${passive}:s${special}`), 'independent Event identity');
  assertCanonical(canonicalExpansionText(expanded).includes('条件未確認'), 'unresolved state visible');
  expanded.passive.data.effect.raw.value='test mutation';
}
assertCanonical(JSON.stringify(canonicalTestFixture)===originalCanonical, 'fixture is immutable');
let invalidLevelRejected=false;
try { expandCanonicalCard(canonicalTestCard, {active:2, special:1}, canonicalTestFixture.dataset); } catch(e){ invalidLevelRejected=true; }
assertCanonical(invalidLevelRejected, 'missing P level is not inferred from A');
const missingValueCard=JSON.parse(JSON.stringify(canonicalTestCard));
delete missingValueCard.skills.active.levels[0].baseEffect.raw.value;
let missingValueRejected=false;
try { adaptCanonicalCardToActiveInput(missingValueCard,1); } catch(e){ missingValueRejected=true; }
assertCanonical(missingValueRejected, 'missing Active value is not zero');
print('Canonical independent levels, provenance isolation, unresolved P and display-only SP: PASS');

const selection=canonicalSelection(expandCanonicalCard(canonicalTestCard,{passive:1,active:2,special:2},canonicalTestFixture.dataset));
assertCanonical(JSON.stringify(selection).length<300 && !JSON.stringify(selection).includes('raw'),'storage reference is compact');
const missing=readCanonicalSelection(canonicalTestCard.id+':lv2',null,null);
assertCanonical(!('passive' in missing.levels) && !('special' in missing.levels),'missing old P/SP levels remain missing');
const isolated=expandCanonicalCard(canonicalTestCard,{passive:1,active:1,special:1},canonicalTestFixture.dataset);
isolated.basic.member.mapping.id='changed';
assertCanonical(canonicalTestCard.member.mapping.id==='sakura_miko','member mapping detached from Catalog');
const legacyRef=readCanonicalSelection(canonicalTestCard.id+':lv2',null,{levels:{passive:1,active:2,special:2},source:{dataset:{commitSha:'old-source'}}});
assertCanonical(readCanonicalSelection(canonicalTestCard.id+':lv2',legacyRef,null).legacySourceCommit==='old-source','offline legacy migration keeps source commit on later reload');
