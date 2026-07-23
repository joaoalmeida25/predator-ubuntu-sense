import { useCallback, useRef } from "react";

import { createOverviewNeuralCoreSceneDirectionState } from "../../visualization/direction/neural-core-scene-direction.constants";
import { evaluateNeuralCoreSceneDirection } from "../../visualization/direction/neural-core-scene-direction.mapper";
import type {
  NeuralCoreCameraMotionRuntime,
  NeuralCoreSceneDirectionState,
  NeuralCoreSceneDirectionTimeline,
} from "../../visualization/direction/neural-core-scene-direction.types";
import { dampNeuralCoreSceneDirectionValue } from "../../visualization/direction/neural-core-scene-direction.utils";
import type {
  UseNeuralCoreSceneDirectionParams,
  UseNeuralCoreSceneDirectionResult,
} from "./use-neural-core-scene-direction.types";

const createTimelineKey = (timeline?: NeuralCoreSceneDirectionTimeline): string => {
  return timeline ? JSON.stringify(timeline) : "none";
};

const dampStateValue = (
  state: NeuralCoreSceneDirectionState,
  key: keyof Pick<
    NeuralCoreSceneDirectionState,
    | "targetEmphasis"
    | "contextDim"
    | "routeEmphasis"
    | "clusterFillEmphasis"
    | "peripheralOpacity"
    | "haloIntensity"
    | "rotationMultiplier"
  >,
  target: NeuralCoreSceneDirectionState,
  response: number,
  deltaSeconds: number,
): void => {
  state[key] = dampNeuralCoreSceneDirectionValue(
    state[key],
    target[key],
    response,
    deltaSeconds,
  );
};

export const useNeuralCoreSceneDirection = ({
  config,
  resetKey = "none",
  timeline,
  topologyVisualState,
}: UseNeuralCoreSceneDirectionParams): UseNeuralCoreSceneDirectionResult => {
  const configRef = useRef(config);
  configRef.current = config;
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;
  const topologyVisualStateRef = useRef(topologyVisualState);
  topologyVisualStateRef.current = topologyVisualState;
  const identityKey = `${resetKey}:${createTimelineKey(timeline)}`;
  const identityKeyRef = useRef(identityKey);
  const elapsedSecondsRef = useRef(0);
  if (identityKeyRef.current !== identityKey) {
    identityKeyRef.current = identityKey;
    elapsedSecondsRef.current = 0;
  }

  const initialStateRef = useRef<NeuralCoreSceneDirectionState | undefined>(undefined);
  if (!initialStateRef.current) {
    initialStateRef.current = createOverviewNeuralCoreSceneDirectionState(config);
  }
  const stateRef = useRef<NeuralCoreSceneDirectionState>(initialStateRef.current);
  const cameraRuntimeRef = useRef<NeuralCoreCameraMotionRuntime>({
    position: [...initialStateRef.current.cameraPosition],
    target: [...initialStateRef.current.target],
    distance: initialStateRef.current.cameraDistance,
  });

  const reset = useCallback((): void => {
    elapsedSecondsRef.current = 0;
  }, []);

  const advance = useCallback((deltaSeconds: number): NeuralCoreSceneDirectionState => {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.min(0.1, Math.max(0, deltaSeconds))
      : 0;
    elapsedSecondsRef.current += safeDeltaSeconds;
    const currentConfig = configRef.current;
    const desired = evaluateNeuralCoreSceneDirection({
      timeline: timelineRef.current,
      elapsedSeconds: elapsedSecondsRef.current,
      topologyVisualState: topologyVisualStateRef.current,
      config: currentConfig,
    });
    const state = stateRef.current;
    const cameraRuntime = cameraRuntimeRef.current;
    const transitionDuration = Math.min(
      currentConfig.transition.maximumDurationSeconds,
      Math.max(
        currentConfig.transition.minimumDurationSeconds,
        currentConfig.transition.defaultDurationSeconds,
      ),
    );
    const focusResponse = 4.6 / Math.max(0.05, transitionDuration);

    for (let axis = 0; axis < 3; axis += 1) {
      cameraRuntime.target[axis] = dampNeuralCoreSceneDirectionValue(
        cameraRuntime.target[axis],
        desired.target[axis],
        currentConfig.camera.targetResponse,
        safeDeltaSeconds,
      );
      cameraRuntime.position[axis] = dampNeuralCoreSceneDirectionValue(
        cameraRuntime.position[axis],
        desired.cameraPosition[axis],
        currentConfig.camera.positionResponse,
        safeDeltaSeconds,
      );
    }
    cameraRuntime.distance = dampNeuralCoreSceneDirectionValue(
      cameraRuntime.distance,
      desired.cameraDistance,
      currentConfig.camera.positionResponse,
      safeDeltaSeconds,
    );

    const offsetX = cameraRuntime.position[0] - cameraRuntime.target[0];
    const offsetY = cameraRuntime.position[1] - cameraRuntime.target[1];
    const offsetZ = cameraRuntime.position[2] - cameraRuntime.target[2];
    const actualDistance = Math.max(0.0001, Math.hypot(offsetX, offsetY, offsetZ));
    const boundedDistance = Math.min(
      currentConfig.camera.maximumDistance,
      Math.max(currentConfig.camera.minimumDistance, actualDistance),
    );
    if (Math.abs(boundedDistance - actualDistance) > 0.0001) {
      const scale = boundedDistance / actualDistance;
      cameraRuntime.position[0] = cameraRuntime.target[0] + offsetX * scale;
      cameraRuntime.position[1] = cameraRuntime.target[1] + offsetY * scale;
      cameraRuntime.position[2] = cameraRuntime.target[2] + offsetZ * scale;
    }

    state.target[0] = cameraRuntime.target[0];
    state.target[1] = cameraRuntime.target[1];
    state.target[2] = cameraRuntime.target[2];
    state.cameraPosition[0] = cameraRuntime.position[0];
    state.cameraPosition[1] = cameraRuntime.position[1];
    state.cameraPosition[2] = cameraRuntime.position[2];
    state.cameraDistance = cameraRuntime.distance;
    state.focusTargetType = desired.focusTargetType;
    state.focusTargetId = desired.focusTargetId;
    state.targetClusterIds = desired.targetClusterIds;
    state.neighborClusterIds = desired.neighborClusterIds;
    state.targetSynapseIds = desired.targetSynapseIds;
    state.relatedSynapseIds = desired.relatedSynapseIds;
    state.targetPathwayIds = desired.targetPathwayIds;
    state.isOverview = desired.isOverview;
    state.transitionProgress = desired.transitionProgress;
    dampStateValue(state, "targetEmphasis", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "contextDim", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "routeEmphasis", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "clusterFillEmphasis", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "peripheralOpacity", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "haloIntensity", desired, focusResponse, safeDeltaSeconds);
    dampStateValue(state, "rotationMultiplier", desired, focusResponse, safeDeltaSeconds);
    return state;
  }, []);

  return { advance, reset };
};
