// Raw IDs and explicit CharacterGrouping.characterIds only. No name matching.
const PartyConditionResolver = (() => {
  function resolvePartyCondition({type,affiliationId,requiredCount,unitMembers,catalog}){
    const group=catalog?.groups?.[affiliationId];
    const result={type,affiliationId,affiliationName:group?.name ?? null,requiredCount,
      actualCount:null,countedMembers:[],unknownMembers:[],result:'unresolved'};
    if(type!=='affiliation_count'||!Number.isInteger(requiredCount)||requiredCount<1||!Array.isArray(group?.characterIds)) return result;
    for(const member of unitMembers){
      const characterId=catalog.cardCharacters?.[member.cardId];
      if(typeof characterId!=='string'){result.unknownMembers.push({slot:member.slot,cardId:member.cardId});continue;}
      if(group.characterIds.includes(characterId)) result.countedMembers.push({slot:member.slot,cardId:member.cardId,characterId});
    }
    result.knownCount=result.countedMembers.length;
    // Partial parties or missing identity data are not evidence of a false condition.
    if(result.unknownMembers.length || unitMembers.length!==5) return result;
    result.actualCount=result.knownCount;
    result.result=result.actualCount>=requiredCount?'satisfied':'unsatisfied';
    return result;
  }
  function resolveAttributeCondition({attribute,requiredCount,unitMembers}){
    const valid=value=>/^CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_[123]$/.test(value || '');
    const countedMembers=unitMembers.filter(m=>m.type===attribute);
    const unknownMembers=unitMembers.filter(m=>!valid(m.type));
    const unresolved=!valid(attribute)||!Number.isInteger(requiredCount)||requiredCount<1||unitMembers.length!==5||unknownMembers.length>0;
    return {type:'attribute_count',attribute,requiredCount,actualCount:unresolved?null:countedMembers.length,
      countedMembers:countedMembers.map(m=>({slot:m.slot,cardId:m.libraryCardId})),unknownMembers,
      result:unresolved?'unresolved':countedMembers.length>=requiredCount?'satisfied':'unsatisfied'};
  }
  return {resolvePartyCondition,resolveAttributeCondition};
})();
