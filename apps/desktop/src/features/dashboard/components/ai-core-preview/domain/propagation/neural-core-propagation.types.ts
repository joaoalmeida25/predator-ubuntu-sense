import type {
  NeuralCoreCluster,
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreSynapseKind,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
  NeuralCoreTransmission,
} from "../topology/neural-core-topology.types";

export type DeepPartial<T> = T extends readonly (infer TItem)[]
  ? DeepPartial<TItem>[]
  : T extends object
    ? { [TKey in keyof T]?: DeepPartial<T[TKey]> }
    : T;

export interface NeuralCorePropagationConfig {
  enabled: boolean;
  timing: {
    baseTransmissionDurationSeconds: number;
    minimumTransmissionDurationSeconds: number;
    maximumTransmissionDurationSeconds: number;
    maximumDeltaSeconds: number;
    maximumCatchUpSeconds: number;
    maximumSubstepsPerAdvance: number;
    pathwayStageOverlap: number;
    destinationActivationThreshold: number;
  };
  activation: {
    sourceActivationGain: number;
    destinationActivationGain: number;
    propagationGain: number;
    maximumClusterActivation: number;
    activationDecayPerSecond: number;
    inhibitoryDecayMultiplier: number;
    modulatoryPersistenceMultiplier: number;
  };
  synapse: {
    weightInfluence: number;
    conductivityInfluence: number;
    plasticityInfluence: number;
    inactiveRouteOpacity: number;
    activeRouteOpacity: number;
  };
  pulse: {
    baseSize: number;
    intensityMultiplier: number;
    headScale: number;
    headBrightness: number;
    fadeInFraction: number;
    fadeOutFraction: number;
    destinationBoostFraction: number;
    trailLength: number;
    trailOpacityFalloff: number;
    routeBackgroundOpacity: number;
    arrivalBurstIntensity: number;
    minimumScreenSize: number;
    maximumScreenSize: number;
    distanceScaleInfluence: number;
    trailSampleCount: number;
  };
  runtime: {
    maximumConcurrentTransmissions: number;
    loopActivePathways: boolean;
    completedPropagationRetentionSeconds: number;
    deterministicSeed: number;
  };
  visual: {
    routeSegmentCount: number;
    pulseTrailPointCount: number;
    minimumPulseSize: number;
    maximumPulseSize: number;
  };
  motion: {
    rotationActivityInfluence: number;
    breathingActivityInfluence: number;
    particleActivityInfluence: number;
  };
}

export type NeuralCorePropagationConfigInput = DeepPartial<NeuralCorePropagationConfig>;
export type NeuralCorePropagationPreset = "calm" | "balanced" | "intense";
export type NeuralCorePropagationPhase =
  | "queued"
  | "departing"
  | "traveling"
  | "arriving"
  | "completed"
  | "cancelled";

export interface NeuralCoreClusterActivation {
  clusterId: string;
  currentIntensity: number;
  targetIntensity: number;
  decayPerSecond: number;
  receivedStimulus: number;
  effectKind?: NeuralCoreSynapseKind;
  lastUpdatedAt: number;
  status: NeuralCoreTopologyStatus;
}

export interface NeuralCoreSynapticPropagation {
  propagationId: string;
  transmissionId: string;
  synapseId: string;
  pathwayId?: string;
  pathwayStageIndex?: number;
  pathwayLoopCount?: number;
  fromClusterId: string;
  toClusterId: string;
  direction: "forward" | "backward";
  phase: NeuralCorePropagationPhase;
  progress: number;
  elapsedSeconds: number;
  durationSeconds: number;
  intensity: number;
  effectiveSpeed: number;
  effectiveWeight: number;
  status: NeuralCoreTopologyStatus;
  arrivalEventEmitted: boolean;
  startedEventEmitted: boolean;
  completedAtSeconds?: number;
}

export interface NeuralCoreQueuedPropagation {
  queueId: string;
  transmissionId: string;
  synapseId: string;
  pathwayId?: string;
  pathwayStageIndex?: number;
  pathwayLoopCount?: number;
  priority: number;
  enqueuedAtSeconds: number;
}

export interface NeuralCorePathwayStagePlan {
  originalStageIndex: number;
  synapseId: string;
  transmissionId?: string;
  runnable: boolean;
}

export interface NeuralCorePathwayExecutionPlan {
  pathway: NeuralCorePathway;
  stages: NeuralCorePathwayStagePlan[];
  runnableStageCount: number;
}

export interface NeuralCorePropagationPlan {
  topologyKey: string;
  topology: NeuralCoreTopology;
  clustersById: ReadonlyMap<string, NeuralCoreCluster>;
  synapsesById: ReadonlyMap<string, NeuralCoreSynapse>;
  transmissionsById: ReadonlyMap<string, NeuralCoreTransmission>;
  transmissionsBySynapseId: ReadonlyMap<string, readonly NeuralCoreTransmission[]>;
  pathwayPlans: NeuralCorePathwayExecutionPlan[];
  pathwayPlansById: ReadonlyMap<string, NeuralCorePathwayExecutionPlan>;
}

export interface NeuralCorePathwayRuntime {
  pathwayId: string;
  currentStageIndex: number;
  startedStageIndices: number[];
  completedStageIndices: number[];
  status: NeuralCoreTopologyStatus;
  progress: number;
  loopCount: number;
  lastCompletedLoopCount?: number;
}

export interface NeuralCorePropagationRuntimeState {
  elapsedSeconds: number;
  clusterActivations: Record<string, NeuralCoreClusterActivation>;
  queuedPropagations: NeuralCoreQueuedPropagation[];
  activePropagations: NeuralCoreSynapticPropagation[];
  completedPropagations: NeuralCoreSynapticPropagation[];
  pathwayRuntimes: NeuralCorePathwayRuntime[];
}

export type NeuralCorePropagationEventType =
  | "transmission-started"
  | "transmission-arriving"
  | "transmission-completed"
  | "cluster-activated"
  | "cluster-inhibited"
  | "pathway-stage-started"
  | "pathway-completed";

export interface NeuralCorePropagationEvent {
  id: string;
  type: NeuralCorePropagationEventType;
  timestampSeconds: number;
  clusterId?: string;
  synapseId?: string;
  transmissionId?: string;
  pathwayId?: string;
  pathwayStageIndex?: number;
  intensity?: number;
  status?: NeuralCoreTopologyStatus;
}

export interface NeuralCorePropagationStepResult {
  runtime: NeuralCorePropagationRuntimeState;
  events: NeuralCorePropagationEvent[];
}
