// Display source Active values only. Never evaluate conditions or effective cycles.
const CatalogActiveData = (() => {
 const number=value=>['number','string'].includes(typeof value)&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
 const cell=(value,unit)=>({value,text:value===null?'—':value.toLocaleString('ja-JP',{maximumFractionDigits:8})+unit});
 function project(card,state,mode='initial',custom='initial'){
  const policy=mode==='custom'?custom:mode,opening=policy==='max'?5:policy==='saved'?state.opening:0;
  const row={card,opening,level:null,interval:[],time:[],amount:[],probability:[],conditions:[],unknown:[],error:null};
  try{
   row.level=canonicalBloomLevels(card,opening).active;
   const level=card.skills.active.levels.find(l=>l.level===row.level);
   if(!level)throw Error('Activeレベルの原データがありません');
   for(const [key,field,divisor,unit] of [['interval','coolTimeMillisecond',1000,'秒'],['time','effectDurationMillisecond',1000,'秒'],['probability','activationProbabilityPermilMultiply',10,'%']]){
    let value=number(level.raw?.[field]);
    if(key==='probability'&&value>1000)value=null;
    row[key]=[cell(value===null?null:value/divisor,unit)];
   }
   const overrides=level.conditionalOverrides||[];
   const effects=[level.baseEffect,...overrides.map(e=>e.replacementEffect)];
   // Compare alternatives of the same supported score effect, never sum them.
   const comparable=(!overrides.length||level.evaluationScope==='one-active-effect-select-base-or-matching-override')&&effects.every(effect=>
    effect?.raw?.type==='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP'&&
    effect.raw.number===1&&Object.keys(effect.raw).every(key=>['number','type','value'].includes(key))&&number(effect.raw.value)!==null);
   row.amount=[cell(comparable?Math.max(...effects.map(e=>number(e.raw.value)))/10:null,'%')];
   if(!comparable)row.unknown.push('効果量の最大値を特定できません（効果の種類・値・置換関係を確認できません）');
   row.conditions=overrides.map(entry=>{
    const text=skillDescriptionText(entry.condition?.description);
    if(!text)row.unknown.push('条件文の原文がありません');
    return {text:text||'—'};
   });
  }catch(error){row.error=error.message;}
  return row;
 }
 return {project};
})();
