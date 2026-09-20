// ========================================
// イベント編成探索
// ========================================

const MEMBER_CARD_STORAGE_KEY =
  'holodori-member-card-library-v1';

const FORMATION_SIZE = 5;

const REQUIRED_SLOT_COUNT = 4;


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
// メンバー名
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


// ========================================
// カード表示名
// ========================================

function getCardLabel(card){

  return (
    `${getMemberName(card.memberId)} / ` +
    `${card.costume}`
  );
}


// ========================================
// 必須枠生成
// ========================================

function renderRequiredSlots(){

  requiredSlots.innerHTML = '';

  for(
    let i = 0;
    i < REQUIRED_SLOT_COUNT;
    i++
  ){

    const slot =
      document.createElement(
        'div'
      );

    slot.className =
      'requiredSlot';


    // ----------------------------
    // タイトル
    // ----------------------------

    const title =
      document.createElement(
        'strong'
      );

    title.textContent =
      `必須枠 ${i + 1}`;


    // ----------------------------
    // メンバー
    // ----------------------------

    const memberLabel =
      document.createElement(
        'label'
      );

    memberLabel.textContent =
      'メンバー';


    const memberSelect =
      document.createElement(
        'select'
      );

    memberSelect.dataset.role =
      'member';

    memberSelect.innerHTML =
      '<option value="">指定なし</option>';


    // members.js の順番をそのまま使用
    HOLO_MEMBERS.forEach(member => {

      const option =
        document.createElement(
          'option'
        );

      option.value =
        member.id;

      option.textContent =
        member.name;

      memberSelect.append(
        option
      );
    });


    // ----------------------------
    // カード
    // ----------------------------

    const cardLabel =
      document.createElement(
        'label'
      );

    cardLabel.textContent =
      'カード';


    const cardSelect =
      document.createElement(
        'select'
      );

    cardSelect.dataset.role =
      'card';

    cardSelect.disabled =
      true;

    cardSelect.innerHTML =
      '<option value="">指定なし</option>';


    // ----------------------------
    // メンバー変更
    // ----------------------------

    memberSelect.addEventListener(
      'change',
      () => {

        renderCardOptions(
          memberSelect,
          cardSelect
        );
      }
    );


    // ----------------------------
    // 組み立て
    // ----------------------------

    slot.append(
      title,
      memberLabel,
      memberSelect,
      cardLabel,
      cardSelect
    );

    requiredSlots.append(
      slot
    );
  }
}


// ========================================
// カード候補
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
      document.createElement(
        'option'
      );

    option.value =
      card.id;

    option.textContent =
      card.costume;

    cardSelect.append(
      option
    );
  });


  cardSelect.disabled =
    false;
}


// ========================================
// 条件取得
// ========================================

function getRequiredConditions(){

  const slots =
    [
      ...document.querySelectorAll(
        '.requiredSlot'
      )
    ];


  return slots
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
// 条件チェック
// ========================================

function validateConditions(
  conditions
){

  const memberIds =
    conditions.map(
      condition =>
        condition.memberId
    );


  const uniqueMembers =
    new Set(
      memberIds
    );


  if(
    uniqueMembers.size !==
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
// 必須カード候補を作る
// ========================================

function buildRequiredCardGroups(
  conditions
){

  return conditions.map(
    condition => {

      // カード固定
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


      // メンバーのみ固定
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

function cartesianProduct(
  groups
){

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

      current.push(
        items[i]
      );

      walk(
        i + 1,
        current
      );

      current.pop();
    }
  }


  walk(
    0,
    []
  );


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


  // 登録カードがない必須メンバー
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


          // 同一メンバー重複防止
          const memberIds =
            formation.map(
              card =>
                card.memberId
            );


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
// 結果表示
// ========================================

function renderResults(
  formations
){

  formationResults.innerHTML =
    '';


  if(
    formations.length === 0
  ){

    formationResults.innerHTML =
      '<div class="libraryEmpty">' +
      '条件を満たす編成がありません' +
      '</div>';

    return;
  }


  // 第一版では表示数を制限
  const DISPLAY_LIMIT = 30;


  formations
    .slice(
      0,
      DISPLAY_LIMIT
    )
    .forEach(
      (formation, index) => {

        const item =
          document.createElement(
            'div'
          );

        item.className =
          'formationResultItem';


        const title =
          document.createElement(
            'strong'
          );

        title.textContent =
          `候補 ${index + 1}`;


        const members =
          document.createElement(
            'div'
          );

        members.className =
          'formationMembers';


        formation.forEach(card => {

          const cardItem =
            document.createElement(
              'div'
            );

          cardItem.className =
            'formationMember';

          cardItem.textContent =
            getCardLabel(card);

          members.append(
            cardItem
          );
        });


        item.append(
          title,
          members
        );


        formationResults.append(
          item
        );
      }
    );


  if(
    formations.length >
    DISPLAY_LIMIT
  ){

    const more =
      document.createElement(
        'p'
      );

    more.className =
      'sub';

    more.textContent =
      `全${formations.length}編成中、` +
      `先頭${DISPLAY_LIMIT}件を表示`;

    formationResults.append(
      more
    );
  }
}


// ========================================
// 探索
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


    const formations =
      generateFormations(
        conditions
      );


    searchStatus.textContent =
      `${formations.length}通りの編成候補`;


    renderResults(
      formations
    );
  }
);


// ========================================
// 条件クリア
// ========================================

clearConditionsButton.addEventListener(
  'click',
  () => {

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