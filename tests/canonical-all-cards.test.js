const allCanonical = JSON.parse(readFile('data/runtime-cards.json'));
assertCanonical(allCanonical.cards.length===185, '185 cards available');
let activeCount=0;
const mappedMembers=new Set();
for(const card of allCanonical.cards){
  for(const level of [1,2]){
    const expansion=expandCanonicalCard(card, {passive:level, active:level, special:3-level}, allCanonical.dataset);
    const input=expansion.activeInput;
    assertCanonical(HOLO_MEMBERS.some(member=>member.id===input.memberId && member.name===canonicalMemberName(card)), 'unique localized member mapping');
    mappedMembers.add(input.memberId);
    const rawLevel=card.skills.active.levels.find(l=>l.level===level);
    const description=canonicalSkillText(rawLevel).replace(/\[[^\]]+\]/g,'');
    const display=description.match(/スコアが([\d.]+)%UP/);
    assertCanonical(display && Number(display[1])===input.boost, 'Active raw/display percentage cross-check: '+card.id);
    assertCanonical(input.interval>0 && input.duration>0 && ['low','mid','high'].includes(input.probability), 'supported Active projection');
    assertCanonical(expansion.passive.calculationStatus==='deferred' && expansion.special.calculationStatus==='display-only', 'P/SP excluded');
    const observed=expansion.passive.data.condition.state==='observed';
    assertCanonical(expansion.passive.conditionStatus===(observed?'observed-not-evaluated':'unresolved'), 'observed vs unobserved P conditions');
    const event=adaptCanonicalCardToEventCard(card,level,expansion);
    assertCanonical(Object.keys(event.skills).join()==='active', 'Event only executes Active');
    activeCount++;
  }
}
assertCanonical(mappedMembers.size===54 && activeCount===370, 'all member and level coverage');
const full=JSON.parse(readFile('research/canonical-cards.json'));
for(const card of allCanonical.cards){
  const original=full.cards.find(item=>item.sourceCard.sourceId===card.id);
  for(const level of [1,2]){
    const input=adaptCanonicalCardToActiveInput(card,level);
    const src=original.skills.active.levels.find(item=>item.levelFact.rawValue===level);
    const raw = field => src.facts.find(f=>f.sourceField===field).rawValue;
    assertCanonical(input.interval===raw('coolTimeMillisecond')/1000 && input.duration===raw('effectDurationMillisecond')/1000,'original Active times unchanged');
    assertCanonical(input.boost===Number(src.baseEffect.facts.find(f=>f.sourceField==='value').rawValue)/10,'only original base effect applied');
  }
}
print('All 185 cards / 54 members / 370 Active levels: Runtime projection equals complete Canonical PASS');
