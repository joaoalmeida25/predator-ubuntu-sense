import { EMPTY_NEURAL_CORE_NARRATIVE_STATE } from "./neural-core-narrative.constants";
import type {
  EvaluateNeuralCoreNarrativeParams,
  NeuralCoreNarrativePhase,
  NeuralCoreNarrativeState,
} from "./neural-core-narrative.types";
import {
  clampNeuralCoreNarrativeValue,
  getNeuralCoreNarrativeTimelineSeconds,
  getNeuralCoreNarrativeTransition,
} from "./neural-core-narrative.utils";

const findActivePhase = (
  phases: readonly NeuralCoreNarrativePhase[],
  timelineSeconds: number,
  reachedEnd: boolean,
): NeuralCoreNarrativePhase | undefined => {
  for (let index = phases.length - 1; index >= 0; index -= 1) {
    const phase = phases[index];
    const endSeconds = phase.startSeconds + Math.max(0.001, phase.durationSeconds);
    if (timelineSeconds >= phase.startSeconds && timelineSeconds < endSeconds) {
      return phase;
    }
  }
  if (reachedEnd) {
    const finalPhase = phases[phases.length - 1];
    return finalPhase?.holdAtEnd ? finalPhase : undefined;
  }
  return undefined;
};

export const evaluateNeuralCoreNarrative = ({
  narrative,
  elapsedSeconds,
}: EvaluateNeuralCoreNarrativeParams): NeuralCoreNarrativeState => {
  if (!narrative || narrative.durationSeconds <= 0 || narrative.phases.length === 0) {
    return EMPTY_NEURAL_CORE_NARRATIVE_STATE;
  }

  const loop = narrative.loop ?? false;
  const timelineSeconds = getNeuralCoreNarrativeTimelineSeconds(
    elapsedSeconds,
    narrative.durationSeconds,
    loop,
  );
  const reachedEnd = !loop && elapsedSeconds >= narrative.durationSeconds;
  const phase = findActivePhase(narrative.phases, timelineSeconds, reachedEnd);
  if (!phase) {
    return {
      ...EMPTY_NEURAL_CORE_NARRATIVE_STATE,
      narrativeId: narrative.id,
    };
  }

  const durationSeconds = Math.max(0.001, phase.durationSeconds);
  const phaseProgress = reachedEnd && phase.holdAtEnd
    ? 1
    : clampNeuralCoreNarrativeValue(
      (timelineSeconds - phase.startSeconds) / durationSeconds,
    );
  const transitionProgress = reachedEnd && phase.holdAtEnd
    ? 1
    : getNeuralCoreNarrativeTransition(phaseProgress);
  const emphasis = phase.emphasis;

  return {
    narrativeId: narrative.id,
    activePhaseId: phase.id,
    activePhaseKind: phase.kind,
    label: phase.label,
    description: phase.description,
    clusterIds: phase.clusterIds ?? [],
    synapseIds: phase.synapseIds ?? [],
    pathwayIds: phase.pathwayIds ?? [],
    phaseProgress,
    transitionProgress,
    phaseDurationSeconds: durationSeconds,
    clusterEmphasis: clampNeuralCoreNarrativeValue(emphasis?.cluster ?? 0)
      * transitionProgress,
    routeEmphasis: clampNeuralCoreNarrativeValue(emphasis?.route ?? 0)
      * transitionProgress,
    contextDim: clampNeuralCoreNarrativeValue(emphasis?.contextDim ?? 0)
      * transitionProgress,
    internalActivity: clampNeuralCoreNarrativeValue(emphasis?.internalActivity ?? 0)
      * transitionProgress,
    clusterBehavior: phase.clusterBehavior,
    arrivalReaction: clampNeuralCoreNarrativeValue(phase.arrivalReaction ?? 0),
    progress: phase.progress,
    isActive: phase.kind !== "idle",
  };
};
