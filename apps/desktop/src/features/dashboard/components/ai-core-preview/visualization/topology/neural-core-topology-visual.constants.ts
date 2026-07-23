import type {
  NeuralCoreSynapseKind,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import { NEURAL_CORE_CLUSTER_KIND_SPATIAL_PROFILES } from "../spatial/neural-core-spatial-map.constants";
import type {
  NeuralCoreTopologyVisualConfig,
  NeuralCoreTopologyVisualState,
} from "./neural-core-topology-visual.types";

export const EMPTY_NEURAL_CORE_TOPOLOGY_VISUAL_STATE: NeuralCoreTopologyVisualState = {
  clusterRegions: [],
  synapseRoutes: [],
  pathwayRoutes: [],
  lookups: {
    clusterRegionById: {},
    neighborClusterIdsByClusterId: {},
    pathwayRouteById: {},
    synapseIdsByClusterId: {},
    synapseRouteById: {},
  },
};

export const DEFAULT_NEURAL_CORE_TOPOLOGY_VISUAL_CONFIG: NeuralCoreTopologyVisualConfig = {
  maximumClusterOverlapRatio: 0.12,
  minimumClusterSeparation: 0.38,
};

export const NEURAL_CORE_CLUSTER_KIND_VISUAL_REGIONS = NEURAL_CORE_CLUSTER_KIND_SPATIAL_PROFILES;

export const NEURAL_CORE_TOPOLOGY_STATUS_COLORS: Record<NeuralCoreTopologyStatus, string> = {
  idle: "#4d8dff",
  active: "#8ff4ff",
  processing: "#28dfff",
  success: "#48dfa0",
  warning: "#f3ad42",
  error: "#df3656",
  disabled: "#42657a",
};

export const NEURAL_CORE_SYNAPSE_KIND_COLORS: Record<NeuralCoreSynapseKind, string> = {
  excitatory: "#8ff4ff",
  inhibitory: "#3159b8",
  modulatory: "#ffbf63",
  bidirectional: "#8a6dff",
  relay: "#79dfff",
};
