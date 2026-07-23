import type {
  NeuralCoreClusterDetailVisibility,
  NeuralCoreDetailLevel,
  NeuralCoreLodConfig,
  NeuralCoreLodState,
} from "./neural-core-lod.types";

export const DEFAULT_NEURAL_CORE_LOD_CONFIG: NeuralCoreLodConfig = {
  enabled: true,
  distance: {
    detailMaximum: 3.4,
    summaryMaximum: 5.2,
  },
  limits: {
    maximumOverviewClusters: 8,
    maximumSummaryClusters: 5,
    maximumDetailClusters: 2,
  },
  priority: {
    focusedBoost: 2.4,
    criticalBoost: 1.4,
    activityInfluence: 0.45,
    importanceInfluence: 0.85,
  },
};

export const NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL: Record<
  NeuralCoreDetailLevel,
  NeuralCoreClusterDetailVisibility
> = {
  overview: {
    showName: true,
    showType: false,
    showStatus: true,
    showActivity: false,
    showMetrics: false,
    showDescription: false,
    showImpact: false,
    showRelationships: false,
  },
  summary: {
    showName: true,
    showType: true,
    showStatus: true,
    showActivity: true,
    showMetrics: false,
    showDescription: false,
    showImpact: false,
    showRelationships: false,
  },
  detail: {
    showName: true,
    showType: true,
    showStatus: true,
    showActivity: true,
    showMetrics: true,
    showDescription: true,
    showImpact: true,
    showRelationships: true,
  },
};

export const EMPTY_NEURAL_CORE_LOD_STATE: NeuralCoreLodState = {
  enabled: false,
  clusters: [],
  visibleClusterIds: [],
};
