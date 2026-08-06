import type {
  NeuralCoreSceneCameraTarget,
  NeuralCoreSceneDirectionCue,
  NeuralCoreSceneDirectionTimeline,
  NeuralCoreSceneFocusStyle,
  NeuralCoreSceneFocusTarget,
} from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreAnimatedDemoScenario } from "./neural-core-demo-state.types";

const OVERVIEW_FOCUS: NeuralCoreSceneFocusStyle = {
  targetEmphasis: 0,
  contextDim: 0,
  routeEmphasis: 0,
  clusterFillEmphasis: 0,
  peripheralOpacity: 1,
  haloIntensity: 0,
};

const STANDARD_FOCUS: NeuralCoreSceneFocusStyle = {
  targetEmphasis: 1.08,
  contextDim: 0.6,
  routeEmphasis: 0.78,
  clusterFillEmphasis: 0.76,
  peripheralOpacity: 0.38,
  haloIntensity: 0.78,
};

const STRONG_FOCUS: NeuralCoreSceneFocusStyle = {
  targetEmphasis: 1.3,
  contextDim: 0.72,
  routeEmphasis: 1.04,
  clusterFillEmphasis: 1,
  peripheralOpacity: 0.28,
  haloIntensity: 1,
};

const ROUTE_FOCUS: NeuralCoreSceneFocusStyle = {
  targetEmphasis: 1,
  contextDim: 0.62,
  routeEmphasis: 1.3,
  clusterFillEmphasis: 0.3,
  peripheralOpacity: 0.34,
  haloIntensity: 0,
};

const overviewCamera = (distance = 4.35): NeuralCoreSceneCameraTarget => ({
  distance,
  azimuthOffset: 0,
  elevationOffset: 0.008,
  targetOffset: [0, 0, 0],
});

const focusCamera = (
  distance: number,
  azimuthOffset = 0,
  elevationOffset = 0,
): NeuralCoreSceneCameraTarget => ({
  distance,
  azimuthOffset,
  elevationOffset,
  targetOffset: [0, 0.015, 0],
});

const contextualFocusCamera = (
  distance: number,
  horizontalTargetOffset: number,
): NeuralCoreSceneCameraTarget => ({
  ...focusCamera(distance),
  targetOffset: [horizontalTargetOffset, 0.015, 0],
});

const target = (
  type: NeuralCoreSceneFocusTarget["type"],
  id?: string,
): NeuralCoreSceneFocusTarget => ({ type, ...(id ? { id } : {}) });

const cue = (
  id: string,
  startSeconds: number,
  durationSeconds: number,
  focusTarget: NeuralCoreSceneFocusTarget,
  focus: NeuralCoreSceneFocusStyle,
  camera: NeuralCoreSceneCameraTarget,
  rotationMultiplier: number,
  easing: NeuralCoreSceneDirectionCue["easing"] = "ease-in-out",
  holdAtEnd = false,
): NeuralCoreSceneDirectionCue => ({
  id,
  startSeconds,
  durationSeconds,
  target: focusTarget,
  focus,
  camera,
  rotationMultiplier,
  easing,
  ...(holdAtEnd ? { holdAtEnd: true } : {}),
});

const overviewCue = (
  id: string,
  startSeconds: number,
  durationSeconds: number,
  distance = 4.35,
): NeuralCoreSceneDirectionCue => {
  return cue(
    id,
    startSeconds,
    durationSeconds,
    target("overview"),
    OVERVIEW_FOCUS,
    overviewCamera(distance),
    1,
  );
};

export const NEURAL_CORE_DEMO_SCENE_DIRECTIONS: Record<
  NeuralCoreAnimatedDemoScenario,
  NeuralCoreSceneDirectionTimeline
> = {
  "data-flow": {
    id: "direction:data-flow",
    durationSeconds: 6.8,
    loop: true,
    cues: [
      cue("data-input", 0, 1.55, target("cluster", "data-input"), STANDARD_FOCUS, focusCamera(4.02), 0.16),
      cue("data-buffer", 1.55, 1.75, target("cluster", "data-buffer"), STRONG_FOCUS, focusCamera(3.88), 0.1),
      cue("data-output", 3.3, 1.7, target("cluster", "data-output"), STANDARD_FOCUS, focusCamera(4.02), 0.14),
      overviewCue("data-overview", 5, 1.8, 4.48),
    ],
  },
  "function-execution": {
    id: "direction:function-execution",
    durationSeconds: 7.8,
    loop: true,
    cues: [
      overviewCue("function-overview-start", 0, 0.65),
      cue("function-input", 0.65, 1.05, target("cluster", "function-input"), STANDARD_FOCUS, focusCamera(4.02, -0.025), 0.12, "ease-out"),
      cue("function-call-route", 1.7, 0.75, target("synapse", "synapse:function-call"), ROUTE_FOCUS, focusCamera(3.95), 0.08, "linear"),
      cue("function-core", 2.45, 2.05, target("cluster", "function-core"), STRONG_FOCUS, focusCamera(3.68, 0.015, 0.012), 0.04),
      cue("function-result-route", 4.5, 0.8, target("synapse", "synapse:function-result"), ROUTE_FOCUS, focusCamera(3.94), 0.08, "linear"),
      cue("function-output", 5.3, 1.05, target("cluster", "function-output"), STANDARD_FOCUS, focusCamera(4.02, 0.025), 0.12, "ease-in-out"),
      overviewCue("function-overview-end", 6.35, 1.45, 4.48),
    ],
  },
  "memory-sync": {
    id: "direction:memory-sync",
    durationSeconds: 11.5,
    loop: true,
    cues: [
      overviewCue("memory-overview-start", 0, 0.75),
      cue("memory-process", 0.75, 0.8, target("cluster", "memory-process"), STANDARD_FOCUS, focusCamera(4.02, -0.02), 0.1),
      cue("memory-read-route", 1.55, 0.85, target("synapse", "synapse:memory-link"), ROUTE_FOCUS, focusCamera(3.92), 0.05),
      cue("memory-store-consolidates", 2.4, 4.75, target("cluster", "memory-store"), STRONG_FOCUS, focusCamera(3.62, 0, 0.008), 0.02),
      cue("memory-commit-route", 7.15, 0.9, target("synapse", "synapse:memory-commit"), ROUTE_FOCUS, focusCamera(3.94), 0.05),
      cue("memory-sync-output", 8.05, 1.1, target("cluster", "memory-sync"), STANDARD_FOCUS, focusCamera(3.98, 0.02), 0.08),
      overviewCue("memory-overview-end", 9.15, 2.35, 4.52),
    ],
  },
  "process-pipeline": {
    id: "direction:process-pipeline",
    durationSeconds: 11.5,
    loop: true,
    cues: [
      overviewCue("pipeline-overview-start", 0, 0.55, 4.58),
      cue("pipeline-input", 0.55, 1, target("cluster", "pipeline-input"), STANDARD_FOCUS, contextualFocusCamera(4.3, 0.32), 0.08),
      cue("pipeline-data", 1.55, 1, target("cluster", "pipeline-data"), STANDARD_FOCUS, focusCamera(4.1), 0.08),
      cue("pipeline-function", 2.55, 1, target("cluster", "pipeline-function"), STANDARD_FOCUS, focusCamera(4.08), 0.08),
      cue("pipeline-process", 3.55, 1, target("cluster", "pipeline-process"), STANDARD_FOCUS, focusCamera(4.06), 0.08),
      cue("pipeline-memory", 4.55, 1, target("cluster", "pipeline-memory"), STANDARD_FOCUS, focusCamera(4.06), 0.08),
      cue("pipeline-decision", 5.55, 1, target("cluster", "pipeline-decision"), STANDARD_FOCUS, focusCamera(4.08), 0.08),
      cue("pipeline-output", 6.55, 1, target("cluster", "pipeline-output"), STRONG_FOCUS, contextualFocusCamera(4.3, -0.32), 0.08),
      cue("pipeline-complete", 7.55, 1.8, target("pathway", "pipeline-pathway"), ROUTE_FOCUS, overviewCamera(4.48), 0.12),
      overviewCue("pipeline-overview-end", 9.35, 2.15, 4.62),
    ],
  },
  "warning-state": {
    id: "direction:warning-state",
    durationSeconds: 9.5,
    loop: true,
    cues: [
      overviewCue("warning-overview", 0, 1),
      cue("warning-region", 1, 5.7, target("cluster", "warning-service"), {
        ...STRONG_FOCUS,
        targetEmphasis: 0.92,
        contextDim: 0.5,
        routeEmphasis: 0.64,
        clusterFillEmphasis: 0.72,
        haloIntensity: 0.68,
        peripheralOpacity: 0.46,
      }, focusCamera(3.82), 0.02, "ease-in"),
      cue("warning-partial-recovery", 6.7, 2.8, target("cluster", "warning-service"), {
        ...STANDARD_FOCUS,
        targetEmphasis: 0.72,
        contextDim: 0.34,
        routeEmphasis: 0.48,
        haloIntensity: 0.48,
        peripheralOpacity: 0.58,
      }, focusCamera(4.02), 0.04),
    ],
  },
  "error-state": {
    id: "direction:error-state",
    durationSeconds: 8.8,
    loop: false,
    cues: [
      overviewCue("error-overview", 0, 1),
      cue("error-region-approach", 1, 2, target("cluster", "error-service"), {
        ...STANDARD_FOCUS,
        contextDim: 0.5,
      }, focusCamera(3.9), 0, "ease-in"),
      cue("error-region-degrades", 3, 5.8, target("cluster", "error-service"), {
        ...STRONG_FOCUS,
        contextDim: 0.72,
        peripheralOpacity: 0.28,
      }, focusCamera(3.7), 0, "ease-in-out", true),
    ],
  },
  "success-state": {
    id: "direction:success-state",
    durationSeconds: 8,
    loop: false,
    cues: [
      cue("success-output", 0, 1.2, target("cluster", "success-output"), STANDARD_FOCUS, focusCamera(4.02), 0.08),
      cue("success-pathway", 1.2, 1.8, target("pathway", "success-pathway"), {
        ...ROUTE_FOCUS,
        contextDim: 0.24,
        peripheralOpacity: 0.68,
      }, overviewCamera(4.58), 0.14, "ease-out"),
      overviewCue("success-overview", 3, 5, 4.7),
    ],
  },
};
