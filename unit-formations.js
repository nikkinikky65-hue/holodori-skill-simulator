const unitFormationsReady=(async()=>{
  const status=document.getElementById('formationStatus'),container=document.getElementById('formationCards');
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  let cards=[],leaders=[];
  try{
    const responses=await Promise.all([fetch('data/runtime-cards.json'),fetch('data/leader-parameter-rules.json')]);
    if(responses.some(r=>!r.ok))throw Error('カード情報を取得できませんでした。');
    const [catalog,rules]=await Promise.all(responses.map(r=>r.json()));cards=catalog.cards;leaders=rules.leaders;
  }catch(error){status.textContent=error.message+' IDを表示します。';}
  function render(){
    const formations=UnitFormationStore.read().formations;container.replaceChildren();
    if(!formations.length){container.append(el('p','保存済み編成はありません。開発中の統合シミュレーターで編成を保存してください。'));return;}
    for(const f of formations){
      const panel=el('section');panel.className='panel savedFormation';panel.dataset.id=f.id;
      panel.append(el('h2',f.name),el('p','リーダー：'+(leaders.find(l=>l.id===f.snapshot.leaderId)?.name||f.snapshot.leaderId||'未設定')));
      const members=el('ol');members.className='formationMembers';
      for(const slot of f.snapshot.slots){const card=cards.find(c=>c.id===slot.cardId);members.append(el('li',card?`${card.member?.name||""} / ${card.name} / ${slot.cardId} / 特訓 ${slot.training}・開花 ${slot.bloom}`:slot.cardId||'未設定'));}
      panel.append(members,el('p','更新：'+f.updatedAt));
      const actions=el('div');actions.className='formationActions';
      const link=el('a','読み込む');link.href='unit-simulator.html?formation='+encodeURIComponent(f.id);link.target='_blank';link.rel='noopener';actions.append(link);
      for(const [label,run] of [
        ['名前変更',()=>{const name=prompt('編成名',f.name);if(name!==null)UnitFormationStore.rename(f.id,name);}],
        ['複製',()=>{const name=prompt('複製する編成名',UnitFormationStore.uniqueName(f.name));if(name!==null)UnitFormationStore.duplicate(f.id,name);}],
        ['削除',()=>{if(confirm(`「${f.name}」を削除しますか？`))UnitFormationStore.remove(f.id);}]
      ]){const b=el('button',label);b.type='button';b.addEventListener('click',()=>{try{run();render();}catch(error){status.textContent=error.message;}});actions.append(b);}
      panel.append(actions);container.append(panel);
    }
  }
  const refresh=()=>{try{render();}catch(error){status.textContent=error.message;}};
  window.addEventListener('storage',e=>{if(e.key===UnitFormationStore.key)refresh();});refresh();
})();
