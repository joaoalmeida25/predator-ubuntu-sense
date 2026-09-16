import { validateNeuralCoreClusterSemanticRelationships } from "../../../domain/semantic/neural-core-semantic-context.utils";
import type { NeuralCoreOperationalEvent } from "../../../domain/operational-runtime/types/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../../../domain/operational-runtime/types/neural-core-operational-execution.types";
import type { NeuralCoreOperationalMetric } from "../../../domain/operational-runtime/types/neural-core-operational-metric.types";
import type {
  NeuralCoreOperationalDiagnostic,
  NeuralCoreOperationalScenario,
  NeuralCoreOperationalValidationResult,
} from "../../../domain/operational-runtime/types/neural-core-operational-scenario.types";

type DiagnosticContext = Omit<NeuralCoreOperationalDiagnostic, "code" | "message" | "severity">;

const diagnostic = (
  code: string,
  message: string,
  context: DiagnosticContext = {},
  severity: NeuralCoreOperationalDiagnostic["severity"] = "error",
): NeuralCoreOperationalDiagnostic => ({ code, severity, message, ...context });

const isBlank = (value: string | undefined): boolean => !value || value.trim().length === 0;

const validateMetrics = (
  metrics: readonly NeuralCoreOperationalMetric[] | undefined,
  context: DiagnosticContext,
): NeuralCoreOperationalDiagnostic[] => {
  const diagnostics: NeuralCoreOperationalDiagnostic[] = [];
  const metricIds = new Set<string>();
  for (const metric of metrics ?? []) {
    if (isBlank(metric.id)) {
      diagnostics.push(diagnostic("metric.id.empty", "Metric id must not be empty.", context));
    } else if (metricIds.has(metric.id)) {
      diagnostics.push(diagnostic(
        "metric.id.duplicate",
        `Metric id '${metric.id}' is duplicated in the same collection.`,
        context,
      ));
    }
    metricIds.add(metric.id);
    if (isBlank(metric.name)) {
      diagnostics.push(diagnostic("metric.name.empty", "Metric name must not be empty.", context));
    }
    if (
      typeof metric.value !== "string"
      && typeof metric.value !== "number"
      && typeof metric.value !== "boolean"
    ) {
      diagnostics.push(diagnostic("metric.value.invalid", "Metric value has an unsupported type.", context));
    } else if (typeof metric.value === "number" && !Number.isFinite(metric.value)) {
      diagnostics.push(diagnostic("metric.value.non-finite", "Metric value must be finite.", context));
    }
    if (metric.unit !== undefined && isBlank(metric.unit)) {
      diagnostics.push(diagnostic("metric.unit.empty", "Metric unit must not be empty.", context));
    }
  }
  return diagnostics;
};

const validateEventReferences = (
  event: NeuralCoreOperationalEvent,
  executionId: string,
  clusterIds: ReadonlySet<string>,
  routeIds: ReadonlySet<string>,
  stageById: ReadonlyMap<string, NeuralCoreOperationalScenario["stages"][number]>,
): NeuralCoreOperationalDiagnostic[] => {
  const diagnostics: NeuralCoreOperationalDiagnostic[] = [];
  const context = { executionId, eventId: event.id };
  const stage = event.stageId ? stageById.get(event.stageId) : undefined;
  if (event.stageId && !stage) {
    diagnostics.push(diagnostic(
      "event.stage.missing",
      `Event references unknown stage '${event.stageId}'.`,
      { ...context, stageId: event.stageId },
    ));
  }
  if (event.clusterId && !clusterIds.has(event.clusterId)) {
    diagnostics.push(diagnostic(
      "event.cluster.missing",
      `Event references unknown cluster '${event.clusterId}'.`,
      { ...context, clusterId: event.clusterId },
    ));
  }
  if (event.routeId && !routeIds.has(event.routeId)) {
    diagnostics.push(diagnostic(
      "event.route.missing",
      `Event references unknown route '${event.routeId}'.`,
      { ...context, routeId: event.routeId },
    ));
  }
  if (stage && event.clusterId && stage.clusterId !== event.clusterId) {
    diagnostics.push(diagnostic(
      "event.stage-cluster.mismatch",
      `Event stage '${stage.id}' does not belong to cluster '${event.clusterId}'.`,
      { ...context, stageId: stage.id, clusterId: event.clusterId },
    ));
  }
  for (const affectedClusterId of event.impact?.affectedClusterIds ?? []) {
    if (!clusterIds.has(affectedClusterId)) {
      diagnostics.push(diagnostic(
        "event.impact.cluster.missing",
        `Event impact references unknown cluster '${affectedClusterId}'.`,
        { ...context, clusterId: affectedClusterId },
      ));
    }
  }
  for (const [key, value] of Object.entries(event.metadata ?? {})) {
    if (isBlank(key) || (typeof value === "number" && !Number.isFinite(value))) {
      diagnostics.push(diagnostic(
        "event.metadata.invalid",
        "Event metadata keys must be non-empty and numeric values must be finite.",
        context,
      ));
    }
  }
  return diagnostics;
};

export const validateNeuralCoreOperationalExecution = (
  execution: NeuralCoreOperationalExecution,
  scenario?: NeuralCoreOperationalScenario,
): NeuralCoreOperationalValidationResult => {
  const diagnostics: NeuralCoreOperationalDiagnostic[] = [];
  const executionContext = { executionId: execution.id };
  if (isBlank(execution.id) || isBlank(execution.name) || isBlank(execution.shortName)) {
    diagnostics.push(diagnostic(
      "execution.identity.invalid",
      "Execution id, name, and short name must not be empty.",
      executionContext,
    ));
  }
  if (isBlank(execution.description)) {
    diagnostics.push(diagnostic(
      "execution.description.empty",
      "Execution description must not be empty.",
      executionContext,
    ));
  }
  if (execution.events.length === 0) {
    diagnostics.push(diagnostic(
      "execution.events.empty",
      "Execution must contain events.",
      executionContext,
    ));
  }

  const eventIds = new Set<string>();
  let precedingFailureCount = 0;
  let previousEvent: NeuralCoreOperationalEvent | undefined;
  let lastEventEndMs = 0;
  let warningCount = 0;
  let failureCount = 0;
  let retryCount = 0;
  const completedStageIds = new Set<string>();
  const clusterIds = new Set(scenario?.topology.clusters.map(({ id }) => id) ?? []);
  const routeIds = new Set(scenario?.topology.synapses.map(({ id }) => id) ?? []);
  const stageById = new Map(scenario?.stages.map((stage) => [stage.id, stage]) ?? []);

  for (const event of execution.events) {
    const context = { executionId: execution.id, eventId: event.id };
    if (isBlank(event.id)) {
      diagnostics.push(diagnostic("event.id.empty", "Event id must not be empty.", context));
    } else if (eventIds.has(event.id)) {
      diagnostics.push(diagnostic(
        "event.id.duplicate",
        `Event id '${event.id}' is duplicated.`,
        context,
      ));
    }
    eventIds.add(event.id);
    if (!Number.isFinite(event.atMs) || event.atMs < 0) {
      diagnostics.push(diagnostic("event.time.invalid", "Event atMs must be finite and non-negative.", context));
    }
    if (
      event.durationMs !== undefined
      && (!Number.isFinite(event.durationMs) || event.durationMs < 0)
    ) {
      diagnostics.push(diagnostic(
        "event.duration.invalid",
        "Event durationMs must be finite and non-negative.",
        context,
      ));
    }
    if (previousEvent && (
      event.atMs < previousEvent.atMs
      || (event.atMs === previousEvent.atMs && event.id.localeCompare(previousEvent.id) < 0)
    )) {
      diagnostics.push(diagnostic(
        "event.order.invalid",
        "Events must be ordered by atMs and then by stable id.",
        context,
      ));
    }
    previousEvent = event;
    lastEventEndMs = Math.max(lastEventEndMs, event.atMs + (event.durationMs ?? 0));
    if (isBlank(event.title)) {
      diagnostics.push(diagnostic("event.title.empty", "Event title must not be empty.", context));
    }
    diagnostics.push(...validateMetrics(event.metrics, context));
    if (scenario) {
      diagnostics.push(...validateEventReferences(
        event,
        execution.id,
        clusterIds,
        routeIds,
        stageById,
      ));
    }
    if (event.type === "warning-raised") {
      warningCount += 1;
    }
    if (event.type === "failure-raised") {
      failureCount += 1;
      precedingFailureCount += 1;
    }
    if (event.type === "retry-started") {
      retryCount += 1;
    }
    if (event.type === "stage-completed" && event.stageId) {
      completedStageIds.add(event.stageId);
    }
    if (event.type === "retry-scheduled" || event.type === "retry-started") {
      if (precedingFailureCount === 0) {
        diagnostics.push(diagnostic(
          "retry.failure.missing",
          "Retry event requires a preceding failure event.",
          context,
        ));
      }
      if (!event.retry) {
        diagnostics.push(diagnostic(
          "retry.metadata.missing",
          "Retry event requires explicit retry metadata.",
          context,
        ));
      }
    }
    if (event.retry && (
      !Number.isInteger(event.retry.attempt)
      || !Number.isInteger(event.retry.maximumAttempts)
      || event.retry.attempt < 1
      || event.retry.maximumAttempts < event.retry.attempt
      || !Number.isFinite(event.retry.delayMs)
      || event.retry.delayMs < 0
    )) {
      diagnostics.push(diagnostic(
        "retry.metadata.invalid",
        "Retry attempt, maximum attempts, and delay must be valid non-negative values.",
        context,
      ));
    }
  }

  const firstEvent = execution.events[0];
  const lastEvent = execution.events[execution.events.length - 1];
  if (firstEvent?.type !== "execution-started") {
    diagnostics.push(diagnostic(
      "execution.start.missing",
      "First execution event must be execution-started.",
      executionContext,
    ));
  }
  if (lastEvent?.type !== "execution-completed") {
    diagnostics.push(diagnostic(
      "execution.completion.missing",
      "Last execution event must be execution-completed.",
      executionContext,
    ));
  }

  const outcome = execution.outcome;
  diagnostics.push(...validateMetrics(outcome.metrics, executionContext));
  if (!Number.isFinite(outcome.totalDurationMs) || outcome.totalDurationMs < lastEventEndMs) {
    diagnostics.push(diagnostic(
      "outcome.duration.incoherent",
      "Outcome duration must cover the final event and its duration.",
      executionContext,
    ));
  }
  if (outcome.warningCount !== warningCount) {
    diagnostics.push(diagnostic("outcome.warning-count.incoherent", "Outcome warning count does not match warning events.", executionContext));
  }
  if (outcome.failureCount !== failureCount) {
    diagnostics.push(diagnostic("outcome.failure-count.incoherent", "Outcome failure count does not match failure events.", executionContext));
  }
  if (outcome.retryCount !== retryCount) {
    diagnostics.push(diagnostic("outcome.retry-count.incoherent", "Outcome retry count does not match started retries.", executionContext));
  }
  if (outcome.processedStageCount !== completedStageIds.size) {
    diagnostics.push(diagnostic("outcome.stage-count.incoherent", "Outcome processed stage count does not match completed stages.", executionContext));
  }
  if (isBlank(outcome.summary)) {
    diagnostics.push(diagnostic("outcome.summary.empty", "Outcome summary must not be empty.", executionContext));
  }
  if (scenario) {
    for (const clusterId of [outcome.failedClusterId, outcome.recoveredClusterId]) {
      if (clusterId && !clusterIds.has(clusterId)) {
        diagnostics.push(diagnostic(
          "outcome.cluster.missing",
          `Outcome references unknown cluster '${clusterId}'.`,
          { ...executionContext, clusterId },
        ));
      }
    }
  }
  if (outcome.status === "success" && (failureCount > 0 || retryCount > 0)) {
    diagnostics.push(diagnostic("outcome.status.incoherent", "Success outcome cannot contain failures or retries.", executionContext));
  }
  if (outcome.status === "degraded-success" && (warningCount === 0 || failureCount > 0)) {
    diagnostics.push(diagnostic("outcome.status.incoherent", "Degraded success requires warnings without failures.", executionContext));
  }
  if (outcome.status === "recovered-success" && (
    failureCount === 0
    || retryCount === 0
    || !outcome.recoveredClusterId
  )) {
    diagnostics.push(diagnostic("outcome.status.incoherent", "Recovered success requires failure, retry, and recovered cluster data.", executionContext));
  }
  if (execution.playback && (
    !Number.isFinite(execution.playback.recommendedDurationMs)
    || execution.playback.recommendedDurationMs <= 0
    || !Number.isFinite(execution.playback.minimumSpeed)
    || !Number.isFinite(execution.playback.maximumSpeed)
    || execution.playback.minimumSpeed <= 0
    || execution.playback.maximumSpeed < execution.playback.minimumSpeed
  )) {
    diagnostics.push(diagnostic("playback.metadata.invalid", "Playback metadata must define a valid duration and speed range.", executionContext));
  }
  return { valid: diagnostics.every(({ severity }) => severity !== "error"), diagnostics };
};

export const validateNeuralCoreOperationalScenario = (
  scenario: NeuralCoreOperationalScenario,
): NeuralCoreOperationalValidationResult => {
  const diagnostics: NeuralCoreOperationalDiagnostic[] = [];
  if (
    isBlank(scenario.id)
    || isBlank(scenario.name)
    || isBlank(scenario.shortName)
    || isBlank(scenario.description)
  ) {
    diagnostics.push(diagnostic(
      "scenario.identity.invalid",
      "Scenario id, names, and description must not be empty.",
    ));
  }

  const clusterIds = new Set<string>();
  for (const cluster of scenario.topology.clusters) {
    if (isBlank(cluster.id)) {
      diagnostics.push(diagnostic("cluster.id.empty", "Cluster id must not be empty."));
    } else if (clusterIds.has(cluster.id)) {
      diagnostics.push(diagnostic(
        "cluster.id.duplicate",
        `Cluster id '${cluster.id}' is duplicated.`,
        { clusterId: cluster.id },
      ));
    }
    clusterIds.add(cluster.id);
  }

  const routeIds = new Set<string>();
  for (const route of scenario.topology.synapses) {
    if (isBlank(route.id)) {
      diagnostics.push(diagnostic("route.id.empty", "Route id must not be empty."));
    } else if (routeIds.has(route.id)) {
      diagnostics.push(diagnostic(
        "route.id.duplicate",
        `Route id '${route.id}' is duplicated.`,
        { routeId: route.id },
      ));
    }
    routeIds.add(route.id);
    for (const clusterId of [route.fromClusterId, route.toClusterId]) {
      if (!clusterIds.has(clusterId)) {
        diagnostics.push(diagnostic(
          "route.cluster.missing",
          `Route '${route.id}' references unknown cluster '${clusterId}'.`,
          { routeId: route.id, clusterId },
        ));
      }
    }
  }

  const pathwayIds = new Set<string>();
  for (const pathway of scenario.topology.pathways ?? []) {
    if (pathwayIds.has(pathway.id)) {
      diagnostics.push(diagnostic(
        "pathway.id.duplicate",
        `Pathway id '${pathway.id}' is duplicated.`,
      ));
    }
    pathwayIds.add(pathway.id);
    for (const clusterId of pathway.clusterIds) {
      if (!clusterIds.has(clusterId)) {
        diagnostics.push(diagnostic("pathway.cluster.missing", `Pathway '${pathway.id}' references unknown cluster '${clusterId}'.`, { clusterId }));
      }
    }
    for (const routeId of pathway.synapseIds) {
      if (!routeIds.has(routeId)) {
        diagnostics.push(diagnostic("pathway.route.missing", `Pathway '${pathway.id}' references unknown route '${routeId}'.`, { routeId }));
      }
    }
  }

  for (const cluster of scenario.topology.clusters) {
    const relationships = validateNeuralCoreClusterSemanticRelationships(
      cluster,
      scenario.topology,
    );
    for (const clusterId of relationships.missingClusterIds) {
      diagnostics.push(diagnostic("semantic.cluster.missing", `Cluster '${cluster.id}' semantic context references unknown cluster '${clusterId}'.`, { clusterId }));
    }
    for (const routeId of relationships.missingSynapseIds) {
      diagnostics.push(diagnostic("semantic.route.missing", `Cluster '${cluster.id}' semantic context references unknown route '${routeId}'.`, { routeId }));
    }
    for (const routeId of relationships.missingPathwayIds) {
      diagnostics.push(diagnostic("semantic.pathway.missing", `Cluster '${cluster.id}' semantic context references unknown pathway '${routeId}'.`));
    }
  }

  const stageIds = new Set<string>();
  const stageOrders = new Set<number>();
  for (const stage of scenario.stages) {
    if (isBlank(stage.id) || isBlank(stage.name) || isBlank(stage.shortName)) {
      diagnostics.push(diagnostic("stage.identity.invalid", "Stage id and names must not be empty.", { stageId: stage.id }));
    } else if (stageIds.has(stage.id)) {
      diagnostics.push(diagnostic("stage.id.duplicate", `Stage id '${stage.id}' is duplicated.`, { stageId: stage.id }));
    }
    stageIds.add(stage.id);
    if (!clusterIds.has(stage.clusterId)) {
      diagnostics.push(diagnostic("stage.cluster.missing", `Stage '${stage.id}' references unknown cluster '${stage.clusterId}'.`, { stageId: stage.id, clusterId: stage.clusterId }));
    }
    if (!Number.isInteger(stage.order) || stage.order < 0 || stageOrders.has(stage.order)) {
      diagnostics.push(diagnostic("stage.order.invalid", `Stage '${stage.id}' must have a unique non-negative integer order.`, { stageId: stage.id }));
    }
    stageOrders.add(stage.order);
    for (const routeId of [...stage.incomingRouteIds, ...stage.outgoingRouteIds]) {
      if (!routeIds.has(routeId)) {
        diagnostics.push(diagnostic("stage.route.missing", `Stage '${stage.id}' references unknown route '${routeId}'.`, { stageId: stage.id, routeId }));
      }
    }
  }

  const executionIds = new Set<string>();
  for (const execution of scenario.executions) {
    if (executionIds.has(execution.id)) {
      diagnostics.push(diagnostic("execution.id.duplicate", `Execution id '${execution.id}' is duplicated.`, { executionId: execution.id }));
    }
    executionIds.add(execution.id);
    diagnostics.push(...validateNeuralCoreOperationalExecution(execution, scenario).diagnostics);
  }
  if (!executionIds.has(scenario.defaultExecutionId)) {
    diagnostics.push(diagnostic(
      "scenario.default-execution.missing",
      `Default execution '${scenario.defaultExecutionId}' does not exist.`,
      { executionId: scenario.defaultExecutionId },
    ));
  }
  return { valid: diagnostics.every(({ severity }) => severity !== "error"), diagnostics };
};
