{
const catalog=canonicalTestFixture;
const cards=catalog.cards;
const sorted=sortCatalogCardsForDisplay(cards);
const memberOrder=new Map(HOLO_MEMBERS.map((member,index)=>[member.id,index]));
const positions=new Map(cards.map((card,index)=>[card.id,index]));
const expected=[...cards].sort((a,b)=>
  (memberOrder.get(canonicalMemberId(a))??Number.MAX_SAFE_INTEGER)-(memberOrder.get(canonicalMemberId(b))??Number.MAX_SAFE_INTEGER)||
  b.classification.rarity.mapping.value-a.classification.rarity.mapping.value||positions.get(a.id)-positions.get(b.id));
const ids=items=>items.map(card=>card.id).join(',');
if(ids(sorted)!==ids(expected))throw Error('card screen ordering');
for(const rarity of [3,4,5]){
  const source=cards.filter(card=>card.classification.rarity.mapping.value===rarity);
  if(ids(sortCatalogCardsForDisplay(source,cards))!==ids(expected.filter(card=>card.classification.rarity.mapping.value===rarity)))throw Error('rarity '+rarity);
}
for(const member of HOLO_MEMBERS){
  const source=cards.filter(card=>canonicalMemberId(card)===member.id);
  if(ids(sortCatalogCardsForDisplay(source,cards))!==ids(expected.filter(card=>canonicalMemberId(card)===member.id)))throw Error('member '+member.id);
}
const query='星街すいせい';
const matches=sorted.filter(card=>`${card.name} ${canonicalMemberName(card)}`.toLocaleLowerCase().includes(query));
if(ids(matches)!==ids(sortCatalogCardsForDisplay(cards.filter(card=>`${card.name} ${canonicalMemberName(card)}`.toLocaleLowerCase().includes(query)),cards)))throw Error('search preserves order');
if(ids(cards)!==ids(catalog.cards))throw Error('master modified');
print('Card display order: 192 cards, member/rarity/source ties, filtered search PASS');
}
