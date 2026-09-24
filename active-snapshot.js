// 通常のrender()が使用したデータを、参照を共有しないplain objectへ変換する。
// 最適化候補の計算・参照、再描画、保存は行わない。
function createActiveTimelineSnapshot(){
  if(!currentActiveTimelineData) throw new Error('通常タイムラインがまだ計算されていません。');
  const { songDuration, members, eventsByMember, maxScore } = currentActiveTimelineData;
  return {
    version: 1,
    songDuration,
    formation: {
      // 選択欄は「呼出済み編成」とは限らないため、関連を推測しない。
      id: null,
      name: null,
      leaderCardId: document.querySelector('#formationLeader')?.value || null
    },
    maxScore,
    activeTimeline: members.map((member, index) => ({
      slot: member.slot,
      cardId: member.libraryCardId || null,
      memberId: member.memberId || null,
      memberName: member.name,
      baseInterval: member.interval,
      effectiveInterval: adjustedInterval(member),
      frequencyUpPercent: member.short,
      probability: member.prob,
      duration: member.duration,
      baseBoost: member.baseBoost,
      scoreSupportBoost: member.scoreSupportBoost,
      boost: member.boost,
      activationTimes: eventsByMember[index].map(event => event.start)
    }))
  };
}

async function copyActiveTimelineSnapshot(){
  const status = document.querySelector('#activeSnapshotStatus');
  const fallback = document.querySelector('#activeSnapshotFallback');
  const text = document.querySelector('#activeSnapshotText');
  let json;
  try{
    json = JSON.stringify(createActiveTimelineSnapshot(), null, 2);
  }catch(error){
    status.textContent = error.message;
    return;
  }
  try{
    await navigator.clipboard.writeText(json);
    fallback.hidden = true;
    text.value = '';
    status.textContent = '解析用JSONをコピーしました';
  }catch(error){
    text.value = json;
    fallback.hidden = false;
    text.focus();
    text.select();
    status.textContent = '自動コピーできませんでした。表示されたJSONを手動でコピーしてください。';
  }
}

document.querySelector('#copyActiveSnapshot').addEventListener('click', copyActiveTimelineSnapshot);
