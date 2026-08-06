import type { NeuralCoreDemoDefinition } from "../../neural-core-demo-state/neural-core-demo-state.types";
import type {
  NeuralCoreEntity,
  NeuralCoreSignal,
  NeuralCoreState,
  NeuralCoreStatus,
} from "../../../domain/contract/neural-core-contract.types";
import type { NeuralCoreNarrative } from "../../../domain/narrative/neural-core-narrative.types";
import { normalizeNeuralCoreTopology } from "../../../domain/topology/neural-core-topology.utils";
import type { NeuralCoreOperationalEvent } from "../domain/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../domain/neural-core-operational-execution.types";
import type { NeuralCoreOperationalMetric } from "../domain/neural-core-operational-metric.types";
import type { NeuralCoreOperationalOutcome } from "../domain/neural-core-operational-outcome.types";
import type {
  NeuralCoreOperationalScenario,
  NeuralCoreOperationalStage,
} from "../domain/neural-core-operational-scenario.types";
import { validateNeuralCoreOperationalScenario } from "../validators/neural-core-operational-scenario.validator";

const normalizedString = (value: string): string => value.trim();

const finiteNonNegative = (value: number): number => (
  Number.isFinite(value) ? Math.max(0, value) : 0
);

const finitePositive = (value: number, fallback: number): number => (
  Number.isFinite(value) && value > 0 ? value : fallback
);

const normalizedIds = (values: readonly string[] | undefined): readonly string[] => {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values ?? []) {
    const id = normalizedString(value);
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

const freezeOperationalValue = <TValue>(value: TValue): TValue => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeOperationalValue(child);
    }
    Object.freeze(value);
  }
  return value;
};

const normalizeNeuralCoreOperationalMetric = (
  metric: NeuralCoreOperationalMetric,
  index: number,
): NeuralCoreOperationalMetric => {
  const id = normalizedString(metric.id) || `invalid-metric-${index}`;
  const name = normalizedString(metric.name) || "Invalid metric";
  const value = typeof metric.value === "number" && !Number.isFinite(metric.value)
    ? 0
    : metric.value;
  const unit = metric.unit === undefined ? undefined : normalizedString(metric.unit);
  return {
    id,
    name,
    value,
    ...(unit ? { unit } : {}),
    ...(metric.status ? { status: metric.status } : {}),
    ...(metric.trend ? { trend: metric.trend } : {}),
  };
};

const normalizeMetrics = (
  metrics: readonly NeuralCoreOperationalMetric[] | undefined,
): readonly NeuralCoreOperationalMetric[] | undefined => {
  if (!metrics) {
    return undefined;
  }
  return metrics.map(normalizeNeuralCoreOperationalMetric);
};

const normalizeMetadata = (
  metadata: NeuralCoreOperationalEvent["metadata"],
): NeuralCoreOperationalEvent["metadata"] => {
  if (!metadata) {
    return undefined;
  }
  const normalized: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(metadata).sort()) {
    const normalizedKey = normalizedString(key);
    const value = metadata[key];
    if (
      normalizedKey
      && (typeof value !== "number" || Number.isFinite(value))
    ) {
      normalized[normalizedKey] = value;
    }
  }
  return normalized;
};

const normalizeNeuralCoreOperationalEvent = (
  event: NeuralCoreOperationalEvent,
  index: number,
): NeuralCoreOperationalEvent => {
  const metrics = normalizeMetrics(event.metrics);
  const metadata = normalizeMetadata(event.metadata);
  const impactClusterIds = normalizedIds(event.impact?.affectedClusterIds);
  const retry = event.retry
    ? {
      attempt: Math.max(1, Math.trunc(finiteNonNegative(event.retry.attempt))),
      maximumAttempts: Math.max(
        1,
        Math.trunc(finiteNonNegative(event.retry.maximumAttempts)),
      ),
      delayMs: finiteNonNegative(event.retry.delayMs),
      ...(event.retry.reason && normalizedString(event.retry.reason)
        ? { reason: normalizedString(event.retry.reason) }
        : {}),
    }
    : undefined;
  return {
    id: normalizedString(event.id) || `invalid-event-${index}`,
    type: event.type,
    status: event.status,
    atMs: finiteNonNegative(event.atMs),
    ...(event.durationMs === undefined
      ? {}
      : { durationMs: finiteNonNegative(event.durationMs) }),
    ...(event.stageId && normalizedString(event.stageId)
      ? { stageId: normalizedString(event.stageId) }
      : {}),
    ...(event.clusterId && normalizedString(event.clusterId)
      ? { clusterId: normalizedString(event.clusterId) }
      : {}),
    ...(event.routeId && normalizedString(event.routeId)
      ? { routeId: normalizedString(event.routeId) }
      : {}),
    title: normalizedString(event.title) || "Untitled operational event",
    ...(event.message && normalizedString(event.message)
      ? { message: normalizedString(event.message) }
      : {}),
    ...(metrics ? { metrics } : {}),
    ...(event.impact
      ? {
        impact: {
          level: event.impact.level,
          ...(impactClusterIds.length > 0
            ? { affectedClusterIds: impactClusterIds }
            : {}),
          ...(event.impact.summary && normalizedString(event.impact.summary)
            ? { summary: normalizedString(event.impact.summary) }
            : {}),
        },
      }
      : {}),
    ...(retry ? { retry } : {}),
    ...(metadata ? { metadata } : {}),
  };
};

const normalizeOutcome = (
  outcome: NeuralCoreOperationalOutcome,
): NeuralCoreOperationalOutcome => {
  const metrics = normalizeMetrics(outcome.metrics);
  return {
    status: outcome.status,
    totalDurationMs: finiteNonNegative(outcome.totalDurationMs),
    processedStageCount: Math.trunc(finiteNonNegative(outcome.processedStageCount)),
    warningCount: Math.trunc(finiteNonNegative(outcome.warningCount)),
    failureCount: Math.trunc(finiteNonNegative(outcome.failureCount)),
    retryCount: Math.trunc(finiteNonNegative(outcome.retryCount)),
    ...(outcome.failedClusterId && normalizedString(outcome.failedClusterId)
      ? { failedClusterId: normalizedString(outcome.failedClusterId) }
      : {}),
    ...(outcome.recoveredClusterId && normalizedString(outcome.recoveredClusterId)
      ? { recoveredClusterId: normalizedString(outcome.recoveredClusterId) }
      : {}),
    summary: normalizedString(outcome.summary) || "Outcome unavailable.",
    ...(metrics ? { metrics } : {}),
  };
};

export const normalizeNeuralCoreOperationalExecution = (
  execution: NeuralCoreOperationalExecution,
): NeuralCoreOperationalExecution => {
  const events = execution.events
    .map(normalizeNeuralCoreOperationalEvent)
    .sort((left, right) => left.atMs - right.atMs || left.id.localeCompare(right.id));
  const normalized: NeuralCoreOperationalExecution = {
    id: normalizedString(execution.id) || "invalid-execution",
    name: normalizedString(execution.name) || "Invalid execution",
    shortName: normalizedString(execution.shortName) || "Invalid",
    kind: execution.kind,
    description: normalizedString(execution.description) || "Description unavailable.",
    events,
    outcome: normalizeOutcome(execution.outcome),
    ...(execution.playback
      ? {
        playback: {
          recommendedDurationMs: finitePositive(
            execution.playback.recommendedDurationMs,
            1,
          ),
          minimumSpeed: finitePositive(execution.playback.minimumSpeed, 0.25),
          maximumSpeed: finitePositive(execution.playback.maximumSpeed, 1),
        },
      }
      : {}),
  };
  return freezeOperationalValue(normalized);
};

const normalizeStage = (
  stage: NeuralCoreOperationalStage,
  index: number,
): NeuralCoreOperationalStage => ({
  id: normalizedString(stage.id) || `invalid-stage-${index}`,
  name: normalizedString(stage.name) || "Invalid stage",
  shortName: normalizedString(stage.shortName) || "Invalid",
  clusterId: normalizedString(stage.clusterId),
  order: Math.trunc(finiteNonNegative(stage.order)),
  role: stage.role,
  ...(stage.description && normalizedString(stage.description)
    ? { description: normalizedString(stage.description) }
    : {}),
  incomingRouteIds: normalizedIds(stage.incomingRouteIds),
  outgoingRouteIds: normalizedIds(stage.outgoingRouteIds),
});

export const normalizeNeuralCoreOperationalScenario = (
  scenario: NeuralCoreOperationalScenario,
): NeuralCoreOperationalScenario => {
  const normalized: NeuralCoreOperationalScenario = {
    id: normalizedString(scenario.id) || "invalid-operational-scenario",
    name: normalizedString(scenario.name) || "Invalid operational scenario",
    shortName: normalizedString(scenario.shortName) || "Invalid",
    description: normalizedString(scenario.description) || "Description unavailable.",
    topology: normalizeNeuralCoreTopology(scenario.topology),
    stages: scenario.stages
      .map(normalizeStage)
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
    executions: scenario.executions.map(normalizeNeuralCoreOperationalExecution),
    defaultExecutionId: normalizedString(scenario.defaultExecutionId),
    ...(scenario.tags ? { tags: normalizedIds(scenario.tags) } : {}),
  };
  return freezeOperationalValue(normalized);
};

const mapTopologyStatus = (
  status: NeuralCoreOperationalScenario["topology"]["status"],
): NeuralCoreStatus | undefined => {
  if (status === "idle") {
    return "neutral";
  }
  if (status === "processing") {
    return "active";
  }
  return status;
};

const mapClusterToEntity = (
  cluster: NeuralCoreOperationalScenario["topology"]["clusters"][number],
): NeuralCoreEntity => ({
  id: cluster.id,
  label: cluster.label,
  kind: cluster.kind,
  status: mapTopologyStatus(cluster.status),
  activity: cluster.activity,
  importance: cluster.importance,
  health: cluster.stability,
});

const mapSynapseToSignal = (
  synapse: NeuralCoreOperationalScenario["topology"]["synapses"][number],
): NeuralCoreSignal => ({
  id: synapse.id,
  from: synapse.fromClusterId,
  to: synapse.toClusterId,
  kind: "route",
  status: mapTopologyStatus(synapse.status),
  intensity: synapse.weight,
  progress: 0,
  speed: synapse.conductivity,
});

const createOperationalOverviewNarrative = (
  scenario: NeuralCoreOperationalScenario,
): NeuralCoreNarrative => ({
  id: `narrative:${scenario.id}:overview`,
  durationSeconds: 3600,
  loop: false,
  phases: [{
    id: "operational-architecture-overview",
    kind: "custom",
    label: "Operational request architecture",
    description: "A client request enters through the gateway, is authenticated, processed by the core service, uses cache or persistence when required, calls an external AI service, and returns a response.",
    startSeconds: 0,
    durationSeconds: 3600,
    emphasis: {
      cluster: 0.16,
      route: 0.2,
      contextDim: 0,
      internalActivity: 0.12,
    },
    holdAtEnd: true,
  }],
});

export const mapOperationalScenarioToNeuralCoreDemo = (
  scenario: NeuralCoreOperationalScenario,
): NeuralCoreDemoDefinition => {
  const validation = validateNeuralCoreOperationalScenario(scenario);
  const normalized = normalizeNeuralCoreOperationalScenario(scenario);
  const state: NeuralCoreState = {
    mode: "observing",
    entities: normalized.topology.clusters.map(mapClusterToEntity),
    signals: normalized.topology.synapses.map(mapSynapseToSignal),
    topology: normalized.topology,
    globalActivity: normalized.topology.globalActivity,
    complexity: 0.86,
    focusEntityId: "core-service",
    accentColor: "blue",
    metadata: {
      operationalScenarioId: normalized.id,
      defaultOperationalExecutionId: normalized.defaultExecutionId,
      operationalExecutionIds: normalized.executions.map(({ id }) => id),
    },
  };
  return {
    scenario: "operational-flow",
    state,
    narrative: createOperationalOverviewNarrative(normalized),
    operational: {
      scenarioId: normalized.id,
      defaultExecutionId: normalized.defaultExecutionId,
      stages: normalized.stages,
      executions: normalized.executions,
      diagnostics: validation.diagnostics,
    },
  };
};
