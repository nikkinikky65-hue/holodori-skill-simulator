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
  const hasShortName=talentId=>Object.hasOwn(shortNames,talentId);
  // Diagnostics are informational; they never block ID-based selection.
  function inspect(members,references=[]){
    const issues=[],byId=new Map(),byDisplay=new Map();
    for(const member of members){
      if(typeof member.id!=='string'||!member.id.trim()){
        issues.push({code:'invalid-id',talentId:null,message:`タレントID未定義：${member.name || '名称未定義'}`});continue;
      }
      if(byId.has(member.id))issues.push({code:'duplicate-id',talentId:member.id,message:`タレントID重複：${member.id}`});
      else byId.set(member.id,member);
      if(!hasShortName(member.id))issues.push({code:'missing-short-name',talentId:member.id,message:`略称未登録：${member.name}（${member.id}）`});
      if(!member.affiliations?.length)issues.push({code:'missing-affiliation',talentId:member.id,message:`所属未確認：${member.name}（${member.id}）`});
      const display=resolve(member.id,member.name).displayName;
      if(!byDisplay.has(display))byDisplay.set(display,new Set());
      byDisplay.get(display).add(member.id);
    }
    for(const id of Object.keys(shortNames))if(!byId.has(id))issues.push({code:'unknown-short-name-id',talentId:id,message:`略称登録IDがタレント一覧にありません：${id}`});
    for(const [name,ids] of byDisplay)if(ids.size>1)issues.push({code:'duplicate-display-name',talentIds:[...ids],message:`表示名重複：${name}（${[...ids].join('、')}）`});
    for(const ref of references){
      const member=byId.get(ref.talentId);
      if(!member)issues.push({code:'unknown-reference-id',talentId:ref.talentId,message:`参照先タレントID未確認：${ref.source} / ${ref.talentId ?? 'IDなし'}`});
      else if(member.name!==ref.formalName)issues.push({code:'reference-name-mismatch',talentId:ref.talentId,message:`IDと正式名の不一致：${ref.source} / ${ref.talentId} / ${ref.formalName}`});
    }
    return issues;
  }
  return {resolve,hasShortName,inspect};
})();
