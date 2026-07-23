import {
  DEFAULT_NEURAL_CORE_NARRATIVE_CONFIG,
  NEURAL_CORE_NARRATIVE_ATTACK_RATIO,
  NEURAL_CORE_NARRATIVE_RELEASE_RATIO,
} from "./neural-core-narrative.constants";
import type {
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeConfigInput,
} from "./neural-core-narrative.types";

export const clampNeuralCoreNarrativeValue = (
  value: number,
  minimum = 0,
  maximum = 1,
): number => {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
};

export const getNeuralCoreNarrativeTransition = (progress: number): number => {
  const amount = clampNeuralCoreNarrativeValue(progress);
  if (amount < NEURAL_CORE_NARRATIVE_ATTACK_RATIO) {
    const attack = amount / NEURAL_CORE_NARRATIVE_ATTACK_RATIO;
    return attack * attack * (3 - 2 * attack);
  }
  if (amount <= NEURAL_CORE_NARRATIVE_RELEASE_RATIO) {
    return 1;
  }
  const release = (amount - NEURAL_CORE_NARRATIVE_RELEASE_RATIO)
    / (1 - NEURAL_CORE_NARRATIVE_RELEASE_RATIO);
  const easedRelease = release * release * (3 - 2 * release);
  return 1 - easedRelease;
};

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

export const resolveNeuralCoreNarrativeConfig = (
  input?: NeuralCoreNarrativeConfigInput,
  showNarrativeOverlay?: boolean,
): NeuralCoreNarrativeConfig => {
  const base = DEFAULT_NEURAL_CORE_NARRATIVE_CONFIG;
  return {
    enabled: input?.enabled ?? base.enabled,
    showOverlay: showNarrativeOverlay ?? input?.showOverlay ?? base.showOverlay,
    showDescription: input?.showDescription ?? base.showDescription,
    showProgress: input?.showProgress ?? base.showProgress,
    transition: {
      fadeInSeconds: finiteInRange(
        input?.transition?.fadeInSeconds,
        base.transition.fadeInSeconds,
        0.05,
        2,
      ),
      fadeOutSeconds: finiteInRange(
        input?.transition?.fadeOutSeconds,
        base.transition.fadeOutSeconds,
        0.05,
        2,
      ),
    },
    focusIndicator: {
      enabled: input?.focusIndicator?.enabled ?? base.focusIndicator.enabled,
      mode: input?.focusIndicator?.mode ?? base.focusIndicator.mode,
      maximumOpacity: finiteInRange(
        input?.focusIndicator?.maximumOpacity,
        base.focusIndicator.maximumOpacity,
        0,
        0.2,
      ),
      scaleMultiplier: finiteInRange(
        input?.focusIndicator?.scaleMultiplier,
        base.focusIndicator.scaleMultiplier,
        0.72,
        1.2,
      ),
    },
  };
};

export const getNeuralCoreNarrativeTimelineSeconds = (
  elapsedSeconds: number,
  durationSeconds: number,
  loop: boolean,
): number => {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0);
  const safeDuration = Math.max(0, Number.isFinite(durationSeconds) ? durationSeconds : 0);
  if (safeDuration <= 0) {
    return 0;
  }
  return loop
    ? ((safeElapsed % safeDuration) + safeDuration) % safeDuration
    : Math.min(safeDuration, safeElapsed);
};
