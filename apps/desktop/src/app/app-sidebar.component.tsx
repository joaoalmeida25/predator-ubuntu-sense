import type { ReactElement } from "react";

import { appNavigationItems } from "./app-navigation.config";
import styles from "./app-sidebar.module.css";
import type { AppPageId } from "./app.types";

interface AppSidebarProps {
  activePage: AppPageId;
  onPageChange: (pageId: AppPageId) => void;
}

export const AppSidebar = ({
  activePage,
  onPageChange,
}: AppSidebarProps): ReactElement => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>P</div>
        <div>
          <p className={styles.brandTitle}>Predator</p>
          <p className={styles.brandSubtitle}>Ubuntu Sense</p>
        </div>
      </div>

      <nav className={styles.navigation} aria-label="Primary navigation">
        {appNavigationItems.map((item) => {
          const isActive = item.id === activePage;

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? styles.navItemActive : styles.navItem}
              onClick={() => onPageChange(item.id)}
              disabled={!item.isEnabled}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.statusLabel ? (
                <span className={styles.navStatus}>{item.statusLabel}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <section className={styles.deviceCard} aria-label="Current device">
        <div className={styles.deviceGlow} />
        <div className={styles.deviceBadge}>PH</div>
        <p className={styles.deviceName}>Predator Helios 16</p>
        <p className={styles.deviceModel}>PHN16-73</p>
        <div className={styles.onlineRow}>
          <span className={styles.onlineDot} />
          Online
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Ubuntu 24.04 LTS</span>
      </footer>
    </aside>
  );
};
