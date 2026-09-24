// ========================================
// メンバーカードライブラリ
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


function loadMemberCards(){ return readCardLibrary(); }
function saveMemberCards(){
  try{
    writeCardLibrary(memberCards);
    return true;
  }catch(error){
    alert('カードを保存できませんでした。' + error.message);
    memberCards = loadMemberCards();
    renderMemberCards();
    return false;
  }
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

function formDerived(){
  return getCardDerived(Number(cardRarity.value), Number(cardTraining.value), Number(cardBloom.value));
}

function updateCardLevel(){
  cardLevel.value = formDerived().progression.level;
}

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

// ステータス強化
const passiveSkillDescription1 =
  document.querySelector(
    '#passiveSkillDescription1'
  );

// スコアサポート強化
const scoreSupportConditionType =
  document.querySelector(
    '#scoreSupportConditionType'
  );

const scoreSupportConditionCount =
  document.querySelector(
    '#scoreSupportConditionCount'
  );

const scoreSupportTargetType =
  document.querySelector(
    '#scoreSupportTargetType'
  );

const scoreSupportTargetCount =
  document.querySelector(
    '#scoreSupportTargetCount'
  );

const scoreSupportBoost =
  document.querySelector(
    '#scoreSupportBoost'
  );

const passiveSkillDescription2 =
  document.querySelector(
    '#passiveSkillDescription2'
  );

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

function updateTotalFromStats(){

  cardTotal.value =
    Number(cardPerformance.value || 0) +
    Number(cardTechnique.value || 0) +
    Number(cardSense.value || 0);
}


function applyStatPreset(){

  const stats = formDerived().stats;
  document.querySelector('#statPresetNote').textContent = stats
    ? 'プリセットは仮ステータスです。各能力値は手動で修正できます。'
    : '対応する概算値がありません。既存の能力値を保持します。';

  if(!stats){
    return;
  }

  cardPerformance.value =
    stats.performance;

  cardTechnique.value =
    stats.technique;

  cardSense.value =
    stats.sense;

  updateTotalFromStats();
}

cardRarity.addEventListener('change', () => {
  updateCardLevel();
  // 対応する概算値がない場合、別レアリティの仮値を流用しない。
  if(!memberCardIdInput.value && !formDerived().stats){
    [cardTotal, cardPerformance, cardTechnique, cardSense].forEach(input => input.value = '');
  }
  applyStatPreset();
});
cardTraining.addEventListener('input', () => {
  updateCardLevel();
  applyStatPreset();
});
// 開花のステータス効果は未確定。変更時に能力値を上書きしない。

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

  const existing = memberCards.find(card => card.id === memberCardIdInput.value);
  const nullableNumber = input => input.value === '' ? null : Number(input.value);
  return createCardV2({

    talentId:
      cardTalent.value,

    cardName:
      cardName.value.trim(),

    type:
      cardType.value,

    rarity:
      Number(cardRarity.value),

    progression: formDerived().progression,

    stats: {

      total:
        nullableNumber(cardTotal),

      performance:
        nullableNumber(cardPerformance),

      technique:
        nullableNumber(cardTechnique),

      sense:
        nullableNumber(cardSense)
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
        status: {
          description:
            passiveSkillDescription1.value.trim()
        },

        scoreSupport: {
          conditionType:
            scoreSupportConditionType.value,

          conditionCount:
            Number(scoreSupportConditionCount.value) || 0,

          targetType:
            scoreSupportTargetType.value,

          targetCount:
            Number(scoreSupportTargetCount.value) || 0,

          boost:
            Number(scoreSupportBoost.value) || 0,

          description:
            passiveSkillDescription2.value.trim()
        }
      }
    },

    outfitSkill: {

      name:
        outfitSkillName.value.trim(),

      description:
        outfitSkillDescription.value.trim()
    },

  }, existing);
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
        ...data,
        id: createId('card')
      });
    }

    if(!saveMemberCards()) return;

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


        updateCardLevel();

        // ステータス
        cardTotal.value =
          card.stats.total ?? '';

        cardPerformance.value =
          card.stats.performance ?? '';

        cardTechnique.value =
          card.stats.technique ?? '';

        cardSense.value =
          card.stats.sense ?? '';

        // スペシャルスキル
        specialSkillDescription.value =
          card.skills.special.description;


        // アクティブスキル
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
        passiveSkillDescription1.value =
          card.skills.passive.status.description;

        scoreSupportConditionType.value =
          card.skills.passive.scoreSupport.conditionType;

        scoreSupportConditionCount.value =
          card.skills.passive.scoreSupport.conditionCount;

        scoreSupportTargetType.value =
          card.skills.passive.scoreSupport.targetType;

        scoreSupportTargetCount.value =
          card.skills.passive.scoreSupport.targetCount;

        scoreSupportBoost.value =
          card.skills.passive.scoreSupport.boost;

        passiveSkillDescription2.value =
          card.skills.passive.scoreSupport.description;

        // 衣装スキル
        outfitSkillName.value =
          card.outfitSkill.name;

        outfitSkillDescription.value =
          card.outfitSkill.description;


        document.querySelector('#statPresetNote').textContent = '保存済みの能力値を表示しています。開花を変更しても能力値は上書きしません。';
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

    if(!saveMemberCards()) return;

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
  updateCardLevel();
  applyStatPreset();
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