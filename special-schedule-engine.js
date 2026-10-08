// Page-local scheduling policy, not measured game timing. Slots keep formation order.
const SpecialScheduleEngine = (() => {
  const supportType='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_EFFECT_UP_PERMIL_UP';
  function describe(member){
    const level=member.expansion.special.data;
    const duration=Number(level.raw.effectDurationMillisecond)/1000;
    const effects=level.effects.map((entry,index)=>{
      const raw=entry.effect.raw, value=Number(raw.value);
      // User-authorized primary SP Support interval only. Keep raw unobserved metadata.
      const primary=index===0 && raw.type===supportType && raw.number===1;
      const rateValid=raw.value!==null && raw.value!==undefined && String(raw.value).trim()!=='' && Number.isFinite(value)&&value>=0;
      const conditionAllowed=entry.condition.state==='unobserved' && !entry.condition.clauses?.length;
      const applied=primary && rateValid && conditionAllowed;
      return {...entry,index,status:applied?'applied':'unresolved',scoreSupportRate:applied?value/10:null,
        reason:applied?null:'主Score Support以外・条件付き・不正効果値は未接続',
        policy:applied?'requested-primary-SP-support-duration':null};
    });
    return {slot:member.slot,cardId:member.card.id,cardName:member.card.name,description:level.description,level:level.level,
      source:level.source,duration,effects,scoreSupportRate:effects.reduce((s,e)=>s+(e.scoreSupportRate??0),0),
      unresolved:effects.filter(e=>e.status!=='applied')};
  }
  function place(entries,songDuration,starts={}){
    if(!Number.isFinite(songDuration)||songDuration<=0) throw Error('曲時間が不正です');
    const invalid=entries.some(e=>!Number.isFinite(e.duration)||e.duration<=0);
    const total=entries.reduce((sum,e)=>sum+e.duration,0);
    if(invalid||total>songDuration) return {status:'unresolved',reason:invalid?'SP持続時間未確認':'全SPの持続時間が曲長を超えています（短縮せず配置保留）',entries:entries.map(e=>({...e,start:null,end:null,placement:'unresolved'}))};
    let end=0,remaining=total;
    const placed=entries.map(entry=>{
      const initial=(entry.slot-.5)*songDuration/5;
      const manual=Object.hasOwn(starts,entry.slot);
      const requestedStart=manual?starts[entry.slot]:initial;
      if(typeof requestedStart!=='number'||!Number.isFinite(requestedStart))throw Error('SP開始時刻は有限の数値で指定してください');
      // Reserve full durations of this and following SPs before accepting a move.
      const latest=songDuration-remaining;
      const start=Math.max(end,Math.min(latest,Math.max(0,requestedStart)));
      end=start+entry.duration;remaining-=entry.duration;
      return {...entry,start,end,initialStart:initial,requestedStart,placement:manual?'manual':'provisional',adjusted:start!==requestedStart};
    });
    return {status:'resolved',reason:null,entries:placed};
  }
  function build(members,songDuration,starts={}){return place(members.filter(Boolean).map(describe),songDuration,starts);}
  return {build,place,describe};
})();
