// Reuse caseC produced by the existing parameter-rules.test.js fixture.
{
const layers=caseC.members.map(member=>UnitParameterEngine.calculateEnhancementLayer({
 cardAfterBloom:member.base.total,appliedPassive:member.passive.total,board:UnitParameterEngine.resolveTotalAdjustment({kind:'external-total',value:String(member.board.total)}).total,outfit:UnitParameterEngine.resolveTotalAdjustment({kind:'external-total',value:String(member.outfit.total)}).total
},{kind:'manual-rate',percent:'2.43'}));
assert(layers.every((layer,i)=>layer.total===caseC.members[i].enhancement),'existing CASE C member expectations');
assert(layers.reduce((sum,layer)=>sum+layer.total,0)===caseC.enhancement,'existing CASE C total 1397');
assert(layers.every(layer=>layer.scope==='complete-basis'),'CASE C complete input basis');
print('Enhancement layer vs existing CASE C: 248/300/301/297/251 = 1397 PASS');
}
