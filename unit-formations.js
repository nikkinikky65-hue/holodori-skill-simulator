const unitFormationsReady=(async()=>{
  const status=document.getElementById('formationStatus'),container=document.getElementById('formationCards');
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  let cards=[],leaders=[],catalog=null,rules=null,affiliations=null;
  const readData=async path=>{try{const response=await fetch(path);return response.ok?await response.json():null;}catch(error){return null;}};
  [catalog,rules,affiliations]=await Promise.all(['data/runtime-cards.json','data/leader-parameter-rules.json','data/runtime-affiliations.json'].map(readData));
  cards=catalog?.cards || [];leaders=rules?.leaders || [];
  if(!catalog)status.textContent='カード情報を取得できません。保存データは保持しています。';
  const memberLabel=slot=>{const card=cards.find(c=>c.id===slot.cardId);return card?[card.member?.name,card.name].filter(Boolean).join(' / '):slot.cardId?'カード情報を取得できません':'未設定';};
  function thumbnails(slots,members,totals){
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
      const column=el('div');column.className='formationThumbColumn';
      const total=el('strong',Number.isFinite(totals[index])?totals[index].toLocaleString('ja-JP',{maximumFractionDigits:8}):'—');
      total.className='formationMemberTotal';total.setAttribute('aria-label',`SLOT ${index+1} 補正後TOTAL ${total.textContent}`);
      const label=el('span','TOTAL');label.className='formationTotalLabel';column.append(cell,label,total);row.append(column);
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
      const result=UnitFormationTotals.calculate({catalog,rules,affiliations},f.snapshot);
      panel.append(thumbnails(f.snapshot.slots,members,result.totals));
      if(result.warning){const note=el('p','未反映の補正あり');note.className='formationTotalWarning';panel.append(note);}
      if(result.reason){const note=el('p','TOTAL：'+result.reason);note.className='formationTotalStatus';panel.append(note);}
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
