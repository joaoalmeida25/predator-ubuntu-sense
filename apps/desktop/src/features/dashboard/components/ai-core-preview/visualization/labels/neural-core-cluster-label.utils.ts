import type { NeuralCoreMetric } from "../../domain/semantic/neural-core-semantic-context.types";
import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";
import type {
  NeuralCoreClusterKind,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import { DEFAULT_NEURAL_CORE_CLUSTER_LABEL_CONFIG } from "./neural-core-cluster-label.constants";
import type {
  NeuralCoreClusterLabelConfig,
  NeuralCoreClusterLabelConfigInput,
} from "./neural-core-cluster-label.types";
import type { NeuralCoreSceneDirectionState } from "../direction/neural-core-scene-direction.types";

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

const trimFixedNumber = (value: number, maximumFractionDigits: number): string => {
  return value.toFixed(maximumFractionDigits).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
};

const expandScientificNotation = (value: string): string => {
  const match = /^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/i.exec(value);
  if (!match) {
    return value;
  }
  const sign = match[1];
  const integer = match[2];
  const fraction = match[3] ?? "";
  const exponent = Number(match[4]);
  const digits = `${integer}${fraction}`;
  const decimalIndex = integer.length + exponent;
  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  }
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
};

const formatAdaptiveNumber = (value: number): string => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue === 0 || Number.isInteger(value)) {
    return String(value);
  }
  if (absoluteValue >= 10) {
    return trimFixedNumber(value, 1);
  }
  if (absoluteValue >= 0.1) {
    return trimFixedNumber(value, 2);
  }
  const rounded = Number(value.toPrecision(3));
  return expandScientificNotation(String(rounded));
};

export interface NeuralCoreClusterLabelPriorityContext {
  activeClusterIds: readonly string[];
  focusedClusterIds: readonly string[];
  protagonistClusterId?: string;
}

export const resolveNeuralCoreClusterLabelPriorityContext = (
  directionState: NeuralCoreSceneDirectionState,
  narrativeState: NeuralCoreNarrativeState,
): NeuralCoreClusterLabelPriorityContext => {
  const directionTargetId = directionState.focusTargetType === "cluster"
    ? directionState.focusTargetId
    : undefined;
  const narrativeClusterIds = narrativeState.isActive ? narrativeState.clusterIds : [];
  const focusedClusterIds = directionTargetId ? [directionTargetId] : [];
  const activeClusterIds: string[] = [];
  const activeById = new Set<string>();
  const appendActive = (clusterId: string | undefined): void => {
    if (clusterId && !activeById.has(clusterId)) {
      activeById.add(clusterId);
      activeClusterIds.push(clusterId);
    }
  };
  appendActive(directionTargetId);
  for (const clusterId of directionState.targetClusterIds) {
    appendActive(clusterId);
  }
  for (const clusterId of narrativeClusterIds) {
    appendActive(clusterId);
  }
  return {
    activeClusterIds,
    focusedClusterIds,
    protagonistClusterId: directionTargetId
      ?? narrativeClusterIds[0]
      ?? directionState.targetClusterIds[0],
  };
};

export const resolveNeuralCoreClusterLabelConfig = (
  input?: NeuralCoreClusterLabelConfigInput,
): NeuralCoreClusterLabelConfig => {
  const defaults = DEFAULT_NEURAL_CORE_CLUSTER_LABEL_CONFIG;
  return {
    enabled: input?.enabled ?? defaults.enabled,
    selectedMode: input?.selectedMode === "detail" ? "detail" : defaults.selectedMode,
    animation: {
      positionDamping: finiteInRange(
        input?.animation?.positionDamping,
        defaults.animation.positionDamping,
        0.1,
        60,
      ),
      opacityDamping: finiteInRange(
        input?.animation?.opacityDamping,
        defaults.animation.opacityDamping,
        0.1,
        60,
      ),
      scaleDamping: finiteInRange(
        input?.animation?.scaleDamping,
        defaults.animation.scaleDamping,
        0.1,
        60,
      ),
      leaderLineDamping: finiteInRange(
        input?.animation?.leaderLineDamping,
        defaults.animation.leaderLineDamping,
        0.1,
        60,
      ),
      placementChangePenalty: finiteInRange(
        input?.animation?.placementChangePenalty,
        defaults.animation.placementChangePenalty,
        0,
        1000,
      ),
    },
    content: {
      maximumDetailMetrics: Math.trunc(finiteInRange(
        input?.content?.maximumDetailMetrics,
        defaults.content.maximumDetailMetrics,
        0,
        2,
      )),
      showActivityInSummary: input?.content?.showActivityInSummary
        ?? defaults.content.showActivityInSummary,
      showImpactInDetail: input?.content?.showImpactInDetail
        ?? defaults.content.showImpactInDetail,
    },
    layout: {
      viewportPaddingPx: finiteInRange(
        input?.layout?.viewportPaddingPx,
        defaults.layout.viewportPaddingPx,
        0,
        64,
      ),
      collisionPaddingPx: finiteInRange(
        input?.layout?.collisionPaddingPx,
        defaults.layout.collisionPaddingPx,
        0,
        40,
      ),
      preferredOffsetPx: finiteInRange(
        input?.layout?.preferredOffsetPx,
        defaults.layout.preferredOffsetPx,
        4,
        120,
      ),
      maximumDisplacementPx: finiteInRange(
        input?.layout?.maximumDisplacementPx,
        defaults.layout.maximumDisplacementPx,
        0,
        240,
      ),
      leaderLineThresholdPx: finiteInRange(
        input?.layout?.leaderLineThresholdPx,
        defaults.layout.leaderLineThresholdPx,
        8,
        180,
      ),
    },
    visibility: {
      hideRearFacingLabels: input?.visibility?.hideRearFacingLabels
        ?? defaults.visibility.hideRearFacingLabels,
      rearFacingThreshold: finiteInRange(
        input?.visibility?.rearFacingThreshold,
        defaults.visibility.rearFacingThreshold,
        -1,
        1,
      ),
      fadeInSeconds: finiteInRange(
        input?.visibility?.fadeInSeconds,
        defaults.visibility.fadeInSeconds,
        0,
        2,
      ),
      fadeOutSeconds: finiteInRange(
        input?.visibility?.fadeOutSeconds,
        defaults.visibility.fadeOutSeconds,
        0,
        3,
      ),
      levelHysteresisDistance: finiteInRange(
        input?.visibility?.levelHysteresisDistance,
        defaults.visibility.levelHysteresisDistance,
        0,
        2,
      ),
      layoutRetentionSeconds: finiteInRange(
        input?.visibility?.layoutRetentionSeconds,
        defaults.visibility.layoutRetentionSeconds,
        0,
        3,
      ),
    },
  };
};

export const formatNeuralCoreMetricValue = (metric: NeuralCoreMetric): string => {
  let value: string;
  if (typeof metric.value === "boolean") {
    value = metric.value ? "Yes" : "No";
  } else if (typeof metric.value === "number") {
    value = Number.isFinite(metric.value) ? formatAdaptiveNumber(metric.value) : "";
  } else {
    value = metric.value.trim();
  }
  const unit = metric.unit?.trim();
  const compactUnit = unit === "%" || unit === "°C" || unit === "°F";
  const formatted = unit && value ? `${value}${compactUnit ? "" : " "}${unit}` : value;
  return formatted.length > 28 ? `${formatted.slice(0, 27).trimEnd()}…` : formatted;
};

export const formatNeuralCoreClusterKind = (kind: NeuralCoreClusterKind): string => {
  return kind
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

export const formatNeuralCoreTopologyStatus = (
  status: NeuralCoreTopologyStatus,
): string => {
  switch (status) {
    case "idle":
      return "Idle";
    case "active":
      return "Active";
    case "processing":
      return "Processing";
    case "success":
      return "Success";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    case "disabled":
      return "Disabled";
  }
};

export const formatNeuralCoreActivity = (activity: number): string => {
  return `${Math.round(Math.min(1, Math.max(0, activity)) * 100)}%`;
};

export const formatNeuralCoreImpactLevel = (level: string): string => {
  return `${level.charAt(0).toUpperCase()}${level.slice(1)} impact`;
};
