import {
  DEFAULT_NEURAL_CORE_CHOREOGRAPHY_TRANSITION_SECONDS,
  DEFAULT_NEURAL_CORE_MAXIMUM_ACTIVE_PHASES,
  EMPTY_NEURAL_CORE_CHOREOGRAPHY_EVALUATION,
} from "./neural-core-choreography.constants";
import type {
  EvaluateNeuralCoreChoreographyParams,
  NeuralCoreChoreographyActivePhase,
  NeuralCoreChoreographyEffectLayer,
  NeuralCoreChoreographyEnvelope,
  NeuralCoreChoreographyEvaluation,
  NeuralCoreChoreographyTargetedEffects,
  NeuralCoreClusterSemanticEffects,
  NeuralCorePathwaySemanticEffects,
  NeuralCoreSynapseSemanticEffects,
} from "./neural-core-choreography.types";
import {
  applyNeuralCoreChoreographyEasing,
  clampNeuralCoreSemanticEffect,
  evaluateNeuralCoreChoreographyEnvelope,
  mergeNeuralCoreSemanticEffects,
  mergeNeuralCoreTargetedSemanticEffects,
} from "./neural-core-choreography.utils";

interface NeuralCoreChoreographyMutableEffects {
  clusterEffects: NeuralCoreChoreographyTargetedEffects<NeuralCoreClusterSemanticEffects>[];
  synapseEffects: NeuralCoreChoreographyTargetedEffects<NeuralCoreSynapseSemanticEffects>[];
  pathwayEffects: NeuralCoreChoreographyTargetedEffects<NeuralCorePathwaySemanticEffects>[];
  globalEffects: NeuralCoreChoreographyEvaluation["globalEffects"];
}

const finiteNonNegative = (value: number | undefined): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
};

const createDefaultEnvelope = (
  durationSeconds: number,
  defaultTransitionSeconds: number,
): NeuralCoreChoreographyEnvelope => {
  const configuredTransitionSeconds = finiteNonNegative(defaultTransitionSeconds)
    || DEFAULT_NEURAL_CORE_CHOREOGRAPHY_TRANSITION_SECONDS;
  const transitionSeconds = Math.min(
    durationSeconds / 2,
    configuredTransitionSeconds,
  );
  return {
    attackSeconds: transitionSeconds,
    holdSeconds: Math.max(0, durationSeconds - transitionSeconds * 2),
    releaseSeconds: transitionSeconds,
  };
};

const mergeEffectLayer = (
  state: NeuralCoreChoreographyMutableEffects,
  layer: NeuralCoreChoreographyEffectLayer,
  amount: number,
): void => {
  const blendMode = layer.blendMode ?? "maximum";
  for (const target of layer.targets) {
    if (target.type === "cluster" && layer.effects.cluster) {
      state.clusterEffects = mergeNeuralCoreTargetedSemanticEffects(
        state.clusterEffects,
        target.id,
        layer.effects.cluster,
        amount,
        blendMode,
      );
    }
    if (target.type === "synapse" && layer.effects.synapse) {
      state.synapseEffects = mergeNeuralCoreTargetedSemanticEffects(
        state.synapseEffects,
        target.id,
        layer.effects.synapse,
        amount,
        blendMode,
      );
    }
    if (target.type === "pathway" && layer.effects.pathway) {
      state.pathwayEffects = mergeNeuralCoreTargetedSemanticEffects(
        state.pathwayEffects,
        target.id,
        layer.effects.pathway,
        amount,
        blendMode,
      );
    }
    if (target.type === "global" && layer.effects.global) {
      state.globalEffects = mergeNeuralCoreSemanticEffects(
        state.globalEffects,
        layer.effects.global,
        amount,
        blendMode,
      );
    }
  }
};

export const evaluateNeuralCoreChoreography = ({
  choreography,
  elapsedSeconds,
  defaultTransitionSeconds = DEFAULT_NEURAL_CORE_CHOREOGRAPHY_TRANSITION_SECONDS,
  maximumActivePhases = DEFAULT_NEURAL_CORE_MAXIMUM_ACTIVE_PHASES,
}: EvaluateNeuralCoreChoreographyParams): NeuralCoreChoreographyEvaluation => {
  const configuredDurationSeconds = choreography?.durationSeconds;
  if (
    !choreography
    || typeof configuredDurationSeconds !== "number"
    || !Number.isFinite(configuredDurationSeconds)
    || configuredDurationSeconds <= 0
  ) {
    return EMPTY_NEURAL_CORE_CHOREOGRAPHY_EVALUATION;
  }

  const safeElapsedSeconds = finiteNonNegative(elapsedSeconds);
  const durationSeconds = configuredDurationSeconds;
  const timelineSeconds = choreography.loop
    ? safeElapsedSeconds % durationSeconds
    : Math.min(safeElapsedSeconds, durationSeconds);
  const configuredActivePhaseLimit = Number.isFinite(maximumActivePhases)
    ? Math.trunc(maximumActivePhases)
    : DEFAULT_NEURAL_CORE_MAXIMUM_ACTIVE_PHASES;
  const activePhaseLimit = Math.max(1, configuredActivePhaseLimit);
  const activePhases: NeuralCoreChoreographyActivePhase[] = [];
  const effectState: NeuralCoreChoreographyMutableEffects = {
    clusterEffects: [],
    synapseEffects: [],
    pathwayEffects: [],
    globalEffects: {},
  };

  for (const phase of choreography.phases) {
    if (activePhases.length >= activePhaseLimit) {
      break;
    }

    const phaseStartSeconds = finiteNonNegative(phase.startSeconds);
    const phaseDurationSeconds = finiteNonNegative(phase.durationSeconds);
    if (phaseDurationSeconds <= 0) {
      continue;
    }

    const phaseEndSeconds = phaseStartSeconds + phaseDurationSeconds;
    if (timelineSeconds < phaseStartSeconds || timelineSeconds > phaseEndSeconds) {
      continue;
    }

    const phaseElapsedSeconds = timelineSeconds - phaseStartSeconds;
    const progress = clampNeuralCoreSemanticEffect(
      phaseElapsedSeconds / phaseDurationSeconds,
    );
    const envelopeAmount = evaluateNeuralCoreChoreographyEnvelope(
      phaseElapsedSeconds,
      phaseDurationSeconds,
      phase.envelope ?? createDefaultEnvelope(
        phaseDurationSeconds,
        defaultTransitionSeconds,
      ),
      phase.easing ?? "ease-in-out",
    );
    activePhases.push({
      phaseId: phase.id,
      progress,
      easedProgress: envelopeAmount,
    });
    mergeEffectLayer(effectState, phase, envelopeAmount);
  }

  if (!choreography.loop && choreography.terminalEffects) {
    const transitionSeconds = Math.min(
      durationSeconds,
      Math.max(
        0.001,
        finiteNonNegative(choreography.terminalEffects.transitionSeconds)
          || finiteNonNegative(defaultTransitionSeconds)
          || DEFAULT_NEURAL_CORE_CHOREOGRAPHY_TRANSITION_SECONDS,
      ),
    );
    const terminalStartSeconds = durationSeconds - transitionSeconds;
    const terminalProgress = clampNeuralCoreSemanticEffect(
      (timelineSeconds - terminalStartSeconds) / transitionSeconds,
    );
    const terminalAmount = applyNeuralCoreChoreographyEasing(
      "ease-in-out",
      terminalProgress,
    );
    for (const layer of choreography.terminalEffects.layers) {
      mergeEffectLayer(effectState, layer, terminalAmount);
    }
  }

  return {
    choreographyId: choreography.id,
    elapsedSeconds: safeElapsedSeconds,
    timelineSeconds,
    activePhases,
    clusterEffects: effectState.clusterEffects,
    synapseEffects: effectState.synapseEffects,
    pathwayEffects: effectState.pathwayEffects,
    globalEffects: effectState.globalEffects,
  };
};
