import type { NeuralCoreOperationalEvent } from "../types/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../types/neural-core-operational-execution.types";
import type {
  NeuralCoreOperationalScenario,
  NeuralCoreOperationalStage,
} from "../types/neural-core-operational-scenario.types";
import type {
  NeuralCoreOperationalPresentationEvent,
  NeuralCoreOperationalPresentationTimeline,
} from "./neural-core-operational-presentation.types";
import type {
  NeuralCoreOperationalEventBoundary,
  NeuralCoreOperationalExecutionIndex,
  NeuralCoreOperationalImpactRuntimeState,
  NeuralCoreOperationalRouteIndex,
  NeuralCoreOperationalRuntimeNarrative,
} from "./neural-core-operational-runtime.types";
import { clampNeuralCoreOperationalRuntimeValue } from "./neural-core-operational-runtime.utils";

interface MutableNeuralCoreOperationalEventBoundary {
  atMs: number;
  enteringEventIndexes: number[];
  exitingEventIndexes: number[];
}

const appendToLookup = (
  lookup: Map<string, NeuralCoreOperationalEvent[]>,
  id: string | undefined,
  event: NeuralCoreOperationalEvent,
): void => {
  if (!id) {
    return;
  }
  const events = lookup.get(id);
  if (events) {
    events.push(event);
    return;
  }
  lookup.set(id, [event]);
};

const mapEventStatus = (
  event: NeuralCoreOperationalEvent,
): NeuralCoreOperationalRuntimeNarrative["status"] => {
  if (event.type === "stage-completed" || event.type === "response-sent") {
    return event.status === "warning" ? "warning" : "success";
  }
  return event.status;
};

const formatMetricValue = (event: NeuralCoreOperationalEvent, metricId: string): string | undefined => {
  const metric = event.metrics?.find(({ id }) => id === metricId);
  if (!metric) {
    return undefined;
  }
  return `${String(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`;
};

const getRouteNarrativeMessage = (
  routeIndex: NeuralCoreOperationalRouteIndex,
): string => {
  const sourceRole = routeIndex.sourceStage?.role;
  const targetRole = routeIndex.targetStage?.role;
  if (targetRole === "authentication") {
    return "Forwarding the request for identity validation.";
  }
  if (targetRole === "cache") {
    return "Looking for a previously computed result.";
  }
  if (targetRole === "persistence") {
    return "Loading the request context from persistence.";
  }
  if (targetRole === "external") {
    return "Sending the request to the external inference service.";
  }
  if (sourceRole === "external" && targetRole === "processing") {
    return "Returning the processed result to the core service.";
  }
  if (sourceRole === "cache" && targetRole === "processing") {
    return "Returning the cache result to the core service.";
  }
  if (sourceRole === "persistence" && targetRole === "processing") {
    return "Returning the persisted context to the core service.";
  }
  if (targetRole === "response") {
    return "Forwarding the processed result to the response boundary.";
  }
  if (targetRole === "gateway") {
    return "Forwarding the incoming request to the API gateway.";
  }
  if (sourceRole === "authentication" && targetRole === "processing") {
    return "Forwarding the authenticated request to the core service.";
  }
  return "Transmitting the request to the next operational component.";
};

const getNarrativeMessage = (
  event: NeuralCoreOperationalEvent,
  execution: NeuralCoreOperationalExecution,
  routeIndex?: NeuralCoreOperationalRouteIndex,
): string => {
  if (event.type === "route-transmission" && routeIndex) {
    return getRouteNarrativeMessage(routeIndex);
  }
  if (
    event.type === "warning-raised"
    && event.clusterId === "external-ai-api"
    && execution.kind === "degraded"
  ) {
    return "The external AI service is responding above the expected threshold.";
  }
  if (event.message) {
    if (event.type === "failure-raised") {
      return "The external AI service did not respond within the expected time.";
    }
    return event.message;
  }
  if (event.title === "Validating identity") {
    return "The access token is being validated.";
  }
  if (event.title === "Authentication approved") {
    return "The access token is valid and the request is authorized.";
  }
  if (event.title === "Cache hit") {
    return "A cached result was found in 8 ms.";
  }
  if (event.title === "Cache miss") {
    return "No cached result was available. Loading context from persistence.";
  }
  if (event.title === "Persistent context loaded") {
    return `The database returned the required request context in ${
      formatMetricValue(event, "database-latency") ?? "the expected time"
    }.`;
  }
  if (event.type === "warning-raised" && event.clusterId === "external-ai-api") {
    return event.title.includes("timeout")
      ? "The external service is approaching its timeout boundary."
      : "The external AI service is responding above the expected threshold.";
  }
  if (event.title === "External inference processing") {
    return "The external service is processing the request.";
  }
  if (event.title === "External inference completed") {
    return "The external AI service completed enrichment in 320 ms.";
  }
  switch (event.type) {
    case "execution-started":
      return `The ${execution.shortName.toLowerCase()} execution is starting from the client boundary.`;
    case "request-received":
      return "A new client request entered the system.";
    case "stage-entered":
      return "The active component is processing the request.";
    case "stage-processing":
      return "The component is evaluating the current operation.";
    case "stage-completed":
      return "The component completed its stage successfully.";
    case "route-transmission":
      return "The request is moving to the next component.";
    case "metric-updated":
      return "Operational metrics were updated for this component.";
    case "response-sent":
      return `The request completed with HTTP 200 in ${
        formatMetricValue(event, "total-latency") ?? `${execution.outcome.totalDurationMs} ms`
      }.`;
    case "execution-completed":
      return execution.outcome.summary;
    case "warning-raised":
      return "The component reported an operational warning.";
    case "failure-raised":
      return "The external AI service did not respond within the expected time.";
    case "retry-scheduled":
      return "A second attempt will start after the configured recovery delay.";
    case "retry-started":
      return `Attempt ${event.retry?.attempt ?? 2} of ${
        event.retry?.maximumAttempts ?? 2
      } is now in progress.`;
    case "component-recovered":
      return "The external AI service responded successfully on the second attempt.";
  }
};

const getNarrativeTitle = (
  event: NeuralCoreOperationalEvent,
  execution: NeuralCoreOperationalExecution,
  routeIndex?: NeuralCoreOperationalRouteIndex,
): string => {
  if (
    event.type === "route-transmission"
    && routeIndex?.sourceStage
    && routeIndex.targetStage
  ) {
    return `${routeIndex.sourceStage.name} → ${routeIndex.targetStage.name}`;
  }
  if (event.type === "failure-raised") return "External service timeout";
  if (event.type === "retry-started") return "Retrying external service";
  if (event.type === "component-recovered") return "Service recovered";
  if (event.title === "Persistent context loaded") return "Reading persisted context";
  if (
    event.type === "warning-raised"
    && execution.kind === "degraded"
  ) return "External service latency";
  if (event.type === "execution-completed") {
    if (execution.outcome.status === "degraded-success") {
      return "Degraded execution completed";
    }
    if (execution.outcome.status === "recovered-success") {
      return "Recovered execution completed";
    }
  }
  return event.title;
};

const mapEventNarrative = (
  event: NeuralCoreOperationalEvent,
  execution: NeuralCoreOperationalExecution,
  routeIndex?: NeuralCoreOperationalRouteIndex,
): NeuralCoreOperationalRuntimeNarrative => {
  const route = event.type === "route-transmission" ? routeIndex?.route : undefined;
  return {
    eventId: event.id,
    title: getNarrativeTitle(event, execution, routeIndex),
    message: getNarrativeMessage(event, execution, routeIndex),
    status: mapEventStatus(event),
    ...(event.clusterId ? { clusterId: event.clusterId } : {}),
    ...(route
      ? {
        routeId: route.id,
        sourceClusterId: route.fromClusterId,
        targetClusterId: route.toClusterId,
        routeStatus: mapEventStatus(event),
      }
      : {}),
    ...(event.metrics?.[0] ? { primaryMetric: event.metrics[0] } : {}),
  };
};

const shouldPublishEventNarrative = (event: NeuralCoreOperationalEvent): boolean => {
  if (event.type === "metric-updated") {
    return false;
  }
  if (event.type === "stage-entered" && event.title === "Request accepted") {
    return false;
  }
  if (event.type !== "stage-completed") {
    return true;
  }
  return event.status === "warning"
    || event.title === "Authentication approved"
    || event.title === "Cache hit"
    || event.title === "Persistent context loaded"
    || event.title.includes("External inference completed");
};

const mapRouteIndexes = (
  scenario: NeuralCoreOperationalScenario,
  stagesById: ReadonlyMap<string, NeuralCoreOperationalStage>,
): ReadonlyMap<string, NeuralCoreOperationalRouteIndex> => {
  const sourceStageByRouteId = new Map<string, NeuralCoreOperationalStage>();
  const targetStageByRouteId = new Map<string, NeuralCoreOperationalStage>();
  for (const stage of stagesById.values()) {
    for (const routeId of stage.outgoingRouteIds) {
      sourceStageByRouteId.set(routeId, stage);
    }
    for (const routeId of stage.incomingRouteIds) {
      targetStageByRouteId.set(routeId, stage);
    }
  }
  return new Map(scenario.topology.synapses.map((route) => [
    route.id,
    {
      route,
      ...(sourceStageByRouteId.get(route.id)
        ? { sourceStage: sourceStageByRouteId.get(route.id) }
        : {}),
      ...(targetStageByRouteId.get(route.id)
        ? { targetStage: targetStageByRouteId.get(route.id) }
        : {}),
    },
  ]));
};

const addBoundary = (
  boundaryByTime: Map<number, MutableNeuralCoreOperationalEventBoundary>,
  atMs: number,
): MutableNeuralCoreOperationalEventBoundary => {
  const current = boundaryByTime.get(atMs);
  if (current) {
    return current;
  }
  const boundary: MutableNeuralCoreOperationalEventBoundary = {
    atMs,
    enteringEventIndexes: [],
    exitingEventIndexes: [],
  };
  boundaryByTime.set(atMs, boundary);
  return boundary;
};

const mapEventImpact = (
  event: NeuralCoreOperationalEvent,
  sourceClusterId: string | undefined,
  routesById: ReadonlyMap<string, NeuralCoreOperationalRouteIndex>,
): NeuralCoreOperationalImpactRuntimeState | undefined => {
  if (!event.impact || !sourceClusterId || event.impact.level === "none") {
    return undefined;
  }
  const declaredAffectedClusterIds = new Set(event.impact.affectedClusterIds ?? []);
  const affectedClusterIds = new Set(declaredAffectedClusterIds);
  const affectedRouteIds = new Set<string>();
  for (const [routeId, { route }] of routesById) {
    const isSourceRoute = route.fromClusterId === sourceClusterId
      || route.toClusterId === sourceClusterId;
    if (isSourceRoute) {
      affectedRouteIds.add(routeId);
      if (event.impact.level === "high" || event.impact.level === "critical") {
        affectedClusterIds.add(
          route.fromClusterId === sourceClusterId
            ? route.toClusterId
            : route.fromClusterId,
        );
      }
      continue;
    }
    if (
      declaredAffectedClusterIds.has(route.fromClusterId)
      || declaredAffectedClusterIds.has(route.toClusterId)
    ) {
      affectedRouteIds.add(routeId);
    }
  }
  return {
    sourceEventId: event.id,
    sourceClusterId,
    level: event.impact.level,
    affectedClusterIds: [...affectedClusterIds],
    affectedRouteIds: [...affectedRouteIds],
    ...(event.impact.summary ? { summary: event.impact.summary } : {}),
  };
};

export const createNeuralCoreOperationalExecutionIndex = (
  execution: NeuralCoreOperationalExecution,
  scenario: NeuralCoreOperationalScenario,
  presentationTimeline: NeuralCoreOperationalPresentationTimeline,
): NeuralCoreOperationalExecutionIndex => {
  const stagesById = new Map(scenario.stages.map((stage) => [stage.id, stage]));
  const clustersById = new Map(scenario.topology.clusters.map((cluster) => [
    cluster.id,
    cluster,
  ]));
  const routesById = mapRouteIndexes(scenario, stagesById);
  const eventsById = new Map<string, NeuralCoreOperationalEvent>();
  const eventIndexById = new Map<string, number>();
  const eventsByStageId = new Map<string, NeuralCoreOperationalEvent[]>();
  const eventsByClusterId = new Map<string, NeuralCoreOperationalEvent[]>();
  const eventsByRouteId = new Map<string, NeuralCoreOperationalEvent[]>();
  const resolvedClusterIdByEventIndex: Array<string | undefined> = [];
  const resolvedRouteIdByEventIndex: Array<string | undefined> = [];
  const presentationEventByEventIndex: NeuralCoreOperationalPresentationEvent[] = [];
  const impactByEventIndex: Array<NeuralCoreOperationalImpactRuntimeState | undefined> = [];
  const narrativeByEventIndex: NeuralCoreOperationalRuntimeNarrative[] = [];
  const publishesNarrativeByEventIndex: boolean[] = [];
  const boundaryByTime = new Map<number, MutableNeuralCoreOperationalEventBoundary>();
  const totalDurationMs = Number.isFinite(presentationTimeline.totalPresentationDurationMs)
    ? Math.max(0, presentationTimeline.totalPresentationDurationMs)
    : 0;
  const operationalDurationMs = Number.isFinite(execution.outcome.totalDurationMs)
    ? Math.max(0, execution.outcome.totalDurationMs)
    : 0;
  const presentationEventBySourceId = new Map(
    presentationTimeline.events.map((event) => [event.sourceEventId, event]),
  );
  addBoundary(boundaryByTime, totalDurationMs);

  execution.events.forEach((event, eventIndex): void => {
    const clusterId = event.clusterId
      ?? (event.stageId ? stagesById.get(event.stageId)?.clusterId : undefined);
    const stage = event.stageId ? stagesById.get(event.stageId) : undefined;
    const routeId = event.routeId ?? (
      event.type === "warning-raised"
      || event.type === "failure-raised"
      || event.type === "retry-started"
      || event.type === "component-recovered"
        ? stage?.incomingRouteIds[0]
        : undefined
    );
    const presentationEvent = presentationEventBySourceId.get(event.id) ?? {
      sourceEventId: event.id,
      presentationAtMs: 0,
      presentationDurationMs: 0,
      sourceAtMs: event.atMs,
      ...(event.durationMs === undefined ? {} : { sourceDurationMs: event.durationMs }),
    };
    const startMs = clampNeuralCoreOperationalRuntimeValue(
      presentationEvent.presentationAtMs,
      0,
      totalDurationMs,
    );
    const endMs = clampNeuralCoreOperationalRuntimeValue(
      presentationEvent.presentationAtMs + presentationEvent.presentationDurationMs,
      0,
      totalDurationMs,
    );
    eventsById.set(event.id, event);
    eventIndexById.set(event.id, eventIndex);
    appendToLookup(eventsByStageId, event.stageId, event);
    appendToLookup(eventsByClusterId, clusterId, event);
    appendToLookup(eventsByRouteId, routeId, event);
    resolvedClusterIdByEventIndex[eventIndex] = clusterId;
    resolvedRouteIdByEventIndex[eventIndex] = routeId;
    presentationEventByEventIndex[eventIndex] = presentationEvent;
    impactByEventIndex[eventIndex] = mapEventImpact(event, clusterId, routesById);
    narrativeByEventIndex[eventIndex] = mapEventNarrative(
      event,
      execution,
      routeId ? routesById.get(routeId) : undefined,
    );
    publishesNarrativeByEventIndex[eventIndex] = shouldPublishEventNarrative(event);
    addBoundary(boundaryByTime, startMs).enteringEventIndexes.push(eventIndex);
    if (endMs > startMs) {
      addBoundary(boundaryByTime, endMs).exitingEventIndexes.push(eventIndex);
    }
  });

  const boundaries = [...boundaryByTime.values()]
    .sort((left, right) => left.atMs - right.atMs)
    .map((boundary): NeuralCoreOperationalEventBoundary => ({
      atMs: boundary.atMs,
      enteringEventIndexes: boundary.enteringEventIndexes,
      exitingEventIndexes: boundary.exitingEventIndexes,
    }));
  return {
    execution,
    events: execution.events,
    eventsById,
    eventIndexById,
    stagesById,
    clustersById,
    routesById,
    eventsByStageId,
    eventsByClusterId,
    eventsByRouteId,
    resolvedClusterIdByEventIndex,
    resolvedRouteIdByEventIndex,
    presentationEventByEventIndex,
    impactByEventIndex,
    narrativeByEventIndex,
    publishesNarrativeByEventIndex,
    boundaries,
    totalDurationMs,
    operationalDurationMs,
    presentationTimeline,
  };
};
