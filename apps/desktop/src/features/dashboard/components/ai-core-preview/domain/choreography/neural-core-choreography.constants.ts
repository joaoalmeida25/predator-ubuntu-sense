import type { NeuralCoreChoreographyEvaluation } from "./neural-core-choreography.types";

export const EMPTY_NEURAL_CORE_CHOREOGRAPHY_EVALUATION: NeuralCoreChoreographyEvaluation = {
  choreographyId: "none",
  elapsedSeconds: 0,
  timelineSeconds: 0,
  activePhases: [],
  clusterEffects: [],
  synapseEffects: [],
  pathwayEffects: [],
  globalEffects: {},
};

export const DEFAULT_NEURAL_CORE_CHOREOGRAPHY_TRANSITION_SECONDS = 0.8;
export const DEFAULT_NEURAL_CORE_MAXIMUM_ACTIVE_PHASES = 12;
