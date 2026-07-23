import { getNeuralCoreClusterDisplayName } from "../../domain/semantic/neural-core-semantic-context.utils";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreLodState } from "../lod/neural-core-lod.types";
import type {
  NeuralCoreClusterLabelConfigInput,
  NeuralCoreClusterLabelModel,
  NeuralCoreClusterLabelMetric,
} from "./neural-core-cluster-label.types";
import {
  formatNeuralCoreActivity,
  formatNeuralCoreClusterKind,
  formatNeuralCoreImpactLevel,
  formatNeuralCoreMetricValue,
  formatNeuralCoreTopologyStatus,
  resolveNeuralCoreClusterLabelConfig,
} from "./neural-core-cluster-label.utils";

export interface MapNeuralCoreClusterLabelModelsParams {
  topology: NeuralCoreTopology;
  lodState: NeuralCoreLodState;
  focusedClusterIds?: readonly string[];
  activeClusterIds?: readonly string[];
  compactSelectedClusterId?: string;
  config?: NeuralCoreClusterLabelConfigInput;
}

const normalizedValue = (value?: number): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
};

export const mapNeuralCoreClusterLabelModels = ({
  topology,
  lodState,
  focusedClusterIds = [],
  activeClusterIds = [],
  compactSelectedClusterId,
  config: configInput,
}: MapNeuralCoreClusterLabelModelsParams): readonly NeuralCoreClusterLabelModel[] => {
  const config = resolveNeuralCoreClusterLabelConfig(configInput);
  if (!config.enabled || !lodState.enabled || lodState.visibleClusterIds.length === 0) {
    return [];
  }
  const visibleById = new Set(lodState.visibleClusterIds);
  const focusedById = new Set(focusedClusterIds);
  const activeById = new Set(activeClusterIds);
  const lodById = new Map(lodState.clusters.map((state) => [state.clusterId, state]));
  const models: NeuralCoreClusterLabelModel[] = [];
  for (const cluster of topology.clusters) {
    if (!visibleById.has(cluster.id)) {
      continue;
    }
    const lod = lodById.get(cluster.id);
    if (!lod) {
      continue;
    }
    const semanticContext = cluster.semanticContext;
    const fallbackName = getNeuralCoreClusterDisplayName(cluster);
    const title = lod.level === "overview"
      ? semanticContext?.shortName?.trim() || fallbackName
      : semanticContext?.name?.trim() || fallbackName;
    const status = cluster.status ?? topology.status ?? "idle";
    const metrics: NeuralCoreClusterLabelMetric[] = lod.level === "detail"
      ? (semanticContext?.metrics ?? [])
        .slice(0, config.content.maximumDetailMetrics)
        .map((metric) => ({
          id: metric.id,
          label: metric.label,
          formattedValue: formatNeuralCoreMetricValue(metric),
          ...(metric.status ? { status: metric.status } : {}),
        }))
      : [];
    const activity = lod.level === "summary"
      && config.content.showActivityInSummary
      && typeof cluster.activity === "number"
      && Number.isFinite(cluster.activity)
      ? normalizedValue(cluster.activity)
      : undefined;
    const impactLevel = lod.level === "detail"
      && config.content.showImpactInDetail
      && semanticContext?.impact?.level
      && semanticContext.impact.level !== "none"
      ? semanticContext.impact.level
      : undefined;
    models.push({
      clusterId: cluster.id,
      level: lod.level,
      title,
      ...(lod.level !== "overview"
        ? { typeLabel: formatNeuralCoreClusterKind(cluster.kind) }
        : {}),
      status,
      statusLabel: formatNeuralCoreTopologyStatus(status),
      ...(activity === undefined
        ? {}
        : { activity, formattedActivity: formatNeuralCoreActivity(activity) }),
      metrics,
      ...(impactLevel
        ? { impactLevel, impactLabel: formatNeuralCoreImpactLevel(impactLevel) }
        : {}),
      priority: lod.priority,
      distanceToCamera: lod.distanceToCamera,
      importance: normalizedValue(cluster.importance),
      isActive: activeById.has(cluster.id),
      isFocused: focusedById.has(cluster.id) || lod.isFocused,
      isCritical: lod.isCritical,
      isCompact: compactSelectedClusterId === cluster.id,
    });
  }
  return models.sort((left, right) => {
    const focusedDifference = Number(right.isFocused) - Number(left.isFocused);
    if (focusedDifference !== 0) {
      return focusedDifference;
    }
    const criticalDifference = Number(right.isCritical) - Number(left.isCritical);
    if (criticalDifference !== 0) {
      return criticalDifference;
    }
    const priorityDifference = right.priority - left.priority;
    return priorityDifference !== 0
      ? priorityDifference
      : left.clusterId.localeCompare(right.clusterId);
  });
};
