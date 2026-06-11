import type { CSSProperties, ReactElement } from "react";

import styles from "./system-performance-card.module.css";
import type { SystemPerformanceCardViewProps } from "./system-performance-card-view.types";

const getProgressStyle = (percent: number): CSSProperties => {
  return {
    "--progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

export const SystemPerformanceCardView = ({
  metrics,
}: SystemPerformanceCardViewProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelHeader title="System Performance" label="Real-time" />
      <div className={styles.gaugeGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.gaugeItem}>
            <div className={styles.gauge} style={getProgressStyle(metric.percent)}>
              <span>{metric.value}</span>
            </div>
            <strong>{metric.label}</strong>
            <small>{metric.detail}</small>
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
