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
      <div className={styles.breadcrumb}>
        <span>Predator Ubuntu Sense</span>
        <strong>{pageTitles[activePage]}</strong>
      </div>

      <div className={styles.statusArea} aria-label="Application status">
        <span className={styles.modeChip}>
          <i />
          Balanced Mode
        </span>
      </div>
    </header>
  );
};
