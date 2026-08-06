import type { ChangeEvent, ReactElement } from "react";

import styles from "./neural-core-operational-controls.module.css";
import type {
  NeuralCoreOperationalControlsViewProps,
} from "./neural-core-operational-controls-view.types";

const formatStatus = ({
  status,
  isPaused,
}: Pick<NeuralCoreOperationalControlsViewProps, "status" | "isPaused">): string => {
  if (isPaused && status === "failed") return "Failure detected · Paused";
  if (isPaused && status === "recovering") return "Recovering · Paused";
  if (isPaused) return "Paused";
  if (status === "failed") return "Failure detected";
  if (status === "recovering") return "Recovering";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatMetric = (
  value: string | number | boolean,
  unit?: string,
): string => `${typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}${
  unit ? ` ${unit}` : ""
}`;

export const NeuralCoreOperationalControlsView = ({
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
  primaryActionLabel,
  onExecutionChange,
  onPrimaryAction,
  showRestart,
  onRestart,
}: NeuralCoreOperationalControlsViewProps): ReactElement => {
  const showRetryState = retry && (status === "failed" || status === "recovering");
  const handleExecutionChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onExecutionChange(event.currentTarget.value);
  };
  return (
    <section
      className={styles.controls}
      data-status={status}
      data-paused={isPaused ? "true" : "false"}
      data-completed={outcomeSummary ? "true" : "false"}
      data-neural-core-label-exclusion
      aria-label={`${executionName} execution playback`}
    >
      <div className={styles.identity}>
        <label htmlFor="neural-core-operational-execution">Execution</label>
        <select
          id="neural-core-operational-execution"
          value={selectedExecutionId}
          disabled={selectorDisabled}
          onChange={handleExecutionChange}
        >
          {executionOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <strong>{formatStatus({ status, isPaused })}</strong>
      </div>
      <div className={styles.timeline}>
        <div className={styles.stageRow}>
          <span>
            {showRetryState
              ? `Attempt ${retry.attempt} of ${retry.maximumAttempts}`
              : "Current stage"}
          </span>
          <strong>{stageName}</strong>
          <output ref={progressLabelRef} aria-live="off">0%</output>
        </div>
        <div
          ref={progressBarRef}
          className={styles.progress}
          role="progressbar"
          aria-label={`${executionName} execution progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
        {showRestart ? (
          <button type="button" onClick={onRestart}>Restart</button>
        ) : null}
      </div>
      {outcomeSummary ? (
        <div className={styles.summary} aria-label="Operational execution summary">
          <div className={styles.summaryOutcome}>
            <span>Outcome</span>
            <strong>{outcomeSummary.outcomeLabel}</strong>
            <small>{outcomeSummary.operationalDurationMs} ms operational</small>
          </div>
          <div className={styles.summaryCounts}>
            <span>Stages <strong>{outcomeSummary.processedStageCount}</strong></span>
            <span>Warnings <strong>{outcomeSummary.warningCount}</strong></span>
            <span>Failures <strong>{outcomeSummary.failureCount}</strong></span>
            <span>Retries <strong>{outcomeSummary.retryCount}</strong></span>
            {outcomeSummary.finalResponse ? <span>{outcomeSummary.finalResponse}</span> : null}
          </div>
          <div className={styles.summaryComponents}>
            {outcomeSummary.failedComponentName ? (
              <span>Failed <strong>{outcomeSummary.failedComponentName}</strong></span>
            ) : null}
            {outcomeSummary.recoveredComponentName ? (
              <span>Recovered <strong>{outcomeSummary.recoveredComponentName}</strong></span>
            ) : null}
            {outcomeSummary.affectedComponentNames.length > 0 ? (
              <span>
                Affected <strong>{outcomeSummary.affectedComponentNames.join(", ")}</strong>
              </span>
            ) : null}
            {outcomeSummary.keyMetrics.slice(0, 3).map((metric) => (
              <span key={metric.id}>
                {metric.name} <strong>{formatMetric(metric.value, metric.unit)}</strong>
              </span>
            ))}
          </div>
          <p className={styles.summaryDescription}>{outcomeSummary.summary}</p>
        </div>
      ) : null}
    </section>
  );
};
