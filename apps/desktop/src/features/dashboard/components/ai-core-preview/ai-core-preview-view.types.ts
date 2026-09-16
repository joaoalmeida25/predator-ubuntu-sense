import type { KeyboardEventHandler, ReactNode } from "react";

import type {
  NeuralCoreConfigInput as PublicNeuralCoreConfigInput,
  NeuralCoreInteractionState as PublicNeuralCoreInteractionState,
  NeuralCoreInteractionStateChangeHandler as PublicNeuralCoreInteractionStateChangeHandler,
  NeuralCoreModelInput as PublicNeuralCoreModelInput,
  NeuralCoreRuntimeInput as PublicNeuralCoreRuntimeInput,
} from "./api";

import type { NeuralCoreState } from "./domain/contract/neural-core-contract.types";
import type { NeuralCoreChoreography } from "./domain/choreography/neural-core-choreography.types";
import type { NeuralCoreRuntimeBinding } from "./controllers/neural-core-runtime/neural-core-runtime-binding.context";
import type { NeuralCoreInspectionBinding } from "./controllers/neural-core-renderer/neural-core-inspection-binding.context";
import type { NeuralCorePresentationBinding } from "./domain/presentation/neural-core-presentation-binding.types";
import type { NeuralCoreDemoScenario } from "./demos/neural-core-demo-state/neural-core-demo-state.types";
import type {
  NeuralCorePropagationConfigInput,
  NeuralCorePropagationPreset,
} from "./domain/propagation/neural-core-propagation.types";
import type {
  NeuralCoreSemanticVisualizationConfigInput,
} from "./visualization/semantic/neural-core-semantic-visual.types";
import type {
  NeuralCoreSceneDirectionTimeline,
  NeuralCoreSceneMotionConfigInput,
} from "./visualization/direction/neural-core-scene-direction.types";
import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeConfigInput,
  NeuralCoreNarrativeState,
} from "./domain/narrative/neural-core-narrative.types";
import type {
  NeuralCoreClusterLabelConfigInput,
} from "./visualization/labels/neural-core-cluster-label.types";
import type {
  NeuralCoreLodConfigInput,
} from "./visualization/lod/neural-core-lod.types";
import type {
  NeuralCoreInspectionConfigInput,
  NeuralCoreInspectionState,
  NeuralCoreInteractionMode,
} from "./domain/inspection/neural-core-inspection.types";
import type { NeuralCoreInspectionFocusState } from "./visualization/inspection/neural-core-inspection-focus.types";
import type {
  NeuralCoreClusterGrammarConfigInput,
} from "./visualization/cluster-grammar/neural-core-cluster-grammar.types";
import type {
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
  state?: NeuralCoreState;
  choreography?: NeuralCoreChoreography;
  semanticVisualizationConfig?: NeuralCoreSemanticVisualizationConfigInput;
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

export interface AiCorePreviewCallout {
  className: string;
  detail: string;
  label: string;
  value: string;
}

export interface AiCorePreviewViewProps {
  callouts: AiCorePreviewCallout[];
  demoControls?: ReactNode;
  operationalControls?: ReactNode;
  contextPanel?: ReactNode;
  inspectionControls?: ReactNode;
  inspectionFocus: NeuralCoreInspectionFocusState;
  inspectionState: NeuralCoreInspectionState;
  engineVersion: string;
  narrativeConfig: NeuralCoreNarrativeConfig;
  narrativeState: NeuralCoreNarrativeState;
  onNarrativeStateChange: (state: NeuralCoreNarrativeState) => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  publicConfig: PublicNeuralCoreConfigInput;
  publicInteractionState: PublicNeuralCoreInteractionState;
  publicModel: PublicNeuralCoreModelInput;
  publicRuntime?: PublicNeuralCoreRuntimeInput;
  inspectionBinding: NeuralCoreInspectionBinding;
  presentationBinding: NeuralCorePresentationBinding;
  runtimeBinding?: NeuralCoreRuntimeBinding;
  onPublicInteractionStateChange: PublicNeuralCoreInteractionStateChangeHandler;
}
