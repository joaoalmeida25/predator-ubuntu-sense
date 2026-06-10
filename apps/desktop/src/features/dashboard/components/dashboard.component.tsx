import type { ReactElement } from "react";
import { DashboardView } from "./dashboard-view.component";
import {DashboardStatusData} from "../hooks/use-dashboard-status/use-dashboard-status.types.ts";
import {useDashboardStatus} from "../hooks/use-dashboard-status/use-dashboard-status.hook.ts";

const loadingStatusData: DashboardStatusData = {
  systemStatus: "Loading system status...",
  driverStatus: "Loading driver runtime...",
};

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
      onRefresh={handleRefresh}
    />
  );
};
