// Session-only exact aggregation. Does not change trials, RNG ordering or engine formulas.
const SimulationAccumulator=(()=>{
  function identity(value){
    if(Array.isArray(value))return '['+value.map(identity).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+identity(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  function create(limit=1000000){
    let key=null,values=new Float64Array(0),count=0,mean=0,m2=0;
    function reset(){key=null;values=new Float64Array(0);count=0;mean=0;m2=0;}
    function sync(input){const next=identity(input);if(key===next)return false;reset();key=next;return true;}
    function checkSize(n){if(!Number.isInteger(n)||n<1||count+n>limit)throw Error(`累積上限は${limit.toLocaleString()}試行です。リセットしてから実行してください。`);}
    function append(batch){
      checkSize(batch.length);
      if(batch.some(x=>!Number.isFinite(x)))throw Error('試行結果が不正です');
      if(values.length<count+batch.length){const next=new Float64Array(Math.min(limit,Math.max(count+batch.length,values.length*2,1024)));next.set(values.subarray(0,count));values=next;}
      for(const x of batch){values[count++]=x;const delta=x-mean;mean+=delta/count;m2+=delta*(x-mean);}
      return result();
    }
    function result(){
      if(!count)return null;
      const sorted=values.slice(0,count).sort();
      const quantile=p=>{const x=(count-1)*p,lo=Math.floor(x),hi=Math.ceil(x);return sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);};
      const min=sorted[0],max=sorted[count-1],width=(max-min)/10;
      const histogram=Array.from({length:width?10:1},(_,i)=>({from:min+i*width,to:min+(i+1)*width,count:0}));
      for(const x of sorted)histogram[width?Math.min(9,Math.floor((x-min)/width)):0].count++;
      return {statistics:{count,mean,variance:Math.max(0,m2/count),median:quantile(.5),min,max,p10:quantile(.1),p90:quantile(.9)},histogram};
    }
    return {sync,reset,checkSize,append,result,get count(){return count;}};
  }
  return {create,identity};
})();
