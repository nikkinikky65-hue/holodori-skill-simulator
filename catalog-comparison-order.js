// Shared display ordering; no skill or parameter calculations.
const CatalogComparisonOrder = (() => {
  function compare(a,b,key,direction){
    const av=a[key].map(x=>x.value).filter(Number.isFinite),bv=b[key].map(x=>x.value).filter(Number.isFinite);
    if(!av.length||!bv.length)return av.length?-1:bv.length?1:0;
    for(let i=0;i<Math.min(av.length,bv.length);i++)if(av[i]!==bv[i])return direction*(av[i]-bv[i]);
    return direction*(av.length-bv.length);
  }
  // Reverse affiliation blocks, preserving catalog order within each block.
  function sortByAffiliation(cards,direction=1){
    const ordered=sortCatalogCardsForDisplay(cards,cards);
    if(direction===1)return ordered;
    const members=new Map(HOLO_MEMBERS.map(m=>[m.id,m]));
    const groups=new Map(),unknown=[];
    for(const card of ordered){
      // First registered affiliation determines catalog placement (Fubuki: 1期生).
      const group=members.get(canonicalMemberId(card))?.affiliations?.[0];
      if(!group){unknown.push(card);continue;}
      if(!groups.has(group))groups.set(group,[]);
      groups.get(group).push(card);
    }
    return [...[...groups.values()].reverse().flat(),...unknown];
  }
  return {compare,sortByAffiliation};
})();
