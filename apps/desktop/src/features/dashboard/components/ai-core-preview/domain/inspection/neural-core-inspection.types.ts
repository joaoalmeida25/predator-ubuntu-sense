export type NeuralCoreInteractionMode = "presentation" | "inspection";

export interface NeuralCoreInspectionConfig {
  enabled: boolean;
  camera: {
    allowRotate: boolean;
    allowZoom: boolean;
    allowPan: boolean;
    minimumDistance: number;
    maximumDistance: number;
    minimumPolarAngle: number;
    maximumPolarAngle: number;
    maximumPanDistance: number;
    dampingFactor: number;
    focusDistance: number;
    focusTransitionSeconds: number;
  };
  behavior: {
    pauseOnEnter: boolean;
    clearSelectionOnExit: boolean;
    focusSelectedCluster: boolean;
    dimUnrelatedContext: boolean;
    highlightRelatedConnections: boolean;
  };
  panel: {
    enabled: boolean;
    widthPx: number;
    compactWidthPx: number;
    maximumMetrics: number;
    showDescription: boolean;
    showImpact: boolean;
    showRelationships: boolean;
  };
  visualDensity: NeuralCoreInspectionVisualDensityConfig;
}

export type NeuralCoreVisualDensityLevel = "macro" | "meso" | "micro";

export interface NeuralCoreInspectionVisualDensityConfig {
  enabled: boolean;
  distance: {
    microMaximum: number;
    mesoMaximum: number;
  };
  macro: {
    baseConnectionOpacity: number;
    ambientParticleOpacity: number;
    unrelatedNodeOpacity: number;
  };
  meso: {
    baseConnectionOpacity: number;
    ambientParticleOpacity: number;
    unrelatedNodeOpacity: number;
  };
  micro: {
    baseConnectionOpacity: number;
    ambientParticleOpacity: number;
    unrelatedNodeOpacity: number;
    relatedConnectionEmphasis: number;
    internalConnectionEmphasis: number;
  };
  transitionDamping: number;
}

export interface NeuralCoreInspectionConfigInput {
  enabled?: boolean;
  camera?: Partial<NeuralCoreInspectionConfig["camera"]>;
  behavior?: Partial<NeuralCoreInspectionConfig["behavior"]>;
  panel?: Partial<NeuralCoreInspectionConfig["panel"]>;
  visualDensity?: {
    enabled?: boolean;
    distance?: Partial<NeuralCoreInspectionVisualDensityConfig["distance"]>;
    macro?: Partial<NeuralCoreInspectionVisualDensityConfig["macro"]>;
    meso?: Partial<NeuralCoreInspectionVisualDensityConfig["meso"]>;
    micro?: Partial<NeuralCoreInspectionVisualDensityConfig["micro"]>;
    transitionDamping?: number;
  };
}

export interface NeuralCoreInspectionState {
  mode: NeuralCoreInteractionMode;
  selectedClusterId?: string;
  hoveredClusterId?: string;
  isPaused: boolean;
  isCameraTransitioning: boolean;
  relatedClusterIds: readonly string[];
  relatedSynapseIds: readonly string[];
  relatedPathwayIds: readonly string[];
}
