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

const talentPortraitBackdrop =
  document.querySelector('#talentPortraitBackdrop');


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

const passiveEffectType = document.querySelector('#passiveEffectType');
const passiveCondition = document.querySelector('#passiveCondition');
const passiveConditionText = document.querySelector('#passiveConditionText');
const passiveConditionCount = document.querySelector('#passiveConditionCount');
const passiveTarget = document.querySelector('#passiveTarget');
const passiveTargetText = document.querySelector('#passiveTargetText');
const passiveTargetCount = document.querySelector('#passiveTargetCount');
const passiveValue = document.querySelector('#passiveValue');
const passiveDescription = document.querySelector('#passiveDescription');
const specialEffectTypes = document.querySelector('#specialEffectTypes');
const specialSkillDuration = document.querySelector('#specialSkillDuration');
const specialSkillBoost = document.querySelector('#specialSkillBoost');
const activeEffectType = document.querySelector('#activeEffectType');
const specialEffectsEditor = document.querySelector('#specialEffectsEditor');
const addSpecialEffect = document.querySelector('#addSpecialEffect');
const specialEffectAddType = document.querySelector('#specialEffectAddType');
let legacySpecialEffects = null;

function populateSkillOptions(){
  for(const [select, category] of [[specialEffectTypes,'special'],[activeEffectType,'active'],[passiveEffectType,'passive']]){
    if(category === 'passive') select.add(new Option('未設定', ''));
    SKILL_EFFECT_TYPES[category].forEach(([value,label]) => select.add(new Option(label,value)));
  }
  const affiliations = [...new Set(HOLO_MEMBERS.flatMap(member => member.affiliations || []))];
  for(const select of [passiveCondition, passiveTarget]){
    select.add(new Option(select === passiveCondition ? '条件なし' : '未設定', ''));
    for(const [value,label] of [['cute','キュート'],['pure','ピュア'],['happy','ハッピー']]){
      select.add(new Option(`タイプ：${label}`, `type:${value}`));
    }
    if(select === passiveTarget) select.add(new Option('自身', 'self'));
    affiliations.forEach(value => select.add(new Option(`所属：${value}`, `affiliation:${value}`)));
    select.add(new Option('その他（原文を保存）', 'text'));
  }
}

const specialFixedEffects = document.querySelector('#specialFixedEffects');

const specialEffectLabels = {
  score_support: 'スコアサポート',
  skill_frequency_up: '発動確率',
  skill_activation_rate_up: '発動確率',
  life_recovery: 'ライフ回復',
  judgment_enhancement: '判定強化',
  judgement_enhancement: '判定強化',
  other: 'その他'
};

const specialAddOptions = [
  ['skill_frequency_up', '発動確率'],
  ['life_recovery', 'ライフ回復'],
  ['judgment_enhancement', '判定強化'],
  ['other', 'その他']
];

function specialEffectKey(type){
  if(type === 'skill_activation_rate_up' || type === 'skill_frequency_up') return 'skill_frequency_up';
  if(type === 'judgement_enhancement' || type === 'judgment_enhancement') return 'judgment_enhancement';
  return type;
}

function effectInput(type, field, options = {}){
  const input = document.createElement(options.select ? 'select' : 'input');
  input.dataset.specialEffectField = field;
  if(options.select){
    options.select.forEach(([value, label]) => input.add(new Option(label, value)));
  }else{
    input.type = 'number'; input.min = '0'; input.step = options.step || '0.01';
    input.placeholder = options.placeholder || '';
  }
  return input;
}

function appendUnit(row, text){
  const unit = document.createElement('span');
  unit.className = 'libraryUnit'; unit.textContent = text;
  row.append(unit);
}

function createSpecialEffectRow(effect = {}, removable = true){
  const row = document.createElement('div');
  row.className = 'librarySkillRow specialFixedEffectRow';
  row.specialEffect = effect;
  row.dataset.specialFixedType = effect.type || 'score_support';
  const type = row.dataset.specialFixedType;
  const label = document.createElement('span');
  label.className = 'libraryLabel'; label.textContent = specialEffectLabels[type] || `保存済み：${type}`;
  row.append(label);
  if(type === 'score_support'){
    const duration = effectInput(type, 'duration', {placeholder: '時間'});
    const value = effectInput(type, 'value', {placeholder: '値'});
    row.append(duration); appendUnit(row, '秒'); row.append(value); appendUnit(row, '%');
  }else if(type === 'skill_frequency_up' || type === 'skill_activation_rate_up'){
    const value = effectInput(type, 'value', {placeholder: '値'});
    row.append(value); appendUnit(row, '%');
  }else if(type === 'life_recovery'){
    const value = effectInput(type, 'value', {step: '1', placeholder: '値'});
    row.append(value); appendUnit(row, '回復');
  }else if(type === 'judgment_enhancement' || type === 'judgement_enhancement'){
    const from = effectInput(type, 'from', {select: [['good', 'GOOD']]});
    const to = effectInput(type, 'to', {select: [['perfect', 'Perfect']]});
    row.append(from); appendUnit(row, '以上を'); row.append(to); appendUnit(row, 'に');
  }else{
    const value = effectInput(type, 'value', {placeholder: '値'});
    row.append(value);
  }
  row.querySelectorAll('[data-special-effect-field]').forEach(input => {
    if(effect[input.dataset.specialEffectField] != null) input.value = effect[input.dataset.specialEffectField];
  });
  if(removable){
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = '削除';
    remove.addEventListener('click', () => { row.remove(); refreshSpecialAddOptions(); });
    row.append(remove);
  }
  specialFixedEffects.append(row);
  return row;
}

function readFixedSpecialEffects(){
  const seen = new Set();
  return [...specialFixedEffects.querySelectorAll('.specialFixedEffectRow')].map(row => {
    const stored = row.specialEffect || {};
    const fields = Object.fromEntries([...row.querySelectorAll('[data-special-effect-field]')]
      .map(input => [input.dataset.specialEffectField, input]));
    const effect = { ...stored, type: stored.type || row.dataset.specialFixedType };
    Object.entries(fields).forEach(([field, input]) => {
      if(input.value === '') delete effect[field];
      else effect[field] = input.tagName === 'INPUT' ? Number(input.value) : input.value;
    });
    if(seen.has(effect.type)) return null;
    seen.add(effect.type);
    return Object.keys(effect).some(key => key !== 'type') ? effect : null;
  }).filter(Boolean);
}

function readSpecialEffects(){
  return [...specialEffectsEditor.querySelectorAll('.specialEffectRow')].map(row => {
    const fields = Object.fromEntries([...row.querySelectorAll('[data-special-effect-field]')]
      .map(input => [input.dataset.specialEffectField, input]));
    const effect = { ...row.specialEffect, type: fields.type.value };
    if(fields.value.value !== '') effect.value = Number(fields.value.value);
    if(fields.duration?.value !== '') effect.duration = Number(fields.duration.value);
    return effect;
  }).filter(effect => effect.type);
}

function createUnknownSpecialEffectRow(effect = {}){
  const row = document.createElement('div');
  row.className = 'librarySkillRow specialEffectRow';
  row.specialEffect = effect;
  const type = document.createElement('select');
  type.dataset.specialEffectField = 'type';
  SKILL_EFFECT_TYPES.special.forEach(([value, label]) => type.add(new Option(label, value)));
  selectStoredOption(type, effect.type || 'other');
  const value = effectInput('other', 'value', {placeholder: '値'});
  const duration = effectInput('other', 'duration', {placeholder: '時間'});
  row.append(type, value); appendUnit(row, '値'); row.append(duration); appendUnit(row, '秒');
  row.querySelectorAll('[data-special-effect-field]').forEach(input => {
    if(effect[input.dataset.specialEffectField] != null) input.value = effect[input.dataset.specialEffectField];
  });
  const remove = document.createElement('button');
  remove.type = 'button'; remove.textContent = '削除';
  remove.addEventListener('click', () => row.remove());
  row.append(remove);
  specialEffectsEditor.append(row);
}

function setFixedSpecialEffects(effects){
  specialFixedEffects.innerHTML = '';
  specialEffectsEditor.innerHTML = '';
  specialEffectsEditor.hidden = true;
  const known = new Set();
  const score = (effects || []).find(effect => effect.type === 'score_support');
  const scoreRow = createSpecialEffectRow(score || {type: 'score_support'}, false);
  known.add('score_support');
  (effects || []).forEach(effect => {
    const fixedType = effect.type === 'skill_activation_rate_up'
      ? 'skill_frequency_up'
      : effect.type === 'judgement_enhancement'
        ? 'judgment_enhancement'
        : effect.type;
    if(known.has(fixedType)) return;
    if(['skill_frequency_up', 'life_recovery', 'judgment_enhancement'].includes(fixedType)){
      const row = createSpecialEffectRow({ ...effect, type: fixedType });
      row.specialEffect = effect;
      known.add(fixedType);
    }else{
      specialEffectsEditor.hidden = false;
      createUnknownSpecialEffectRow(effect);
    }
  });
  refreshSpecialAddOptions();
}

function refreshSpecialAddOptions(){
  const used = new Set([...specialFixedEffects.querySelectorAll('.specialFixedEffectRow')]
    .map(row => specialEffectKey(row.specialEffect?.type || row.dataset.specialFixedType)));
  [...specialEffectAddType.options].forEach(option => {
    option.disabled = option.value !== '' && used.has(specialEffectKey(option.value));
  });
}

specialAddOptions.forEach(([value, label]) => specialEffectAddType.add(new Option(label, value)));
specialEffectAddType.addEventListener('change', () => {
  const type = specialEffectAddType.value;
  if(!type) return;
  if(![...specialFixedEffects.querySelectorAll('.specialFixedEffectRow')]
    .some(row => specialEffectKey(row.specialEffect?.type || row.dataset.specialFixedType) === specialEffectKey(type))) createSpecialEffectRow({type});
  specialEffectAddType.value = '';
  refreshSpecialAddOptions();
});

addSpecialEffect.addEventListener('click', () => {
  specialEffectsEditor.hidden = false;
  createSpecialEffectRow({type: 'other'});
});

function selectStoredOption(select, value){
  if(value && ![...select.options].some(option => option.value === value)){
    select.add(new Option(`保存済み：${value}`, value));
  }
  select.value = value;
}

function updateConditionTextVisibility(){
  document.querySelector('#passiveConditionTextLabel').hidden = passiveCondition.value !== 'text';
  document.querySelector('#passiveTargetTextLabel').hidden = passiveTarget.value !== 'text';
  passiveTargetCount.disabled = passiveTarget.value === 'self';
  if(passiveTarget.value === 'self') passiveTargetCount.value = 1;
}
passiveCondition.addEventListener('change', updateConditionTextVisibility);
passiveTarget.addEventListener('change', updateConditionTextVisibility);

// ========================================
// 衣装スキル
// ========================================

const outfitSkillName =
  document.querySelector('#outfitSkillName');

const outfitSkillDescription =
  document.querySelector('#outfitSkillDescription');

const talentPortraitFiles = [
  '0_azki.webp', '0_hoshimachi_suisei.png', '0_robocosan.webp',
  '0_sakura_miko.webp', '0_tokino_sora.webp', '1_akai_haato.webp',
  '1_aki_rosenthal.png', '1_natsuiro_matsuri.png',
  '1_shirakami_fubuki.webp', '2_nakiri_ayame.webp',
  '2_oozora_subaru.webp', '2_yuzuki_choco.webp',
  '3_houshou_marine.png', '3_shiranui_flare.png',
  '3_shirogane_noel.webp', '3_usada_pekora.webp',
  '4_himemori_luna.webp', '4_tokoyami_towa.webp',
  '4_tsunomaki_watame.webp', '5_momosuzu_nene.webp',
  '5_omaru_polka.webp', '5_shishiro_botan.webp',
  '5_yukihana_lamy.webp', '6_hakui_koyori.webp',
  '6_kazama_iroha.png', '6_laplus_darknesss.webp',
  '6_takane_lui.webp', 'Ad_fuwawa_abyssgard.webp',
  'Ad_koseki_bijou.webp', 'Ad_mococo_abyssgard.webp',
  'Ad_nerissa_ravencroft.webp', 'Ad_shiori_novella.webp',
  'Gm_inugami_korone.png', 'Gm_nekomata_okayu.png',
  'Gm_ookami_mio.webp', 'ID1_airani_iofifteen.webp',
  'ID1_ayunda_risu.webp', 'ID1_moona_hoshinova.webp',
  'ID2_anya_melfissa.png', 'ID2_kureiji_ollie.png',
  'ID2_pavolia_reine.png', 'ID3_kaela_kovalskia.webp',
  'ID3_kobo_kanaeru.webp', 'ID3_vestia_zeta.webp',
  'My_mori_calliope.webp', 'My_ninomae_inanis.webp',
  'My_takanashi_kiara.webp', 'Pr_hakos_baelz.png',
  'Pr_irys.webp', 'Pr_ouro_kronii.webp',
  'Rg_ichijou_ririka.webp', 'Rg_juufuutei_raden.webp',
  'Rg_otonose_kanade.png', 'Rg_todoroki_hajime.png'
];
let portraitRequestNumber = 0;

function resolveTalentPortrait(talentId){
  if(!talentId){
    return Promise.resolve('');
  }

  const filename = talentPortraitFiles.find(file =>
    file.replace(/^[^_]+_/, '').replace(/\.[^.]+$/, '') === talentId
  );

  return Promise.resolve(
    filename
      ? `assets/talents/original/${filename}`
      : ''
  );
}

function updateTalentPortrait(){
  const requestNumber = ++portraitRequestNumber;
  const talentId = cardTalent.value;

  talentPortraitBackdrop.style.backgroundImage = '';
  talentPortraitBackdrop.classList.remove('is-visible');

  resolveTalentPortrait(talentId).then(path => {
    if(requestNumber !== portraitRequestNumber || !path){
      return;
    }
    talentPortraitBackdrop.style.backgroundImage = `url("${path}")`;
    talentPortraitBackdrop.classList.add('is-visible');
  });
}

cardTalent.addEventListener('change', updateTalentPortrait);


// ========================================
// 操作・一覧
// ========================================

const memberCardCancel =
  document.querySelector('#memberCardCancel');

const memberCardExport =
  document.querySelector('#memberCardExport');

const memberCardExportStatus =
  document.querySelector('#memberCardExportStatus');

const memberCardList =
  document.querySelector('#memberCardList');

const memberCardCount =
  document.querySelector('#memberCardCount');

function exportMemberCardLibrary(){
  const saved = localStorage.getItem(MEMBER_CARD_STORAGE_KEY);

  if(!saved){
    throw new Error('保存されているCard v2ライブラリがありません。');
  }

  const library = parseCardLibrary(saved);
  const json = JSON.stringify(library, null, 2);
  const blob = new Blob([json], {type: 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'holodori-card-library-v2.json';
  link.click();
  URL.revokeObjectURL(url);
}

memberCardExport.addEventListener('click', () => {
  memberCardExportStatus.textContent = '';

  try{
    exportMemberCardLibrary();
    memberCardExportStatus.textContent = 'JSONを出力しました。';
  }catch(error){
    memberCardExportStatus.textContent = `JSONを出力できませんでした。${error.message}`;
  }
});

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
  const fixedEffects = typeof readFixedSpecialEffects === 'function' ? readFixedSpecialEffects() : [];
  const genericEffects = typeof readSpecialEffects === 'function' ? readSpecialEffects() : [];
  const effects = [];
  const effectTypes = new Set();
  [...fixedEffects, ...genericEffects].forEach(effect => {
    const key = specialEffectKey(effect.type);
    if(effectTypes.has(key)) return;
    effectTypes.add(key);
    effects.push(effect);
  });
  const preserveLegacySpecial = typeof legacySpecialEffects !== 'undefined' && legacySpecialEffects &&
    JSON.stringify(effects) === legacySpecialEffects;
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
        ...(effects.length && !preserveLegacySpecial ? { effects } : {
          effectTypes: [...specialEffectTypes.selectedOptions].map(option => option.value),
          boost: nullableNumber(specialSkillBoost),
          duration: nullableNumber(specialSkillDuration)
        }),
        description:
          specialSkillDescription.value.trim()
      },

      active: {
        effectType: activeEffectType.value,
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

        effect: {
          type: passiveEffectType.value,
          condition: skillConditionFromKey(passiveCondition.value, passiveConditionText.value),
          conditionCount: Number(passiveConditionCount.value) || 0,
          target: skillConditionFromKey(passiveTarget.value, passiveTargetText.value),
          targetCount: passiveTarget.value === 'self' ? 1 : Number(passiveTargetCount.value) || 0,
          value: Number(passiveValue.value) || 0,
          description: passiveDescription.value.trim()
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

        updateTalentPortrait();

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


        [...specialEffectTypes.options].forEach(option => option.selected = false);
        (card.skills.special.effectTypes || []).forEach(value => {
          selectStoredOption(specialEffectTypes, value);
        });
        [...specialEffectTypes.options].forEach(option => {
          option.selected = (card.skills.special.effectTypes || []).includes(option.value);
        });
        specialSkillBoost.value = card.skills.special.boost ?? '';
        specialSkillDuration.value = card.skills.special.duration ?? '';
        const specialEffects = getSpecialEffects(card);
        legacySpecialEffects = Array.isArray(card.skills.special.effects)
          ? null
          : JSON.stringify(specialEffects);
        setFixedSpecialEffects(specialEffects);
        selectStoredOption(activeEffectType, card.skills.active.effectType || 'score_up');

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

        const effect = getPassiveEffect(card);
        selectStoredOption(passiveEffectType, effect.type);
        selectStoredOption(passiveCondition, effect.condition?.kind === 'text' ? 'text' : skillConditionKey(effect.condition));
        passiveConditionText.value = effect.condition?.kind === 'text' ? effect.condition.value : '';
        passiveConditionCount.value = effect.conditionCount;
        selectStoredOption(passiveTarget, effect.target?.kind === 'text' ? 'text' : skillConditionKey(effect.target));
        passiveTargetText.value = effect.target?.kind === 'text' ? effect.target.value : '';
        passiveTargetCount.value = effect.targetCount;
        passiveValue.value = effect.value;
        passiveDescription.value = effect.description;
        updateConditionTextVisibility();
        document.querySelector('#legacyPassiveDetails').hidden = !card.skills.passive.status.description;

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
  [...specialEffectTypes.options].forEach(option => option.selected = false);
  setFixedSpecialEffects([]);
  legacySpecialEffects = null;
  activeEffectType.value = 'score_up';
  passiveEffectType.value = '';
  passiveCondition.value = '';
  passiveTarget.value = '';
  updateConditionTextVisibility();
  document.querySelector('#legacyPassiveDetails').hidden = true;

  memberCardIdInput.value =
    '';

  updateTalentPortrait();

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

populateSkillOptions();
setFixedSpecialEffects([]);
renderTalentSelect();
updateTalentPortrait();
updateCardLevel();
applyStatPreset();
renderMemberCards();