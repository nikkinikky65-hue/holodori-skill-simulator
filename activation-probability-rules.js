// Provisional legacy estimates, not measured game probabilities.
const ActivationProbabilityRules = Object.freeze({
  provisional: true,
  percent: Object.freeze({low:35, mid:45, high:55}),
  probability(quality){
    if(!Object.hasOwn(this.percent, quality)) throw Error('未対応の定性発動率です');
    return this.percent[quality] / 100;
  }
});
