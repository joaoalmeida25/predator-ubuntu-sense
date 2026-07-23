const finiteNeuralCoreValue = (value: number, fallback: number): number => {
  return Number.isFinite(value) ? value : fallback;
};

export const dampNeuralCoreValue = (
  current: number,
  target: number,
  response: number,
  deltaSeconds: number,
): number => {
  const safeTarget = finiteNeuralCoreValue(target, 0);
  const safeCurrent = finiteNeuralCoreValue(current, safeTarget);
  const safeResponse = Math.max(0, finiteNeuralCoreValue(response, 0));
  const safeDeltaSeconds = Math.max(0, Math.min(1, finiteNeuralCoreValue(deltaSeconds, 0)));

  if (safeResponse === 0 || safeDeltaSeconds === 0 || Object.is(safeCurrent, safeTarget)) {
    return safeCurrent;
  }

  const amount = 1 - Math.exp(-safeResponse * safeDeltaSeconds);
  const value = safeCurrent + (safeTarget - safeCurrent) * amount;

  return Number.isFinite(value) ? value : safeTarget;
};
