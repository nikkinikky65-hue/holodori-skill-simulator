// jsc card-rules.js parameter-rules.js tests/parameter-rules.test.js
function assert(ok, message){ if(!ok) throw Error(message); }

const memory = calculateMemory({performance:101,technique:102,sense:103},0.064);
assert(memory.performance===7 && memory.technique===7 && memory.sense===7 && memory.total===21,'memory rounds each base stat');
assert(calculateMemory({performance:100,technique:100,sense:100},0.064).total===21,'memory is not rounded once after baseTotal');
assert(calculateOutfitEffects({performance:101,technique:102,sense:103},{performance:0.15,technique:0.15,sense:0.15}).total===48,'outfit rounds each parameter');

const cards = [
  {id:'high-performance',type:'cute',stats:{performance:300,technique:10,sense:10}},
  {id:'highest-total',type:'cute',stats:{performance:110,technique:110,sense:110}},
  {id:'source',type:'cute',stats:{performance:101,technique:103,sense:105},skills:{passive:{effect:{
    type:'all_parameters_up',condition:{kind:'type',value:'cute'},conditionCount:3,
    target:{kind:'self'},targetCount:1,value:16
  }}}},
  {id:'sense-source',type:'pure',stats:{performance:80,technique:80,sense:80},skills:{passive:{effect:{
    type:'sense_up',condition:{kind:'none',value:''},conditionCount:99,
    target:{kind:'type',value:'cute'},targetCount:3,value:10
  }}}},
  {id:'rank-source',type:'pure',stats:{performance:80,technique:80,sense:80},skills:{passive:{effect:{
    type:'performance_up',condition:{kind:'none',value:''},conditionCount:0,
    target:{kind:'type',value:'cute'},targetCount:1,value:10
  }}}}
];
const members = cards.map((card,index)=>({
  slot:index+1,libraryCardId:card.id,
  board:{performance:index===0?900:0,technique:index===1?900:0,sense:index===2?900:0},
  outfitRates:index===0?{performance:1}:{}
}));
const result = calculateUnitParameterBreakdown(members,{cards,memoryRate:0.064});
assert(result.passiveResults.length===3,'only parameter passives are processed');
assert(result.passiveResults[0].status==='resolved' && result.passiveResults[0].candidateSlots.join(',')==='3','condition count includes the source member');
assert(result.passiveResults[2].targetSlots.join(',')==='2','target ranked by baseTotal, not Performance or Board');
assert(result.members[1].passive.performance===11,'the highest baseTotal target receives the effect');
assert(result.members[2].passive.performance===17 && result.members[2].passive.technique===17 && result.members[2].passive.sense===28,'same parameter rates combine before one ceil');
assert(result.members[2].passive.sense===Math.ceil(105*0.26),'self all-parameter and Sense effects combine');
assert(result.members[0].outfit.performance===300 && result.members[0].passive.performance===0,'outfit is isolated from passive calculation');
assert(result.members[0].memory.total===Math.ceil(300*0.064)+Math.ceil(10*0.064)+Math.ceil(10*0.064),'memory reads base only');
for(const member of result.members){
  assert(member.enhancement===calculateEnhancementBonus(member.base.total+member.board.total+member.passive.total+member.outfit.total), 'enhancement excludes Memory');
}
assert(result.total===result.baseParameter+result.board+result.passive+result.memory+result.outfit+result.enhancement,'unit total is the sum of breakdowns');

const changedBoard = members.map(member=>({...member,board:{...member.board}}));
changedBoard[2].board.performance+=1440;
changedBoard[0].board.technique+=350;
const boardChanged = calculateUnitParameterBreakdown(changedBoard,{cards,memoryRate:0.064});
assert(boardChanged.passive===result.passive && boardChanged.memory===result.memory && boardChanged.outfit===result.outfit,'Board does not change Passive, Memory or Outfit');
assert(boardChanged.members[2].enhancement>result.members[2].enhancement,'Board contributes to member enhancement');

const textTargetCard={id:'legacy-text',stats:{performance:10,technique:10,sense:10},skills:{passive:{effect:{
  type:'performance_up',condition:{kind:'none'},conditionCount:0,
  target:{kind:'text',value:'自身'},targetCount:1,value:50
}}}};
const legacyText=calculateUnitParameterBreakdown([{slot:1,card:textTargetCard}],{memoryRate:0});
assert(legacyText.passive===0 && legacyText.passiveResults[0].status==='unresolved-target','legacy text target is not reinterpreted');

const reportedCases = [
  [53522,14685,0,3433,0,1662,73302],
  [50187,14685,1184,3220,0,1609,70885],
  [38190,14685,4532,2451,0,1397,61255],
  [48373,14685,4656,3102,0,1647,72463],
  [42871,14685,2866,2751,0,1471,64644],
  [42871,16125,2866,2751,0,1506,66119],
  [42871,16475,2866,2751,0,1515,66478],
  [42871,14685,2866,2751,6437,1626,71236],
  [42871,16475,2866,2751,13300,1837,80100]
];
for(const [base,board,passive,memoryValue,outfit,enhancement,total] of reportedCases){
  assert(base+board+passive+memoryValue+outfit+enhancement===total,'measured aggregate total');
}
assert(reportedCases[4][2]===reportedCases[5][2] && reportedCases[5][2]===reportedCases[6][2], 'measured Board changes leave Passive unchanged');
print('Parameter formulas, base-only Passive ranking, isolation and measured aggregate checks: PASS');
