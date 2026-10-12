// Independent snapshots. Never reads/writes stable A/B or card ownership storage.
const UnitFormationStore = (() => {
  const key='holodori-unit-formations-v1';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const object=v=>v && typeof v==='object' && !Array.isArray(v);
  function validateSnapshot(s){
    const string=v=>typeof v==='string';
    const adjustment=v=>object(v)&&v.kind==='external-total'&&(v.value===null||string(v.value)||typeof v.value==='number'&&Number.isFinite(v.value));
    if(!object(s)||s.version!==1||!Array.isArray(s.slots)||s.slots.length!==5||
      !s.slots.every(x=>object(x)&&string(x.cardId)&&Number.isInteger(x.training)&&x.training>=0&&x.training<=4&&Number.isInteger(x.bloom)&&x.bloom>=0&&x.bloom<=5&&Number.isFinite(x.short)&&x.short>=0&&object(x.totalAdjustments)&&adjustment(x.totalAdjustments.board)&&adjustment(x.totalAdjustments.costume))||
      !['leaderId','duration','memoryPercent','enhancementPercent'].every(k=>string(s[k]))||
      !['100','1000','10000'].includes(s.trials)||typeof s.specialEnabled!=='boolean'||!object(s.specialStarts)||
      !Object.entries(s.specialStarts).every(([k,v])=>/^[1-5]$/.test(k)&&Number.isFinite(v)))throw Error('編成スナップショットが不正、または未対応の形式です。');
    return s;
  }
  function read(){
    const raw=localStorage.getItem(key);if(raw===null)return {version:1,formations:[]};
    let data;try{data=JSON.parse(raw);}catch(e){throw Error('保存編成データが破損しています。元データは保持しています。');}
    if(!object(data)||data.version!==1||!Array.isArray(data.formations))throw Error('保存編成の形式に対応していません。');
    const ids=new Set();
    for(const f of data.formations){
      if(!object(f)||typeof f.id!=='string'||!f.id||ids.has(f.id)||typeof f.name!=='string'||!f.name.trim()||typeof f.createdAt!=='string'||typeof f.updatedAt!=='string')throw Error('保存編成の管理情報が不正です。');
      ids.add(f.id);validateSnapshot(f.snapshot);
    }
    return data;
  }
  function save(name,snapshot,id=null){
    if(typeof name!=='string'||!name.trim())throw Error('編成名を入力してください。');
    validateSnapshot(snapshot);const data=read(),now=new Date().toISOString();
    const previous=id===null?null:data.formations.find(f=>f.id===id);
    if(id!==null&&!previous)throw Error('保存編成が見つかりません。一覧を更新してください。');
    const record={id:previous?.id||crypto.randomUUID(),name:name.trim(),createdAt:previous?.createdAt||now,updatedAt:now,snapshot:copy(snapshot)};
    data.formations=previous?data.formations.map(f=>f.id===id?record:f):[...data.formations,record];
    localStorage.setItem(key,JSON.stringify(data));return copy(record);
  }
  function duplicate(id,name){const f=read().formations.find(f=>f.id===id);if(!f)throw Error('複製する編成を選択してください。');return save(name,f.snapshot);}
  function remove(id){const data=read();if(!data.formations.some(f=>f.id===id))throw Error('削除する編成を選択してください。');data.formations=data.formations.filter(f=>f.id!==id);localStorage.setItem(key,JSON.stringify(data));}
  return {key,read,save,duplicate,remove,validateSnapshot};
})();
