{
 const check=(v,m)=>{if(!v)throw Error(m);},cards=JSON.parse(readFile('data/runtime-cards.json')).cards;
 const before=JSON.stringify(cards),counts={support:0,probability:0,life:0,judgement:0};
 for(const card of cards){
  for(const mode of ['initial','saved','max','custom']){
   const row=CatalogSPData.project(card,{opening:3},mode,'saved');
   check(!row.error&&!row.unknown.length,'all real SP types understood '+card.id);
   check(row.level===canonicalBloomLevels(card,mode==='initial'?0:mode==='max'?5:3).special,'shared growth resolution');
  }
  for(const custom of ['initial','saved','max'])check(JSON.stringify(CatalogSPData.project(card,{opening:3},'custom',custom))===JSON.stringify(CatalogSPData.project(card,{opening:3},custom)),'custom matches selected policy');
  for(const mode of ['initial','max']){
   const row=CatalogSPData.project(card,{opening:0},mode),level=card.skills.special.levels.find(l=>l.level===row.level);
   check(row.time[0].value===Number(level.raw.effectDurationMillisecond)/1000,'duration ms to sec');
   for(const kind of Object.keys(counts))for(const value of row[kind]){
    counts[kind]++;
    const source=level.effects.find(e=>e.effect.source===value.source);
    check(source,'source retained');
    if(kind==='judgement')check(value.text===skillDescriptionText(source.effect.description)&&value.value===null,'judgement remains textual');
    else check(Math.abs(value.value-Number(source.effect.raw.value)/(kind==='life'?1:10))<1e-9,'raw display units '+kind);
    check(value.condition===skillDescriptionText(source.condition.description),'conditions retained');
   }
  }
 }
 check(JSON.stringify(cards)===before,'source immutable');
 const synthetic=JSON.parse(JSON.stringify(cards[0]));
 const level=synthetic.skills.special.levels[0];level.effects.push(JSON.parse(JSON.stringify(level.effects[0])));
 const row=CatalogSPData.project(synthetic,{opening:0});check(row.support.length===2,'multiple effects retained');
 level.effects.push({effect:{raw:{type:'UNKNOWN',value:'12'},description:'未確認'},condition:{}});
 check(CatalogSPData.project(synthetic,{opening:0}).unknown[0]==='未確認','unknown not guessed');
 level.raw.effectDurationMillisecond=null;check(CatalogSPData.project(synthetic,{opening:0}).time[0].text==='—','missing duration');
 const a={life:[{value:2},{value:5}]},b={life:[{value:2},{value:8}]},missing={life:[]};
 check(CatalogSPData.compare(a,b,'life',1)<0&&CatalogSPData.compare(a,b,'life',-1)>0,'lexicographic sort');
 for(const dir of [1,-1])check(CatalogSPData.compare(a,missing,'life',dir)<0,'missing last');
 print('PASS: '+cards.length+' cards, both SP levels, growth, units, conditions, multiple effects, unknown/missing, sorting, immutability; effects '+JSON.stringify(counts));
}
