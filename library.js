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
}function saveMemberCards(){

  localStorage.setItem(
    MEMBER_CARD_STORAGE_KEY,
    JSON.stringify(memberCards)
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
  document.querySelector(
    '#memberCardForm'
  );

const memberCardIdInput =
  document.querySelector(
    '#memberCardId'
  );

const memberCardMember =
  document.querySelector(
    '#memberCardMember'
  );

const memberCardCostume =
  document.querySelector(
    '#memberCardCostume'
  );

const memberCardInterval =
  document.querySelector(
    '#memberCardInterval'
  );

const memberCardProb =
  document.querySelector(
    '#memberCardProb'
  );

const memberCardDuration =
  document.querySelector(
    '#memberCardDuration'
  );

const memberCardBoost =
  document.querySelector(
    '#memberCardBoost'
  );

const memberCardCancel =
  document.querySelector(
    '#memberCardCancel'
  );

const memberCardList =
  document.querySelector(
    '#memberCardList'
  );

const memberCardCount =
  document.querySelector(
    '#memberCardCount'
  );


// ========================================
// 共通メンバー一覧
// ========================================

function renderMemberSelect(){

  memberCardMember.innerHTML =
    '<option value="">選択してください</option>';

  HOLO_MEMBERS.forEach(member => {

    const option =
      document.createElement(
        'option'
      );

    option.value =
      member.id;

    option.textContent =
      member.name;

    memberCardMember.append(
      option
    );
  });
}

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

        const memberCompare =
          getMemberName(a.memberId)
            .localeCompare(
              getMemberName(b.memberId),
              'ja'
            );

        if(memberCompare !== 0){
          return memberCompare;
        }

        return a.costume.localeCompare(
          b.costume,
          'ja'
        );
      }
    );


  sorted.forEach(card => {

    const row =
      document.createElement(
        'div'
      );

    row.className =
      'libraryCardItem';


    // ----------------------------
    // 情報
    // ----------------------------

    const info =
      document.createElement(
        'div'
      );

    info.className =
      'libraryCardInfo';


    const title =
      document.createElement(
        'strong'
      );

    title.textContent =
      `${getMemberName(card.memberId)} / ` +
      `${card.costume}`;


    const detail =
      document.createElement(
        'div'
      );

    detail.className =
      'sub';


    const probability =
      card.prob === 'low'
        ? '低'
        : card.prob === 'high'
          ? '高'
          : '中';


    detail.textContent =
      `${card.interval}s周期 / ` +
      `確率 ${probability} / ` +
      `発動 ${card.duration}s / ` +
      `+${card.boost}%`;


    info.append(
      title,
      detail
    );


    // ----------------------------
    // ボタン
    // ----------------------------

    const buttons =
      document.createElement(
        'div'
      );

    buttons.className =
      'libraryItemButtons';


    // 編集
    const edit =
      document.createElement(
        'button'
      );

    edit.type =
      'button';

    edit.textContent =
      '編集';


    edit.addEventListener(
      'click',
      () => {

        memberCardIdInput.value =
          card.id;

        memberCardMember.value =
          card.memberId;

        memberCardCostume.value =
          card.costume;

        memberCardInterval.value =
          card.interval;

        memberCardProb.value =
          card.prob;

        memberCardDuration.value =
          card.duration;

        memberCardBoost.value =
          card.boost;

        memberCardCostume.focus();
      }
    );


    // 削除
    const del =
      document.createElement(
        'button'
      );

    del.type =
      'button';

    del.textContent =
      '削除';


    del.addEventListener(
      'click',
      () => {

        const memberName =
          getMemberName(
            card.memberId
          );

        if(
          !confirm(
            `${memberName} / ` +
            `${card.costume} を削除しますか？`
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


    memberCardList.append(
      row
    );
  });
}


// ========================================
// 保存
// ========================================

memberCardForm.addEventListener(
  'submit',
  event => {

    event.preventDefault();


    const memberId =
      memberCardMember.value;

    const costume =
      memberCardCostume
        .value
        .trim();


    if(
      !memberId ||
      !costume
    ){
      return;
    }


    const data = {

      memberId,

      costume,

      interval:
        Number(
          memberCardInterval.value
        ),

      prob:
        memberCardProb.value,

      duration:
        Number(
          memberCardDuration.value
        ),

      boost:
        Number(
          memberCardBoost.value
        )
    };


    const editingId =
      memberCardIdInput.value;


    // ----------------------------
    // 編集
    // ----------------------------

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

    }

    // ----------------------------
    // 新規
    // ----------------------------

    else{

      memberCards.push({

        id:
          createId('card'),

        ...data
      });
    }


    saveMemberCards();

    resetMemberCardForm();

    renderMemberCards();
  }
);


// ========================================
// キャンセル
// ========================================

memberCardCancel.addEventListener(
  'click',
  resetMemberCardForm
);


function resetMemberCardForm(){

  memberCardIdInput.value =
    '';

  memberCardMember.value =
    '';

  memberCardCostume.value =
  '未分類';

  memberCardInterval.value =
    '';

  memberCardProb.value =
    'mid';

  memberCardDuration.value =
    '';

  memberCardBoost.value =
    '';
}


// ========================================
// 初期表示
// ========================================

renderMemberSelect();

renderMemberCards();