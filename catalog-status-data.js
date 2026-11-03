// Read-only card stats; reuse the same verified calculation as detail mode.
const CatalogStatusData = (() => {
 function passiveText(level){
  const full=skillDescriptionText(level?.description);
  if(!full)return [];
  const effect=skillDescriptionText(level.effect?.description),condition=level.condition;
  // Only the existing single-effect schema is known. Preserve any unaccounted text.
  if(!level.effects && effect && condition){
   const trigger=skillDescriptionText(condition.description);
   if(condition.state==='observed'&&condition.referenceState==='present'&&
      condition.clauses?.length>0&&trigger&&full===trigger+effect)
    return [{text:effect+' ※'}];
   if(condition.state==='unobserved'&&condition.referenceState==='absent'&&
      !condition.clauses?.length&&!trigger&&full===effect)return [{text:effect}];
  }
  return [{text:full}];
 }
 function project(card,state,mode='initial',openingMode='initial',trainingMode='initial'){
  const stage=(field,custom,max)=>{const selected=mode==='custom'?custom:mode;return selected==='max'?max:selected==='saved'?state[field]:0;};
  const opening=stage('opening',openingMode,5),training=stage('training',trainingMode,4);
  const row={card,opening,training,performance:[],technique:[],sense:[],total:[],passive:[],unknown:[],error:null};
  try{
   const values=calculateCardParameters(card,training,opening);
   for(const key of ['performance','technique','sense','total'])row[key]=[{value:values[key],text:values[key].toLocaleString('ja-JP')}];
  }catch(error){row.error=error.message;}
  try{
   const level=canonicalBloomLevels(card,opening).passive;
   row.passiveLevel=level;
   row.passive=passiveText(card.skills.passive?.levels?.find(item=>item.level===level));
  }catch(error){row.error=[row.error,error.message].filter(Boolean).join(' / ');}
  return row;
 }
 return {project,passiveText};
})();
