const assertRandom=(ok,msg)=>{if(!ok)throw Error(msg);};
const sim=ActiveRandomSimulation;
const members=[{slot:1,interval:30,duration:10,boost:50,short:0,prob:'high'}, {slot:2,interval:40,duration:20,boost:100,short:0,prob:'mid'}];
const zero=sim.prepare(members,120,events,()=>0), full=sim.prepare(members,120,events,()=>1);
assertRandom(sim.trial(zero,maxSegments,()=>0)===120,'0% baseline');
assertRandom(sim.trial(full,maxSegments,()=>.999)===120+calcMax(members.flatMap(m=>events(m,120)),120)/100,'100% matches actual overlap');
assertRandom(sim.integrate([{start:0,end:120,boost:50}],120)===180,'full duration');
assertRandom(sim.integrate([{start:10,end:18,boost:45}],30)===33.6,'partial duration');
const overlap=[{start:0,end:20,boost:50,m:{slot:1}},{start:10,end:30,boost:100,m:{slot:2}}];
assertRandom(sim.integrate(maxSegments(overlap,40),40)===65,'overlap maximum, not sum');
const prepared=sim.prepare(members,120,events,q=>ActivationProbabilityRules.probability(q));
const a=sim.run(prepared,100,maxSegments,sim.seededRandom(42)), b=sim.run(prepared,100,maxSegments,sim.seededRandom(42));
assertRandom(JSON.stringify(a)===JSON.stringify(b) && a.values.length===100,'seed and count');
const stats=sim.statistics([10,0,30,20]);
assertRandom(JSON.stringify(stats)===JSON.stringify({count:4,mean:15,median:15,min:0,max:30,p10:3.0000000000000004,p90:27}),'linear percentile statistics');
assertRandom(sim.statistics([7]).median===7,'single sample');
assertRandom(sim.prepare([{...members[0],short:100}],120,events,()=>1).candidates[0].event.start===15,'frequency changes timing');
assertRandom(prepared.candidates[0].probability===.55,'existing provisional high');
let rejected=false;try{ActivationProbabilityRules.probability('unknown');}catch(e){rejected=true;}
assertRandom(rejected,'unknown not guessed');
assertRandom(sim.run(sim.prepare([],120,events,()=>1),100,maxSegments).values.every(x=>x===120),'empty party baseline');
print('Active random: probabilities, seed, count, integral, real overlap/frequency, statistics and unknown rejection PASS');

assertRandom(sim.histogram([1,1,1])[0].count===3,'constant histogram');
assertRandom(sim.histogram(a.values).reduce((s,b)=>s+b.count,0)===100,'histogram keeps all trials');
assertRandom(sim.run(prepared,10000,maxSegments,sim.seededRandom(99)).values.length===10000,'10000 trials');
print('Active random: histogram and 10000 trials PASS');
