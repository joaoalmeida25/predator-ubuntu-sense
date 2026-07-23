import type {
  NeuralCoreClusterSemanticEffects,
  NeuralCoreGlobalSemanticEffects,
  NeuralCorePathwaySemanticEffects,
  NeuralCoreSynapseSemanticEffects,
} from "../../domain/choreography/neural-core-choreography.types";

export interface NeuralCoreNodeVisualEmphasis {
  scale: number;
  opacity: number;
  brightness: number;
}

export interface NeuralCoreSemanticVisualizationConfig {
  enabled: boolean;
  motion: {
    activityResponse: number;
    maximumRotationActivityInfluence: number;
  };
  transition: {
    activationResponse: number;
    releaseResponse: number;
    colorResponse: number;
    displacementResponse: number;
  };
  failure: {
    maximumNodeFragmentationDistance: number;
    maximumRouteOpacityVariation: number;
    nodeDecayThresholdSpread: number;
  };
  topology: {
    maximumClusterOverlapRatio: number;
    minimumClusterSeparation: number;
  };
  cluster: {
    maximumNodeScale: number;
    maximumFillIntensity: number;
    maximumJitterDistance: number;
    maximumFragmentationDistance: number;
    minimumVisibleOpacity: number;
    internalPulseSpeed: number;
  };
  synapse: {
    minimumThickness: number;
    maximumThickness: number;
    minimumOpacity: number;
    maximumOpacity: number;
    fragmentationSegmentLength: number;
  };
  choreography: {
    defaultTransitionSeconds: number;
    maximumActivePhases: number;
    loopDemoChoreographies: boolean;
  };
  color: {
    neutral: string;
    active: string;
    memory: string;
    warning: string;
    error: string;
    success: string;
  };
}

export interface NeuralCoreSemanticVisualizationConfigInput {
  enabled?: boolean;
  motion?: Partial<NeuralCoreSemanticVisualizationConfig["motion"]>;
  transition?: Partial<NeuralCoreSemanticVisualizationConfig["transition"]>;
  failure?: Partial<NeuralCoreSemanticVisualizationConfig["failure"]>;
  topology?: Partial<NeuralCoreSemanticVisualizationConfig["topology"]>;
  cluster?: Partial<NeuralCoreSemanticVisualizationConfig["cluster"]>;
  synapse?: Partial<NeuralCoreSemanticVisualizationConfig["synapse"]>;
  choreography?: Partial<NeuralCoreSemanticVisualizationConfig["choreography"]>;
  color?: Partial<NeuralCoreSemanticVisualizationConfig["color"]>;
}

export interface NeuralCoreClusterSemanticVisualState
  extends NeuralCoreClusterSemanticEffects {
  clusterId: string;
  nodeIndices: readonly number[];
  hubIndices: readonly number[];
  color: string;
}

export interface NeuralCoreSynapseSemanticVisualState
  extends NeuralCoreSynapseSemanticEffects {
  synapseId: string;
  color: string;
}

export interface NeuralCorePathwaySemanticVisualState
  extends NeuralCorePathwaySemanticEffects {
  pathwayId: string;
  synapseIds: readonly string[];
}

export interface NeuralCoreGlobalSemanticVisualState
  extends NeuralCoreGlobalSemanticEffects {
  color: string;
}

export interface NeuralCoreSemanticVisualState {
  clusterEffects: readonly NeuralCoreClusterSemanticVisualState[];
  synapseEffects: readonly NeuralCoreSynapseSemanticVisualState[];
  pathwayEffects: readonly NeuralCorePathwaySemanticVisualState[];
  globalEffects: NeuralCoreGlobalSemanticVisualState;
}
