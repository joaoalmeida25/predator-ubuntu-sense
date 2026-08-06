import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import {
  NEURAL_CORE_OPERATIONAL_RUNTIME_PROGRESS_PROPERTY,
} from "../runtime/neural-core-operational-runtime.constants";
import {
  createNeuralCoreOperationalExecutionIndex,
} from "../runtime/neural-core-operational-runtime.index";
import {
  mapNeuralCoreOperationalPresentationTimeline,
} from "../mappers/neural-core-operational-presentation-timeline.mapper";
import {
  advanceNeuralCoreOperationalRuntimeBoundary,
  createNeuralCoreOperationalEventCursor,
  createNeuralCoreOperationalRuntimeAccumulator,
  mapNeuralCoreOperationalRuntimeStatus,
  resolveNeuralCoreOperationalRuntimeBoundaryStatus,
  type NeuralCoreOperationalRuntimeAccumulator,
} from "../runtime/neural-core-operational-runtime.mapper";
import {
  neuralCoreOperationalRuntimeReducer,
} from "../runtime/neural-core-operational-runtime.reducer";
import type {
  NeuralCoreOperationalEventCursor,
  NeuralCoreOperationalExecutionIndex,
  NeuralCoreOperationalRuntimeSnapshot,
  NeuralCoreOperationalRuntimeStatus,
} from "../runtime/neural-core-operational-runtime.types";
import {
  clampNeuralCoreOperationalRuntimeValue,
  resolveNeuralCoreOperationalRuntimeConfig,
} from "../runtime/neural-core-operational-runtime.utils";
import type {
  UseNeuralCoreOperationalRuntimeParams,
  UseNeuralCoreOperationalRuntimeResult,
} from "./use-neural-core-operational-runtime.types";

const isAdvancingRuntimeStatus = (
  status: NeuralCoreOperationalRuntimeStatus,
): boolean => status === "running" || status === "failed" || status === "recovering";

export const useNeuralCoreOperationalRuntime = ({
  execution,
  scenario,
  config: configInput,
  suspended = false,
  resetKey = "none",
}: UseNeuralCoreOperationalRuntimeParams): UseNeuralCoreOperationalRuntimeResult => {
  const config = useMemo(
    () => resolveNeuralCoreOperationalRuntimeConfig(configInput),
    [configInput],
  );
  const presentationTimeline = useMemo(() => (
    mapNeuralCoreOperationalPresentationTimeline({
      execution,
      config: config.presentationPacing,
    })
  ), [config.presentationPacing, execution]);
  const executionIndex = useMemo(() => createNeuralCoreOperationalExecutionIndex(
    execution,
    scenario,
    presentationTimeline,
  ), [execution, presentationTimeline, scenario]);
  const initialAccumulator = useMemo(
    () => createNeuralCoreOperationalRuntimeAccumulator(executionIndex),
    [executionIndex],
  );
  const initialSnapshot = initialAccumulator.snapshot;
  const initialEventCursor = useMemo(
    () => createNeuralCoreOperationalEventCursor(),
    [executionIndex],
  );
  const [snapshot, dispatch] = useReducer(
    neuralCoreOperationalRuntimeReducer,
    initialSnapshot,
  );
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLOutputElement | null>(null);
  const elapsedMsRef = useRef(0);
  const progressRef = useRef(0);
  const activeRouteProgressRef = useRef(0);
  const lastFrameTimestampRef = useRef(0);
  const runtimeStatusRef = useRef<NeuralCoreOperationalRuntimeStatus>("idle");
  const runtimePausedRef = useRef(false);
  const playbackRateRef = useRef(config.playbackRate);
  const activeEventIndexRef = useRef(-1);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef(false);
  const suspendedRef = useRef(suspended);
  const percentageRef = useRef(-1);
  const tickRef = useRef<(now: number) => void>(() => undefined);
  const executionIndexRef = useRef<NeuralCoreOperationalExecutionIndex>(executionIndex);
  const accumulatorRef = useRef<NeuralCoreOperationalRuntimeAccumulator>(
    initialAccumulator,
  );
  const eventCursorRef = useRef<NeuralCoreOperationalEventCursor>(
    initialEventCursor,
  );
  playbackRateRef.current = config.playbackRate;

  const cancelClock = useCallback((): void => {
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  const writeProgress = useCallback((elapsedMs: number): void => {
    const totalDurationMs = executionIndexRef.current.totalDurationMs;
    const progress = totalDurationMs > 0
      ? clampNeuralCoreOperationalRuntimeValue(elapsedMs / totalDurationMs)
      : 1;
    progressRef.current = progress;
    progressBarRef.current?.style.setProperty(
      NEURAL_CORE_OPERATIONAL_RUNTIME_PROGRESS_PROPERTY,
      String(progress),
    );
    const percentage = Math.round(progress * 100);
    if (percentage === percentageRef.current) {
      return;
    }
    percentageRef.current = percentage;
    progressBarRef.current?.setAttribute("aria-valuenow", String(percentage));
    if (progressLabelRef.current) {
      progressLabelRef.current.value = `${percentage}%`;
      progressLabelRef.current.textContent = `${percentage}%`;
    }
  }, []);

  const writeActiveRouteProgress = useCallback((elapsedMs: number): void => {
    const accumulator = accumulatorRef.current;
    const eventIndex = accumulator.activeRouteEventIndex;
    const presentationEvent = eventIndex === undefined
      ? undefined
      : executionIndexRef.current.presentationEventByEventIndex[eventIndex];
    activeRouteProgressRef.current = presentationEvent
      ? clampNeuralCoreOperationalRuntimeValue(
        (elapsedMs - presentationEvent.presentationAtMs)
          / Math.max(0.001, presentationEvent.presentationDurationMs),
      )
      : 0;
  }, []);

  const writeContinuousValues = useCallback((elapsedMs: number): void => {
    elapsedMsRef.current = elapsedMs;
    writeProgress(elapsedMs);
    writeActiveRouteProgress(elapsedMs);
  }, [writeActiveRouteProgress, writeProgress]);

  const commitSnapshot = useCallback((
    nextSnapshot: NeuralCoreOperationalRuntimeSnapshot,
  ): void => {
    if (mountedRef.current) {
      dispatch({ type: "replace", snapshot: nextSnapshot });
    }
  }, []);

  const advanceBoundary = useCallback((
    boundaryIndex: number,
    status: NeuralCoreOperationalRuntimeStatus,
  ): { changed: boolean; snapshot: NeuralCoreOperationalRuntimeSnapshot } => {
    const index = executionIndexRef.current;
    const boundary = index.boundaries[boundaryIndex];
    if (!boundary) {
      return { changed: false, snapshot: accumulatorRef.current.snapshot };
    }
    const result = advanceNeuralCoreOperationalRuntimeBoundary({
      accumulator: accumulatorRef.current,
      boundary,
      cursor: eventCursorRef.current,
      index,
      status,
    });
    activeEventIndexRef.current = eventCursorRef.current.nextEventIndex - 1;
    writeActiveRouteProgress(boundary.atMs);
    return result;
  }, [writeActiveRouteProgress]);

  const catchUpBoundaries = useCallback((
    elapsedMs: number,
  ): NeuralCoreOperationalRuntimeSnapshot => {
    const index = executionIndexRef.current;
    const cursor = eventCursorRef.current;
    while ((index.boundaries[cursor.nextBoundaryIndex]?.atMs ?? Number.POSITIVE_INFINITY) <= elapsedMs) {
      const boundary = index.boundaries[cursor.nextBoundaryIndex];
      if (!boundary) {
        break;
      }
      if (boundary.atMs >= index.totalDurationMs) {
        runtimeStatusRef.current = "completed";
        advanceBoundary(cursor.nextBoundaryIndex, "completed");
        break;
      }
      const nextStatus = resolveNeuralCoreOperationalRuntimeBoundaryStatus(
        runtimeStatusRef.current,
        boundary,
        index,
      );
      runtimeStatusRef.current = nextStatus;
      advanceBoundary(cursor.nextBoundaryIndex, nextStatus);
    }
    return accumulatorRef.current.snapshot;
  }, [advanceBoundary]);

  const updateElapsedFromTimestamp = useCallback((now: number): number => {
    if (
      !isAdvancingRuntimeStatus(runtimeStatusRef.current)
      || runtimePausedRef.current
      || suspendedRef.current
      || lastFrameTimestampRef.current <= 0
    ) {
      return elapsedMsRef.current;
    }
    const index = executionIndexRef.current;
    const totalDurationMs = index.totalDurationMs;
    const deltaMs = Math.max(0, now - lastFrameTimestampRef.current);
    lastFrameTimestampRef.current = now;
    const elapsedMs = clampNeuralCoreOperationalRuntimeValue(
      elapsedMsRef.current + deltaMs * playbackRateRef.current,
      0,
      totalDurationMs,
    );
    writeContinuousValues(elapsedMs);
    return elapsedMs;
  }, [writeContinuousValues]);

  const scheduleClock = useCallback((): void => {
    if (
      animationFrameRef.current === undefined
      && config.enabled
      && isAdvancingRuntimeStatus(runtimeStatusRef.current)
      && !runtimePausedRef.current
      && !suspendedRef.current
      && mountedRef.current
    ) {
      animationFrameRef.current = requestAnimationFrame(tickRef.current);
    }
  }, [config.enabled]);

  tickRef.current = (now: number): void => {
    animationFrameRef.current = undefined;
    if (
      !mountedRef.current
      || !isAdvancingRuntimeStatus(runtimeStatusRef.current)
      || runtimePausedRef.current
      || suspendedRef.current
    ) {
      return;
    }
    const elapsedMs = updateElapsedFromTimestamp(now);
    const index = executionIndexRef.current;
    const cursor = eventCursorRef.current;
    let boundary = index.boundaries[cursor.nextBoundaryIndex];
    while (boundary && boundary.atMs <= elapsedMs) {
      const completed = boundary.atMs >= index.totalDurationMs;
      if (completed) {
        runtimeStatusRef.current = "completed";
        elapsedMsRef.current = index.totalDurationMs;
        const result = advanceBoundary(cursor.nextBoundaryIndex, "completed");
        commitSnapshot(result.snapshot);
        writeContinuousValues(index.totalDurationMs);
        return;
      }
      const nextStatus = resolveNeuralCoreOperationalRuntimeBoundaryStatus(
        runtimeStatusRef.current,
        boundary,
        index,
      );
      runtimeStatusRef.current = nextStatus;
      const result = advanceBoundary(cursor.nextBoundaryIndex, nextStatus);
      if (result.changed) {
        commitSnapshot(result.snapshot);
        break;
      }
      boundary = index.boundaries[cursor.nextBoundaryIndex];
    }
    scheduleClock();
  };

  const resetRuntime = useCallback((publish: boolean): void => {
    cancelClock();
    const index = executionIndexRef.current;
    const accumulator = createNeuralCoreOperationalRuntimeAccumulator(index);
    accumulatorRef.current = accumulator;
    eventCursorRef.current = createNeuralCoreOperationalEventCursor();
    runtimeStatusRef.current = "idle";
    runtimePausedRef.current = false;
    elapsedMsRef.current = 0;
    progressRef.current = 0;
    activeRouteProgressRef.current = 0;
    activeEventIndexRef.current = -1;
    lastFrameTimestampRef.current = 0;
    percentageRef.current = -1;
    writeContinuousValues(0);
    if (publish) {
      commitSnapshot(accumulator.snapshot);
    }
  }, [cancelClock, commitSnapshot, writeContinuousValues]);

  const restart = useCallback((): void => {
    resetRuntime(true);
  }, [resetRuntime]);

  const run = useCallback((): void => {
    if (!config.enabled) {
      return;
    }
    resetRuntime(false);
    runtimeStatusRef.current = "running";
    runtimePausedRef.current = false;
    const index = executionIndexRef.current;
    const cursor = eventCursorRef.current;
    const initialBoundary = index.boundaries[cursor.nextBoundaryIndex];
    const completesImmediately = index.totalDurationMs <= 0;
    const nextSnapshot = initialBoundary?.atMs === 0
      ? advanceBoundary(
        cursor.nextBoundaryIndex,
        completesImmediately ? "completed" : "running",
      ).snapshot
      : mapNeuralCoreOperationalRuntimeStatus(
        accumulatorRef.current,
        index,
        completesImmediately ? "completed" : "running",
      );
    if (completesImmediately) {
      runtimeStatusRef.current = "completed";
      writeContinuousValues(0);
      commitSnapshot(nextSnapshot);
      return;
    }
    commitSnapshot(nextSnapshot);
    lastFrameTimestampRef.current = performance.now();
    scheduleClock();
  }, [
    advanceBoundary,
    commitSnapshot,
    config.enabled,
    resetRuntime,
    scheduleClock,
    writeContinuousValues,
  ]);

  const pause = useCallback((): void => {
    if (!isAdvancingRuntimeStatus(runtimeStatusRef.current) || runtimePausedRef.current) {
      return;
    }
    const elapsedMs = updateElapsedFromTimestamp(performance.now());
    cancelClock();
    catchUpBoundaries(elapsedMs);
    if (elapsedMs >= executionIndexRef.current.totalDurationMs) {
      runtimeStatusRef.current = "completed";
      writeContinuousValues(executionIndexRef.current.totalDurationMs);
      commitSnapshot(mapNeuralCoreOperationalRuntimeStatus(
        accumulatorRef.current,
        executionIndexRef.current,
        "completed",
      ));
      return;
    }
    runtimePausedRef.current = true;
    lastFrameTimestampRef.current = 0;
    writeActiveRouteProgress(elapsedMs);
    commitSnapshot(mapNeuralCoreOperationalRuntimeStatus(
      accumulatorRef.current,
      executionIndexRef.current,
      runtimeStatusRef.current,
      true,
    ));
  }, [
    cancelClock,
    catchUpBoundaries,
    commitSnapshot,
    updateElapsedFromTimestamp,
    writeActiveRouteProgress,
    writeContinuousValues,
  ]);

  const resume = useCallback((): void => {
    if (!config.enabled || !runtimePausedRef.current) {
      return;
    }
    runtimePausedRef.current = false;
    lastFrameTimestampRef.current = performance.now();
    commitSnapshot(mapNeuralCoreOperationalRuntimeStatus(
      accumulatorRef.current,
      executionIndexRef.current,
      runtimeStatusRef.current,
      false,
    ));
    scheduleClock();
  }, [commitSnapshot, config.enabled, scheduleClock]);

  useEffect(() => {
    mountedRef.current = true;
    return (): void => {
      mountedRef.current = false;
      cancelClock();
    };
  }, [cancelClock]);

  useEffect(() => {
    executionIndexRef.current = executionIndex;
    resetRuntime(true);
  }, [config.enabled, executionIndex, resetKey, resetRuntime]);

  useEffect(() => {
    const wasSuspended = suspendedRef.current;
    if (wasSuspended === suspended) {
      return;
    }
    if (
      suspended
      && isAdvancingRuntimeStatus(runtimeStatusRef.current)
      && !runtimePausedRef.current
    ) {
      const elapsedMs = updateElapsedFromTimestamp(performance.now());
      const caughtUpSnapshot = catchUpBoundaries(elapsedMs);
      cancelClock();
      lastFrameTimestampRef.current = 0;
      if (elapsedMs >= executionIndexRef.current.totalDurationMs) {
        runtimeStatusRef.current = "completed";
        writeContinuousValues(executionIndexRef.current.totalDurationMs);
        commitSnapshot(mapNeuralCoreOperationalRuntimeStatus(
          accumulatorRef.current,
          executionIndexRef.current,
          "completed",
        ));
      } else {
        commitSnapshot(caughtUpSnapshot);
      }
    }
    suspendedRef.current = suspended;
    if (
      !suspended
      && isAdvancingRuntimeStatus(runtimeStatusRef.current)
      && !runtimePausedRef.current
    ) {
      lastFrameTimestampRef.current = performance.now();
      scheduleClock();
    }
  }, [
    cancelClock,
    catchUpBoundaries,
    commitSnapshot,
    scheduleClock,
    suspended,
    updateElapsedFromTimestamp,
    writeContinuousValues,
  ]);

  useEffect(() => {
    if (config.enabled && config.autoStart) {
      run();
    }
  }, [config.autoStart, config.enabled, run]);

  const publishedSnapshot = snapshot.executionId === execution.id
    ? snapshot
    : initialSnapshot;
  const activeRouteEvent = publishedSnapshot.activeRouteEventId
    ? executionIndex.eventsById.get(publishedSnapshot.activeRouteEventId)
    : undefined;
  const activeRoute = publishedSnapshot.activeRouteId
    ? executionIndex.routesById.get(publishedSnapshot.activeRouteId)?.route
    : undefined;
  const activeRoutePresentationEvent = publishedSnapshot.activeRouteEventId
    ? executionIndex.presentationEventByEventIndex[
      executionIndex.eventIndexById.get(publishedSnapshot.activeRouteEventId) ?? -1
    ]
    : undefined;

  return {
    snapshot: publishedSnapshot,
    progressBarRef,
    progressLabelRef,
    elapsedMsRef,
    progressRef,
    activeRouteProgressRef,
    presentationTimeline,
    autoFollowInPresentation: config.autoFollowInPresentation,
    ...(activeRouteEvent ? { activeRouteEvent } : {}),
    ...(activeRoutePresentationEvent ? { activeRoutePresentationEvent } : {}),
    ...(activeRoute ? { activeRoute } : {}),
    run,
    pause,
    resume,
    restart,
  };
};
