import type {
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export type NeuralCoreClusterVisualMode = "territory" | "expanded" | "context";

export interface NeuralCoreClusterVisualState {
  clusterId: string;
  mode: NeuralCoreClusterVisualMode;
  territoryOpacity: number;
  territoryScale: number;
  territoryEmphasis: number;
  hubOpacity: number;
  hubScale: number;
  internalNodeOpacity: number;
  internalConnectionOpacity: number;
  boundaryOpacity: number;
  activityIntensity: number;
  isSelected: boolean;
  isRelated: boolean;
  isProtagonist: boolean;
}

export interface NeuralCoreClusterTerritory {
  clusterId: string;
  center: NeuralCoreVector3;
  boundaryScale: NeuralCoreVector3;
  legacyBoundaryScale: NeuralCoreVector3;
  boundaryPoints: Float32Array;
  boundarySeeds: Float32Array;
  hubFilamentPositions: Float32Array;
  radius: number;
  color: string;
  status: NeuralCoreTopologyStatus;
  activity: number;
  priority: number;
  nodeIds: readonly number[];
  hubNodeIds: readonly number[];
}

export type NeuralCoreAggregatedRouteDirection =
  | "forward"
  | "backward"
  | "bidirectional";

export interface NeuralCoreAggregatedRoute {
  id: string;
  sourceClusterId: string;
  targetClusterId: string;
  synapseIds: readonly string[];
  pathwayIds: readonly string[];
  activity: number;
  status: NeuralCoreTopologyStatus;
  direction: NeuralCoreAggregatedRouteDirection;
  sourceAnchor: NeuralCoreVector3;
  targetAnchor: NeuralCoreVector3;
  controlPoints: readonly NeuralCoreVector3[];
  color: string;
  communicationWeight: number;
}

export interface NeuralCoreAggregatedRouteVisualState {
  routeId: string;
  opacity: number;
  thickness: number;
  emphasis: number;
  pulseOpacity: number;
  detailOpacity: number;
  priority: number;
  isVisible: boolean;
  isActive: boolean;
  isRelated: boolean;
  isProtagonist: boolean;
}

export interface NeuralCoreAggregatedRouteVisibilityConfig {
  maximumMacroRoutes: number;
  maximumMesoRoutes: number;
  minimumActivity: number;
  protagonistPriority: number;
  criticalPriority: number;
  activePriority: number;
  relatedPriority: number;
  inactiveOpacity: number;
}

export interface NeuralCoreClusterGrammarConfig {
  enabled: boolean;
  macro: {
    maximumVisibleTerritories: number;
    internalNodeSampleRatio: number;
    internalConnectionSampleRatio: number;
  };
  meso: {
    maximumRelatedTerritories: number;
    internalNodeVisibility: number;
    internalConnectionVisibility: number;
  };
  micro: {
    selectedInternalNodeVisibility: number;
    selectedInternalConnectionVisibility: number;
    relatedTerritoryOpacity: number;
    contextTerritoryOpacity: number;
  };
  routes: NeuralCoreAggregatedRouteVisibilityConfig;
  transitionDamping: number;
}

export interface NeuralCoreClusterGrammarConfigInput {
  enabled?: boolean;
  macro?: Partial<NeuralCoreClusterGrammarConfig["macro"]>;
  meso?: Partial<NeuralCoreClusterGrammarConfig["meso"]>;
  micro?: Partial<NeuralCoreClusterGrammarConfig["micro"]>;
  routes?: Partial<NeuralCoreClusterGrammarConfig["routes"]>;
  transitionDamping?: number;
}

export interface NeuralCoreClusterGrammarLookups {
  routeIndicesByClusterId: Readonly<Record<string, readonly number[]>>;
  routeIndexBySynapseId: Readonly<Record<string, number>>;
  territoryIndexByClusterId: Readonly<Record<string, number>>;
}

export interface NeuralCoreClusterGrammarState {
  enabled: boolean;
  territories: readonly NeuralCoreClusterTerritory[];
  routes: readonly NeuralCoreAggregatedRoute[];
  lookups: NeuralCoreClusterGrammarLookups;
}

export interface NeuralCoreClusterGrammarRuntime {
  clusterStates: NeuralCoreClusterVisualState[];
  routeStates: NeuralCoreAggregatedRouteVisualState[];
  visibleTerritoryIds: string[];
}

export interface NeuralCoreClusterGrammarFocus {
  selectedClusterId?: string;
  relatedClusterIds: readonly string[];
  protagonistClusterId?: string;
  narrativeClusterIds: readonly string[];
  narrativeSynapseIds: readonly string[];
  narrativePathwayIds: readonly string[];
}

export interface NeuralCoreClusterGrammarDensity {
  macroWeight: number;
  mesoWeight: number;
  microWeight: number;
}

export interface NeuralCoreClusterGrammarBufferState {
  nodeOpacitiesByGraphIndex: Float32Array;
  pointCloudOpacities: readonly Float32Array[];
  pointCloudGraphIndices: readonly Int16Array[];
  connectionOpacities: readonly Float32Array[];
  ribbonOpacities: Float32Array;
  nodeTerritoryIndices: Int16Array;
  nodeSampleMask: Uint8Array;
  nodeCorticalMask: Uint8Array;
  connectionTerritoryIndices: readonly Int16Array[];
  connectionSampleMasks: readonly Uint8Array[];
  connectionCorticalMasks: readonly Uint8Array[];
  ribbonRouteIndices: Int16Array;
}

export interface NeuralCoreAggregatedRouteRenderField {
  positions: Float32Array;
  centerPositions: Float32Array;
  colors: Float32Array;
  opacities: Float32Array;
  thicknesses: Float32Array;
  routeIndices: Uint16Array;
}

export interface NeuralCoreAggregatedPulseField {
  positions: Float32Array;
  colors: Float32Array;
  opacities: Float32Array;
  sizes: Float32Array;
  maximumPointCount: number;
  routeColors: Float32Array;
  scratchPoint: NeuralCoreVector3;
}
