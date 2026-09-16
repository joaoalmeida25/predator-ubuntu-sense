import type {
  NeuralCoreOperationalEvent,
} from "../types/neural-core-operational-event.types";
import type { NeuralCoreOperationalMetric } from "../types/neural-core-operational-metric.types";
import type {
  NeuralCoreOperationalClusterRuntimeState,
  NeuralCoreOperationalEventBoundary,
  NeuralCoreOperationalEventCursor,
  NeuralCoreOperationalExecutionIndex,
  NeuralCoreOperationalImpactRuntimeState,
  NeuralCoreOperationalRetryRuntimeState,
  NeuralCoreOperationalRuntimeSnapshot,
  NeuralCoreOperationalRuntimeStatus,
} from "./neural-core-operational-runtime.types";

const EMPTY_OPERATIONAL_IDS: readonly string[] = [];
const EMPTY_OPERATIONAL_METRICS: readonly NeuralCoreOperationalMetric[] = [];

export interface NeuralCoreOperationalRuntimeAccumulator {
  snapshot: NeuralCoreOperationalRuntimeSnapshot;
  completedStageIdSet: Set<string>;
  completedClusterIdSet: Set<string>;
  completedStatusByClusterId: Map<
    string,
    NeuralCoreOperationalClusterRuntimeState["status"]
  >;
  latestEventIndexByClusterId: Map<string, number>;
  latestStageEventIndex?: number;
  activeRouteEventIndex?: number;
  activeImpactEventIndex?: number;
  recoveringRelatedClusterIdSet: Set<string>;
}

export interface AdvanceNeuralCoreOperationalRuntimeBoundaryParams {
  accumulator: NeuralCoreOperationalRuntimeAccumulator;
  boundary: NeuralCoreOperationalEventBoundary;
  cursor: NeuralCoreOperationalEventCursor;
  index: NeuralCoreOperationalExecutionIndex;
  status: NeuralCoreOperationalRuntimeStatus;
}

export interface AdvanceNeuralCoreOperationalRuntimeBoundaryResult {
  changed: boolean;
  snapshot: NeuralCoreOperationalRuntimeSnapshot;
}

const createIdleClusterState = (
  clusterId: string,
): NeuralCoreOperationalClusterRuntimeState => ({
  clusterId,
  status: "idle",
  activity: 0,
  progress: 0,
  isActive: false,
  isCompleted: false,
});

export const createIdleNeuralCoreOperationalRuntimeSnapshot = (
  index: NeuralCoreOperationalExecutionIndex,
): NeuralCoreOperationalRuntimeSnapshot => {
  const clusterStates: Record<string, NeuralCoreOperationalClusterRuntimeState> = {};
  const metricsByClusterId: Record<string, readonly NeuralCoreOperationalMetric[]> = {};
  for (const clusterId of index.clustersById.keys()) {
    clusterStates[clusterId] = createIdleClusterState(clusterId);
    metricsByClusterId[clusterId] = EMPTY_OPERATIONAL_METRICS;
  }
  return {
    executionId: index.execution.id,
    status: "idle",
    isPaused: false,
    totalStageCount: index.execution.outcome.processedStageCount,
    completedStageIds: EMPTY_OPERATIONAL_IDS,
    completedClusterIds: EMPTY_OPERATIONAL_IDS,
    clusterStates,
    metricsByClusterId,
  };
};

export const createNeuralCoreOperationalEventCursor = (): NeuralCoreOperationalEventCursor => ({
  nextBoundaryIndex: 0,
  nextEventIndex: 0,
  activeTimedEventIndexes: [],
  lastElapsedMs: 0,
});

export const createNeuralCoreOperationalRuntimeAccumulator = (
  index: NeuralCoreOperationalExecutionIndex,
): NeuralCoreOperationalRuntimeAccumulator => ({
  snapshot: createIdleNeuralCoreOperationalRuntimeSnapshot(index),
  completedStageIdSet: new Set<string>(),
  completedClusterIdSet: new Set<string>(),
  completedStatusByClusterId: new Map(),
  latestEventIndexByClusterId: new Map<string, number>(),
  recoveringRelatedClusterIdSet: new Set<string>(),
});

const mapEventStatus = (
  event: NeuralCoreOperationalEvent,
): NeuralCoreOperationalClusterRuntimeState["status"] => {
  if (event.type === "stage-completed" || event.type === "response-sent") {
    return event.status === "warning" ? "warning" : "success";
  }
  return event.status;
};

const mapRouteStatus = (
  event: NeuralCoreOperationalEvent | undefined,
): NeuralCoreOperationalRuntimeSnapshot["activeRouteStatus"] => {
  if (!event) {
    return undefined;
  }
  return event.status === "recovering" ? "warning" : event.status;
};

const mergeMetrics = (
  current: readonly NeuralCoreOperationalMetric[],
  incoming: readonly NeuralCoreOperationalMetric[],
): readonly NeuralCoreOperationalMetric[] => {
  if (current.length === 0) {
    return incoming;
  }
  const nextById = new Map(current.map((metric) => [metric.id, metric]));
  let changed = false;
  for (const metric of incoming) {
    if (nextById.get(metric.id) !== metric) {
      nextById.set(metric.id, metric);
      changed = true;
    }
  }
  return changed ? [...nextById.values()] : current;
};

const isOperationalRouteVisualEvent = (
  event: NeuralCoreOperationalEvent | undefined,
): boolean => event?.type === "route-transmission"
  || event?.type === "warning-raised"
  || event?.type === "failure-raised"
  || event?.type === "retry-started";

const resolveLatestActiveRouteEventIndex = (
  cursor: NeuralCoreOperationalEventCursor,
  index: NeuralCoreOperationalExecutionIndex,
): number | undefined => {
  for (
    let cursorIndex = cursor.activeTimedEventIndexes.length - 1;
    cursorIndex >= 0;
    cursorIndex -= 1
  ) {
    const eventIndex = cursor.activeTimedEventIndexes[cursorIndex];
    if (
      isOperationalRouteVisualEvent(index.events[eventIndex])
      && index.resolvedRouteIdByEventIndex[eventIndex]
    ) {
      return eventIndex;
    }
  }
  return undefined;
};

const resolveRuntimeFocus = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
): {
  activeStageId?: string;
  activeClusterId?: string;
  activeRouteId?: string;
  activeRouteEventId?: string;
  activeRouteStatus?: NeuralCoreOperationalRuntimeSnapshot["activeRouteStatus"];
  nextClusterId?: string;
} => {
  const routeEventIndex = accumulator.activeRouteEventIndex;
  const routeEvent = routeEventIndex === undefined
    ? undefined
    : index.events[routeEventIndex];
  const routeId = routeEventIndex === undefined
    ? undefined
    : index.resolvedRouteIdByEventIndex[routeEventIndex];
  const routeIndex = routeId ? index.routesById.get(routeId) : undefined;
  const latestStageEvent = accumulator.latestStageEventIndex === undefined
    ? undefined
    : index.events[accumulator.latestStageEventIndex];
  const latestStageClusterId = accumulator.latestStageEventIndex === undefined
    ? undefined
    : index.resolvedClusterIdByEventIndex[accumulator.latestStageEventIndex];
  const routeEventClusterId = routeEventIndex === undefined
    ? undefined
    : index.resolvedClusterIdByEventIndex[routeEventIndex];
  const routeOwnsFocus = routeEvent?.type === "route-transmission";
  const activeClusterId = routeOwnsFocus
    ? routeIndex?.sourceStage?.clusterId ?? latestStageClusterId
    : routeEventClusterId ?? latestStageClusterId;
  const activeStageId = routeOwnsFocus
    ? routeIndex?.sourceStage?.id ?? latestStageEvent?.stageId
    : routeEvent?.stageId ?? latestStageEvent?.stageId;
  const impactTarget = accumulator.snapshot.impact?.affectedClusterIds.find(
    (clusterId) => clusterId !== activeClusterId,
  );
  const nextClusterId = routeOwnsFocus
    ? routeIndex?.targetStage?.clusterId
    : impactTarget ?? (
      routeIndex?.sourceStage?.clusterId !== activeClusterId
        ? routeIndex?.sourceStage?.clusterId
        : routeIndex?.targetStage?.clusterId
    );
  return {
    ...(activeStageId ? { activeStageId } : {}),
    ...(activeClusterId ? { activeClusterId } : {}),
    ...(routeId ? { activeRouteId: routeId } : {}),
    ...(routeEvent ? { activeRouteEventId: routeEvent.id } : {}),
    ...(routeEvent ? { activeRouteStatus: mapRouteStatus(routeEvent) } : {}),
    ...(nextClusterId ? { nextClusterId } : {}),
  };
};

const isActiveRuntimeStatus = (status: NeuralCoreOperationalRuntimeStatus): boolean => (
  status === "running"
  || status === "paused"
  || status === "failed"
  || status === "recovering"
);

const mapClusterState = (
  clusterId: string,
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
  focus: ReturnType<typeof resolveRuntimeFocus>,
  status: NeuralCoreOperationalRuntimeStatus,
): NeuralCoreOperationalClusterRuntimeState => {
  const isCompleted = accumulator.completedClusterIdSet.has(clusterId);
  const isActive = clusterId === focus.activeClusterId && isActiveRuntimeStatus(status);
  const isNext = clusterId === focus.nextClusterId && clusterId !== focus.activeClusterId;
  const impact = accumulator.snapshot.impact;
  const isImpactSource = impact?.sourceClusterId === clusterId;
  const isAffected = impact?.affectedClusterIds.includes(clusterId) ?? false;
  const latestEventIndex = accumulator.latestEventIndexByClusterId.get(clusterId);
  const latestEvent = latestEventIndex === undefined
    ? undefined
    : index.events[latestEventIndex];
  const latestStatus = latestEvent ? mapEventStatus(latestEvent) : undefined;
  const completedStatus = accumulator.completedStatusByClusterId.get(clusterId)
    ?? "success";
  if (accumulator.recoveringRelatedClusterIdSet.has(clusterId)) {
    return {
      clusterId,
      status: "processing",
      activity: 0.56,
      progress: isCompleted ? 1 : 0,
      isActive,
      isCompleted,
    };
  }
  if (isImpactSource && latestStatus) {
    return {
      clusterId,
      status: latestStatus,
      activity: latestStatus === "error" ? 0.96 : 0.88,
      progress: isCompleted ? 1 : 0,
      isActive,
      isCompleted,
    };
  }
  if (isAffected && !isImpactSource) {
    return {
      clusterId,
      status: latestStatus === "error" ? "error" : "warning",
      activity: isActive ? 0.74 : 0.48,
      progress: isCompleted ? 1 : 0,
      isActive,
      isCompleted,
    };
  }
  if (isActive) {
    return {
      clusterId,
      status: isCompleted
        ? completedStatus
        : latestStatus ?? "processing",
      activity: isCompleted ? 0.58 : 0.88,
      progress: isCompleted ? 1 : 0,
      isActive: true,
      isCompleted,
    };
  }
  if (
    latestStatus === "error"
    || latestStatus === "recovering"
    || latestStatus === "warning"
  ) {
    return {
      clusterId,
      status: latestStatus,
      activity: latestStatus === "error" ? 0.86 : 0.58,
      progress: isCompleted ? 1 : 0,
      isActive: false,
      isCompleted,
    };
  }
  if (isCompleted) {
    return {
      clusterId,
      status: completedStatus,
      activity: completedStatus === "warning" ? 0.5 : 0.42,
      progress: 1,
      isActive: false,
      isCompleted: true,
    };
  }
  if (isNext) {
    return {
      clusterId,
      status: "idle",
      activity: 0.28,
      progress: 0,
      isActive: false,
      isCompleted: false,
    };
  }
  return createIdleClusterState(clusterId);
};

const addImpactClusterIds = (
  target: Set<string>,
  impact: NeuralCoreOperationalImpactRuntimeState | undefined,
): void => {
  if (!impact) {
    return;
  }
  target.add(impact.sourceClusterId);
  for (const clusterId of impact.affectedClusterIds) {
    target.add(clusterId);
  }
};

const updateImpactedClusterStates = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
  previousFocus: ReturnType<typeof resolveRuntimeFocus>,
  nextFocus: ReturnType<typeof resolveRuntimeFocus>,
  directlyImpactedClusterIds: ReadonlySet<string>,
  previousImpact: NeuralCoreOperationalImpactRuntimeState | undefined,
  status: NeuralCoreOperationalRuntimeStatus,
): boolean => {
  const impactedClusterIds = new Set<string>(directlyImpactedClusterIds);
  if (previousFocus.activeClusterId) impactedClusterIds.add(previousFocus.activeClusterId);
  if (previousFocus.nextClusterId) impactedClusterIds.add(previousFocus.nextClusterId);
  if (nextFocus.activeClusterId) impactedClusterIds.add(nextFocus.activeClusterId);
  if (nextFocus.nextClusterId) impactedClusterIds.add(nextFocus.nextClusterId);
  addImpactClusterIds(impactedClusterIds, previousImpact);
  addImpactClusterIds(impactedClusterIds, accumulator.snapshot.impact);
  if (impactedClusterIds.size === 0) {
    return false;
  }
  let nextClusterStates = accumulator.snapshot.clusterStates;
  let changed = false;
  for (const clusterId of impactedClusterIds) {
    const current = nextClusterStates[clusterId];
    if (!current) {
      continue;
    }
    const next = mapClusterState(clusterId, accumulator, index, nextFocus, status);
    if (
      current.status === next.status
      && current.activity === next.activity
      && current.progress === next.progress
      && current.isActive === next.isActive
      && current.isCompleted === next.isCompleted
    ) {
      continue;
    }
    if (!changed) {
      nextClusterStates = { ...nextClusterStates };
      changed = true;
    }
    (nextClusterStates as Record<string, NeuralCoreOperationalClusterRuntimeState>)[
      clusterId
    ] = next;
  }
  if (changed) {
    accumulator.snapshot = {
      ...accumulator.snapshot,
      clusterStates: nextClusterStates,
    };
  }
  return changed;
};

const updateMetrics = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  clusterId: string,
  metrics: readonly NeuralCoreOperationalMetric[],
): boolean => {
  const current = accumulator.snapshot.metricsByClusterId[clusterId]
    ?? EMPTY_OPERATIONAL_METRICS;
  const next = mergeMetrics(current, metrics);
  if (next === current) {
    return false;
  }
  accumulator.snapshot = {
    ...accumulator.snapshot,
    metricsByClusterId: {
      ...accumulator.snapshot.metricsByClusterId,
      [clusterId]: next,
    },
  };
  return true;
};

const updateRetry = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
  event: NeuralCoreOperationalEvent,
  clusterId: string | undefined,
): boolean => {
  if (!clusterId) {
    return false;
  }
  let retry: NeuralCoreOperationalRetryRuntimeState | undefined;
  if (event.type === "failure-raised") {
    const attemptValue = event.metadata?.attempt;
    const attempt = typeof attemptValue === "number" && Number.isFinite(attemptValue)
      ? Math.max(1, Math.trunc(attemptValue))
      : 1;
    retry = {
      eventId: event.id,
      clusterId,
      attempt,
      maximumAttempts: Math.max(attempt, index.execution.outcome.retryCount + 1),
      status: "failed",
      reason: event.title,
    };
  } else if ((event.type === "retry-scheduled" || event.type === "retry-started") && event.retry) {
    retry = {
      eventId: event.id,
      clusterId,
      attempt: event.retry.attempt,
      maximumAttempts: event.retry.maximumAttempts,
      status: event.type === "retry-scheduled" ? "scheduled" : "running",
      ...(event.retry.reason ? { reason: event.retry.reason } : {}),
    };
  } else if (event.type === "component-recovered" && accumulator.snapshot.retry) {
    retry = {
      ...accumulator.snapshot.retry,
      eventId: event.id,
      status: "succeeded",
    };
  } else {
    return false;
  }
  accumulator.snapshot = { ...accumulator.snapshot, retry };
  return true;
};

const clearImpact = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
): void => {
  const { impact: _impact, ...snapshot } = accumulator.snapshot;
  accumulator.snapshot = snapshot;
};

const publishSnapshot = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
  focus: ReturnType<typeof resolveRuntimeFocus>,
  status: NeuralCoreOperationalRuntimeStatus,
  isPaused = accumulator.snapshot.isPaused,
): NeuralCoreOperationalRuntimeSnapshot => {
  const previous = accumulator.snapshot;
  const snapshot: NeuralCoreOperationalRuntimeSnapshot = {
    executionId: index.execution.id,
    status,
    isPaused,
    totalStageCount: previous.totalStageCount,
    ...(previous.activeEventId ? { activeEventId: previous.activeEventId } : {}),
    ...focus,
    completedStageIds: previous.completedStageIds,
    completedClusterIds: previous.completedClusterIds,
    clusterStates: previous.clusterStates,
    metricsByClusterId: previous.metricsByClusterId,
    ...(previous.narrative ? { narrative: previous.narrative } : {}),
    ...(previous.retry ? { retry: previous.retry } : {}),
    ...(previous.impact ? { impact: previous.impact } : {}),
    ...(status === "completed" ? { outcome: index.execution.outcome } : {}),
  };
  accumulator.snapshot = snapshot;
  return snapshot;
};

export const resolveNeuralCoreOperationalRuntimeBoundaryStatus = (
  currentStatus: NeuralCoreOperationalRuntimeStatus,
  boundary: NeuralCoreOperationalEventBoundary,
  index: NeuralCoreOperationalExecutionIndex,
): NeuralCoreOperationalRuntimeStatus => {
  let status = currentStatus === "idle" || currentStatus === "paused"
    ? "running"
    : currentStatus;
  for (const eventIndex of boundary.enteringEventIndexes) {
    const event = index.events[eventIndex];
    if (event?.type === "failure-raised") {
      status = "failed";
    } else if (
      event?.type === "retry-scheduled"
      || event?.type === "retry-started"
      || event?.type === "component-recovered"
    ) {
      status = "recovering";
    } else if (
      status === "recovering"
      && (
        event?.type === "stage-completed"
        || event?.type === "route-transmission"
        || event?.type === "response-sent"
      )
    ) {
      status = "running";
    }
  }
  return status;
};

export const advanceNeuralCoreOperationalRuntimeBoundary = ({
  accumulator,
  boundary,
  cursor,
  index,
  status,
}: AdvanceNeuralCoreOperationalRuntimeBoundaryParams): AdvanceNeuralCoreOperationalRuntimeBoundaryResult => {
  const previousFocus = resolveRuntimeFocus(accumulator, index);
  const previousImpact = accumulator.snapshot.impact;
  const directlyImpactedClusterIds = new Set<string>();
  let changed = false;

  if (status === "running" && accumulator.recoveringRelatedClusterIdSet.size > 0) {
    for (const clusterId of accumulator.recoveringRelatedClusterIdSet) {
      directlyImpactedClusterIds.add(clusterId);
    }
    accumulator.recoveringRelatedClusterIdSet.clear();
  }

  for (const eventIndex of boundary.exitingEventIndexes) {
    const activeIndex = cursor.activeTimedEventIndexes.indexOf(eventIndex);
    if (activeIndex >= 0) {
      cursor.activeTimedEventIndexes.splice(activeIndex, 1);
    }
    if (accumulator.activeRouteEventIndex === eventIndex) {
      accumulator.activeRouteEventIndex = undefined;
      changed = true;
    }
    if (accumulator.activeImpactEventIndex === eventIndex) {
      const event = index.events[eventIndex];
      if (event?.type !== "failure-raised") {
        accumulator.activeImpactEventIndex = undefined;
        clearImpact(accumulator);
        changed = true;
      }
    }
  }
  if (accumulator.activeRouteEventIndex === undefined) {
    accumulator.activeRouteEventIndex = resolveLatestActiveRouteEventIndex(cursor, index);
  }

  for (const eventIndex of boundary.enteringEventIndexes) {
    const event = index.events[eventIndex];
    if (!event) {
      continue;
    }
    const clusterId = index.resolvedClusterIdByEventIndex[eventIndex];
    cursor.activeTimedEventIndexes.push(eventIndex);
    cursor.nextEventIndex = Math.max(cursor.nextEventIndex, eventIndex + 1);
    accumulator.snapshot = {
      ...accumulator.snapshot,
      activeEventId: event.id,
      ...(index.publishesNarrativeByEventIndex[eventIndex]
        ? { narrative: index.narrativeByEventIndex[eventIndex] }
        : {}),
    };
    changed = true;
    if (clusterId) {
      directlyImpactedClusterIds.add(clusterId);
      accumulator.latestEventIndexByClusterId.set(clusterId, eventIndex);
      if (event.metrics && event.metrics.length > 0) {
        changed = updateMetrics(accumulator, clusterId, event.metrics) || changed;
      }
    }
    if (event.stageId) {
      accumulator.latestStageEventIndex = eventIndex;
    }
    if (event.type === "stage-completed" && event.stageId) {
      if (!accumulator.completedStageIdSet.has(event.stageId)) {
        accumulator.completedStageIdSet.add(event.stageId);
        accumulator.snapshot = {
          ...accumulator.snapshot,
          completedStageIds: [...accumulator.snapshot.completedStageIds, event.stageId],
        };
      }
      if (clusterId) {
        accumulator.completedStatusByClusterId.set(clusterId, mapEventStatus(event));
        if (!accumulator.completedClusterIdSet.has(clusterId)) {
          accumulator.completedClusterIdSet.add(clusterId);
          accumulator.snapshot = {
            ...accumulator.snapshot,
            completedClusterIds: [...accumulator.snapshot.completedClusterIds, clusterId],
          };
        }
      }
    }
    if (
      isOperationalRouteVisualEvent(event)
      && index.resolvedRouteIdByEventIndex[eventIndex]
    ) {
      accumulator.activeRouteEventIndex = eventIndex;
    }
    if (event.type === "component-recovered" && previousImpact) {
      for (const affectedClusterId of previousImpact.affectedClusterIds) {
        if (affectedClusterId !== previousImpact.sourceClusterId) {
          accumulator.recoveringRelatedClusterIdSet.add(affectedClusterId);
          directlyImpactedClusterIds.add(affectedClusterId);
        }
      }
    }
    if (event.impact?.level === "none" || event.type === "component-recovered") {
      accumulator.activeImpactEventIndex = undefined;
      if (accumulator.snapshot.impact) {
        clearImpact(accumulator);
      }
    } else if (index.impactByEventIndex[eventIndex]) {
      accumulator.activeImpactEventIndex = eventIndex;
      accumulator.snapshot = {
        ...accumulator.snapshot,
        impact: index.impactByEventIndex[eventIndex],
      };
    }
    changed = updateRetry(accumulator, index, event, clusterId) || changed;
  }

  const nextFocus = resolveRuntimeFocus(accumulator, index);
  changed = updateImpactedClusterStates(
    accumulator,
    index,
    previousFocus,
    nextFocus,
    directlyImpactedClusterIds,
    previousImpact,
    status,
  ) || changed;
  cursor.lastElapsedMs = boundary.atMs;
  cursor.nextBoundaryIndex += 1;
  if (!changed && accumulator.snapshot.status === status) {
    return { changed: false, snapshot: accumulator.snapshot };
  }
  return {
    changed: true,
    snapshot: publishSnapshot(accumulator, index, nextFocus, status, false),
  };
};

export const mapNeuralCoreOperationalRuntimeStatus = (
  accumulator: NeuralCoreOperationalRuntimeAccumulator,
  index: NeuralCoreOperationalExecutionIndex,
  status: NeuralCoreOperationalRuntimeStatus,
  isPaused = false,
): NeuralCoreOperationalRuntimeSnapshot => {
  const focus = resolveRuntimeFocus(accumulator, index);
  if (status === "completed") {
    updateImpactedClusterStates(
      accumulator,
      index,
      focus,
      focus,
      new Set(focus.activeClusterId ? [focus.activeClusterId] : []),
      accumulator.snapshot.impact,
      status,
    );
  }
  return publishSnapshot(accumulator, index, focus, status, isPaused);
};
