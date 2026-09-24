// jsc formation-rules.js tests/formation-rules.test.js
function assert(value, message){ if(!value) throw Error(message); }
const values = new Map();
const localStorage = {getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,value)};
const crypto = {randomUUID:()=> 'test-id'};
const formation = createFormation(' 編成 ', 'leader-id', ['a','b','c','d','e']);
assert(formation.name === '編成' && formation.members.length === 5, 'shape');
saveFormation(formation);
assert(JSON.stringify(readFormationLibrary())===JSON.stringify({version:1,formations:[formation]}),'persist');
const cards = ['leader-id','a','b','c','d','e'].map(id=>({id,cardName:id}));
let resolved=resolveFormation(formation,cards);
assert(resolved.leader===cards[0] && resolved.members[4]===cards[5],'reference order');
cards[1]={id:'a',cardName:'edited'};
assert(resolveFormation(formation,cards).members[0].cardName==='edited','current card');
resolved=resolveFormation(formation,cards.filter(card=>card.id!=='c'));
assert(resolved.members[2]===null && resolved.members.filter(Boolean).length===4 && resolved.leader,'missing member isolated');
assert(resolveFormation(formation,cards.slice(1)).leader===null,'missing leader');
let refused=false;
try{createFormation('incomplete','leader-id',['a','','c','d','e']);}catch(e){refused=true;}
assert(refused,'no fake IDs');
localStorage.setItem(FORMATION_STORAGE_KEY,'broken');refused=false;
try{saveFormation(formation);}catch(e){refused=true;}
assert(refused && localStorage.getItem(FORMATION_STORAGE_KEY)==='broken','invalid data preserved');
print('Formation rules: PASS');
