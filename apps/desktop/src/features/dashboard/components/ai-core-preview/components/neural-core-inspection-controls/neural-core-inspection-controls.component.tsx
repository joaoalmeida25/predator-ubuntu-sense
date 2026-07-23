import type { ReactElement } from "react";

import { NeuralCoreInspectionControlsView } from "./neural-core-inspection-controls-view.component";
import type { NeuralCoreInspectionControlsViewProps } from "./neural-core-inspection-controls-view.types";

export const NeuralCoreInspectionControls = (
  props: NeuralCoreInspectionControlsViewProps,
): ReactElement => <NeuralCoreInspectionControlsView {...props} />;
