{
 const check=(ok,msg)=>{if(!ok)throw Error(msg);},catalog=JSON.parse(readFile('data/runtime-cards.json'));
 const canonical=JSON.parse(readFile('research/canonical-cards.json')),byId=new Map(canonical.cards.map(c=>[c.identity.sourceIdFact.rawValue,c]));
 const snapshot=JSON.stringify(catalog),state={owned:true,training:2,opening:3};
 const values=r=>Object.fromEntries(['performance','technique','sense','total'].map(k=>[k,r[k][0]?.value]));
 let combinations=0;
 for(const card of catalog.cards){
  for(let training=0;training<=4;training++)for(let opening=0;opening<=5;opening++){
   const row=CatalogStatusData.project(card,{training,opening},'saved'),actual=values(row);
   const expected=expandCanonicalBloom(card,opening,catalog.dataset,training).cardParameters;
   check(!row.error,'valid '+card.id);for(const key of Object.keys(actual))check(actual[key]===expected[key],'detail parity '+key);
   check(actual.total===actual.performance+actual.technique+actual.sense,'TOTAL sum');
   const selected=canonicalBloomLevels(card,opening).passive;
   const original=byId.get(card.id).skills.passive.levels.find(l=>l.levelFact.rawValue===selected);
   const texts=original.facts.filter(f=>f.source.table==='LangGeneratedLivePassiveSkillLevel_Jpn'&&f.sourceField==='text').map(f=>f.rawValue);
   check(texts.length===1&&row.passive.length===1&&row.passive[0].text===texts[0],'exact Canonical full text '+card.id);
   check(row.passiveLevel===selected,'passive growth level');combinations++;
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
 const multiple=JSON.parse(JSON.stringify(catalog.cards[0]));
 const text='[attribute=cute]キュート[/attribute]のPが10%UP\n全員のSが20%UP <b>原文</b>';
 multiple.skills.passive.levels[0].description=text;
 check(CatalogStatusData.project(multiple,state).passive[0].text===text,'all effects, tags and newlines retained');
 delete multiple.skills.passive;check(CatalogStatusData.project(multiple,state).passive.length===0,'absent passive');
 const effectCounts=canonical.cards.flatMap(c=>c.skills.passive.levels.map(l=>l.sourceReferences.filter(r=>r.target.table==='LivePassiveSkillEffect').length));
 print('Passive audit: '+effectCounts.length+' levels, maximum effect references '+Math.max(...effectCounts)+'; exact full-text equality across growth states PASS');
 print('PASS status: '+catalog.cards.length+' cards / '+combinations+' growth combinations match detail; TOTAL sum, policies, custom, missing, immutable');
}
