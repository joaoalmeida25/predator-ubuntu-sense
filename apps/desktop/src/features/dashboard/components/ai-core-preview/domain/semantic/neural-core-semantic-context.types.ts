import type { NeuralCoreTopologyStatus } from "../topology/neural-core-topology.types";

export type NeuralCoreMetricValue = string | number | boolean;

export type NeuralCoreMetricTrend = "up" | "down" | "stable" | "unknown";

export interface NeuralCoreMetric {
  id: string;
  label: string;
  value: NeuralCoreMetricValue;
  unit?: string;
  description?: string;
  trend?: NeuralCoreMetricTrend;
  status?: NeuralCoreTopologyStatus;
}

export type NeuralCoreImpactLevel = "none" | "low" | "medium" | "high" | "critical";

export interface NeuralCoreOperationalImpact {
  level: NeuralCoreImpactLevel;
  summary?: string;
  affectedClusterIds?: readonly string[];
  affectedPathwayIds?: readonly string[];
}

export interface NeuralCoreClusterSemanticContext {
  name: string;
  shortName?: string;
  description?: string;
  metrics?: readonly NeuralCoreMetric[];
  impact?: NeuralCoreOperationalImpact;
  relatedClusterIds?: readonly string[];
  relatedSynapseIds?: readonly string[];
  relatedPathwayIds?: readonly string[];
  tags?: readonly string[];
}

export interface NeuralCoreSemanticRelationshipValidation {
  missingClusterIds: readonly string[];
  missingSynapseIds: readonly string[];
  missingPathwayIds: readonly string[];
}
