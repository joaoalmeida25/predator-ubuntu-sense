import { useCallback, useEffect, useState } from "react";

import { getDriverStatus, getSystemStatus } from "./dashboard.service";
import { DashboardView } from "./dashboard-view.component";

export function Dashboard() {
  const [systemStatus, setSystemStatus] = useState("Loading system status...");
  const [driverStatus, setDriverStatus] = useState("Loading driver runtime...");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [system, drivers] = await Promise.all([
        getSystemStatus(),
        getDriverStatus(),
      ]);

      setSystemStatus(system);
      setDriverStatus(drivers);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <DashboardView
      systemStatus={systemStatus}
      driverStatus={driverStatus}
      isLoading={isLoading}
      error={error}
      onRefresh={loadStatus}
    />
  );
}
