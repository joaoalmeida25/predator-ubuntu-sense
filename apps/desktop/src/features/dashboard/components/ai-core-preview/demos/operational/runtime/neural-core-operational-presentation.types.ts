import type {
  NeuralCoreOperationalEventType,
} from "../domain/neural-core-operational-event.types";

export interface NeuralCoreOperationalPresentationEvent {
  sourceEventId: string;
  presentationAtMs: number;
  presentationDurationMs: number;
  sourceAtMs: number;
  sourceDurationMs?: number;
}

export interface NeuralCoreOperationalPresentationTimeline {
  executionId: string;
  totalPresentationDurationMs: number;
  events: readonly NeuralCoreOperationalPresentationEvent[];
}

export interface NeuralCoreOperationalPresentationPacingConfig {
  enabled: boolean;
  executionDurations: {
    successMs: number;
    degradedMs: number;
    failureRecoveryMs: number;
  };
  eventMinimumDurations: Readonly<
    Record<NeuralCoreOperationalEventType, number>
  >;
  stageTransitionGapMs: number;
}

export interface NeuralCoreOperationalPresentationPacingConfigInput {
  enabled?: boolean;
  executionDurations?: Partial<
    NeuralCoreOperationalPresentationPacingConfig["executionDurations"]
  >;
  eventMinimumDurations?: Partial<
    NeuralCoreOperationalPresentationPacingConfig["eventMinimumDurations"]
  >;
  stageTransitionGapMs?: number;
}
