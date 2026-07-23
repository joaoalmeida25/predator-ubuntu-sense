import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import type { NeuralCoreSynapseVisualRoute } from "../topology/neural-core-topology-visual.types";

export interface NeuralCorePropagationPointField {
  colors: Float32Array;
  maximumPointCount: number;
  opacities: Float32Array;
  positions: Float32Array;
  sizes: Float32Array;
}

export interface NeuralCorePropagationClusterBufferRegion {
  clusterId: string;
  hubNodeIds: readonly number[];
  nodeIds: readonly number[];
}

export interface NeuralCorePropagationBufferState {
  clusterActivationColors: Float32Array;
  clusterActivationIntensities: Float32Array;
  clusterActivationOpacities: Float32Array;
  clusterActivationSizes: Float32Array;
  clusterField: NeuralCorePropagationPointField;
  clusterIndexById: Readonly<Record<string, number>>;
  clusterFocusLevels: Uint8Array;
  clusterRegions: readonly NeuralCorePropagationClusterBufferRegion[];
  nodeActivationById: Float32Array;
  nodePositionsById: Record<number, NeuralCoreVector3>;
  packedColorByHex: Record<string, number>;
  pulseField: NeuralCorePropagationPointField;
  routesBySynapseId: Record<string, NeuralCoreSynapseVisualRoute>;
  synapseFocusLevels: Uint8Array;
  synapseIndexById: Readonly<Record<string, number>>;
}
