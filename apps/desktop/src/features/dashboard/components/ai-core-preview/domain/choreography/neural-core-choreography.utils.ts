import type {
  NeuralCoreChoreographyBlendMode,
  NeuralCoreChoreographyEasing,
  NeuralCoreChoreographyEnvelope,
  NeuralCoreChoreographyTargetedEffects,
} from "./neural-core-choreography.types";

export const clampNeuralCoreSemanticEffect = (value?: number): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
};

export const applyNeuralCoreChoreographyEasing = (
  easing: NeuralCoreChoreographyEasing,
  progress: number,
): number => {
  const amount = clampNeuralCoreSemanticEffect(progress);

  switch (easing) {
    case "ease-in":
      return amount * amount;
    case "ease-out":
      return 1 - (1 - amount) * (1 - amount);
    case "ease-in-out":
      return amount < 0.5
        ? 2 * amount * amount
        : 1 - Math.pow(-2 * amount + 2, 2) / 2;
    case "pulse":
      return Math.sin(amount * Math.PI);
    case "linear":
      return amount;
  }
};

const finiteNonNegative = (value: number | undefined): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
};

const applyNeuralCoreEnvelopeEasing = (
  easing: NeuralCoreChoreographyEasing,
  progress: number,
): number => {
  return applyNeuralCoreChoreographyEasing(
    easing === "pulse" ? "ease-in-out" : easing,
    progress,
  );
};

export const evaluateNeuralCoreChoreographyEnvelope = (
  elapsedSeconds: number,
  durationSeconds: number,
  envelope: NeuralCoreChoreographyEnvelope,
  easing: NeuralCoreChoreographyEasing = "ease-in-out",
): number => {
  const duration = finiteNonNegative(durationSeconds);
  const elapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : -1;
  if (duration <= 0 || elapsed < 0 || elapsed > duration) {
    return 0;
  }

  const requestedAttackSeconds = finiteNonNegative(envelope.attackSeconds);
  const requestedReleaseSeconds = finiteNonNegative(envelope.releaseSeconds);
  const transitionSeconds = requestedAttackSeconds + requestedReleaseSeconds;
  const transitionScale = transitionSeconds > duration
    ? duration / transitionSeconds
    : 1;
  const attackSeconds = requestedAttackSeconds * transitionScale;
  const releaseSeconds = requestedReleaseSeconds * transitionScale;
  const maximumHoldSeconds = Math.max(0, duration - attackSeconds - releaseSeconds);
  const requestedHoldSeconds = envelope.holdSeconds;
  const holdSeconds = requestedHoldSeconds === undefined
    ? maximumHoldSeconds
    : Math.min(maximumHoldSeconds, finiteNonNegative(requestedHoldSeconds));
  const attackEndSeconds = attackSeconds;
  const holdEndSeconds = attackEndSeconds + holdSeconds;
  const releaseEndSeconds = holdEndSeconds + releaseSeconds;

  if (attackSeconds > 0 && elapsed < attackEndSeconds) {
    return applyNeuralCoreEnvelopeEasing(easing, elapsed / attackSeconds);
  }

  if (elapsed < holdEndSeconds || (holdSeconds > 0 && elapsed === attackEndSeconds)) {
    return 1;
  }

  if (releaseSeconds > 0 && elapsed < releaseEndSeconds) {
    const releaseProgress = (elapsed - holdEndSeconds) / releaseSeconds;
    return 1 - applyNeuralCoreEnvelopeEasing(easing, releaseProgress);
  }

  return 0;
};

export const scaleNeuralCoreSemanticEffects = <TEffects extends object>(
  effects: Partial<TEffects>,
  amount: number,
): Partial<TEffects> => {
  const scaledEntries = Object.entries(effects).map(([key, value]) => {
    const numericValue = typeof value === "number" ? value : 0;
    return [key, clampNeuralCoreSemanticEffect(numericValue * amount)];
  });

  return Object.fromEntries(scaledEntries) as Partial<TEffects>;
};

export const mergeNeuralCoreSemanticEffects = <TEffects extends object>(
  current: Partial<TEffects>,
  incoming: Partial<TEffects>,
  amount = 1,
  blendMode: NeuralCoreChoreographyBlendMode = "maximum",
): Partial<TEffects> => {
  const merged = { ...current } as Record<string, unknown>;
  const blendAmount = clampNeuralCoreSemanticEffect(amount);
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "number") {
      const currentValue = typeof merged[key] === "number"
        ? clampNeuralCoreSemanticEffect(merged[key] as number)
        : 0;
      const targetValue = clampNeuralCoreSemanticEffect(value);
      if (blendMode === "replace") {
        merged[key] = currentValue + (targetValue - currentValue) * blendAmount;
      } else if (blendMode === "additive") {
        merged[key] = clampNeuralCoreSemanticEffect(
          currentValue + targetValue * blendAmount,
        );
      } else {
        merged[key] = Math.max(currentValue, targetValue * blendAmount);
      }
    }
  }

  return merged as Partial<TEffects>;
};

export const mergeNeuralCoreTargetedSemanticEffects = <TEffects extends object>(
  effects: readonly NeuralCoreChoreographyTargetedEffects<TEffects>[],
  targetId: string | undefined,
  incoming: Partial<TEffects>,
  amount = 1,
  blendMode: NeuralCoreChoreographyBlendMode = "maximum",
): NeuralCoreChoreographyTargetedEffects<TEffects>[] => {
  const existingIndex = effects.findIndex((entry) => entry.targetId === targetId);
  if (existingIndex < 0) {
    return [
      ...effects,
      {
        targetId,
        effects: mergeNeuralCoreSemanticEffects({}, incoming, amount, blendMode),
      },
    ];
  }

  return effects.map((entry, index) => {
    return index === existingIndex
      ? {
        ...entry,
        effects: mergeNeuralCoreSemanticEffects(
          entry.effects,
          incoming,
          amount,
          blendMode,
        ),
      }
      : entry;
  });
};
