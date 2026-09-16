import type {
  NeuralCoreClusterPositionHint,
  NeuralCorePathway,
} from "./neural-core-topology.types";

export interface NeuralCoreClusterCompatibilityData {
  readonly plasticity?: number;
  readonly positionHint?: NeuralCoreClusterPositionHint;
  readonly stability?: number;
}

export interface NeuralCoreTopologyCompatibilityData {
  readonly clusterDataById: ReadonlyMap<string, NeuralCoreClusterCompatibilityData>;
  readonly pathways?: readonly NeuralCorePathway[];
}
