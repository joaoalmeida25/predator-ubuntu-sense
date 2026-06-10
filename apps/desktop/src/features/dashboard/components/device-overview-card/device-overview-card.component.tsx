import type { ReactElement } from "react";

import styles from "./device-overview-card.module.css";
import type { DeviceOverviewCardProps } from "./device-overview-card.types";

export const DeviceOverviewCard = ({
  name,
  model,
  specs,
}: DeviceOverviewCardProps): ReactElement => {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.dot} />
        <h2>Device Overview</h2>
      </div>

      <div className={styles.deviceMock} aria-label="Device placeholder">
        <div className={styles.screen}>
          <span>P</span>
        </div>
        <div className={styles.keyboard} />
      </div>

      <div className={styles.identity}>
        <strong>{name}</strong>
        <span>{model}</span>
      </div>

      <dl className={styles.specList}>
        {specs.map((spec) => (
          <div key={spec.label} className={styles.specRow}>
            <dt>{spec.label}</dt>
            <dd>{spec.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
};
