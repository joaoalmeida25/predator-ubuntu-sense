import type {
  NeuralCoreCluster,
  NeuralCoreTopology,
} from "../topology/neural-core-topology.types";
import type {
  NeuralCoreClusterSemanticContext,
  NeuralCoreMetric,
  NeuralCoreOperationalImpact,
  NeuralCoreSemanticRelationshipValidation,
} from "./neural-core-semantic-context.types";
import { EMPTY_NEURAL_CORE_SEMANTIC_RELATIONSHIP_VALIDATION } from "./neural-core-semantic-context.constants";

const normalizeOptionalString = (value?: string): string | undefined => {
  const normalized = typeof value === "string" ? value.trim() : undefined;
  return normalized ? normalized : undefined;
};

const normalizeOrderedIds = (
  values?: readonly string[],
): readonly string[] | undefined => {
  if (!values) {
    return undefined;
  }
  const seen: Record<string, true> = {};
  const normalized: string[] = [];
  for (const value of values) {
    const id = normalizeOptionalString(value);
    if (!id || seen[id]) {
      continue;
    }
    seen[id] = true;
    normalized.push(id);
  }
  return normalized.length > 0 ? normalized : undefined;
};

export const normalizeNeuralCoreMetric = (
  metric: NeuralCoreMetric,
): NeuralCoreMetric | undefined => {
  const id = normalizeOptionalString(metric.id);
  const label = normalizeOptionalString(metric.label);
  if (!id || !label) {
    return undefined;
  }
  const value = typeof metric.value === "string"
    ? normalizeOptionalString(metric.value)
    : metric.value;
  if (value === undefined || (typeof value === "number" && !Number.isFinite(value))) {
    return undefined;
  }
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return undefined;
  }
  const unit = normalizeOptionalString(metric.unit);
  const description = normalizeOptionalString(metric.description);
  const trend = metric.trend === "up"
    || metric.trend === "down"
    || metric.trend === "stable"
    || metric.trend === "unknown"
    ? metric.trend
    : undefined;
  const status = metric.status === "idle"
    || metric.status === "active"
    || metric.status === "processing"
    || metric.status === "success"
    || metric.status === "warning"
    || metric.status === "error"
    || metric.status === "disabled"
    ? metric.status
    : undefined;
  return {
    id,
    label,
    value,
    ...(unit ? { unit } : {}),
    ...(description ? { description } : {}),
    ...(trend ? { trend } : {}),
    ...(status ? { status } : {}),
  };
};

export const normalizeNeuralCoreOperationalImpact = (
  impact: NeuralCoreOperationalImpact,
): NeuralCoreOperationalImpact | undefined => {
  const level = impact.level === "none"
    || impact.level === "low"
    || impact.level === "medium"
    || impact.level === "high"
    || impact.level === "critical"
    ? impact.level
    : undefined;
  if (!level) {
    return undefined;
  }
  const summary = normalizeOptionalString(impact.summary);
  const affectedClusterIds = normalizeOrderedIds(impact.affectedClusterIds);
  const affectedPathwayIds = normalizeOrderedIds(impact.affectedPathwayIds);
  return {
    level,
    ...(summary ? { summary } : {}),
    ...(affectedClusterIds ? { affectedClusterIds } : {}),
    ...(affectedPathwayIds ? { affectedPathwayIds } : {}),
  };
};

export const normalizeNeuralCoreClusterSemanticContext = (
  context: NeuralCoreClusterSemanticContext,
): NeuralCoreClusterSemanticContext | undefined => {
  const name = normalizeOptionalString(context.name);
  if (!name) {
    return undefined;
  }
  const metrics: NeuralCoreMetric[] = [];
  const metricIds: Record<string, true> = {};
  for (const metric of context.metrics ?? []) {
    const normalized = normalizeNeuralCoreMetric(metric);
    if (!normalized || metricIds[normalized.id]) {
      continue;
    }
    metricIds[normalized.id] = true;
    metrics.push(normalized);
  }
  const shortName = normalizeOptionalString(context.shortName);
  const description = normalizeOptionalString(context.description);
  const relatedClusterIds = normalizeOrderedIds(context.relatedClusterIds);
  const relatedSynapseIds = normalizeOrderedIds(context.relatedSynapseIds);
  const relatedPathwayIds = normalizeOrderedIds(context.relatedPathwayIds);
  const tags = normalizeOrderedIds(context.tags);
  const impact = context.impact
    ? normalizeNeuralCoreOperationalImpact(context.impact)
    : undefined;
  return {
    name,
    ...(shortName ? { shortName } : {}),
    ...(description ? { description } : {}),
    ...(metrics.length > 0 ? { metrics } : {}),
    ...(impact ? { impact } : {}),
    ...(relatedClusterIds ? { relatedClusterIds } : {}),
    ...(relatedSynapseIds ? { relatedSynapseIds } : {}),
    ...(relatedPathwayIds ? { relatedPathwayIds } : {}),
    ...(tags ? { tags } : {}),
  };
};

export const getNeuralCoreClusterDisplayName = (
  cluster: NeuralCoreCluster,
): string => {
  return normalizeOptionalString(cluster.semanticContext?.shortName)
    ?? normalizeOptionalString(cluster.semanticContext?.name)
    ?? normalizeOptionalString(cluster.label)
    ?? cluster.id;
};

export const validateNeuralCoreClusterSemanticRelationships = (
  cluster: NeuralCoreCluster,
  topology: NeuralCoreTopology,
): NeuralCoreSemanticRelationshipValidation => {
  const context = cluster.semanticContext;
  if (!context) {
    return EMPTY_NEURAL_CORE_SEMANTIC_RELATIONSHIP_VALIDATION;
  }
  const clusterIds: Record<string, true> = {};
  const synapseIds: Record<string, true> = {};
  const pathwayIds: Record<string, true> = {};
  for (const candidate of topology.clusters) {
    clusterIds[candidate.id] = true;
  }
  for (const synapse of topology.synapses) {
    synapseIds[synapse.id] = true;
  }
  for (const pathway of topology.pathways ?? []) {
    pathwayIds[pathway.id] = true;
  }
  const relatedClusterIds = normalizeOrderedIds([
    ...(context.relatedClusterIds ?? []),
    ...(context.impact?.affectedClusterIds ?? []),
  ]) ?? [];
  const relatedPathwayIds = normalizeOrderedIds([
    ...(context.relatedPathwayIds ?? []),
    ...(context.impact?.affectedPathwayIds ?? []),
  ]) ?? [];
  return {
    missingClusterIds: relatedClusterIds.filter((id) => !clusterIds[id]),
    missingSynapseIds: (normalizeOrderedIds(context.relatedSynapseIds) ?? [])
      .filter((id) => !synapseIds[id]),
    missingPathwayIds: relatedPathwayIds.filter((id) => !pathwayIds[id]),
  };
};
