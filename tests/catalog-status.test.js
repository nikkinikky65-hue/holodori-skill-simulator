{
 const check=(ok,msg)=>{if(!ok)throw Error(msg);},catalog=JSON.parse(readFile('data/runtime-cards.json'));
 const snapshot=JSON.stringify(catalog),state={owned:true,training:2,opening:3};
 const values=r=>Object.fromEntries(['performance','technique','sense','total'].map(k=>[k,r[k][0]?.value]));
 let combinations=0;
 for(const card of catalog.cards){
  for(let training=0;training<=4;training++)for(let opening=0;opening<=5;opening++){
   const row=CatalogStatusData.project(card,{training,opening},'saved'),actual=values(row);
   const expected=expandCanonicalBloom(card,opening,catalog.dataset,training).cardParameters;
   check(!row.error,'valid '+card.id);for(const key of Object.keys(actual))check(actual[key]===expected[key],'detail parity '+key);
   check(actual.total===actual.performance+actual.technique+actual.sense,'TOTAL sum');combinations++;
  }
  for(const mode of ['initial','saved','max']){
   const row=CatalogStatusData.project(card,state,mode);check(row.training==={initial:0,saved:2,max:4}[mode]&&row.opening==={initial:0,saved:3,max:5}[mode],'growth policy');
  }
  for(const t of ['initial','saved','max'])for(const o of ['initial','saved','max']){
   const row=CatalogStatusData.project(card,state,'custom',o,t);check(row.training==={initial:0,saved:2,max:4}[t]&&row.opening==={initial:0,saved:3,max:5}[o],'independent custom policies');
  }
 }
 check(JSON.stringify(catalog)===snapshot&&state.training===2&&state.opening===3,'read-only');
 const broken=JSON.parse(JSON.stringify(catalog.cards[0]));broken.progression.statSnapshots=[];
 const missing=CatalogStatusData.project(broken,state);check(missing.error&&missing.total.length===0,'missing data not guessed');
 print('PASS status: '+catalog.cards.length+' cards / '+combinations+' growth combinations match detail; TOTAL sum, policies, custom, missing, immutable');
}
