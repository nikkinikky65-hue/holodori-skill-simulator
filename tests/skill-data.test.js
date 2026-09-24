// jsc card-rules.js support-rules.js tests/skill-data.test.js
function assert(ok, message){ if(!ok) throw Error(message); }
assert(createCardV2({cardName:'  '}).cardName==='未分類','new blank name');
assert(createCardV2({cardName:'  '},{cardName:'正式名'}).cardName==='正式名','existing name');
const legacy = createCardV2({id:'legacy',cardName:'正式名',extensions:{keep:1},skills:{
  special:{description:'SP原文',extra:1},
  active:{interval:35,probability:'mid',duration:8,boost:75,description:'A原文',extra:2},
  passive:{status:{description:'旧ステータス原文'},scoreSupport:{conditionType:'cute',conditionCount:3,targetType:'pure',targetCount:2,boost:8,description:'P原文',extra:3}}
}});
const effect=getPassiveEffect(legacy);
assert(effect.type==='score_support' && effect.value===8,'legacy P value');
assert(effect.condition.value==='cute' && effect.target.value==='pure' && effect.conditionCount===3 && effect.targetCount===2,'independent criteria');
const manual=createCardV2({skills:{
  special:{effectTypes:['score_support','life_recovery'],boost:80,duration:10,description:'複合SP'},
  active:{effectType:'score_up'},
  passive:{effect:{...effect,value:9}}
}},legacy);
assert(manual.skills.passive.scoreSupport.extra===3 && manual.skills.active.extra===2 && manual.skills.special.extra===1 && manual.extensions.keep===1,'legacy and extensions retained');
assert(manual.skills.passive.scoreSupport.boost===8 && getPassiveScoreSupport(manual).boost===9,'canonical value wins, original retained');
const reloaded=normalizeCardV2(JSON.parse(JSON.stringify(manual)));
assert(JSON.stringify(reloaded)===JSON.stringify(manual),'save/read lossless');
assert(reloaded.skills.special.effectTypes.length===2 && reloaded.skills.special.boost===80 && reloaded.skills.special.duration===10,'SP shared properties');
const statusCard=createCardV2({skills:{passive:{effect:{...effect,type:'performance_up'}}}},manual);
assert(getPassiveEffect(statusCard).type==='performance_up' && getPassiveScoreSupport(statusCard)===null,'status never becomes support');
const affiliation=skillConditionFromKey('affiliation:0期生');
const affiliateCard=createCardV2({skills:{passive:{effect:{...effect,condition:affiliation}}}},manual);
assert(skillConditionKey(getPassiveEffect(affiliateCard).condition)==='affiliation:0期生','affiliation reference');
assert(getPassiveScoreSupport(affiliateCard).unresolvedCondition,'affiliation not evaluated');
const m=[{slot:1,libraryCardId:'legacy',boost:75,scoreSupportRate:80}];
affiliateCard.type='pure';
const p=precalculateSupportParty(m,[affiliateCard]);
assert(p.members[0].effectiveBoost===135 && p.members[0].supportStatus==='partial','unimplemented condition excluded');
const unknown=createCardV2({skills:{passive:{effect:{...effect,condition:{kind:'future',value:'x',extra:1},extra:2}}}},legacy);
assert(getPassiveEffect(unknown).condition.extra===1 && getPassiveEffect(unknown).extra===2,'unknown fields retained');
print('Manual SP/A/P, legacy compatibility and independent conditions: PASS');
