// Leader support is independent of Parameter effects and SP enablement.
const LeaderSupportEngine = (()=>{
 function resolve(leader,members,catalog){
  const targets=members.map((m,i)=>({slot:m.slot??i+1,rate:0})),sources=[];
  for(const effect of leader?.effects||[]){
   if(effect.parameter!=='score_support')continue;
   const condition=LeaderParameterEngine.resolveCondition(effect.condition,members,catalog);
   const row={sourceType:'leader',sourceId:leader.id,description:effect.description,condition,targetSlots:[],rate:effect.percent,status:'applied',reason:null};
   if(effect.target!=='all_members'){row.status='unresolved';row.reason='Leader Support対象未対応';}
   else if(!Number.isFinite(effect.percent)||effect.percent<0){row.status='unresolved';row.reason='Leader Support率不正';}
   else if(condition.result!=='satisfied'){row.status=condition.result==='unsatisfied'?'inactive':'unresolved';row.reason=condition.reason||'人数条件';}
   else{row.targetSlots=targets.map(t=>t.slot);targets.forEach(t=>t.rate+=effect.percent);}
   sources.push(row);
  }
  return {sources,targets};
 }
 // Display only: snapshot support at the Active candidate's start, not intersection.
 function atActivation(event,schedule,passiveSupport,leaderSupport,spEnabled=true){
  const sp=spEnabled&&schedule.status==='resolved'?schedule.entries.find(s=>s.start<=event.start&&event.start<s.end):null;
  const leaderRate=leaderSupport.targets.find(t=>t.slot===event.m.slot)?.rate||0;
  const passiveRate=spEnabled?(passiveSupport.targets.find(t=>t.slot===event.m.slot)?.rate||0):0;
  const spRate=sp?.scoreSupportRate||0;
  const values=calculateSupportBoost(event.boost,spRate,leaderRate+passiveRate);
  return {time:event.start,slot:event.m.slot,leaderRate,passiveRate,spRate,spSlot:sp?.slot??null,...values,
   displayAdditional:Math.floor(values.supportBoost),displayTotal:event.boost+Math.floor(values.supportBoost),policy:'display-only-floor-at-activation-start'};
 }
 return {resolve,atActivation};
})();
