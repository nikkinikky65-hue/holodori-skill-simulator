// Uses real engines and actual dataset; no presentation formulas are asserted as truth.
{
 const check=(v,m)=>{if(!v)throw Error(m);};
 const catalog=JSON.parse(readFile('data/runtime-cards.json'));catalog.affiliationCatalog=JSON.parse(readFile('data/runtime-affiliations.json'));
 const compatible=catalog.cards.filter(c=>{const g=UnitParameterEngine.resolveInput(c.skills.passive.levels[0]);return g.status==='supported'&&g.effect.condition.kind==='type'&&g.effect.target.kind==='self'&&g.effect.condition.value==='CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1'&&c.classification.attributeType.mapping.value==='cute';});
 check(compatible.length>=5,'five real applicable Passive sources');
 const slots=compatible.slice(0,5).map(c=>({cardId:c.id,training:2,bloom:3,short:0,totalAdjustments:{board:{kind:'external-total',value:111},costume:{kind:'external-total',value:222}}}));
 const model=UnitSimulatorEngine.build(catalog,slots,120,{kind:'manual-rate',percent:6.4},{kind:'manual-rate',percent:2.43});
 const before=JSON.stringify(model),views=UnitParameterComparison.project(model);
 check(views.length===5&&views.every((v,i)=>v.slot===i+1),'five slots in formation order');
 for(const [i,view] of views.entries()){
  const p=model.members[i].parameters;
  const basis=UnitParameterEngine.calculateMemberParameter(model.members[i].card,2,3).subtotal;
  for(const row of view.rows){
   check(row.afterBloom===basis[row.key],'post-Bloom comes from engine trace');
   check(row.passiveRate===p.passive.rates[row.key],'combined rate matches engine');
   check(row.passiveAdded===p.passive[row.key],'rounded Passive increment matches engine');
   check(row.final===p.subtotal[row.key],'final PTS matches existing subtotal');
   check(view.received.filter(r=>r.parameter===row.key).reduce((sum,r)=>sum+r.ratePercent,0)===row.passiveRate,'received source rates describe engine application');
  }
  check(view.afterBloom.total===basis.total,'post-Bloom total from engine enhancement basis');
  check(view.total===p.subtotal.total,'engine TOTAL retained');
  check(view.ptsSubtotal<view.total,'TOTAL-only corrections never allocated to PTS');
 }
 check(model.parameters.passive.total>0,'nonzero real Passive tested');
 check(JSON.stringify(model)===before,'projection never mutates calculation results');
 const overlapping=catalog.cards.filter(c=>{const g=UnitParameterEngine.resolveInput(c.skills.passive.levels[0]);return c.classification.attributeType.mapping.value==='cute'&&g.status==='supported'&&g.effect.target.kind==='type';}).slice(0,5);
 check(overlapping.length===5,'five overlapping real attribute sources');
 const stacked=UnitSimulatorEngine.build(catalog,overlapping.map(c=>({cardId:c.id,training:2,bloom:5,short:0})),120);
 const stackedViews=UnitParameterComparison.project(stacked);
 check(stackedViews.some(v=>v.rows.some(row=>v.received.filter(r=>r.parameter===row.key).length>1)),'multiple sources affect at least one parameter');
 for(const view of stackedViews)for(const row of view.rows)check(view.received.filter(r=>r.parameter===row.key).reduce((sum,r)=>sum+r.ratePercent,0)===row.passiveRate,'rates are simple sums of applied source percentages');
 const sparse=UnitSimulatorEngine.build(catalog,[slots[0],{cardId:''},slots[2],{cardId:''},{cardId:''}],120);
 const positions=UnitParameterComparison.project(sparse);
 check(positions[1].empty&&positions[2].slot===3&&positions[4].empty,'empty slots are not compacted');
 check(UnitParameterComparison.rate(0)===''&&UnitParameterComparison.rate(58)==='+58%','zero blank and positive percent');
 check(UnitParameterComparison.number(null)==='—'&&UnitParameterComparison.number(12500)==='12,500','unknown and grouped values');

 for(const [passive,leader,expected] of [[32,80,'+32%（112%）'],[0,80,'（80%）'],[32,0,'+32%'],[0,0,'']])check(UnitParameterComparison.correctionRate(passive,leader)===expected,'correction display '+expected);
 const leader={id:'display-test',effects:[
  {parameter:'P',percent:80,target:'all_members',condition:{type:'not_stated'}},
  {parameter:'all_parameter',percent:20,target:'all_members',condition:{type:'not_stated'}},
  {parameter:'S',percent:900,target:'all_members',condition:{type:'unknown'}},
  {parameter:'score_support',percent:900,target:'all_members',condition:{type:'not_stated'}},
  {parameter:'T',percent:900,target:'all_members',condition:{type:'attribute_count',attribute:'CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2',requiredCount:5}}
 ]};
 const withLeader=UnitSimulatorEngine.build(catalog,slots,120,null,null,{},true,leader);
 const leaderBefore=JSON.stringify(withLeader);
 for(const view of UnitParameterComparison.project(withLeader))for(const row of view.rows){
  check(row.leaderRate===(row.key==='performance'?100:20),'only applied Parameter effects summed once for correct target/key');
  check(view.combinedRates[row.key]===row.passiveRate+row.leaderRate,'simple sum, no reverse calculation');
  check(row.final===withLeader.members[view.slot-1].parameters.subtotal[row.key],'leader final stays engine value');
 }
 check(withLeader.parameters.leaderResult.trace.some(t=>t.status==='inactive'),'inactive condition exercised');
 check(withLeader.parameters.leaderResult.trace.some(t=>t.status==='unresolved'),'unresolved condition exercised');
 check(withLeader.parameters.leaderResult.trace.some(t=>t.status==='unsupported'),'support effect excluded');
 check(JSON.stringify(withLeader)===leaderBefore,'Leader projection leaves engine unchanged');
 const sparseLeader=UnitSimulatorEngine.build(catalog,[slots[0],{cardId:''},slots[2],{cardId:''},{cardId:''}],120,null,null,{},true,leader);
 check(UnitParameterComparison.project(sparseLeader)[2].rows[0].leaderRate===100,'sparse target slots respected');
 print('Parameter comparison: real engine values, source rates, sparse order, TOTAL-only isolation, purity, image-independent projection PASS');
}
