{
 const check=(v,m)=>{if(!v)throw Error(m);};
 const catalog=JSON.parse(readFile('data/runtime-cards.json')),affiliations=JSON.parse(readFile('data/runtime-affiliations.json'));
 const refs=catalog.cards.map(c=>({talentId:c.member.mapping.id,formalName:c.member.name,source:c.id}));
 const before=JSON.stringify({members:HOLO_MEMBERS,refs});
 const view=TalentFilter.prepare(HOLO_MEMBERS,refs);
 check(view.members.length===54&&view.groups.length===15,'all 54 talents and 15 registered groups');
 check(view.diagnostics.filter(i=>i.code==='missing-short-name').length===49,'49 unregistered abbreviations remain visible');
 check(view.diagnostics.every(i=>i.code==='missing-short-name'),'actual IDs, names and group declarations consistent');
 check(view.groups.filter(g=>g.members.some(m=>m.id==='shirakami_fubuki')).length===2,'multiple official affiliations retained');
 for(const member of view.members){
  check(member.displayName===TalentPresentation.resolve(member.id,member.formalName).displayName,'shared abbreviations');
  const card=catalog.cards.find(c=>c.member.mapping.id===member.id),character=affiliations.cardCharacters[card.id];
  const actual=Object.values(affiliations.groups).filter(g=>g.characterIds.includes(character)).map(g=>g.name).sort();
  check(JSON.stringify([...member.affiliations].sort())===JSON.stringify(actual),'group membership matches captured CharacterGrouping: '+member.id);
 }
 const synthetic=[...HOLO_MEMBERS,{id:'sakura_miko',name:'重複',affiliations:[]},{id:'another_talent',name:'みこ',affiliations:[]},{id:null,name:'IDなし'}];
 const diagnostic=TalentFilter.prepare(synthetic,[{talentId:'unknown',formalName:'不明',source:'card-unknown'},{talentId:'sakura_miko',formalName:'正式名不一致',source:'card-known'}]);
 for(const code of ['duplicate-id','invalid-id','duplicate-display-name','missing-affiliation','unknown-reference-id','reference-name-mismatch'])check(diagnostic.diagnostics.some(i=>i.code===code),'detect '+code);
 check(diagnostic.members.filter(m=>m.id==='sakura_miko').length===1,'ambiguous repeated IDs do not duplicate selection');
 check(diagnostic.groups.find(g=>g.name==='所属未確認').members.some(m=>m.id==='another_talent'),'unconfirmed affiliation never guessed');
 check(TalentPresentation.inspect(HOLO_MEMBERS.filter(m=>m.id!=='sakura_miko')).some(i=>i.code==='unknown-short-name-id'),'dangling abbreviation ID detected');
 check(JSON.stringify({members:HOLO_MEMBERS,refs})===before,'source data never mutated');
 print('Talent filter: 54 talents / 15 verified affiliations / 49 abbreviation fallbacks, duplicate and inconsistent IDs/names, source purity PASS');
}
