import type { NeuralCoreMetric } from "../../semantic/neural-core-semantic-context.types";
import type { NeuralCoreOperationalMetric } from "../types/neural-core-operational-metric.types";

const EMPTY_NEURAL_CORE_METRICS: readonly NeuralCoreMetric[] = [];
const EMPTY_NEURAL_CORE_OPERATIONAL_METRICS: readonly NeuralCoreOperationalMetric[] = [];
const mergedMetricsCache = new WeakMap<
readonly NeuralCoreMetric[],
WeakMap<readonly NeuralCoreOperationalMetric[], readonly NeuralCoreMetric[]>
>();

const mapMetricStatus = (
  status: NeuralCoreOperationalMetric["status"],
): NeuralCoreMetric["status"] => {
  if (!status || status === "neutral") {
    return "idle";
  }
  return status;
};

export const mapNeuralCoreOperationalMetric = (
  metric: NeuralCoreOperationalMetric,
): NeuralCoreMetric => ({
  id: metric.id,
  label: metric.name,
  value: metric.value,
  ...(metric.unit ? { unit: metric.unit } : {}),
  ...(metric.trend ? { trend: metric.trend } : {}),
  ...(metric.status ? { status: mapMetricStatus(metric.status) } : {}),
});

export const mergeNeuralCoreOperationalMetrics = (
  baseMetrics: readonly NeuralCoreMetric[] | undefined,
  operationalMetrics: readonly NeuralCoreOperationalMetric[] | undefined,
): readonly NeuralCoreMetric[] => {
  const base = baseMetrics ?? EMPTY_NEURAL_CORE_METRICS;
  const operational = operationalMetrics ?? EMPTY_NEURAL_CORE_OPERATIONAL_METRICS;
  if (operational.length === 0) {
    return base;
  }
  let byOperationalMetrics = mergedMetricsCache.get(base);
  if (!byOperationalMetrics) {
    byOperationalMetrics = new WeakMap();
    mergedMetricsCache.set(base, byOperationalMetrics);
  }
  const cached = byOperationalMetrics.get(operational);
  if (cached) {
    return cached;
  }
  const merged = new Map(base.map((metric) => [metric.id, metric]));
  for (const metric of operational) {
    merged.set(metric.id, mapNeuralCoreOperationalMetric(metric));
  }
  const result = [...merged.values()];
  byOperationalMetrics.set(operational, result);
  return result;
};
