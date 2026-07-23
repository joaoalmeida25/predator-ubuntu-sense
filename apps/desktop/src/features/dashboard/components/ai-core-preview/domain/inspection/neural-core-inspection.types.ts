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
  cameraRendering: NeuralCoreInspectionCameraRenderingConfig;
}

export type NeuralCoreVisualDensityLevel = "macro" | "meso" | "micro";

export type NeuralCoreInspectionVisibilityRole =
  | "selected"
  | "related"
  | "context"
  | "ambient"
  | "decorative";

export interface NeuralCoreInspectionVisibilityConfig {
  selected: {
    minimumNodeOpacity: number;
    minimumConnectionOpacity: number;
    minimumInternalConnectionOpacity: number;
    minimumPulseOpacity: number;
    emphasis: number;
  };
  related: {
    minimumNodeOpacity: number;
    minimumConnectionOpacity: number;
    minimumPulseOpacity: number;
    emphasis: number;
  };
  context: {
    minimumNodeOpacity: number;
    minimumConnectionOpacity: number;
  };
  ambient: {
    minimumOpacity: number;
    microOpacity: number;
  };
  decorative: {
    minimumOpacity: number;
    microOpacity: number;
  };
}

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
  visibility: NeuralCoreInspectionVisibilityConfig;
  relatedConnections: {
    minimumOpacity: number;
    minimumThickness: number;
    protagonistThicknessMultiplier: number;
    relatedThicknessMultiplier: number;
  };
  selectedClusterEnvelope: {
    enabled: boolean;
    maximumOpacity: number;
    scaleMultiplier: number;
    edgeSoftness: number;
    pulseInfluence: number;
  };
  decoration: {
    microArcOpacity: number;
    microBaseOpacity: number;
    microGlobalGlowOpacity: number;
  };
  transitionDamping: number;
}

export interface NeuralCoreInspectionCameraRenderingConfig {
  enabled: boolean;
  distance: {
    near: number;
    far: number;
  };
  nodes: {
    minimumScreenSize: number;
    maximumScreenSize: number;
    selectedMaximumScreenSize: number;
    nearDistanceScale: number;
    farDistanceScale: number;
    nearExposureCompensation: number;
    farExposureCompensation: number;
    additiveCompensation: number;
  };
  connections: {
    minimumNearOpacity: number;
    minimumFarOpacity: number;
    minimumNearThickness: number;
    minimumFarThickness: number;
    selectedThicknessMultiplier: number;
    relatedThicknessMultiplier: number;
    farContrastBoost: number;
  };
  pulses: {
    minimumOpacity: number;
    nearDistanceScale: number;
    farDistanceScale: number;
    nearExposureCompensation: number;
    farExposureCompensation: number;
  };
  fog: {
    preserveFunctionalTopology: boolean;
    dynamicEnvironmentFog: boolean;
    farMargin: number;
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
    visibility?: {
      selected?: Partial<NeuralCoreInspectionVisibilityConfig["selected"]>;
      related?: Partial<NeuralCoreInspectionVisibilityConfig["related"]>;
      context?: Partial<NeuralCoreInspectionVisibilityConfig["context"]>;
      ambient?: Partial<NeuralCoreInspectionVisibilityConfig["ambient"]>;
      decorative?: Partial<NeuralCoreInspectionVisibilityConfig["decorative"]>;
    };
    relatedConnections?: Partial<
      NeuralCoreInspectionVisualDensityConfig["relatedConnections"]
    >;
    selectedClusterEnvelope?: Partial<
      NeuralCoreInspectionVisualDensityConfig["selectedClusterEnvelope"]
    >;
    decoration?: Partial<NeuralCoreInspectionVisualDensityConfig["decoration"]>;
    transitionDamping?: number;
  };
  cameraRendering?: {
    enabled?: boolean;
    distance?: Partial<NeuralCoreInspectionCameraRenderingConfig["distance"]>;
    nodes?: Partial<NeuralCoreInspectionCameraRenderingConfig["nodes"]>;
    connections?: Partial<NeuralCoreInspectionCameraRenderingConfig["connections"]>;
    pulses?: Partial<NeuralCoreInspectionCameraRenderingConfig["pulses"]>;
    fog?: Partial<NeuralCoreInspectionCameraRenderingConfig["fog"]>;
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
