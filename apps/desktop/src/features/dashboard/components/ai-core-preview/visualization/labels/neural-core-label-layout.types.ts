import type { NeuralCoreDetailLevel } from "../lod/neural-core-lod.types";

export interface NeuralCoreLabelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NeuralCoreClusterLabelScreenCandidate {
  clusterId: string;
  level: NeuralCoreDetailLevel;
  anchorX: number;
  anchorY: number;
  depth: number;
  width: number;
  height: number;
  priority: number;
  importance: number;
  activity: number;
  distanceToCamera: number;
  isFocused: boolean;
  isCritical: boolean;
  isActive: boolean;
  isWarning: boolean;
  isRearFacing: boolean;
  isAnchorOnScreen: boolean;
}

export interface NeuralCoreClusterLabelLeaderLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface NeuralCoreClusterLabelPlacement {
  clusterId: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  width: number;
  height: number;
  visible: boolean;
  displaced: boolean;
  opacity: number;
  placementKey?: string;
  leaderLine?: NeuralCoreClusterLabelLeaderLine;
}

export interface NeuralCoreClusterLabelLayoutConfig {
  viewportPaddingPx: number;
  collisionPaddingPx: number;
  preferredOffsetPx: number;
  maximumDisplacementPx: number;
  leaderLineThresholdPx: number;
  placementChangePenalty: number;
  hideRearFacingLabels: boolean;
}

export interface MapNeuralCoreClusterLabelLayoutParams {
  candidates: readonly NeuralCoreClusterLabelScreenCandidate[];
  viewport: { width: number; height: number };
  exclusions?: readonly NeuralCoreLabelRect[];
  previousPlacements?: Readonly<Record<string, NeuralCoreClusterLabelPlacement>>;
  config: NeuralCoreClusterLabelLayoutConfig;
}
