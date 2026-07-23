export type NeuralCoreDetailLevel = "overview" | "summary" | "detail";

export interface NeuralCoreClusterDetailVisibility {
  showName: boolean;
  showType: boolean;
  showStatus: boolean;
  showActivity: boolean;
  showMetrics: boolean;
  showDescription: boolean;
  showImpact: boolean;
  showRelationships: boolean;
}

export interface NeuralCoreClusterLodState {
  clusterId: string;
  level: NeuralCoreDetailLevel;
  priority: number;
  distanceToCamera: number;
  isFocused: boolean;
  isCritical: boolean;
  visibility: NeuralCoreClusterDetailVisibility;
}

export interface NeuralCoreLodState {
  /** When false, consumers must ignore LOD rules and use their own fallback. */
  enabled: boolean;
  clusters: readonly NeuralCoreClusterLodState[];
  visibleClusterIds: readonly string[];
}

export interface NeuralCoreLodConfig {
  enabled: boolean;
  distance: {
    detailMaximum: number;
    summaryMaximum: number;
  };
  limits: {
    /** Independent quotas: clusters are counted in exactly one resulting level. */
    maximumOverviewClusters: number;
    maximumSummaryClusters: number;
    maximumDetailClusters: number;
  };
  priority: {
    focusedBoost: number;
    criticalBoost: number;
    activityInfluence: number;
    importanceInfluence: number;
  };
}

export interface NeuralCoreLodConfigInput {
  enabled?: boolean;
  distance?: Partial<NeuralCoreLodConfig["distance"]>;
  limits?: Partial<NeuralCoreLodConfig["limits"]>;
  priority?: Partial<NeuralCoreLodConfig["priority"]>;
}
