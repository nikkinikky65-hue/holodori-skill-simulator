{
 const check=(v,m)=>{if(!v)throw Error(m);};
 const ids=['card-00018-3-nrml-0004-00','card-03001-3-nrml-0033-00','card-00022-3-nrml-0018-00','card-04012-3-nrml-0051-00','card-03003-3-nrml-0035-00'];
 const expected=[[3740,2325,1895],[3231,2472,2375],[3157,2420,2518],[5006,7252,5431],[2420,2518,3157]];
 const added=[[1272,0,0],[453,347,0],[506,388,756],[1703,1016,761],[0,353,442]];
 for(const order of [[0,1,4,3,2],[0,1,2,3,4]]){
 const members=order.map((i,j)=>{const card=canonicalTestFixture.cards.find(c=>c.id===ids[i]);
 const stage=card.progression.trainingStages.find(s=>s.levelCap===(i===3?60:20)).stage;
 const m=UnitParameterEngine.calculateMemberParameter(card,stage,5);
 check(JSON.stringify(['performance','technique','sense'].map(k=>m.subtotal[k]))===JSON.stringify(expected[i]),'Runtime post Bloom matches observation');
 check(m.passiveInput.level===2,'P Lv2');return {...m,slot:j+1};});
 const result=UnitParameterEngine.calculateUnitParameter(members);
 check(members.reduce((s,m)=>s+m.subtotal.total,0)===49917,'member sum 49917');
 check(result.passive.total===7997,'08/09 observed 7997');
 result.members.forEach((m,j)=>check(JSON.stringify(['performance','technique','sense'].map(k=>m.passive[k]))===JSON.stringify(added[order[j]]),'model individual values (not direct measurements)'));
 }
 // Explicitly separate provisional all-stat selection and tie policy.
 const candidates=[{slot:1,formationIndex:0,baseTotal:110,base:{performance:100,technique:5,sense:5}},{slot:2,formationIndex:1,baseTotal:120,base:{performance:10,technique:50,sense:60}}];
 for(const [effectType,slot] of [['performance_up',1],['technique_up',2],['sense_up',2],['all_parameters_up',2]]){
 const r=PassiveSelectionResolver.resolve({candidates,selectCount:1,rule:'attribute-parameter',effectType});check(r.selected[0].slot===slot,'independent comparison');
 check(r.tieBreakStatus==='provisional-unverified','tie remains provisional');
 }
 const cases=[
 {name:'Reine07 cute',ids:['card-03001-3-nrml-0033-00','card-00030-3-nrml-0024-00','card-00032-3-nrml-0026-00','card-06004-3-nrml-0060-00','card-04007-3-nrml-0047-00'],levels:[20,20,20,20,20],base:40202,passive:6324},
 {name:'Reine07 happy',ids:['card-00021-3-nrml-0017-00','card-00039-3-nrml-0032-00','card-04003-3-nrml-0044-00','card-06005-3-nrml-0061-00','card-00005-3-nrml-0006-00'],levels:[20,20,20,20,20],base:40134,passive:6412},
 {name:'Reine07 pure',ids:['card-04010-3-nrml-0049-00','card-00031-3-nrml-0025-00','card-00017-3-nrml-0015-00','card-04013-3-nrml-0052-00','card-00002-3-nrml-0001-00'],levels:[40,20,40,40,20],base:54754,passive:9394}
 ];
 for(const c of cases){
 const members=c.ids.map((id,i)=>{const card=canonicalTestFixture.cards.find(x=>x.id===id);check(!!card,c.name+' card ID');const stage=card.progression.trainingStages.find(s=>s.levelCap===c.levels[i]);check(!!stage,c.name+' Lv');return {...UnitParameterEngine.calculateMemberParameter(card,stage.stage,5),slot:i+1};});
 const base=members.reduce((sum,m)=>sum+m.subtotal.total,0);
 check(base===c.base,c.name+' base '+base+' != '+c.base);
 const result=UnitParameterEngine.calculateUnitParameter(members);
 check(result.passive.total===c.passive,c.name+' passive '+result.passive.total+' != '+c.passive);
 print(c.name+': '+base+' / '+result.passive.total+' PASS');
 }
 print('Observed Reine08/09: Runtime 49917 / Passive7997, per-member model, independent rank values PASS');
}
