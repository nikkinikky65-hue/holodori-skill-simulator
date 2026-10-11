// Attribute selection only: values are supplied by calculatePassiveEffects.
const PassiveSelectionResolver = (() => {
  function resolve({candidates,selectCount,rule,effectType}){
    const base={rule,selectCount,candidates:[],selected:[],excluded:[],ties:[],status:'unresolved',reason:null};
    const parameter=passiveRankingParameter(effectType);
    if(!PARAMETER_PASSIVE_TYPES[effectType] || rule!=='attribute-parameter' || !Number.isInteger(selectCount)||selectCount<1 || candidates.some(m=>!Number.isFinite(passiveRankingValue(m,parameter))||!Number.isInteger(m.formationIndex))) return {...base,reason:'選択規則・比較値未確認'};
    const ranked=rankPassiveCandidates(candidates,parameter);
    const rows=ranked.map((m,i)=>({slot:m.slot,cardId:m.libraryCardId,baseTotal:m.baseTotal,comparisonValue:passiveRankingValue(m,parameter),formationIndex:m.formationIndex,rank:i+1}));
    const ties=[...new Set(rows.map(r=>r.comparisonValue))].map(value=>rows.filter(r=>r.comparisonValue===value)).filter(group=>group.length>1);
    return {...base,status:'resolved',candidates:rows,selected:rows.slice(0,selectCount),excluded:rows.slice(selectCount),ties,
      parameter,model:parameter==='total'?'provisional-total':'observed-single-parameter-model',tieBreakStatus:'provisional-unverified',tieBreak:'input-formation-order',reference:parameter==='total'?'開花後P/T/S合計・暫定（他補正前）':'開花後'+parameter+'・実機一致モデル（Passive・Leader・Memory・Board・衣装・Enhancement除外）'};
  }
  return {resolve};
})();
