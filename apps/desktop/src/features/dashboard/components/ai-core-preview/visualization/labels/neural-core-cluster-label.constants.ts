import type { NeuralCoreClusterLabelConfig } from "./neural-core-cluster-label.types";

export const DEFAULT_NEURAL_CORE_CLUSTER_LABEL_CONFIG: NeuralCoreClusterLabelConfig = {
  enabled: false,
  selectedMode: "compact",
  animation: {
    positionDamping: 15,
    opacityDamping: 18,
    scaleDamping: 16,
    leaderLineDamping: 20,
    placementChangePenalty: 120,
  },
  content: {
    maximumDetailMetrics: 2,
    showActivityInSummary: true,
    showImpactInDetail: true,
  },
  layout: {
    viewportPaddingPx: 12,
    collisionPaddingPx: 8,
    preferredOffsetPx: 24,
    maximumDisplacementPx: 72,
    leaderLineThresholdPx: 34,
  },
  visibility: {
    hideRearFacingLabels: true,
    rearFacingThreshold: -0.08,
    fadeInSeconds: 0.18,
    fadeOutSeconds: 0.32,
    levelHysteresisDistance: 0.14,
    layoutRetentionSeconds: 0.48,
  },
};

export const NEURAL_CORE_CLUSTER_LABEL_LAYOUT_RATE_HZ = 12;
export const NEURAL_CORE_CLUSTER_LABEL_CAMERA_EPSILON = 0.006;
export const NEURAL_CORE_CLUSTER_LABEL_NETWORK_TRANSFORM_EPSILON = 0.002;
export const NEURAL_CORE_CLUSTER_LABEL_MAXIMUM_TEXT_LENGTH = 28;
