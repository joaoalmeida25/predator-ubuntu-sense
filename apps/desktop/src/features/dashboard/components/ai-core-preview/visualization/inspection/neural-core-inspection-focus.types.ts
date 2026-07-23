import type { NeuralCoreSceneDirectionState } from "../direction/neural-core-scene-direction.types";

export interface NeuralCoreInspectionFocusState {
  selectedClusterId?: string;
  relatedClusterIds: readonly string[];
  relatedSynapseIds: readonly string[];
  relatedPathwayIds: readonly string[];
}

export interface NeuralCoreInspectionPickCandidate {
  clusterId: string;
  distanceToCamera: number;
  distanceToRay: number;
  priority: number;
}

export type NeuralCoreInspectionDirectionState = NeuralCoreSceneDirectionState;
