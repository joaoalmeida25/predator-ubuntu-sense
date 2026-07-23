import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionState,
  NeuralCoreSceneMotionConfig,
} from "./neural-core-scene-direction.types";

export const DEFAULT_NEURAL_CORE_SCENE_MOTION_CONFIG: NeuralCoreSceneMotionConfig = {
  autoRotate: true,
  baseRotationSpeed: 0.037,
  rotationTransitionResponse: 3.8,
  horizontalOrientationY: 0,
  horizontalOrientationX: 0.012,
  horizontalOrientationZ: 0,
};

export const DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG: NeuralCoreSceneDirectionConfig = {
  enabled: true,
  camera: {
    defaultDistance: 4.35,
    minimumDistance: 3.35,
    maximumDistance: 5.25,
    positionResponse: 3.6,
    targetResponse: 4.2,
    maximumTargetOffset: 0.72,
  },
  focus: {
    defaultTargetEmphasis: 0.86,
    maximumTargetEmphasis: 1.35,
    maximumContextDim: 0.72,
    minimumPeripheralOpacity: 0.28,
    maximumHaloIntensity: 1,
    neighborEmphasis: 0.18,
    activeClusterScale: 1.28,
    activeHubScale: 1.42,
    contextNodeOpacity: 0.4,
    contextConnectionOpacity: 0.3,
    contextParticleOpacity: 0.34,
    internalConnectionEmphasis: 0.22,
  },
  transition: {
    defaultDurationSeconds: 0.72,
    minimumDurationSeconds: 0.16,
    maximumDurationSeconds: 2.4,
  },
};

export const createOverviewNeuralCoreSceneDirectionState = (
  config: NeuralCoreSceneDirectionConfig = DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG,
): NeuralCoreSceneDirectionState => ({
  target: [0, 0, 0],
  cameraPosition: [0, 0, config.camera.defaultDistance],
  cameraDistance: config.camera.defaultDistance,
  focusTargetType: "overview",
  targetClusterIds: [],
  neighborClusterIds: [],
  targetSynapseIds: [],
  relatedSynapseIds: [],
  targetPathwayIds: [],
  targetEmphasis: 0,
  contextDim: 0,
  routeEmphasis: 0,
  clusterFillEmphasis: 0,
  peripheralOpacity: 1,
  haloIntensity: 0,
  rotationMultiplier: 1,
  transitionProgress: 1,
  isOverview: true,
});
