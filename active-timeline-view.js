// Shared A/unit Timeline UI. Calculation stays in ActiveTimelineEngine.
const ActiveTimelineView = {
 render({container,detail,members:ms,eventsByMember:by,duration:T,probabilities,specialSchedule=null,segments=null}){
 const all=by.flat();
  const tl = container;

  tl.innerHTML = '';


  // ========================================
  // 統合Activeタイムライン
  // ========================================

  const activeRow =
    document.createElement('div');

  activeRow.className =
    'row maxrow';

  activeRow.innerHTML = `
    <div class="name"></div>
    <div class="track"></div>
  `;

  const activeTrack =
    activeRow.lastElementChild;


  (segments || ActiveTimelineEngine.maxSegments(
    all,
    T
  )).forEach(seg => {

    const b =
      document.createElement('button');

    b.type =
      'button';

    b.className =
      `bar active-slot${seg.slot}`;

    b.style.left =
      (seg.start / T * 100) + '%';

    b.style.width =
      (
        (seg.end - seg.start) /
        T *
        100
      ) + '%';

    b.title =
      `枠${seg.slot} / ` +
      `${seg.start.toFixed(2)}–${seg.end.toFixed(2)}s / ` +
      `+${seg.boost.toFixed(2)}%`;


    b.addEventListener(
      'click',
      () => {

        detail.textContent =
          `Activeタイムライン — ` +
          `枠${seg.slot} / ` +
          `${seg.start.toFixed(2)}s → ` +
          `${seg.end.toFixed(2)}s / ` +
          `有効補正 +${seg.boost.toFixed(2)}%`;
      }
    );


    activeTrack.append(b);
  });


  tl.append(activeRow);


  // ========================================
  // 時間目盛り
  // ========================================

  const axis =
    document.createElement('div');

  axis.className =
    'axis';

  axis.innerHTML =
    '<div></div>' +
    '<div class="axisTrack"></div>';

  const axisTrack =
    axis.lastElementChild;


  for(let i = 0; i <= 10; i++){

    const x =
      i * 10;

    const t =
      T * i / 10;

    const tick =
      document.createElement('div');

    tick.className =
      'tick';

    tick.style.left =
      x + '%';

    tick.innerHTML =
      `<span>${t.toFixed(2)}</span>`;

    axisTrack.append(tick);
  }


  tl.append(axis);


  // ========================================
  // 各メンバーのActiveタイムライン
  // ========================================

  ms.forEach(
    (m,i) => {

      const row =
        document.createElement('div');

      row.className =
        `row slot${i + 1}`;

      row.innerHTML = `
        <div class="name">
          ${m.slot}. ${m.name}
          <br>
          <span class="sub">
            ${
              m.interval > 0
                ? ActiveTimelineEngine.adjustedInterval(m).toFixed(2) +
                  's周期'
                : '未入力'
            }
          </span>
        </div>

        <div class="track"></div>
      `;


      const track =
        row.lastElementChild;


      const special=specialSchedule?.status==='resolved' ? specialSchedule.entries.find(entry=>entry.slot===m.slot) : null;
      if(special){
        const background=document.createElement('div');
        background.className='spInterval';
        background.style.left=(special.start/T*100)+'%';
        background.style.width=(special.duration/T*100)+'%';
        background.textContent='SP';
        background.title=`SP ${special.start.toFixed(2)}–${special.end.toFixed(2)}s / Support ${special.scoreSupportRate}%`;
        background.setAttribute('aria-label',background.title);
        track.append(background);
      }

      by[i].forEach(
        (e,n) => {

          const b =
            document.createElement('button');

          b.type =
            'button';

          b.className =
            'bar';

          b.style.left =
            (e.start / T * 100) + '%';

          b.style.width =
            (
              Math.max(
                0,
                e.end - e.start
              ) /
              T *
              100
            ) + '%';

          b.title =
            `${e.start.toFixed(2)}–` +
            `${e.end.toFixed(2)}s`;


          b.addEventListener(
            'click',
            () => {

              detail.textContent =
                `${m.name} / ` +
                `${m.costume || '衣装未入力'} — ` +
                `第${n + 1}候補 ` +
                `${e.start.toFixed(2)}s → ` +
                `${e.end.toFixed(2)}s / ` +
                `${
                  m.prob === 'low'
                    ? '低'
                    : m.prob === 'mid'
                      ? '中'
                      : '高'
                } ` +
                `${probabilities[m.prob].toFixed(2)}% / ` +
                `+${m.boost.toFixed(2)}% / ` +
                `発動頻度UP ${m.short.toFixed(2)}%`;
            }
          );


          track.append(b);
        }
      );


      tl.append(row);
    }
  );
 }
};
