import { DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG, DEFAULT_NEURAL_CORE_SCENE_MOTION_CONFIG } from "./neural-core-scene-direction.constants";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionConfigInput,
  NeuralCoreSceneDirectionEasing,
  NeuralCoreSceneMotionConfig,
  NeuralCoreSceneMotionConfigInput,
} from "./neural-core-scene-direction.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export const clampNeuralCoreSceneDirectionValue = (
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

export const applyNeuralCoreSceneDirectionEasing = (
  easing: NeuralCoreSceneDirectionEasing,
  progress: number,
): number => {
  const amount = clampNeuralCoreSceneDirectionValue(progress, 0, 1, 0);
  switch (easing) {
    case "ease-in":
      return amount * amount;
    case "ease-out":
      return 1 - (1 - amount) * (1 - amount);
    case "ease-in-out":
      return amount < 0.5
        ? 2 * amount * amount
        : 1 - Math.pow(-2 * amount + 2, 2) / 2;
    case "linear":
      return amount;
  }
};

export const getNeuralCoreDirectionEnvelope = (
  progress: number,
  easing: NeuralCoreSceneDirectionEasing,
): number => {
  const amount = clampNeuralCoreSceneDirectionValue(progress, 0, 1, 0);
  const attackEnd = 0.22;
  const releaseStart = 0.76;

  if (amount < attackEnd) {
    return applyNeuralCoreSceneDirectionEasing(easing, amount / attackEnd);
  }

  if (amount <= releaseStart) {
    return 1;
  }

  const releaseProgress = (amount - releaseStart) / (1 - releaseStart);
  return 1 - applyNeuralCoreSceneDirectionEasing(easing, releaseProgress);
};

export const dampNeuralCoreSceneDirectionValue = (
  current: number,
  target: number,
  response: number,
  deltaSeconds: number,
): number => {
  const safeCurrent = Number.isFinite(current) ? current : target;
  const safeTarget = Number.isFinite(target) ? target : 0;
  const safeResponse = Math.max(0, Number.isFinite(response) ? response : 0);
  const safeDeltaSeconds = Math.min(1, Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0));
  const amount = 1 - Math.exp(-safeResponse * safeDeltaSeconds);
  return safeCurrent + (safeTarget - safeCurrent) * amount;
};

export const dampNeuralCoreSceneDirectionAngle = (
  current: number,
  target: number,
  response: number,
  deltaSeconds: number,
): number => {
  const fullTurn = Math.PI * 2;
  const difference = ((target - current + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
  return current + difference * (1 - Math.exp(-Math.max(0, response) * Math.max(0, deltaSeconds)));
};

export const clampNeuralCoreSceneTargetOffset = (
  offset: NeuralCoreVector3,
  maximumOffset: number,
): NeuralCoreVector3 => {
  const length = Math.hypot(offset[0], offset[1], offset[2]);
  if (length <= maximumOffset || length <= 0.000001) {
    return [...offset];
  }
  const scale = maximumOffset / length;
  return [offset[0] * scale, offset[1] * scale, offset[2] * scale];
};

export const resolveNeuralCoreSceneMotionConfig = (
  input?: NeuralCoreSceneMotionConfigInput,
  autoRotateOverride?: boolean,
): NeuralCoreSceneMotionConfig => {
  const base = DEFAULT_NEURAL_CORE_SCENE_MOTION_CONFIG;
  return {
    autoRotate: autoRotateOverride ?? input?.autoRotate ?? base.autoRotate,
    baseRotationSpeed: clampNeuralCoreSceneDirectionValue(
      input?.baseRotationSpeed,
      0,
      0.25,
      base.baseRotationSpeed,
    ),
    rotationTransitionResponse: clampNeuralCoreSceneDirectionValue(
      input?.rotationTransitionResponse,
      0.1,
      30,
      base.rotationTransitionResponse,
    ),
    horizontalOrientationY: clampNeuralCoreSceneDirectionValue(
      input?.horizontalOrientationY,
      -Math.PI,
      Math.PI,
      base.horizontalOrientationY,
    ),
    horizontalOrientationX: clampNeuralCoreSceneDirectionValue(
      input?.horizontalOrientationX,
      -0.4,
      0.4,
      base.horizontalOrientationX,
    ),
    horizontalOrientationZ: clampNeuralCoreSceneDirectionValue(
      input?.horizontalOrientationZ,
      -0.4,
      0.4,
      base.horizontalOrientationZ,
    ),
  };
};

export const resolveNeuralCoreSceneDirectionConfig = (
  input?: NeuralCoreSceneDirectionConfigInput,
): NeuralCoreSceneDirectionConfig => {
  const base = DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG;
  const minimumDistance = clampNeuralCoreSceneDirectionValue(
    input?.camera?.minimumDistance,
    2.8,
    5.5,
    base.camera.minimumDistance,
  );
  const maximumDistance = clampNeuralCoreSceneDirectionValue(
    input?.camera?.maximumDistance,
    minimumDistance,
    7,
    Math.max(minimumDistance, base.camera.maximumDistance),
  );
  const minimumDurationSeconds = clampNeuralCoreSceneDirectionValue(
    input?.transition?.minimumDurationSeconds,
    0.05,
    3,
    base.transition.minimumDurationSeconds,
  );
  const maximumDurationSeconds = clampNeuralCoreSceneDirectionValue(
    input?.transition?.maximumDurationSeconds,
    minimumDurationSeconds,
    8,
    Math.max(minimumDurationSeconds, base.transition.maximumDurationSeconds),
  );
  const minimumPeripheralOpacity = clampNeuralCoreSceneDirectionValue(
    input?.focus?.minimumPeripheralOpacity,
    0.08,
    1,
    base.focus.minimumPeripheralOpacity,
  );
  const maximumTargetEmphasis = clampNeuralCoreSceneDirectionValue(
    input?.focus?.maximumTargetEmphasis,
    0.1,
    2,
    base.focus.maximumTargetEmphasis,
  );

  return {
    enabled: input?.enabled ?? base.enabled,
    camera: {
      defaultDistance: clampNeuralCoreSceneDirectionValue(
        input?.camera?.defaultDistance,
        minimumDistance,
        maximumDistance,
        Math.min(maximumDistance, Math.max(minimumDistance, base.camera.defaultDistance)),
      ),
      minimumDistance,
      maximumDistance,
      positionResponse: clampNeuralCoreSceneDirectionValue(
        input?.camera?.positionResponse,
        0.1,
        30,
        base.camera.positionResponse,
      ),
      targetResponse: clampNeuralCoreSceneDirectionValue(
        input?.camera?.targetResponse,
        0.1,
        30,
        base.camera.targetResponse,
      ),
      maximumTargetOffset: clampNeuralCoreSceneDirectionValue(
        input?.camera?.maximumTargetOffset,
        0,
        1.4,
        base.camera.maximumTargetOffset,
      ),
    },
    focus: {
      defaultTargetEmphasis: clampNeuralCoreSceneDirectionValue(
        input?.focus?.defaultTargetEmphasis,
        0,
        maximumTargetEmphasis,
        Math.min(maximumTargetEmphasis, base.focus.defaultTargetEmphasis),
      ),
      maximumTargetEmphasis,
      maximumContextDim: clampNeuralCoreSceneDirectionValue(
        input?.focus?.maximumContextDim,
        0,
        0.9,
        base.focus.maximumContextDim,
      ),
      minimumPeripheralOpacity,
      maximumHaloIntensity: clampNeuralCoreSceneDirectionValue(
        input?.focus?.maximumHaloIntensity,
        0,
        2,
        base.focus.maximumHaloIntensity,
      ),
      neighborEmphasis: clampNeuralCoreSceneDirectionValue(
        input?.focus?.neighborEmphasis,
        0,
        0.6,
        base.focus.neighborEmphasis,
      ),
      activeClusterScale: clampNeuralCoreSceneDirectionValue(
        input?.focus?.activeClusterScale,
        1,
        1.8,
        base.focus.activeClusterScale,
      ),
      activeHubScale: clampNeuralCoreSceneDirectionValue(
        input?.focus?.activeHubScale,
        1,
        2,
        base.focus.activeHubScale,
      ),
      contextNodeOpacity: clampNeuralCoreSceneDirectionValue(
        input?.focus?.contextNodeOpacity,
        minimumPeripheralOpacity,
        1,
        Math.max(minimumPeripheralOpacity, base.focus.contextNodeOpacity),
      ),
      contextConnectionOpacity: clampNeuralCoreSceneDirectionValue(
        input?.focus?.contextConnectionOpacity,
        minimumPeripheralOpacity,
        1,
        Math.max(minimumPeripheralOpacity, base.focus.contextConnectionOpacity),
      ),
      contextParticleOpacity: clampNeuralCoreSceneDirectionValue(
        input?.focus?.contextParticleOpacity,
        minimumPeripheralOpacity,
        1,
        Math.max(minimumPeripheralOpacity, base.focus.contextParticleOpacity),
      ),
      internalConnectionEmphasis: clampNeuralCoreSceneDirectionValue(
        input?.focus?.internalConnectionEmphasis,
        0,
        0.5,
        base.focus.internalConnectionEmphasis,
      ),
    },
    transition: {
      defaultDurationSeconds: clampNeuralCoreSceneDirectionValue(
        input?.transition?.defaultDurationSeconds,
        minimumDurationSeconds,
        maximumDurationSeconds,
        Math.min(maximumDurationSeconds, Math.max(
          minimumDurationSeconds,
          base.transition.defaultDurationSeconds,
        )),
      ),
      minimumDurationSeconds,
      maximumDurationSeconds,
    },
  };
};
