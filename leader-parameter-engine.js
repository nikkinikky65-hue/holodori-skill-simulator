// Leader = costume skill. Independent slot; rates from audited library projection.
const LeaderParameterEngine = (() => {
  const types={P:['performance'],T:['technique'],S:['sense'],all_parameter:['performance','technique','sense']};
  function resolveCondition(c,members,catalog){
      let condition={result:'satisfied'};
      const unitMembers=members.map((m,i)=>({slot:m.slot??i+1,cardId:m.cardId,libraryCardId:m.cardId,type:m.attribute}));
      if(c.type==='attribute_count')condition=PartyConditionResolver.resolveAttributeCondition({attribute:c.attribute,requiredCount:c.requiredCount,unitMembers});
      else if(c.type==='affiliation_count')condition=PartyConditionResolver.resolvePartyCondition({type:'affiliation_count',affiliationId:c.affiliationId,requiredCount:c.requiredCount,unitMembers,catalog});
      else if(c.type!=='not_stated')condition={result:'unresolved',reason:'条件参照不足'};
    return condition;
  }
  function calculate(leader,members,catalog){
    const values=members.map(()=>({performance:0,technique:0,sense:0,total:0})),trace=[];
    for(const effect of leader.effects){
      const keys=types[effect.parameter],c=effect.condition;
      const condition=resolveCondition(c,members,catalog);
      const row={kind:'Leader',source:leader.id,description:effect.description,effect,condition,parameters:[],status:'applied'};
      if(!keys){row.status='unsupported';row.reason='Supportは今回未接続';}
      else if(effect.target!=='all_members'){row.status='unresolved';row.reason='対象定義未対応';}
      else if(!Number.isFinite(effect.percent)||effect.percent<0){row.status='unresolved';row.reason='効果率不正';}
      else if(condition.result!=='satisfied'){row.status=condition.result==='unsatisfied'?'inactive':'unresolved';row.reason=condition.reason||'人数条件';}
      else members.forEach((member,i)=>{
        const rates=Object.fromEntries(keys.map(key=>[key,effect.percent/100]));
        // Existing verified per-member/per-parameter ceil, not Passive aggregation.
        const added=calculateOutfitEffects(member.subtotal,rates);
        for(const key of ['performance','technique','sense','total'])values[i][key]+=added[key];
        for(const key of keys)row.parameters.push({targetSlot:member.slot??i+1,targetCardId:member.cardId,parameter:key,reference:member.subtotal[key],rate:effect.percent/100,raw:member.subtotal[key]*effect.percent/100,added:added[key],rounding:'ceil per member/parameter',basis:'post-bloom; excludes Passive/Memory/Board/costume'});
      });
      trace.push(row);
    }
    return {source:leader.id,values,trace,status:trace.every(r=>['applied','inactive'].includes(r.status))?'supported':trace.some(r=>['applied','inactive'].includes(r.status))?'partial':'unsupported'};
  }
  return {calculate,resolveCondition};
})();
