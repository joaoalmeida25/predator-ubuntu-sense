import {AsyncState} from "../../../../shared/types/async-state.type.ts";

export interface DashboardStatusData {
  systemStatus: string;
  driverStatus: string;
}

export interface UseDashboardStatusResult {
  statusState: AsyncState<DashboardStatusData>;
  refresh: () => Promise<void>;
}
