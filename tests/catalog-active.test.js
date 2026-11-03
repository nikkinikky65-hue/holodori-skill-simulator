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
   const effects=[level.baseEffect,...level.conditionalOverrides.map(e=>e.replacementEffect)];
   const expected=Math.max(...effects.map(e=>Number(fact(resolve(e.source),'value'))))/10;
   check(row.amount.length===1&&row.amount[0].value===expected,'Canonical maximum effect, not sum');
   check(row.conditions.length===level.conditionalOverrides.length,'all source conditions');
   level.conditionalOverrides.forEach((entry,i)=>{
    const originalCondition=resolve(entry.condition.source);
    const raw=originalCondition.sourceFacts.find(f=>f.sourceField==='text')?.rawValue;
    check(row.conditions[i].text===skillDescriptionText(raw),'exact Canonical condition text');
   });
   combinations++;
  }
  for(const mode of ['initial','saved','max']){const row=CatalogActiveData.project(card,{opening:2},mode);check(row.opening==={initial:0,saved:2,max:5}[mode],'growth mode');check(JSON.stringify(row)===JSON.stringify(CatalogActiveData.project(card,{opening:2},'custom',mode)),'custom equivalence');}
  overrides+=card.skills.active.levels.reduce((n,l)=>n+l.conditionalOverrides.length,0);
 }
 check(JSON.stringify(catalog)===before,'immutable source');
 const fake=JSON.parse(JSON.stringify(catalog.cards[0])),l=fake.skills.active.levels[0];
 l.raw.activationProbabilityPermilMultiply=null;l.raw.effectDurationMillisecond=null;l.baseEffect.raw.type='UNKNOWN';
 let row=CatalogActiveData.project(fake,{opening:0});check(row.probability[0].text==='—'&&row.time[0].text==='—'&&row.amount[0].text==='—','missing/unknown values never estimated');check(row.unknown.length>0,'unknown maximum reported');
 l.evaluationScope='one-active-effect-select-base-or-matching-override';l.baseEffect.raw.type='LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP';l.conditionalOverrides=[{condition:{description:'条件A'},replacementEffect:{...l.baseEffect,raw:{...l.baseEffect.raw,value:'1230'}}},{condition:{description:'条件B'},replacementEffect:{...l.baseEffect,raw:{...l.baseEffect.raw,value:'4560'}}}];l.description+='\n条件A：123%\n条件B：456%';
 row=CatalogActiveData.project(fake,{opening:0});check(row.amount.length===1&&row.amount[0].value===456,'multiple alternatives choose max');check(row.conditions.map(e=>e.text).join('/')==='条件A/条件B','all conditions remain');
 l.conditionalOverrides[1].replacementEffect.raw.value=null;check(CatalogActiveData.project(fake,{opening:0}).amount[0].text==='—','missing alternative prevents inferred max');
 l.conditionalOverrides[1].replacementEffect.raw.value='4560';l.conditionalOverrides[1].replacementEffect.raw.type='OTHER';check(CatalogActiveData.project(fake,{opening:0}).amount[0].text==='—','different effects never compared or summed');
 l.conditionalOverrides=[];row=CatalogActiveData.project(fake,{opening:0});check(row.conditions.length===0&&row.amount[0].value===Number(l.baseEffect.raw.value)/10,'unconditional uses base');
 l.conditionalOverrides=[{condition:{description:'[attribute=pure]ピュア[/attribute]2人以上で'},replacementEffect:{...l.baseEffect,raw:{...l.baseEffect.raw,value:'0'}}}];row=CatalogActiveData.project(fake,{opening:0});check(row.amount[0].value===Number(l.baseEffect.raw.value)/10&&row.conditions[0].text==='ピュア2人以上で','lower alternative and safe tag stripping');
 delete l.evaluationScope;check(CatalogActiveData.project(fake,{opening:0}).amount[0].text==='—','unconfirmed replacement semantics');
 print('PASS Active: '+catalog.cards.length+' cards, '+combinations+' opening combinations; Canonical maximum values/condition text, growth/custom, missing, multiple, immutable; '+overrides+' conditional overrides across both levels');
}
