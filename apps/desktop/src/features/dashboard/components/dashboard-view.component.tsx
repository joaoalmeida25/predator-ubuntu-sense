import type { CSSProperties, ReactElement } from "react";

import { AiCorePreview } from "./ai-core-preview/ai-core-preview.component";
import { DeviceOverviewCard } from "./device-overview-card/device-overview-card.component";
import styles from "./dashboard-view.module.css";
import type { DashboardViewProps } from "./dashboard-view.types";

const getSummaryLines = (value: string, limit = 4): string[] => {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
};

const getMetricStyle = (percent: number): CSSProperties => {
  return {
    "--metric-progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

export const DashboardView = ({
  systemStatus,
  driverStatus,
  isLoading,
  error,
  deviceSpecs,
  performanceMetrics,
  systemMetrics,
  onRefresh,
}: DashboardViewProps): ReactElement => {
  const systemLines = getSummaryLines(systemStatus, 8);
  const driverLines = getSummaryLines(driverStatus, 4);

  return (
    <section className={styles.dashboard}>
      <header className={styles.heroHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.description}>
            Real-time system overview and intelligent control center.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh status"}
        </button>
      </header>

      {error ? (
        <article className={styles.errorCard}>
          <strong>Unable to load current status</strong>
          <pre>{error}</pre>
        </article>
      ) : null}

      <div className={styles.mainGrid}>
        <DeviceOverviewCard
          name="Predator Helios 16"
          model="PHN16-73"
          specs={deviceSpecs}
        />

        <AiCorePreview
          nodeCountLabel="12.8M"
          modelStatus="Adaptive"
          learningRate="98.7%"
          dataFlow="2.4 Tb/s"
        />

        <aside className={styles.rightColumn}>
          <MetricClusterCard
            title="System Status"
            metrics={systemMetrics}
            variant="rings"
          />
          <RuntimeCard title="Driver & Runtime" lines={driverLines} raw={driverStatus} />
          <MetricClusterCard
            title="Performance Summary"
            metrics={performanceMetrics}
            variant="compact"
          />
        </aside>
      </div>

      <RuntimeCard
        title="System Status Output"
        lines={systemLines}
        raw={systemStatus}
        isWide
      />
    </section>
  );
};

interface MetricClusterCardProps {
  title: string;
  metrics: DashboardViewProps["performanceMetrics"];
  variant: "compact" | "rings";
}

const MetricClusterCard = ({
  title,
  metrics,
  variant,
}: MetricClusterCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelTitle title={title} />
      <div className={variant === "rings" ? styles.ringMetricGrid : styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricItem}>
            <div
              className={`${styles.metricRing} ${styles[metric.tone]}`}
              style={getMetricStyle(metric.percent)}
            >
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

interface RuntimeCardProps {
  title: string;
  lines: string[];
  raw: string;
  isWide?: boolean;
}

const RuntimeCard = ({
  title,
  lines,
  raw,
  isWide = false,
}: RuntimeCardProps): ReactElement => {
  return (
    <article className={`${styles.panelCard} ${isWide ? styles.outputCard : ""}`}>
      <PanelTitle title={title} />
      <div className={isWide ? styles.outputList : styles.runtimeList}>
        {lines.length > 0 ? (
          lines.map((line) => (
            <div key={line} className={isWide ? styles.outputRow : styles.runtimeRow}>
              <span>{line}</span>
              {!isWide ? <strong>Real</strong> : null}
            </div>
          ))
        ) : (
          <pre className={styles.rawOutput}>{raw}</pre>
        )}
      </div>
    </article>
  );
};

interface PanelTitleProps {
  title: string;
}

const PanelTitle = ({ title }: PanelTitleProps): ReactElement => {
  return (
    <div className={styles.cardTitleRow}>
      <span className={styles.cardDot} />
      <h2>{title}</h2>
    </div>
  );
};
