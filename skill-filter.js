// Passive selection dialog. Emits search criteria; does not inspect card data.
const SkillFilter = (() => {
  const conditions=[['','指定なし'],['yes','あり'],['no','なし']];
  const targets=[['self','自身のみ'],['affiliation','所属'],['attribute','カードタイプ']];
  const effects=[['performance','パフォーマンスUP'],['technique','テクニックUP'],['sense','センスUP'],['all','全パラメータUP'],['support','スコアサポート']];
  let serial=0;
  function mount(host,{onApply=()=>{}}={}){
    const copy=s=>({condition:s.condition,targets:[...s.targets],effects:[...s.effects]});
    let committed={condition:'',targets:[],effects:[]},draft=copy(committed);
    const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    const button=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;};
    const prefix='skill-filter-'+(++serial),trigger=button('スキル絞り込み',open),summary=el('span','指定なし');summary.className='skillFilterSummary';summary.setAttribute('role','status');
    trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',prefix);
    const dialog=el('dialog');dialog.id=prefix;dialog.className='skillFilterDialog';dialog.setAttribute('aria-labelledby',prefix+'-title');
    const header=el('header'),title=el('h2','スキル絞り込み：Passive');title.id=prefix+'-title';
    const cancel=button('キャンセル',()=>dialog.close());cancel.autofocus=true;header.append(title,cancel);
    const hint=el('p','各分類内はOR、条件・対象・効果内容の間はANDで検索します。Lv1・Lv2のいずれかの同一効果が一致すれば対象です。');
    const body=el('div');body.className='skillFilterBody';body.append(hint);
    const inputs=[];
    for(const [axis,label,options] of [['condition','発動条件',conditions],['targets','効果対象',targets],['effects','効果内容',effects]]){
      const field=el('fieldset'),legend=el('legend',label);field.append(legend);
      for(const [value,text] of options){
        const label=el('label'),input=el('input');input.type=axis==='condition'?'radio':'checkbox';input.name=prefix+'-'+axis;input.value=value;input.dataset.skillAxis=axis;
        input.addEventListener('change',()=>{if(axis==='condition')draft.condition=value;else draft[axis]=inputs.filter(i=>i.dataset.skillAxis===axis&&i.checked).map(i=>i.value);});
        inputs.push(input);label.append(input,el('span',text));field.append(label);
      }
      body.append(field);
    }
    const footer=el('footer'),clear=button('全解除',()=>{draft={condition:'',targets:[],effects:[]};sync();}),apply=button('適用',()=>{committed=copy(draft);updateSummary();dialog.close();onApply(copy(committed));});
    clear.dataset.skillClear='';apply.dataset.skillApply='';footer.append(clear,apply);dialog.append(header,body,footer);host.append(trigger,summary,dialog);
    function sync(){for(const i of inputs)i.checked=i.dataset.skillAxis==='condition'?draft.condition===i.value:draft[i.dataset.skillAxis].includes(i.value);}
    function updateSummary(){const parts=[];if(committed.condition)parts.push('条件：'+conditions.find(x=>x[0]===committed.condition)[1]);for(const [key,label,options] of [['targets','対象',targets],['effects','効果',effects]])if(committed[key].length)parts.push(label+'：'+options.filter(x=>committed[key].includes(x[0])).map(x=>x[1]).join('・'));summary.textContent=parts.length?'Passive '+parts.join(' / '):'指定なし';}
    function open(){draft=copy(committed);sync();if(!dialog.open)dialog.showModal();}
    dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();});dialog.addEventListener('close',()=>{draft=copy(committed);trigger.focus();});
    dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
    return {open,getSelection:()=>copy(committed)};
  }
  return {mount};
})();
