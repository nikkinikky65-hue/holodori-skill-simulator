// Reusable talent selection only. No card/skill interpretation or persistence.
const TalentFilter = (() => {
  let nextId=0;
  function prepare(members,references=[]){
    const seen=new Set();
    const talents=members.filter(m=>typeof m.id==='string'&&m.id.trim()&&!seen.has(m.id)&&seen.add(m.id)).map(m=>({
      ...TalentPresentation.resolve(m.id,m.name),id:m.id,hasShortName:TalentPresentation.hasShortName(m.id),
      affiliations:[...new Set(m.affiliations?.length?m.affiliations:['所属未確認'])]
    }));
    const names=[...new Set([...talents.map(m=>m.affiliations[0]),...talents.flatMap(m=>m.affiliations)])];
    return {members:talents,groups:names.map(name=>({name,members:talents.filter(m=>m.affiliations.includes(name))})),diagnostics:TalentPresentation.inspect(members,references)};
  }
  function mount(host,{members,references=[],selectedIds=[],onApply=()=>{}}){
    const data=prepare(members,references),known=new Set(data.members.map(m=>m.id));
    let committed=new Set(selectedIds.filter(id=>known.has(id))),draft=new Set(committed);
    const prefix=`talent-filter-${++nextId}`;
    const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
    const button=(text,action)=>{const node=el('button',null,text);node.type='button';node.addEventListener('click',action);return node;};
    const trigger=button('タレント絞り込み',open);
    trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',prefix);
    const selection=el('span','talentFilterSelection');selection.setAttribute('role','status');
    const toolbar=el('div','talentFilterToolbar');toolbar.append(trigger,selection);
    const dialog=el('dialog','talentFilterDialog');dialog.id=prefix;dialog.setAttribute('aria-labelledby',prefix+'-title');dialog.setAttribute('aria-describedby',prefix+'-hint');
    const header=el('header','talentFilterHeader'),title=el('h2',null,'タレント絞り込み');title.id=prefix+'-title';
    const close=button('閉じる',()=>dialog.close());close.autofocus=true;header.append(title,close);
    const hint=el('p','talentFilterHint','選択なしは全タレントが対象です。変更は「適用」で確定します。');hint.id=prefix+'-hint';
    const body=el('div','talentFilterBody'),groupList=el('div','talentFilterGroups');
    const inputs=[];
    data.groups.forEach((group,index)=>{
      const row=el('section','talentFilterGroup'),heading=el('h3',null,group.name);heading.id=prefix+'-group-'+index;
      row.setAttribute('aria-labelledby',heading.id);
      const choices=el('div','talentFilterChoices');
      for(const talent of group.members){
        const label=el('label','talentFilterChoice');label.title=`${talent.formalName}（${talent.id}）`;
        const input=el('input');input.type='checkbox';input.value=talent.id;input.dataset.talentId=talent.id;
        input.addEventListener('change',()=>{if(input.checked)draft.add(talent.id);else draft.delete(talent.id);syncDraft();});
        inputs.push(input);
        const name=el('span','talentFilterName',talent.displayName);label.append(input,name);
        if(!talent.hasShortName)label.append(el('small','talentFilterFallback','略称未登録・正式名'));
        choices.append(label);
      }
      row.append(heading,choices);groupList.append(row);
    });
    const diagnostics=el('details','talentFilterDiagnostics');
    const missing=data.diagnostics.filter(i=>i.code==='missing-short-name').length;
    const collisions=data.diagnostics.filter(i=>i.code==='duplicate-display-name').length;
    const inconsistencies=data.diagnostics.filter(i=>!['missing-short-name','duplicate-display-name'].includes(i.code)).length;
    const summary=el('summary',null,`表示名・IDの確認：略称未登録 ${missing}件 / 表示名重複 ${collisions}件 / その他 ${inconsistencies}件`);
    const list=el('ul');for(const issue of data.diagnostics){const li=el('li',null,issue.message);li.dataset.issueCode=issue.code;list.append(li);}
    if(!data.diagnostics.length)list.append(el('li',null,'検出事項なし'));
    diagnostics.append(summary,list);body.append(groupList,diagnostics);
    const footer=el('footer','talentFilterFooter'),draftStatus=el('span','talentFilterDraftStatus');draftStatus.setAttribute('role','status');
    const clear=button('全解除',()=>{draft.clear();syncDraft();});clear.dataset.talentClear='';
    const apply=button('適用',()=>{committed=new Set(draft);syncSelection();dialog.close();onApply([...committed]);});apply.dataset.talentApply='';
    footer.append(clear,draftStatus,apply);dialog.append(header,hint,body,footer);host.append(toolbar,dialog);
    function syncDraft(){for(const input of inputs)input.checked=draft.has(input.value);draftStatus.textContent=draft.size?`${draft.size}人選択`:'全タレント';}
    function syncSelection(){selection.textContent=committed.size?`${committed.size}人で絞り込み中`:'全タレント';}
    function open(){draft=new Set(committed);syncDraft();if(!dialog.open)dialog.showModal();}
    dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
    dialog.addEventListener('close',()=>{draft=new Set(committed);trigger.focus();});
    dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
    syncSelection();syncDraft();
    return {open,getSelection:()=>[...committed],diagnostics:data.diagnostics,destroy:()=>{if(dialog.open)dialog.close();toolbar.remove();dialog.remove();}};
  }
  return {prepare,mount};
})();
