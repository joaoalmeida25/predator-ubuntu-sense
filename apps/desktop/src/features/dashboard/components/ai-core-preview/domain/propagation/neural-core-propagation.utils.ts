import type { NeuralCorePropagationConfig } from "./neural-core-propagation.types";
import type {
  NeuralCorePathwayExecutionPlan,
  NeuralCorePathwayStagePlan,
} from "./neural-core-propagation.types";
import type {
  NeuralCoreSynapse,
  NeuralCoreTransmission,
} from "../topology/neural-core-topology.types";

export const clampPropagationValue = (
  value: number,
  minimum = 0,
  maximum = 1,
): number => {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
};

const getSynapseIntensityMultiplier = (synapse: NeuralCoreSynapse): number => {
  switch (synapse.kind) {
    case "excitatory":
      return 1.08;
    case "inhibitory":
      return 0.78;
    case "modulatory":
      return 0.68;
    case "relay":
      return 0.9;
    case "bidirectional":
      return 1;
  }
};

const getSynapseStimulusMultiplier = (synapse: NeuralCoreSynapse): number => {
  switch (synapse.kind) {
    case "excitatory":
      return 1;
    case "inhibitory":
      return -0.82;
    case "modulatory":
      return 0.46;
    case "relay":
      return 0.76;
    case "bidirectional":
      return 0.94;
  }
};

export const getEffectiveTransmissionDuration = (
  transmission: NeuralCoreTransmission,
  synapse: NeuralCoreSynapse,
  config: NeuralCorePropagationConfig,
): number => {
  const conductivity = clampPropagationValue(synapse.conductivity ?? 0.5);
  const speed = clampPropagationValue(transmission.speed ?? 0.5);
  const conductivityFactor = 0.45 + conductivity * 1.1;
  const speedFactor = 0.72 + speed * 0.56;
  const durationMultiplier = 1 / Math.max(
    0.1,
    1 + (conductivityFactor * speedFactor - 0.6) * config.synapse.conductivityInfluence,
  );

  return clampPropagationValue(
    config.timing.baseTransmissionDurationSeconds * durationMultiplier,
    config.timing.minimumTransmissionDurationSeconds,
    config.timing.maximumTransmissionDurationSeconds,
  );
};

export const getEffectiveTransmissionIntensity = (
  transmission: NeuralCoreTransmission,
  synapse: NeuralCoreSynapse,
  config: NeuralCorePropagationConfig,
): number => {
  const base = clampPropagationValue(transmission.intensity ?? 0.5);
  const weight = clampPropagationValue(synapse.weight ?? 0.5);
  const plasticity = clampPropagationValue(synapse.plasticity ?? 0.5);
  const weightedSignal = base * (1 - config.synapse.weightInfluence * 0.55)
    + weight * config.synapse.weightInfluence * 0.72
    + plasticity * config.synapse.plasticityInfluence * 0.16;

  return clampPropagationValue(weightedSignal * getSynapseIntensityMultiplier(synapse));
};

export const getEffectiveClusterStimulus = (
  intensity: number,
  synapse: NeuralCoreSynapse,
  config: NeuralCorePropagationConfig,
): number => {
  const weight = clampPropagationValue(synapse.weight ?? 0.5);
  const weightedGain = 0.38 + weight * (0.42 + config.synapse.weightInfluence * 0.38);

  return clampPropagationValue(intensity)
    * weightedGain
    * config.activation.destinationActivationGain
    * config.activation.propagationGain
    * getSynapseStimulusMultiplier(synapse);
};

export const getEffectiveSynapseRouteIntensity = (
  intensity: number,
  synapse: NeuralCoreSynapse,
  config: NeuralCorePropagationConfig,
): number => {
  const weight = clampPropagationValue(synapse.weight ?? 0.5);
  const conductivity = clampPropagationValue(synapse.conductivity ?? 0.5);
  const plasticity = clampPropagationValue(synapse.plasticity ?? 0.5);
  const response = 0.5
    + weight * config.synapse.weightInfluence * 0.72
    + conductivity * config.synapse.conductivityInfluence * 0.28
    + plasticity * config.synapse.plasticityInfluence * 0.16;

  return clampPropagationValue(
    config.synapse.inactiveRouteOpacity
      + clampPropagationValue(intensity) * config.synapse.activeRouteOpacity * response,
  );
};

export const getFirstRunnablePathwayStage = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
): NeuralCorePathwayStagePlan | undefined => {
  return pathwayPlan.stages.find((stage) => stage.runnable);
};

export const getNextRunnablePathwayStage = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
  originalStageIndex: number,
): NeuralCorePathwayStagePlan | undefined => {
  return pathwayPlan.stages.find((stage) => {
    return stage.runnable && stage.originalStageIndex > originalStageIndex;
  });
};

export const getRunnablePathwayStageCount = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
): number => {
  return pathwayPlan.runnableStageCount;
};

export const canStartPathwayStage = (
  stageIndex: number,
  startedStageIndices: number[],
  previousProgress: number,
  config: NeuralCorePropagationConfig,
): boolean => {
  return !startedStageIndices.includes(stageIndex)
    && (stageIndex === 0
      || previousProgress >= 1 - clampPropagationValue(config.timing.pathwayStageOverlap));
};

export const calculateExecutablePathwayProgress = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
  completedStageIndices: readonly number[],
  progressByStageIndex: ReadonlyMap<number, number>,
): number => {
  if (pathwayPlan.runnableStageCount === 0) {
    return 0;
  }

  const total = pathwayPlan.stages.reduce((sum, stage) => {
    if (!stage.runnable) {
      return sum;
    }
    if (completedStageIndices.includes(stage.originalStageIndex)) {
      return sum + 1;
    }
    return sum + clampPropagationValue(
      progressByStageIndex.get(stage.originalStageIndex) ?? 0,
    );
  }, 0);
  return clampPropagationValue(total / pathwayPlan.runnableStageCount);
};
