// Shared candidate order and Active-only evaluation used by stable A and the unit page.
const TimelineOptimizer = (() => {
  const shortOptions=[0,4,8,12];
  function choices(limits){return limits.map(limit=>shortOptions.filter(value=>value<=limit));}
  function count(limits,orderCount=1){return choices(limits).reduce((n,values)=>n*values.length,orderCount);}
  function* candidates(limits,orders=[null]){
    const values=choices(limits),shorts=[];
    function* walk(index){
      if(index<values.length){
        for(const value of values[index]){shorts.push(value);yield* walk(index+1);shorts.pop();}
      }else{
        for(const order of orders)yield {shorts:[...shorts],order};
      }
    }
    yield* walk(0);
  }
  function active(members,duration,shorts){
    const chosen=members.map((member,index)=>({...member,short:shorts[index]}));
    const by=chosen.map(member=>ActiveTimelineEngine.events(member,duration));
    const all=by.flat();
    return {score:ActiveTimelineEngine.calcMax(all,duration),shorts:[...shorts],members:chosen,by,all};
  }
  function optimizeActive(members,duration,limits){
    let best=null,tested=0;
    for(const candidate of candidates(limits)){
      const result=active(members,duration,candidate.shorts);tested++;
      if(best===null||result.score>best.score+1e-9)best=result;
    }
    return {...best,tested};
  }
  function permutations(values){
    const result=[];
    function visit(prefix,rest){
      if(!rest.length){result.push(prefix);return;}
      for(let i=0;i<rest.length;i++)visit([...prefix,rest[i]],rest.filter((_,j)=>j!==i));
    }
    visit([],values);return result;
  }
  return {shortOptions,choices,count,candidates,active,optimizeActive,permutations};
})();
