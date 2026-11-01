const CatalogSPTable = (() => {
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  function mount(root){
    let cards=[],states={},sortKey=null,direction=1;
    const controls=el('div');controls.className='catalogSPControls';
    function selector(caption,options){const label=el('label',caption+' '),select=el('select');for(const [value,text] of options)select.append(new Option(text,value));label.append(select);controls.append(label);select.addEventListener('change',render);return select;}
    const mode=selector('育成状態',[['initial','初期値'],['saved','保存状態'],['max','最大育成'],['custom','カスタム']]);mode.dataset.spGrowth='';
    const custom=selector('開花',[['initial','初期'],['saved','保存'],['max','最大']]);custom.dataset.spCustom='';
    const note=el('p','SPに影響する開花のみを切り替えます。初期は開花0、最大は開花5。保存なしは初期値です。特訓はSP性能に影響しません。条件は評価せず併記します。発動率UPはActiveへの補正で、SP自体の発動確率ではありません。');note.className='sub';
    const sortNote=el('p','複数効果はすべて表示し、数値ソートでは表示順に比較します。「—」は昇順・降順とも末尾です。');sortNote.className='sub';
    const scroll=el('div');scroll.className='catalogSPScroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','SP比較表（縦横スクロール）');
    root.append(controls,note,sortNote,scroll);
    function render(){
      custom.parentElement.hidden=mode.value!=='custom';
      const rows=cards.map(card=>CatalogSPData.project(card,getUserCardState(card.id,states),mode.value,custom.value));
      if(sortKey)rows.sort((a,b)=>CatalogSPData.compare(a,b,sortKey,direction));
      const table=el('table');table.className='catalogSPTable';const caption=el('caption','SP比較（原データの効果量。編成内での発動・適用結果ではありません）');table.append(caption);
      const head=el('thead'),tr=el('tr');
      for(const [key,label] of [['image','Thumb'],['name','カード名／タレント名'],['time','効果時間'],['support','効果量（スコアサポート）'],['probability','発動率UP（%）'],['life','ライフ回復'],['judgement','判定強化']]){
        const th=el('th');th.scope='col';
        if(['time','support','probability','life'].includes(key)){const button=el('button',label+(sortKey===key?(direction===1?' ▲':' ▼'):''));button.type='button';button.dataset.spSort=key;button.addEventListener('click',()=>{direction=sortKey===key?-direction:1;sortKey=key;render();});th.setAttribute('aria-sort',sortKey===key?(direction===1?'ascending':'descending'):'none');th.append(button);}else th.textContent=label;
        tr.append(th);
      }
      head.append(tr);table.append(head);const body=el('tbody');
      for(const row of rows){
        const tr=el('tr');tr.dataset.cardId=row.card.id;tr.dataset.spLevel=row.level??'';
        const picture=el('td'),box=el('div','画像なし');box.className='catalogSPThumb';picture.append(box);
        const thumb=CardImageResolver.candidates(row.card.id).find(c=>c.kind==='thumb');
        if(thumb){const image=el('img');image.alt='';image.loading='lazy';image.decoding='async';image.onload=()=>box.replaceChildren(image);image.onerror=()=>image.remove();image.src=thumb.url;box.append(image);}
        const name=el('td');name.append(el('strong',row.card.name),el('span',row.card.member.name),el('small',row.level===null?'SP未確認':`SP Lv.${row.level}`));
        for(const message of [row.error,...row.unknown].filter(Boolean)){const warning=el('small','未対応：'+message);name.append(warning);}
        tr.append(picture,name);
        for(const key of ['time','support','probability','life','judgement']){const cell=el('td');cell.dataset.spField=key;
          if(!row[key].length)cell.textContent='—';
          for(const effect of row[key]){const line=el('div',effect.text);if(effect.condition)line.append(el('small',effect.condition));cell.append(line);}tr.append(cell);}
        body.append(tr);
      }
      table.append(body);scroll.replaceChildren(table);
    }
    return {render(nextCards,nextStates){cards=nextCards;states=nextStates;render();}};
  }
  return {mount};
})();
