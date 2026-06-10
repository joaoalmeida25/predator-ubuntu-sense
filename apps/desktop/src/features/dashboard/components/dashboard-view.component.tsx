import type { CSSProperties, ReactElement } from "react";

import { AiCorePreview } from "./ai-core-preview/ai-core-preview.component";
import { DeviceOverviewCard } from "./device-overview-card/device-overview-card.component";
import styles from "./dashboard-view.module.css";
import type { DashboardViewProps } from "./dashboard-view.types";

const getSummaryLines = (value: string): string[] => {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
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
  temperatureMetrics,
  power,
  quickActions,
  onRefresh,
}: DashboardViewProps): ReactElement => {
  const systemLines = getSummaryLines(systemStatus);
  const driverLines = getSummaryLines(driverStatus);

  return (
    <section className={styles.dashboard}>
      <header className={styles.heroHeader}>
        <div>
          <p className={styles.eyebrow}>Predator Ubuntu Sense</p>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.description}>
            Linux control center with real runtime status and prepared visual telemetry.
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
        <div className={styles.leftColumn}>
          <DeviceOverviewCard
            name="Predator Helios 16"
            model="PHN16-73"
            specs={deviceSpecs}
          />
        </div>

        <AiCorePreview
          nodeCountLabel="12.8M"
          modelStatus="Adaptive"
          learningRate="98.7%"
          dataFlow="2.4 Tb/s"
        />

        <aside className={styles.rightColumn}>
          <MetricClusterCard
            title="System Status"
            metrics={temperatureMetrics}
            variant="rings"
          />
          <RuntimeCard title="Driver & Runtime" lines={driverLines} raw={driverStatus} />
          <LightingCard />
        </aside>
      </div>

      <div className={styles.bottomGrid}>
        <MetricClusterCard
          title="Performance Summary"
          metrics={performanceMetrics}
          variant="compact"
        />
        <TemperatureGraphCard />
        <PowerCard power={power} />
        <QuickActionsCard actions={quickActions} />
      </div>

      <div className={styles.rawStatusGrid}>
        <RuntimeCard title="System Status Output" lines={systemLines} raw={systemStatus} />
      </div>
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
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>{title}</h2>
      </div>
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
}

const RuntimeCard = ({ title, lines, raw }: RuntimeCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>{title}</h2>
      </div>
      <div className={styles.runtimeList}>
        {lines.length > 0 ? (
          lines.map((line) => (
            <div key={line} className={styles.runtimeRow}>
              <span>{line}</span>
              <strong>Real</strong>
            </div>
          ))
        ) : (
          <pre className={styles.rawOutput}>{raw}</pre>
        )}
      </div>
    </article>
  );
};

const LightingCard = (): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>RGB & Lighting</h2>
      </div>
      <div className={styles.lightingPalette} aria-label="Lighting placeholder palette">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className={styles.sliderRow}>
        <span>Keyboard</span>
        <strong>100%</strong>
      </div>
      <div className={styles.sliderTrack}>
        <span style={{ width: "100%" }} />
      </div>
      <div className={styles.sliderRow}>
        <span>Light Bar</span>
        <strong>80%</strong>
      </div>
      <div className={styles.sliderTrack}>
        <span style={{ width: "80%" }} />
      </div>
    </article>
  );
};

const TemperatureGraphCard = (): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>Temperature Overview</h2>
      </div>
      <div className={styles.chart}>
        <svg viewBox="0 0 420 160" role="img">
          <title>Temperature placeholder chart</title>
          <path className={styles.chartGrid} d="M0 120H420 M0 80H420 M0 40H420" />
          <path
            className={styles.cpuLine}
            d="M0 100 C25 58 45 60 68 86 S110 94 134 68 S185 66 210 88 S260 96 286 70 S335 62 360 84 S395 88 420 72"
          />
          <path
            className={styles.gpuLine}
            d="M0 126 C32 108 50 112 70 101 S108 118 138 104 S184 108 214 116 S258 126 292 110 S338 102 362 116 S394 122 420 112"
          />
        </svg>
      </div>
    </article>
  );
};

interface PowerCardProps {
  power: DashboardViewProps["power"];
}

const PowerCard = ({ power }: PowerCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>System Power</h2>
      </div>
      <div className={styles.powerLayout}>
        <div>
          <span>Total Power Draw</span>
          <strong>{power.totalDraw}</strong>
        </div>
        <div>
          <span>Battery</span>
          <strong>{power.battery}</strong>
        </div>
        <div>
          <span>Estimated</span>
          <strong>{power.estimate}</strong>
        </div>
        <div>
          <span>Power Plan</span>
          <strong>{power.plan}</strong>
        </div>
      </div>
    </article>
  );
};

interface QuickActionsCardProps {
  actions: DashboardViewProps["quickActions"];
}

const QuickActionsCard = ({ actions }: QuickActionsCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <div className={styles.cardTitleRow}>
        <span className={styles.cardDot} />
        <h2>Quick Actions</h2>
      </div>
      <div className={styles.quickGrid}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={styles.quickButton}
            disabled={!action.isEnabled}
          >
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </button>
        ))}
      </div>
    </article>
  );
};
