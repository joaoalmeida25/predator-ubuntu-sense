import { useState, type ReactElement } from "react";

import { Dashboard } from "../features/dashboard/components/dashboard.component";
import { Performance } from "../features/performance/components/performance.component";
import { AppLayout } from "./app-layout.component";
import type { AppPageId } from "./app.types";

export const App = (): ReactElement => {
  const [activePage, setActivePage] = useState<AppPageId>("dashboard");

  return (
    <AppLayout activePage={activePage} onPageChange={setActivePage}>
      {activePage === "dashboard" ? <Dashboard /> : null}
      {activePage === "performance" ? <Performance /> : null}
    </AppLayout>
  );
};
