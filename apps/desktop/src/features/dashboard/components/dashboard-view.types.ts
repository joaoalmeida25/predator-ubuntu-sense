import type { DashboardMetric } from "../dashboard.mock";
import type { DeviceOverviewSpec } from "./device-overview-card/device-overview-card.types";

export interface DashboardViewProps {
  systemStatus: string;
  driverStatus: string;
  isLoading: boolean;
  error: string | null;
  deviceSpecs: DeviceOverviewSpec[];
  performanceMetrics: DashboardMetric[];
  systemMetrics: DashboardMetric[];
  onRefresh: () => void;
}
