(()=>{
 const assert=(x,m)=>{if(!x)throw Error(m);};const catalog=canonicalTestFixture;
 const a=catalog.cards[0],b=catalog.cards.find(c=>c.member.name===a.member.name&&c.id!==a.id),c=catalog.cards.find(c=>c.member.name!==a.member.name);
 const store={version:1,cards:{[a.id]:{owned:true,training:3,opening:5},[b.id]:{owned:true,training:0,opening:0},[c.id]:{owned:false,training:4,opening:5}}};
 const manual=[{id:a.id,cardName:'duplicate'},{id:'custom-id',cardName:a.name,talentId:canonicalMemberId(a)},{id:'explicit-ref',sourceCardId:b.id},{id:'unrelated',talentId:'other'}];
 const before=JSON.stringify({store,manual,catalog});const result=EventCandidateLibrary.merge(catalog,store,manual);
 assert(JSON.stringify({store,manual,catalog})===before,'read only');assert(result.cards.length===4&&result.counts.duplicates===2,'merge counts');
 assert(result.cards[0].canonicalExpansion.training===3&&result.cards[0].canonicalExpansion.bloom===5,'growth');
 assert(result.cards[0].canonicalExpansion.levels.active===canonicalBloomLevels(a,5).active,'skill level');
 assert(result.cards.some(c=>c.id==='custom-id'),'no name matching');assert(!result.cards.some(x=>x.id===c.id),'unowned excluded');
 assert(result.cards[0].talentId===result.cards[1].talentId,'different cards retained same talent');assert(result.aliases.get('explicit-ref')===b.id,'required slot alias');
 const empty=EventCandidateLibrary.merge(catalog,{version:1,cards:{}},manual);assert(JSON.stringify(empty.cards)===JSON.stringify(manual),'manual only identical');
 assert(result.cards.length===result.counts.owned+result.counts.manual-result.counts.duplicates,'counts');
 print('Event candidate merge: ownership, growth, explicit IDs, aliases, manual compatibility, read-only PASS');
})();
