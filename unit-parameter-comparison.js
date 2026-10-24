// Presentation only. Values and selection traces belong to the existing engine.
const UnitParameterComparison = (() => {
  const keys=['performance','technique','sense'];
  const labels={performance:'P',technique:'T',sense:'S'};
  const number=value=>Number.isFinite(value)?value.toLocaleString('ja-JP',{maximumFractionDigits:8}):'—';
  const rate=value=>Number.isFinite(value)&&value!==0?`${value>0?'+':''}${number(value)}%`:'';
  function project(model){
    const sources=(model?.parameters?.members || []).flatMap(m=>m.trace || []).filter(t=>t.effect&&Array.isArray(t.targetSlots)&&t.status==='resolved');
    return Array.from({length:5},(_,index)=>{
      const member=model?.members?.[index];
      if(!member)return {slot:index+1,empty:true};
      const p=member.parameters;
      const memoryTrace=p.trace.find(t=>t.kind==='Memory');
      const afterBloom=Object.fromEntries(keys.map(key=>[key,memoryTrace?.parameters.find(t=>t.parameter===key)?.referenceValue ?? null]));
      afterBloom.total=p.enhancementBonus.components.cardAfterBloom;
      const received=keys.flatMap(key=>sources.filter(t=>t.targetSlots.includes(member.slot)&&t.parameters.some(v=>v.parameter===key&&(v.targetSlot ?? t.sourceSlot)===member.slot)).map(t=>({
        parameter:key,sourceSlot:t.sourceSlot,sourceCardId:t.sourceCardId,
        name:model.members.find(m=>m?.slot===t.sourceSlot)?.card.name || t.sourceCardId,
        ratePercent:t.effect.value,description:t.description
      })));
      return {slot:member.slot,cardId:member.card.id,name:member.card.name,memberName:member.card.member.name,
        parameters:p,afterBloom,received,
        rows:keys.map(key=>({key,label:labels[key],afterBloom:afterBloom[key],passiveRate:p.passive.rates[key],passiveAdded:p.passive[key],final:p.subtotal[key]})),
        ptsSubtotal:keys.reduce((sum,key)=>sum+p.subtotal[key],0),total:p.subtotal.total,
        unresolved:p.corrections.map(c=>`${c.label}：${c.reason || c.status}`)};
    });
  }
  function element(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function art(view,imageResolver){
    const candidates=view.empty?[]:(imageResolver?.candidates(view.cardId) || []);
    if(!candidates.length)return null;
    const shell=element('div','parameterArt');shell.dataset.imageKind='placeholder';
    const status=element('span','parameterImageStatus',view.empty?'未選択':'画像なし');
    shell.append(status);
    let index=0;
    function next(){
      const candidate=candidates[index++];
      if(!candidate){shell.closest('.parameterMember')?.classList.remove('hasParameterImage');shell.remove();return;}
      const image=element('img');image.alt='';image.loading='lazy';image.decoding='async';
      image.onload=()=>{shell.dataset.imageKind=candidate.kind;status.textContent=candidate.kind==='thin'?'Thin':candidate.kind==='thumb'?'Thumb':'Full';};
      image.onerror=()=>{image.remove();next();};
      image.src=candidate.url;shell.append(image);
    }
    next();return shell;
  }
  function detailTable(view){
    const p=view.parameters;
    const table=element('table','parameterDetailTable');
    const caption=element('caption',null,'補正内訳');table.append(caption);
    const thead=element('thead'),header=element('tr');
    for(const title of ['内訳','P','T','S','TOTAL']){const cell=element('th',null,title);cell.scope='col';header.append(cell);}
    thead.append(header);table.append(thead);
    const body=element('tbody');
    const rows=[['開花後',view.afterBloom,null],['Passive率',p.passive.rates,'rate'],['Passive増分',p.passive],['Leader',p.leader],['Memory',p.memory],['Board',p.board],['衣装',p.costume],['Enhancement',p.enhancementBonus],['現在計算値',p.subtotal]];
    for(const [label,values,format] of rows){
      const row=element('tr');const title=element('th',null,label);title.scope='row';row.append(title);
      for(const key of [...keys,'total'])row.append(element('td',null,format==='rate'?(key==='total'?'—':rate(values[key])||'0%'):number(values?.[key])));
      body.append(row);
    }
    table.append(body);return table;
  }
  function card(view,detailed,imageResolver){
    const article=element('article','parameterMember');article.dataset.parameterSlot=String(view.slot);
    article.setAttribute('aria-label',`枠${view.slot} ${view.empty?'カード未選択':view.memberName+' '+view.name}`);
    const picture=art(view,imageResolver);
    if(picture){article.classList.add('hasParameterImage');article.append(picture);}
    const info=element('div','parameterMemberInfo');
    const heading=element('header','parameterIdentity');
    heading.append(element('span','parameterSlot',`SLOT ${view.slot}`),element('h3',null,view.empty?'カード未選択':view.memberName),element('p','parameterCardName',view.empty?'編成からカードを選択':view.name));
    if(!view.empty)heading.title=`${view.memberName} / ${view.name}`;
    info.append(heading);
    const stack=element('div','parameterStack');
    for(const key of keys){
      const row=view.empty?{label:labels[key],afterBloom:null,passiveRate:null,final:null}:view.rows.find(r=>r.key===key);
      const group=element('div','parameterMetric');group.dataset.parameter=key;
      const before=element('span','parameterBefore',number(row.afterBloom));before.setAttribute('aria-label',`開花後 ${number(row.afterBloom)}`);
      const correction=element('span','parameterRate',rate(row.passiveRate));correction.setAttribute('aria-label',Number.isFinite(row.passiveRate)?`累計Passive ${number(row.passiveRate)}%`:'Passive未確認');
      const final=element('strong','parameterFinal',number(row.final));final.setAttribute('aria-label',`補正後の現在計算値 ${number(row.final)}`);
      group.append(element('span','parameterLabel',row.label),before,correction,final);stack.append(group);
    }
    info.append(stack);
    const total=element('p','parameterTotal');total.append(element('span',null,'TOTAL'),element('strong',null,view.empty?'—':number(view.total)));info.append(total);
    if(!view.empty&&view.unresolved.length)info.append(element('p','parameterPending','未設定・未確定の補正あり'));
    if(detailed&&!view.empty){
      info.append(detailTable(view),element('p','parameterPtsSum',`P/T/S小計 ${number(view.ptsSubtotal)}`));
      info.append(element('h4',null,'受けているParameter Passive'));
      const list=element('ul','parameterSources');
      for(const source of view.received){
        const li=element('li',null,`枠${source.sourceSlot} ${source.name} · ${labels[source.parameter]} ${rate(source.ratePercent)}`);
        if(source.description)li.title=source.description;list.append(li);
      }
      if(!view.received.length)list.append(element('li',null,'適用済みのParameter Passiveなし'));
      info.append(list,element('p','parameterDetailNote','増分はエンジンの合算・端数処理後の値です。補正元ごとの増分には分割しません。'));
      if(view.unresolved.length){const details=element('details','parameterUnknown'),summary=element('summary',null,'未設定・未確定の内訳'),unknown=element('ul');for(const text of view.unresolved)unknown.append(element('li',null,text));details.append(summary,unknown);info.append(details);}
    }
    article.append(info);return article;
  }
  function mount(root,{imageResolver=null}={}){
    let detailed=false,current=null;
    function render(model){
      current=model;
      const heading=element('div','parameterComparisonHeading'),title=element('h3',null,'5人のParameter比較'),controls=element('div','parameterMode');
      controls.setAttribute('role','group');controls.setAttribute('aria-label','Parameter表示モード');
      for(const [label,value] of [['簡易',false],['詳細',true]]){
        const button=element('button',null,label);button.type='button';button.setAttribute('aria-pressed',String(detailed===value));
        button.addEventListener('click',()=>{detailed=value;render(current);root.querySelectorAll('.parameterMode button')[value?1:0].focus();});controls.append(button);
      }
      heading.append(title,controls);
      const legend=element('p','parameterLegend','各P/T/Sは上から「開花後の基準値 → 累計Passive率 → 補正後の現在計算値」。0%の行は空欄です。');
      const note=element('p','parameterScope','最終欄は既存エンジンの現在計算値です。Board・衣装・EnhancementはTOTAL専用で、P/T/Sへの配分は未定義です。未設定・未対応値は「—」とし、推定しません。');
      const hint=element('p','parameterScrollHint','5人を編成順に表示。幅が足りない場合は左右にスクロールできます。');
      const scroll=element('div','parameterComparisonScroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','5人のParameter比較・横スクロール');
      const strip=element('div','parameterComparisonStrip'+(detailed?' isDetailed':''));
      for(const view of project(model))strip.append(card(view,detailed,imageResolver));scroll.append(strip);
      const previousScroll=root.querySelector('.parameterComparisonScroll')?.scrollLeft || 0;
      root.replaceChildren(heading,legend,note,hint,scroll);scroll.scrollLeft=previousScroll;
    }
    render(null);
    return {render,clear:()=>render(null)};
  }
  return {project,mount,number,rate};
})();
