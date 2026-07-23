import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";

export const getNeuralCoreNarrativeArrivalIntensity = (
  state: NeuralCoreNarrativeState,
): number => {
  if (!state.isActive || state.arrivalReaction <= 0 || state.phaseProgress < 0.68) {
    return 0;
  }
  const arrivalProgress = Math.min(1, Math.max(0, (state.phaseProgress - 0.68) / 0.32));
  return Math.sin(arrivalProgress * Math.PI) * state.arrivalReaction;
};
