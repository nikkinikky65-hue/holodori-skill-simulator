// ========================================
// カード共通仕様
// ========================================

const CARD_STAT_PRESETS = {

  3: {
    0: 10000,
    1: 12000,
    2: 16000,
    3: 18000,
    4: 20000
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


function getCardPresetStats(
  rarity,
  level,
  bloom
){

  rarity = Number(rarity);
  level = Number(level);
  bloom = Number(bloom);

  let total = null;

  if(rarity === 3){

    total =
      CARD_STAT_PRESETS[3]?.[bloom];

  }else{

    total =
      CARD_STAT_PRESETS[rarity]?.[level];
  }

  if(total == null){
    return null;
  }

  const stats =
    splitTotalStats(total);

  return {
    total,
    ...stats
  };
}