// Provisional parameter-total scale, not the game's absolute scoring formula.
const UnitScoreEngine = Object.freeze({
  calculate(parameters){
    const value=parameters.subtotal.total;
    if(!Number.isFinite(value)||value<0) throw Error('現在計算TOTALが不正です');
    const unresolved=[...parameters.unresolved,...parameters.corrections,
      ...parameters.members.flatMap(member=>member.corrections)];
    return {value,status:'provisional',basis:'parameter-current-total',parameterStatus:parameters.status,
      incomplete:parameters.members.length!==5,hasUnresolved:unresolved.length>0,unresolved};
  }
});
