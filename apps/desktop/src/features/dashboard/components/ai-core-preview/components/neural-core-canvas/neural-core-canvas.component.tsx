import type { ReactElement } from "react";

import { NeuralCoreCanvasView } from "./neural-core-canvas-view.component";
import type { NeuralCoreCanvasViewProps } from "./neural-core-canvas-view.types";

export const NeuralCoreCanvas = ({
  fallback,
  choreography,
  narrative,
  narrativeConfig,
  onNarrativeStateChange,
  topology,
  propagationConfig,
  sceneDirection,
  sceneDirectionConfig,
  sceneMotionConfig,
  semanticVisualizationConfig,
  clusterLabelConfig,
  lodConfig,
  spatialMap,
  spatialLayoutConfig,
  onPropagationEvent,
  runtimeScenarioKey,
  cameraResetRevision,
  inspectionConfig,
  inspectionFocus,
  inspectionState,
  onCameraTransitioningChange,
  onSelectCluster,
}: NeuralCoreCanvasViewProps): ReactElement => {
  return (
    <NeuralCoreCanvasView
      fallback={fallback}
      choreography={choreography}
      narrative={narrative}
      narrativeConfig={narrativeConfig}
      onNarrativeStateChange={onNarrativeStateChange}
      topology={topology}
      propagationConfig={propagationConfig}
      sceneDirection={sceneDirection}
      sceneDirectionConfig={sceneDirectionConfig}
      sceneMotionConfig={sceneMotionConfig}
      semanticVisualizationConfig={semanticVisualizationConfig}
      clusterLabelConfig={clusterLabelConfig}
      lodConfig={lodConfig}
      spatialMap={spatialMap}
      spatialLayoutConfig={spatialLayoutConfig}
      onPropagationEvent={onPropagationEvent}
      runtimeScenarioKey={runtimeScenarioKey}
      cameraResetRevision={cameraResetRevision}
      inspectionConfig={inspectionConfig}
      inspectionFocus={inspectionFocus}
      inspectionState={inspectionState}
      onCameraTransitioningChange={onCameraTransitioningChange}
      onSelectCluster={onSelectCluster}
    />
  );
};
