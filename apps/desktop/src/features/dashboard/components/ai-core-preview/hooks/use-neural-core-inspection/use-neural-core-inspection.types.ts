import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type {
  NeuralCoreInspectionConfig,
  NeuralCoreInspectionState,
  NeuralCoreInteractionMode,
} from "../../domain/inspection/neural-core-inspection.types";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreInspectionFocusState } from "../../visualization/inspection/neural-core-inspection-focus.types";

export interface UseNeuralCoreInspectionParams {
  config: NeuralCoreInspectionConfig;
  defaultInteractionMode: NeuralCoreInteractionMode;
  defaultPaused: boolean;
  defaultSelectedClusterId?: string;
  interactionMode?: NeuralCoreInteractionMode;
  onInteractionModeChange?: (mode: NeuralCoreInteractionMode) => void;
  onPausedChange?: (paused: boolean) => void;
  onSelectedClusterChange?: (clusterId?: string) => void;
  paused?: boolean;
  runtimeScenarioKey: string;
  selectedClusterId?: string;
  topology?: NeuralCoreTopology;
}

export interface UseNeuralCoreInspectionResult {
  config: NeuralCoreInspectionConfig;
  focus: NeuralCoreInspectionFocusState;
  state: NeuralCoreInspectionState;
  cameraResetRevision: number;
  clearSelection: () => void;
  enterInspection: () => void;
  exitInspection: () => void;
  handleKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  resetView: () => void;
  selectCluster: (clusterId?: string) => void;
  setCameraTransitioning: (transitioning: boolean) => void;
  togglePaused: () => void;
}
