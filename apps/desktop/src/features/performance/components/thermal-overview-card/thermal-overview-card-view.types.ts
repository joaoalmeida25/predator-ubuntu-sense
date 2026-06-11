import type { PerformanceSupportMetric } from "../../mocks/performance-telemetry.mock";

export interface ThermalOverviewCardViewProps {
  metrics: PerformanceSupportMetric[];
  thermalImageUrl: string;
}
