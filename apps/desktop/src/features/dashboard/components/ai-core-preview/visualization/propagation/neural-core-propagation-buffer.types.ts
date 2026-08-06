import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import type { NeuralCoreSynapseVisualRoute } from "../topology/neural-core-topology-visual.types";

export interface NeuralCorePropagationPointField {
  colors: Float32Array;
  maximumPointCount: number;
  opacities: Float32Array;
  positions: Float32Array;
  sizes: Float32Array;
}

export interface NeuralCoreOperationalProtagonistMarkerField {
  colors: Float32Array;
  maximumMarkerCount: 1;
  opacities: Float32Array;
  positions: Float32Array;
  sizes: Float32Array;
  tangents: Float32Array;
}

export interface NeuralCoreOperationalProtagonistMarkerConfig {
  markerScaleMultiplier: number;
  pointScale: number;
  minimumScreenLength: number;
  maximumScreenLength: number;
  distanceScaleInfluence: number;
  tangentProbeLength: number;
  aspectRatio: number;
  headPosition: number;
  headRadius: number;
  tailLength: number;
  tailMaximumWidth: number;
  tailFalloff: number;
  minimumOpacity: number;
  semanticColorInfluence: number;
  activeRouteOpacityMultiplier: number;
  activeRouteThicknessMultiplier: number;
  backgroundAmbientPulseMultiplier: number;
  backgroundAggregatedPulseMultiplier: number;
  sourceReactionProgressFraction: number;
  destinationReactionProgressFraction: number;
  arrivalReactionProgressFraction: number;
  sourceReactionIntensity: number;
  destinationReactionIntensity: number;
  destinationAnticipationIntensityRatio: number;
}

export interface NeuralCoreOperationalEndpointReactionState {
  sourceClusterId?: string;
  sourceWeight: number;
  targetClusterId?: string;
  targetWeight: number;
  red: number;
  green: number;
  blue: number;
}

export interface NeuralCorePropagationClusterBufferRegion {
  clusterId: string;
  hubNodeIds: readonly number[];
  nodeIds: readonly number[];
}

export interface NeuralCorePropagationBufferUpdateResult {
  clusterPointCount: number;
  operationalProtagonistMarkerCount: number;
  pulsePointCount: number;
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
  operationalEndpointReactionState: NeuralCoreOperationalEndpointReactionState;
  operationalProtagonistMarkerField: NeuralCoreOperationalProtagonistMarkerField;
  operationalRouteNextScratchPoint: NeuralCoreVector3;
  operationalRoutePreviousScratchPoint: NeuralCoreVector3;
  operationalRouteScratchPoint: NeuralCoreVector3;
  operationalRouteTangentScratchPoint: NeuralCoreVector3;
  packedColorByHex: Record<string, number>;
  pulseField: NeuralCorePropagationPointField;
  routesBySynapseId: Record<string, NeuralCoreSynapseVisualRoute>;
  synapseFocusLevels: Uint8Array;
  synapseIndexById: Readonly<Record<string, number>>;
  updateResult: NeuralCorePropagationBufferUpdateResult;
}
