import type { ReactElement } from "react";

import type { AppPageId } from "../../app.types";
import styles from "./app-sidebar.module.css";
import type { AppSidebarViewProps } from "./app-sidebar-view.types";

export const AppSidebarView = ({
  activePage,
  brandMarkUrl,
  deviceImageUrl,
  navigationItems,
  onPageChange,
}: AppSidebarViewProps): ReactElement => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img className={styles.brandMark} src={brandMarkUrl} alt="" />
        <div>
          <p className={styles.brandTitle}>Predator</p>
          <p className={styles.brandSubtitle}>Ubuntu Sense</p>
        </div>
      </div>

      <nav className={styles.navigation} aria-label="Primary navigation">
        {navigationItems.map((item) => {
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
        <img className={styles.deviceImage} src={deviceImageUrl} alt="" />
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
    case "power":
      return <BatteryIcon />;
    case "thermal":
      return <ThermalIcon />;
    case "devices":
      return <DeviceIcon />;
    case "settings":
      return <SettingsIcon />;
  }
};

const IconSvg = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
  >
    {children}
  </svg>
);

const HomeIcon = (): ReactElement => (
  <IconSvg>
    <path d="M3.5 11.2 12 4.4l8.5 6.8" />
    <path d="M5.5 10.5v8.4h4.2v-5.2h4.6v5.2h4.2v-8.4" />
  </IconSvg>
);

const GaugeIcon = (): ReactElement => (
  <IconSvg>
    <path d="M4.2 16.5a7.8 7.8 0 1 1 15.6 0" />
    <path d="m12 16 4-6" />
    <path d="M7.2 16.5h9.6" />
    <path d="M6.7 12.4l-1.5-.9M17.3 12.4l1.5-.9M12 8.6V6.9" />
  </IconSvg>
);

const MonitorIcon = (): ReactElement => (
  <IconSvg>
    <path d="M4.5 5.5h15v10.2h-15z" />
    <path d="M9.2 19.5h5.6" />
    <path d="M12 15.7v3.8" />
  </IconSvg>
);

const SunIcon = (): ReactElement => (
  <IconSvg>
    <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
  </IconSvg>
);

const BatteryIcon = (): ReactElement => (
  <IconSvg>
    <path d="M6.5 4.5h8.8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" />
    <path d="M9 2.5h4" />
    <path d="M9.2 13.2h2.4l-1 4 3.4-5.6h-2.5l1-3.6-3.3 5.2Z" />
  </IconSvg>
);

const ThermalIcon = (): ReactElement => (
  <IconSvg>
    <path d="M10 13.7V5.8a2 2 0 0 1 4 0v7.9" />
    <path d="M8.2 16.6a3.8 3.8 0 1 0 7.6 0 4.1 4.1 0 0 0-1.8-3.3" />
    <path d="M12 8.2v7.2" />
  </IconSvg>
);

const DeviceIcon = (): ReactElement => (
  <IconSvg>
    <path d="M5 5h14v10H5z" />
    <path d="M3.5 18.8h17" />
    <path d="m5 15-1.5 3.8M19 15l1.5 3.8" />
  </IconSvg>
);

const SettingsIcon = (): ReactElement => (
  <IconSvg>
    <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
    <path d="m19.4 13.3 1.1.8-1.3 2.4-1.4-.4a7.4 7.4 0 0 1-1.4 1l-.3 1.5h-2.8l-.3-1.5a7.4 7.4 0 0 1-1.5-.6l-1.3.7-2-2 .7-1.3a7.4 7.4 0 0 1-.6-1.5l-1.5-.3V9.3L8 9a7.4 7.4 0 0 1 .6-1.5l-.7-1.3 2-2 1.3.7a7.4 7.4 0 0 1 1.5-.6l.3-1.5h2.8l.3 1.5a7.4 7.4 0 0 1 1.4.8l1.4-.4 1.3 2.4-1.1.8a7.4 7.4 0 0 1 .2 1.7Z" />
  </IconSvg>
);
