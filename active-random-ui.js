// A view with session-only accumulation; trial calculation remains unchanged.
(() => {
  const area=document.querySelector('#randomSimulation');
  const status=area.querySelector('[role=status]');
  const output=area.querySelector('.randomResults');
  const button=area.querySelector('button');
  area.querySelector('.randomProbability').textContent = '暫定発動率：' +
    [['low','低'],['mid','中'],['high','高']].map(([key,label])=>`${label} ${ActivationProbabilityRules.percent[key]}%`).join(' / ');
  const accumulator=SimulationAccumulator.create();
  let running=false;
  const input=()=>({duration:Math.max(.01,num(document.querySelector('#song').value,120)),members:getMembers().map(({slot,libraryCardId,memberId,interval,prob,duration,boost,short})=>({slot,libraryCardId,memberId,interval,prob,duration,boost,short}))});
  function sync(){if(accumulator.sync(input())){output.replaceChildren();status.textContent='条件変更：累積0試行。再実行してください。';}}
  area.querySelector('[data-random-reset]').addEventListener('click',()=>{accumulator.reset();output.replaceChildren();status.textContent='累積0試行：リセットしました。';});
  button.addEventListener('click', () => {
    if(running)return;running=true;button.disabled=true;
    try{
      sync();const {duration}=input();
      const count=Number(area.querySelector('select').value);accumulator.checkSize(count);
      const prepared=ActiveRandomSimulation.prepare(getMembers(), duration, events, quality=>ActivationProbabilityRules.probability(quality));
      const batch=ActiveRandomSimulation.run(prepared,count,maxSegments);
      const result=accumulator.append(batch.values);output.replaceChildren();
      const metrics=document.createElement('dl'); metrics.className='randomMetrics';
      for(const [key,label] of [['mean','平均'],['variance','分散'],['median','中央値'],['min','最小'],['max','最大'],['p10','10%点'],['p90','90%点'],['count','累積試行数']]){
        const group=document.createElement('div'), term=document.createElement('dt'), value=document.createElement('dd');
        term.textContent=label; value.dataset.randomMetric=key;
        value.textContent=key==='count' ? `${result.statistics[key]}回` : `${result.statistics[key].toFixed(2)}${key==='variance'?'X²':'X'}`;
        group.append(term,value); metrics.append(group);
      }
      output.append(metrics);
      SimulationDistributionView.render(output,result);
      status.textContent=`今回${count}試行 / 累積${result.statistics.count}試行：曲時間 ${duration}s、発動候補 ${prepared.candidates.length}件。`;
    }catch(error){ status.textContent=`実行できませんでした：${error.message}`; }finally{running=false;button.disabled=false;}
  });
  const invalidate=sync;
  document.addEventListener('active-inputs-rendered',sync);
  document.querySelector('#song').addEventListener('input',invalidate);
  document.querySelector('#cards').addEventListener('input',invalidate);
  document.querySelector('#cards').addEventListener('change',invalidate);
})();
