import type { CSSProperties, ReactElement } from "react";

import thermalRenderUrl from "../../../shared/assets/thermal-underside-render.svg";
import type {
  PerformanceProfile,
  PerformanceProfileId,
} from "../../../shared/types/performance-profile.type";
import styles from "./performance-view.module.css";
import type { PerformanceViewProps } from "./performance-view.types";

const getProgressStyle = (percent: number): CSSProperties => {
  return {
    "--progress": `${Math.max(0, Math.min(percent, 100))}%`,
  } as CSSProperties;
};

const getActiveProfile = (
  profiles: PerformanceProfile[],
): PerformanceProfile | null => {
  return profiles.find((profile) => profile.isCurrent) ?? profiles[0] ?? null;
};

export const PerformanceView = ({
  profilesState,
  updatingProfileId,
  profileVisuals,
  systemMetrics,
  thermalMetrics,
  onRefresh,
  onProfileChange,
}: PerformanceViewProps): ReactElement => {
  const profiles = profilesState.data ?? [];
  const activeProfile = getActiveProfile(profiles);
  const activeVisual = activeProfile ? profileVisuals[activeProfile.id] : null;
  const isLoading = profilesState.status === "loading";

  return (
    <section className={styles.performance}>
      <header className={styles.heroHeader}>
        <div>
          <h1 className={styles.title}>Performance</h1>
          <p className={styles.description}>
            Optimize system performance and fan behavior for any scenario.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.activeSummary}>
            <span className={`${styles.activeDot} ${activeVisual ? styles[activeVisual.tone] : ""}`} />
            <div>
              <strong>{activeVisual?.title ?? "Unknown"} Mode</strong>
              <span>Active Profile</span>
            </div>
          </div>
          <button type="button" className={styles.managerButton} disabled>
            Profile Manager
          </button>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {profilesState.status === "error" ? (
        <article className={styles.errorCard}>
          <strong>Unable to load or apply profile</strong>
          <pre>{profilesState.error}</pre>
        </article>
      ) : null}

      <div className={styles.profileGrid}>
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            visual={profileVisuals[profile.id]}
            isUpdating={updatingProfileId === profile.id}
            isDisabled={updatingProfileId !== null}
            onProfileChange={onProfileChange}
          />
        ))}
      </div>

      <div className={styles.supportGrid}>
        <SystemPerformanceCard metrics={systemMetrics} />
        <ThermalOverviewCard metrics={thermalMetrics} />
        <FanCoolingCard />
      </div>
    </section>
  );
};

interface ProfileCardProps {
  profile: PerformanceProfile;
  visual: PerformanceViewProps["profileVisuals"][PerformanceProfileId];
  isUpdating: boolean;
  isDisabled: boolean;
  onProfileChange: PerformanceViewProps["onProfileChange"];
}

const ProfileCard = ({
  profile,
  visual,
  isUpdating,
  isDisabled,
  onProfileChange,
}: ProfileCardProps): ReactElement => {
  const buttonLabel = isUpdating ? "Applying..." : profile.isCurrent ? "Active" : "Activate";

  return (
    <article
      className={`${styles.profileCard} ${styles[visual.tone]} ${
        profile.isCurrent ? styles.profileCardActive : ""
      }`}
    >
      {profile.isCurrent ? <span className={styles.currentCheck}>✓</span> : null}
      <div className={styles.profileIcon}>
        <ProfileIcon id={visual.iconId} />
      </div>
      <h2>{visual.title}</h2>
      <p>{visual.description}</p>
      <button
        type="button"
        onClick={() => onProfileChange(profile.id)}
        disabled={profile.isCurrent || isDisabled}
      >
        {buttonLabel}
      </button>
    </article>
  );
};

interface ProfileIconProps {
  id: PerformanceViewProps["profileVisuals"][PerformanceProfileId]["iconId"];
}

const ProfileIcon = ({ id }: ProfileIconProps): ReactElement => {
  switch (id) {
    case "leaf":
      return <LeafIcon />;
    case "waves":
      return <WavesIcon />;
    case "scale":
      return <ScaleIcon />;
    case "gauge":
      return <GaugeIcon />;
    case "swirl":
      return <SwirlIcon />;
  }
};

interface SystemPerformanceCardProps {
  metrics: PerformanceViewProps["systemMetrics"];
}

const SystemPerformanceCard = ({
  metrics,
}: SystemPerformanceCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelHeader title="System Performance" label="Real-time placeholder" />
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

interface ThermalOverviewCardProps {
  metrics: PerformanceViewProps["thermalMetrics"];
}

const ThermalOverviewCard = ({
  metrics,
}: ThermalOverviewCardProps): ReactElement => {
  return (
    <article className={styles.panelCard}>
      <PanelHeader title="Thermal Overview" label="Balanced cooling" />
      <img className={styles.thermalImage} src={thermalRenderUrl} alt="" />
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

const FanCoolingCard = (): ReactElement => {
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
        <strong>2200 RPM</strong>
      </div>
      <div className={styles.fanTrack}>
        <span />
      </div>
    </article>
  );
};

interface PanelHeaderProps {
  title: string;
  label: string;
}

const PanelHeader = ({ title, label }: PanelHeaderProps): ReactElement => {
  return (
    <div className={styles.panelHeader}>
      <h2>{title}</h2>
      <span>{label}</span>
    </div>
  );
};

const LeafIcon = (): ReactElement => (
  <svg viewBox="0 0 64 64" role="img"><path d="M52 8C27 10 12 25 13 48c20 2 36-11 39-40ZM17 47c7-13 17-22 31-32" /></svg>
);

const WavesIcon = (): ReactElement => (
  <svg viewBox="0 0 64 64" role="img"><path d="M9 22c8-8 15 8 23 0s15 8 23 0M9 34c8-8 15 8 23 0s15 8 23 0M9 46c8-8 15 8 23 0s15 8 23 0" /></svg>
);

const ScaleIcon = (): ReactElement => (
  <svg viewBox="0 0 64 64" role="img"><path d="M32 9v44M17 17h30M18 17l-9 18h18L18 17Zm28 0-9 18h18l-9-18ZM22 53h20" /></svg>
);

const GaugeIcon = (): ReactElement => (
  <svg viewBox="0 0 64 64" role="img"><path d="M10 43a22 22 0 1 1 44 0M32 43l10-18M19 43h26" /></svg>
);

const SwirlIcon = (): ReactElement => (
  <svg viewBox="0 0 64 64" role="img"><path d="M32 8c15 0 20 18 9 27 11-1 15 12 5 18-13 8-30-3-26-17-10 5-17-8-9-17 6-7 16-8 21-11Z" /></svg>
);

const FanIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img"><path d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm1-8c5 1 6 6 2 9 5-2 8 2 6 7-3 4-8 3-9-2-1 5-6 6-9 2-2-5 1-9 6-7-4-3-3-8 2-9h2Z" /></svg>
);

const SlidersIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8-10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
);
