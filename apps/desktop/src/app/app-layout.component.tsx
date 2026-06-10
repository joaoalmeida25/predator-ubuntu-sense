import type { ReactElement, ReactNode } from "react";

import { AppHeader } from "./app-header.component";
import styles from "./app-layout.module.css";
import { AppSidebar } from "./app-sidebar.component";
import type { AppPageId } from "./app.types";

interface AppLayoutProps {
  activePage: AppPageId;
  children: ReactNode;
  onPageChange: (pageId: AppPageId) => void;
}

export const AppLayout = ({
  activePage,
  children,
  onPageChange,
}: AppLayoutProps): ReactElement => {
  return (
    <main className={styles.shell}>
      <AppSidebar activePage={activePage} onPageChange={onPageChange} />
      <div className={styles.workspace}>
        <AppHeader activePage={activePage} />
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  );
};
