import type { ReactElement } from "react";

import styles from "./app-layout.module.css";
import type { AppLayoutViewProps } from "./app-layout-view.types";

export const AppLayoutView = ({
  children,
  header,
  sidebar,
}: AppLayoutViewProps): ReactElement => {
  return (
    <main className={styles.shell}>
      {sidebar}
      <div className={styles.workspace}>
        {header}
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
};
