import { useCallback, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";

import {
  applyNeuralCoreLodLimits,
  mapNeuralCoreLodState,
} from "../../visualization/lod/neural-core-lod.mapper";
import { NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL } from "../../visualization/lod/neural-core-lod.constants";
import type {
  NeuralCoreClusterLodState,
  NeuralCoreLodState,
} from "../../visualization/lod/neural-core-lod.types";
import {
  NEURAL_CORE_CLUSTER_LABEL_CAMERA_EPSILON,
  NEURAL_CORE_CLUSTER_LABEL_LAYOUT_RATE_HZ,
  NEURAL_CORE_CLUSTER_LABEL_NETWORK_TRANSFORM_EPSILON,
} from "../../visualization/labels/neural-core-cluster-label.constants";
import { mapNeuralCoreClusterLabelModels } from "../../visualization/labels/neural-core-cluster-label.mapper";
import type {
  NeuralCoreClusterLabelModel,
  NeuralCoreClusterLabelVisualRuntime,
} from "../../visualization/labels/neural-core-cluster-label.types";
import { resolveNeuralCoreClusterLabelPriorityContext } from "../../visualization/labels/neural-core-cluster-label.utils";
import { mapNeuralCoreClusterLabelLayout } from "../../visualization/labels/neural-core-label-layout.mapper";
import type {
  NeuralCoreClusterLabelPlacement,
  NeuralCoreClusterLabelScreenCandidate,
  NeuralCoreLabelRect,
} from "../../visualization/labels/neural-core-label-layout.types";
import {
  getNeuralCoreClusterLabelDimensions,
} from "../../visualization/labels/neural-core-label-layout.utils";
import type {
  AdvanceNeuralCoreClusterLabelsParams,
  UseNeuralCoreClusterLabelsParams,
  UseNeuralCoreClusterLabelsResult,
} from "./use-neural-core-cluster-labels.types";

interface NeuralCoreClusterLabelRuntime {
  model: NeuralCoreClusterLabelModel;
  localPosition: readonly [number, number, number];
  projectedPosition: Vector3;
  placement?: NeuralCoreClusterLabelPlacement;
  retainedPlacement?: NeuralCoreClusterLabelPlacement;
  lastVisibleSeconds: number;
  lastSeenSeconds: number;
  visual: NeuralCoreClusterLabelVisualRuntime & {
    currentLeaderOpacity: number;
    targetLeaderOpacity: number;
  };
  active: boolean;
}

interface NeuralCoreClusterLabelLevelRuntime {
  state: NeuralCoreClusterLodState;
  referenceDistance: number;
}

interface NeuralCoreClusterLabelObserverRuntime {
  mutation?: MutationObserver;
  resize?: ResizeObserver;
}

const createHiddenPlacement = (
  runtime: NeuralCoreClusterLabelRuntime,
): NeuralCoreClusterLabelPlacement => ({
  clusterId: runtime.model.clusterId,
  x: runtime.projectedPosition.x,
  y: runtime.projectedPosition.y,
  anchorX: runtime.projectedPosition.x,
  anchorY: runtime.projectedPosition.y,
  width: 0,
  height: 0,
  visible: false,
  displaced: false,
  opacity: 0,
});

const getModelsSignature = (
  models: readonly NeuralCoreClusterLabelModel[],
): string => JSON.stringify(models.map((model) => ({
  clusterId: model.clusterId,
  level: model.level,
  title: model.title,
  typeLabel: model.typeLabel,
  status: model.status,
  statusLabel: model.statusLabel,
  activity: model.activity,
  formattedActivity: model.formattedActivity,
  metrics: model.metrics.map((metric) => ({
    id: metric.id,
    label: metric.label,
    formattedValue: metric.formattedValue,
  })),
  impactLevel: model.impactLevel,
  impactLabel: model.impactLabel,
  isFocused: model.isFocused,
  isCompact: model.isCompact,
})));

const getLabelContextKey = (
  directionState: AdvanceNeuralCoreClusterLabelsParams["directionState"],
  narrativeState: AdvanceNeuralCoreClusterLabelsParams["narrativeState"],
): string => `${directionState.focusTargetType}:${directionState.focusTargetId ?? "none"}`
  + `:${directionState.targetClusterIds.join(",")}`
  + `:${narrativeState.isActive ? narrativeState.clusterIds.join(",") : "inactive"}`;

const getInspectionKey = (
  params: AdvanceNeuralCoreClusterLabelsParams,
): string => params.interactionMode === "inspection"
  ? `inspection:${params.inspectionFocus.selectedClusterId ?? "overview"}`
    + `:${params.inspectionFocus.relatedClusterIds.join(",")}`
  : getLabelContextKey(params.directionState, params.narrativeState);

const dampVisualValue = (
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number => {
  return target + (current - target) * Math.exp(-damping * Math.max(0, deltaSeconds));
};

const createVisualRuntime = (
  model: NeuralCoreClusterLabelModel,
): NeuralCoreClusterLabelRuntime["visual"] => ({
  currentX: Number.NaN,
  currentY: Number.NaN,
  targetX: 0,
  targetY: 0,
  currentAnchorX: Number.NaN,
  currentAnchorY: Number.NaN,
  targetAnchorX: 0,
  targetAnchorY: 0,
  currentOpacity: 0,
  targetOpacity: 0,
  currentScale: 0.96,
  targetScale: 0.96,
  currentWidth: 0,
  currentHeight: 0,
  targetWidth: 0,
  targetHeight: 0,
  currentLeaderEndX: Number.NaN,
  currentLeaderEndY: Number.NaN,
  targetLeaderEndX: 0,
  targetLeaderEndY: 0,
  currentLeaderOpacity: 0,
  targetLeaderOpacity: 0,
  currentLevel: model.level,
  targetLevel: model.level,
});

export const useNeuralCoreClusterLabels = ({
  config,
  lodConfig,
  runtimeScenarioKey,
  spatialMap,
  topology,
  topologyVisualState,
}: UseNeuralCoreClusterLabelsParams): UseNeuralCoreClusterLabelsResult => {
  const [models, setModels] = useState<readonly NeuralCoreClusterLabelModel[]>([]);
  const configRef = useRef(config);
  const lodConfigRef = useRef(lodConfig);
  const spatialMapRef = useRef(spatialMap);
  const topologyRef = useRef(topology);
  const topologyVisualStateRef = useRef(topologyVisualState);
  configRef.current = config;
  lodConfigRef.current = lodConfig;
  spatialMapRef.current = spatialMap;
  topologyRef.current = topology;
  topologyVisualStateRef.current = topologyVisualState;

  const runtimeByIdRef = useRef(new Map<string, NeuralCoreClusterLabelRuntime>());
  const levelRuntimeByIdRef = useRef(new Map<string, NeuralCoreClusterLabelLevelRuntime>());
  const labelElementByIdRef = useRef(new Map<string, HTMLElement>());
  const leaderLineElementByIdRef = useRef(new Map<string, SVGLineElement>());
  const overlayElementRef = useRef<HTMLDivElement | null>(null);
  const observerRuntimeRef = useRef<NeuralCoreClusterLabelObserverRuntime>({});
  const exclusionsRef = useRef<readonly NeuralCoreLabelRect[]>([]);
  const exclusionMeasurementDirtyRef = useRef(true);
  const layoutDirtyRef = useRef(true);
  const lastLayoutSecondsRef = useRef(Number.NEGATIVE_INFINITY);
  const lastViewportRef = useRef({ width: 0, height: 0 });
  const lastDirectionKeyRef = useRef("");
  const lastCameraMatrixRef = useRef<number[]>(new Array(16).fill(Number.NaN));
  const lastNetworkMatrixRef = useRef(new Float64Array(16).fill(Number.NaN));
  const lastNetworkAvailableRef = useRef(false);
  const modelsSignatureRef = useRef("");

  const disconnectObservers = useCallback((): void => {
    observerRuntimeRef.current.mutation?.disconnect();
    observerRuntimeRef.current.resize?.disconnect();
    observerRuntimeRef.current = {};
  }, []);

  const registerOverlayElement = useCallback((element: HTMLDivElement | null): void => {
    disconnectObservers();
    overlayElementRef.current = element;
    exclusionMeasurementDirtyRef.current = true;
    layoutDirtyRef.current = true;
    if (!element) {
      return;
    }
    const boundary = element.closest<HTMLElement>("[data-neural-core-label-boundary]")
      ?? element.parentElement;
    if (!boundary) {
      return;
    }
    if (typeof MutationObserver !== "undefined") {
      const mutation = new MutationObserver(() => {
        exclusionMeasurementDirtyRef.current = true;
        layoutDirtyRef.current = true;
      });
      mutation.observe(boundary, { childList: true, subtree: true });
      observerRuntimeRef.current.mutation = mutation;
    }
    if (typeof ResizeObserver !== "undefined") {
      const resize = new ResizeObserver(() => {
        exclusionMeasurementDirtyRef.current = true;
        layoutDirtyRef.current = true;
      });
      resize.observe(boundary);
      resize.observe(element);
      observerRuntimeRef.current.resize = resize;
    }
  }, [disconnectObservers]);

  const registerLabelElement = useCallback((
    clusterId: string,
    element: HTMLElement | null,
  ): void => {
    if (element) {
      labelElementByIdRef.current.set(clusterId, element);
    } else {
      labelElementByIdRef.current.delete(clusterId);
    }
  }, []);

  const registerLeaderLineElement = useCallback((
    clusterId: string,
    element: SVGLineElement | null,
  ): void => {
    if (element) {
      leaderLineElementByIdRef.current.set(clusterId, element);
    } else {
      leaderLineElementByIdRef.current.delete(clusterId);
    }
  }, []);

  useEffect(() => {
    layoutDirtyRef.current = true;
    if (!config.enabled) {
      runtimeByIdRef.current.clear();
      levelRuntimeByIdRef.current.clear();
      modelsSignatureRef.current = "[]";
      setModels([]);
      for (const element of labelElementByIdRef.current.values()) {
        element.style.visibility = "hidden";
        element.style.opacity = "0";
      }
      for (const element of leaderLineElementByIdRef.current.values()) {
        element.style.opacity = "0";
      }
    }
  }, [config, lodConfig, spatialMap, topology, topologyVisualState]);

  useEffect(() => {
    runtimeByIdRef.current.clear();
    levelRuntimeByIdRef.current.clear();
    lastDirectionKeyRef.current = "";
    modelsSignatureRef.current = "";
    lastLayoutSecondsRef.current = Number.NEGATIVE_INFINITY;
    exclusionMeasurementDirtyRef.current = true;
    layoutDirtyRef.current = true;
    setModels([]);
  }, [runtimeScenarioKey]);

  useEffect(() => disconnectObservers, [disconnectObservers]);

  const measureExclusions = useCallback((): void => {
    const overlay = overlayElementRef.current;
    if (!overlay || !exclusionMeasurementDirtyRef.current) {
      return;
    }
    exclusionMeasurementDirtyRef.current = false;
    const overlayRect = overlay.getBoundingClientRect();
    const boundary = overlay.closest<HTMLElement>("[data-neural-core-label-boundary]")
      ?? overlay.parentElement;
    if (!boundary) {
      exclusionsRef.current = [];
      return;
    }
    const exclusions: NeuralCoreLabelRect[] = [];
    for (const element of boundary.querySelectorAll<HTMLElement>(
      "[data-neural-core-label-exclusion]",
    )) {
      if (element === overlay || element.offsetParent === null) {
        continue;
      }
      const rect = element.getBoundingClientRect();
      const numericRect = {
        x: rect.left - overlayRect.left,
        y: rect.top - overlayRect.top,
        width: rect.width,
        height: rect.height,
      };
      if (
        numericRect.x < overlayRect.width
        && numericRect.y < overlayRect.height
        && numericRect.x + numericRect.width > 0
        && numericRect.y + numericRect.height > 0
      ) {
        exclusions.push(numericRect);
        observerRuntimeRef.current.resize?.observe(element);
      }
    }
    exclusionsRef.current = exclusions;
  }, []);

  const stabilizeLodState = useCallback((
    lodState: NeuralCoreLodState,
    protagonistClusterId?: string,
  ): NeuralCoreLodState => {
    const hysteresis = configRef.current.visibility.levelHysteresisDistance;
    const hasFocusedCluster = lodState.clusters.some((cluster) => cluster.isFocused);
    const clusters = lodState.clusters.map((cluster): NeuralCoreClusterLodState => {
      const previous = levelRuntimeByIdRef.current.get(cluster.clusterId);
      const canRetain = !hasFocusedCluster
        && !cluster.isFocused
        && previous
        && previous.state.level !== cluster.level
        && Math.abs(cluster.distanceToCamera - previous.referenceDistance) < hysteresis;
      if (canRetain) {
        return {
          ...cluster,
          level: previous.state.level,
          visibility: { ...NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL[previous.state.level] },
        };
      }
      levelRuntimeByIdRef.current.set(cluster.clusterId, {
        state: cluster,
        referenceDistance: cluster.distanceToCamera,
      });
      return cluster;
    });
    return applyNeuralCoreLodLimits({
      lodState: { ...lodState, clusters },
      protagonistClusterId,
      config: lodConfigRef.current,
    });
  }, []);

  const projectRuntime = useCallback((
    runtime: NeuralCoreClusterLabelRuntime,
    params: AdvanceNeuralCoreClusterLabelsParams,
  ): void => {
    const { camera, network, viewport } = params;
    const projected = runtime.projectedPosition;
    projected.set(
      runtime.localPosition[0],
      runtime.localPosition[1],
      runtime.localPosition[2],
    );
    if (network) {
      projected.applyMatrix4(network.matrixWorld);
    }
    projected.project(camera);
    projected.x = (projected.x * 0.5 + 0.5) * viewport.width;
    projected.y = (-projected.y * 0.5 + 0.5) * viewport.height;
  }, []);

  const cameraChanged = useCallback((camera: AdvanceNeuralCoreClusterLabelsParams["camera"]): boolean => {
    const elements = camera.matrixWorld.elements;
    const previous = lastCameraMatrixRef.current;
    let maximumDifference = 0;
    for (let index = 0; index < 16; index += 1) {
      maximumDifference = Math.max(maximumDifference, Math.abs(elements[index] - previous[index]));
    }
    return !Number.isFinite(maximumDifference)
      || maximumDifference > NEURAL_CORE_CLUSTER_LABEL_CAMERA_EPSILON;
  }, []);

  const rememberCamera = useCallback((camera: AdvanceNeuralCoreClusterLabelsParams["camera"]): void => {
    const elements = camera.matrixWorld.elements;
    for (let index = 0; index < 16; index += 1) {
      lastCameraMatrixRef.current[index] = elements[index];
    }
  }, []);

  const networkChanged = useCallback((
    network: AdvanceNeuralCoreClusterLabelsParams["network"],
  ): boolean => {
    if (!network) {
      return lastNetworkAvailableRef.current;
    }
    if (!lastNetworkAvailableRef.current) {
      return true;
    }
    const elements = network.matrixWorld.elements;
    const previous = lastNetworkMatrixRef.current;
    let maximumDifference = 0;
    for (let index = 0; index < 16; index += 1) {
      maximumDifference = Math.max(maximumDifference, Math.abs(elements[index] - previous[index]));
    }
    return !Number.isFinite(maximumDifference)
      || maximumDifference > NEURAL_CORE_CLUSTER_LABEL_NETWORK_TRANSFORM_EPSILON;
  }, []);

  const rememberNetwork = useCallback((
    network: AdvanceNeuralCoreClusterLabelsParams["network"],
  ): void => {
    lastNetworkAvailableRef.current = network !== null;
    if (!network) {
      return;
    }
    const elements = network.matrixWorld.elements;
    for (let index = 0; index < 16; index += 1) {
      lastNetworkMatrixRef.current[index] = elements[index];
    }
  }, []);

  const reevaluateLayout = useCallback((
    params: AdvanceNeuralCoreClusterLabelsParams,
    priorityContextChanged: boolean,
  ): void => {
    const currentConfig = configRef.current;
    const topologyValue = topologyRef.current;
    if (!currentConfig.enabled || !lodConfigRef.current.enabled) {
      for (const runtime of runtimeByIdRef.current.values()) {
        runtime.active = false;
        runtime.placement = createHiddenPlacement(runtime);
      }
      if (modelsSignatureRef.current !== "[]") {
        modelsSignatureRef.current = "[]";
        setModels([]);
      }
      return;
    }
    measureExclusions();
    if (priorityContextChanged) {
      levelRuntimeByIdRef.current.clear();
    }
    const presentationContext = resolveNeuralCoreClusterLabelPriorityContext(
      params.directionState,
      params.narrativeState,
    );
    const selectedClusterId = params.interactionMode === "inspection"
      ? params.inspectionFocus.selectedClusterId
      : undefined;
    const focusedClusterIds = selectedClusterId
      ? [selectedClusterId]
      : presentationContext.focusedClusterIds;
    const activeClusterIds = selectedClusterId
      ? [selectedClusterId, ...params.inspectionFocus.relatedClusterIds]
      : presentationContext.activeClusterIds;
    const protagonistClusterId = selectedClusterId
      ?? presentationContext.protagonistClusterId;
    const rawLodState = mapNeuralCoreLodState({
      topology: topologyValue,
      spatialMap: spatialMapRef.current,
      cameraLocalPosition: params.cameraLocalPosition,
      focusedClusterIds,
      protagonistClusterId,
      config: lodConfigRef.current,
    });
    const lodState = stabilizeLodState(rawLodState, protagonistClusterId);
    const nextModels = mapNeuralCoreClusterLabelModels({
      topology: topologyValue,
      lodState,
      focusedClusterIds,
      activeClusterIds,
      compactSelectedClusterId: currentConfig.selectedMode === "compact"
        && params.isContextPanelOpen
        ? selectedClusterId
        : undefined,
      config: currentConfig,
    });
    const activeIds = new Set<string>();
    for (const model of nextModels) {
      activeIds.add(model.clusterId);
      const visualCenter = topologyVisualStateRef.current.lookups
        .clusterRegionById[model.clusterId]?.center;
      const anchorPosition = spatialMapRef.current.anchors.find((anchor) => {
        return anchor.clusterId === model.clusterId;
      })?.normalizedPosition;
      const localPosition = visualCenter ?? anchorPosition;
      if (!localPosition) {
        continue;
      }
      let runtime = runtimeByIdRef.current.get(model.clusterId);
      if (!runtime) {
        runtime = {
          model,
          localPosition: [...localPosition],
          projectedPosition: new Vector3(),
          lastVisibleSeconds: Number.NEGATIVE_INFINITY,
          lastSeenSeconds: params.elapsedSeconds,
          visual: createVisualRuntime(model),
          active: true,
        };
        runtimeByIdRef.current.set(model.clusterId, runtime);
      }
      runtime.model = model;
      runtime.visual.targetLevel = model.level;
      runtime.localPosition = [...localPosition];
      runtime.lastSeenSeconds = params.elapsedSeconds;
      runtime.active = true;
      projectRuntime(runtime, params);
    }
    for (const runtime of runtimeByIdRef.current.values()) {
      if (!activeIds.has(runtime.model.clusterId)) {
        runtime.active = false;
        runtime.placement = createHiddenPlacement(runtime);
      }
    }
    const candidates: NeuralCoreClusterLabelScreenCandidate[] = [];
    const previousPlacements: Record<string, NeuralCoreClusterLabelPlacement> = {};
    for (const runtime of runtimeByIdRef.current.values()) {
      if (!runtime.active) {
        continue;
      }
      const model = runtime.model;
      const dimensions = getNeuralCoreClusterLabelDimensions(model, params.viewport.width);
      const local = runtime.localPosition;
      const cameraLocal = params.cameraLocalPosition;
      const localLength = Math.hypot(local[0], local[1], local[2]);
      const cameraLength = Math.hypot(cameraLocal[0], cameraLocal[1], cameraLocal[2]);
      const facing = localLength <= 0.0001 || cameraLength <= 0.0001
        ? 1
        : (local[0] * cameraLocal[0]
          + local[1] * cameraLocal[1]
          + local[2] * cameraLocal[2]) / (localLength * cameraLength);
      const projected = runtime.projectedPosition;
      const ndcX = projected.x / Math.max(1, params.viewport.width) * 2 - 1;
      const ndcY = -(projected.y / Math.max(1, params.viewport.height) * 2 - 1);
      candidates.push({
        clusterId: model.clusterId,
        level: model.level,
        anchorX: projected.x,
        anchorY: projected.y,
        depth: projected.z,
        width: dimensions.width,
        height: dimensions.height,
        priority: model.priority,
        importance: model.importance,
        activity: model.activity ?? 0,
        distanceToCamera: model.distanceToCamera,
        isFocused: model.isFocused,
        isCritical: model.isCritical,
        isActive: model.isActive,
        isWarning: model.status === "warning",
        isRearFacing: facing < currentConfig.visibility.rearFacingThreshold,
        isAnchorOnScreen: ndcX >= -1 && ndcX <= 1
          && ndcY >= -1 && ndcY <= 1
          && projected.z >= -1 && projected.z <= 1,
      });
      if (
        runtime.retainedPlacement
        && params.elapsedSeconds - runtime.lastVisibleSeconds
          <= currentConfig.visibility.layoutRetentionSeconds
      ) {
        previousPlacements[model.clusterId] = runtime.retainedPlacement;
      }
    }
    const placements = mapNeuralCoreClusterLabelLayout({
      candidates,
      viewport: params.viewport,
      exclusions: exclusionsRef.current,
      previousPlacements,
      config: {
        ...currentConfig.layout,
        placementChangePenalty: currentConfig.animation.placementChangePenalty,
        hideRearFacingLabels: currentConfig.visibility.hideRearFacingLabels,
      },
    });
    const placementById = new Map(placements.map((placement) => [placement.clusterId, placement]));
    for (const runtime of runtimeByIdRef.current.values()) {
      if (!runtime.active) {
        continue;
      }
      const placement = placementById.get(runtime.model.clusterId)
        ?? createHiddenPlacement(runtime);
      runtime.placement = placement;
      runtime.visual.placementKey = placement.placementKey;
      if (placement.visible) {
        runtime.retainedPlacement = placement;
        runtime.lastVisibleSeconds = params.elapsedSeconds;
      }
    }
    const renderedModels = [...runtimeByIdRef.current.values()]
      .filter((runtime) => runtime.active
        || params.elapsedSeconds - runtime.lastSeenSeconds
          <= currentConfig.visibility.layoutRetentionSeconds)
      .map((runtime) => runtime.model)
      .sort((left, right) => left.clusterId.localeCompare(right.clusterId));
    const signature = getModelsSignature(renderedModels);
    if (signature !== modelsSignatureRef.current) {
      modelsSignatureRef.current = signature;
      setModels(renderedModels);
    }
    for (const [clusterId, runtime] of runtimeByIdRef.current) {
      if (
        !runtime.active
        && runtime.visual.currentOpacity <= 0.005
        && params.elapsedSeconds - runtime.lastSeenSeconds
          > currentConfig.visibility.layoutRetentionSeconds
      ) {
        runtimeByIdRef.current.delete(clusterId);
        levelRuntimeByIdRef.current.delete(clusterId);
      }
    }
  }, [measureExclusions, projectRuntime, stabilizeLodState]);

  const updateVisualElements = useCallback((params: AdvanceNeuralCoreClusterLabelsParams): void => {
    const currentConfig = configRef.current;
    const viewportWidth = Math.max(1, params.viewport.width);
    const viewportHeight = Math.max(1, params.viewport.height);
    for (const runtime of runtimeByIdRef.current.values()) {
      projectRuntime(runtime, params);
      const placement = runtime.placement;
      const visual = runtime.visual;
      visual.targetOpacity = placement?.visible && runtime.active
        ? placement.opacity
        : 0;
      if (placement?.visible && runtime.active) {
        runtime.lastVisibleSeconds = params.elapsedSeconds;
      }
      const label = labelElementByIdRef.current.get(runtime.model.clusterId);
      const line = leaderLineElementByIdRef.current.get(runtime.model.clusterId);
      if (!placement || !label) {
        if (line) {
          line.style.opacity = "0";
        }
        continue;
      }
      const offsetX = placement.x - placement.anchorX;
      const offsetY = placement.y - placement.anchorY;
      visual.targetX = Math.min(
        viewportWidth - currentConfig.layout.viewportPaddingPx - placement.width,
        Math.max(currentConfig.layout.viewportPaddingPx, runtime.projectedPosition.x + offsetX),
      );
      visual.targetY = Math.min(
        viewportHeight - currentConfig.layout.viewportPaddingPx - placement.height,
        Math.max(currentConfig.layout.viewportPaddingPx, runtime.projectedPosition.y + offsetY),
      );
      visual.targetAnchorX = runtime.projectedPosition.x;
      visual.targetAnchorY = runtime.projectedPosition.y;
      visual.targetWidth = placement.width;
      visual.targetHeight = placement.height;
      visual.targetScale = visual.targetOpacity > 0
        ? (runtime.model.isFocused ? 1.015 : 1)
        : 0.96;
      visual.targetLeaderEndX = Math.min(
        visual.targetX + visual.targetWidth,
        Math.max(visual.targetX, visual.targetAnchorX),
      );
      visual.targetLeaderEndY = Math.min(
        visual.targetY + visual.targetHeight,
        Math.max(visual.targetY, visual.targetAnchorY),
      );
      visual.targetLeaderOpacity = placement.leaderLine && visual.targetOpacity > 0
        ? visual.targetOpacity * (runtime.model.isFocused ? 0.48 : 0.34)
        : 0;
      if (!Number.isFinite(visual.currentX)) {
        visual.currentX = visual.targetX;
        visual.currentY = visual.targetY;
        visual.currentAnchorX = visual.targetAnchorX;
        visual.currentAnchorY = visual.targetAnchorY;
        visual.currentWidth = visual.targetWidth;
        visual.currentHeight = visual.targetHeight;
        visual.currentLeaderEndX = visual.targetLeaderEndX;
        visual.currentLeaderEndY = visual.targetLeaderEndY;
      }
      const selectedResponse = params.inspectionFocus.selectedClusterId === runtime.model.clusterId
        ? 1.25
        : 1;
      visual.currentX = dampVisualValue(
        visual.currentX,
        visual.targetX,
        currentConfig.animation.positionDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentY = dampVisualValue(
        visual.currentY,
        visual.targetY,
        currentConfig.animation.positionDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentAnchorX = dampVisualValue(
        visual.currentAnchorX,
        visual.targetAnchorX,
        currentConfig.animation.leaderLineDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentAnchorY = dampVisualValue(
        visual.currentAnchorY,
        visual.targetAnchorY,
        currentConfig.animation.leaderLineDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentOpacity = dampVisualValue(
        visual.currentOpacity,
        visual.targetOpacity,
        currentConfig.animation.opacityDamping,
        params.deltaSeconds,
      );
      visual.currentScale = dampVisualValue(
        visual.currentScale,
        visual.targetScale,
        currentConfig.animation.scaleDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentWidth = dampVisualValue(
        visual.currentWidth,
        visual.targetWidth,
        currentConfig.animation.scaleDamping,
        params.deltaSeconds,
      );
      visual.currentHeight = dampVisualValue(
        visual.currentHeight,
        visual.targetHeight,
        currentConfig.animation.scaleDamping,
        params.deltaSeconds,
      );
      visual.currentLeaderEndX = dampVisualValue(
        visual.currentLeaderEndX,
        visual.targetLeaderEndX,
        currentConfig.animation.leaderLineDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentLeaderEndY = dampVisualValue(
        visual.currentLeaderEndY,
        visual.targetLeaderEndY,
        currentConfig.animation.leaderLineDamping * selectedResponse,
        params.deltaSeconds,
      );
      visual.currentLeaderOpacity = dampVisualValue(
        visual.currentLeaderOpacity,
        visual.targetLeaderOpacity,
        currentConfig.animation.opacityDamping,
        params.deltaSeconds,
      );
      if (
        visual.currentLevel !== visual.targetLevel
        && Math.abs(visual.currentWidth - visual.targetWidth) < 0.75
        && Math.abs(visual.currentHeight - visual.targetHeight) < 0.75
      ) {
        visual.currentLevel = visual.targetLevel;
      }
      label.style.width = `${visual.currentWidth}px`;
      label.style.height = `${visual.currentHeight}px`;
      label.style.transform = `translate3d(${visual.currentX}px, ${visual.currentY}px, 0) scale(${visual.currentScale})`;
      label.style.opacity = visual.currentOpacity.toFixed(3);
      label.style.visibility = visual.currentOpacity <= 0.005 && visual.targetOpacity === 0
        ? "hidden"
        : "visible";
      if (!line) {
        continue;
      }
      if (visual.currentLeaderOpacity <= 0.001 && visual.targetLeaderOpacity === 0) {
        if (line) {
          line.style.opacity = "0";
        }
        continue;
      }
      line.setAttribute("x1", String(visual.currentAnchorX));
      line.setAttribute("y1", String(visual.currentAnchorY));
      line.setAttribute("x2", String(visual.currentLeaderEndX));
      line.setAttribute("y2", String(visual.currentLeaderEndY));
      line.style.opacity = visual.currentLeaderOpacity.toFixed(3);
    }
  }, [projectRuntime]);

  const advance = useCallback((params: AdvanceNeuralCoreClusterLabelsParams): void => {
    if (!configRef.current.enabled) {
      return;
    }
    params.camera.updateMatrixWorld(true);
    params.network?.updateWorldMatrix(true, false);
    const viewportChanged = lastViewportRef.current.width !== params.viewport.width
      || lastViewportRef.current.height !== params.viewport.height;
    const directionKey = getInspectionKey(params);
    const directionChanged = lastDirectionKeyRef.current !== directionKey;
    const hasCameraChanged = cameraChanged(params.camera);
    const hasNetworkChanged = networkChanged(params.network);
    const layoutInterval = 1 / NEURAL_CORE_CLUSTER_LABEL_LAYOUT_RATE_HZ;
    const layoutDue = params.elapsedSeconds - lastLayoutSecondsRef.current >= layoutInterval;
    if (
      layoutDue
      && (layoutDirtyRef.current
        || exclusionMeasurementDirtyRef.current
        || viewportChanged
        || directionChanged
        || hasCameraChanged
        || hasNetworkChanged)
    ) {
      reevaluateLayout(params, directionChanged);
      lastLayoutSecondsRef.current = params.elapsedSeconds;
      lastViewportRef.current = { ...params.viewport };
      lastDirectionKeyRef.current = directionKey;
      rememberCamera(params.camera);
      rememberNetwork(params.network);
      layoutDirtyRef.current = false;
    }
    updateVisualElements(params);
  }, [
    cameraChanged,
    networkChanged,
    reevaluateLayout,
    rememberCamera,
    rememberNetwork,
    updateVisualElements,
  ]);

  return {
    models,
    advance,
    registerLabelElement,
    registerLeaderLineElement,
    registerOverlayElement,
  };
};
