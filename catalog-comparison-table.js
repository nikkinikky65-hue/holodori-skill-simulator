const CatalogComparisonTable = (() => {
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  function mount(root,config){
    let cards=[],states={},sortKey=null,direction=1;
    const controls=el('div');controls.className='catalogSPControls';
    function selector(caption,options){const label=el('label',caption+' '),select=el('select');for(const [value,text] of options)select.append(new Option(text,value));label.append(select);controls.append(label);select.addEventListener('change',render);return select;}
    const mode=selector('育成状態',[['initial','初期値'],['saved','保存状態'],['max','最大育成'],['custom','カスタム']]);mode.dataset.spGrowth='';
    const custom=selector('開花',[['initial','初期'],['saved','保存'],['max','最大']]);custom.dataset.spCustom='';
    const training=config.training?selector('特訓',[['initial','初期'],['saved','保存'],['max','最大']]):null;
    if(training)training.dataset.comparisonTraining='';
    const note=el('p',config.note);note.className='sub';
    const sortNote=el('p',config.sortNote||'複数効果はすべて表示し、数値ソートでは表示順に比較します。「—」は昇順・降順とも末尾です。');sortNote.className='sub';
    const scroll=el('div');scroll.className='catalogSPScroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',config.title+'表（横スクロール）');
    const floating=el('div');floating.className='catalogSPFloating';floating.hidden=true;
    floating.setAttribute('aria-label',config.title+'の固定見出し');
    root.append(controls,note,sortNote,scroll,floating);
    function syncHeader(){
      const table=scroll.querySelector('table'),head=table?.tHead;
      if(!head||root.hidden||!table.tBodies[0]?.rows.length){floating.hidden=true;return;}
      const nav=document.querySelector('.siteHeader'),top=Math.max(0,nav?.getBoundingClientRect().bottom||0);
      const r=scroll.getBoundingClientRect(),hr=head.getBoundingClientRect(),height=hr.height;
      scroll.style.setProperty('--sp-thumb-offset',head.rows[0].cells[0].getBoundingClientRect().width+'px');
      floating.hidden=hr.top>=top || r.bottom<=top+height;
      if(floating.hidden)return;
      Object.assign(floating.style,{top:top+'px',left:(r.left+scroll.clientLeft)+'px',width:scroll.clientWidth+'px',height:height+'px'});
      const copy=floating.querySelector('table');copy.style.width=table.getBoundingClientRect().width+'px';
      copy.style.setProperty('--sp-thumb-offset',head.rows[0].cells[0].getBoundingClientRect().width+'px');
      [...head.rows[0].cells].forEach((cell,i)=>copy.tHead.rows[0].cells[i].style.width=cell.getBoundingClientRect().width+'px');
      floating.scrollLeft=scroll.scrollLeft;
    }
    const schedule=syncHeader;
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    scroll.addEventListener('scroll',syncHeader,{passive:true});
    new ResizeObserver(schedule).observe(scroll);
    const nav=document.querySelector('.siteHeader');if(nav)new ResizeObserver(schedule).observe(nav);
    new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['hidden']});
    floating.addEventListener('click',event=>{const key=event.target.closest('[data-sp-sort]')?.dataset.spSort;if(key)scroll.querySelector('[data-sp-sort="'+key+'"]').click();});
    function render(){
      custom.parentElement.hidden=mode.value!=='custom';
      if(training)training.parentElement.hidden=mode.value!=='custom';
      const ordered=sortKey==='name'?CatalogComparisonOrder.sortByAffiliation(cards,direction):cards;
      const rows=ordered.map(card=>config.project(card,getUserCardState(card.id,states),mode.value,custom.value,training?.value));
      if(sortKey && sortKey!=='name')rows.sort((a,b)=>CatalogComparisonOrder.compare(a,b,sortKey,direction));
      const table=el('table');table.className='catalogSPTable';const caption=el('caption',config.caption);table.append(caption);
      const head=el('thead'),tr=el('tr');
      for(const [key,label] of [['image',''],['name','カード名／タレント名'],...config.columns]){
        const th=el('th');th.scope='col';
        if(key==='name'||config.numeric.includes(key)){const button=el('button',label+(sortKey===key?(direction===1?' ▲':' ▼'):''));button.type='button';button.dataset.spSort=key;button.addEventListener('click',()=>{direction=sortKey===key?-direction:1;sortKey=key;render();});th.setAttribute('aria-sort',sortKey===key?(direction===1?'ascending':'descending'):'none');th.append(button);}else th.textContent=label;
        if(key==='image')th.setAttribute('aria-label','カード画像');
        if(key==='name')th.title='所属・期生順（同一期生内は図鑑順を維持）';
        tr.append(th);
      }
      head.append(tr);table.append(head);const body=el('tbody');
      for(const row of rows){
        const tr=el('tr');tr.dataset.cardId=row.card.id;tr.dataset.spLevel=row.level??'';
        const picture=el('td'),box=el('div'),placeholder=el('span','画像なし');box.className='catalogSPThumb';box.append(placeholder);picture.append(box);
        const thumb=CardImageResolver.candidates(row.card.id).find(c=>c.kind==='thumb');
        if(thumb){
          const image=el('img');image.alt='';image.width=32;image.height=32;image.loading='lazy';image.decoding='async';
          // Keep the loaded node attached; only change the placeholder, not the image DOM.
          image.onload=()=>{if(image.naturalWidth>0)placeholder.remove();};
          image.onerror=()=>{image.remove();if(!placeholder.isConnected)box.append(placeholder);};
          box.append(image);image.src=thumb.url;
        }
        const name=el('td');name.append(el('strong',row.card.name),el('span',row.card.member.name));
        for(const message of [row.error,...row.unknown].filter(Boolean)){const warning=el('small','未対応：'+message);name.append(warning);}
        tr.append(picture,name);
        for(const key of config.columns.map(([key])=>key)){const cell=el('td');cell.dataset.spField=key;
          if(!row[key].length)cell.textContent='—';
          for(const effect of row[key]){const line=el('div',effect.text);if(effect.condition)line.append(el('small',effect.condition));cell.append(line);}tr.append(cell);}
        body.append(tr);
      }
      table.append(body);const left=scroll.scrollLeft;scroll.replaceChildren(table);scroll.scrollLeft=left;
      const copy=el('table');copy.className='catalogSPTable';copy.append(head.cloneNode(true));floating.replaceChildren(copy);
      schedule();
    }
    return {render(nextCards,nextStates){cards=nextCards;states=nextStates;render();}};
  }
  return {mount};
})();
