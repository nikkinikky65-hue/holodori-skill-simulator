// 確認済みの倍率計算のみ。ゲーム側の端数処理は未確定なので丸めない。
function calculateSupportBoost(baseBoost, scoreSupportRate, additionalSupportRate = 0){
  const effectiveSupportRate = scoreSupportRate + additionalSupportRate;
  const supportBoost = baseBoost * (effectiveSupportRate / 100);
  return {
    baseBoost, scoreSupportRate, additionalSupportRate, effectiveSupportRate,
    supportBoost, effectiveBoost: baseBoost + supportBoost,
    // v1 export互換。倍率ではなくActiveへ換算済みの加算量。
    scoreSupportBoost: supportBoost
  };
}

// 指定人数を超える候補の選び方は不明。先頭順等の代替選択を行わない。
function resolveSupportTargets(candidates, targetCount){
  if(candidates.length === 0) return { status: 'resolved', targets: [] };
  if(!Number.isInteger(targetCount) || targetCount <= 0){
    return { status: 'unresolved-target-count', targets: [] };
  }
  if(candidates.length > targetCount){
    return { status: 'unresolved-target-selection', targets: [] };
  }
  return { status: 'resolved', targets: [...candidates] };
}

function supportNumber(value){
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

// 入力中の通常倍率と、Card v2のPassive追加倍率を分離して評価する。
// リーダー・Specialはここへ渡さない。
function precalculateSupportParty(members, cards){
  const byId = new Map(cards.map(card => [card.id, card]));
  const partyMembers = members.map(member => {
    const libraryCard = byId.get(member.libraryCardId) || null;
    return {
      ...member, libraryCard, type: libraryCard?.type || '',
      baseBoost: member.boost,
      scoreSupportRate: supportNumber(member.scoreSupportRate),
      supportRateModifiers: []
    };
  });
  const composition = { cute: 0, pure: 0, happy: 0 };
  partyMembers.forEach(member => {
    if(Object.hasOwn(composition, member.type)) composition[member.type]++;
  });
  const passiveResults = [];
  partyMembers.forEach(source => {
    const effect = source.libraryCard?.skills?.passive?.scoreSupport;
    const value = supportNumber(effect?.boost);
    if(!effect || value === 0) return;
    const conditionType = effect.conditionType || '';
    const conditionCount = supportNumber(effect.conditionCount);
    const activated = !conditionType || composition[conditionType] >= conditionCount;
    const targetType = effect.targetType || '';
    const targetCount = supportNumber(effect.targetCount);
    const candidates = partyMembers.filter(member => member.type === targetType && targetType !== '');
    const resolution = !activated
      ? { status: 'inactive', targets: [] }
      : !Object.hasOwn(composition, targetType)
        ? { status: 'unresolved-target-type', targets: [] }
        : resolveSupportTargets(candidates, targetCount);
    const result = {
      sourceType: 'passive', sourceSlot: source.slot, sourceCardId: source.libraryCardId,
      conditionType, conditionCount, activated, targetType, targetCount,
      candidateCount: candidates.length, candidateSlots: candidates.map(member => member.slot),
      targetSlots: resolution.targets.map(member => member.slot),
      additionalSupportRate: value, status: resolution.status
    };
    passiveResults.push(result);
    if(!activated) return;
    // 未設定の対象タイプも、適用済みと誤認しないよう全枠へ保留情報を渡す。
    const affected = resolution.status === 'unresolved-target-type' ? partyMembers : candidates;
    affected.forEach(target => target.supportRateModifiers.push({
      sourceType: 'passive', sourceCardId: source.libraryCardId, sourceSlot: source.slot,
      value, status: resolution.status, applied: resolution.status === 'resolved'
    }));
  });
  partyMembers.forEach(member => {
    const applicable = member.supportRateModifiers.filter(modifier => modifier.applied);
    // 複数Passiveの重複規則は今回確認されていないため、勝手に合算しない。
    if(applicable.length > 1){
      applicable.forEach(modifier => {
        modifier.applied = false;
        modifier.status = 'unresolved-stacking';
      });
    }
    const applied = member.supportRateModifiers.find(modifier => modifier.applied);
    const passiveAdditionalSupportRate = applied?.value || 0;
    Object.assign(member, calculateSupportBoost(member.baseBoost, member.scoreSupportRate, passiveAdditionalSupportRate));
    member.passiveAdditionalSupportRate = passiveAdditionalSupportRate;
    member.supportStatus = member.supportRateModifiers.some(modifier => !modifier.applied)
      ? 'partial' : 'resolved';
  });
  return { members: partyMembers, composition, passiveResults };
}
