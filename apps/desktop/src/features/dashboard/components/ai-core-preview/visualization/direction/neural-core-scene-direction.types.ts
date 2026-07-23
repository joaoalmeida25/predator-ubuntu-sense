import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import type { NeuralCoreTopologyVisualState } from "../topology/neural-core-topology-visual.types";

export type NeuralCoreSceneFocusTargetType =
  | "overview"
  | "cluster"
  | "synapse"
  | "pathway";

export interface NeuralCoreSceneFocusTarget {
  type: NeuralCoreSceneFocusTargetType;
  id?: string;
}

export interface NeuralCoreSceneFocusStyle {
  targetEmphasis: number;
  contextDim: number;
  routeEmphasis: number;
  clusterFillEmphasis: number;
  peripheralOpacity: number;
  haloIntensity: number;
}

export interface NeuralCoreSceneCameraTarget {
  distance: number;
  azimuthOffset: number;
  elevationOffset: number;
  targetOffset: NeuralCoreVector3;
}

export type NeuralCoreSceneDirectionEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export interface NeuralCoreSceneDirectionCue {
  id: string;
  startSeconds: number;
  durationSeconds: number;
  target: NeuralCoreSceneFocusTarget;
  focus: NeuralCoreSceneFocusStyle;
  camera: NeuralCoreSceneCameraTarget;
  easing?: NeuralCoreSceneDirectionEasing;
  /** Keeps the cue envelope active after its attack, useful for terminal states. */
  holdAtEnd?: boolean;
  /** Multiplies scene rotation while the cue is active without affecting breathing. */
  rotationMultiplier?: number;
}

export interface NeuralCoreSceneDirectionTimeline {
  id: string;
  durationSeconds: number;
  loop?: boolean;
  cues: readonly NeuralCoreSceneDirectionCue[];
}

export interface NeuralCoreSceneDirectionState {
  target: NeuralCoreVector3;
  cameraPosition: NeuralCoreVector3;
  cameraDistance: number;
  focusTargetType: NeuralCoreSceneFocusTargetType;
  focusTargetId?: string;
  targetClusterIds: readonly string[];
  neighborClusterIds: readonly string[];
  targetSynapseIds: readonly string[];
  relatedSynapseIds: readonly string[];
  targetPathwayIds: readonly string[];
  targetEmphasis: number;
  contextDim: number;
  routeEmphasis: number;
  clusterFillEmphasis: number;
  peripheralOpacity: number;
  haloIntensity: number;
  rotationMultiplier: number;
  transitionProgress: number;
  isOverview: boolean;
}

export interface NeuralCoreCameraMotionRuntime {
  position: NeuralCoreVector3;
  target: NeuralCoreVector3;
  distance: number;
}

export interface NeuralCoreSceneDirectionConfig {
  enabled: boolean;
  camera: {
    defaultDistance: number;
    minimumDistance: number;
    maximumDistance: number;
    positionResponse: number;
    targetResponse: number;
    maximumTargetOffset: number;
  };
  focus: {
    defaultTargetEmphasis: number;
    maximumTargetEmphasis: number;
    maximumContextDim: number;
    minimumPeripheralOpacity: number;
    maximumHaloIntensity: number;
    neighborEmphasis: number;
    activeClusterScale: number;
    activeHubScale: number;
    contextNodeOpacity: number;
    contextConnectionOpacity: number;
    contextParticleOpacity: number;
    internalConnectionEmphasis: number;
  };
  transition: {
    defaultDurationSeconds: number;
    minimumDurationSeconds: number;
    maximumDurationSeconds: number;
  };
}

export interface NeuralCoreSceneDirectionConfigInput {
  enabled?: boolean;
  camera?: Partial<NeuralCoreSceneDirectionConfig["camera"]>;
  focus?: Partial<NeuralCoreSceneDirectionConfig["focus"]>;
  transition?: Partial<NeuralCoreSceneDirectionConfig["transition"]>;
}

export interface NeuralCoreSceneMotionConfig {
  autoRotate: boolean;
  baseRotationSpeed: number;
  rotationTransitionResponse: number;
  horizontalOrientationY: number;
  horizontalOrientationX: number;
  horizontalOrientationZ: number;
}

export type NeuralCoreSceneMotionConfigInput = Partial<NeuralCoreSceneMotionConfig>;

export interface EvaluateNeuralCoreSceneDirectionParams {
  timeline?: NeuralCoreSceneDirectionTimeline;
  elapsedSeconds: number;
  topologyVisualState: NeuralCoreTopologyVisualState;
  config?: NeuralCoreSceneDirectionConfig;
}
