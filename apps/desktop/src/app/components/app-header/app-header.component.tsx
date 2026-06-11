import type { ReactElement } from "react";

import type { AppPageId } from "../../app.types";
import { AppHeaderView } from "./app-header-view.component";

interface AppHeaderProps {
  activePage: AppPageId;
}

const pageTitles: Record<AppPageId, string> = {
  dashboard: "Dashboard",
  performance: "Performance",
  system: "System",
  lighting: "Lighting",
  power: "Power",
  thermal: "Thermal",
  devices: "Devices",
  settings: "Settings",
};

export const AppHeader = ({ activePage }: AppHeaderProps): ReactElement => {
  return <AppHeaderView pageTitle={pageTitles[activePage]} />;
};
