import type { ReactElement } from "react";

import { performanceCoolingTelemetry } from "../../mocks/performance-telemetry.mock";
import { FanCoolingCardView } from "./fan-cooling-card-view.component";

export const FanCoolingCard = (): ReactElement => {
  return <FanCoolingCardView coolingTelemetry={performanceCoolingTelemetry} />;
};
