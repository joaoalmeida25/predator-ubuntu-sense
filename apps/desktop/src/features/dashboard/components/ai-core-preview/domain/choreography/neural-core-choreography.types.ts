export interface NeuralCoreClusterSemanticEffects {
  activity: number;
  density: number;
  cohesion: number;
  internalConnectivity: number;
  persistence: number;
  synchronization: number;
  instability: number;
  jitter: number;
  fragmentation: number;
  nodeDecay: number;
  fillIntensity: number;
  pulseFrequency: number;
  pulseAmplitude: number;
  colorInfluence: number;
}

export interface NeuralCoreSynapseSemanticEffects {
  activity: number;
  emphasis: number;
  thickness: number;
  conductivity: number;
  persistence: number;
  instability: number;
  fragmentation: number;
  interruption: number;
  pulseFrequency: number;
  pulseIntensity: number;
  colorInfluence: number;
}

export interface NeuralCorePathwaySemanticEffects {
  activity: number;
  sequentialEmphasis: number;
  synchronization: number;
  instability: number;
  completion: number;
}

export interface NeuralCoreGlobalSemanticEffects {
  activity: number;
  synchronization: number;
  stability: number;
  instability: number;
  jitter: number;
  fragmentation: number;
  nodeDecay: number;
  colorInfluence: number;
}

export type NeuralCoreChoreographyTargetType =
  | "cluster"
  | "synapse"
  | "pathway"
  | "global";

export interface NeuralCoreChoreographyTarget {
  type: NeuralCoreChoreographyTargetType;
  id?: string;
}

export interface NeuralCoreChoreographyEffects {
  cluster?: Partial<NeuralCoreClusterSemanticEffects>;
  synapse?: Partial<NeuralCoreSynapseSemanticEffects>;
  pathway?: Partial<NeuralCorePathwaySemanticEffects>;
  global?: Partial<NeuralCoreGlobalSemanticEffects>;
}

export type NeuralCoreChoreographyEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "pulse";

export type NeuralCoreChoreographyBlendMode =
  | "maximum"
  | "replace"
  | "additive";

export interface NeuralCoreChoreographyEnvelope {
  attackSeconds: number;
  holdSeconds?: number;
  releaseSeconds: number;
}

export interface NeuralCoreChoreographyEffectLayer {
  blendMode?: NeuralCoreChoreographyBlendMode;
  targets: readonly NeuralCoreChoreographyTarget[];
  effects: NeuralCoreChoreographyEffects;
}

export interface NeuralCoreChoreographyPhase extends NeuralCoreChoreographyEffectLayer {
  id: string;
  startSeconds: number;
  durationSeconds: number;
  easing?: NeuralCoreChoreographyEasing;
  envelope?: NeuralCoreChoreographyEnvelope;
}

export interface NeuralCoreChoreographyTerminalEffects {
  transitionSeconds?: number;
  layers: readonly NeuralCoreChoreographyEffectLayer[];
}

export interface NeuralCoreChoreography {
  id: string;
  durationSeconds: number;
  loop?: boolean;
  phases: readonly NeuralCoreChoreographyPhase[];
  terminalEffects?: NeuralCoreChoreographyTerminalEffects;
}

export interface NeuralCoreChoreographyActivePhase {
  phaseId: string;
  progress: number;
  easedProgress: number;
}

export interface NeuralCoreChoreographyTargetedEffects<TEffects> {
  targetId?: string;
  effects: Partial<TEffects>;
}

export interface NeuralCoreChoreographyEvaluation {
  choreographyId: string;
  elapsedSeconds: number;
  timelineSeconds: number;
  activePhases: readonly NeuralCoreChoreographyActivePhase[];
  clusterEffects: readonly NeuralCoreChoreographyTargetedEffects<NeuralCoreClusterSemanticEffects>[];
  synapseEffects: readonly NeuralCoreChoreographyTargetedEffects<NeuralCoreSynapseSemanticEffects>[];
  pathwayEffects: readonly NeuralCoreChoreographyTargetedEffects<NeuralCorePathwaySemanticEffects>[];
  globalEffects: Partial<NeuralCoreGlobalSemanticEffects>;
}

export interface EvaluateNeuralCoreChoreographyParams {
  choreography?: NeuralCoreChoreography;
  elapsedSeconds: number;
  defaultTransitionSeconds?: number;
  maximumActivePhases?: number;
}
