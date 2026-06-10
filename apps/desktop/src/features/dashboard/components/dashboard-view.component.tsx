import type { ReactElement } from "react";

import styles from "./dashboard-view.module.css";
import type { DashboardViewProps } from "./dashboard-view.types";

export const DashboardView = ({
  systemStatus,
  driverStatus,
  isLoading,
  error,
  onRefresh,
}: DashboardViewProps): ReactElement => {
  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Predator Ubuntu Sense</p>
          <h1 className={styles.title}>Linux control center</h1>
          <p className={styles.description}>
            Dashboard inicial consumindo os comandos locais do predatorctl.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error ? (
        <article className={styles.errorCard}>
          <strong>Erro ao carregar status</strong>
          <pre className={styles.output}>{error}</pre>
        </article>
      ) : null}

      <div className={styles.grid}>
        <article className={styles.statusCard}>
          <h2 className={styles.cardTitle}>System status</h2>
          <pre className={styles.output}>{systemStatus}</pre>
        </article>

        <article className={styles.statusCard}>
          <h2 className={styles.cardTitle}>Driver runtime</h2>
          <pre className={styles.output}>{driverStatus}</pre>
        </article>
      </div>
    </section>
  );
};
