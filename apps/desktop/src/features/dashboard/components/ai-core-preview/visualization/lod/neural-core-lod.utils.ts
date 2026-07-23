import type { NeuralCoreCluster } from "../../domain/topology/neural-core-topology.types";
import { DEFAULT_NEURAL_CORE_LOD_CONFIG } from "./neural-core-lod.constants";
import type {
  NeuralCoreLodConfig,
  NeuralCoreLodConfigInput,
} from "./neural-core-lod.types";

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

const integerInRange = (
  value: number | undefined,
  fallback: number,
  maximum: number,
): number => {
  return Math.trunc(finiteInRange(value, fallback, 0, maximum));
};

export const resolveNeuralCoreLodConfig = (
  input?: NeuralCoreLodConfigInput,
): NeuralCoreLodConfig => {
  const defaults = DEFAULT_NEURAL_CORE_LOD_CONFIG;
  const detailMaximum = finiteInRange(
    input?.distance?.detailMaximum,
    defaults.distance.detailMaximum,
    0,
    100,
  );
  return {
    enabled: input?.enabled ?? defaults.enabled,
    distance: {
      detailMaximum,
      summaryMaximum: Math.max(
        detailMaximum,
        finiteInRange(
          input?.distance?.summaryMaximum,
          defaults.distance.summaryMaximum,
          0,
          100,
        ),
      ),
    },
    limits: {
      maximumOverviewClusters: integerInRange(
        input?.limits?.maximumOverviewClusters,
        defaults.limits.maximumOverviewClusters,
        1000,
      ),
      maximumSummaryClusters: integerInRange(
        input?.limits?.maximumSummaryClusters,
        defaults.limits.maximumSummaryClusters,
        1000,
      ),
      maximumDetailClusters: integerInRange(
        input?.limits?.maximumDetailClusters,
        defaults.limits.maximumDetailClusters,
        1000,
      ),
    },
    priority: {
      focusedBoost: finiteInRange(
        input?.priority?.focusedBoost,
        defaults.priority.focusedBoost,
        0,
        10,
      ),
      criticalBoost: finiteInRange(
        input?.priority?.criticalBoost,
        defaults.priority.criticalBoost,
        0,
        10,
      ),
      activityInfluence: finiteInRange(
        input?.priority?.activityInfluence,
        defaults.priority.activityInfluence,
        0,
        5,
      ),
      importanceInfluence: finiteInRange(
        input?.priority?.importanceInfluence,
        defaults.priority.importanceInfluence,
        0,
        5,
      ),
    },
  };
};

const normalized = (value?: number): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
};

export const isNeuralCoreClusterCritical = (cluster: NeuralCoreCluster): boolean => {
  return cluster.status === "error"
    || cluster.semanticContext?.impact?.level === "critical";
};

export const calculateNeuralCoreClusterLodPriority = (
  cluster: NeuralCoreCluster,
  context: { isFocused: boolean; distanceToCamera: number },
  config: NeuralCoreLodConfig,
): number => {
  const safeDistance = Number.isFinite(context.distanceToCamera)
    ? Math.max(0, context.distanceToCamera)
    : Number.MAX_SAFE_INTEGER;
  const distanceScore = 1 / (1 + safeDistance);
  const priority = distanceScore
    + normalized(cluster.positionHint?.priority)
    + normalized(cluster.activity) * config.priority.activityInfluence
    + normalized(cluster.importance) * config.priority.importanceInfluence
    + (context.isFocused ? config.priority.focusedBoost : 0)
    + (isNeuralCoreClusterCritical(cluster) ? config.priority.criticalBoost : 0);
  return Number.isFinite(priority) ? priority : 0;
};
