import type {
  NeuralCoreOperationalPresentationPacingConfig,
} from "./neural-core-operational-presentation.types";

export const DEFAULT_NEURAL_CORE_OPERATIONAL_PRESENTATION_PACING_CONFIG:
Readonly<NeuralCoreOperationalPresentationPacingConfig> = Object.freeze({
  enabled: true,
  executionDurations: Object.freeze({
    successMs: 12_000,
    degradedMs: 16_500,
    failureRecoveryMs: 22_000,
  }),
  eventMinimumDurations: Object.freeze({
    "execution-started": 650,
    "request-received": 850,
    "stage-entered": 900,
    "stage-processing": 1_000,
    "stage-completed": 650,
    "route-transmission": 800,
    "metric-updated": 550,
    "warning-raised": 1_450,
    "failure-raised": 1_800,
    "retry-scheduled": 1_250,
    "retry-started": 1_250,
    "component-recovered": 1_600,
    "response-sent": 950,
    "execution-completed": 1_350,
  }),
  stageTransitionGapMs: 110,
});
