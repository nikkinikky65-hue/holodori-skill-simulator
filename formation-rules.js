// Formationはカードのコピーを持たず、Card v2のIDのみを参照する。
const FORMATION_STORAGE_KEY = 'holodori-formation-library-v1';

function validateFormation(formation){
  const isId = value => typeof value === 'string' && value.trim() !== '';
  if(!formation || !isId(formation.id) || !isId(formation.name) ||
     !isId(formation.leader) || !Array.isArray(formation.members) ||
     formation.members.length !== 5 || !formation.members.every(isId)){
    throw new Error('リーダー1枠と通常5枠のカード、編成名が必要です。');
  }
}

function createFormation(name, leader, members){
  const formation = {
    id: 'formation-' + crypto.randomUUID(),
    name: name.trim(), leader, members: [...members]
  };
  validateFormation(formation);
  return formation;
}

function readFormationLibrary(){
  const saved = localStorage.getItem(FORMATION_STORAGE_KEY);
  if(saved === null) return { version: 1, formations: [] };
  const library = JSON.parse(saved);
  if(!library || library.version !== 1 || !Array.isArray(library.formations)){
    throw new Error('編成保存データを読み込めません。元データは変更していません。');
  }
  library.formations.forEach(validateFormation);
  return library;
}

function saveFormation(formation){
  validateFormation(formation);
  const library = readFormationLibrary();
  library.formations.push(formation);
  localStorage.setItem(FORMATION_STORAGE_KEY, JSON.stringify(library));
}

function resolveFormation(formation, cards){
  validateFormation(formation);
  const byId = new Map(cards.map(card => [card.id, card]));
  return {
    leader: byId.get(formation.leader) || null,
    members: formation.members.map(id => byId.get(id) || null)
  };
}
