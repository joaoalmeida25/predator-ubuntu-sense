import type { CSSProperties } from "react";

import type { NeuralCoreClusterLabelModel } from "../../visualization/labels/neural-core-cluster-label.types";
import type { NeuralCoreInteractionMode } from "../../domain/inspection/neural-core-inspection.types";

export interface NeuralCoreClusterLabelOverlayViewProps {
  models: readonly NeuralCoreClusterLabelModel[];
  fadeInSeconds: number;
  fadeOutSeconds: number;
  interactionMode: NeuralCoreInteractionMode;
  selectedClusterId?: string;
  onSelectCluster: (clusterId: string) => void;
  registerLabelElement: (clusterId: string, element: HTMLElement | null) => void;
  registerLeaderLineElement: (clusterId: string, element: SVGLineElement | null) => void;
  registerOverlayElement: (element: HTMLDivElement | null) => void;
}

export type NeuralCoreClusterLabelActivityStyle = CSSProperties & {
  "--neural-core-label-activity": string;
};

export type NeuralCoreClusterLabelTransitionStyle = CSSProperties & {
  "--neural-core-label-fade-in": string;
  "--neural-core-label-fade-out": string;
};
