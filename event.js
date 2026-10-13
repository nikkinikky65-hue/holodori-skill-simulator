// ========================================
// イベント編成探索
// ========================================

const LEGACY_MEMBER_CARD_STORAGE_KEY =
  'holodori-member-card-library-v1';

const FORMATION_SIZE = 5;
const REQUIRED_SLOT_COUNT = 4;

const EVENT_SEARCH_STORAGE_KEY =
  'holodori-event-search-v1';

// 一次選考を通す編成数
const FINALIST_COUNT = 3;

// A面と同じ初期曲時間
const DEFAULT_SONG_LENGTH = 120;

// A面と同じ発動頻度UP候補
const SHORT_OPTIONS = [0, 4, 8, 12];


// ========================================
// 共通
// ========================================

function num(value, fallback = 0){

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}


// ========================================
// ライブラリ
// ========================================

function loadMemberCards(){
  if(localStorage.getItem(MEMBER_CARD_STORAGE_KEY) !== null) return readCardLibrary();
  // v1しかない環境では読み取り専用で互換表示。旧データは書き換えない。


  const saved =
    localStorage.getItem(
      LEGACY_MEMBER_CARD_STORAGE_KEY
    );

  if(!saved){
    return [];
  }

  try{

    const data =
      JSON.parse(saved);

    return Array.isArray(data)
      ? data.filter(card => card && typeof card === 'object').map(card => createCardV2({
          ...card, talentId: card.memberId, cardName: card.costume || '未分類',
          skills: { active: {
            interval: card.interval, probability: card.prob,
            duration: card.duration, boost: card.boost
          } }
        }))
      : [];

  }catch(error){

    console.warn(
      'メンバーカードを読み込めませんでした',
      error
    );

    return [];
  }
}


const memberCards =
  loadMemberCards();

// Canonical cards are transient event-condition choices, never Library records.
const canonicalEventCards = new Map();
let candidateAliases = new Map();
let candidateReady;


// ========================================
// DOM
// ========================================

const requiredSlots =
  document.querySelector(
    '#requiredSlots'
  );

const searchFormationButton =
  document.querySelector(
    '#searchFormation'
  );

const clearConditionsButton =
  document.querySelector(
    '#clearConditions'
  );

const formationResults =
  document.querySelector(
    '#formationResults'
  );

const searchStatus =
  document.querySelector(
    '#searchStatus'
  );


// ========================================
// メンバー
// ========================================

function getMemberName(memberId){

  const member =
    HOLO_MEMBERS.find(
      member =>
        member.id === memberId
    );

  return member
    ? member.name
    : '不明なメンバー';
}


function getCardLabel(card){

  return (
    `${getMemberName(card.talentId)} / ` +
    `${card.cardName || '未分類'}`
  );
}


// ========================================
// 必須枠
// ========================================

function renderRequiredSlots(){

  requiredSlots.innerHTML = '';

  for(
    let i = 0;
    i < REQUIRED_SLOT_COUNT;
    i++
  ){

    const slot =
      document.createElement('div');

    slot.className =
      'requiredSlot';


    const title = document.createElement('strong');
    title.textContent = `必須枠 ${i + 1}`;


    // ----------------------------
    // メンバー
    // ----------------------------

    const memberLabel =
      document.createElement('label');

    memberLabel.textContent =
      'メンバー';


    const memberSelect =
      document.createElement('select');

    memberSelect.dataset.role =
      'member';

    memberSelect.innerHTML =
      '<option value="">指定なし</option>';


    HOLO_MEMBERS.forEach(member => {

      const option =
        document.createElement('option');

      option.value =
        member.id;

      option.textContent =
        member.name;

      memberSelect.append(option);
    });


    // ----------------------------
    // カード
    // ----------------------------

    const cardLabel =
      document.createElement('label');

    cardLabel.textContent =
      'カード';


    const cardSelect =
      document.createElement('select');

    cardSelect.dataset.role =
      'card';

    cardSelect.disabled =
      true;

    cardSelect.innerHTML =
      '<option value="">指定なし</option>';

    const canonicalButton = document.createElement('button');
    canonicalButton.type = 'button';
    canonicalButton.className = 'canonicalSlotButton';
    canonicalButton.dataset.loadCanonicalSlot = String(i);
    canonicalButton.textContent = 'カード呼び出し';

    const canonicalStatus = document.createElement('p');
    canonicalStatus.className = 'sub canonicalSlotStatus';
    canonicalStatus.setAttribute('role', 'status');
    canonicalStatus.setAttribute('aria-live', 'polite');


    memberSelect.addEventListener(
      'change',
      () => {
        canonicalStatus.textContent = '';

        renderCardOptions(
          memberSelect,
          cardSelect
        );
      }
    );

    cardSelect.addEventListener('change', () => {
      showCanonicalExpansion(canonicalStatus, findEventCard(cardSelect.value)?.canonicalExpansion);
    });

    canonicalButton.addEventListener('click', () => {
      openCanonicalCardPicker({
        selection: canonicalEventSelection(cardSelect.value),
        targetText: `呼出先：B面 必須枠${i + 1}`,
        apply: (canonicalCard, level, expansion) => {
          const adapted = adaptCanonicalCardToEventCard(canonicalCard, level, expansion);
          canonicalEventCards.set(adapted.id, adapted);
          memberSelect.value = adapted.talentId;
          renderCardOptions(memberSelect, cardSelect);
          addCanonicalCardOption(cardSelect, adapted);
          cardSelect.value = adapted.id;
          showCanonicalExpansion(canonicalStatus, expansion);
          saveEventSearchState();
        }
      });
    });


    slot.append(
      title,
      memberLabel,
      memberSelect,
      cardLabel,
      cardSelect,
      canonicalButton,
      canonicalStatus
    );

    requiredSlots.append(slot);
  }
}


// ========================================
// カード選択肢
// ========================================

function renderCardOptions(
  memberSelect,
  cardSelect
){

  const memberId =
    memberSelect.value;

  cardSelect.innerHTML =
    '<option value="">指定なし</option>';


  if(!memberId){

    cardSelect.disabled =
      true;

    return;
  }


  const cards =
    memberCards.filter(
      card =>
        card.talentId === memberId
    );


  cards.forEach(card => {

    const option =
      document.createElement('option');

    option.value =
      card.id;

    option.textContent =
      card.cardName || '未分類';

    cardSelect.append(option);
  });


  cardSelect.disabled =
    false;
}

function addCanonicalCardOption(cardSelect, card){
  if([...cardSelect.options].some(option => option.value === card.id)) return;
  const option = document.createElement('option');
  option.value = card.id;
  option.textContent = card.canonicalExpansion
    ? `${card.cardName} / ${Number.isInteger(card.canonicalExpansion.bloom) ? '開花 ' + card.canonicalExpansion.bloom : '開花未指定（旧保存）'}`
    : `${card.cardName} / 開花未指定（旧保存）`;
  cardSelect.append(option);
}

function canonicalEventSelection(cardId){
  const card = findEventCard(cardId);
  if(card?.canonicalExpansion) return canonicalSelection(card.canonicalExpansion);
  const match = /^canonical:(.+):lv(\d+)$/.exec(cardId || '');
  return match ? {version: 1, cardId: match[1], levels: {active: Number(match[2])}} : null;
}

async function restoreCanonicalEventCard(cardId){
  const bloomMatch = /^canonical:(.+):bloom([0-5])(?::training(\d+))?$/.exec(cardId || '');
  const match = /^canonical:(.+):lv(\d+)(?::p(\d+):s(\d+))?(?::training(\d+))?$/.exec(cardId || '');
  if(!bloomMatch && !match) return null;
  const fixture = await loadRuntimeCardCatalog();
  const card = fixture.cards.find(item => item.id === (bloomMatch || match)[1]);
  if(!card) return null;
  // Active-only legacy IDs do not establish P/SP levels or a Bloom stage.
  const expansion = bloomMatch ? expandCanonicalBloom(card, Number(bloomMatch[2]), fixture.dataset, Number(bloomMatch[3] ?? 0)) :
    match[3] ? expandCanonicalCard(card, {active:Number(match[2]), passive:Number(match[3]), special:Number(match[4])}, fixture.dataset) : null;
  if(!bloomMatch && expansion && match[5] !== undefined){
    expansion.training = Number(match[5]);
    expansion.trainingStats = canonicalTrainingStats(card, expansion.training);
  }
  const adapted = adaptCanonicalCardToEventCard(card, expansion ? expansion.levels.active : Number(match[2]), expansion);
  canonicalEventCards.set(adapted.id, adapted);
  return adapted;
}

// ========================================
// イベント探索条件の保存・復元
// ========================================

function saveEventSearchState(){

  const conditions =
    [...document.querySelectorAll('.requiredSlot')]
      .map(slot => ({

        memberId:
          slot.querySelector(
            '[data-role="member"]'
          ).value,

        cardId:
          slot.querySelector(
            '[data-role="card"]'
          ).value
      }));


  localStorage.setItem(
    EVENT_SEARCH_STORAGE_KEY,
    JSON.stringify({
      conditions
    })
  );
}


async function loadEventSearchState(){
  if(candidateReady) await candidateReady;

  const saved =
    localStorage.getItem(
      EVENT_SEARCH_STORAGE_KEY
    );

  if(!saved){
    return;
  }


  try{

    const state =
      JSON.parse(saved);

    if(!Array.isArray(state.conditions)){
      return;
    }


    const slots =
      [...document.querySelectorAll('.requiredSlot')];


    for(const [index, condition] of state.conditions.entries()){

        const slot = slots[index];

        if(!slot) continue;


        const memberSelect =
          slot.querySelector(
            '[data-role="member"]'
          );

        const cardSelect =
          slot.querySelector(
            '[data-role="card"]'
          );


        memberSelect.value =
          condition.memberId || '';


        renderCardOptions(memberSelect, cardSelect);

        if(typeof condition.cardId === 'string' && condition.cardId.startsWith('canonical:')){
          try{
            const canonicalCard = await restoreCanonicalEventCard(condition.cardId);
            if(canonicalCard && canonicalCard.talentId === condition.memberId){
              addCanonicalCardOption(cardSelect, canonicalCard);
              showCanonicalExpansion(slot.querySelector('.canonicalSlotStatus'), canonicalCard.canonicalExpansion);
            }
          }catch(error){
            console.warn('Canonical card selection could not be restored.', error);
          }
        }


        cardSelect.value =
          candidateAliases.get(condition.cardId) || condition.cardId || '';
        showCanonicalExpansion(slot.querySelector('.canonicalSlotStatus'),findEventCard(cardSelect.value)?.canonicalExpansion);
    }

  }catch(error){

    console.warn(
      'イベント探索条件を復元できませんでした',
      error
    );
  }
}


// メンバー・カード変更時に自動保存
requiredSlots.addEventListener(
  'change',
  event => {

    if(
      event.target.matches(
        '[data-role="member"], [data-role="card"]'
      )
    ){
      saveEventSearchState();
    }
  }
);


// ========================================
// 条件取得
// ========================================

function getRequiredConditions(){

  return [
    ...document.querySelectorAll(
      '.requiredSlot'
    )
  ]
    .map(slot => {

      const memberSelect =
        slot.querySelector(
          '[data-role="member"]'
        );

      const cardSelect =
        slot.querySelector(
          '[data-role="card"]'
        );

      return {

        memberId:
          memberSelect.value,

        cardId:
          cardSelect.value || null
      };
    })

    .filter(
      condition =>
        condition.memberId
    );
}

function findEventCard(cardId){
  cardId = candidateAliases.get(cardId) || cardId;
  return memberCards.find(card => card.id === cardId) || canonicalEventCards.get(cardId) || null;
}


// ========================================
// 条件検証
// ========================================

function validateConditions(
  conditions
){

  const memberIds =
    conditions.map(
      condition =>
        condition.memberId
    );


  if(
    new Set(memberIds).size !==
    memberIds.length
  ){

    alert(
      '同じメンバーが複数の必須枠に指定されています'
    );

    return false;
  }


  return true;
}


// ========================================
// 必須カード候補
// ========================================

function buildRequiredCardGroups(
  conditions, candidates = memberCards
){

  return conditions.map(
    condition => {

      // カードまで固定
      if(condition.cardId){

        const card =
          findEventCard(condition.cardId);

        return card && card.talentId === condition.memberId
          ? [card]
          : [];
      }


      // メンバーだけ固定
      return candidates.filter(
        card =>
          card.talentId ===
          condition.memberId
      );
    }
  );
}


// ========================================
// 直積
// ========================================

function cartesianProduct(groups){

  if(groups.length === 0){
    return [[]];
  }


  return groups.reduce(
    (results, group) => {

      const next = [];

      results.forEach(result => {

        group.forEach(item => {

          next.push([
            ...result,
            item
          ]);
        });
      });

      return next;
    },
    [[]]
  );
}


// ========================================
// 組合せ
// ========================================

function combinations(
  items,
  count
){

  if(count === 0){
    return [[]];
  }

  if(items.length < count){
    return [];
  }


  const results = [];


  function walk(
    start,
    current
  ){

    if(
      current.length === count
    ){

      results.push(
        [...current]
      );

      return;
    }


    for(
      let i = start;
      i < items.length;
      i++
    ){

      current.push(items[i]);

      walk(
        i + 1,
        current
      );

      current.pop();
    }
  }


  walk(0, []);

  return results;
}


// ========================================
// 編成生成
// ========================================

function generateFormations(
  conditions, candidates = memberCards
){

  const requiredGroups =
    buildRequiredCardGroups(
      conditions, candidates
    );


  if(
    requiredGroups.some(
      group =>
        group.length === 0
    )
  ){
    return [];
  }


  if(EventSearchSafety.estimate(candidates,requiredGroups)>EventSearchSafety.LIMIT) throw Error('探索上限を超えています');
  const requiredPatterns =
    cartesianProduct(
      requiredGroups
    );


  const formations = [];


  requiredPatterns.forEach(
    requiredCards => {

      const usedMemberIds =
        new Set(
          requiredCards.map(
            card =>
              card.talentId
          )
        );


      const remainingCards =
        candidates.filter(
          card =>
            !usedMemberIds.has(
              card.talentId
            )
        );


      const need =
        FORMATION_SIZE -
        requiredCards.length;


      const remainingPatterns =
        combinations(
          remainingCards,
          need
        );


      remainingPatterns.forEach(
        remaining => {

          const formation = [
            ...requiredCards,
            ...remaining
          ];


          const memberIds =
            formation.map(
              card =>
                card.talentId
            );


          // 同じ人物の別カードを
          // 同一編成には入れない
          if(
            new Set(memberIds).size !==
            FORMATION_SIZE
          ){
            return;
          }


          if(formations.length>=EventSearchSafety.LIMIT) throw Error('探索上限');
          formations.push(
            formation
          );
        }
      );
    }
  );


  return formations;
}


// ========================================
// A面互換データへ変換
// ========================================

function cardToActiveMember(
  card,
  slot,
  short = 0
){

  return {

    slot,

    memberId:
      card.talentId,

    name:
      getMemberName(
        card.talentId
      ),

    costume:
      card.cardName || '未分類',

    interval:
      Math.max(
        0,
        num(card.skills.active.interval)
      ),

    prob:
      card.skills.active.probability,

    duration:
      Math.max(
        0,
        num(card.skills.active.duration)
      ),

    boost:
      Math.max(
        0,
        num(card.skills.active.boost)
      ),

    short:
      short
  };
}


function formationToMembers(
  formation,
  shorts = null
){

  const members = formation.map(
    (card, index) =>
      cardToActiveMember(
        card,
        index + 1,
        shorts
          ? shorts[index]
          : 0
      )
  );
  return ActiveConditionalRules.apply(members,formation.map(c=>c.canonicalExpansion));
}


// ========================================
// A面と同じActive計算
// ========================================

// 発動頻度UP
function adjustedInterval(member){

  return member.interval > 0
    ? member.interval /
      (1 + member.short / 100)
    : 0;
}


// 発動候補
function events(member, T){

  const interval =
    adjustedInterval(member);

  const output = [];


  if(
    interval <= 0 ||
    member.duration <= 0 ||
    member.boost <= 0
  ){
    return output;
  }


  for(
    let t = interval;
    t <= T + 1e-9 &&
    output.length < 1000;
    t += interval
  ){

    output.push({

      start:
        t,

      end:
        Math.min(
          T,
          t + member.duration
        ),

      boost:
        member.boost,

      m:
        member
    });
  }


  return output;
}


// MAX評価値
// ∫ max(発動中Active補正率) dt
function calcMax(all, T){

  const points =
    [0, T];


  all.forEach(event => {

    points.push(
      event.start,
      event.end
    );
  });


  points.sort(
    (a, b) =>
      a - b
  );


  let total = 0;


  for(
    let i = 0;
    i < points.length - 1;
    i++
  ){

    const a =
      points[i];

    const b =
      points[i + 1];


    if(b <= a){
      continue;
    }


    const mid =
      (a + b) / 2;


    let maxBoost = 0;


    for(const event of all){

      if(
        event.start <= mid &&
        mid < event.end
      ){

        maxBoost =
          Math.max(
            maxBoost,
            event.boost
          );
      }
    }


    total +=
      maxBoost *
      (b - a);
  }


  return total;
}


// ========================================
// 一次評価
// ========================================

function evaluateFormation(
  formation,
  T
){

  // 一次評価では全員発動頻度UP0%
  const members =
    formationToMembers(
      formation
    );


  const all =
    members
      .map(
        member =>
          events(member, T)
      )
      .flat();


  const score =
    calcMax(
      all,
      T
    );


  return {

    formation,

    members,

    score,

    // A面の「曲全体平均Active補正」
    average:
      score / T
  };
}


// ========================================
// 一次選考
// ========================================

function selectFinalists(
  formations,
  T
){

  const evaluated =
    formations.map(
      formation =>
        evaluateFormation(
          formation,
          T
        )
    );


  evaluated.sort(
    (a, b) =>
      b.score -
      a.score
  );


  return evaluated.slice(
    0,
    FINALIST_COUNT
  );
}


// ========================================
// 発動頻度UP最適化
// ========================================

function* optimizeFormationSteps(
  formation,
  T
){

  let best = null;
  let tested = 0;


  function* search(
    index,
    shorts
  ){

    if(
      index <
      FORMATION_SIZE
    ){

      for(
        const value
        of SHORT_OPTIONS
      ){

        shorts.push(value);

        yield* search(
          index + 1,
          shorts
        );

        shorts.pop();
      }

      return;
    }


    tested++;
    if(tested%32===0) yield tested;


    const members =
      formationToMembers(
        formation,
        shorts
      );


    const all =
      members
        .map(
          member =>
            events(
              member,
              T
            )
        )
        .flat();


    const score =
      calcMax(
        all,
        T
      );


    if(
      best === null ||
      score >
      best.score + 1e-9
    ){

      best = {

        score,

        average:
          score / T,

        shorts:
          [...shorts],

        members
      };
    }
  }


  yield* search(
    0,
    []
  );


  return {

    ...best,

    tested
  };
}


function optimizeFormation(formation,T){
  const iterator=optimizeFormationSteps(formation,T);let step;
  do{step=iterator.next();}while(!step.done);
  return step.value;
}

// ========================================
// 最終候補作成
// ========================================

function buildFinalResults(
  finalists,
  T
){

  const results =
    finalists.map(
      preliminary => {

        const optimized =
          optimizeFormation(
            preliminary.formation,
            T
          );


        return {

          formation:
            preliminary.formation,

          preliminaryScore:
            preliminary.score,

          preliminaryAverage:
            preliminary.average,

          optimizedScore:
            optimized.score,

          optimizedAverage:
            optimized.average,

          shorts:
            optimized.shorts,

          tested:
            optimized.tested
        };
      }
    );


  // 最適化後の評価値で並び直す
  results.sort(
    (a, b) =>
      b.optimizedScore -
      a.optimizedScore
  );


  return results;
}


// ========================================
// 結果表示
// ========================================

function renderFinalResults(
  results
){

  formationResults.innerHTML =
    '';


  if(
    results.length === 0
  ){

    formationResults.innerHTML =
      '<div class="libraryEmpty">' +
      '条件を満たす編成がありません' +
      '</div>';

    return;
  }


  results.forEach(
    (result, index) => {

      const item =
        document.createElement(
          'div'
        );

      item.className =
        'formationResultItem';


      // ----------------------------
      // タイトル
      // ----------------------------

      const title =
        document.createElement(
          'h3'
        );

      title.textContent =
        `候補 ${index + 1}`;


      // ----------------------------
      // 評価
      // ----------------------------

      const score =
        document.createElement(
          'div'
        );

      score.className =
        'formationScore';


      const improvement =
        result.optimizedScore -
        result.preliminaryScore;


      score.innerHTML = `

        <div>
          一次評価：
          <strong>
            ${result.preliminaryScore.toFixed(2)}
          </strong>
        </div>

        <div>
          発動頻度UP最適化後：
          <strong>
            ${result.optimizedScore.toFixed(2)}
          </strong>
        </div>

        <div class="sub">
          曲全体平均Active補正：
          +${result.optimizedAverage.toFixed(2)}%
        </div>

        <div class="sub">
          発動頻度UPによる伸び：
          +${improvement.toFixed(2)}
        </div>

      `;


      // ----------------------------
      // メンバー
      // ----------------------------

      const members =
        document.createElement(
          'div'
        );

      members.className =
        'formationMembers';


      result.formation.forEach(
        (card, memberIndex) => {

          const member =
            document.createElement(
              'div'
            );

          member.className =
            'formationMember';


          member.innerHTML = `

            <strong>
              ${getMemberName(
                card.talentId
              )}
            </strong>

            <span>

            </span>

            <span>
              発動頻度UP
              ${result.shorts[
                memberIndex
              ]}%
            </span>

          `;


          member.querySelector('span').textContent = card.cardName || '未分類';
          members.append(
            member
          );
        }
      );


      // ----------------------------
      // 探索情報
      // ----------------------------

      const detail =
        document.createElement(
          'div'
        );

      detail.className =
        'sub';

      detail.textContent =
        `発動頻度UP配置 ${result.tested}通りを検証`;


      item.append(
        title,
        score,
        members,
        detail
      );


      formationResults.append(
        item
      );
    }
  );
}


// ========================================
// 探索実行
// ========================================

let searchRunning=false, searchCancelled=false;
const yieldSearch=()=>new Promise(resolve=>setTimeout(resolve,0));
function searchCandidates(conditions=getRequiredConditions()){
  const ids=conditions.map(c=>candidateAliases.get(c.cardId)||c.cardId);
  const candidates=EventSearchSafety.filter(memberCards,ids,document.querySelector('#highestRarityOnly').checked);
  document.querySelector('#candidateFilterStatus').textContent=`絞り込み前 ${memberCards.length}枚 → ${candidates.length}枚（必須枠の指定カードは保持）`;
  return candidates;
}
document.querySelector('#highestRarityOnly').addEventListener('change',()=>searchCandidates());
requiredSlots.addEventListener('change',()=>searchCandidates());
document.querySelector('#cancelSearch').addEventListener('click',()=>{searchCancelled=true;});
searchFormationButton.addEventListener('click',async()=>{
  if(searchRunning)return;
  const conditions=getRequiredConditions();if(!validateConditions(conditions))return;
  const candidates=searchCandidates(conditions);
  const estimate=EventSearchSafety.estimate(candidates,buildRequiredCardGroups(conditions,candidates));
  if(estimate>EventSearchSafety.LIMIT){searchStatus.textContent='探索上限10,000組合せを超える見込みです。必須枠を指定するか候補を減らしてください（安全側の上限推定）。';return;}
  searchRunning=true;searchCancelled=false;
  const controls=[...document.querySelectorAll('input,select,button')].filter(e=>e.id!=='cancelSearch');
  const disabled=controls.map(e=>e.disabled);controls.forEach(e=>e.disabled=true);
  document.querySelector('#cancelSearch').disabled=false;
  const check=()=>{if(searchCancelled)throw Error('探索を中断しました');};
  try{
    searchStatus.textContent=`探索準備：最大 ${estimate}組合せ`;await yieldSearch();check();
    const formations=generateFormations(conditions,candidates),evaluated=[];
    for(const formation of formations){
      check();if(evaluated.length>=EventSearchSafety.LIMIT)throw Error('探索上限に到達しました');
      evaluated.push(evaluateFormation(formation,DEFAULT_SONG_LENGTH));
      if(evaluated.length%25===0){searchStatus.textContent=`一次評価 ${evaluated.length} / ${formations.length}`;await yieldSearch();}
    }
    evaluated.sort((a,b)=>b.score-a.score);
    const results=[];
    for(const preliminary of evaluated.slice(0,FINALIST_COUNT)){
      searchStatus.textContent=`発動頻度UP最適化 ${results.length+1} / ${Math.min(FINALIST_COUNT,evaluated.length)}`;
      const iterator=optimizeFormationSteps(preliminary.formation,DEFAULT_SONG_LENGTH);let step;
      do{await yieldSearch();check();step=iterator.next();}while(!step.done);
      const optimized=step.value;
      results.push({formation:preliminary.formation,preliminaryScore:preliminary.score,preliminaryAverage:preliminary.average,optimizedScore:optimized.score,optimizedAverage:optimized.average,shorts:optimized.shorts,tested:optimized.tested});
    }
    check();results.sort((a,b)=>b.optimizedScore-a.optimizedScore);renderFinalResults(results);
    searchStatus.textContent=formations.length?`${formations.length}編成を一次評価 → 上位${results.length}編成を発動頻度UP最適化`:'条件を満たす編成がありません';
  }catch(error){searchStatus.textContent=error.message;}
  finally{controls.forEach((e,i)=>e.disabled=disabled[i]);document.querySelector('#cancelSearch').disabled=true;searchRunning=false;}
});

// ========================================
// 条件クリア
// ========================================

clearConditionsButton.addEventListener(
  'click',
  () => {

    localStorage.removeItem(
      EVENT_SEARCH_STORAGE_KEY
    );

    renderRequiredSlots();

    searchStatus.textContent =
      '';

    formationResults.innerHTML =
      '<div class="libraryEmpty">' +
      '条件を指定して探索してください' +
      '</div>';
  }
);

// ========================================
// 初期表示
// ========================================

renderRequiredSlots();
searchFormationButton.disabled = true;
candidateReady = (async()=>{
  const status=document.querySelector('#candidateLibraryStatus');
  try{
    const catalog=await loadRuntimeCardCatalog();
    const merged=EventCandidateLibrary.merge(catalog,readUserCardStates(),memberCards);
    memberCards.splice(0,memberCards.length,...merged.cards);
    candidateAliases=merged.aliases;
    const c=merged.counts;
    status.textContent=`カードライブラリ ${c.owned}枚 / 手動登録 ${c.manual}枚 / 重複除外 ${c.duplicates}枚 / 最終候補 ${c.total}枚`;
    if(merged.errors.length) status.textContent+=` / 展開不可 ${merged.errors.length}枚`;
  }catch(error){
    status.textContent=`所持カードを取得できません：${error.message}。手動登録 ${memberCards.length}枚で利用できます。`;
  }
  renderRequiredSlots();
  searchFormationButton.disabled=false;
  searchCandidates();
})();
loadEventSearchState();