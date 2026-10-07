// Attribute selection only: values are supplied by calculatePassiveEffects.
const PassiveSelectionResolver = (() => {
  function resolve({candidates,selectCount,rule}){
    const base={rule,selectCount,candidates:[],selected:[],excluded:[],ties:[],status:'unresolved',reason:null};
    if(rule!=='attribute-baseTotal' || !Number.isInteger(selectCount)||selectCount<1 || candidates.some(m=>!Number.isFinite(m.baseTotal)||!Number.isInteger(m.formationIndex))) return {...base,reason:'選択規則・比較値未確認'};
    const ranked=rankPassiveCandidates(candidates);
    const rows=ranked.map((m,i)=>({slot:m.slot,cardId:m.libraryCardId,baseTotal:m.baseTotal,formationIndex:m.formationIndex,rank:i+1}));
    const ties=[...new Set(rows.map(r=>r.baseTotal))].map(value=>rows.filter(r=>r.baseTotal===value)).filter(group=>group.length>1);
    return {...base,status:'resolved',candidates:rows,selected:rows.slice(0,selectCount),excluded:rows.slice(selectCount),ties,
      tieBreak:'input-formation-order',reference:'開花後P/T/S合計（Passive・Memory・Board・衣装・Enhancement除外）'};
  }
  return {resolve};
})();
