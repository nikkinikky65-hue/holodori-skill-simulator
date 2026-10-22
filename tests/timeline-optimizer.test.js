{
const check=(ok,message)=>{if(!ok)throw Error(message);};
const members=[{slot:1,interval:15,duration:6,boost:55,short:0},{slot:2,interval:18,duration:8,boost:65,short:0}];
const options=[0,4,8,12],limits=[12,12];
let expected=null,tested=0;
for(const a of options)for(const b of options){
 const shorts=[a,b],chosen=members.map((m,i)=>({...m,short:shorts[i]}));
 const by=chosen.map(m=>ActiveTimelineEngine.events(m,120));
 const score=ActiveTimelineEngine.calcMax(by.flat(),120);tested++;
 if(expected===null||score>expected.score+1e-9)expected={score,shorts};
}
const actual=TimelineOptimizer.optimizeActive(members,120,limits);
check(actual.tested===tested&&actual.score===expected.score&&JSON.stringify(actual.shorts)===JSON.stringify(expected.shorts),'A optimizer parity');
check(TimelineOptimizer.count([4,4,4,4,4],120)===3840,'SP candidate count');
check(TimelineOptimizer.count([12,12,12,12,12],120)===122880,'full candidate bound');
const orders=TimelineOptimizer.permutations([1,2,3,4,5]);
check(orders.length===120&&JSON.stringify(orders[0])==='[1,2,3,4,5]'&&JSON.stringify(orders.at(-1))==='[5,4,3,2,1]','stable SP order');
print('Shared Timeline optimizer: A parity, SP permutations and candidate count PASS');
}
