import { createOverviewNeuralCoreSceneDirectionState, DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG } from "./neural-core-scene-direction.constants";
import type {
  EvaluateNeuralCoreSceneDirectionParams,
  NeuralCoreSceneCameraTarget,
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionCue,
  NeuralCoreSceneDirectionState,
} from "./neural-core-scene-direction.types";
import {
  applyNeuralCoreSceneDirectionEasing,
  clampNeuralCoreSceneDirectionValue,
  clampNeuralCoreSceneTargetOffset,
  getNeuralCoreDirectionEnvelope,
} from "./neural-core-scene-direction.utils";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import type { NeuralCoreTopologyVisualState } from "../topology/neural-core-topology-visual.types";

const getTimelineSeconds = (
  elapsedSeconds: number,
  durationSeconds: number,
  loop: boolean,
): number => {
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  if (loop) {
    return elapsed % durationSeconds;
  }
  return Math.min(elapsed, durationSeconds);
};

const findActiveCue = (
  cues: readonly NeuralCoreSceneDirectionCue[],
  timelineSeconds: number,
): NeuralCoreSceneDirectionCue | undefined => {
  let activeCue: NeuralCoreSceneDirectionCue | undefined;
  for (const cue of cues) {
    const startSeconds = Math.max(0, Number.isFinite(cue.startSeconds) ? cue.startSeconds : 0);
    const durationSeconds = Math.max(0, Number.isFinite(cue.durationSeconds)
      ? cue.durationSeconds
      : 0);
    const endSeconds = startSeconds + durationSeconds;
    if (
      durationSeconds > 0
      && timelineSeconds >= startSeconds
      && timelineSeconds <= endSeconds
      && (!activeCue || startSeconds >= activeCue.startSeconds)
    ) {
      activeCue = cue;
    }
  }
  return activeCue;
};

const getSynapseMidpoint = (
  topologyVisualState: NeuralCoreTopologyVisualState,
  synapseId: string,
): NeuralCoreVector3 | undefined => {
  const route = topologyVisualState.lookups.synapseRouteById[synapseId];
  if (!route) {
    return undefined;
  }
  const control = route.controlPoints[0] ?? [
    (route.start[0] + route.end[0]) * 0.5,
    (route.start[1] + route.end[1]) * 0.5,
    (route.start[2] + route.end[2]) * 0.5,
  ];
  return [
    route.start[0] * 0.25 + control[0] * 0.5 + route.end[0] * 0.25,
    route.start[1] * 0.25 + control[1] * 0.5 + route.end[1] * 0.25,
    route.start[2] * 0.25 + control[2] * 0.5 + route.end[2] * 0.25,
  ];
};

const getAverageClusterCenter = (
  topologyVisualState: NeuralCoreTopologyVisualState,
  clusterIds: readonly string[],
): NeuralCoreVector3 | undefined => {
  let count = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const clusterId of clusterIds) {
    const region = topologyVisualState.lookups.clusterRegionById[clusterId];
    if (region) {
      x += region.center[0];
      y += region.center[1];
      z += region.center[2];
      count += 1;
    }
  }
  return count > 0 ? [x / count, y / count, z / count] : undefined;
};

const getCueTargetPosition = (
  cue: NeuralCoreSceneDirectionCue,
  topologyVisualState: NeuralCoreTopologyVisualState,
): NeuralCoreVector3 | undefined => {
  const id = cue.target.id;
  switch (cue.target.type) {
    case "overview":
      return [0, 0, 0];
    case "cluster":
      return id ? topologyVisualState.lookups.clusterRegionById[id]?.center : undefined;
    case "synapse":
      return id ? getSynapseMidpoint(topologyVisualState, id) : undefined;
    case "pathway": {
      const pathway = id ? topologyVisualState.lookups.pathwayRouteById[id] : undefined;
      return pathway
        ? getAverageClusterCenter(topologyVisualState, pathway.clusterIds)
        : undefined;
    }
  }
};

const getCameraPosition = (
  target: NeuralCoreVector3,
  camera: NeuralCoreSceneCameraTarget,
  config: NeuralCoreSceneDirectionConfig,
  envelope: number,
): { distance: number; position: NeuralCoreVector3; target: NeuralCoreVector3 } => {
  const configuredTargetOffset = clampNeuralCoreSceneTargetOffset(
    camera.targetOffset,
    config.camera.maximumTargetOffset,
  );
  const targetOffset: NeuralCoreVector3 = [
    configuredTargetOffset[0] * envelope,
    configuredTargetOffset[1] * envelope,
    configuredTargetOffset[2] * envelope,
  ];
  const offsetTarget: NeuralCoreVector3 = [
    target[0] + targetOffset[0],
    target[1] + targetOffset[1],
    target[2] + targetOffset[2],
  ];
  const configuredDistance = clampNeuralCoreSceneDirectionValue(
    camera.distance,
    config.camera.minimumDistance,
    config.camera.maximumDistance,
    config.camera.defaultDistance,
  );
  const distance = config.camera.defaultDistance
    + (configuredDistance - config.camera.defaultDistance) * envelope;
  const azimuth = clampNeuralCoreSceneDirectionValue(
    camera.azimuthOffset,
    -0.28,
    0.28,
    0,
  ) * envelope;
  const elevation = clampNeuralCoreSceneDirectionValue(
    camera.elevationOffset,
    -0.18,
    0.18,
    0,
  ) * envelope;
  const horizontalDistance = Math.cos(elevation) * distance;
  return {
    distance,
    target: offsetTarget,
    position: [
      offsetTarget[0] + Math.sin(azimuth) * horizontalDistance,
      offsetTarget[1] + Math.sin(elevation) * distance,
      offsetTarget[2] + Math.cos(azimuth) * horizontalDistance,
    ],
  };
};

const createCueState = (
  cue: NeuralCoreSceneDirectionCue,
  timelineSeconds: number,
  topologyVisualState: NeuralCoreTopologyVisualState,
  config: NeuralCoreSceneDirectionConfig,
): NeuralCoreSceneDirectionState => {
  const targetPosition = getCueTargetPosition(cue, topologyVisualState);
  if (!targetPosition) {
    return createOverviewNeuralCoreSceneDirectionState(config);
  }
  const cueProgress = clampNeuralCoreSceneDirectionValue(
    (timelineSeconds - cue.startSeconds) / Math.max(0.001, cue.durationSeconds),
    0,
    1,
    0,
  );
  const easing = cue.easing ?? "ease-in-out";
  const transitionProgress = cue.holdAtEnd
    ? applyNeuralCoreSceneDirectionEasing(
      easing,
      clampNeuralCoreSceneDirectionValue(cueProgress / 0.22, 0, 1, 0),
    )
    : getNeuralCoreDirectionEnvelope(cueProgress, easing);
  const camera = getCameraPosition(
    targetPosition,
    cue.camera,
    config,
    transitionProgress,
  );
  const id = cue.target.id;
  const targetClusterIds: string[] = [];
  const neighborClusterIds: string[] = [];
  const targetSynapseIds: string[] = [];
  const relatedSynapseIds: string[] = [];
  const targetPathwayIds: string[] = [];

  if (cue.target.type === "cluster" && id) {
    targetClusterIds.push(id);
    relatedSynapseIds.push(...(topologyVisualState.lookups.synapseIdsByClusterId[id] ?? []));
    neighborClusterIds.push(...(topologyVisualState.lookups.neighborClusterIdsByClusterId[id] ?? []));
  } else if (cue.target.type === "synapse" && id) {
    const route = topologyVisualState.lookups.synapseRouteById[id];
    targetSynapseIds.push(id);
    if (route) {
      neighborClusterIds.push(route.fromClusterId, route.toClusterId);
    }
  } else if (cue.target.type === "pathway" && id) {
    const pathway = topologyVisualState.lookups.pathwayRouteById[id];
    if (pathway) {
      targetPathwayIds.push(id);
      targetClusterIds.push(...pathway.clusterIds);
      targetSynapseIds.push(...pathway.synapseIds);
    }
  }

  return {
    target: camera.target,
    cameraPosition: camera.position,
    cameraDistance: camera.distance,
    focusTargetType: cue.target.type,
    focusTargetId: id,
    targetClusterIds,
    neighborClusterIds,
    targetSynapseIds,
    relatedSynapseIds,
    targetPathwayIds,
    targetEmphasis: clampNeuralCoreSceneDirectionValue(
      cue.focus.targetEmphasis,
      0,
      config.focus.maximumTargetEmphasis,
      config.focus.defaultTargetEmphasis,
    ) * transitionProgress,
    contextDim: clampNeuralCoreSceneDirectionValue(
      cue.focus.contextDim,
      0,
      config.focus.maximumContextDim,
      0,
    ) * transitionProgress,
    routeEmphasis: clampNeuralCoreSceneDirectionValue(
      cue.focus.routeEmphasis,
      0,
      config.focus.maximumTargetEmphasis,
      0,
    ) * transitionProgress,
    clusterFillEmphasis: clampNeuralCoreSceneDirectionValue(
      cue.focus.clusterFillEmphasis,
      0,
      1,
      0,
    ) * transitionProgress,
    peripheralOpacity: 1 - (
      1 - clampNeuralCoreSceneDirectionValue(
        cue.focus.peripheralOpacity,
        config.focus.minimumPeripheralOpacity,
        1,
        1,
      )
    ) * transitionProgress,
    haloIntensity: cue.target.type === "cluster"
      ? clampNeuralCoreSceneDirectionValue(
        cue.focus.haloIntensity,
        0,
        config.focus.maximumHaloIntensity,
        0,
      ) * transitionProgress
      : 0,
    rotationMultiplier: 1 - (
      1 - clampNeuralCoreSceneDirectionValue(
        cue.rotationMultiplier,
        0,
        1,
        cue.target.type === "overview" ? 1 : 0.18,
      )
    ) * transitionProgress,
    transitionProgress,
    isOverview: cue.target.type === "overview",
  };
};

export const evaluateNeuralCoreSceneDirection = ({
  timeline,
  elapsedSeconds,
  topologyVisualState,
  config = DEFAULT_NEURAL_CORE_SCENE_DIRECTION_CONFIG,
}: EvaluateNeuralCoreSceneDirectionParams): NeuralCoreSceneDirectionState => {
  if (
    !config.enabled
    || !timeline
    || !Number.isFinite(timeline.durationSeconds)
    || timeline.durationSeconds <= 0
    || timeline.cues.length === 0
  ) {
    return createOverviewNeuralCoreSceneDirectionState(config);
  }

  const timelineSeconds = getTimelineSeconds(
    elapsedSeconds,
    timeline.durationSeconds,
    timeline.loop ?? false,
  );
  const cue = findActiveCue(timeline.cues, timelineSeconds);
  return cue
    ? createCueState(cue, timelineSeconds, topologyVisualState, config)
    : createOverviewNeuralCoreSceneDirectionState(config);
};
