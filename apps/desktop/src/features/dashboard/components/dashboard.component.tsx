import type { ReactElement } from "react";

import {
  dashboardPerformanceMetrics,
  dashboardPowerMock,
  dashboardQuickActions,
  dashboardTemperatureMetrics,
} from "../dashboard.mock";
import { useDashboardStatus } from "../hooks/use-dashboard-status/use-dashboard-status.hook";
import type { DashboardStatusData } from "../hooks/use-dashboard-status/use-dashboard-status.types";
import { DashboardView } from "./dashboard-view.component";
import type { DeviceOverviewSpec } from "./device-overview-card/device-overview-card.types";

const loadingStatusData: DashboardStatusData = {
  systemStatus: "Loading system status...",
  driverStatus: "Loading driver runtime...",
};

const deviceSpecs: DeviceOverviewSpec[] = [
  { label: "OS", value: "Ubuntu 24.04 LTS" },
  { label: "CPU", value: "Intel Core i9 class" },
  { label: "GPU", value: "NVIDIA GeForce RTX" },
  { label: "RAM", value: "32 GB DDR5" },
  { label: "Storage", value: "2 TB PCIe Gen4 SSD" },
  { label: "Display", value: "16 inch WQXGA 240Hz" },
];

export const Dashboard = (): ReactElement => {
  const { statusState, refresh } = useDashboardStatus();
  const statusData = statusState.data ?? loadingStatusData;
  const isLoading =
    statusState.status === "idle" || statusState.status === "loading";

  const handleRefresh = (): void => {
    void refresh();
  };

  return (
    <DashboardView
      systemStatus={statusData.systemStatus}
      driverStatus={statusData.driverStatus}
      isLoading={isLoading}
      error={statusState.error}
      deviceSpecs={deviceSpecs}
      performanceMetrics={dashboardPerformanceMetrics}
      temperatureMetrics={dashboardTemperatureMetrics}
      power={dashboardPowerMock}
      quickActions={dashboardQuickActions}
      onRefresh={handleRefresh}
    />
  );
};
