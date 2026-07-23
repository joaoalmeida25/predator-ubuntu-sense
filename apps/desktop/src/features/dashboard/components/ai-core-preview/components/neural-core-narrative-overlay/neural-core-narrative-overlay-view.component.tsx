import type { ReactElement } from "react";

import styles from "./neural-core-narrative-overlay.module.css";
import type { NeuralCoreNarrativeOverlayViewProps } from "./neural-core-narrative-overlay-view.types";

export const NeuralCoreNarrativeOverlayView = ({
  description,
  label,
  phaseKey,
  progressLabel,
  style,
}: NeuralCoreNarrativeOverlayViewProps): ReactElement => {
  return (
    <div
      key={phaseKey}
      className={styles.overlay}
      style={style}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-neural-core-label-exclusion
    >
      {progressLabel ? <span className={styles.progress}>{progressLabel}</span> : null}
      <strong>{label}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
};
