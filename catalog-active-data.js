// Display source Active values only. Never evaluate conditions or effective cycles.
const CatalogActiveData = (() => {
 const number=value=>['number','string'].includes(typeof value)&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
 const cell=(value,unit)=>({value,text:value===null?'—':value.toLocaleString('ja-JP',{maximumFractionDigits:8})+unit});
 function project(card,state,mode='initial',custom='initial'){
  const policy=mode==='custom'?custom:mode,opening=policy==='max'?5:policy==='saved'?state.opening:0;
  const row={card,opening,level:null,interval:[],time:[],amount:[],probability:[],content:[],unknown:[],error:null};
  try{
   row.level=canonicalBloomLevels(card,opening).active;
   const level=card.skills.active.levels.find(l=>l.level===row.level);
   if(!level)throw Error('Activeレベルの原データがありません');
   for(const [key,field,divisor,unit] of [['interval','coolTimeMillisecond',1000,'秒'],['time','effectDurationMillisecond',1000,'秒'],['probability','activationProbabilityPermilMultiply',10,'%']]){
    let value=number(level.raw?.[field]);
    if(key==='probability'&&value>1000)value=null;
    row[key]=[cell(value===null?null:value/divisor,unit)];
   }
   const entries=[{effect:level.baseEffect},...(level.conditionalOverrides||[]).map(e=>({effect:e.replacementEffect,condition:e.condition}))];
   for(const entry of entries){
    const effect=entry.effect;
    const known=effect?.raw?.type==='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP';
    const value=known?number(effect.raw.value):null;
    const condition=entry.condition?(skillDescriptionText(entry.condition.description)||'条件あり（詳細未確認）'):'';
    row.amount.push({...cell(value===null?null:value/10,'%'),condition});
    if(!known)row.unknown.push(skillDescriptionText(effect?.description)||effect?.raw?.type||'効果未確認');
   }
   // Keep the complete localized description so no conditional or additional effect is lost.
   if(level.description)row.content=[{text:skillDescriptionText(level.description)}];
   else row.content=entries.map(e=>({text:skillDescriptionText(e.effect?.description)||'—',condition:skillDescriptionText(e.condition?.description)}));
  }catch(error){row.error=error.message;}
  return row;
 }
 return {project};
})();
