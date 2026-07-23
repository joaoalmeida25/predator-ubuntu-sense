import type {
  NeuralCoreImpactLevel,
} from "../../domain/semantic/neural-core-semantic-context.types";
import type {
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreDetailLevel } from "../lod/neural-core-lod.types";

export interface NeuralCoreClusterLabelMetric {
  id: string;
  label: string;
  formattedValue: string;
  status?: NeuralCoreTopologyStatus;
}

export interface NeuralCoreClusterLabelModel {
  clusterId: string;
  level: NeuralCoreDetailLevel;
  title: string;
  typeLabel?: string;
  status: NeuralCoreTopologyStatus;
  statusLabel: string;
  activity?: number;
  formattedActivity?: string;
  metrics: readonly NeuralCoreClusterLabelMetric[];
  impactLevel?: NeuralCoreImpactLevel;
  impactLabel?: string;
  priority: number;
  distanceToCamera: number;
  importance: number;
  isActive: boolean;
  isFocused: boolean;
  isCritical: boolean;
  isCompact: boolean;
}

export type NeuralCoreSelectedLabelMode = "compact" | "detail";

export interface NeuralCoreClusterLabelVisualRuntime {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  currentAnchorX: number;
  currentAnchorY: number;
  targetAnchorX: number;
  targetAnchorY: number;
  currentOpacity: number;
  targetOpacity: number;
  currentScale: number;
  targetScale: number;
  currentWidth: number;
  currentHeight: number;
  targetWidth: number;
  targetHeight: number;
  currentLeaderEndX: number;
  currentLeaderEndY: number;
  targetLeaderEndX: number;
  targetLeaderEndY: number;
  currentLevel: NeuralCoreDetailLevel;
  targetLevel: NeuralCoreDetailLevel;
  placementKey?: string;
}

export interface NeuralCoreClusterLabelConfig {
  enabled: boolean;
  selectedMode: NeuralCoreSelectedLabelMode;
  animation: {
    positionDamping: number;
    opacityDamping: number;
    scaleDamping: number;
    leaderLineDamping: number;
    placementChangePenalty: number;
  };
  content: {
    maximumDetailMetrics: number;
    showActivityInSummary: boolean;
    showImpactInDetail: boolean;
  };
  layout: {
    viewportPaddingPx: number;
    collisionPaddingPx: number;
    preferredOffsetPx: number;
    maximumDisplacementPx: number;
    leaderLineThresholdPx: number;
  };
  visibility: {
    hideRearFacingLabels: boolean;
    rearFacingThreshold: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
    levelHysteresisDistance: number;
    layoutRetentionSeconds: number;
  };
}

export interface NeuralCoreClusterLabelConfigInput {
  enabled?: boolean;
  selectedMode?: NeuralCoreSelectedLabelMode;
  animation?: Partial<NeuralCoreClusterLabelConfig["animation"]>;
  content?: Partial<NeuralCoreClusterLabelConfig["content"]>;
  layout?: Partial<NeuralCoreClusterLabelConfig["layout"]>;
  visibility?: Partial<NeuralCoreClusterLabelConfig["visibility"]>;
}
