import type { CSSProperties, ReactElement } from "react";

import styles from "./thermal-overview-card.module.css";
import type { ThermalOverviewCardViewProps } from "./thermal-overview-card-view.types";

const getProgressStyle = (percent: number): CSSProperties => {
  return {
    "--progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

export const ThermalOverviewCardView = ({
  metrics,
  thermalImageUrl,
}: ThermalOverviewCardViewProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelHeader title="Thermal Overview" label="Balanced cooling" />
      <img className={styles.thermalImage} src={thermalImageUrl} alt="" />
      <div className={styles.thermalList}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.thermalRow}>
            <div>
              <strong>{metric.label}</strong>
              <span>{metric.value}</span>
            </div>
            <div className={styles.thermalTrack}>
              <span style={getProgressStyle(metric.percent)} />
            </div>
          </div>
        ))}
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
