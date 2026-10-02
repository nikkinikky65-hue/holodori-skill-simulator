// Shared A / next-generation Timeline. Algorithms moved unchanged.
const ActiveTimelineEngine = (() => {
function adjustedInterval(m){
  return m.interval > 0
    ? m.interval / (1 + m.short / 100)
    : 0;
}

function events(m,T){const iv=adjustedInterval(m),out=[];if(iv<=0||m.duration<=0||m.boost<=0)return out;for(let t=iv;t<=T+1e-9&&out.length<1000;t+=iv)out.push({start:t,end:Math.min(T,t+m.duration),boost:m.boost,m});return out}
function calcMax(all,T){const pts=[0,T];all.forEach(e=>{pts.push(e.start,e.end)});pts.sort((a,b)=>a-b);let total=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(b<=a)continue;const mid=(a+b)/2;let mx=0;for(const e of all)if(e.start<=mid&&mid<e.end)mx=Math.max(mx,e.boost);total+=mx*(b-a)}return total}

// ===== shared overlap segmentation
function maxSegments(all,T){
  const pts=[0,T];

  all.forEach(e=>{
    pts.push(e.start,e.end);
  });

  pts.sort((a,b)=>a-b);

  const segments=[];

  for(let i=0;i<pts.length-1;i++){
    const a=pts[i];
    const b=pts[i+1];

    if(b<=a) continue;

    const mid=(a+b)/2;
    let winner=null;

    for(const e of all){
      if(
        e.start<=mid &&
        mid<e.end &&
        (!winner || e.boost>winner.boost)
      ){
        winner=e;
      }
    }

    if(winner){
      const slot=winner.m.slot;
      const prev=segments[segments.length-1];

      if(
        prev &&
        Math.abs(prev.end-a)<1e-9 &&
        prev.boost===winner.boost &&
        prev.slot===slot
      ){
        prev.end=b;
      }else{
        segments.push({
          start:a,
          end:b,
          boost:winner.boost,
          slot
        });
      }
    }
  }

  return segments;
}

return {adjustedInterval, events, calcMax, maxSegments};
})();
