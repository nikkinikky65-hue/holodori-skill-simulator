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
  baseStats:{performance:card.stats.performance,technique:card.stats.technique,sense:card.stats.sense},
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

const textTargetCard={id:'legacy-text',stats:{performance:999,technique:999,sense:999},skills:{passive:{effect:{
  type:'all_parameters_up',condition:{kind:'none'},conditionCount:0,
  target:{kind:'text',value:''},targetCount:1,value:50
}}}};
const legacyText=calculateUnitParameterBreakdown([{slot:1,card:textTargetCard,baseStats:{performance:10,technique:10,sense:10}}],{memoryRate:0});
assert(legacyText.passive===15 && legacyText.passiveResults[0].targetSlots[0]===1,'narrow legacy blank-text all-parameter target maps to self');
const otherTextTarget={...textTargetCard,skills:{passive:{effect:{
  type:'performance_up',condition:{kind:'none'},conditionCount:0,
  target:{kind:'text',value:''},targetCount:1,value:50
}}}};
const otherText=calculateUnitParameterBreakdown([{slot:1,card:otherTextTarget,baseStats:{performance:10,technique:10,sense:10}}],{memoryRate:0});
assert(otherText.passive===0 && otherText.passiveResults[0].status==='unresolved-target','other text target remains unresolved');

const caseCCards=[
  {id:'hoshimachi_suisei',type:'cute',stats:{performance:4394,technique:3102,sense:2709},skills:{passive:{effect:{
    type:'performance_up',condition:{kind:'none'},conditionCount:0,
    target:{kind:'type',value:'cute'},targetCount:2,value:10
  }}}},
  {id:'ayunda_risu',type:'cute',stats:{performance:4210,technique:3451,sense:3354},skills:{passive:{effect:{
    type:'performance_up',condition:{kind:'type',value:'cute'},conditionCount:2,
    target:{kind:'type',value:'cute'},targetCount:3,value:14
  }}}},
  {id:'shirogane_noel',type:'cute',stats:{performance:3862,technique:3189,sense:3278},skills:{passive:{effect:{
    type:'all_parameters_up',condition:{kind:'type',value:'cute'},conditionCount:2,
    target:{kind:'text',value:''},targetCount:1,value:16
  }}}},
  {id:'hakos_baelz',type:'cute',stats:{performance:3260,technique:4283,sense:3454},skills:{passive:{effect:{
    type:'technique_up',condition:{kind:'type',value:'cute'},conditionCount:2,
    target:{kind:'type',value:'cute'},targetCount:3,value:14
  }}}},
  {id:'airani_iofifteen',type:'cute',stats:{performance:3189,technique:3278,sense:3862},skills:{passive:{effect:{
    type:'sense_up',condition:{kind:'type',value:'cute'},conditionCount:2,
    target:{kind:'type',value:'cute'},targetCount:3,value:7
  }}}}
];
const caseCBaseStats=[
  {performance:3415,technique:2123,sense:1730},
  {performance:3231,technique:2472,sense:2375},
  {performance:2883,technique:2210,sense:2299},
  {performance:2281,technique:3304,sense:2475},
  {performance:2210,technique:2299,sense:2883}
];
const caseC=calculateUnitParameterBreakdown(caseCCards.map((card,index)=>({
  slot:index+1,libraryCardId:card.id,card,baseStats:caseCBaseStats[index],
  board:{performance:979,technique:979,sense:979}
})),{memoryRate:0.064,enhancementRate:0.0243});
assert(caseCCards.map((_,index)=>caseCBaseStats[index].performance+caseCBaseStats[index].technique+caseCBaseStats[index].sense).join(',')==='7268,8078,7392,8060,7392','CASE C base totals and ranking tie');
assert(caseC.passiveResults[0].targetSlots.join(',')==='2,4','CASE C target order is descending baseTotal');
assert(caseC.passiveResults[1].targetSlots.join(',')==='2,4,3','CASE C Risu passive targets baseTotal top three');
assert(caseC.passiveResults[3].targetSlots.join(',')==='2,4,3' && caseC.passiveResults[4].targetSlots.join(',')==='2,4,3','CASE C tie resolves in formation order');
assert(caseC.passiveResults[2].targetSlots.join(',')==='3','CASE C legacy Noel passive self-target');
assert(caseC.baseParameter===38190 && caseC.board===14685,'CASE C base and board totals');
assert(caseC.members.map(member=>[member.passive.performance,member.passive.technique,member.passive.sense].join('/')).join(',')==='0/0/0,776/347/167,865/663/529,548/463/174,0/0/0','CASE C per-parameter ceil and combined rates');
assert(caseC.members.map(member=>member.passive.total).join(',')==='0,1290,2057,1185,0','CASE C member Passive totals: '+caseC.members.map(member=>member.passive.total).join(','));
assert(caseC.passive===4532 && caseC.memory===2451 && caseC.enhancement===1397 && caseC.total===61255,'CASE C all unit totals');
assert(caseC.members.map(member=>member.memory.total).join(',')==='466,518,475,517,475','CASE C per-member Memory from baseStats');
assert(caseC.members.map(member=>member.enhancement).join(',')==='248,300,301,297,251','CASE C per-member enhancement');

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
