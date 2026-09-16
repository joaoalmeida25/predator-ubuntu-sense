import type {
  NeuralCoreClusterId,
  NeuralCoreEntityId,
  NeuralCoreExecutionId,
  NeuralCoreMetricId,
  NeuralCorePathwayId,
  NeuralCoreRouteId,
  NeuralCoreRuntimeEventId,
} from "./neural-core-id.types";
import type {
  NeuralCoreMetadata,
  NeuralCoreOperationalStatus,
} from "./neural-core-model.types";

export type NeuralCoreBuiltInRuntimeEventKind =
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

export type NeuralCoreRuntimeEventKind =
  | NeuralCoreBuiltInRuntimeEventKind
  | `custom:${string}`;

export type NeuralCoreMetricValue = string | number | boolean;
export type NeuralCoreMetricTrend = "up" | "down" | "stable" | "unknown";

export interface NeuralCoreMetricInput {
  readonly id: string;
  readonly name: string;
  readonly value: NeuralCoreMetricValue;
  readonly unit?: string;
  readonly status?: NeuralCoreOperationalStatus;
  readonly trend?: NeuralCoreMetricTrend;
}

export interface NeuralCoreMetric {
  readonly id: NeuralCoreMetricId;
  readonly name: string;
  readonly value: NeuralCoreMetricValue;
  readonly unit?: string;
  readonly status: NeuralCoreOperationalStatus;
  readonly trend: NeuralCoreMetricTrend;
}

export type NeuralCoreImpactLevel = "none" | "low" | "medium" | "high" | "critical";

export interface NeuralCoreRuntimeImpactInput {
  readonly level: NeuralCoreImpactLevel;
  readonly summary?: string;
  readonly affectedEntityIds?: readonly string[];
  readonly affectedClusterIds?: readonly string[];
  readonly affectedRouteIds?: readonly string[];
  readonly affectedPathwayIds?: readonly string[];
}

export interface NeuralCoreRuntimeImpact {
  readonly level: NeuralCoreImpactLevel;
  readonly summary?: string;
  readonly affectedEntityIds: readonly NeuralCoreEntityId[];
  readonly affectedClusterIds: readonly NeuralCoreClusterId[];
  readonly affectedRouteIds: readonly NeuralCoreRouteId[];
  readonly affectedPathwayIds: readonly NeuralCorePathwayId[];
}

export interface NeuralCoreRuntimeRetryInput {
  readonly attempt: number;
  readonly maximumAttempts: number;
  readonly delayMs: number;
  readonly reason?: string;
}

export interface NeuralCoreRuntimeRetry {
  readonly attempt: number;
  readonly maximumAttempts: number;
  readonly delayMs: number;
  readonly reason?: string;
}

export interface NeuralCoreRuntimeEventInput {
  readonly id: string;
  readonly kind: NeuralCoreRuntimeEventKind;
  readonly status: NeuralCoreOperationalStatus;
  readonly atMs: number;
  readonly durationMs?: number;
  readonly entityId?: string;
  readonly clusterId?: string;
  readonly routeId?: string;
  readonly pathwayId?: string;
  readonly title: string;
  readonly message?: string;
  readonly metrics?: readonly NeuralCoreMetricInput[];
  readonly impact?: NeuralCoreRuntimeImpactInput;
  readonly retry?: NeuralCoreRuntimeRetryInput;
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreRuntimeEvent {
  readonly id: NeuralCoreRuntimeEventId;
  readonly kind: NeuralCoreRuntimeEventKind;
  readonly status: NeuralCoreOperationalStatus;
  readonly atMs: number;
  readonly durationMs: number;
  readonly entityId?: NeuralCoreEntityId;
  readonly clusterId?: NeuralCoreClusterId;
  readonly routeId?: NeuralCoreRouteId;
  readonly pathwayId?: NeuralCorePathwayId;
  readonly title: string;
  readonly message?: string;
  readonly metrics: readonly NeuralCoreMetric[];
  readonly impact?: NeuralCoreRuntimeImpact;
  readonly retry?: NeuralCoreRuntimeRetry;
  readonly metadata: NeuralCoreMetadata;
}

export type NeuralCoreExecutionOutcomeStatus =
  | "success"
  | "degraded-success"
  | "recovered-success"
  | "failure";

export interface NeuralCoreExecutionOutcomeInput {
  readonly status: NeuralCoreExecutionOutcomeStatus;
  readonly summary: string;
  readonly totalDurationMs: number;
  readonly metrics?: readonly NeuralCoreMetricInput[];
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreExecutionOutcome {
  readonly status: NeuralCoreExecutionOutcomeStatus;
  readonly summary: string;
  readonly totalDurationMs: number;
  readonly metrics: readonly NeuralCoreMetric[];
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreExecutionInput {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly events: readonly NeuralCoreRuntimeEventInput[];
  readonly outcome: NeuralCoreExecutionOutcomeInput;
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreExecution {
  readonly id: NeuralCoreExecutionId;
  readonly name: string;
  readonly description?: string;
  readonly events: readonly NeuralCoreRuntimeEvent[];
  readonly outcome: NeuralCoreExecutionOutcome;
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreExecutionRuntimeInput {
  readonly kind: "execution";
  readonly execution: NeuralCoreExecutionInput;
  readonly autoStart?: boolean;
}

export interface NeuralCoreExecutionRuntime {
  readonly kind: "execution";
  readonly execution: NeuralCoreExecution;
  readonly autoStart: boolean;
}

export type NeuralCoreRuntimeInput = NeuralCoreExecutionRuntimeInput;
export type NeuralCoreRuntime = NeuralCoreExecutionRuntime;

export type NeuralCoreExecutionStatus =
  | "idle"
  | "running"
  | "paused"
  | "recovering"
  | "completed"
  | "failed";

interface NeuralCoreExecutionStateBase {
  readonly executionId: NeuralCoreExecutionId;
  readonly progress: number;
}

export interface NeuralCoreIdleExecutionState extends NeuralCoreExecutionStateBase {
  readonly status: "idle";
  readonly progress: 0;
  readonly activeEventId?: never;
  readonly outcome?: never;
}

export interface NeuralCoreActiveExecutionState extends NeuralCoreExecutionStateBase {
  readonly status: "running" | "paused" | "recovering";
  readonly activeEventId?: NeuralCoreRuntimeEventId;
  readonly outcome?: never;
}

export interface NeuralCoreCompletedExecutionState extends NeuralCoreExecutionStateBase {
  readonly status: "completed";
  readonly progress: 1;
  readonly activeEventId?: never;
  readonly outcome: NeuralCoreExecutionOutcome;
}

export interface NeuralCoreFailedExecutionState extends NeuralCoreExecutionStateBase {
  readonly status: "failed";
  readonly activeEventId?: NeuralCoreRuntimeEventId;
  readonly outcome: NeuralCoreExecutionOutcome;
}

export type NeuralCoreExecutionState =
  | NeuralCoreIdleExecutionState
  | NeuralCoreActiveExecutionState
  | NeuralCoreCompletedExecutionState
  | NeuralCoreFailedExecutionState;
