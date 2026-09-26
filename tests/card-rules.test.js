// macOS: jsc card-rules.js tests/card-rules.test.js
function assert(condition, message){ if(!condition) throw new Error(message); }
const expectedTotals = {
  3: [10000,12000,16000,18000,20000],
  4: [14000,16000,19000,21000,25000],
  5: [18000,19000,22000,24500,32000]
};
for(const rarity of [3,4,5]){
  for(let training = 0; training <= 4; training++){
    const d = getCardDerived(rarity, training, 5);
    assert(d.progression.level === ({3:20,4:30,5:40}[rarity] + training*10), 'level');
    assert(d.progression.bloom === 5 && d.progression.training === training, 'growth separation');
    assert(d.stats.total === expectedTotals[rarity][training], `★${rarity} Lv${d.progression.level} total`);
    for(let bloom=0; bloom<=5; bloom++){
      assert(JSON.stringify(getCardDerived(rarity,training,bloom).stats) === JSON.stringify(d.stats), 'bloom independent');
    }
    assert(d.stats.total === d.stats.performance+d.stats.technique+d.stats.sense, 'stats sum');
  }
}
assert(getBloomEffectType(5, 1) === 'active' && getBloomEffectType(5, 5) === 'connect', 'star4/5 bloom map');
assert(getBloomEffectType(3, 2) === 'all_parameters' && getBloomEffectType(3, 5) === 'all_parameters', 'star3 bloom map');
assert(getBloomEffectType(3, 0) === null && getBloomEffectType(6, 1) === null, 'unsupported bloom map');
assert(skillConditionFromKey('self').kind === 'self' && skillConditionFromKey('self').value === '', 'self target');
assert(skillConditionKey({kind:'self',value:''}) === 'self', 'self target key');
const compound = createCardV2({skills:{special:{effects:[
  {type:'score_support',value:50,duration:8}, {type:'life_recovery',value:300}
]}}});
assert(compound.skills.special.effects[0].duration === 8 && compound.skills.special.effects[1].value === 300 &&
  !Object.hasOwn(compound.skills.special.effects[1], 'duration'), 'independent special effects');
const renamedSpecial = normalizeCardV2({skills:{special:{effects:[
  {type:'skill_activation_rate_up',value:12,extra:'keep'},
  {type:'judgement_enhancement',from:'good',to:'perfect'}
]}}});
assert(renamedSpecial.skills.special.effects[0].type==='skill_frequency_up' &&
  renamedSpecial.skills.special.effects[0].value===12 && renamedSpecial.skills.special.effects[0].extra==='keep' &&
  renamedSpecial.skills.special.effects[1].type==='judgment_enhancement','legacy SP IDs normalized without changing effect data');
assert(getSpecialEffects({skills:{special:{effectTypes:['skill_activation_rate_up'],boost:12}}})[0].type==='skill_frequency_up',
  'legacy shared SP IDs normalized');
const fresh = normalizeCardV2({});
assert(!Object.hasOwn(fresh.skills.passive, 'scoreSupport') && fresh.skills.passive.effect.type==='' &&
  fresh.skills.passive.status.description==='', 'new Passive defaults use current effect and status fields only');
const original = createCardV2({id:'keep', rarity:5, progression:{training:2,bloom:5}, extensions:{future:{x:1}}, skills:{active:{description:'keep'},passive:{scoreSupport:{boost:12}}}});
const edited = createCardV2({cardName:'edited',skills:{active:{boost:30}}}, original);
assert(edited.id === original.id && edited.stats.total === 22000, 'identity and stats');
assert(edited.extensions.future.x === 1 && edited.skills.active.description === 'keep', 'preserve metadata');
assert(edited.skills.passive.scoreSupport.boost === 12 && edited.progression.bloom === 5, 'preserve passive and bloom');
assert(normalizeCardV2({skills:null,stats:null}).skills.active.boost === 0, 'missing nested fields');
assert(createCardV2({rarity:3}).stats.total === 10000, 'star3 base preset');
assert(getCardPresetStats(3,0) === null, 'training is not a level key');
const savedStar3 = normalizeCardV2({rarity:3,progression:{level:60,training:4,bloom:5},stats:{total:12345}});
assert(savedStar3.stats.total === 12345, 'saved manual stats preserved');
assert(normalizeCardV2({rarity:3,stats:{total:null}}).stats.total === null, 'legacy null preserved on read');
print('Card rules: PASS');
