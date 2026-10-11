{
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 const aff=JSON.parse(readFile('data/runtime-affiliations.json'));
 for(const fixture of JSON.parse(readFile('tests/parameter-affiliation-observations.json'))){
 const members=fixture.members.map((m,i)=>{
  const card=canonicalTestFixture.cards.find(c=>c.id===m.cardId),stage=card.progression.trainingStages.find(s=>s.levelCap===m.level);
  check(!!stage,'recorded Lv is available');
  const member=UnitParameterEngine.calculateMemberParameter(card,stage.stage,m.bloom);
  check(member.passiveInput.level===m.passiveLevel,'recorded Passive Lv');return {...member,slot:i+1};
 });
 const base=members.reduce((sum,m)=>sum+m.subtotal.total,0),result=UnitParameterEngine.calculateUnitParameter(members,null,null,aff);
 check(base===fixture.observedBase,'Observation '+fixture.observation+' base '+base);
 check(result.passive.total===fixture.observedPassive,'Observation '+fixture.observation+' Passive '+result.passive.total);
 // Diagnostic comparisons reuse selection and effect arithmetic, without mutating source parameters.
 const select=PassiveSelectionResolver.resolve;
 const comparisons={};
 try{
 for(const mode of ['total','self-first','left']){
 PassiveSelectionResolver.resolve=args=>{
  if(mode==='total')return select({...args,effectType:'all_parameters_up'});
  if(mode==='left')return select({...args,candidates:args.candidates.map(m=>({...m,baseTotal:1,base:{performance:1,technique:1,sense:1}}))});
  return select({...args,candidates:args.candidates.map(m=>{
   const effect=UnitParameterEngine.resolveInput(members.find(x=>x.slot===m.slot).passiveInput).effect;
   if(effect?.target.kind!=='self')return m;
   // Only active self effects; verify condition with existing evaluator on the same formation.
   const isolated=members.map(x=>({...x,passiveInput:x.slot===m.slot?x.passiveInput:null}));
   const self=UnitParameterEngine.calculateUnitParameter(isolated,null,null,aff).members.find(x=>x.slot===m.slot).passive;
   const base={...m.base};for(const k of ['performance','technique','sense'])base[k]+=self[k];
   return {...m,base,baseTotal:base.performance+base.technique+base.sense};
  })});
 };
 comparisons[mode]=UnitParameterEngine.calculateUnitParameter(members,null,null,aff).passive.total;
 }
 }finally{PassiveSelectionResolver.resolve=select;}
 if(fixture.observation===9)check(comparisons.total===4931&&comparisons['self-first']===5449,'5491 countermodels '+JSON.stringify(comparisons));
 if(fixture.observation===10)check(comparisons.total===9394&&comparisons['self-first']===9394,'independent countermodels; user reported 9395, retained in research '+JSON.stringify(comparisons));
 if(fixture.observation===11){
  const trace=result.members[3].trace[0];
  check(trace.targetSlots.join(',')==='4,5','Advent S selects Nerissa and Mococo');
  check(trace.parameters.reduce((s,p)=>s+Math.ceil(p.sourceRaw),0)===2212,'Advent source increment 2212');
  check(comparisons.total===7707&&comparisons.left===7741,'Advent alternative models '+JSON.stringify(comparisons));
 }
 print('Observation '+fixture.observation+': '+base+' / '+result.passive.total+'; countermodels '+JSON.stringify(comparisons)+' PASS');
 }
}
