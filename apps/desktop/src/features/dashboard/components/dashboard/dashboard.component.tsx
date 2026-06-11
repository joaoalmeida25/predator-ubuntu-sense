import type { ReactElement } from "react";

import {
  dashboardAiCoreTelemetry,
  dashboardPerformanceMetrics,
  dashboardSystemMetrics,
} from "../../mocks/dashboard-telemetry.mock";
import { useDashboardStatus } from "../../hooks/use-dashboard-status/use-dashboard-status.hook";
import type { DashboardStatusData } from "../../hooks/use-dashboard-status/use-dashboard-status.types";
import { DashboardView } from "./dashboard-view.component";
import type {
  DashboardRuntimeOutput,
} from "./dashboard-view.types";
import type { DeviceOverviewSpec } from "../device-overview-card/device-overview-card-view.types";

const loadingStatusData: DashboardStatusData = {
  systemStatus: "Loading system status...",
  driverStatus: "Loading driver runtime...",
};

const deviceSpecs: DeviceOverviewSpec[] = [
  { label: "OS", value: "Ubuntu 24.04 LTS" },
  { label: "CPU", value: "Intel® Core™ i9-13900HX" },
  { label: "GPU", value: "NVIDIA® GeForce RTX 4080" },
  { label: "RAM", value: "32 GB DDR5 5600 MHz" },
  { label: "Storage", value: "2 TB PCIe Gen4 SSD" },
  { label: "Display", value: "16\" WQXGA 240Hz" },
];

const getSummaryLines = (value: string, limit: number): string[] => {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
};

const getRuntimeOutput = (raw: string, limit: number): DashboardRuntimeOutput => {
  return {
    lines: getSummaryLines(raw, limit),
    raw,
  };
};

export const Dashboard = (): ReactElement => {
  const { statusState } = useDashboardStatus();
  const statusData = statusState.data ?? loadingStatusData;

  return (
    <DashboardView
      aiCoreTelemetry={dashboardAiCoreTelemetry}
      systemOutput={getRuntimeOutput(statusData.systemStatus, 8)}
      driverOutput={getRuntimeOutput(statusData.driverStatus, 4)}
      error={statusState.error}
      deviceSpecs={deviceSpecs}
      performanceMetrics={dashboardPerformanceMetrics}
      systemMetrics={dashboardSystemMetrics}
    />
  );
};
