{
 const check=(v,m)=>{if(!v)throw Error(m);};
 const catalog=canonicalTestFixture,aff=JSON.parse(readFile('data/runtime-affiliations.json'));
 const rows=catalog.cards.flatMap(c=>c.skills.passive.levels.map(p=>({c,p,gate:UnitParameterEngine.resolveInput(p)}))).filter(r=>r.gate.interpretation);
 check(rows.length===28 && new Set(rows.map(r=>r.c.id)).size===14,'exact 14/28');
 for(const {c,p,gate} of rows){
   const missing=JSON.parse(JSON.stringify(p));missing.condition.referenceState='present';
   check(UnitParameterEngine.resolveInput(missing).status==='unsupported','missing reference not no condition');
   delete missing.condition.referenceState;
   check(UnitParameterEngine.resolveInput(missing).status==='unsupported','missing provenance deferred');
   const group=aff.groups[gate.effect.target.value];
   const inside=card=>group.characterIds.includes(aff.cardCharacters[card.id]);
   const unique=cards=>cards.filter((x,i,a)=>a.findIndex(y=>aff.cardCharacters[y.id]===aff.cardCharacters[x.id])===i);
   const peers=unique(catalog.cards.filter(inside)),others=unique(catalog.cards.filter(x=>!inside(x)));
   for(const n of [0,1,2,3]){
     // Synthetic source for n=0: tests target semantics without inventing a playable card.
     const members=[...peers.slice(0,n),...others.slice(0,5-n)].map((card,i)=>({...UnitParameterEngine.calculateMemberParameter(card,0,0),slot:i+1,passiveInput:i===0?p:null}));
     const result=UnitParameterEngine.calculateUnitParameter(members,null,null,aff);
     const trace=result.members[0].trace[0];
     check(trace.condition.type==='developer-approved-no-additional-condition','provisional trace');
     check(trace.status===(n>2?'unresolved':'resolved'),'selection state');
     check(trace.targetSlots.length===(n>2?0:n),'max 2, never rank');
     const key=PARAMETER_PASSIVE_TYPES[gate.effect.type][0];
     result.members.forEach((m,i)=>check(m.passive[key]===(i<n&&n<=2?Math.ceil(members[i].subtotal[key]*gate.effect.value/100):0),'level amount, non-target isolation'));
     if(n===2){
       const doubled=members.map((m,i)=>({...m,passiveInput:i<2?p:null}));
       const both=UnitParameterEngine.calculateUnitParameter(doubled,null,null,aff);
       for(let i=0;i<2;i++)check(both.members[i].passive[key]===Math.ceil(members[i].subtotal[key]*gate.effect.value*2/100),'multiple sources rate sum then ceil');
     }
     const missingAff={...aff,cardCharacters:{...aff.cardCharacters}};delete missingAff.cardCharacters[members[4].cardId];
     check(UnitParameterEngine.calculateUnitParameter(members,null,null,missingAff).members[0].trace[0].status==='unresolved','missing membership unresolved');
   }
 }
 print('Approved affiliation Passive: 14/28, all groups/levels, 0/1/2/3, missing references and membership PASS');
}
