const init=Array.from({length:5},()=>['','', '', 'mid', '', '', 0]);
const probs={low:35,mid:45,high:55};
const cards=document.querySelector('#cards');
init.forEach((d,i)=>{const el=document.createElement('div');el.className='card';el.innerHTML=`<label><span class="slot">${i+1}</span>キャラ<input data-k="name" value="${d[0]}"></label><label>衣装<input data-k="costume" value="${d[1]}"></label><label>周期(s)<input data-k="interval" type="number" min="0.01" step="0.01" value="${d[2]}"></label><label>確率<select data-k="prob"><option value="low">低</option><option value="mid">中</option><option value="high">高</option></select></label><label>発動時間(s)<input data-k="duration" type="number" min="0" step="0.01" value="${d[4]}"></label><label>補正(%)<input data-k="boost" type="number" min="0" step="0.01" value="${d[5]}"></label><label>短縮<select data-k="short"><option>0</option><option>4</option><option>8</option><option>12</option></select></label>`;el.querySelector('[data-k=prob]').value=d[3];el.querySelector('[data-k=short]').value=d[6];cards.append(el)});
function num(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f}
function getMembers(){return [...document.querySelectorAll('.card')].map((c,i)=>{const g=k=>c.querySelector(`[data-k=${k}]`).value;return{slot:i+1,name:g('name')||`枠${i+1}`,costume:g('costume'),interval:Math.max(0,num(g('interval'),0)),prob:g('prob'),duration:Math.max(0,num(g('duration'))),boost:Math.max(0,num(g('boost'))),short:num(g('short'))}})}
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

function optimizeShortRates(members, T){
  let best = null;

  for(const s1 of SHORT_OPTIONS){
    for(const s2 of SHORT_OPTIONS){
      for(const s3 of SHORT_OPTIONS){
        for(const s4 of SHORT_OPTIONS){
          for(const s5 of SHORT_OPTIONS){

            const shorts = [s1, s2, s3, s4, s5];

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
        }
      }
    }
  }

  return best;
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
        name: get('name'),
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

    button.disabled = true;
    button.textContent = '計算中...';

    // 現在設定での評価値
    const currentBy =
      members.map(m => events(m, T));

    const currentScore =
      calcMax(currentBy.flat(), T);

    const result =
      optimizeShortRates(members, T);

    renderOptimizedTimeline(
      result,
      T,
      currentScore
    );

    resultText.textContent =
      `探索完了：${SHORT_OPTIONS.length ** members.length}通り`;

    button.disabled = false;
    button.textContent = '最適化探索';
  });

// ページ読み込み時に前回の入力を復元
loadState();
render();