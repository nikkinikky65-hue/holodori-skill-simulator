// Read-only candidate projection. Manual records remain untouched.
const EventCandidateLibrary = (() => {
  function merge(catalog, store, manual){
    const known=new Set(catalog.cards.map(c=>c.id));
    function formalId(card){
      for(const id of [card.sourceCardId,card.canonicalExpansion?.source?.cardId,card.id]) if(known.has(id))return id;
      const match=/^canonical:(.+):(?:bloom[0-5]|lv\d+)(?::.*)?$/.exec(card.id || '');
      return match&&known.has(match[1])?match[1]:null;
    }
    const owned=[],errors=[],aliases=new Map();
    for(const card of catalog.cards){
      const state=store.cards[card.id];if(!state?.owned)continue;
      try{
        validateUserCardState(state);
        const expansion=expandCanonicalBloom(card,state.opening,catalog.dataset,state.training);
        const candidate=adaptCanonicalCardToEventCard(card,expansion.levels.active,expansion);
        // Stable formal ID: growth changes must not invalidate required selections.
        candidate.id=card.id;candidate.candidateSource='owned';owned.push(candidate);
      }catch(error){errors.push({cardId:card.id,reason:error.message});}
    }
    const ownedIds=new Set(owned.map(c=>c.id));
    const retained=manual.filter(card=>{const id=formalId(card);if(ownedIds.has(id)){aliases.set(card.id,id);return false;}return true;});
    return {cards:[...owned,...retained],aliases,errors,counts:{owned:owned.length,manual:manual.length,duplicates:manual.length-retained.length,total:owned.length+retained.length}};
  }
  return {merge};
})();
