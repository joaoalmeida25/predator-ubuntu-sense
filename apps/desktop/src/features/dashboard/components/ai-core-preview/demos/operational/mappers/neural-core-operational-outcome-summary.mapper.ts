import { getNeuralCoreClusterDisplayName } from "../../../domain/semantic/neural-core-semantic-context.utils";
import type {
  NeuralCoreOperationalExecution,
} from "../../../domain/operational-runtime/types/neural-core-operational-execution.types";
import type {
  NeuralCoreOperationalMetric,
} from "../../../domain/operational-runtime/types/neural-core-operational-metric.types";
import type {
  NeuralCoreOperationalOutcome,
} from "../../../domain/operational-runtime/types/neural-core-operational-outcome.types";
import type {
  NeuralCoreOperationalScenario,
} from "../../../domain/operational-runtime/types/neural-core-operational-scenario.types";

export interface NeuralCoreOperationalOutcomeSummary {
  executionId: string;
  outcomeLabel: string;
  operationalDurationMs: number;
  processedStageCount: number;
  warningCount: number;
  failureCount: number;
  retryCount: number;
  finalResponse?: string;
  failedComponentName?: string;
  recoveredComponentName?: string;
  affectedComponentNames: readonly string[];
  summary: string;
  keyMetrics: readonly NeuralCoreOperationalMetric[];
}

export interface MapNeuralCoreOperationalOutcomeSummaryParams {
  scenario: NeuralCoreOperationalScenario;
  execution: NeuralCoreOperationalExecution;
  outcome: NeuralCoreOperationalOutcome;
}

const mapOutcomeLabel = (outcome: NeuralCoreOperationalOutcome): string => {
  switch (outcome.status) {
    case "success": return "Success";
    case "degraded-success": return "Degraded success";
    case "recovered-success": return "Recovered success";
    case "failure": return "Failure";
  }
};

export const mapNeuralCoreOperationalOutcomeSummary = ({
  scenario,
  execution,
  outcome,
}: MapNeuralCoreOperationalOutcomeSummaryParams): NeuralCoreOperationalOutcomeSummary => {
  const clusterNameById = new Map(scenario.topology.clusters.map((cluster) => [
    cluster.id,
    getNeuralCoreClusterDisplayName(cluster),
  ]));
  const affectedClusterIds = new Set<string>();
  const stageClusterIdById = new Map(scenario.stages.map((stage) => [
    stage.id,
    stage.clusterId,
  ]));
  for (const event of execution.events) {
    for (const clusterId of event.impact?.affectedClusterIds ?? []) {
      if (clusterId !== outcome.failedClusterId) {
        affectedClusterIds.add(clusterId);
      }
    }
    if (event.impact?.level === "high" || event.impact?.level === "critical") {
      const sourceClusterId = event.clusterId
        ?? (event.stageId ? stageClusterIdById.get(event.stageId) : undefined);
      if (sourceClusterId) {
        for (const route of scenario.topology.synapses) {
          if (route.fromClusterId === sourceClusterId) {
            affectedClusterIds.add(route.toClusterId);
          } else if (route.toClusterId === sourceClusterId) {
            affectedClusterIds.add(route.fromClusterId);
          }
        }
      }
    }
  }
  const statusCode = outcome.metrics?.find(({ id }) => id === "status-code");
  return {
    executionId: execution.id,
    outcomeLabel: mapOutcomeLabel(outcome),
    operationalDurationMs: outcome.totalDurationMs,
    processedStageCount: outcome.processedStageCount,
    warningCount: outcome.warningCount,
    failureCount: outcome.failureCount,
    retryCount: outcome.retryCount,
    ...(statusCode ? { finalResponse: `HTTP ${String(statusCode.value)}` } : {}),
    ...(outcome.failedClusterId && clusterNameById.get(outcome.failedClusterId)
      ? { failedComponentName: clusterNameById.get(outcome.failedClusterId) }
      : {}),
    ...(outcome.recoveredClusterId && clusterNameById.get(outcome.recoveredClusterId)
      ? { recoveredComponentName: clusterNameById.get(outcome.recoveredClusterId) }
      : {}),
    affectedComponentNames: [...affectedClusterIds]
      .map((clusterId) => clusterNameById.get(clusterId))
      .filter((name): name is string => name !== undefined),
    summary: outcome.summary,
    keyMetrics: outcome.metrics ?? [],
  };
};
