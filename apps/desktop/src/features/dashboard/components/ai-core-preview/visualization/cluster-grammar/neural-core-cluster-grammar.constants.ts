import type {
  NeuralCoreClusterGrammarConfig,
  NeuralCoreClusterGrammarState,
} from "./neural-core-cluster-grammar.types";

export const DEFAULT_NEURAL_CORE_CLUSTER_GRAMMAR_CONFIG: NeuralCoreClusterGrammarConfig = {
  enabled: false,
  macro: {
    maximumVisibleTerritories: 7,
    internalNodeSampleRatio: 0.1,
    internalConnectionSampleRatio: 0.08,
  },
  meso: {
    maximumRelatedTerritories: 4,
    internalNodeVisibility: 0.66,
    internalConnectionVisibility: 0.58,
  },
  micro: {
    selectedInternalNodeVisibility: 1,
    selectedInternalConnectionVisibility: 0.94,
    relatedTerritoryOpacity: 0.64,
    contextTerritoryOpacity: 0.28,
  },
  routes: {
    maximumMacroRoutes: 6,
    maximumMesoRoutes: 8,
    minimumActivity: 0.04,
    protagonistPriority: 8,
    criticalPriority: 5,
    activePriority: 3,
    relatedPriority: 4,
    inactiveOpacity: 0.08,
  },
  transitionDamping: 6.5,
};

export const EMPTY_NEURAL_CORE_CLUSTER_GRAMMAR_STATE: NeuralCoreClusterGrammarState = {
  enabled: false,
  territories: [],
  routes: [],
  lookups: {
    routeIndicesByClusterId: {},
    routeIndexBySynapseId: {},
    territoryIndexByClusterId: {},
  },
};

export const NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS = 22;
export const NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_PULSES = 2;
export const NEURAL_CORE_CLUSTER_GRAMMAR_PULSE_TRAIL_SAMPLES = 3;
