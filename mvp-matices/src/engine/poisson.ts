/**
 * Smallest integer k such that P(X <= k) >= probability, with X ~ Poisson(lambda).
 * Computed in log space so large lambdas do not underflow.
 */
export function poissonQuantile(lambda: number, probability: number): number {
  if (lambda <= 0) return 0;
  const limit = Math.ceil(lambda + 20 * Math.sqrt(lambda) + 50);
  let logTerm = -lambda;
  let cumulative = Math.exp(logTerm);
  let k = 0;
  while (cumulative < probability && k < limit) {
    k += 1;
    logTerm += Math.log(lambda) - Math.log(k);
    cumulative += Math.exp(logTerm);
  }
  return k;
}
