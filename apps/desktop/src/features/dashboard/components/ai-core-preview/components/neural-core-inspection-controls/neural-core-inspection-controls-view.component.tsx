import type { ReactElement } from "react";

import styles from "./neural-core-inspection-controls.module.css";
import type { NeuralCoreInspectionControlsViewProps } from "./neural-core-inspection-controls-view.types";

export const NeuralCoreInspectionControlsView = ({
  isPaused,
  mode,
  onEnterInspection,
  onExitInspection,
  onResetView,
  onTogglePaused,
}: NeuralCoreInspectionControlsViewProps): ReactElement => {
  if (mode === "presentation") {
    return (
      <div className={styles.controls} data-neural-core-label-exclusion>
        <button type="button" className={styles.primaryButton} onClick={onEnterInspection}>
          Inspect
        </button>
      </div>
    );
  }
  return (
    <div
      className={`${styles.controls} ${styles.inspectionControls}`}
      data-neural-core-label-exclusion
      aria-label="Inspection controls"
    >
      <span className={styles.modeLabel}>Inspection mode</span>
      <button type="button" onClick={onTogglePaused}>
        {isPaused ? "Resume" : "Pause"}
      </button>
      <button type="button" onClick={onResetView}>Reset view</button>
      <button type="button" onClick={onExitInspection}>Exit inspection</button>
    </div>
  );
};
