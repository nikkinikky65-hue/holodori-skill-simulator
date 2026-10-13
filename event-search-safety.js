const EventSearchSafety = (() => {
  const LIMIT=10000;
  const rarity=c=>[3,4,5].includes(Number(c.rarity))?Number(c.rarity):null;
  function filter(cards,requiredIds=[],enabled=true){
    if(!enabled)return [...cards];
    const required=new Set(requiredIds),max=new Map();
    cards.forEach(c=>{const r=rarity(c);if(r!==null)max.set(c.talentId,Math.max(max.get(c.talentId)||0,r));});
    return cards.filter(c=>required.has(c.id)||rarity(c)===null||rarity(c)===max.get(c.talentId));
  }
  // Conservative upper bound includes combinations rejected later for duplicate talents.
  // This also bounds the old synchronous intermediate arrays, not just valid evaluations.
  function estimate(cards,groups){
    if(groups.some(g=>!g.length))return 0;
    const required=new Set(groups.map(g=>g[0].talentId));
    if(required.size!==groups.length)return 0;
    const n=cards.filter(c=>!required.has(c.talentId)).length,k=5-groups.length;
    if(k<0||n<k)return 0;
    let count=1;for(let i=1;i<=k;i++){count=count*(n-i+1)/i;if(count>LIMIT)return LIMIT+1;}
    for(const group of groups){count*=group.length;if(count>LIMIT)return LIMIT+1;}
    return Math.round(count);
  }
  return {LIMIT,filter,estimate};
})();
