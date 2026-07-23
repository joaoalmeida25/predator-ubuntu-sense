import type { NeuralCoreInspectionConfig } from "./neural-core-inspection.types";

export const DEFAULT_NEURAL_CORE_INSPECTION_CONFIG: NeuralCoreInspectionConfig = {
  enabled: false,
  camera: {
    allowRotate: true,
    allowZoom: true,
    allowPan: true,
    minimumDistance: 2.25,
    maximumDistance: 6.2,
    minimumPolarAngle: 0.35,
    maximumPolarAngle: Math.PI - 0.35,
    maximumPanDistance: 0.85,
    dampingFactor: 0.085,
    focusDistance: 3,
    focusTransitionSeconds: 0.55,
  },
  behavior: {
    pauseOnEnter: false,
    clearSelectionOnExit: true,
    focusSelectedCluster: true,
    dimUnrelatedContext: true,
    highlightRelatedConnections: true,
  },
  panel: {
    enabled: true,
    widthPx: 328,
    compactWidthPx: 286,
    maximumMetrics: 4,
    showDescription: true,
    showImpact: true,
    showRelationships: true,
  },
  visualDensity: {
    enabled: true,
    distance: {
      microMaximum: 3.15,
      mesoMaximum: 4.65,
    },
    macro: {
      baseConnectionOpacity: 1,
      ambientParticleOpacity: 1,
      unrelatedNodeOpacity: 1,
    },
    meso: {
      baseConnectionOpacity: 0.72,
      ambientParticleOpacity: 0.58,
      unrelatedNodeOpacity: 0.78,
    },
    micro: {
      baseConnectionOpacity: 0.38,
      ambientParticleOpacity: 0.12,
      unrelatedNodeOpacity: 0.34,
      relatedConnectionEmphasis: 1.12,
      internalConnectionEmphasis: 1.2,
    },
    transitionDamping: 8.5,
  },
};
