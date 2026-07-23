import type { ReactElement } from "react";

import { NeuralCoreClusterLabelOverlayView } from "./neural-core-cluster-label-overlay-view.component";
import type { NeuralCoreClusterLabelOverlayViewProps } from "./neural-core-cluster-label-overlay-view.types";

export const NeuralCoreClusterLabelOverlay = (
  props: NeuralCoreClusterLabelOverlayViewProps,
): ReactElement => {
  return <NeuralCoreClusterLabelOverlayView {...props} />;
};
