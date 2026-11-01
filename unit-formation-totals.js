// Read-only adapter to the same Parameter Engine used by the simulator.
const UnitFormationTotals = (() => {
  function calculate({catalog,rules,affiliations},snapshot){
    const unavailable=reason=>({totals:Array(5).fill(null),warning:false,reason});
    try{
      if(!catalog?.dataset?.canonicalSha256 || !Array.isArray(catalog.cards))return unavailable('カードデータを取得できません');
      if(!affiliations || affiliations.canonicalSha256!==catalog.dataset.canonicalSha256 || !affiliations.groups || !affiliations.cardCharacters)return unavailable('所属データが不足、または版が一致しません');
      if(!Array.isArray(snapshot?.slots)||snapshot.slots.length!==5)return unavailable('編成データが不正です');
      // Do not treat an incomplete party as a different, smaller party.
      if(snapshot.slots.some(slot=>!slot.cardId))return unavailable('未選択SLOTがあるため編成全体の計算を保留しています');
      const leader=snapshot.leaderId ? rules?.leaders?.find(row=>row.id===snapshot.leaderId) : null;
      if(snapshot.leaderId && (!leader || rules.canonicalSha256!==catalog.dataset.canonicalSha256))return unavailable('リーダーデータが不足、または版が一致しません');
      const input=snapshot.slots.map((slot,index)=>{
        const card=catalog.cards.find(row=>row.id===slot.cardId);
        if(!card || !affiliations.cardCharacters[slot.cardId])throw Error('カードまたは所属参照が不足しています');
        const member=UnitParameterEngine.calculateMemberParameter(card,slot.training,slot.bloom);
        const passive=member.passiveInput;
        if(!passive?.effect?.raw || !passive.target || !passive.condition || !member.attribute || (passive.condition?.referenceState==='present' && passive.condition.state!=='observed'))throw Error('Passiveの参照データが不足しています');
        for(const row of [...(passive.target?.selectors||[]),...(passive.condition?.clauses||[])]){
          if(row.characterGroupingId && !Array.isArray(affiliations.groups[row.characterGroupingId]?.characterIds))throw Error('Passiveの所属参照が不足しています');
        }
        return {...member,slot:index+1,totalAdjustmentInputs:slot.totalAdjustments};
      });
      if(leader)for(const effect of leader.effects){
        if(effect.condition?.affiliationId && !Array.isArray(affiliations.groups[effect.condition.affiliationId]?.characterIds))return unavailable('リーダーの所属参照が不足しています');
      }
      const parameters=UnitParameterEngine.calculateUnitParameter(input,
        {kind:'manual-rate',percent:snapshot.memoryPercent},
        {kind:'manual-rate',percent:snapshot.enhancementPercent},affiliations,leader);
      const totals=Array.from({length:5},(_,i)=>parameters.members.find(member=>member.slot===i+1)?.subtotal.total);
      if(totals.some(value=>!Number.isFinite(value)))return unavailable('TOTALを算出できません');
      return {totals,warning:parameters.members.some(member=>member.corrections.length>0),reason:null};
    }catch(error){return unavailable('計算に必要なデータを確認できません');}
  }
  return {calculate};
})();
