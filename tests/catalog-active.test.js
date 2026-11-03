{
 const check=(v,m)=>{if(!v)throw Error(m);},catalog=JSON.parse(readFile('data/runtime-cards.json')),canonical=JSON.parse(readFile('research/canonical-cards.json'));
 const before=JSON.stringify(catalog),resolve=pointer=>pointer.split('/').slice(1).reduce((a,k)=>a[k],canonical),fact=(x,k)=>x.facts.find(f=>f.sourceField===k)?.rawValue;
 let combinations=0,overrides=0;
 for(const card of catalog.cards){
  for(let opening=0;opening<=5;opening++){
   const row=CatalogActiveData.project(card,{opening,training:4},'saved'),level=card.skills.active.levels.find(l=>l.level===row.level),original=resolve(level.source);
   check(!row.error&&!row.unknown.length,'known data '+card.id);
   check(row.level===canonicalBloomLevels(card,opening).active,'existing opening rule');
   for(const [key,field,divisor] of [['interval','coolTimeMillisecond',1000],['time','effectDurationMillisecond',1000],['probability','activationProbabilityPermilMultiply',10]])check(row[key][0].value===fact(original,field)/divisor,'Canonical '+field);
   check(row.content[0].text===skillDescriptionText(fact(original,'text')),'complete Canonical description');
   const effects=[level.baseEffect,...level.conditionalOverrides.map(e=>e.replacementEffect)];
   check(row.amount.length===effects.length,'every base/conditional effect retained');
   effects.forEach((e,i)=>{check(row.amount[i].value===Number(fact(resolve(e.source),'value'))/10,'effect amount');if(i)check(row.amount[i].condition===skillDescriptionText(level.conditionalOverrides[i-1].condition.description),'condition retained');});
   combinations++;
  }
  for(const mode of ['initial','saved','max']){const row=CatalogActiveData.project(card,{opening:2},mode);check(row.opening==={initial:0,saved:2,max:5}[mode],'growth mode');check(JSON.stringify(row)===JSON.stringify(CatalogActiveData.project(card,{opening:2},'custom',mode)),'custom equivalence');}
  overrides+=card.skills.active.levels.reduce((n,l)=>n+l.conditionalOverrides.length,0);
 }
 check(JSON.stringify(catalog)===before,'immutable source');
 const fake=JSON.parse(JSON.stringify(catalog.cards[0])),l=fake.skills.active.levels[0];
 l.raw.activationProbabilityPermilMultiply=null;l.raw.effectDurationMillisecond=null;l.baseEffect.raw.type='UNKNOWN';
 let row=CatalogActiveData.project(fake,{opening:0});check(row.probability[0].text==='—'&&row.time[0].text==='—'&&row.amount[0].text==='—','missing/unknown values never estimated');check(row.content[0].text===skillDescriptionText(l.description),'unknown content preserved');
 l.baseEffect.raw.type='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP';l.conditionalOverrides=[{condition:{description:'条件A'},replacementEffect:{...l.baseEffect,raw:{...l.baseEffect.raw,value:'1230'}}},{condition:{description:'条件B'},replacementEffect:{...l.baseEffect,raw:{...l.baseEffect.raw,value:'4560'}}}];l.description+='\n条件A：123%\n条件B：456%';
 row=CatalogActiveData.project(fake,{opening:0});check(row.amount.length===3&&row.amount[1].value===123&&row.amount[2].value===456,'multiple overrides');check(row.content[0].text.endsWith('条件B：456%'),'full multiple content');
 print('PASS Active: '+catalog.cards.length+' cards, '+combinations+' opening combinations; Canonical values/full text, growth/custom, missing, multiple, immutable; '+overrides+' conditional overrides across both levels');
}
