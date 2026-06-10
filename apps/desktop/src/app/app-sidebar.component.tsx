import type { ReactElement } from "react";

import laptopRenderUrl from "../shared/assets/predator-laptop-render.svg";
import predatorMarkUrl from "../shared/assets/predator-ubuntu-mark.svg";
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
        <img className={styles.brandMark} src={predatorMarkUrl} alt="" />
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
              <span className={styles.navIcon} aria-hidden="true">
                <NavIcon id={item.id} />
              </span>
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
        <img className={styles.deviceImage} src={laptopRenderUrl} alt="" />
        <p className={styles.deviceName}>Predator Helios 16</p>
        <p className={styles.deviceModel}>PHN16-73</p>
        <div className={styles.osRow}>
          <span className={styles.ubuntuDot} />
          Ubuntu 24.04 LTS
        </div>
        <div className={styles.onlineRow}>
          <span className={styles.onlineDot} />
          Online
        </div>
      </section>
    </aside>
  );
};

interface NavIconProps {
  id: AppPageId;
}

const NavIcon = ({ id }: NavIconProps): ReactElement => {
  switch (id) {
    case "dashboard":
      return <HomeIcon />;
    case "performance":
      return <GaugeIcon />;
    case "system":
      return <MonitorIcon />;
    case "lighting":
      return <SunIcon />;
    case "network":
      return <GlobeIcon />;
    case "devices":
      return <DeviceIcon />;
    case "power":
      return <PowerIcon />;
    case "settings":
      return <SettingsIcon />;
  }
};

const HomeIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M3 11.4 12 4l9 7.4v8.1a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6.2H8.7V21H4.5A1.5 1.5 0 0 1 3 19.5v-8.1Z" />
  </svg>
);

const GaugeIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M4 14a8 8 0 1 1 16 0v3H4v-3Zm4.2.4 3.2-5.3 1.2.7-2.4 5.8-2-.2Z" />
  </svg>
);

const MonitorIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M4 5h16v11H4V5Zm6.5 13h3v2h3v1h-9v-1h3v-2Z" />
  </svg>
);

const SunIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M11 2h2v4h-2V2Zm0 16h2v4h-2v-4ZM2 11h4v2H2v-2Zm16 0h4v2h-4v-2ZM4.2 5.6l1.4-1.4L8.4 7 7 8.4 4.2 5.6Zm11.4 11.4 1.4-1.4 2.8 2.8-1.4 1.4-2.8-2.8Zm2.8-12.8 1.4 1.4L17 8.4 15.6 7l2.8-2.8ZM7 15.6 8.4 17l-2.8 2.8-1.4-1.4L7 15.6ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
  </svg>
);

const GlobeIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.8 9h-3.1a15.2 15.2 0 0 0-1.1-5A8 8 0 0 1 18.8 11ZM12 4.1c.8 1.2 1.4 3.3 1.6 6.9h-3.2c.2-3.6.8-5.7 1.6-6.9ZM4.2 13h3.1c.2 2 .6 3.8 1.1 5A8 8 0 0 1 4.2 13Zm3.1-2H4.2A8 8 0 0 1 8.4 6a15.2 15.2 0 0 0-1.1 5ZM12 19.9c-.8-1.2-1.4-3.3-1.6-6.9h3.2c-.2 3.6-.8 5.7-1.6 6.9Zm3.6-1.9c.5-1.2.9-3 1.1-5h3.1a8 8 0 0 1-4.2 5Z" />
  </svg>
);

const DeviceIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M6 4h12v12H6V4Zm-2 14h16l1 2H3l1-2Z" />
  </svg>
);

const PowerIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M11 2h2v10h-2V2Zm-3.8 4.3 1.5 1.4A6 6 0 1 0 15.3 7.7l1.5-1.4A8 8 0 1 1 7.2 6.3Z" />
  </svg>
);

const SettingsIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" role="img">
    <path d="M10.5 2h3l.5 2.4c.5.2 1 .4 1.4.8l2.3-1 2.1 2.1-1 2.3c.3.5.6.9.8 1.4l2.4.5v3l-2.4.5c-.2.5-.4 1-.8 1.4l1 2.3-2.1 2.1-2.3-1c-.5.3-.9.6-1.4.8l-.5 2.4h-3l-.5-2.4c-.5-.2-1-.4-1.4-.8l-2.3 1-2.1-2.1 1-2.3c-.3-.5-.6-.9-.8-1.4L2 13.5v-3l2.4-.5c.2-.5.4-1 .8-1.4l-1-2.3 2.1-2.1 2.3 1c.5-.3.9-.6 1.4-.8L10.5 2Zm1.5 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  </svg>
);
