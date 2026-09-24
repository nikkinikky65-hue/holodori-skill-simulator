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
