import type {
  DashboardAiCoreTelemetry,
  DashboardMetric,
} from "../../mocks/dashboard-telemetry.mock";
import type { DeviceOverviewSpec } from "../device-overview-card/device-overview-card-view.types";

export interface DashboardRuntimeOutput {
  lines: string[];
  raw: string;
}

export interface DashboardViewProps {
  aiCoreTelemetry: DashboardAiCoreTelemetry;
  deviceSpecs: DeviceOverviewSpec[];
  driverOutput: DashboardRuntimeOutput;
  error: string | null;
  performanceMetrics: DashboardMetric[];
  systemMetrics: DashboardMetric[];
  systemOutput: DashboardRuntimeOutput;
}
