export type NeuralCoreNarrativePhaseKind =
  | "receiving"
  | "transmitting"
  | "executing"
  | "reading"
  | "writing"
  | "consolidating"
  | "deciding"
  | "warning"
  | "failing"
  | "recovering"
  | "synchronizing"
  | "completing"
  | "idle"
  | "custom";

export type NeuralCoreClusterVisualBehavior =
  | "burst"
  | "persistent"
  | "sequential"
  | "unstable"
  | "degrading"
  | "synchronized"
  | "neutral";

export interface NeuralCoreClusterVisualBehaviorConfig {
  behavior: NeuralCoreClusterVisualBehavior;
  nodeScale: number;
  hubScale: number;
  internalConnectionEmphasis: number;
  pulseFrequency: number;
  pulseVariance: number;
  persistence: number;
  synchronization: number;
}

export interface NeuralCoreNarrativePhaseProgress {
  current: number;
  total: number;
  label?: string;
}

export interface NeuralCoreNarrativePhase {
  id: string;
  kind: NeuralCoreNarrativePhaseKind;
  label: string;
  description?: string;
  startSeconds: number;
  durationSeconds: number;
  clusterIds?: readonly string[];
  synapseIds?: readonly string[];
  pathwayIds?: readonly string[];
  emphasis?: {
    cluster: number;
    route: number;
    contextDim: number;
    internalActivity: number;
  };
  clusterBehavior?: NeuralCoreClusterVisualBehaviorConfig;
  arrivalReaction?: number;
  progress?: NeuralCoreNarrativePhaseProgress;
  holdAtEnd?: boolean;
}

export interface NeuralCoreNarrative {
  id: string;
  durationSeconds: number;
  loop?: boolean;
  phases: readonly NeuralCoreNarrativePhase[];
}

export interface NeuralCoreNarrativeState {
  narrativeId?: string;
  activePhaseId?: string;
  activePhaseKind: NeuralCoreNarrativePhaseKind;
  label?: string;
  description?: string;
  clusterIds: readonly string[];
  synapseIds: readonly string[];
  pathwayIds: readonly string[];
  phaseProgress: number;
  transitionProgress: number;
  phaseDurationSeconds: number;
  clusterEmphasis: number;
  routeEmphasis: number;
  contextDim: number;
  internalActivity: number;
  clusterBehavior?: NeuralCoreClusterVisualBehaviorConfig;
  arrivalReaction: number;
  progress?: NeuralCoreNarrativePhaseProgress;
  isActive: boolean;
}

export interface NeuralCoreNarrativeConfig {
  enabled: boolean;
  showOverlay: boolean;
  showDescription: boolean;
  showProgress: boolean;
  transition: {
    fadeInSeconds: number;
    fadeOutSeconds: number;
  };
  focusIndicator: {
    enabled: boolean;
    mode: "subtle" | "hidden";
    maximumOpacity: number;
    scaleMultiplier: number;
  };
}

export interface NeuralCoreNarrativeConfigInput {
  enabled?: boolean;
  showOverlay?: boolean;
  showDescription?: boolean;
  showProgress?: boolean;
  transition?: Partial<NeuralCoreNarrativeConfig["transition"]>;
  focusIndicator?: Partial<NeuralCoreNarrativeConfig["focusIndicator"]>;
}

export interface EvaluateNeuralCoreNarrativeParams {
  narrative?: NeuralCoreNarrative;
  elapsedSeconds: number;
}
