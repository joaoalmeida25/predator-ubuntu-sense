import type { ReactElement } from "react";

import styles from "./device-overview-card.module.css";
import type { DeviceOverviewCardViewProps } from "./device-overview-card-view.types";

export const DeviceOverviewCardView = ({
  deviceImageUrl,
  name,
  model,
  specs,
}: DeviceOverviewCardViewProps): ReactElement => {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.dot} />
        <h2>Device Overview</h2>
      </div>

      <img className={styles.deviceImage} src={deviceImageUrl} alt="" />

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
