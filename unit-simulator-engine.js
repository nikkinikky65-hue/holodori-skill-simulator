// Orchestration only: no formula duplication and no persistence.
const UnitSimulatorEngine = (() => {
  function build(catalog, slots, duration, memoryInput, enhancementInput, specialStarts = {}){
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
    const parameters=UnitParameterEngine.calculateUnitParameter(members.filter(Boolean).map(member=>member.parameters),memoryInput,enhancementInput,catalog.affiliationCatalog?.canonicalSha256===catalog.dataset.canonicalSha256?catalog.affiliationCatalog:null);
    members.filter(Boolean).forEach((member,index)=>{member.parameters=parameters.members[index];});
    const activeMembers=members.filter(Boolean).map(member=>member.active);
    const eventsByMember=activeMembers.map(member=>ActiveTimelineEngine.events(member,duration));
    const segments=ActiveTimelineEngine.maxSegments(eventsByMember.flat(),duration);
    const unitScore=UnitScoreEngine.calculate(parameters);
    const specialSchedule=SpecialScheduleEngine.build(members,duration,specialStarts);
    const passiveSupport=ScheduledSupportEngine.passive(members,catalog.affiliationCatalog?.canonicalSha256===catalog.dataset.canonicalSha256?catalog.affiliationCatalog:null);
    const supported=ScheduledSupportEngine.evaluate(eventsByMember.flat(),duration,specialSchedule,passiveSupport);
    const activeOnlyX=ActiveRandomSimulation.integrate(segments,duration);
    const allSuccessX=ActiveRandomSimulation.integrate(supported.segments,duration);
    const supportTrace={schedule:specialSchedule,passiveSupport,intervals:supported.intervals,
      specials:specialSchedule.entries.map(sp=>({...sp,overlapIntervals:supported.intervals.filter(i=>i.spSlot===sp.slot&&i.active.length)}))};
    return {members,parameters,unitScore,duration,activeMembers,eventsByMember,segments,
      specialSchedule,passiveSupport,supportedSegments:supported.segments,supportTrace,activeOnlyX,allSuccessX,allSuccessScore:allSuccessX*unitScore.value};
  }
  function simulate(model,count,random=Math.random,{support=true}={}){
    if(model.parameters.status!=='card-only') throw Error('5人のカードを選択してください');
    const prepared=ActiveRandomSimulation.prepare(model.activeMembers,model.duration,ActiveTimelineEngine.events,q=>ActivationProbabilityRules.probability(q));
    const segmentBuilder=support ? (events,duration)=>ScheduledSupportEngine.evaluate(events,duration,model.specialSchedule,model.passiveSupport,{trace:false}).segments : ActiveTimelineEngine.maxSegments;
    const normalized=ActiveRandomSimulation.run(prepared,count,segmentBuilder,random);
    const values=normalized.values.map(value=>value*model.unitScore.value);
    return {values,statistics:ActiveRandomSimulation.statistics(values),normalized,unitScore:model.unitScore};
  }
  return {build,simulate};
})();
