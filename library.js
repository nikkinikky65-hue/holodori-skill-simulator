// ========================================
// メンバーカードライブラリ
// ========================================

const MEMBER_CARD_STORAGE_KEY =
  'holodori-member-card-library-v2';


// ========================================
// 共通
// ========================================

function createId(prefix){

  return (
    prefix +
    '-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}


function loadMemberCards(){

  const saved =
    localStorage.getItem(
      MEMBER_CARD_STORAGE_KEY
    );

  if(!saved){
    return [];
  }

  try{

    const library =
      JSON.parse(saved);

    if(
      !library ||
      library.version !== 2 ||
      !Array.isArray(library.cards)
    ){
      return [];
    }

    return library.cards;

  }catch(error){

    console.warn(
      'メンバーカードライブラリを読み込めませんでした',
      error
    );

    return [];
  }
}

function saveMemberCards(){

  const library = {
    version: 2,
    cards: memberCards
  };

  localStorage.setItem(
    MEMBER_CARD_STORAGE_KEY,
    JSON.stringify(library)
  );
}


// ========================================
// データ
// ========================================

let memberCards =
  loadMemberCards();


// ========================================
// DOM
// ========================================

const memberCardForm =
  document.querySelector('#memberCardForm');

const memberCardIdInput =
  document.querySelector('#memberCardId');


// ========================================
// 基本情報
// ========================================

const cardTalent =
  document.querySelector('#cardTalent');

const cardName =
  document.querySelector('#cardName');

const cardType =
  document.querySelector('#cardType');

const cardRarity =
  document.querySelector('#cardRarity');


// ========================================
// 育成状態
// ========================================

const cardLevel =
  document.querySelector('#cardLevel');

const cardTraining =
  document.querySelector('#cardTraining');

const cardBloom =
  document.querySelector('#cardBloom');

function updateCardLevel(){

  const rarity =
    Number(cardRarity.value);

  const limitBreak =
    Number(cardTraining.value);

  const baseLevel = {
    5: 40,
    4: 30,
    3: 20
  };

  cardLevel.value =
    (baseLevel[rarity] ?? 0)
    + limitBreak * 10;
}

cardRarity.addEventListener(
  'change',
  updateCardLevel
);

cardTraining.addEventListener(
  'input',
  () => {
    updateCardLevel();
    applyStatPreset();
  }
);

// ========================================
// ステータス
// ========================================

const cardTotal =
  document.querySelector('#cardTotal');

const cardPerformance =
  document.querySelector('#cardPerformance');

const cardTechnique =
  document.querySelector('#cardTechnique');

const cardSense =
  document.querySelector('#cardSense');


// ========================================
// スペシャルスキル
// ========================================

const specialSkillDescription =
  document.querySelector('#specialSkillDescription');


// ========================================
// アクティブスキル
// ========================================


const activeSkillInterval =
  document.querySelector('#activeSkillInterval');

const activeSkillProb =
  document.querySelector('#activeSkillProb');

const activeSkillDuration =
  document.querySelector('#activeSkillDuration');

const activeSkillBoost =
  document.querySelector('#activeSkillBoost');

const activeSkillDescription =
  document.querySelector('#activeSkillDescription');


// ========================================
// パッシブスキル
// ========================================

const passiveSkillDescription =
  document.querySelector('#passiveSkillDescription');


// ========================================
// 衣装スキル
// ========================================

const outfitSkillName =
  document.querySelector('#outfitSkillName');

const outfitSkillDescription =
  document.querySelector('#outfitSkillDescription');


// ========================================
// 操作・一覧
// ========================================

const memberCardCancel =
  document.querySelector('#memberCardCancel');

const memberCardList =
  document.querySelector('#memberCardList');

const memberCardCount =
  document.querySelector('#memberCardCount');

// ========================================
// タレント選択肢
// ========================================

function renderTalentSelect(){

  cardTalent.innerHTML =
    '<option value="">選択してください</option>';

  HOLO_MEMBERS.forEach(member => {

    const option =
      document.createElement('option');

    option.value =
      member.id;

    option.textContent =
      member.name;

    cardTalent.append(option);
  });
}


function getTalentName(talentId){

  const talent =
    HOLO_MEMBERS.find(
      member =>
        member.id === talentId
    );

  return talent
    ? talent.name
    : '不明なタレント';
}

// ========================================
// 仮ステータス自動入力
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


function updateTotalFromStats(){

  cardTotal.value =
    Number(cardPerformance.value || 0) +
    Number(cardTechnique.value || 0) +
    Number(cardSense.value || 0);
}


function applyStatPreset(){

  const rarity =
    Number(cardRarity.value);

  const level =
    Number(cardLevel.value);

  const bloom =
    Number(cardBloom.value);

  let total = null;

  if(rarity === 3){

    total =
      CARD_STAT_PRESETS[3][bloom];

  }else{

    total =
      CARD_STAT_PRESETS[rarity]?.[level];
  }

  if(total == null){
    return;
  }

  const stats =
    splitTotalStats(total);

  cardPerformance.value =
    stats.performance;

  cardTechnique.value =
    stats.technique;

  cardSense.value =
    stats.sense;

  updateTotalFromStats();
}

cardRarity.addEventListener(
  'change',
  applyStatPreset
);

cardLevel.addEventListener(
  'change',
  applyStatPreset
);

cardBloom.addEventListener(
  'change',
  applyStatPreset
);

cardPerformance.addEventListener(
  'input',
  updateTotalFromStats
);

cardTechnique.addEventListener(
  'input',
  updateTotalFromStats
);

cardSense.addEventListener(
  'input',
  updateTotalFromStats
);

// ========================================
// フォーム → カードデータ
// ========================================

function getMemberCardFormData(){

  return {

    talentId:
      cardTalent.value,

    cardName:
      cardName.value.trim(),

    type:
      cardType.value,

    rarity:
      Number(cardRarity.value),

    progression: {

      level:
        Number(cardLevel.value),

      training:
        Number(cardTraining.value),

      bloom:
        Number(cardBloom.value)
    },

    stats: {

      total:
        Number(cardTotal.value),

      performance:
        Number(cardPerformance.value),

      technique:
        Number(cardTechnique.value),

      sense:
        Number(cardSense.value)
    },

    skills: {

      special: {

        description:
          specialSkillDescription.value.trim()
      },

      active: {

        interval:
          Number(activeSkillInterval.value),

        probability:
          activeSkillProb.value,

        duration:
          Number(activeSkillDuration.value),

        boost:
          Number(activeSkillBoost.value),

        description:
          activeSkillDescription.value.trim()
      },

      passive: {

        description:
          passiveSkillDescription.value.trim()
      }
    },

    outfitSkill: {

      name:
        outfitSkillName.value.trim(),

      description:
        outfitSkillDescription.value.trim()
    },

    extensions: {}
  };
}

// ========================================
// 保存
// ========================================

memberCardForm.addEventListener(
  'submit',
  event => {

    event.preventDefault();

    const data =
      getMemberCardFormData();

    if(
      !data.talentId ||
      !data.cardName
    ){
      return;
    }

    const editingId =
      memberCardIdInput.value;

    if(editingId){

      const card =
        memberCards.find(
          card =>
            card.id === editingId
        );

      if(card){
        Object.assign(
          card,
          data
        );
      }

    }else{

      memberCards.push({
        id: createId('card'),
        ...data
      });
    }

    saveMemberCards();

    resetMemberCardForm();

    renderMemberCards();
  }
);

// ========================================
// カード一覧
// ========================================

function renderMemberCards(){

  memberCardList.innerHTML = '';

  memberCardCount.textContent =
    `${memberCards.length}枚登録`;


  if(memberCards.length === 0){

    memberCardList.innerHTML =
      '<div class="libraryEmpty">' +
      'メンバーカード未登録' +
      '</div>';

    return;
  }


  const sorted =
    [...memberCards].sort(
      (a, b) => {

        const talentCompare =
          getTalentName(a.talentId)
            .localeCompare(
              getTalentName(b.talentId),
              'ja'
            );

        if(talentCompare !== 0){
          return talentCompare;
        }

        return a.cardName.localeCompare(
          b.cardName,
          'ja'
        );
      }
    );


  sorted.forEach(card => {

    const row =
      document.createElement('div');

    row.className =
      'libraryCardItem';


    // ----------------------------
    // 情報
    // ----------------------------

    const info =
      document.createElement('div');

    info.className =
      'libraryCardInfo';


    const title =
      document.createElement('strong');

    title.textContent =
      `${getTalentName(card.talentId)} / ` +
      `${card.cardName}`;


    const detail =
      document.createElement('div');

    detail.className =
      'sub';


    const probability =
      card.skills.active.probability === 'low'
        ? '低'
        : card.skills.active.probability === 'high'
          ? '高'
          : '中';


    detail.textContent =
      `★${card.rarity} / ` +
      `${card.type} / ` +
      `Lv.${card.progression.level} / ` +
      `${card.skills.active.interval}s周期 / ` +
      `確率 ${probability} / ` +
      `発動 ${card.skills.active.duration}s / ` +
      `+${card.skills.active.boost}%`;


    info.append(
      title,
      detail
    );


    // ----------------------------
    // ボタン
    // ----------------------------

    const buttons =
      document.createElement('div');

    buttons.className =
      'libraryItemButtons';


    const edit =
      document.createElement('button');

    edit.type =
      'button';

    edit.textContent =
      '編集';

      edit.addEventListener(
      'click',
      () => {

        memberCardIdInput.value =
          card.id;

        // 基本情報
        cardTalent.value =
          card.talentId;

        cardName.value =
          card.cardName;

        cardType.value =
          card.type;

        cardRarity.value =
          card.rarity;


        // 育成状態
        cardLevel.value =
          card.progression.level;

        cardTraining.value =
          card.progression.training;

        cardBloom.value =
          card.progression.bloom;


        // ステータス
        cardTotal.value =
          card.stats.total;

        cardPerformance.value =
          card.stats.performance;

        cardTechnique.value =
          card.stats.technique;

        cardSense.value =
          card.stats.sense;


        // スペシャルスキル
        specialSkillName.value =
          card.skills.special.name;

        specialSkillDescription.value =
          card.skills.special.description;


        // アクティブスキル
        activeSkillName.value =
          card.skills.active.name;

        activeSkillInterval.value =
          card.skills.active.interval;

        activeSkillProb.value =
          card.skills.active.probability;

        activeSkillDuration.value =
          card.skills.active.duration;

        activeSkillBoost.value =
          card.skills.active.boost;

        activeSkillDescription.value =
          card.skills.active.description;


        // パッシブスキル
        passiveSkillName.value =
          card.skills.passive.name;

        passiveSkillDescription.value =
          card.skills.passive.description;


        // 衣装スキル
        outfitSkillName.value =
          card.outfitSkill.name;

        outfitSkillDescription.value =
          card.outfitSkill.description;


        cardName.focus();

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    );

      
    const del =
      document.createElement('button');

    del.type =
      'button';

    del.textContent =
      '削除';
      del.addEventListener(
  'click',
  () => {

    const talentName =
      getTalentName(card.talentId);

    if(
      !confirm(
        `${talentName} / ` +
        `${card.cardName} を削除しますか？`
      )
    ){
      return;
    }

    memberCards =
      memberCards.filter(
        item =>
          item.id !== card.id
      );

    saveMemberCards();

    resetMemberCardForm();

    renderMemberCards();
  }
);


    buttons.append(
      edit,
      del
    );


    row.append(
      info,
      buttons
    );


    memberCardList.append(row);
  });
}

// ========================================
// フォームリセット
// ========================================

function resetMemberCardForm(){

  memberCardForm.reset();

  memberCardIdInput.value =
    '';

  activeSkillProb.value =
    'mid';
}

// ========================================
// キャンセル
// ========================================

memberCardCancel.addEventListener(
  'click',
  resetMemberCardForm
);

// ========================================
// 初期表示
// ========================================

renderTalentSelect();
updateCardLevel();
applyStatPreset();
renderMemberCards();