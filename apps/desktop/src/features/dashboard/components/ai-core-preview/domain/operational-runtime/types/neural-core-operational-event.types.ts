import type { NeuralCoreOperationalMetric } from "./neural-core-operational-metric.types";

export type NeuralCoreOperationalEventType =
  | "execution-started"
  | "request-received"
  | "stage-entered"
  | "stage-processing"
  | "stage-completed"
  | "route-transmission"
  | "metric-updated"
  | "warning-raised"
  | "failure-raised"
  | "retry-scheduled"
  | "retry-started"
  | "component-recovered"
  | "response-sent"
  | "execution-completed";

export type NeuralCoreOperationalEventStatus =
  | "idle"
  | "processing"
  | "success"
  | "warning"
  | "error"
  | "recovering";

export type NeuralCoreOperationalImpactLevel =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface NeuralCoreOperationalEvent {
  id: string;
  type: NeuralCoreOperationalEventType;
  status: NeuralCoreOperationalEventStatus;
  atMs: number;
  durationMs?: number;
  stageId?: string;
  clusterId?: string;
  routeId?: string;
  title: string;
  message?: string;
  metrics?: readonly NeuralCoreOperationalMetric[];
  impact?: {
    level: NeuralCoreOperationalImpactLevel;
    affectedClusterIds?: readonly string[];
    summary?: string;
  };
  retry?: {
    attempt: number;
    maximumAttempts: number;
    delayMs: number;
    reason?: string;
  };
  metadata?: Readonly<Record<string, string | number | boolean>>;
}
