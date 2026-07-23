import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export interface NeuralCoreTopologyVisualConfig {
  maximumClusterOverlapRatio: number;
  minimumClusterSeparation: number;
}

export type NeuralCoreTopologyVisualConfigInput = Partial<NeuralCoreTopologyVisualConfig>;

export interface NeuralCoreClusterVisualRegion {
  clusterId: string;
  center: NeuralCoreVector3;
  radius: number;
  nodeIndices: number[];
  hubIndices: number[];
}

export interface NeuralCoreSynapseVisualRoute {
  synapseId: string;
  fromClusterId: string;
  toClusterId: string;
  start: NeuralCoreVector3;
  end: NeuralCoreVector3;
  controlPoints: NeuralCoreVector3[];
  color: string;
}

export interface NeuralCorePathwayVisualRoute {
  pathwayId: string;
  clusterIds: readonly string[];
  synapseIds: readonly string[];
}

export interface NeuralCoreTopologyVisualLookups {
  clusterRegionById: Readonly<Record<string, NeuralCoreClusterVisualRegion>>;
  neighborClusterIdsByClusterId: Readonly<Record<string, readonly string[]>>;
  pathwayRouteById: Readonly<Record<string, NeuralCorePathwayVisualRoute>>;
  synapseIdsByClusterId: Readonly<Record<string, readonly string[]>>;
  synapseRouteById: Readonly<Record<string, NeuralCoreSynapseVisualRoute>>;
}

export interface NeuralCoreTopologyVisualState {
  clusterRegions: NeuralCoreClusterVisualRegion[];
  synapseRoutes: NeuralCoreSynapseVisualRoute[];
  pathwayRoutes: NeuralCorePathwayVisualRoute[];
  lookups: NeuralCoreTopologyVisualLookups;
}
