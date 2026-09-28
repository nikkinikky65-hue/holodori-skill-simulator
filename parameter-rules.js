// ユニットパラメータ計算。Card v2のstatsは読み取り専用で扱い、自動補正しない。
const UNIT_ENHANCEMENT_RATE = 0.0243;
const PARAMETER_KEYS = ['performance', 'technique', 'sense'];
const PARAMETER_PASSIVE_TYPES = {
  performance_up: ['performance'],
  technique_up: ['technique'],
  sense_up: ['sense'],
  all_parameters_up: PARAMETER_KEYS
};

function parameterNumber(value){
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function parameterStats(member){
  // Card v2 stats may already include the board correction from when that JSON was recorded.
  // Only explicit baseStats are valid calculation input; never infer them from card.stats.
  const stats = member.baseStats || {};
  return Object.fromEntries(PARAMETER_KEYS.map(key => [key, parameterNumber(stats[key])]));
}

function parameterBoard(member){
  const board = member.board || {};
  return Object.fromEntries(PARAMETER_KEYS.map(key => [
    key,
    parameterNumber(board[key] ?? member[`board${key[0].toUpperCase()}${key.slice(1)}`])
  ]));
}

function parameterRateMap(rates = {}){
  return Object.fromEntries(PARAMETER_KEYS.map(key => [key, parameterNumber(rates[key])]));
}

function calculateMemory(base, memoryRate){
  const rate = parameterNumber(memoryRate);
  const values = Object.fromEntries(PARAMETER_KEYS.map(key => [key, Math.ceil(parameterNumber(base[key]) * rate)]));
  return { ...values, total: PARAMETER_KEYS.reduce((sum, key) => sum + values[key], 0) };
}

// 衣装倍率は未解釈のスキル文ではなく、Parameterごとの確定済み倍率（小数）を受け取る。
function calculateOutfitEffects(base, outfitRates = {}){
  const rates = parameterRateMap(outfitRates);
  const values = Object.fromEntries(PARAMETER_KEYS.map(key => [key, Math.ceil(parameterNumber(base[key]) * rates[key])]));
  return { ...values, total: PARAMETER_KEYS.reduce((sum, key) => sum + values[key], 0), rates };
}

function parameterConditionMatches(condition, member){
  if(!condition || condition.kind === 'none') return true;
  if(condition.kind === 'type') return member.type === condition.value;
  if(condition.kind === 'affiliation') return (member.affiliations || []).includes(condition.value);
  return null;
}

function resolvePassiveTargets(source, effect, members){
  const condition = effect.condition || { kind: 'none' };
  const conditionMatches = members.map(member => parameterConditionMatches(condition, member));
  const conditionCount = Number(effect.conditionCount);
  const validConditionCount = Number.isInteger(conditionCount) && conditionCount >= 0;
  const activated = condition.kind === 'none' ? true
    : !validConditionCount || conditionMatches.includes(null)
    ? null
    : conditionMatches.filter(Boolean).length >= conditionCount;
  const targetCount = Number(effect.targetCount);
  const validTargetCount = Number.isInteger(targetCount) && targetCount >= 0;
  let candidates = [];
  let targetStatus = 'resolved';
  let target = effect.target || { kind: 'none' };
  // Temporary Card v2 compatibility: this verified legacy Noel Passive is self-targeted.
  // Remove this narrow rule after Card v2 data is normalized to target.kind="self".
  if(effect.type === 'all_parameters_up' && target.kind === 'text' &&
     target.value === '' && targetCount === 1){
    target = { kind: 'self' };
  }
  if(!validTargetCount){
    targetStatus = 'unresolved-target-count';
  }else if(target.kind === 'self'){
    candidates = [source];
  }else if(target.kind === 'type'){
    candidates = members.filter(member => member.type === target.value);
  }else if(target.kind === 'affiliation'){
    candidates = members.filter(member => (member.affiliations || []).includes(target.value));
  }else{
    targetStatus = 'unresolved-target';
  }
  const ranked = [...candidates].sort((a, b) => b.baseTotal - a.baseTotal || a.formationIndex - b.formationIndex);
  const targets = targetStatus === 'resolved' ? ranked.slice(0, targetCount) : [];
  const status = activated === false ? 'inactive'
    : activated === null ? 'unresolved-condition'
    : targetStatus;
  return {
    activated, conditionCount, targetCount, candidateSlots: ranked.map(member => member.slot),
    targetSlots: targets.map(member => member.slot), status, targets
  };
}

function calculatePassiveEffects(members){
  const prepared = members.map((member, index) => ({
    ...member,
    formationIndex: index,
    baseTotal: PARAMETER_KEYS.reduce((sum, key) => sum + member.base[key], 0),
    passiveRates: Object.fromEntries(PARAMETER_KEYS.map(key => [key, 0]))
  }));
  const passiveResults = [];
  for(const source of prepared){
    const effect = getPassiveEffect(source.card);
    const affectedKeys = PARAMETER_PASSIVE_TYPES[effect.type];
    if(!affectedKeys || parameterNumber(effect.value) === 0) continue;
    const resolution = resolvePassiveTargets(source, effect, prepared);
    const { targets, ...reportedResolution } = resolution;
    passiveResults.push({
      sourceSlot: source.slot, sourceCardId: source.libraryCardId || source.card?.id || null,
      type: effect.type, value: parameterNumber(effect.value), ...reportedResolution
    });
    if(resolution.activated !== true || resolution.status !== 'resolved') continue;
    const ratePercent = parameterNumber(effect.value);
    targets.forEach(target => affectedKeys.forEach(key => { target.passiveRates[key] += ratePercent; }));
  }
  const results = prepared.map(member => {
    const values = Object.fromEntries(PARAMETER_KEYS.map(key => [
      key, Math.ceil(member.base[key] * member.passiveRates[key] / 100)
    ]));
    return {
      ...member,
      passive: { ...values, total: PARAMETER_KEYS.reduce((sum, key) => sum + values[key], 0), rates: { ...member.passiveRates } }
    };
  });
  return { members: results, passiveResults };
}

function calculateEnhancementBonus(enhancementBase, enhancementRate = UNIT_ENHANCEMENT_RATE){
  return Math.ceil(parameterNumber(enhancementBase) * parameterNumber(enhancementRate));
}

// members: {slot, libraryCardId, baseStats, board?, outfitRates?, type?, affiliations?}
// baseStats is required calculation input and is never read from Card v2 stats.
// cards: Card v2 library is consulted for skills/type only; memoryRate is the final decimal rate.
function calculateUnitParameterBreakdown(members, {
  cards = [], memoryRate = 0, enhancementRate = UNIT_ENHANCEMENT_RATE
} = {}){
  const cardsById = new Map(cards.map(card => [card.id, card]));
  const prepared = members.map((member, index) => {
    const card = member.card || cardsById.get(member.libraryCardId) || null;
    const base = parameterStats(member);
    return {
      ...member, slot: member.slot ?? index + 1, card,
      type: member.type ?? card?.type ?? '',
      base,
      board: parameterBoard(member),
      outfitRates: parameterRateMap(member.outfitRates)
    };
  });
  const passive = calculatePassiveEffects(prepared);
  const memberResults = passive.members.map(member => {
    const memory = calculateMemory(member.base, memoryRate);
    const outfit = calculateOutfitEffects(member.base, member.outfitRates);
    const boardTotal = PARAMETER_KEYS.reduce((sum, key) => sum + member.board[key], 0);
    const enhancementBase = member.baseTotal + boardTotal + member.passive.total + outfit.total;
    const enhancement = calculateEnhancementBonus(enhancementBase, enhancementRate);
    const total = member.baseTotal + boardTotal + member.passive.total + memory.total + outfit.total + enhancement;
    return {
      slot: member.slot,
      base: { ...member.base, total: member.baseTotal },
      board: { ...member.board, total: boardTotal },
      passive: member.passive,
      memory,
      outfit,
      enhancement,
      total
    };
  });
  const sumMember = key => memberResults.reduce((sum, member) => sum + member[key].total, 0);
  const baseParameter = memberResults.reduce((sum, member) => sum + member.base.total, 0);
  const board = sumMember('board');
  const passiveTotal = sumMember('passive');
  const memory = sumMember('memory');
  const outfit = sumMember('outfit');
  const enhancement = memberResults.reduce((sum, member) => sum + member.enhancement, 0);
  return {
    baseParameter, board, passive: passiveTotal, memory, outfit, enhancement,
    total: baseParameter + board + passiveTotal + memory + outfit + enhancement,
    members: memberResults,
    passiveResults: passive.passiveResults
  };
}
