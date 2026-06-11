import type { ReactElement } from "react";

import type { PerformanceProfileIconId } from "../../mocks/performance-telemetry.mock";
import styles from "./performance-profile-card.module.css";
import type { PerformanceProfileCardViewProps } from "./performance-profile-card-view.types";

export const PerformanceProfileCardView = ({
  ariaLabel,
  profile,
  visual,
  isUpdating,
  isDisabled,
  onSelect,
}: PerformanceProfileCardViewProps): ReactElement => {
  const statusDotClassName = isUpdating
    ? styles.statusDotApplying
    : profile.isCurrent
    ? styles.statusDotActive
    : styles.statusDotInactive;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={profile.isCurrent}
      className={`${styles.profileCard} ${styles[visual.tone]} ${
        profile.isCurrent ? styles.profileCardActive : ""
      } ${isUpdating ? styles.profileCardApplying : ""}`}
      onClick={onSelect}
      disabled={profile.isCurrent || isDisabled}
    >
      <span
        className={`${styles.statusDot} ${statusDotClassName}`}
        aria-hidden="true"
      />
      <div className={styles.profileIcon}>
        <ProfileIcon id={visual.iconId} />
      </div>
      <span className={styles.profileTitle}>{visual.title}</span>
      <span className={styles.profileDescription}>{visual.description}</span>
    </button>
  );
};

interface ProfileIconProps {
  id: PerformanceProfileIconId;
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
