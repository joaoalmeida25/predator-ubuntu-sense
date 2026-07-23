import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativeState,
} from "../../domain/narrative/neural-core-narrative.types";

export interface UseNeuralCoreNarrativeParams {
  narrative?: NeuralCoreNarrative;
  resetKey?: string;
}

export interface UseNeuralCoreNarrativeResult {
  advance: (
    deltaSeconds: number,
    synchronizedElapsedSeconds?: number,
  ) => NeuralCoreNarrativeState;
  reset: () => void;
}
