import type {
  NeuralCoreClusterVisualBehaviorConfig,
  NeuralCoreNarrativeState,
} from "../../domain/narrative/neural-core-narrative.types";

export interface NeuralCoreNarrativeVisualState {
  narrativeState: NeuralCoreNarrativeState;
  activeClusterIds: Readonly<Record<string, true>>;
  clusterBehaviorById: Readonly<Record<string, NeuralCoreClusterVisualBehaviorConfig>>;
  activeSynapseIds: Readonly<Record<string, true>>;
  arrivalClusterIds: Readonly<Record<string, true>>;
  arrivalIntensity: number;
}
