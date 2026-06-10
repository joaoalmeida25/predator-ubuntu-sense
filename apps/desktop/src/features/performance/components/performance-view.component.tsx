import type { CSSProperties, ReactElement } from "react";

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
          <p className={styles.eyebrow}>Performance</p>
          <h1 className={styles.title}>Power Profiles</h1>
          <p className={styles.description}>
            Optimize system performance and fan behavior for each scenario.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.activeSummary}>
            <span className={styles.activeDot} />
            <div>
              <strong>{activeVisual?.title ?? "Unknown"}</strong>
              <span>Active Profile</span>
            </div>
          </div>
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
        <ActiveProfileInfoCard activeVisual={activeVisual} />
      </div>

      <PerformanceActionStrip />
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
      {profile.isCurrent ? <span className={styles.currentCheck}>OK</span> : null}
      <div className={styles.profileIcon}>{visual.iconLabel}</div>
      <h2>{visual.title}</h2>
      <p>{visual.description}</p>
      <span className={styles.profileId}>{profile.id}</span>
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
      <div className={styles.thermalMock}>
        <div className={styles.fanGlowLeft} />
        <div className={styles.fanGlowRight} />
      </div>
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
          <strong>Auto</strong>
          <span>Smart Cooling</span>
        </button>
        <button type="button" className={styles.modeButton} disabled>
          <strong>Max</strong>
          <span>Full Speed</span>
        </button>
        <button type="button" className={styles.modeButton} disabled>
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

interface ActiveProfileInfoCardProps {
  activeVisual: PerformanceViewProps["profileVisuals"][PerformanceProfileId] | null;
}

const ActiveProfileInfoCard = ({
  activeVisual,
}: ActiveProfileInfoCardProps): ReactElement => {
  return (
    <article className={`${styles.panelCard} ${styles.profileInfoCard}`}>
      <PanelHeader title="Active Profile Info" label={activeVisual?.title ?? "Unknown"} />
      <p className={styles.infoDescription}>
        {activeVisual?.description ?? "No active performance profile was reported."}
      </p>
      <ul className={styles.infoList}>
        {(activeVisual?.infoBullets ?? ["Waiting for profile data"]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
};

const PerformanceActionStrip = (): ReactElement => {
  return (
    <div className={styles.actionStrip}>
      <ActionToggle title="Overclocking" value="Disabled" />
      <ActionToggle title="Dynamic Boost" value="Enabled" isActive />
      <ActionToggle title="GPU Overclock" value="Disabled" />
      <button type="button" className={styles.advancedButton} disabled>
        Advanced Settings
      </button>
    </div>
  );
};

interface ActionToggleProps {
  title: string;
  value: string;
  isActive?: boolean;
}

const ActionToggle = ({
  title,
  value,
  isActive = false,
}: ActionToggleProps): ReactElement => {
  return (
    <button type="button" className={styles.actionToggle} disabled>
      <span>{title}</span>
      <strong>{value}</strong>
      <i className={isActive ? styles.switchOn : styles.switchOff} />
    </button>
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
