import { memo, type ReactElement } from "react";

import { NeuralCoreOperationalControlsView } from "./neural-core-operational-controls-view.component";
import type { NeuralCoreOperationalControlsProps } from "./neural-core-operational-controls-view.types";

const NeuralCoreOperationalControlsComponent = ({
  executionName,
  executionOptions,
  selectedExecutionId,
  selectorDisabled,
  stageName,
  status,
  isPaused,
  retry,
  outcomeSummary,
  progressBarRef,
  progressLabelRef,
  onRun,
  onPause,
  onResume,
  onRestart,
  onExecutionChange,
}: NeuralCoreOperationalControlsProps): ReactElement => {
  const primaryAction = isPaused
    ? { label: "Resume", action: onResume }
    : status === "running" || status === "failed" || status === "recovering"
      ? { label: "Pause", action: onPause }
      : status === "completed"
        ? { label: "Run again", action: onRun }
        : { label: "Run", action: onRun };
  return (
    <NeuralCoreOperationalControlsView
      executionName={executionName}
      executionOptions={executionOptions}
      selectedExecutionId={selectedExecutionId}
      selectorDisabled={selectorDisabled}
      stageName={stageName}
      status={status}
      isPaused={isPaused}
      retry={retry}
      outcomeSummary={outcomeSummary}
      progressBarRef={progressBarRef}
      progressLabelRef={progressLabelRef}
      primaryActionLabel={primaryAction.label}
      onPrimaryAction={primaryAction.action}
      showRestart={status !== "idle"}
      onExecutionChange={onExecutionChange}
      onRestart={onRestart}
    />
  );
};

export const NeuralCoreOperationalControls = memo(NeuralCoreOperationalControlsComponent);
