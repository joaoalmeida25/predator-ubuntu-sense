import type { ReactElement } from "react";

import { SystemPerformanceCardView } from "./system-performance-card-view.component";
import type { SystemPerformanceCardViewProps } from "./system-performance-card-view.types";

export const SystemPerformanceCard = ({
  metrics,
}: SystemPerformanceCardViewProps): ReactElement => {
  return <SystemPerformanceCardView metrics={metrics} />;
};
