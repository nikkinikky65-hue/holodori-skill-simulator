async function initializeUnitSimulator(){
  const node=id=>document.getElementById(id);
  const create=(tag,text)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;return element;};
  const status=node('unitStatus');
  try{
    const catalog=await loadRuntimeCardCatalog();
    try{
      const response=await fetch(new URL('data/runtime-affiliations.json',document.baseURI));
      if(response.ok){const data=await response.json();if(data.format==='holodori-affiliations-v1'&&data.canonicalSha256===catalog.dataset.canonicalSha256)catalog.affiliationCatalog=data;}
    }catch(error){ /* Missing affiliation data leaves those conditions unresolved. */ }
    const slots=Array.from({length:5},()=>({cardId:'',training:0,bloom:0,short:0,totalAdjustments:{board:{kind:'external-total',value:''},costume:{kind:'external-total',value:''}}}));
    const previews=[];
    let model=null;
    const table=(headers,rows)=>{
      const wrapper=create('div');wrapper.className='unitTableScroll';
      const result=create('table');
      const head=create('thead'), tr=create('tr');
      for(const text of headers) tr.append(create('th',text));head.append(tr);result.append(head);
      const body=create('tbody');
      for(const row of rows){const line=create('tr');for(const text of row)line.append(create('td',text));body.append(line);}
      result.append(body);wrapper.append(result);return wrapper;
    };
    const pts=value=>['performance','technique','sense','total'].map(key=>value[key] ?? '—');
    function refresh(){
      node('unitResult').replaceChildren();node('unitResultStatus').textContent='編成・曲時間を変更した場合は再実行してください。';
      try{
        model=UnitSimulatorEngine.build(catalog,slots,Number(node('unitDuration').value),{kind:'manual-rate',percent:node('unitMemoryPercent').value},{kind:'manual-rate',percent:node('unitEnhancementPercent').value});
        const rows=[];
        model.members.forEach((member,i)=>{
          previews[i].textContent=member ? canonicalEffectsText(member.expansion)+`\n使用Lv：SP ${member.expansion.levels.special} / A ${member.expansion.levels.active} / P ${member.expansion.levels.passive}` : 'カード未選択';
          if(!member)return;
          for(const [part,label] of [['base','基礎'],['opening','開花増分'],['passive','Passive補正（適用済み分）'],['subtotal','現在計算値']]) rows.push([`枠${i+1} ${member.card.name}`,label,...pts(member.parameters[part])]);
        });
        for(const [part,label] of [['base','基礎合計'],['opening','開花増分合計'],['passive','Passive合計（適用済み分）'],['subtotal','現在計算値合計']]) rows.push(['編成（選択済み）',label,...pts(model.parameters[part])]);
        node('unitParameters').replaceChildren(table(['対象','内訳','P','T','S','TOTAL'],rows));
        for(const member of model.parameters.members){
          const details=create('details'),summary=create('summary',`${member.cardId}：Parameter trace`);
          const trace=create('pre',JSON.stringify(member.trace,null,2));trace.style.whiteSpace='pre-wrap';
          details.append(summary,trace);node('unitParameters').append(details);
        }
        node('unitScore').textContent=`暫定Unit Score：${model.unitScore.value.toLocaleString()}（現在計算値ベース${model.unitScore.hasUnresolved?'・未接続効果あり':''}）`;
        node('unitTimelineScore').textContent=`全発動時の暫定スコア：${model.allSuccessScore.toLocaleString(undefined,{maximumFractionDigits:2})}`;
        ActiveTimelineView.render({container:node('unitTimeline'),detail:node('unitTimelineDetail'),members:model.activeMembers,eventsByMember:model.eventsByMember,duration:model.duration,probabilities:ActivationProbabilityRules.percent});
        node('unitRun').disabled=model.parameters.status!=='card-only';
        status.textContent=`${catalog.cards.length}枚 / 選択 ${model.activeMembers.length}人（5人でシミュレーション実行可能）`;
      }catch(error){model=null;node('unitRun').disabled=true;node('unitParameters').replaceChildren();node('unitTimeline').replaceChildren();status.textContent=error.message;}
    }
    slots.forEach((slot,i)=>{
      const panel=create('article');panel.className='unitSlot';panel.append(create('h3',`枠${i+1}`));
      const searchLabel=create('label','カード名・メンバー名で検索'),search=create('input');search.type='search';searchLabel.append(search);
      const cardLabel=create('label','カード'),choice=create('select');choice.dataset.unitCard=String(i);cardLabel.append(choice);
      function choices(){
        const query=search.value.trim().toLocaleLowerCase();choice.replaceChildren(new Option('未選択',''));
        for(const card of catalog.cards.filter(card=>card.id===slot.cardId||`${card.name} ${canonicalMemberName(card)}`.toLocaleLowerCase().includes(query)))choice.append(new Option(`${canonicalMemberName(card)} / ★${card.classification.rarity.mapping.value} / ${card.name}`,card.id));
        choice.value=slot.cardId;
      }
      choices();search.addEventListener('input',choices);
      choice.addEventListener('change',()=>{slot.cardId=choice.value;refresh();});
      const growth=create('div');growth.className='canonicalGrowth';
      for(const [key,label,max] of [['training','特訓',4],['bloom','開花',5]]){
        const control=create('label',label),select=create('select');select.dataset[key]='';
        for(let n=0;n<=max;n++)select.append(new Option(String(n),String(n)));
        select.addEventListener('change',()=>{slot[key]=Number(select.value);refresh();});control.append(select);growth.append(control);
      }
      const preview=create('p');preview.className='unitPreview';previews.push(preview);
      panel.append(searchLabel,cardLabel,growth,preview);node('unitSlots').append(panel);
    });
    node('unitDuration').addEventListener('input',refresh);
    node('unitMemoryPercent').addEventListener('input',refresh);
    node('unitEnhancementPercent').addEventListener('input',refresh);
    node('unitProbability').textContent='暫定発動率：'+[['low','低'],['mid','中'],['high','高']].map(([key,label])=>`${label}${ActivationProbabilityRules.percent[key]}%`).join(' / ');
    node('unitRun').addEventListener('click',()=>{
      try{
        const result=UnitSimulatorEngine.simulate(model,Number(node('unitTrials').value));
        node('unitResult').replaceChildren(table(['集計','結果'],[['mean','平均'],['median','中央値'],['min','最小'],['max','最大'],['p10','10%点'],['p90','90%点']].map(([key,label])=>[label,result.statistics[key].toLocaleString(undefined,{maximumFractionDigits:2})])));
        node('unitResultStatus').textContent=`${result.statistics.count}試行完了（実行時の編成）`;
      }catch(error){node('unitResultStatus').textContent=error.message;}
    });
    refresh();
    return {getModel:()=>model};
  }catch(error){status.textContent=`初期化できませんでした：${error.message}`;throw error;}
}
const unitSimulatorReady=initializeUnitSimulator();
