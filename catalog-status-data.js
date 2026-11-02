// Read-only card stats; reuse the same verified calculation as detail mode.
const CatalogStatusData = (() => {
 function project(card,state,mode='initial',openingMode='initial',trainingMode='initial'){
  const stage=(field,custom,max)=>{const selected=mode==='custom'?custom:mode;return selected==='max'?max:selected==='saved'?state[field]:0;};
  const opening=stage('opening',openingMode,5),training=stage('training',trainingMode,4);
  const row={card,opening,training,performance:[],technique:[],sense:[],total:[],unknown:[],error:null};
  try{
   const values=calculateCardParameters(card,training,opening);
   for(const key of ['performance','technique','sense','total'])row[key]=[{value:values[key],text:values[key].toLocaleString('ja-JP')}];
  }catch(error){row.error=error.message;}
  return row;
 }
 return {project};
})();
