// ========================================
// カード共通仕様
// ========================================

const CARD_STAT_PRESETS = {

  3: {
    20: 10000,
    30: 12000,
    40: 16000,
    50: 18000,
    60: 20000
  },

  4: {
    30: 14000,
    40: 16000,
    50: 19000,
    60: 21000,
    70: 25000
  },

  5: {
    40: 18000,
    50: 19000,
    60: 22000,
    70: 24500,
    80: 32000
  }
};


function getCardLevel(rarity, training){

  rarity = Number(rarity);
  training = Number(training);

  const baseLevel = {
    5: 40,
    4: 30,
    3: 20
  };

  return (
    (baseLevel[rarity] ?? 0) +
    training * 10
  );
}


function splitTotalStats(total){

  const base =
    Math.floor(total / 300) * 100;

  const remainder =
    total - base * 3;

  return {
    performance:
      base + Math.min(remainder, 100),

    technique:
      base + Math.max(
        Math.min(remainder - 100, 100),
        0
      ),

    sense:
      base
  };
}


// 全レアリティ共通で、レベルに対応する基礎ステータス概算値を参照する。
// 開花による能力変化も未確定のため、bloomは独立した保存項目とする。
function getCardPresetStats(rarity, level){
  const total = CARD_STAT_PRESETS[Number(rarity)]?.[Number(level)];
  return total == null ? null : { total, ...splitTotalStats(total) };
}

function getCardDerived(rarity, training, bloom = 0){
  const level = getCardLevel(rarity, training);
  return {
    progression: { level, training: Number(training), bloom: Number(bloom) },
    stats: getCardPresetStats(rarity, level)
  };
}

// 未知のフィールドも保持する。既存カードの読み込み時に能力値を再計算しない。
function mergeCardFields(base, patch){
  const result = { ...base };
  for(const [key, value] of Object.entries(patch || {})){
    if(value && typeof value === 'object' && !Array.isArray(value)){
      result[key] = mergeCardFields(base?.[key] || {}, value);
    }else{
      result[key] = value;
    }
  }
  return result;
}

function normalizeCardV2(card){
  const defaults = {
    id: '', talentId: '', cardName: '', type: '', rarity: 5,
    progression: { level: null, training: 0, bloom: 0 },
    stats: { total: null, performance: null, technique: null, sense: null },
    skills: {
      special: { description: '' },
      active: { interval: 0, probability: 'mid', duration: 0, boost: 0, description: '' },
      passive: {
        status: { description: '' },
        scoreSupport: {
          conditionType: '', conditionCount: 0, targetType: '', targetCount: 0,
          boost: 0, description: ''
        }
      }
    },
    outfitSkill: { name: '', description: '' }, extensions: {}
  };
  // nullのネストに対しても、UIが必要とする構造を補完する。
  function fill(template, value){
    const result = { ...(value && typeof value === 'object' ? value : {}) };
    for(const [key, fallback] of Object.entries(template)){
      result[key] = fallback && typeof fallback === 'object'
        ? fill(fallback, result[key])
        : result[key] ?? fallback;
    }
    return result;
  }
  return fill(defaults, card);
}

function createCardV2(data, existing = {}){
  const card = normalizeCardV2(mergeCardFields(existing, data));
  card.cardName = String(data.cardName ?? '').trim() || existing.cardName || '未分類';
  const derived = getCardDerived(card.rarity, card.progression.training, card.progression.bloom);
  card.progression = { ...card.progression, ...derived.progression };
  if(!data.stats && !existing.stats && derived.stats) card.stats = derived.stats;
  return card;
}

const MEMBER_CARD_STORAGE_KEY = 'holodori-member-card-library-v2';

function parseCardLibrary(saved){
  if(!saved) return { version: 2, cards: [] };
  const library = JSON.parse(saved);
  if(!library || library.version !== 2 || !Array.isArray(library.cards) ||
     library.cards.some(card => !card || typeof card !== 'object' || Array.isArray(card))){
    throw new Error('Card v2ライブラリの形式が不正です。保存データは変更していません。');
  }
  return library;
}

function readCardLibrary(){
  try{
    return parseCardLibrary(localStorage.getItem(MEMBER_CARD_STORAGE_KEY)).cards.map(normalizeCardV2);
  }catch(error){
    console.warn('カードライブラリを読み込めませんでした。元データは保持しています。', error);
    return [];
  }
}

function writeCardLibrary(cards){
  // 読み込みに失敗した既存データを空のライブラリで上書きしない。
  const library = parseCardLibrary(localStorage.getItem(MEMBER_CARD_STORAGE_KEY));
  localStorage.setItem(MEMBER_CARD_STORAGE_KEY, JSON.stringify({ ...library, cards }));
}

// ゲーム表記の効果種別。SP/Pのscore_supportは同じ率（%）で、発生源は親の分類で区別する。
const SKILL_EFFECT_TYPES = {
  special: [
    ['score_support', 'スコアサポート'], ['life_recovery', 'ライフ回復'],
    ['skill_activation_rate_up', 'スキル発動率UP'], ['judgement_enhancement', '判定強化']
  ],
  active: [['score_up', 'スコアUP']],
  passive: [
    ['performance_up', 'パフォーマンスUP'], ['technique_up', 'テクニックUP'],
    ['sense_up', 'センスUP'], ['all_parameters_up', '全パラメーターUP'],
    ['score_support', 'スコアサポート']
  ]
};

function getPassiveEffect(card){
  const passive = card?.skills?.passive || {};
  const defaults = {
    type: '', condition: { kind: 'none', value: '' }, conditionCount: 0,
    target: { kind: 'none', value: '' }, targetCount: 0, value: 0, description: ''
  };
  if(passive.effect && typeof passive.effect === 'object'){
    return mergeCardFields(defaults, passive.effect);
  }
  const legacy = passive.scoreSupport;
  if(!legacy) return defaults;
  const hasEffect = Boolean(legacy.boost || legacy.description || legacy.conditionType || legacy.targetType || legacy.conditionCount || legacy.targetCount);
  return {
    ...defaults, type: hasEffect ? 'score_support' : '',
    condition: { kind: legacy.conditionType ? 'type' : 'none', value: legacy.conditionType || '' },
    conditionCount: legacy.conditionCount ?? 0,
    target: { kind: legacy.targetType ? 'type' : 'none', value: legacy.targetType || '' },
    targetCount: legacy.targetCount ?? 0,
    value: legacy.boost ?? 0, description: legacy.description || ''
  };
}

// 計算側の既存インターフェースへのアダプター。新effectが存在すれば旧scoreSupportより優先。
function getPassiveScoreSupport(card){
  if(!card?.skills?.passive?.effect) return card?.skills?.passive?.scoreSupport || null;
  const effect = getPassiveEffect(card);
  if(effect.type !== 'score_support') return null;
  const supported = condition => condition && ['none', 'type'].includes(condition.kind);
  return {
    conditionType: effect.condition?.kind === 'type' ? effect.condition.value : '',
    conditionCount: effect.conditionCount,
    targetType: effect.target?.kind === 'type' ? effect.target.value : '',
    targetCount: effect.targetCount, boost: effect.value, description: effect.description,
    unresolvedCondition: !supported(effect.condition), unresolvedTarget: !supported(effect.target)
  };
}

function skillConditionKey(condition){
  return !condition || condition.kind === 'none' ? '' : `${condition.kind}:${condition.value}`;
}

function skillConditionFromKey(key, text = ''){
  if(!key) return { kind: 'none', value: '' };
  if(key === 'text') return { kind: 'text', value: text.trim() };
  const separator = key.indexOf(':');
  return { kind: key.slice(0, separator), value: key.slice(separator + 1) };
}
