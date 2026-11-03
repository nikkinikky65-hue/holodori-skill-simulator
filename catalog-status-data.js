// Read-only card stats; reuse the same verified calculation as detail mode.
const CatalogStatusData = (() => {
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
   const description=card.skills.passive?.levels?.find(item=>item.level===level)?.description;
   // Whole localized skill text, not interpreted or reconstructed effect fragments.
   if(typeof description==='string'&&description.length)row.passive=[{text:skillDescriptionText(description)}];
  }catch(error){row.error=[row.error,error.message].filter(Boolean).join(' / ');}
  return row;
 }
 return {project};
})();
