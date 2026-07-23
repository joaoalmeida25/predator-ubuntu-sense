import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreNarrativeVisualState } from "./neural-core-narrative-visual.types";
import { getNeuralCoreNarrativeArrivalIntensity } from "./neural-core-narrative-visual.utils";

export const mapNeuralCoreNarrativeToVisualState = (
  state: NeuralCoreNarrativeState,
): NeuralCoreNarrativeVisualState => {
  const activeClusterIds: Record<string, true> = {};
  const clusterBehaviorById: Record<string, NonNullable<typeof state.clusterBehavior>> = {};
  for (const clusterId of state.clusterIds) {
    activeClusterIds[clusterId] = true;
    if (state.clusterBehavior) {
      clusterBehaviorById[clusterId] = state.clusterBehavior;
    }
  }
  const activeSynapseIds: Record<string, true> = {};
  for (const synapseId of state.synapseIds) {
    activeSynapseIds[synapseId] = true;
  }
  const arrivalClusterIds: Record<string, true> = {};
  if (state.arrivalReaction > 0) {
    for (const clusterId of state.clusterIds) {
      arrivalClusterIds[clusterId] = true;
    }
  }
  return {
    narrativeState: state,
    activeClusterIds,
    clusterBehaviorById,
    activeSynapseIds,
    arrivalClusterIds,
    arrivalIntensity: getNeuralCoreNarrativeArrivalIntensity(state),
  };
};
