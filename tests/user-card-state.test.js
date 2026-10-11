const assertUser=(ok,message)=>{if(!ok)throw Error(message);};
const userStorage=new Map([['holodori-active-input-v1','unchanged A'],['holodori-member-card-library-v2','unchanged Library']]);
let storageRefused=false;
const localStorage={getItem:key=>userStorage.get(key)??null,setItem:(key,value)=>{if(storageRefused)throw Error('quota');userStorage.set(key,value);}};
assertUser(getUserCardState('a').owned===false && getUserCardState('a').training===0 && getUserCardState('a').opening===0,'defaults');
assertUser(!userStorage.has(USER_CARD_STATE_STORAGE_KEY),'reading does not write');
updateUserCardState('a',{owned:true});updateUserCardState('a',{training:4,opening:5});
updateUserCardState('b',{training:2});
updateUserCardState('a',{owned:false});updateUserCardState('a',{owned:true});
assertUser(JSON.stringify(getUserCardState('a'))===JSON.stringify({owned:true,training:4,opening:5}),'toggle retains growth');
assertUser(getUserCardState('b').owned===false && getUserCardState('b').training===2,'unowned growth persisted independently');
const extended=readUserCardStates();extended.future={version:9};extended.cards.a.favorite=true;
localStorage.setItem(USER_CARD_STATE_STORAGE_KEY,JSON.stringify(extended));
updateUserCardState('a',{opening:3});
assertUser(readUserCardStates().future.version===9 && getUserCardState('a').favorite===true,'unknown root/card fields preserved');
for(const patch of [{training:-1},{training:5},{training:1.5},{opening:-1},{opening:6},{opening:'2'},{owned:1}]){
  const before=localStorage.getItem(USER_CARD_STATE_STORAGE_KEY);let rejected=false;
  try{updateUserCardState('a',patch);}catch(error){rejected=true;}
  assertUser(rejected && localStorage.getItem(USER_CARD_STATE_STORAGE_KEY)===before,'invalid update does not change storage');
}
const good=localStorage.getItem(USER_CARD_STATE_STORAGE_KEY);storageRefused=true;
let failed=false;try{updateUserCardState('a',{owned:false});}catch(error){failed=true;}
assertUser(failed && localStorage.getItem(USER_CARD_STATE_STORAGE_KEY)===good,'write failure propagated without replacement');storageRefused=false;
for(const bad of ['{broken',JSON.stringify({version:99,cards:{}}),JSON.stringify({version:1,cards:{a:{owned:true,training:99,opening:0}}})]){
  localStorage.setItem(USER_CARD_STATE_STORAGE_KEY,bad);let rejected=false;
  try{updateUserCardState('a',{owned:false});}catch(error){rejected=true;}
  assertUser(rejected && localStorage.getItem(USER_CARD_STATE_STORAGE_KEY)===bad,'unsupported/corrupt state retained');
}
assertUser(userStorage.get('holodori-active-input-v1')==='unchanged A' && userStorage.get('holodori-member-card-library-v2')==='unchanged Library','separate storage');
print('User card state: defaults, ownership/growth persistence, isolation, extensions, bounds and failed-write preservation PASS');
const exportCatalog={dataset:{canonicalSha256:'test'},cards:[{id:'a'},{id:'b'},{id:'unsaved'}]};
userStorage.delete(USER_CARD_STATE_STORAGE_KEY);
const emptyExport=exportUserCardStates(exportCatalog,'fixed');
assertUser(!emptyExport.source.storagePresent && emptyExport.cards.every(c=>!c.saved && c.state===null),'unsaved is not false/zero');
const exportStore={version:1,future:null,cards:{a:{owned:false,training:4,opening:5},b:{owned:true,training:0,opening:0,optional:null},removed:{owned:false,training:1,opening:2}}};
userStorage.set(USER_CARD_STATE_STORAGE_KEY,JSON.stringify(exportStore));
const exportBefore=JSON.stringify([...userStorage]);
const snapshot=exportUserCardStates(exportCatalog,'fixed');
assertUser(JSON.stringify(snapshot.savedData)===JSON.stringify(exportStore),'exact stored fields');
assertUser(snapshot.cards.find(c=>c.cardId==='a').state.owned===false && snapshot.cards.find(c=>c.cardId==='a').saved,'explicit unowned retained');
assertUser(!snapshot.cards.find(c=>c.cardId==='removed').inCatalog,'unknown card preserved');
assertUser(snapshot.cards.find(c=>c.cardId==='b').state.optional===null,'explicit null preserved');
assertUser(JSON.stringify([...userStorage])===exportBefore,'export never mutates any storage');
for(const raw of ['null','{}','{broken']){
 userStorage.set(USER_CARD_STATE_STORAGE_KEY,raw);let failed=false;try{exportUserCardStates(exportCatalog);}catch(e){failed=true;}
 assertUser(failed && userStorage.get(USER_CARD_STATE_STORAGE_KEY)===raw,'invalid export rejected without write');
}
print('Card export: saved/unowned/unset/unknown, extensions, read-only PASS');
