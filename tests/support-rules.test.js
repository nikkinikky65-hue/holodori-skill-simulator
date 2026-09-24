// jsc support-rules.js tests/support-rules.test.js
function assert(ok, message){ if(!ok) throw Error(message); }
for(const [base,rate,extra,support,effective] of [
  [75,80,0,60,135], [85,80,0,68,153], [65,80,0,52,117],
  [100,80,8,88,188], [75,80,8,66,141], [100,135,8,143,243]
]){
  const result=calculateSupportBoost(base,rate,extra);
  assert(result.effectiveSupportRate===rate+extra,'support rate');
  assert(result.supportBoost===support && result.effectiveBoost===effective,'confirmed formula');
  assert(result.scoreSupportBoost===support,'compatibility alias');
}
assert(calculateSupportBoost(73,81,0).supportBoost===73*(81/100),'no rounding');
assert(resolveSupportTargets([],2).targets.length===0,'no candidates');
assert(resolveSupportTargets([1],2).targets.length===1,'one candidate');
assert(resolveSupportTargets([1,2],2).targets.length===2,'two candidates two targets');
assert(resolveSupportTargets([1,2,3],2).status==='unresolved-target-selection','three candidates two targets');
assert(resolveSupportTargets([1,2,3],2).targets.length===0,'no assumed selection');
assert(resolveSupportTargets([1],0).status==='unresolved-target-count','zero does not mean all');
print('Support formulas A–F and target resolution: PASS');
const members = [
  {slot:1,libraryCardId:'a',boost:75,scoreSupportRate:80},
  {slot:2,libraryCardId:'b',boost:85,scoreSupportRate:80},
  {slot:3,libraryCardId:'source',boost:65,scoreSupportRate:80}
];
const cards = [
  {id:'a',type:'cute'}, {id:'b',type:'cute'},
  {id:'source',type:'pure',skills:{passive:{scoreSupport:{boost:8,targetType:'cute',targetCount:2}}}}
];
let party = precalculateSupportParty(members,cards);
assert(party.members[0].effectiveBoost===141 && party.members[1].supportBoost===85*0.88,'two targets are certain');
assert(party.members[0].passiveAdditionalSupportRate===8 && party.members[2].effectiveBoost===117,'passive not direct boost');
assert(party.members[0].supportRateModifiers[0].sourceType==='passive' && party.members[0].supportRateModifiers[0].sourceCardId==='source','source provenance');
assert(party.composition.cute===2 && party.passiveResults[0].targetSlots.join(',')==='1,2','composition and results');
cards[2].skills.passive.scoreSupport.targetCount=1;
party=precalculateSupportParty(members,cards);
assert(party.members[0].effectiveBoost===135 && party.members[1].effectiveBoost===153,'uncertain not applied');
assert(party.members[0].supportStatus==='partial' && party.passiveResults[0].candidateCount===2,'uncertainty visible');
cards[2].skills.passive.scoreSupport.targetCount=2;
cards[2].skills.passive.scoreSupport.conditionType='happy';
cards[2].skills.passive.scoreSupport.conditionCount=1;
assert(precalculateSupportParty(members,cards).members[0].passiveAdditionalSupportRate===0,'inactive condition');
cards[2].skills.passive.scoreSupport.conditionType='';
cards[0].skills={special:{additionalSupportRate:99},passive:{scoreSupport:{boost:4,targetType:'cute',targetCount:2}}};
party=precalculateSupportParty(members,cards);
assert(party.members[0].supportStatus==='partial' && party.members[0].passiveAdditionalSupportRate===0,'unknown stacking not assumed');
assert(party.members[0].supportRateModifiers.every(m=>m.sourceType==='passive'),'Special never mixed');
assert(members[0].supportBoost===undefined,'input objects not mutated');
print('Passive integration, provenance, condition/selection/stacking isolation: PASS');
