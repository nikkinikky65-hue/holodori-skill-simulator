// Independent oracle: expected rarity transitions and integer ceiling division.
let parameterChecks=0;
for(const card of canonicalTestFixture.cards){
  const inputs=card.progression.parameterInputs;
  const weights=['performance','technique','sense'].map(k=>Number(inputs[k+'PermilMultiply']));
  assertCanonical(weights.reduce((a,b)=>a+b,0)===1000,'all 185 coefficient sums');
  for(const stage of card.progression.trainingStages){
    const value=Number(card.progression.statSnapshots.find(s=>s.level===stage.levelCap).raw.parameterBaseValue);
    const base=weights.map(w=>Math.floor((value*w+999)/1000));
    for(let bloom=0;bloom<=5;bloom++){
      const rarity=card.classification.rarity.mapping.value;
      const rate=rarity===3 ? (bloom===5?150:bloom>=2?50:0) : bloom>=2?100:0;
      const expected=base.map(v=>Math.floor((v*(1000+rate)+999)/1000));
      const actual=calculateCardParameters(card,stage.stage,bloom);
      assertCanonical(actual.level===stage.levelCap && actual.bloomPermil===rate,'source cap and additive rate');
      assertCanonical(JSON.stringify([actual.performance,actual.technique,actual.sense])===JSON.stringify(expected),'two independent ceiling stages');
      assertCanonical(actual.total===expected.reduce((a,b)=>a+b,0),'TOTAL is sum, not source base');
      assertCanonical(JSON.stringify(expandCanonicalBloom(card,bloom,canonicalTestFixture.dataset,stage.stage).cardParameters)===JSON.stringify(actual),'shared expansion parameters');
      parameterChecks++;
    }
  }
}
const sora3=canonicalTestFixture.cards.find(c=>c.id==='card-00001-3-nrml-0000-00');
for(const [bloom,expected] of [[0,[2189,2745,2104,7038]],[2,[2299,2883,2210,7392]],[5,[2518,3157,2420,8095]]]){
  const p=calculateCardParameters(sora3,0,bloom);
  assertCanonical(JSON.stringify([p.performance,p.technique,p.sense,p.total])===JSON.stringify(expected),'known ceil examples');
}
const tiny=JSON.parse(JSON.stringify(sora3));
tiny.progression.parameterInputs={performancePermilMultiply:1,techniquePermilMultiply:1,sensePermilMultiply:998};
tiny.progression.statSnapshots.find(s=>s.level===20).raw.parameterBaseValue='1';
assertCanonical(calculateCardParameters(tiny,0,2).total===6,'do not combine two ceiling steps');
// 100 * 1.1 can exceed 110 in binary floating point. Exact permil stays 110.
const exact=JSON.parse(JSON.stringify(canonicalTestFixture.cards.find(c=>c.classification.rarity.mapping.value===5)));
exact.progression.parameterInputs={performancePermilMultiply:250,techniquePermilMultiply:250,sensePermilMultiply:500};
exact.progression.statSnapshots.find(s=>s.level===exact.progression.trainingStages[0].levelCap).raw.parameterBaseValue='400';
assertCanonical(calculateCardParameters(exact,0,2).performance===110,'integer boundary does not over-ceil');
const invalid=JSON.parse(JSON.stringify(sora3));invalid.progression.parameterInputs.performancePermilMultiply=310;
let refused=false;try{calculateCardParameters(invalid,0,0);}catch(e){refused=true;}
assertCanonical(refused,'invalid coefficient sum rejected');
assertCanonical(!expandCanonicalCard(sora3,{passive:2,active:1,special:2},canonicalTestFixture.dataset).cardParameters,'legacy skill levels do not imply Bloom');
assertCanonical(JSON.stringify(canonicalTestFixture)===originalCanonical,'parameter calculation never mutates catalog');
assertCanonical(parameterChecks===5550,'185 cards x 5 training x 6 Bloom');
print('Card parameters: 5550 states, coefficient sums, two ceilings, additive Bloom, totals and legacy isolation PASS');
