import type { ReactElement } from "react";

import styles from "./app-header.module.css";
import type { AppPageId } from "./app.types";

interface AppHeaderProps {
  activePage: AppPageId;
}

const pageTitles: Record<AppPageId, string> = {
  dashboard: "Dashboard",
  performance: "Performance",
  system: "System",
  lighting: "Lighting",
  network: "Network",
  devices: "Devices",
  power: "Power",
  settings: "Settings",
};

export const AppHeader = ({ activePage }: AppHeaderProps): ReactElement => {
  return (
    <header className={styles.header}>
      <div className={styles.contextGroup}>
        <span className={styles.pill}>AI Assistant</span>
        <span className={styles.separator} />
        <span className={styles.contextLabel}>Scenario</span>
        <strong>{pageTitles[activePage]}</strong>
      </div>

      <div className={styles.actionGroup} aria-label="Application status">
        <span className={styles.statusChip}>Fan Auto</span>
        <span className={styles.statusChip}>Ubuntu 24.04 LTS</span>
        <button type="button" className={styles.iconButton} disabled>
          Alerts
        </button>
        <button type="button" className={styles.iconButton} disabled>
          Settings
        </button>
      </div>
    </header>
  );
};
