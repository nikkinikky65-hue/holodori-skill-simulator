// Pure simulation. Timeline generation and overlap semantics are supplied by A.
const ActiveRandomSimulation = (() => {
  function seededRandom(seed){
    let state = seed >>> 0;
    return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  }
  function prepare(members, duration, generateEvents, probability){
    if(!Number.isFinite(duration) || duration <= 0) throw Error('曲時間を正の数にしてください');
    return {duration, candidates: members.flatMap(member => {
      const candidates = generateEvents(member, duration);
      if(!candidates.length) return [];
      const p = probability(member.prob);
      if(!Number.isFinite(p) || p < 0 || p > 1) throw Error('発動確率が範囲外です');
      return candidates.map(event => ({event, probability:p}));
    })};
  }
  function integrate(segments, duration){
    // maxSegments supplies non-overlapping boosted intervals; all gaps are 1X/s.
    return duration + segments.reduce((sum, segment) => sum + (segment.end-segment.start)*segment.boost/100, 0);
  }
  function trial(prepared, segmentBuilder, random = Math.random){
    const successful = prepared.candidates.filter(candidate => random() < candidate.probability).map(candidate => candidate.event);
    return integrate(segmentBuilder(successful, prepared.duration), prepared.duration);
  }
  function quantile(sorted, p){
    const index = (sorted.length-1)*p, lo = Math.floor(index), hi = Math.ceil(index);
    return sorted[lo] + (sorted[hi]-sorted[lo])*(index-lo);
  }
  function statistics(values){
    if(!values.length || values.some(value=>!Number.isFinite(value))) throw Error('集計対象が不正です');
    const sorted = [...values].sort((a,b)=>a-b);
    return {count:values.length, mean:values.reduce((a,b)=>a+b,0)/values.length,
      median:quantile(sorted,.5), min:sorted[0], max:sorted[sorted.length-1], p10:quantile(sorted,.1), p90:quantile(sorted,.9)};
  }
  function histogram(values, bins=10){
    const {min,max}=statistics(values);
    const width=(max-min)/bins;
    const groups=Array.from({length:width ? bins : 1},(_,i)=>({from:min+i*width,to:min+(i+1)*width,count:0}));
    for(const value of values) groups[width ? Math.min(bins-1,Math.floor((value-min)/width)) : 0].count++;
    return groups;
  }
  function run(prepared, count, segmentBuilder, random = Math.random){
    if(!Number.isInteger(count) || count<1 || count>10000) throw Error('試行回数は1〜10,000回です');
    const values = Array.from({length:count},()=>trial(prepared,segmentBuilder,random));
    return {values, statistics:statistics(values)};
  }
  return {seededRandom, prepare, integrate, trial, statistics, histogram, run};
})();
