// Display metadata only. Keep talent identity and formal names unchanged.
// Future talent presentation metadata can be added here without changing stored units.
const TalentPresentation = (() => {
  const shortNames=Object.freeze({
    sakura_miko:'みこ',kobo_kanaeru:'こぼ',azki:'AZKi',
    tsunomaki_watame:'わため',hoshimachi_suisei:'すいせい'
  });
  function resolve(talentId,formalName){
    return {talentId,formalName,displayName:
      (Object.hasOwn(shortNames,talentId)?shortNames[talentId]:formalName) || '未選択'};
  }
  return {resolve};
})();
