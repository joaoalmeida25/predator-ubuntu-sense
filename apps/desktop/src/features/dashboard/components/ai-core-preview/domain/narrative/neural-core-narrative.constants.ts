import type {
  NeuralCoreClusterVisualBehaviorConfig,
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeState,
} from "./neural-core-narrative.types";

export const EMPTY_NEURAL_CORE_NARRATIVE_STATE: NeuralCoreNarrativeState = {
  activePhaseKind: "idle",
  clusterIds: [],
  synapseIds: [],
  pathwayIds: [],
  phaseProgress: 0,
  transitionProgress: 0,
  phaseDurationSeconds: 0,
  clusterEmphasis: 0,
  routeEmphasis: 0,
  contextDim: 0,
  internalActivity: 0,
  arrivalReaction: 0,
  isActive: false,
};

export const NEUTRAL_NEURAL_CORE_CLUSTER_VISUAL_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "neutral",
  nodeScale: 1,
  hubScale: 1,
  internalConnectionEmphasis: 0,
  pulseFrequency: 0,
  pulseVariance: 0,
  persistence: 0,
  synchronization: 0,
};

export const DEFAULT_NEURAL_CORE_NARRATIVE_CONFIG: NeuralCoreNarrativeConfig = {
  enabled: true,
  showOverlay: false,
  showDescription: true,
  showProgress: true,
  transition: {
    fadeInSeconds: 0.24,
    fadeOutSeconds: 0.28,
  },
  focusIndicator: {
    enabled: true,
    mode: "subtle",
    maximumOpacity: 0.085,
    scaleMultiplier: 0.92,
  },
};

export const NEURAL_CORE_NARRATIVE_ATTACK_RATIO = 0.18;
export const NEURAL_CORE_NARRATIVE_RELEASE_RATIO = 0.82;
