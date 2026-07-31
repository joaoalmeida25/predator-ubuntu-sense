import type { KeyboardEventHandler, ReactNode } from "react";

import type { NeuralCoreState } from "./domain/contract/neural-core-contract.types";
import type { NeuralCoreChoreography } from "./domain/choreography/neural-core-choreography.types";
import type { NeuralCoreDemoScenario } from "./demos/neural-core-demo-state/neural-core-demo-state.types";
import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationConfigInput,
  NeuralCorePropagationEvent,
  NeuralCorePropagationPreset,
} from "./domain/propagation/neural-core-propagation.types";
import type { NeuralCoreTopology } from "./domain/topology/neural-core-topology.types";
import type {
  NeuralCoreSemanticVisualizationConfig,
  NeuralCoreSemanticVisualizationConfigInput,
} from "./visualization/semantic/neural-core-semantic-visual.types";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionConfigInput,
  NeuralCoreSceneDirectionTimeline,
  NeuralCoreSceneMotionConfig,
  NeuralCoreSceneMotionConfigInput,
} from "./visualization/direction/neural-core-scene-direction.types";
import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeConfigInput,
  NeuralCoreNarrativeState,
} from "./domain/narrative/neural-core-narrative.types";
import type {
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialLayoutConfigInput,
  NeuralCoreSpatialMapInput,
} from "./visualization/spatial/neural-core-spatial-map.types";
import type {
  NeuralCoreClusterLabelConfig,
  NeuralCoreClusterLabelConfigInput,
} from "./visualization/labels/neural-core-cluster-label.types";
import type {
  NeuralCoreLodConfig,
  NeuralCoreLodConfigInput,
} from "./visualization/lod/neural-core-lod.types";
import type {
  NeuralCoreInspectionConfig,
  NeuralCoreInspectionConfigInput,
  NeuralCoreInspectionState,
  NeuralCoreInteractionMode,
} from "./domain/inspection/neural-core-inspection.types";
import type { NeuralCoreInspectionFocusState } from "./visualization/inspection/neural-core-inspection-focus.types";
import type {
  NeuralCoreClusterGrammarConfig,
  NeuralCoreClusterGrammarConfigInput,
} from "./visualization/cluster-grammar/neural-core-cluster-grammar.types";
import type {
  NeuralCoreSemanticFocusLensConfig,
  NeuralCoreSemanticFocusLensConfigInput,
} from "./visualization/focus-lens/neural-core-semantic-focus-lens.types";

export interface AiCorePreviewProps {
  dataFlow: string;
  learningRate: string;
  modelStatus: string;
  engineStatus: string;
  engineVersion: string;
  nodeCountLabel: string;
  predictionAccuracy: string;
  narrative?: NeuralCoreNarrative;
  narrativeConfig?: NeuralCoreNarrativeConfigInput;
  showNarrativeOverlay?: boolean;
  autoRotate?: boolean;
  sceneMotionConfig?: NeuralCoreSceneMotionConfigInput;
  sceneDirection?: NeuralCoreSceneDirectionTimeline;
  sceneDirectionConfig?: NeuralCoreSceneDirectionConfigInput;
  state?: NeuralCoreState;
  choreography?: NeuralCoreChoreography;
  semanticVisualizationConfig?: NeuralCoreSemanticVisualizationConfigInput;
  spatialMap?: NeuralCoreSpatialMapInput;
  spatialLayoutConfig?: NeuralCoreSpatialLayoutConfigInput;
  showClusterLabels?: boolean;
  clusterLabelConfig?: NeuralCoreClusterLabelConfigInput;
  lodConfig?: NeuralCoreLodConfigInput;
  clusterGrammarConfig?: NeuralCoreClusterGrammarConfigInput;
  semanticFocusLensConfig?: NeuralCoreSemanticFocusLensConfigInput;
  demoScenario?: NeuralCoreDemoScenario;
  defaultDemoScenario?: NeuralCoreDemoScenario;
  showDemoControls?: boolean;
  onDemoScenarioChange?: (scenario: NeuralCoreDemoScenario) => void;
  propagationConfig?: NeuralCorePropagationConfigInput;
  propagationPreset?: NeuralCorePropagationPreset;
  onPropagationEvent?: (event: NeuralCorePropagationEvent) => void;
  inspectionEnabled?: boolean;
  inspectionConfig?: NeuralCoreInspectionConfigInput;
  interactionMode?: NeuralCoreInteractionMode;
  defaultInteractionMode?: NeuralCoreInteractionMode;
  onInteractionModeChange?: (mode: NeuralCoreInteractionMode) => void;
  selectedClusterId?: string;
  defaultSelectedClusterId?: string;
  onSelectedClusterChange?: (clusterId?: string) => void;
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
}

export interface AiCorePreviewNode {
  depth: number;
  id: number;
  isHot: boolean;
  x: number;
  y: number;
}

export interface AiCorePreviewLine {
  from: AiCorePreviewNode;
  id: string;
  to: AiCorePreviewNode;
}

export interface AiCorePreviewCallout {
  className: string;
  detail: string;
  label: string;
  value: string;
}

export interface AiCorePreviewViewProps {
  callouts: AiCorePreviewCallout[];
  choreography?: NeuralCoreChoreography;
  demoControls?: ReactNode;
  contextPanel?: ReactNode;
  inspectionControls?: ReactNode;
  inspectionConfig: NeuralCoreInspectionConfig;
  inspectionFocus: NeuralCoreInspectionFocusState;
  inspectionState: NeuralCoreInspectionState;
  cameraResetRevision: number;
  engineVersion: string;
  neuralLines: AiCorePreviewLine[];
  neuralNodes: AiCorePreviewNode[];
  narrative?: NeuralCoreNarrative;
  narrativeConfig: NeuralCoreNarrativeConfig;
  narrativeState: NeuralCoreNarrativeState;
  onNarrativeStateChange: (state: NeuralCoreNarrativeState) => void;
  onCameraTransitioningChange: (transitioning: boolean) => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onSelectCluster: (clusterId?: string) => void;
  onPropagationEvent?: (event: NeuralCorePropagationEvent) => void;
  propagationConfig: NeuralCorePropagationConfig;
  sceneDirection?: NeuralCoreSceneDirectionTimeline;
  sceneDirectionConfig: NeuralCoreSceneDirectionConfig;
  sceneMotionConfig: NeuralCoreSceneMotionConfig;
  semanticVisualizationConfig: NeuralCoreSemanticVisualizationConfig;
  clusterLabelConfig: NeuralCoreClusterLabelConfig;
  lodConfig: NeuralCoreLodConfig;
  clusterGrammarConfig: NeuralCoreClusterGrammarConfig;
  semanticFocusLensConfig: NeuralCoreSemanticFocusLensConfig;
  spatialMap?: NeuralCoreSpatialMapInput;
  spatialLayoutConfig: NeuralCoreSpatialLayoutConfig;
  topology?: NeuralCoreTopology;
  runtimeScenarioKey: string;
}
