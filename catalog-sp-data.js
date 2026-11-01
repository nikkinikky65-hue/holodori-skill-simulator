// Read-only SP projection. No activation evaluation or user-state writes.
const CatalogSPData = (() => {
  const prefix='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_';
  const kinds={SCORE_UP_EFFECT_UP_PERMIL_UP:'support',LIVE_ACTIVE_SKILL_ACTIVATION_PROBABILITY_UP_PERMIL_UP:'probability',LIFE_RECOVERY:'life',JUDGEMENT_ENHANCE:'judgement'};
  const number=value=>!['string','number'].includes(typeof value)||String(value).trim()===''?null:Number.isFinite(Number(value))?Number(value):null;
  const text=value=>skillDescriptionText(value);
  function project(card,state,mode='initial',custom='initial'){
    const selected=mode==='custom'?custom:mode;
    const opening=selected==='max'?5:selected==='saved'?state.opening:0;
    const result={card,opening,level:null,time:[],support:[],probability:[],life:[],judgement:[],unknown:[],error:null};
    try{
      const levelNumber=canonicalBloomLevels(card,opening).special;
      const level=card.skills.special.levels.find(l=>l.level===levelNumber);
      if(!level)throw Error('SPレベルの原データがありません');
      result.level=levelNumber;
      const duration=number(level.raw.effectDurationMillisecond);
      result.time=[{value:duration===null?null:duration/1000,text:duration===null?'—':`${duration/1000}秒`}];
      // Use the existing probability unit conversion; conditions are retained, not evaluated.
      const probabilities=ActivationProbabilityEngine.fromSchedule({status:'resolved',entries:[{cardId:card.id,slot:1,level:levelNumber,start:0,end:duration===null?null:duration/1000,effects:level.effects}]});
      level.effects.forEach((entry,index)=>{
        const raw=entry.effect.raw,type=raw.type?.startsWith(prefix)?raw.type.slice(prefix.length):'',kind=Object.hasOwn(kinds,type)?kinds[type]:null;
        if(!kind){result.unknown.push(text(entry.effect.description)||raw.type||'未分類の効果');return;}
        let value=number(raw.value);
        if(kind==='support')value=value===null?null:value/10; // Source unit is permil; display percent only.
        if(kind==='probability')value=value===null?null:probabilities.find(p=>p.sourceId===`${card.id}:SP:${levelNumber}:${index}`)?.rate*100;
        if(!Number.isFinite(value))value=null;
        const label=kind==='judgement'?(text(entry.effect.description)||'判定強化（内容未確認）'):value===null?'—':`${value.toLocaleString('ja-JP',{maximumFractionDigits:8})}${kind==='support'?'%':kind==='probability'?'%UP':''}`;
        result[kind].push({value,text:label,condition:text(entry.condition?.description)||(entry.condition?.state==='observed'?'条件あり（詳細未確認）':''),source:entry.effect.source});
      });
    }catch(error){result.error=error.message;}
    return result;
  }
  function compare(a,b,key,direction){
    const av=a[key].map(x=>x.value).filter(Number.isFinite),bv=b[key].map(x=>x.value).filter(Number.isFinite);
    if(!av.length||!bv.length)return av.length?-1:bv.length?1:0;
    for(let i=0;i<Math.min(av.length,bv.length);i++)if(av[i]!==bv[i])return direction*(av[i]-bv[i]);
    return direction*(av.length-bv.length);
  }
  return {project,compare};
})();
