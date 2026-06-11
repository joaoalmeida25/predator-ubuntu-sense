import type { ReactElement } from "react";

import { FanCoolingCard } from "../fan-cooling-card/fan-cooling-card.component";
import { PerformanceProfileCard } from "../performance-profile-card/performance-profile-card.component";
import { SystemPerformanceCard } from "../system-performance-card/system-performance-card.component";
import { ThermalOverviewCard } from "../thermal-overview-card/thermal-overview-card.component";
import styles from "./performance.module.css";
import type { PerformanceViewProps } from "./performance-view.types";

export const PerformanceView = ({
  profiles,
  updatingProfileId,
  activeProfileTitle,
  activeProfileTone,
  profileVisuals,
  systemMetrics,
  thermalMetrics,
  error,
  onProfileChange,
}: PerformanceViewProps): ReactElement => {
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
            <span
              className={`${styles.activeDot} ${
                activeProfileTone ? styles[activeProfileTone] : ""
              }`}
            />
            <div>
              <strong>{activeProfileTitle} Mode</strong>
              <span>Active Profile</span>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <article className={styles.errorCard}>
          <strong>Unable to load or apply profile</strong>
          <pre>{error}</pre>
        </article>
      ) : null}

      <div className={styles.profileGrid}>
        {profiles.map((profile) => (
          <PerformanceProfileCard
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
