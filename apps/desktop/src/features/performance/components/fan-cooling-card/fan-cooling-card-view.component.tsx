import type { CSSProperties, ReactElement } from "react";

import styles from "./fan-cooling-card.module.css";
import type { FanCoolingCardViewProps } from "./fan-cooling-card-view.types";

const getFanTrackStyle = (percent: number): CSSProperties => {
  return {
    "--fan-progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

export const FanCoolingCardView = ({
  coolingTelemetry,
}: FanCoolingCardViewProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelHeader title="Fan & Cooling" label="Auto mode" />
      <div className={styles.modeGrid}>
        <button type="button" className={styles.modeButtonActive} disabled>
          <FanIcon />
          <strong>Auto</strong>
          <span>Smart Cooling</span>
        </button>
        <button type="button" className={styles.modeButton} disabled>
          <FanIcon />
          <strong>Max</strong>
          <span>Full Speed</span>
        </button>
        <button type="button" className={styles.modeButton} disabled>
          <SlidersIcon />
          <strong>Custom</strong>
          <span>Manual Curve</span>
        </button>
      </div>
      <div className={styles.fanSpeedRow}>
        <span>Fan Speed</span>
        <strong>{coolingTelemetry.fanSpeedLabel}</strong>
      </div>
      <div className={styles.fanTrack}>
        <span style={getFanTrackStyle(coolingTelemetry.fanSpeedPercent)} />
      </div>
    </article>
  );
};

interface PanelHeaderProps {
  label: string;
  title: string;
}

const PanelHeader = ({ title, label }: PanelHeaderProps): ReactElement => {
  return (
    <div className={styles.panelHeader}>
      <h2>{title}</h2>
      <span>{label}</span>
    </div>
  );
};

const FanIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img"><path d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm1-8c5 1 6 6 2 9 5-2 8 2 6 7-3 4-8 3-9-2-1 5-6 6-9 2-2-5 1-9 6-7-4-3-3-8 2-9h2Z" /></svg>
);

const SlidersIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8-10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
);
