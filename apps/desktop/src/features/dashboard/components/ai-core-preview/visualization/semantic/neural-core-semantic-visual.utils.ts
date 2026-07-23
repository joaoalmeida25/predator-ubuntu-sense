import type { NeuralCoreChoreographyTargetedEffects } from "../../domain/choreography/neural-core-choreography.types";
import {
  clampNeuralCoreSemanticEffect,
  mergeNeuralCoreSemanticEffects,
} from "../../domain/choreography/neural-core-choreography.utils";
import { DEFAULT_NEURAL_CORE_SEMANTIC_VISUALIZATION_CONFIG } from "./neural-core-semantic-visual.constants";
import type {
  NeuralCoreSemanticVisualizationConfig,
  NeuralCoreSemanticVisualizationConfigInput,
} from "./neural-core-semantic-visual.types";

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

export const resolveNeuralCoreSemanticVisualizationConfig = (
  input?: NeuralCoreSemanticVisualizationConfigInput,
): NeuralCoreSemanticVisualizationConfig => {
  const base = DEFAULT_NEURAL_CORE_SEMANTIC_VISUALIZATION_CONFIG;
  const minimumThickness = finiteInRange(
    input?.synapse?.minimumThickness,
    base.synapse.minimumThickness,
    0.2,
    8,
  );
  const minimumOpacity = clampNeuralCoreSemanticEffect(
    input?.synapse?.minimumOpacity ?? base.synapse.minimumOpacity,
  );

  return {
    enabled: input?.enabled ?? base.enabled,
    motion: {
      activityResponse: finiteInRange(
        input?.motion?.activityResponse,
        base.motion.activityResponse,
        0.1,
        30,
      ),
      maximumRotationActivityInfluence: finiteInRange(
        input?.motion?.maximumRotationActivityInfluence,
        base.motion.maximumRotationActivityInfluence,
        0,
        0.5,
      ),
    },
    transition: {
      activationResponse: finiteInRange(
        input?.transition?.activationResponse,
        base.transition.activationResponse,
        0.1,
        40,
      ),
      releaseResponse: finiteInRange(
        input?.transition?.releaseResponse,
        base.transition.releaseResponse,
        0.1,
        40,
      ),
      colorResponse: finiteInRange(
        input?.transition?.colorResponse,
        base.transition.colorResponse,
        0.1,
        40,
      ),
      displacementResponse: finiteInRange(
        input?.transition?.displacementResponse,
        base.transition.displacementResponse,
        0.1,
        40,
      ),
    },
    failure: {
      maximumNodeFragmentationDistance: finiteInRange(
        input?.failure?.maximumNodeFragmentationDistance,
        base.failure.maximumNodeFragmentationDistance,
        0,
        0.35,
      ),
      maximumRouteOpacityVariation: finiteInRange(
        input?.failure?.maximumRouteOpacityVariation,
        base.failure.maximumRouteOpacityVariation,
        0,
        0.6,
      ),
      nodeDecayThresholdSpread: finiteInRange(
        input?.failure?.nodeDecayThresholdSpread,
        base.failure.nodeDecayThresholdSpread,
        0.05,
        1,
      ),
    },
    topology: {
      maximumClusterOverlapRatio: finiteInRange(
        input?.topology?.maximumClusterOverlapRatio,
        base.topology.maximumClusterOverlapRatio,
        0,
        0.5,
      ),
      minimumClusterSeparation: finiteInRange(
        input?.topology?.minimumClusterSeparation,
        base.topology.minimumClusterSeparation,
        0,
        1.5,
      ),
    },
    cluster: {
      maximumNodeScale: finiteInRange(
        input?.cluster?.maximumNodeScale,
        base.cluster.maximumNodeScale,
        1,
        4,
      ),
      maximumFillIntensity: clampNeuralCoreSemanticEffect(
        input?.cluster?.maximumFillIntensity ?? base.cluster.maximumFillIntensity,
      ),
      maximumJitterDistance: finiteInRange(
        input?.cluster?.maximumJitterDistance,
        base.cluster.maximumJitterDistance,
        0,
        0.3,
      ),
      maximumFragmentationDistance: finiteInRange(
        input?.cluster?.maximumFragmentationDistance,
        base.cluster.maximumFragmentationDistance,
        0,
        0.5,
      ),
      minimumVisibleOpacity: clampNeuralCoreSemanticEffect(
        input?.cluster?.minimumVisibleOpacity ?? base.cluster.minimumVisibleOpacity,
      ),
      internalPulseSpeed: finiteInRange(
        input?.cluster?.internalPulseSpeed,
        base.cluster.internalPulseSpeed,
        0.1,
        12,
      ),
    },
    synapse: {
      minimumThickness,
      maximumThickness: finiteInRange(
        input?.synapse?.maximumThickness,
        base.synapse.maximumThickness,
        minimumThickness,
        10,
      ),
      minimumOpacity,
      maximumOpacity: finiteInRange(
        input?.synapse?.maximumOpacity,
        base.synapse.maximumOpacity,
        minimumOpacity,
        1,
      ),
      fragmentationSegmentLength: finiteInRange(
        input?.synapse?.fragmentationSegmentLength,
        base.synapse.fragmentationSegmentLength,
        0.03,
        0.5,
      ),
    },
    choreography: {
      defaultTransitionSeconds: finiteInRange(
        input?.choreography?.defaultTransitionSeconds,
        base.choreography.defaultTransitionSeconds,
        0.05,
        5,
      ),
      maximumActivePhases: Math.trunc(finiteInRange(
        input?.choreography?.maximumActivePhases,
        base.choreography.maximumActivePhases,
        1,
        64,
      )),
      loopDemoChoreographies: input?.choreography?.loopDemoChoreographies
        ?? base.choreography.loopDemoChoreographies,
    },
    color: {
      neutral: input?.color?.neutral ?? base.color.neutral,
      active: input?.color?.active ?? base.color.active,
      memory: input?.color?.memory ?? base.color.memory,
      warning: input?.color?.warning ?? base.color.warning,
      error: input?.color?.error ?? base.color.error,
      success: input?.color?.success ?? base.color.success,
    },
  };
};

export const getNeuralCoreTargetedSemanticEffects = <TEffects extends object>(
  targetedEffects: readonly NeuralCoreChoreographyTargetedEffects<TEffects>[],
  targetId: string,
): Partial<TEffects> => {
  return targetedEffects
    .filter((entry) => entry.targetId === undefined || entry.targetId === targetId)
    .reduce<Partial<TEffects>>((effects, entry) => {
      return mergeNeuralCoreSemanticEffects(effects, entry.effects);
    }, {});
};

export const mixNeuralCoreSemanticEffect = (
  base: number | undefined,
  choreography: number | undefined,
  global = 0,
): number => {
  return clampNeuralCoreSemanticEffect(Math.max(base ?? 0, choreography ?? 0, global));
};
