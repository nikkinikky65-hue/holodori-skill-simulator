{
 const check=(v,m)=>{if(!v)throw Error(m);};
 const rows=canonicalTestFixture.cards.flatMap(c=>c.skills.passive.levels.map(p=>({c,p,g:UnitParameterEngine.resolveInput(p)}))).filter(r=>r.g.interpretation==='developer-approved-attribute-max-2');
 check(rows.length===82&&new Set(rows.map(r=>r.c.id)).size===41,'41/82 only');
 for(const {c,p,g} of rows){
  for(const n of [0,1,2,3,4,5])for(const tie of [false,true]){
   const members=Array.from({length:5},(_,i)=>({...UnitParameterEngine.calculateMemberParameter(c,0,0),slot:i+1,
    attribute:i<n?g.effect.target.value:'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_'+(g.effect.target.value.endsWith('1')?'2':'1'),
    subtotal:{performance:tie?101:101+i*10,technique:103,sense:107,total:tie?311:311+i*10},passiveInput:i===0?p:null}));
   const result=UnitParameterEngine.calculateUnitParameter(members);
   const trace=result.members[0].trace[0];
   const selected=Array.from({length:n},(_,i)=>i).sort((a,b)=>tie?a-b:b-a).slice(0,2);
   check(trace.status==='resolved'&&trace.condition.interpretation===g.interpretation,'approved resolved trace');
   check(JSON.stringify(trace.targetSlots)===JSON.stringify(selected.map(i=>i+1)),'rank/ties/0-5');
   for(let i=0;i<5;i++)for(const key of ['performance','technique','sense']){
    const expected=selected.includes(i)&&PARAMETER_PASSIVE_TYPES[g.effect.type].includes(key)?Math.ceil(members[i].subtotal[key]*g.effect.value/100):0;
    check(result.members[i].passive[key]===expected,'effect/ceil/non-target');
   }
   members[1].passiveInput=p;
   const multiple=UnitParameterEngine.calculateUnitParameter(members);
   for(const i of selected)for(const key of PARAMETER_PASSIVE_TYPES[g.effect.type])check(multiple.members[i].passive[key]===Math.ceil(members[i].subtotal[key]*g.effect.value*2/100),'combined ceil');
  }
  for(const patch of [{referenceState:'present'},{referenceState:undefined},{clauses:[{}]},{referenceId:'missing'}]){
   const changed={...p,condition:{...p.condition,...patch}};
   check(UnitParameterEngine.resolveInput(changed).status==='unsupported','inconsistent/missing references deferred');
  }
 }
 const support=canonicalTestFixture.cards.flatMap(c=>c.skills.passive.levels).filter(p=>p.effect.raw.type.includes('LIVE_ACTIVE_SKILL_EFFECT_UP'));
 check(support.every(p=>UnitParameterEngine.resolveInput(p).status==='unsupported'),'Support not enabled');
 print('Approved attribute Parameter: 41/82, 0-5, ties, P/T/S/all, multiple sources, reference guards PASS');
}
