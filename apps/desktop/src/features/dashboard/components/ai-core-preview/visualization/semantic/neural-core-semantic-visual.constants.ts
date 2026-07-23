import type {
  NeuralCoreClusterSemanticEffects,
  NeuralCoreGlobalSemanticEffects,
  NeuralCorePathwaySemanticEffects,
  NeuralCoreSynapseSemanticEffects,
} from "../../domain/choreography/neural-core-choreography.types";
import type {
  NeuralCoreSemanticVisualizationConfig,
  NeuralCoreSemanticVisualState,
} from "./neural-core-semantic-visual.types";

export const EMPTY_NEURAL_CORE_CLUSTER_SEMANTIC_EFFECTS: NeuralCoreClusterSemanticEffects = {
  activity: 0,
  density: 0,
  cohesion: 0,
  internalConnectivity: 0,
  persistence: 0,
  synchronization: 0,
  instability: 0,
  jitter: 0,
  fragmentation: 0,
  nodeDecay: 0,
  fillIntensity: 0,
  pulseFrequency: 0,
  pulseAmplitude: 0,
  colorInfluence: 0,
};

export const EMPTY_NEURAL_CORE_SYNAPSE_SEMANTIC_EFFECTS: NeuralCoreSynapseSemanticEffects = {
  activity: 0,
  emphasis: 0,
  thickness: 0,
  conductivity: 0,
  persistence: 0,
  instability: 0,
  fragmentation: 0,
  interruption: 0,
  pulseFrequency: 0,
  pulseIntensity: 0,
  colorInfluence: 0,
};

export const EMPTY_NEURAL_CORE_PATHWAY_SEMANTIC_EFFECTS: NeuralCorePathwaySemanticEffects = {
  activity: 0,
  sequentialEmphasis: 0,
  synchronization: 0,
  instability: 0,
  completion: 0,
};

export const EMPTY_NEURAL_CORE_GLOBAL_SEMANTIC_EFFECTS: NeuralCoreGlobalSemanticEffects = {
  activity: 0,
  synchronization: 0,
  stability: 0,
  instability: 0,
  jitter: 0,
  fragmentation: 0,
  nodeDecay: 0,
  colorInfluence: 0,
};

export const DEFAULT_NEURAL_CORE_SEMANTIC_VISUALIZATION_CONFIG: NeuralCoreSemanticVisualizationConfig = {
  enabled: true,
  motion: {
    activityResponse: 4.2,
    maximumRotationActivityInfluence: 0.12,
  },
  transition: {
    activationResponse: 7.5,
    releaseResponse: 4.2,
    colorResponse: 5.4,
    displacementResponse: 3.4,
  },
  failure: {
    maximumNodeFragmentationDistance: 0.16,
    maximumRouteOpacityVariation: 0.3,
    nodeDecayThresholdSpread: 0.28,
  },
  topology: {
    maximumClusterOverlapRatio: 0.12,
    minimumClusterSeparation: 0.36,
  },
  cluster: {
    maximumNodeScale: 1.9,
    maximumFillIntensity: 1,
    maximumJitterDistance: 0.085,
    maximumFragmentationDistance: 0.22,
    minimumVisibleOpacity: 0.08,
    internalPulseSpeed: 3.2,
  },
  synapse: {
    minimumThickness: 0.7,
    maximumThickness: 3.8,
    minimumOpacity: 0.025,
    maximumOpacity: 0.68,
    fragmentationSegmentLength: 0.12,
  },
  choreography: {
    defaultTransitionSeconds: 0.55,
    maximumActivePhases: 16,
    loopDemoChoreographies: true,
  },
  color: {
    neutral: "#4d8dff",
    active: "#5de7ff",
    memory: "#9b7bff",
    warning: "#f3ad42",
    error: "#df3656",
    success: "#48dfa0",
  },
};

export const EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE: NeuralCoreSemanticVisualState = {
  clusterEffects: [],
  synapseEffects: [],
  pathwayEffects: [],
  globalEffects: {
    ...EMPTY_NEURAL_CORE_GLOBAL_SEMANTIC_EFFECTS,
    color: DEFAULT_NEURAL_CORE_SEMANTIC_VISUALIZATION_CONFIG.color.neutral,
  },
};
