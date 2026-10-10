// Orchestration only: no formula duplication and no persistence.
const UnitSimulatorEngine = (() => {
  function build(catalog, slots, duration, memoryInput, enhancementInput, specialStarts = {}, specialEnabled = true, leaderInput = null){
    if(slots.length!==5) throw Error('5枠の編成が必要です');
    if(!Number.isFinite(duration)||duration<=0) throw Error('曲時間を正の数にしてください');
    const byId=new Map(catalog.cards.map(card=>[card.id,card]));
    const members=slots.map((selection,index)=>{
      if(!selection.cardId) return null;
      const card=byId.get(selection.cardId);
      if(!card) throw Error('カードが見つかりません');
      if(!Number.isFinite(selection.short)||selection.short<0) throw Error('発動頻度UPが不正です');
      const expansion=expandCanonicalBloom(card,selection.bloom,catalog.dataset,selection.training);
      const active=adaptCanonicalCardToActiveInput(card,expansion.levels.active);
      return {slot:index+1,card,expansion,
        parameters:{...UnitParameterEngine.calculateMemberParameter(card,selection.training,selection.bloom),slot:index+1,totalAdjustmentInputs:selection.totalAdjustments},
        active:{slot:index+1,name:card.name,interval:active.interval,duration:active.duration,boost:active.boost,prob:active.probability,short:selection.short}};
    });
    const parameters=UnitParameterEngine.calculateUnitParameter(members.filter(Boolean).map(member=>member.parameters),memoryInput,enhancementInput,catalog.affiliationCatalog?.canonicalSha256===catalog.dataset.canonicalSha256?catalog.affiliationCatalog:null,leaderInput);
    members.filter(Boolean).forEach((member,index)=>{member.parameters=parameters.members[index];});
    const activeMembers=members.filter(Boolean).map(member=>member.active);
    const eventsByMember=activeMembers.map(member=>ActiveTimelineEngine.events(member,duration));
    const segments=ActiveTimelineEngine.maxSegments(eventsByMember.flat(),duration);
    const unitScore=UnitScoreEngine.calculate(parameters);
    const specialSchedule=SpecialScheduleEngine.build(members,duration,specialStarts);
    const probabilitySources=ActivationProbabilityEngine.fromSchedule(specialSchedule);
    const passiveSupport=specialEnabled ? ScheduledSupportEngine.passive(members,catalog.affiliationCatalog?.canonicalSha256===catalog.dataset.canonicalSha256?catalog.affiliationCatalog:null) : {sources:[],targets:[],unresolved:[],stackingUnresolved:[],status:'disabled'};
    const leaderSupport=LeaderSupportEngine.resolve(leaderInput,members.filter(Boolean).map(m=>m.parameters),catalog.affiliationCatalog?.canonicalSha256===catalog.dataset.canonicalSha256?catalog.affiliationCatalog:null);
    const supported=specialEnabled||leaderSupport.targets.some(t=>t.rate>0)?ScheduledSupportEngine.evaluate(eventsByMember.flat(),duration,specialEnabled?specialSchedule:{status:'disabled',entries:[]},passiveSupport,{leaderSupport}):{segments,intervals:[]};
    const activationSupport=eventsByMember.flat().map(e=>LeaderSupportEngine.atActivation(e,specialSchedule,passiveSupport,leaderSupport,specialEnabled));
    const activeOnlyX=ActiveRandomSimulation.integrate(segments,duration);
    const allSuccessX=ActiveRandomSimulation.integrate(supported.segments,duration);
    const supportTrace={leaderSupport,activationSupport,probabilitySources,enabled:specialEnabled,status:specialEnabled?'enabled':'disabled',schedule:specialSchedule,passiveSupport,intervals:supported.intervals,
      specials:specialSchedule.entries.map(sp=>({...sp,overlapIntervals:supported.intervals.filter(i=>i.spSlot===sp.slot&&i.active.length)}))};
    return {leaderSupport,activationSupport,members,parameters,unitScore,duration,activeMembers,eventsByMember,segments,
      probabilitySources,specialEnabled,specialSchedule,passiveSupport,supportedSegments:supported.segments,supportTrace,activeOnlyX,allSuccessX,allSuccessScore:allSuccessX*unitScore.value};
  }
  function simulate(model,count,random=Math.random,{support=true,probabilitySources=[],allowProbabilityHypothesis=false}={}){
    if(model.parameters.status!=='card-only') throw Error('5人のカードを選択してください');
    const prepared=ActiveRandomSimulation.prepare(model.activeMembers,model.duration,ActiveTimelineEngine.events,q=>ActivationProbabilityRules.probability(q),
      ({member,event,baseProbability})=>ActivationProbabilityEngine.resolve({baseProbability,member:member.slot,time:event.start,
        sources:[...(model.probabilitySources||[]),...probabilitySources],spEnabled:model.specialEnabled!==false,
        allowHypothesis:allowProbabilityHypothesis}));
    const segmentBuilder=support ? (events,duration)=>ScheduledSupportEngine.evaluate(events,duration,model.specialEnabled!==false?model.specialSchedule:{status:'disabled',entries:[]},model.specialEnabled!==false?model.passiveSupport:{targets:[]},{trace:false,leaderSupport:model.leaderSupport}).segments : ActiveTimelineEngine.maxSegments;
    const normalized=ActiveRandomSimulation.run(prepared,count,segmentBuilder,random);
    const values=normalized.values.map(value=>value*model.unitScore.value);
    return {values,statistics:ActiveRandomSimulation.statistics(values),normalized,probabilityTrace:prepared.candidates.map(c=>c.probabilityTrace),unitScore:model.unitScore};
  }
  return {build,simulate};
})();
