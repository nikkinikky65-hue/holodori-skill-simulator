// A-only view; no localStorage or changes to Timeline/formation state.
(() => {
  const area=document.querySelector('#randomSimulation');
  const status=area.querySelector('[role=status]');
  const output=area.querySelector('.randomResults');
  const button=area.querySelector('button');
  area.querySelector('.randomProbability').textContent = '暫定発動率：' +
    [['low','低'],['mid','中'],['high','高']].map(([key,label])=>`${label} ${ActivationProbabilityRules.percent[key]}%`).join(' / ');
  button.addEventListener('click', () => {
    output.replaceChildren();
    try{
      const duration=Math.max(.01,num(document.querySelector('#song').value,120));
      const prepared=ActiveRandomSimulation.prepare(getMembers(), duration, events, quality=>ActivationProbabilityRules.probability(quality));
      const result=ActiveRandomSimulation.run(prepared, Number(area.querySelector('select').value), maxSegments);
      const metrics=document.createElement('dl'); metrics.className='randomMetrics';
      for(const [key,label] of [['mean','平均'],['median','中央値'],['min','最小'],['max','最大'],['p10','10%点'],['p90','90%点'],['count','試行回数']]){
        const group=document.createElement('div'), term=document.createElement('dt'), value=document.createElement('dd');
        term.textContent=label; value.dataset.randomMetric=key;
        value.textContent=key==='count' ? `${result.statistics[key]}回` : `${result.statistics[key].toFixed(2)}X`;
        group.append(term,value); metrics.append(group);
      }
      output.append(metrics);
      const caption=document.createElement('p');caption.textContent='結果分布（横軸：X値／縦軸：試行数）';
      const chart=document.createElement('div');chart.className='randomHistogram';
      const bins=ActiveRandomSimulation.histogram(result.values);
      const largest=Math.max(...bins.map(bin=>bin.count));
      for(const bin of bins){
        const column=document.createElement('div');column.className='randomBin';
        const bar=document.createElement('div');bar.className='randomBar';
        bar.style.height=`${100*bin.count/largest}px`;
        bar.title=`${bin.from.toFixed(2)}〜${bin.to.toFixed(2)}X：${bin.count}回`;
        const count=document.createElement('span');count.textContent=bin.count;
        const label=document.createElement('small');label.textContent=`${bin.from.toFixed(2)}〜${bin.to.toFixed(2)}X`;
        column.append(count,bar,label);chart.append(column);
      }
      output.append(caption,chart);
      status.textContent=`完了：曲時間 ${duration}s、発動候補 ${prepared.candidates.length}件。実行時点の編成で集計しました。`;
    }catch(error){ status.textContent=`実行できませんでした：${error.message}`; }
  });
  const invalidate=()=>{output.replaceChildren();status.textContent='入力変更後は再実行してください。';};
  document.querySelector('#song').addEventListener('input',invalidate);
  document.querySelector('#cards').addEventListener('input',invalidate);
  document.querySelector('#cards').addEventListener('change',invalidate);
})();
