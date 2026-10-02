// Boundary for a future verified formula. Never equate parameter total with score.
const UnitScoreEngine = Object.freeze({
  calculate(parameters){ return {symbol:'X',value:null,status:'unresolved',parameterStatus:parameters.status}; }
});
