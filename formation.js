// 編成UI。リーダーは選択状態のみを扱い、既存5枠の計算へ追加しない。
const formationName = document.querySelector('#formationName');
const formationSelect = document.querySelector('#formationSelect');
const formationLeader = document.querySelector('#formationLeader');
const formationStatus = document.querySelector('#formationStatus');

function refreshFormationLeaders(selected = formationLeader.value){
  const cards = readCardLibrary();
  formationLeader.replaceChildren(new Option('リーダーを選択', ''));
  cards.forEach(card => {
    const member = getMasterMember(card.talentId);
    formationLeader.add(new Option(`${member?.name || '不明なメンバー'} / ${card.cardName}`, card.id));
  });
  if(selected && !cards.some(card => card.id === selected)){
    formationLeader.add(new Option('カードが見つからない：' + selected, selected));
  }
  formationLeader.value = selected;
}

function refreshFormationList(selected = formationSelect.value){
  const library = readFormationLibrary();
  formationSelect.replaceChildren(new Option('保存済み編成を選択', ''));
  library.formations.forEach(formation => {
    formationSelect.add(new Option(formation.name, formation.id));
  });
  formationSelect.value = selected;
}

function saveCurrentFormation(){
  try{
    const members = getMembers().map(member => member.libraryCardId);
    const formation = createFormation(formationName.value, formationLeader.value, members);
    const resolved = resolveFormation(formation, readCardLibrary());
    if(!resolved.leader || resolved.members.some(card => !card)){
      throw new Error('6枠すべてに保存済みのカードを選んでください。手入力のみの枠は先にカード保存してください。');
    }
    saveFormation(formation);
    refreshFormationList(formation.id);
    formationStatus.textContent = `「${formation.name}」を保存しました。呼出時はライブラリの最新の値を使用します。`;
  }catch(error){
    formationStatus.textContent = error.message;
  }
}

function clearFormationMemberSlot(index){
  const slot = document.querySelectorAll('.card')[index];
  // 曲時間・発動頻度UPは編成データに含めず、現在の設定を維持する。
  const empty = { libraryCardId: '', memberId: '', costume: '未分類', interval: '', prob: 'mid', duration: '', boost: '' };
  for(const [key, value] of Object.entries(empty)){
    slot.querySelector(`[data-k="${key}"]`).value = value;
  }
}

function loadSelectedFormation(){
  try{
    const formation = readFormationLibrary().formations.find(item => item.id === formationSelect.value);
    if(!formation) throw new Error('呼び出す編成を選択してください。');
    const resolved = resolveFormation(formation, readCardLibrary());
    const missing = [];
    refreshFormationLeaders(formation.leader);
    if(!resolved.leader) missing.push('リーダー');
    resolved.members.forEach((card, index) => {
      if(card && getMasterMember(card.talentId)){
        loadLibraryCardIntoSlot(card, index);
      }else{
        clearFormationMemberSlot(index);
        missing.push(`通常枠${index + 1}`);
      }
    });
    formationName.value = formation.name;
    saveState();
    render();
    updateOptimizeNames();
    formationStatus.textContent = missing.length
      ? `「${formation.name}」を呼び出しました。${missing.join('、')}：カードが見つからない、またはメンバー未登録です。`
      : `「${formation.name}」を呼び出しました。`;
  }catch(error){
    formationStatus.textContent = error.message;
  }
}

document.querySelector('#formationSave').addEventListener('click', saveCurrentFormation);
document.querySelector('#formationLoad').addEventListener('click', loadSelectedFormation);
formationLeader.addEventListener('focus', () => refreshFormationLeaders());
window.addEventListener('focus', () => {
  try{ refreshFormationLeaders(); refreshFormationList(); }
  catch(error){ formationStatus.textContent = error.message; }
});
try{ refreshFormationLeaders(); refreshFormationList(); }
catch(error){ formationStatus.textContent = error.message; }
