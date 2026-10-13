// Shared view of the accumulator's complete histogram; never merges batch bins.
const SimulationDistributionView=(()=>{
  function render(container,result,{unit='X'}={}){
    container.querySelector('[data-simulation-distribution]')?.remove();
    if(!result)return;
    const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
    const wrapper=element('div');wrapper.dataset.simulationDistribution='';
    const caption=element('p',`累積結果分布（横軸：${unit==='X'?'X値':'暫定スコア'}／縦軸：試行数、累積${result.statistics.count.toLocaleString()}回）`);
    const chart=element('div');chart.className='randomHistogram';chart.setAttribute('aria-label','累積試行の分布');
    const bins=result.histogram,largest=Math.max(...bins.map(bin=>bin.count));
    for(const bin of bins){
      const column=element('div');column.className='randomBin';column.dataset.count=String(bin.count);column.dataset.from=String(bin.from);column.dataset.to=String(bin.to);
      const bar=element('div');bar.className='randomBar';bar.style.height=`${largest?100*bin.count/largest:0}px`;
      const range=`${bin.from.toFixed(2)}〜${bin.to.toFixed(2)}${unit}`;
      bar.title=`${range}：${bin.count}回`;
      column.append(element('span',bin.count),bar,element('small',range));chart.append(column);
    }
    wrapper.append(caption,chart);container.append(wrapper);
  }
  return {render};
})();
