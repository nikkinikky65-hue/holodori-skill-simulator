const init=Array.from({length:5},()=>['','', '', 'mid', '', '', 0]);
const probs={low:35,mid:45,high:55};
const cards=document.querySelector('#cards');
init.forEach((d,i)=>{
  const el=document.createElement('div');

  el.className='card';

  el.innerHTML=`
    <label>
      <span class="slot">${i+1}</span>
      キャラ
      <select data-k="memberId">
        <option value="">未選択</option>
        ${HOLO_MEMBERS.map(member => `
          <option value="${member.id}">
            ${member.name}
          </option>
        `).join('')}
      </select>
    </label>

    <label>
      衣装
      <select data-k="costume">
        <option value="未分類" selected>未分類</option>
        <option value="★5恒常">★5恒常</option>
        <option value="★4">★4</option>
        <option value="★3">★3</option>
      </select>
    </label>

    <label>
      周期(s)
      <input
        data-k="interval"
        type="number"
        min="0.01"
        step="0.01"
        value="${d[2]}"
      >
    </label>

    <label>
      確率
      <select data-k="prob">
        <option value="low">低</option>
        <option value="mid">中</option>
        <option value="high">高</option>
      </select>
    </label>

    <label>
      発動時間(s)
      <input
        data-k="duration"
        type="number"
        min="0"
        step="0.01"
        value="${d[4]}"
      >
    </label>

    <label>
      補正(%)
      <input
        data-k="boost"
        type="number"
        min="0"
        step="0.01"
        value="${d[5]}"
      >
    </label>

    <label>
      短縮
      <select data-k="short">
        <option>0</option>
        <option>4</option>
        <option>8</option>
        <option>12</option>
      </select>
    </label>

    <div class="cardLibraryActions">
      <button
        type="button"
        data-save-library="${i}"
      >
        保存
      </button>

      <button
        type="button"
        data-load-library="${i}"
      >
        呼出
      </button>
    </div>
  `;

  el.querySelector('[data-k=prob]').value=d[3];
  el.querySelector('[data-k=short]').value=d[6];

  cards.append(el);
});

// ========================================
// メンバーカードライブラリ接続
// ========================================

const MEMBER_CARD_STORAGE_KEY =
  'holodori-member-card-library-v1';


function loadMemberCardLibrary(){

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
      'メンバーカードライブラリを読み込めませんでした',
      error
    );

    return [];
  }
}


function saveMemberCardLibrary(data){

  localStorage.setItem(
    MEMBER_CARD_STORAGE_KEY,
    JSON.stringify(data)
  );
}


function createLibraryCardId(){

  return (
    'card-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2,8)
  );
}


function getMasterMember(memberId){

  return HOLO_MEMBERS.find(
    member =>
      member.id === memberId
  );
}


function getMasterMemberByName(name){

  const target =
    name.trim();

  return HOLO_MEMBERS.find(
    member =>
      member.name === target
  );
}

// ========================================
// 現在の枠 → ライブラリ保存
// ========================================

document.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-save-library]'
      );

    if(!button){
      return;
    }


    const slotIndex =
      Number(
        button.dataset.saveLibrary
      );

    const card =
      document.querySelectorAll('.card')[
        slotIndex
      ];

    if(!card){
      return;
    }


    const get =
      key =>
        card.querySelector(
          `[data-k="${key}"]`
        ).value;


    const memberId =
      get('memberId');

    const member =
      getMasterMember(memberId);

    if(!member){

      alert(
        'メンバーを選択してください。'
      );

      return;
    }


    const costume =
      get('costume').trim();


    if(!costume){

      alert(
        '衣装名を入力してください。'
      );

      return;
    }


    const library =
      loadMemberCardLibrary();


    const newCard = {

      id:
        createLibraryCardId(),

      // ===== Member =====

      memberId:
        member.id,


      // ===== Member Card =====

      costume,

      // カード固有タイプ
      // 現在は予約領域
      characterType: '',


      // ===== Status =====
      // 現在は予約領域
      stats: {},


      // ===== Active Skill =====
      // 現在実装済み
      // 互換性維持のため当面フラット構造

      interval:
        Number(get('interval')),

      prob:
        get('prob'),

      duration:
        Number(get('duration')),

      boost:
        Number(get('boost')),


      // ===== Costume Skill =====
      // 現在は保存領域のみ
      // UI・計算から未参照

      costumeSkill: {},


      // ===== Special Skill =====
      // 現在は保存領域のみ
      // UI・計算から未参照

      specialSkill: {},


            // ===== Passive Skill =====
      // 現在は保存領域のみ
      // UI・計算から未参照

      passiveSkill: {}
    };

    library.push(
      newCard
    );

    saveMemberCardLibrary(
      library
    );

    alert(
      `${member.name} / ${costume} を保存しました。`
    );
  }
);

// ========================================
// ライブラリ呼出
// ========================================

// ========================================
// ライブラリ呼出
// ========================================

const cardLoadModal =
  document.querySelector(
    '#cardLoadModal'
  );

const cardLoadList =
  document.querySelector(
    '#cardLoadList'
  );

const cardLoadTarget =
  document.querySelector(
    '#cardLoadTarget'
  );


let loadTargetSlot =
  null;


function openCardLoadModal(slotIndex){

  loadTargetSlot =
    slotIndex;

  const library =
    loadMemberCardLibrary();


  cardLoadList.innerHTML =
    '';

  cardLoadTarget.textContent =
    `読込先：枠${slotIndex + 1}`;


  if(library.length === 0){

    cardLoadList.innerHTML =
      '<div class="libraryEmpty">' +
      '保存済みカードがありません。' +
      '</div>';

    cardLoadModal.hidden =
      false;

    return;
  }


  const sorted =
    [...library].sort(
      (a,b) => {

        const memberA =
          getMasterMember(a.memberId);

        const memberB =
          getMasterMember(b.memberId);

        const nameA =
          memberA
            ? memberA.name
            : '';

        const nameB =
          memberB
            ? memberB.name
            : '';

        const memberCompare =
          nameA.localeCompare(
            nameB,
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


  sorted.forEach(
    libraryCard => {

      const member =
        getMasterMember(
          libraryCard.memberId
        );


      const button =
        document.createElement(
          'button'
        );

      button.type =
        'button';

      button.className =
        'cardLoadItem';


      const probability =
        libraryCard.prob === 'low'
          ? '低'
          : libraryCard.prob === 'high'
            ? '高'
            : '中';


      button.innerHTML = `
        <strong>
          ${member
            ? member.name
            : '不明なメンバー'}
          /
          ${libraryCard.costume}
        </strong>

        <span>
          ${libraryCard.interval}s周期 /
          ${probability} /
          ${libraryCard.duration}s /
          +${libraryCard.boost}%
        </span>
      `;


      button.addEventListener(
        'click',
        () => {

          loadLibraryCardIntoSlot(
            libraryCard,
            slotIndex
          );

          closeCardLoadModal();
        }
      );


      cardLoadList.append(
        button
      );
    }
  );


  cardLoadModal.hidden =
    false;
}


function closeCardLoadModal(){

  cardLoadModal.hidden =
    true;

  loadTargetSlot =
    null;
}

function loadLibraryCardIntoSlot(
  libraryCard,
  slotIndex
){

  const card =
    document.querySelectorAll('.card')[
      slotIndex
    ];

  if(!card){
    return;
  }


  const member =
    getMasterMember(
      libraryCard.memberId
    );


  if(!member){

    alert(
      '対応するメンバーが members.js にありません。'
    );

    return;
  }


  const set =
    (key,value) => {

      const input =
        card.querySelector(
          `[data-k="${key}"]`
        );

      if(input){
        input.value =
          value;
      }
    };


  // 短縮率には触らない
  set(
  'memberId',
  libraryCard.memberId
);

  set(
    'costume',
    libraryCard.costume
  );

  set(
    'interval',
    libraryCard.interval
  );

  set(
    'prob',
    libraryCard.prob
  );

  set(
    'duration',
    libraryCard.duration
  );

  set(
    'boost',
    libraryCard.boost
  );


  // 現在状態として保存
  saveState();


  // タイムライン再計算
  render();


  // 最適化欄の名前も更新
  updateOptimizeNames();
}



function num(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f}
function getMembers(){
  return [...document.querySelectorAll('.card')].map((c,i)=>{

    const g = k =>
      c.querySelector(`[data-k="${k}"]`)?.value ?? '';

    const memberId = g('memberId');

    const member =
      HOLO_MEMBERS.find(
        m => m.id === memberId
      );

    return {
      slot: i + 1,

      memberId,

      name:
        member?.name ||
        `枠${i+1}`,

      generation:
        member?.generation || '',

      costume:
        g('costume'),

      interval:
        Math.max(
          0,
          num(g('interval'),0)
        ),

      prob:
        g('prob'),

      duration:
        Math.max(
          0,
          num(g('duration'))
        ),

      boost:
        Math.max(
          0,
          num(g('boost'))
        ),

      short:
        num(g('short'))
    };
  });
}
// 発動頻度UP：実効周期 = 基礎周期 / (1 + 発動頻度アップ率)
function adjustedInterval(m){
  return m.interval > 0
    ? m.interval / (1 + m.short / 100)
    : 0;
}

function events(m,T){const iv=adjustedInterval(m),out=[];if(iv<=0||m.duration<=0||m.boost<=0)return out;for(let t=iv;t<=T+1e-9&&out.length<1000;t+=iv)out.push({start:t,end:Math.min(T,t+m.duration),boost:m.boost,m});return out}
function calcMax(all,T){const pts=[0,T];all.forEach(e=>{pts.push(e.start,e.end)});pts.sort((a,b)=>a-b);let total=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(b<=a)continue;const mid=(a+b)/2;let mx=0;for(const e of all)if(e.start<=mid&&mid<e.end)mx=Math.max(mx,e.boost);total+=mx*(b-a)}return total}

// ===== 短縮率最適化 =====

const SHORT_OPTIONS = [0, 4, 8, 12];

const optimizeLimits =
  document.querySelector('#optimizeLimits');

for(let i = 0; i < 5; i++){
  const label = document.createElement('label');
  label.className = 'optimizeLimit';

  label.innerHTML = `
    <span data-limit-name="${i}">${i + 1}. 枠${i + 1}</span>
    <select data-limit="${i}">
      <option value="0">最大 0%</option>
      <option value="4">最大 4%</option>
      <option value="8">最大 8%</option>
      <option value="12" selected>最大 12%</option>
    </select>
  `;

  optimizeLimits.append(label);
}

function optimizeShortRates(members, T, limits){
  let best = null;
  let tested = 0;

  const candidates = limits.map(limit =>
    SHORT_OPTIONS.filter(v => v <= limit)
  );

  function search(index, shorts){
    if(index < members.length){
      for(const value of candidates[index]){
        shorts.push(value);
        search(index + 1, shorts);
        shorts.pop();
      }
      return;
    }

    tested++;

    const testMembers = members.map((m, i) => ({
      ...m,
      short: shorts[i]
    }));

    const by = testMembers.map(m => events(m, T));
    const all = by.flat();
    const score = calcMax(all, T);

    if(
      best === null ||
      score > best.score + 1e-9
    ){
      best = {
        score,
        shorts: [...shorts],
        members: testMembers,
        by,
        all
      };
    }
  }

  search(0, []);

  return {
    ...best,
    tested
  };
}

function renderOptimizedTimeline(result, T, currentScore){
  let area = document.querySelector('#optimizedTimeline');

  if(!area){
    area = document.createElement('div');
    area.id = 'optimizedTimeline';
    area.className = 'optimizeTimeline';

    document.querySelector('#timeline').after(area);
  }

  area.innerHTML = '';

  const improvement = result.score - currentScore;
  const improvementRate =
    currentScore > 0
      ? improvement / currentScore * 100
      : 0;

  const header = document.createElement('div');
  header.className = 'optimizeHeader';

  header.innerHTML = `
    <strong>短縮率最適化</strong>
    <span class="optimizeScore">
      現在 ${currentScore.toFixed(2)}
      →
      最適 ${result.score.toFixed(2)}
      /
      差分 ${improvement >= 0 ? '+' : ''}${improvement.toFixed(2)}
      (${improvementRate >= 0 ? '+' : ''}${improvementRate.toFixed(2)}%)
    </span>
  `;

  area.append(header);


  // 各枠の最適短縮率
  const shorts = document.createElement('div');
  shorts.className = 'optimizeShorts';

  result.members.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'optimizeShort';

    item.textContent =
      `${i + 1}. ${m.name}：${result.shorts[i]}%`;

    shorts.append(item);
  });

  area.append(shorts);


  // ===== 統合Active TL =====

  const activeRow = document.createElement('div');
  activeRow.className = 'row maxrow';

  activeRow.innerHTML = `
    <div></div>
    <div class="track"></div>
  `;

  const activeTrack = activeRow.lastElementChild;

  maxSegments(result.all, T).forEach(seg => {
    const b = document.createElement('button');

    b.type = 'button';
    b.className = `bar active-slot${seg.slot}`;

    b.style.left = (seg.start / T * 100) + '%';
    b.style.width =
      ((seg.end - seg.start) / T * 100) + '%';

    b.title =
      `枠${seg.slot} / ` +
      `${seg.start.toFixed(2)}–${seg.end.toFixed(2)}s / ` +
      `+${seg.boost.toFixed(2)}%`;

    activeTrack.append(b);
  });

  area.append(activeRow);


  // ===== 時間目盛り =====

  const axis = document.createElement('div');
  axis.className = 'axis';

  axis.innerHTML =
    '<div></div><div class="axisTrack"></div>';

  const axisTrack = axis.lastElementChild;

  for(let i = 0; i <= 10; i++){
    const x = i * 10;
    const t = T * i / 10;

    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.left = x + '%';

    tick.innerHTML =
      `<span>${t.toFixed(2)}</span>`;

    axisTrack.append(tick);
  }

  area.append(axis);


  // ===== 5人の最適化後TL =====

  result.members.forEach((m, i) => {
    const row = document.createElement('div');

    row.className =
      `row slot${i + 1}`;

    row.innerHTML = `
      <div class="name">
        ${m.slot}. ${m.name}
        <br>
        <span class="sub">
          ${adjustedInterval(m).toFixed(2)}s周期
          / 短縮 ${result.shorts[i]}%
        </span>
      </div>
      <div class="track"></div>
    `;

    const track = row.lastElementChild;

    result.by[i].forEach((e, n) => {
      const b = document.createElement('button');

      b.type = 'button';
      b.className = 'bar';

      b.style.left =
        (e.start / T * 100) + '%';

      b.style.width =
        ((e.end - e.start) / T * 100) + '%';

      b.title =
        `${e.start.toFixed(2)}–${e.end.toFixed(2)}s`;

      b.addEventListener('click', () => {
        document.querySelector('#detail').textContent =
          `${m.name} / ${m.costume || '衣装未入力'} — ` +
          `最適化 第${n + 1}候補 ` +
          `${e.start.toFixed(2)}s → ${e.end.toFixed(2)}s / ` +
          `+${m.boost.toFixed(2)}% / ` +
          `短縮 ${result.shorts[i]}%`;
      });

      track.append(b);
    });

    area.append(row);
  });
}

function maxSegments(all,T){
  const pts=[0,T];

  all.forEach(e=>{
    pts.push(e.start,e.end);
  });

  pts.sort((a,b)=>a-b);

  const segments=[];

  for(let i=0;i<pts.length-1;i++){
    const a=pts[i];
    const b=pts[i+1];

    if(b<=a) continue;

    const mid=(a+b)/2;
    let winner=null;

    for(const e of all){
      if(
        e.start<=mid &&
        mid<e.end &&
        (!winner || e.boost>winner.boost)
      ){
        winner=e;
      }
    }

    if(winner){
      const slot=winner.m.slot;
      const prev=segments[segments.length-1];

      if(
        prev &&
        Math.abs(prev.end-a)<1e-9 &&
        prev.boost===winner.boost &&
        prev.slot===slot
      ){
        prev.end=b;
      }else{
        segments.push({
          start:a,
          end:b,
          boost:winner.boost,
          slot
        });
      }
    }
  }

  return segments;
}
function render(){const T=Math.max(.01,num(document.querySelector('#song').value,120)),ms=getMembers(),by=ms.map(m=>events(m,T)),all=by.flat(),max=calcMax(all,T);document.querySelector('#max').textContent=max.toFixed(2);document.querySelector('#avg').textContent=`+${(max/T).toFixed(2)}%`;document.querySelector('#count').textContent=all.length;const tl=document.querySelector('#timeline');tl.innerHTML='';

const activeRow=document.createElement('div');
activeRow.className='row maxrow';

activeRow.innerHTML=`
  <div class="name"></div>
  <div class="track"></div>
`;

const activeTrack=activeRow.lastElementChild;

maxSegments(all,T).forEach(seg=>{
  const b=document.createElement('button');

  b.type='button';
  b.className=`bar active-slot${seg.slot}`;

  b.style.left=(seg.start/T*100)+'%';
  b.style.width=((seg.end-seg.start)/T*100)+'%';

  b.title=
    `枠${seg.slot} / ${seg.start.toFixed(2)}–${seg.end.toFixed(2)}s / +${seg.boost.toFixed(2)}%`;

  b.addEventListener('click',()=>{
    document.querySelector('#detail').textContent=
      `Activeタイムライン — 枠${seg.slot} / ${seg.start.toFixed(2)}s → ${seg.end.toFixed(2)}s / 有効補正 +${seg.boost.toFixed(2)}%`;
  });

  activeTrack.append(b);
});

tl.append(activeRow);

const axis=document.createElement('div');axis.className='axis';axis.innerHTML='<div></div><div class="axisTrack"></div>';const at=axis.lastElementChild;for(let i=0;i<=10;i++){const x=i*10,t=T*i/10,d=document.createElement('div');d.className='tick';d.style.left=x+'%';d.innerHTML=`<span>${t.toFixed(2)}</span>`;at.append(d)}tl.append(axis);

ms.forEach((m,i)=>{const row=document.createElement('div');row.className=`row slot${i+1}`;row.innerHTML=`<div class="name">${m.slot}. ${m.name}<br><span class="sub">${m.interval>0?adjustedInterval(m).toFixed(2)+'s周期':'未入力'}</span></div><div class="track"></div>`;const tr=row.lastElementChild;by[i].forEach((e,n)=>{const b=document.createElement('button');b.type='button';b.className='bar';b.style.left=(e.start/T*100)+'%';b.style.width=(Math.max(0,e.end-e.start)/T*100)+'%';b.title=`${e.start.toFixed(2)}–${e.end.toFixed(2)}s`;b.addEventListener('click',()=>{document.querySelector('#detail').textContent=`${m.name} / ${m.costume||'衣装未入力'} — 第${n+1}候補 ${e.start.toFixed(2)}s → ${e.end.toFixed(2)}s / ${m.prob==='low'?'低':m.prob==='mid'?'中':'高'} ${probs[m.prob].toFixed(2)}% / +${m.boost.toFixed(2)}% / 短縮 ${m.short.toFixed(2)}%`});tr.append(b)});tl.append(row)})}
// ===== 入力状態の保存・復元 =====
const STORAGE_KEY = 'holodori-active-input-v1';

function saveState(){
  const state = {
    song: document.querySelector('#song').value,
    members: [...document.querySelectorAll('.card')].map(card => {
      const get = key => card.querySelector(`[data-k="${key}"]`).value;

      return {
        memberId: get('memberId'),
        costume: get('costume'),
        interval: get('interval'),
        prob: get('prob'),
        duration: get('duration'),
        boost: get('boost'),
        short: get('short')
      };
    })
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved) return;

  try{
    const state = JSON.parse(saved);

    if(state.song !== undefined){
      document.querySelector('#song').value = state.song;
    }

    if(Array.isArray(state.members)){
      const cards = [...document.querySelectorAll('.card')];

      state.members.forEach((member, i) => {
        const card = cards[i];
        if(!card) return;

        Object.entries(member).forEach(([key, value]) => {
          const input = card.querySelector(`[data-k="${key}"]`);
          if(input) input.value = value;
        });
      });
    }
  }catch(error){
    console.warn('保存データを読み込めませんでした', error);
  }
}


// 入力するたびに保存して再描画
document.addEventListener('input', e => {
  if(e.target.closest('.wrap')){
    saveState();
    render();
  }
});

document.addEventListener('change', e => {
  if(e.target.closest('.wrap')){
    saveState();
    render();
  }
});

// ===== 最適化探索ボタン =====

document.querySelector('#optimizeBtn')
  .addEventListener('click', () => {

    const button =
      document.querySelector('#optimizeBtn');

    const resultText =
      document.querySelector('#optimizeResult');

    const T = Math.max(
      .01,
      num(document.querySelector('#song').value, 120)
    );

    const members = getMembers();

    const limits =
  [...document.querySelectorAll('[data-limit]')]
    .map(el => num(el.value, 12));

    button.disabled = true;
    button.textContent = '計算中...';

    // 現在設定での評価値
    const currentBy =
      members.map(m => events(m, T));

    const currentScore =
      calcMax(currentBy.flat(), T);

    const result =
      optimizeShortRates(members, T, limits);

    renderOptimizedTimeline(
      result,
      T,
      currentScore
    );

    resultText.textContent =
      `探索完了：${result.tested}通り`;

    button.disabled = false;
    button.textContent = '最適化探索';
  });

// ページ読み込み時に前回の入力を復元
loadState();

function updateOptimizeNames(){
  const members = getMembers();

  members.forEach((m, i) => {
    const el =
      document.querySelector(`[data-limit-name="${i}"]`);

    if(el){
      el.textContent = `${i + 1}. ${m.name}`;
    }
  });
}

render();
updateOptimizeNames();