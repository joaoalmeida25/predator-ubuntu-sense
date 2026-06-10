import type { AsyncState } from "../../../../shared/types/async-state.type";

export interface DashboardStatusData {
  systemStatus: string;
  driverStatus: string;
}

export interface UseDashboardStatusResult {
  statusState: AsyncState<DashboardStatusData>;
  refresh: () => Promise<void>;
}
