import type { NeuralCoreModelAdapterResult } from "../../api/adapters/neural-core-model.adapter";
import type {
  NeuralCoreInternalRuntime,
  NeuralCoreInternalRuntimeEvent,
  NeuralCoreInternalRuntimeMetric,
} from "../../api/adapters/neural-core-runtime.adapter";
import type { NeuralCoreMetadataValue } from "../../api/core/neural-core-model.types";
import type { NeuralCoreOperationalEvent } from "../../domain/operational-runtime/types/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../../domain/operational-runtime/types/neural-core-operational-execution.types";
import type { NeuralCoreOperationalMetric } from "../../domain/operational-runtime/types/neural-core-operational-metric.types";
import type {
  NeuralCoreOperationalScenario,
  NeuralCoreOperationalStage,
} from "../../domain/operational-runtime/types/neural-core-operational-scenario.types";

export interface NeuralCoreOperationalCompatibility {
  readonly execution: NeuralCoreOperationalExecution;
  readonly scenario: NeuralCoreOperationalScenario;
}

const readMetadataString = (
  metadata: Readonly<Record<string, NeuralCoreMetadataValue>>,
  key: string,
): string | undefined => {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
};

const readMetadataCount = (
  metadata: Readonly<Record<string, NeuralCoreMetadataValue>>,
  key: string,
): number => {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
};

const mapMetric = (
  metric: NeuralCoreInternalRuntimeMetric,
): NeuralCoreOperationalMetric => ({
  id: metric.id,
  name: metric.name,
  value: metric.value,
  unit: metric.unit,
  status: metric.status === "success"
    ? "success"
    : metric.status === "warning" || metric.status === "recovering"
      ? "warning"
      : metric.status === "error"
        ? "error"
        : "neutral",
  trend: metric.trend === "unknown" ? "stable" : metric.trend,
});

const mapEventType = (
  event: NeuralCoreInternalRuntimeEvent,
): NeuralCoreOperationalEvent["type"] => {
  switch (event.kind) {
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
      return event.kind;
    default:
      return "stage-processing";
  }
};

const mapEventStatus = (
  event: NeuralCoreInternalRuntimeEvent,
): NeuralCoreOperationalEvent["status"] => {
  switch (event.status) {
    case "idle":
    case "disabled":
      return "idle";
    case "active":
    case "processing":
      return "processing";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "recovering":
      return "recovering";
  }
};

const mapScalarMetadata = (
  metadata: Readonly<Record<string, NeuralCoreMetadataValue>>,
): Readonly<Record<string, string | number | boolean>> => {
  const result: Record<string, string | number | boolean> = {};
  Object.keys(metadata).sort().forEach((key) => {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "boolean") {
      result[key] = value;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = value;
    }
  });
  return result;
};

const resolveInternalEventClusterId = (
  event: NeuralCoreInternalRuntimeEvent,
  model: NeuralCoreModelAdapterResult,
): string | undefined => event.clusterId
  ?? (event.entityId === undefined
    ? undefined
    : model.internalClusterIdByEntityId.get(event.entityId));

const createStages = (
  runtime: NeuralCoreInternalRuntime,
  model: NeuralCoreModelAdapterResult,
): readonly NeuralCoreOperationalStage[] => {
  const stageIdByClusterId = new Map<string, string>();
  runtime.events.forEach((event) => {
    const stageId = readMetadataString(event.metadata, "stageId");
    const clusterId = resolveInternalEventClusterId(event, model);
    if (clusterId !== undefined && stageId !== undefined) {
      stageIdByClusterId.set(clusterId, stageId);
    }
  });
  return model.topology.clusters.map((cluster, index) => ({
    id: stageIdByClusterId.get(cluster.id) ?? `stage:${cluster.id}`,
    name: cluster.label ?? cluster.id,
    shortName: cluster.label ?? cluster.id,
    clusterId: cluster.id,
    order: index,
    role: "processing",
    description: cluster.semanticContext?.description,
    incomingRouteIds: model.topology.synapses
      .filter((route) => route.toClusterId === cluster.id)
      .map((route) => route.id),
    outgoingRouteIds: model.topology.synapses
      .filter((route) => route.fromClusterId === cluster.id)
      .map((route) => route.id),
  }));
};

const mapExecutionKind = (
  runtime: NeuralCoreInternalRuntime,
): NeuralCoreOperationalExecution["kind"] => {
  switch (runtime.outcome.status) {
    case "success":
      return "success";
    case "degraded-success":
      return "degraded";
    case "recovered-success":
    case "failure":
      return "failure-recovery";
  }
};

export const mapNeuralCoreRuntimeToOperationalCompatibility = (
  runtime: NeuralCoreInternalRuntime,
  model: NeuralCoreModelAdapterResult,
): NeuralCoreOperationalCompatibility => {
  const stages = createStages(runtime, model);
  const stageIds = new Set(stages.map((stage) => stage.id));
  const events: readonly NeuralCoreOperationalEvent[] = runtime.events.map((event) => {
    const configuredStageId = readMetadataString(event.metadata, "stageId");
    const stageId = configuredStageId !== undefined && stageIds.has(configuredStageId)
      ? configuredStageId
      : undefined;
    return {
      id: event.id,
      type: mapEventType(event),
      status: mapEventStatus(event),
      atMs: event.atMs,
      durationMs: event.durationMs,
      stageId,
      clusterId: resolveInternalEventClusterId(event, model),
      routeId: event.routeId,
      title: event.title,
      message: event.message,
      metrics: event.metrics.map(mapMetric),
      impact: event.impact === undefined ? undefined : {
        level: event.impact.level,
        affectedClusterIds: Object.freeze([
          ...event.impact.affectedClusterIds,
          ...event.impact.affectedEntityIds.flatMap((entityId) => {
            const internalClusterId = model.internalClusterIdByEntityId.get(entityId);
            return internalClusterId === undefined ? [] : [internalClusterId];
          }),
        ]),
        summary: event.impact.summary,
      },
      retry: event.retry,
      metadata: mapScalarMetadata(event.metadata),
    };
  });
  const execution: NeuralCoreOperationalExecution = {
    id: runtime.executionId,
    name: runtime.name,
    shortName: runtime.name,
    kind: mapExecutionKind(runtime),
    description: runtime.description ?? runtime.name,
    events,
    outcome: {
      status: runtime.outcome.status,
      totalDurationMs: runtime.outcome.totalDurationMs,
      processedStageCount: readMetadataCount(runtime.outcome.metadata, "processedStageCount"),
      warningCount: readMetadataCount(runtime.outcome.metadata, "warningCount"),
      failureCount: readMetadataCount(runtime.outcome.metadata, "failureCount"),
      retryCount: readMetadataCount(runtime.outcome.metadata, "retryCount"),
      failedClusterId: readMetadataString(runtime.outcome.metadata, "failedClusterId"),
      recoveredClusterId: readMetadataString(runtime.outcome.metadata, "recoveredClusterId"),
      summary: runtime.outcome.summary,
      metrics: runtime.outcome.metrics.map((metric) => mapMetric({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        status: metric.status,
        trend: metric.trend,
      })),
    },
  };
  return Object.freeze({
    execution,
    scenario: {
      id: `runtime:${runtime.executionId}`,
      name: runtime.name,
      shortName: runtime.name,
      description: runtime.description ?? runtime.name,
      topology: model.topology,
      stages,
      executions: Object.freeze([execution]),
      defaultExecutionId: execution.id,
    },
  });
};
