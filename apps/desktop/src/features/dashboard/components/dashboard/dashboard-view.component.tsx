import type { CSSProperties, ReactElement } from "react";

import { AiCorePreview } from "../ai-core-preview/ai-core-preview.component";
import { DeviceOverviewCard } from "../device-overview-card/device-overview-card.component";
import styles from "./dashboard.module.css";
import type { DashboardViewProps } from "./dashboard-view.types";

const getMetricStyle = (percent: number): CSSProperties => {
  return {
    "--metric-progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

export const DashboardView = ({
  aiCoreTelemetry,
  systemOutput,
  driverOutput,
  error,
  deviceSpecs,
  performanceMetrics,
  systemMetrics,
}: DashboardViewProps): ReactElement => {
  return (
    <section className={styles.dashboard}>
      <header className={styles.heroHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.description}>
            Real-time system overview and intelligent control center.
          </p>
        </div>
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
          nodeCountLabel={aiCoreTelemetry.nodeCountLabel}
          modelStatus={aiCoreTelemetry.modelStatus}
          learningRate={aiCoreTelemetry.learningRate}
          dataFlow={aiCoreTelemetry.dataFlow}
          engineStatus={aiCoreTelemetry.engineStatus}
          engineVersion={aiCoreTelemetry.engineVersion}
          predictionAccuracy={aiCoreTelemetry.predictionAccuracy}
        />

        <aside className={styles.rightColumn}>
          <MetricClusterCard
            title="System Status"
            metrics={systemMetrics}
            variant="rings"
          />
          <RuntimeCard title="Driver & Runtime" output={driverOutput} />
          <MetricClusterCard
            title="Performance Summary"
            metrics={performanceMetrics}
            variant="compact"
          />
        </aside>
      </div>

      <RuntimeCard
        title="System Status Output"
        output={systemOutput}
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
  output: DashboardViewProps["systemOutput"];
  isWide?: boolean;
}

const RuntimeCard = ({
  title,
  output,
  isWide = false,
}: RuntimeCardProps): ReactElement => {
  return (
    <article className={`${styles.panelCard} ${isWide ? styles.outputCard : ""}`}>
      <PanelTitle title={title} />
      <div className={isWide ? styles.outputList : styles.runtimeList}>
        {output.lines.length > 0 ? (
          output.lines.map((line) => (
            <div key={line} className={isWide ? styles.outputRow : styles.runtimeRow}>
              <span>{line}</span>
              {!isWide ? <strong>Real</strong> : null}
            </div>
          ))
        ) : (
          <pre className={styles.rawOutput}>{output.raw}</pre>
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
