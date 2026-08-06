import type { NeuralCoreOperationalRuntimeConfig } from "./neural-core-operational-runtime.types";

export const DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG:
Readonly<NeuralCoreOperationalRuntimeConfig> = Object.freeze({
  enabled: true,
  autoStart: false,
  playbackRate: 1,
  eventEmphasisDurationMs: 32,
  autoFollowInPresentation: true,
});

export const NEURAL_CORE_OPERATIONAL_RUNTIME_PROGRESS_PROPERTY =
  "--neural-core-operational-progress";
