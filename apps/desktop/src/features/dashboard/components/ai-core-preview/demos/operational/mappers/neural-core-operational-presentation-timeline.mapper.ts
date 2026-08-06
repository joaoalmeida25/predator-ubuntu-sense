import type {
  NeuralCoreOperationalEvent,
  NeuralCoreOperationalEventType,
} from "../domain/neural-core-operational-event.types";
import type {
  NeuralCoreOperationalExecution,
} from "../domain/neural-core-operational-execution.types";
import {
  DEFAULT_NEURAL_CORE_OPERATIONAL_PRESENTATION_PACING_CONFIG,
} from "../runtime/neural-core-operational-presentation.constants";
import type {
  NeuralCoreOperationalPresentationEvent,
  NeuralCoreOperationalPresentationPacingConfig,
  NeuralCoreOperationalPresentationPacingConfigInput,
  NeuralCoreOperationalPresentationTimeline,
} from "../runtime/neural-core-operational-presentation.types";

export interface MapNeuralCoreOperationalPresentationTimelineParams {
  execution: NeuralCoreOperationalExecution;
  config?: NeuralCoreOperationalPresentationPacingConfigInput;
}

const finitePositive = (value: number | undefined, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback
);

export const resolveNeuralCoreOperationalPresentationPacingConfig = (
  input?: NeuralCoreOperationalPresentationPacingConfigInput,
): Readonly<NeuralCoreOperationalPresentationPacingConfig> => {
  const defaults = DEFAULT_NEURAL_CORE_OPERATIONAL_PRESENTATION_PACING_CONFIG;
  const eventMinimumDurations = Object.fromEntries(
    Object.entries(defaults.eventMinimumDurations).map(([type, durationMs]) => [
      type,
      finitePositive(
        input?.eventMinimumDurations?.[type as NeuralCoreOperationalEventType],
        durationMs,
      ),
    ]),
  ) as unknown as NeuralCoreOperationalPresentationPacingConfig["eventMinimumDurations"];
  return Object.freeze({
    enabled: input?.enabled ?? defaults.enabled,
    executionDurations: Object.freeze({
      successMs: finitePositive(
        input?.executionDurations?.successMs,
        defaults.executionDurations.successMs,
      ),
      degradedMs: finitePositive(
        input?.executionDurations?.degradedMs,
        defaults.executionDurations.degradedMs,
      ),
      failureRecoveryMs: finitePositive(
        input?.executionDurations?.failureRecoveryMs,
        defaults.executionDurations.failureRecoveryMs,
      ),
    }),
    eventMinimumDurations: Object.freeze(eventMinimumDurations),
    stageTransitionGapMs: finitePositive(
      input?.stageTransitionGapMs,
      defaults.stageTransitionGapMs,
    ),
  });
};

const getPresentationDuration = (
  event: NeuralCoreOperationalEvent,
  config: NeuralCoreOperationalPresentationPacingConfig,
): number => config.eventMinimumDurations[event.type];

const getPresentationAdvance = (
  event: NeuralCoreOperationalEvent,
  config: NeuralCoreOperationalPresentationPacingConfig,
): number => {
  switch (event.type) {
    case "execution-started": return 200;
    case "request-received": return 500;
    case "stage-entered": {
      const sourceDurationMs = event.durationMs ?? 0;
      return sourceDurationMs >= 300
        ? 1_500
        : sourceDurationMs >= 100 ? 1_100 : 400;
    }
    case "stage-processing": return event.status === "recovering" ? 800 : 450;
    case "stage-completed":
      return event.status === "warning"
        ? 900
        : config.stageTransitionGapMs;
    case "route-transmission": return 1_100;
    case "metric-updated": return 100;
    case "warning-raised": return 1_600;
    case "failure-raised": return 2_000;
    case "retry-scheduled": return 1_400;
    case "retry-started": return 1_400;
    case "component-recovered": return 1_700;
    case "response-sent": return 500;
    case "execution-completed": return 0;
  }
};

const getTargetDuration = (
  execution: NeuralCoreOperationalExecution,
  config: NeuralCoreOperationalPresentationPacingConfig,
): number => {
  switch (execution.kind) {
    case "success": return config.executionDurations.successMs;
    case "degraded": return config.executionDurations.degradedMs;
    case "failure-recovery": return config.executionDurations.failureRecoveryMs;
  }
};

const mapDisabledTimeline = (
  execution: NeuralCoreOperationalExecution,
  config: NeuralCoreOperationalPresentationPacingConfig,
): NeuralCoreOperationalPresentationTimeline => Object.freeze({
  executionId: execution.id,
  totalPresentationDurationMs: Math.max(0, execution.outcome.totalDurationMs),
  events: Object.freeze(execution.events.map((event): NeuralCoreOperationalPresentationEvent => (
    Object.freeze({
      sourceEventId: event.id,
      presentationAtMs: Math.max(0, event.atMs),
      presentationDurationMs: Math.max(
        event.durationMs ?? 0,
        config.eventMinimumDurations[event.type],
      ),
      sourceAtMs: event.atMs,
      ...(event.durationMs === undefined ? {} : { sourceDurationMs: event.durationMs }),
    })
  ))),
});

export const mapNeuralCoreOperationalPresentationTimeline = ({
  execution,
  config: configInput,
}: MapNeuralCoreOperationalPresentationTimelineParams): NeuralCoreOperationalPresentationTimeline => {
  const config = resolveNeuralCoreOperationalPresentationPacingConfig(configInput);
  if (!config.enabled || execution.events.length === 0) {
    return mapDisabledTimeline(execution, config);
  }
  const targetDurationMs = getTargetDuration(execution, config);
  const finalEvent = execution.events[execution.events.length - 1];
  const finalDurationMs = finalEvent
    ? getPresentationDuration(finalEvent, config)
    : 0;
  let totalAdvanceWeight = 0;
  for (let index = 0; index < execution.events.length - 1; index += 1) {
    totalAdvanceWeight += getPresentationAdvance(execution.events[index], config);
  }
  const availableAdvanceMs = Math.max(0, targetDurationMs - finalDurationMs);
  const advanceScale = totalAdvanceWeight > 0
    ? availableAdvanceMs / totalAdvanceWeight
    : 0;
  let presentationAtMs = 0;
  const events = execution.events.map((event, index): NeuralCoreOperationalPresentationEvent => {
    const remainingMs = Math.max(0, targetDurationMs - presentationAtMs);
    const presentationDurationMs = Math.min(
      remainingMs,
      getPresentationDuration(event, config),
    );
    const mapped: NeuralCoreOperationalPresentationEvent = Object.freeze({
      sourceEventId: event.id,
      presentationAtMs,
      presentationDurationMs,
      sourceAtMs: event.atMs,
      ...(event.durationMs === undefined ? {} : { sourceDurationMs: event.durationMs }),
    });
    if (index < execution.events.length - 1) {
      presentationAtMs = Math.min(
        targetDurationMs,
        presentationAtMs + getPresentationAdvance(event, config) * advanceScale,
      );
    }
    return mapped;
  });
  return Object.freeze({
    executionId: execution.id,
    totalPresentationDurationMs: targetDurationMs,
    events: Object.freeze(events),
  });
};
