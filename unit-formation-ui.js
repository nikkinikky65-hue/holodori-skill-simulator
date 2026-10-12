function initializeUnitFormationUI({capture,restore,getDefaultName}){
  const node=id=>document.getElementById(id),select=node('unitFormationList'),name=node('unitFormationName'),status=node('unitFormationStatus');
  let automatic=true;
  let baseline=JSON.stringify(capture());
  const action=fn=>{try{fn();}catch(error){status.textContent=error.message;}};
  function list(id=select.value){
    const data=UnitFormationStore.read();select.replaceChildren(new Option('保存編成を選択',''));
    for(const f of data.formations)select.append(new Option(f.name,f.id));select.value=id;
  }
  const selected=()=>{const f=UnitFormationStore.read().formations.find(f=>f.id===select.value);if(!f)throw Error('保存編成を選択してください。');return f;};
  const suggest=()=>{if(automatic)name.value=UnitFormationStore.uniqueName(getDefaultName());};
  name.addEventListener('input',()=>{automatic=false;});
  document.getElementById('unitLeader').addEventListener('change',()=>action(suggest));
  select.addEventListener('change',()=>action(()=>{if(select.value){name.value=selected().name;automatic=false;}else{automatic=true;suggest();}}));
  node('unitFormationNew').addEventListener('click',()=>action(()=>{const f=UnitFormationStore.save(UnitFormationStore.uniqueName(automatic?getDefaultName():(name.value||getDefaultName())),capture());list(f.id);name.value=f.name;automatic=true;baseline=JSON.stringify(capture());status.textContent='新規保存しました。';}));
  node('unitFormationOverwrite').addEventListener('click',()=>action(()=>{
    const f=selected();if(!confirm(`「${f.name}」を現在の入力で上書きしますか？`))return;
    UnitFormationStore.save(name.value,capture(),f.id);list(f.id);baseline=JSON.stringify(capture());status.textContent='上書き保存しました。';
  }));
  function load(id){
    const f=UnitFormationStore.read().formations.find(f=>f.id===id);if(!f)throw Error('指定した保存編成が見つかりません。');
    if(JSON.stringify(capture())!==baseline&&!confirm('現在の未保存の入力を破棄して、保存編成を読み込みますか？'))return;
    restore(f.snapshot);list(f.id);name.value=f.name;automatic=false;baseline=JSON.stringify(capture());status.textContent='入力を復元し、再計算しました。Simulation結果は再実行してください。';
  }
  node('unitFormationLoad').addEventListener('click',()=>action(()=>load(select.value)));
  node('unitFormationDuplicate').addEventListener('click',()=>action(()=>{const f=selected(),newName=prompt('複製する編成名',UnitFormationStore.uniqueName(f.name));if(newName===null)return;const result=UnitFormationStore.duplicate(f.id,newName);list(result.id);name.value=result.name;status.textContent='保存済みスナップショットを複製しました（現在の入力は変更していません）。';}));
  node('unitFormationDelete').addEventListener('click',()=>action(()=>{const f=selected();if(!confirm(`「${f.name}」を削除しますか？`))return;UnitFormationStore.remove(f.id);list('');status.textContent='削除しました（現在の入力は変更していません）。';}));
  node('unitFormationRefresh').addEventListener('click',()=>action(()=>{list();status.textContent='一覧を更新しました。';}));
  action(()=>{list();suggest();});
  const requested=new URL(location.href).searchParams.get('formation');
  if(requested)action(()=>load(requested));
  window.addEventListener('beforeunload',event=>{if(JSON.stringify(capture())!==baseline){event.preventDefault();event.returnValue='';}});
}
