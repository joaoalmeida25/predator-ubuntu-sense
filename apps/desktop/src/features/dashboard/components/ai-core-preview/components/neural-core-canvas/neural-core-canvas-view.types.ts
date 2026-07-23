import type { ReactNode } from "react";
import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationEvent,
} from "../../domain/propagation/neural-core-propagation.types";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.types";
import type { NeuralCoreSemanticVisualizationConfig } from "../../visualization/semantic/neural-core-semantic-visual.types";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionTimeline,
  NeuralCoreSceneMotionConfig,
} from "../../visualization/direction/neural-core-scene-direction.types";
import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeState,
} from "../../domain/narrative/neural-core-narrative.types";
import type {
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialMapInput,
} from "../../visualization/spatial/neural-core-spatial-map.types";
import type { NeuralCoreClusterLabelConfig } from "../../visualization/labels/neural-core-cluster-label.types";
import type { NeuralCoreLodConfig } from "../../visualization/lod/neural-core-lod.types";
import type {
  NeuralCoreInspectionConfig,
  NeuralCoreInspectionState,
} from "../../domain/inspection/neural-core-inspection.types";
import type { NeuralCoreInspectionFocusState } from "../../visualization/inspection/neural-core-inspection-focus.types";

export interface NeuralCoreCanvasViewProps {
  fallback: ReactNode;
  choreography?: NeuralCoreChoreography;
  narrative?: NeuralCoreNarrative;
  narrativeConfig: NeuralCoreNarrativeConfig;
  onNarrativeStateChange: (state: NeuralCoreNarrativeState) => void;
  onPropagationEvent?: (event: NeuralCorePropagationEvent) => void;
  propagationConfig: NeuralCorePropagationConfig;
  sceneDirection?: NeuralCoreSceneDirectionTimeline;
  sceneDirectionConfig: NeuralCoreSceneDirectionConfig;
  sceneMotionConfig: NeuralCoreSceneMotionConfig;
  semanticVisualizationConfig: NeuralCoreSemanticVisualizationConfig;
  clusterLabelConfig: NeuralCoreClusterLabelConfig;
  lodConfig: NeuralCoreLodConfig;
  spatialMap?: NeuralCoreSpatialMapInput;
  spatialLayoutConfig: NeuralCoreSpatialLayoutConfig;
  topology?: NeuralCoreTopology;
  runtimeScenarioKey: string;
  cameraResetRevision: number;
  inspectionConfig: NeuralCoreInspectionConfig;
  inspectionFocus: NeuralCoreInspectionFocusState;
  inspectionState: NeuralCoreInspectionState;
  onCameraTransitioningChange: (transitioning: boolean) => void;
  onSelectCluster: (clusterId?: string) => void;
}
