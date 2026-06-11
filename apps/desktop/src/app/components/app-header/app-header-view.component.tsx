import type { ReactElement } from "react";

import styles from "./app-header.module.css";
import type { AppHeaderViewProps } from "./app-header-view.types";

export const AppHeaderView = ({
  pageTitle,
}: AppHeaderViewProps): ReactElement => {
  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <span>Predator Ubuntu Sense</span>
        <strong>{pageTitle}</strong>
      </div>

      <div className={styles.statusArea} aria-label="Application status">
        <span className={styles.modeChip}>
          <i className={styles.modeIndicator} />
          Balanced Mode
        </span>
        <span className={styles.runtimeChip}>
          <i className={styles.runtimeIndicator} />
          Runtime OK
        </span>
        <span className={styles.osChip}>Ubuntu 24.04 LTS</span>
      </div>
    </header>
  );
};
