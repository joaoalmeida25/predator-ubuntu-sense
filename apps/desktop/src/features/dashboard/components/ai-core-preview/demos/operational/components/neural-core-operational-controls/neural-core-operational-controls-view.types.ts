import type { RefObject } from "react";

import type {
  NeuralCoreOperationalOutcomeSummary,
} from "../../mappers/neural-core-operational-outcome-summary.mapper";
import type {
  NeuralCoreOperationalRetryRuntimeState,
  NeuralCoreOperationalRuntimeStatus,
} from "../../../../domain/operational-runtime/runtime/neural-core-operational-runtime.types";

export interface NeuralCoreOperationalExecutionOption {
  id: string;
  label: string;
}

export interface NeuralCoreOperationalControlsProps {
  executionName: string;
  executionOptions: readonly NeuralCoreOperationalExecutionOption[];
  selectedExecutionId: string;
  selectorDisabled: boolean;
  stageName: string;
  status: NeuralCoreOperationalRuntimeStatus;
  isPaused: boolean;
  retry?: NeuralCoreOperationalRetryRuntimeState;
  outcomeSummary?: NeuralCoreOperationalOutcomeSummary;
  progressBarRef: RefObject<HTMLDivElement | null>;
  progressLabelRef: RefObject<HTMLOutputElement | null>;
  onExecutionChange: (executionId: string) => void;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export interface NeuralCoreOperationalControlsViewProps {
  executionName: string;
  executionOptions: readonly NeuralCoreOperationalExecutionOption[];
  selectedExecutionId: string;
  selectorDisabled: boolean;
  stageName: string;
  status: NeuralCoreOperationalRuntimeStatus;
  isPaused: boolean;
  retry?: NeuralCoreOperationalRetryRuntimeState;
  outcomeSummary?: NeuralCoreOperationalOutcomeSummary;
  progressBarRef: RefObject<HTMLDivElement | null>;
  progressLabelRef: RefObject<HTMLOutputElement | null>;
  primaryActionLabel: string;
  onExecutionChange: (executionId: string) => void;
  onPrimaryAction: () => void;
  showRestart: boolean;
  onRestart: () => void;
}
