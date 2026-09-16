import type {
  NeuralCoreMetricInput,
  NeuralCoreOperationalStatus,
  NeuralCoreRuntimeEventKind,
  NeuralCoreRuntimeInput,
} from "../../../api";
import type { NeuralCoreOperationalEventType } from "../../../domain/operational-runtime/types/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../../../domain/operational-runtime/types/neural-core-operational-execution.types";
import type { NeuralCoreOperationalMetric } from "../../../domain/operational-runtime/types/neural-core-operational-metric.types";

const mapEventKind = (
  type: NeuralCoreOperationalEventType,
): NeuralCoreRuntimeEventKind => {
  switch (type) {
    case "execution-started":
    case "request-received":
    case "stage-entered":
    case "stage-processing":
    case "stage-completed":
    case "route-transmission":
    case "metric-updated":
    case "warning-raised":
    case "failure-raised":
    case "retry-scheduled":
    case "retry-started":
    case "component-recovered":
    case "response-sent":
    case "execution-completed":
      return type;
  }
};

const mapMetric = (metric: NeuralCoreOperationalMetric): NeuralCoreMetricInput => ({
  id: metric.id,
  name: metric.name,
  value: metric.value,
  unit: metric.unit,
  status: metric.status === "neutral" ? "idle" : metric.status,
  trend: metric.trend,
});

const mapStatus = (
  status: NeuralCoreOperationalStatus,
): NeuralCoreOperationalStatus => status;

export const mapNeuralCoreOperationalExecutionToPublicRuntime = (
  execution: NeuralCoreOperationalExecution,
): NeuralCoreRuntimeInput => ({
  kind: "execution",
  autoStart: false,
  execution: {
    id: execution.id,
    name: execution.name,
    description: execution.description,
    events: execution.events.map((event) => ({
      id: event.id,
      kind: mapEventKind(event.type),
      status: mapStatus(event.status),
      atMs: event.atMs,
      durationMs: event.durationMs,
      clusterId: event.clusterId,
      routeId: event.routeId,
      title: event.title,
      message: event.message,
      metrics: event.metrics?.map(mapMetric),
      impact: event.impact === undefined ? undefined : {
        level: event.impact.level,
        summary: event.impact.summary,
        affectedClusterIds: event.impact.affectedClusterIds,
      },
      retry: event.retry,
      metadata: {
        ...(event.metadata ?? {}),
        ...(event.stageId === undefined ? {} : { stageId: event.stageId }),
      },
    })),
    outcome: {
      status: execution.outcome.status,
      summary: execution.outcome.summary,
      totalDurationMs: execution.outcome.totalDurationMs,
      metrics: execution.outcome.metrics?.map(mapMetric),
      metadata: {
        processedStageCount: execution.outcome.processedStageCount,
        warningCount: execution.outcome.warningCount,
        failureCount: execution.outcome.failureCount,
        retryCount: execution.outcome.retryCount,
        ...(execution.outcome.failedClusterId === undefined
          ? {}
          : { failedClusterId: execution.outcome.failedClusterId }),
        ...(execution.outcome.recoveredClusterId === undefined
          ? {}
          : { recoveredClusterId: execution.outcome.recoveredClusterId }),
      },
    },
    metadata: execution.playback === undefined ? {} : {
      playback: {
        recommendedDurationMs: execution.playback.recommendedDurationMs,
        minimumSpeed: execution.playback.minimumSpeed,
        maximumSpeed: execution.playback.maximumSpeed,
      },
    },
  },
});
