const unitFormationsReady=(async()=>{
  const status=document.getElementById('formationStatus'),container=document.getElementById('formationCards');
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  let cards=[],leaders=[];
  try{
    const responses=await Promise.all([fetch('data/runtime-cards.json'),fetch('data/leader-parameter-rules.json')]);
    if(responses.some(r=>!r.ok))throw Error('カード情報を取得できませんでした。');
    const [catalog,rules]=await Promise.all(responses.map(r=>r.json()));cards=catalog.cards;leaders=rules.leaders;
  }catch(error){status.textContent=error.message+' カード名を確認できません。保存データは保持しています。';}
  const memberLabel=slot=>{const card=cards.find(c=>c.id===slot.cardId);return card?[card.member?.name,card.name].filter(Boolean).join(' / '):slot.cardId?'カード情報を取得できません':'未設定';};
  function thumbnails(slots,members){
    const row=el('div');row.className='formationThumbs';row.setAttribute('role','group');row.setAttribute('aria-label','SLOT 1〜5のカード画像');
    slots.forEach((slot,index)=>{
      const cell=el('div');cell.className='formationThumb';cell.dataset.slot=String(index+1);
      cell.title=`SLOT ${index+1}：${memberLabel(slot)}`;
      const fallback=el('span',slot.cardId?'画像なし':'未設定');fallback.setAttribute('aria-label',cell.title+'・'+fallback.textContent);cell.append(fallback);
      const thumb=slot.cardId?CardImageResolver.candidates(slot.cardId).find(candidate=>candidate.kind==='thumb'):null;
      if(thumb){
        const image=el('img');image.alt=cell.title;image.loading='lazy';image.decoding='async';image.style.visibility='hidden';
        image.onload=()=>{image.style.visibility='visible';fallback.hidden=true;members.children[index].hidden=true;members.hidden=[...members.children].every(item=>item.hidden);};
        image.onerror=()=>{image.remove();fallback.hidden=false;members.children[index].hidden=false;members.hidden=false;};
        image.src=thumb.url;cell.append(image);
      }
      row.append(cell);
    });
    return row;
  }
  function render(){
    const formations=UnitFormationStore.read().formations;container.replaceChildren();
    if(!formations.length){container.append(el('p','保存済み編成はありません。開発中の統合シミュレーターで編成を保存してください。'));return;}
    for(const f of formations){
      const panel=el('section');panel.className='panel savedFormation';panel.dataset.id=f.id;
      panel.append(el('h2',f.name),el('p','リーダー：'+(leaders.find(l=>l.id===f.snapshot.leaderId)?.name||(f.snapshot.leaderId?'リーダー情報を取得できません':'未設定'))));
      const members=el('ol');members.className='formationMembers';
      f.snapshot.slots.forEach((slot,index)=>{const item=el('li',memberLabel(slot));item.value=index+1;members.append(item);});
      panel.append(thumbnails(f.snapshot.slots,members));
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
