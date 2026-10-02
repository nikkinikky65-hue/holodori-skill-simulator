// Card-only verified scope. Missing formation corrections are unknown, not zero.
const UnitParameterEngine = (() => {
  const keys=['performance','technique','sense'];
  const pending=['Passive','強化ボーナス','Memory','Leader','Board','衣装・その他'];
  function calculateMemberParameter(card, training, bloom){
    const cardParameters=calculateCardParameters(card,training,bloom);
    const base={...cardParameters.base};
    base.total=keys.reduce((sum,key)=>sum+base[key],0);
    const opening=Object.fromEntries(keys.map(key=>[key,cardParameters[key]-base[key]]));
    opening.total=keys.reduce((sum,key)=>sum+opening[key],0);
    const subtotal=Object.fromEntries([...keys,'total'].map(key=>[key,cardParameters[key]]));
    return {cardId:card.id, training, bloom, level:cardParameters.level, base, opening, subtotal,
      corrections:pending.map(label=>({label,status:'not-connected',value:null})), final:null};
  }
  function calculateUnitParameter(members){
    const sum=part=>Object.fromEntries([...keys,'total'].map(key=>[key,members.reduce((total,member)=>total+member[part][key],0)]));
    return {members,base:sum('base'),opening:sum('opening'),subtotal:sum('subtotal'),final:null,
      status:members.length===5?'card-only':'incomplete',corrections:pending.map(label=>({label,status:'not-connected',value:null}))};
  }
  return {calculateMemberParameter,calculateUnitParameter};
})();
