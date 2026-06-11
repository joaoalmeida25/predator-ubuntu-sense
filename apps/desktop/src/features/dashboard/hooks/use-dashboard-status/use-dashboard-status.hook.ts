import { useCallback, useEffect, useRef, useState } from "react";

import { getDriverStatus } from "../../../../shared/services/driver-runtime/get-driver-status/get-driver-status.service";
import { getSystemStatus } from "../../../../shared/services/system-status/get-system-status/get-system-status.service";
import type { AsyncState } from "../../../../shared/types/async-state.type";
import type {
  DashboardStatusData,
  UseDashboardStatusResult,
} from "./use-dashboard-status.types";

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

export const useDashboardStatus = (): UseDashboardStatusResult => {
  const latestDataRef = useRef<DashboardStatusData | null>(null);
  const [statusState, setStatusState] = useState<
    AsyncState<DashboardStatusData>
  >({
    status: "idle",
    data: null,
    error: null,
  });

  const refresh = useCallback(async (): Promise<void> => {
    setStatusState({
      status: "loading",
      data: latestDataRef.current,
      error: null,
    });

    try {
      const [systemStatus, driverStatus] = await Promise.all([
        getSystemStatus(),
        getDriverStatus(),
      ]);
      const data: DashboardStatusData = { systemStatus, driverStatus };

      latestDataRef.current = data;
      setStatusState({ status: "success", data, error: null });
    } catch (error: unknown) {
      setStatusState({
        status: "error",
        data: latestDataRef.current,
        error: getErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { statusState, refresh };
};
