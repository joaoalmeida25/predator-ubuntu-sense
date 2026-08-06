import type { NeuralCoreSceneDirectionTimeline } from "../../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreOperationalRuntimeSnapshot } from "../runtime/neural-core-operational-runtime.types";

export const mapOperationalRuntimeToNeuralCoreSceneDirection = (
  snapshot: NeuralCoreOperationalRuntimeSnapshot,
): NeuralCoreSceneDirectionTimeline | undefined => {
  if (snapshot.status === "idle" || !snapshot.activeClusterId) {
    return undefined;
  }
  return {
    id: `direction:operational:${snapshot.executionId}:${snapshot.activeClusterId}`,
    durationSeconds: 3600,
    loop: false,
    cues: [{
      id: `focus:${snapshot.activeClusterId}`,
      startSeconds: 0,
      durationSeconds: 3600,
      target: { type: "cluster", id: snapshot.activeClusterId },
      focus: {
        targetEmphasis: snapshot.status === "completed" ? 0.72 : 1.08,
        contextDim: snapshot.status === "completed" ? 0.16 : 0.42,
        routeEmphasis: snapshot.activeRouteId ? 1 : 0.48,
        clusterFillEmphasis: snapshot.status === "completed" ? 0.56 : 0.88,
        peripheralOpacity: 0.66,
        haloIntensity: snapshot.status === "completed" ? 0.58 : 0.92,
      },
      camera: {
        distance: 4.2,
        azimuthOffset: 0.04,
        elevationOffset: 0.025,
        targetOffset: [0, 0, 0],
      },
      easing: "ease-in-out",
      holdAtEnd: true,
      rotationMultiplier: 0.18,
    }],
  };
};
