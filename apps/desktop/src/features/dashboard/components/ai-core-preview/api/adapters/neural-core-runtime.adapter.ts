import type {
  NeuralCoreExecutionOutcome,
  NeuralCoreMetric,
  NeuralCoreRuntime,
  NeuralCoreRuntimeEvent,
  NeuralCoreRuntimeImpact,
  NeuralCoreRuntimeRetry,
} from "../core/neural-core-runtime.types";
import type { NeuralCoreMetadata } from "../core/neural-core-model.types";

export interface NeuralCoreInternalRuntimeMetric {
  readonly id: string;
  readonly name: string;
  readonly value: NeuralCoreMetric["value"];
  readonly unit?: string;
  readonly status: NeuralCoreMetric["status"];
  readonly trend: NeuralCoreMetric["trend"];
}

export interface NeuralCoreInternalRuntimeImpact {
  readonly level: NeuralCoreRuntimeImpact["level"];
  readonly summary?: string;
  readonly affectedEntityIds: readonly string[];
  readonly affectedClusterIds: readonly string[];
  readonly affectedRouteIds: readonly string[];
  readonly affectedPathwayIds: readonly string[];
}

export interface NeuralCoreInternalRuntimeEvent {
  readonly id: string;
  readonly kind: NeuralCoreRuntimeEvent["kind"];
  readonly status: NeuralCoreRuntimeEvent["status"];
  readonly atMs: number;
  readonly durationMs: number;
  readonly entityId?: string;
  readonly clusterId?: string;
  readonly routeId?: string;
  readonly pathwayId?: string;
  readonly title: string;
  readonly message?: string;
  readonly metrics: readonly NeuralCoreInternalRuntimeMetric[];
  readonly impact?: NeuralCoreInternalRuntimeImpact;
  readonly retry?: NeuralCoreRuntimeRetry;
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreInternalRuntime {
  readonly kind: "execution";
  readonly executionId: string;
  readonly name: string;
  readonly description?: string;
  readonly events: readonly NeuralCoreInternalRuntimeEvent[];
  readonly outcome: NeuralCoreExecutionOutcome;
  readonly autoStart: boolean;
  readonly metadata: NeuralCoreMetadata;
}

const adaptMetric = (metric: NeuralCoreMetric): NeuralCoreInternalRuntimeMetric => Object.freeze({
  id: metric.id,
  name: metric.name,
  value: metric.value,
  unit: metric.unit,
  status: metric.status,
  trend: metric.trend,
});

const adaptImpact = (
  impact: NeuralCoreRuntimeImpact,
): NeuralCoreInternalRuntimeImpact => Object.freeze({
  level: impact.level,
  summary: impact.summary,
  affectedEntityIds: Object.freeze(impact.affectedEntityIds.map(String)),
  affectedClusterIds: Object.freeze(impact.affectedClusterIds.map(String)),
  affectedRouteIds: Object.freeze(impact.affectedRouteIds.map(String)),
  affectedPathwayIds: Object.freeze(impact.affectedPathwayIds.map(String)),
});

const adaptRuntimeEvent = (
  event: NeuralCoreRuntimeEvent,
): NeuralCoreInternalRuntimeEvent => Object.freeze({
  id: event.id,
  kind: event.kind,
  status: event.status,
  atMs: event.atMs,
  durationMs: event.durationMs,
  entityId: event.entityId,
  clusterId: event.clusterId,
  routeId: event.routeId,
  pathwayId: event.pathwayId,
  title: event.title,
  message: event.message,
  metrics: Object.freeze(event.metrics.map(adaptMetric)),
  impact: event.impact === undefined ? undefined : adaptImpact(event.impact),
  retry: event.retry,
  metadata: event.metadata,
});

export const adaptNeuralCoreRuntime = (
  runtime: NeuralCoreRuntime,
): NeuralCoreInternalRuntime => Object.freeze({
  kind: "execution",
  executionId: runtime.execution.id,
  name: runtime.execution.name,
  description: runtime.execution.description,
  events: Object.freeze(runtime.execution.events.map(adaptRuntimeEvent)),
  outcome: runtime.execution.outcome,
  autoStart: runtime.autoStart,
  metadata: runtime.execution.metadata,
});
