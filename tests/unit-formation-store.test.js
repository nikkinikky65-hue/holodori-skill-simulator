const checkFormation=(ok,m)=>{if(!ok)throw Error(m);};
const stateMap=new Map([['holodori-user-card-state-v1','ownership'],['stable-A','stable']]);
let failWrite=false,serial=0;
const localStorage={getItem:k=>stateMap.get(k)??null,setItem:(k,v)=>{if(failWrite)throw Error('quota');stateMap.set(k,v);}};
const crypto={randomUUID:()=>`id-${++serial}`};
const snapshot={version:1,slots:Array.from({length:5},(_,i)=>({cardId:'card-'+i,training:i,bloom:i+1,short:i*3,totalAdjustments:{board:{kind:'external-total',value:i?'0':''},costume:{kind:'external-total',value:null}}})),leaderId:'leader',duration:'120',memoryPercent:'',enhancementPercent:'0',trials:'1000',specialEnabled:false,specialStarts:{1:15,3:44.5}};
checkFormation(UnitFormationStore.read().formations.length===0&&!stateMap.has(UnitFormationStore.key),'read does not initialize storage');
const a=UnitFormationStore.save('A',snapshot),b=UnitFormationStore.save('B',{...snapshot,duration:'150'});
snapshot.slots[0].short=99;
checkFormation(UnitFormationStore.read().formations[0].snapshot.slots[0].short===0,'detached snapshot');
const duplicate=UnitFormationStore.duplicate(a.id,'copy');checkFormation(duplicate.id!==a.id&&JSON.stringify(duplicate.snapshot)===JSON.stringify(a.snapshot),'duplicate saved input');
UnitFormationStore.save('renamed',snapshot,a.id);
checkFormation(UnitFormationStore.read().formations.find(x=>x.id===b.id).snapshot.duration==='150','overwrite isolation');
UnitFormationStore.remove(duplicate.id);checkFormation(UnitFormationStore.read().formations.length===2,'delete');
const good=stateMap.get(UnitFormationStore.key);failWrite=true;try{UnitFormationStore.save('quota',snapshot);}catch(e){}failWrite=false;
checkFormation(stateMap.get(UnitFormationStore.key)===good,'write error preserves store');
for(const bad of ['{bad','null',JSON.stringify({version:2,formations:[]}),JSON.stringify({version:1,formations:[{...a,snapshot:{}}]})]){
 stateMap.set(UnitFormationStore.key,bad);let rejected=false;try{UnitFormationStore.save('new',snapshot);}catch(e){rejected=true;}
 checkFormation(rejected&&stateMap.get(UnitFormationStore.key)===bad,'corruption never overwritten');
}
checkFormation(stateMap.get('holodori-user-card-state-v1')==='ownership'&&stateMap.get('stable-A')==='stable','other keys unchanged');
print('Unit formation store: CRUD, independent snapshots, fields/null/zero, corruption/quota isolation PASS');
stateMap.set(UnitFormationStore.key,good);
const named=UnitFormationStore.save('Leader',snapshot);
const named3=UnitFormationStore.save('Leader (3)',snapshot);
checkFormation(UnitFormationStore.uniqueName('Leader')==='Leader (2)','smallest unused suffix');
const named2=UnitFormationStore.duplicate(named.id,'Leader');
checkFormation(named2.name==='Leader (2)'&&UnitFormationStore.uniqueName('Leader')==='Leader (4)','duplicate collision');
UnitFormationStore.rename(named.id,'Manual');
checkFormation(UnitFormationStore.read().formations.find(f=>f.id===named.id).name==='Manual'&&JSON.stringify(UnitFormationStore.read().formations.find(f=>f.id===named.id).snapshot)===JSON.stringify(named.snapshot),'rename preserves snapshot');
print('Formation naming and rename: PASS');
