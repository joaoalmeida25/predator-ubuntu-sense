import type { ReactElement } from "react";

import { Dashboard } from "../features/dashboard/components/dashboard.component";
import { AppLayout } from "./app-layout.component";

export const App = (): ReactElement => {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};
