import type { NeuralCoreInteractionMode } from "../../domain/inspection/neural-core-inspection.types";

export interface NeuralCoreInspectionControlsViewProps {
  isPaused: boolean;
  mode: NeuralCoreInteractionMode;
  onEnterInspection: () => void;
  onExitInspection: () => void;
  onResetView: () => void;
  onTogglePaused: () => void;
}
