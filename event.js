// ========================================
// イベント編成探索
// ========================================

const MEMBER_CARD_STORAGE_KEY =
  'holodori-member-card-library-v1';

const FORMATION_SIZE = 5;
const REQUIRED_SLOT_COUNT = 4;

const EVENT_SEARCH_STORAGE_KEY =
  'holodori-event-search-v1';

// 一次選考を通す編成数
const FINALIST_COUNT = 3;

// A面と同じ初期曲時間
const DEFAULT_SONG_LENGTH = 120;

// A面と同じ短縮候補
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

  const saved =
    localStorage.getItem(
      MEMBER_CARD_STORAGE_KEY
    );

  if(!saved){
    return [];
  }

  try{

    const data =
      JSON.parse(saved);

    return Array.isArray(data)
      ? data
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
    `${getMemberName(card.memberId)} / ` +
    `${card.costume || '未分類'}`
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


    const title =
      document.createElement('strong');

    title.textContent =
      `必須枠 ${i + 1}`;


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


    memberSelect.addEventListener(
      'change',
      () => {

        renderCardOptions(
          memberSelect,
          cardSelect
        );
      }
    );


    slot.append(
      title,
      memberLabel,
      memberSelect,
      cardLabel,
      cardSelect
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
        card.memberId === memberId
    );


  cards.forEach(card => {

    const option =
      document.createElement('option');

    option.value =
      card.id;

    option.textContent =
      card.costume || '未分類';

    cardSelect.append(option);
  });


  cardSelect.disabled =
    false;
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


function loadEventSearchState(){

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


    state.conditions.forEach(
      (condition, index) => {

        const slot =
          slots[index];

        if(!slot){
          return;
        }


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


        renderCardOptions(
          memberSelect,
          cardSelect
        );


        cardSelect.value =
          condition.cardId || '';
      }
    );

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
  conditions
){

  return conditions.map(
    condition => {

      // カードまで固定
      if(condition.cardId){

        const card =
          memberCards.find(
            card =>
              card.id ===
              condition.cardId
          );

        return card
          ? [card]
          : [];
      }


      // メンバーだけ固定
      return memberCards.filter(
        card =>
          card.memberId ===
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
  conditions
){

  const requiredGroups =
    buildRequiredCardGroups(
      conditions
    );


  if(
    requiredGroups.some(
      group =>
        group.length === 0
    )
  ){
    return [];
  }


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
              card.memberId
          )
        );


      const remainingCards =
        memberCards.filter(
          card =>
            !usedMemberIds.has(
              card.memberId
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
                card.memberId
            );


          // 同じ人物の別カードを
          // 同一編成には入れない
          if(
            new Set(memberIds).size !==
            FORMATION_SIZE
          ){
            return;
          }


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
      card.memberId,

    name:
      getMemberName(
        card.memberId
      ),

    costume:
      card.costume || '未分類',

    interval:
      Math.max(
        0,
        num(card.interval)
      ),

    prob:
      card.prob,

    duration:
      Math.max(
        0,
        num(card.duration)
      ),

    boost:
      Math.max(
        0,
        num(card.boost)
      ),

    short:
      short
  };
}


function formationToMembers(
  formation,
  shorts = null
){

  return formation.map(
    (card, index) =>
      cardToActiveMember(
        card,
        index + 1,
        shorts
          ? shorts[index]
          : 0
      )
  );
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

  // 一次評価では全員短縮0%
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
// 短縮最適化
// ========================================

function optimizeFormation(
  formation,
  T
){

  let best = null;
  let tested = 0;


  function search(
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

        search(
          index + 1,
          shorts
        );

        shorts.pop();
      }

      return;
    }


    tested++;


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


  search(
    0,
    []
  );


  return {

    ...best,

    tested
  };
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
          短縮最適化後：
          <strong>
            ${result.optimizedScore.toFixed(2)}
          </strong>
        </div>

        <div class="sub">
          曲全体平均Active補正：
          +${result.optimizedAverage.toFixed(2)}%
        </div>

        <div class="sub">
          短縮による伸び：
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
                card.memberId
              )}
            </strong>

            <span>
              ${card.costume || '未分類'}
            </span>

            <span>
              短縮
              ${result.shorts[
                memberIndex
              ]}%
            </span>

          `;


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
        `短縮配置 ${result.tested}通りを検証`;


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

searchFormationButton.addEventListener(
  'click',
  () => {

    const conditions =
      getRequiredConditions();


    if(
      !validateConditions(
        conditions
      )
    ){
      return;
    }


    if(
      memberCards.length <
      FORMATION_SIZE
    ){

      alert(
        'ライブラリに5枚以上のカードを登録してください'
      );

      return;
    }


    searchFormationButton.disabled =
      true;

    searchStatus.textContent =
      '編成候補を探索中...';


    // 描画を先に反映させる
    setTimeout(
      () => {

        try{

          const T =
            DEFAULT_SONG_LENGTH;


          // ① 条件を満たす編成生成
          const formations =
            generateFormations(
              conditions
            );


          if(
            formations.length === 0
          ){

            searchStatus.textContent =
              '条件を満たす編成がありません';

            renderFinalResults([]);

            return;
          }


          // ② 全編成を短縮0%で一次評価
          const finalists =
            selectFinalists(
              formations,
              T
            );


          // ③ 上位3編成だけ短縮総当たり
          const results =
            buildFinalResults(
              finalists,
              T
            );


          searchStatus.textContent =
            `${formations.length}編成を一次評価 → ` +
            `上位${results.length}編成を短縮最適化`;


          renderFinalResults(
            results
          );


        }finally{

          searchFormationButton.disabled =
            false;
        }

      },
      0
    );
  }
);


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
loadEventSearchState();