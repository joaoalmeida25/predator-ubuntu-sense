import type { NeuralCoreOperationalMetric } from "./neural-core-operational-metric.types";

export type NeuralCoreOperationalOutcomeStatus =
  | "success"
  | "degraded-success"
  | "recovered-success"
  | "failure";

export interface NeuralCoreOperationalOutcome {
  status: NeuralCoreOperationalOutcomeStatus;
  totalDurationMs: number;
  processedStageCount: number;
  warningCount: number;
  failureCount: number;
  retryCount: number;
  failedClusterId?: string;
  recoveredClusterId?: string;
  summary: string;
  metrics?: readonly NeuralCoreOperationalMetric[];
}
