import type { RefObject } from "react";

import type {
  NeuralCoreOperationalEvent,
  NeuralCoreOperationalImpactLevel,
} from "../domain/neural-core-operational-event.types";
import type { NeuralCoreOperationalExecution } from "../domain/neural-core-operational-execution.types";
import type { NeuralCoreOperationalMetric } from "../domain/neural-core-operational-metric.types";
import type { NeuralCoreOperationalOutcome } from "../domain/neural-core-operational-outcome.types";
import type {
  NeuralCoreOperationalStage,
} from "../domain/neural-core-operational-scenario.types";
import type {
  NeuralCoreCluster,
  NeuralCoreSynapse,
  NeuralCoreTopologyStatus,
} from "../../../domain/topology/neural-core-topology.types";
import type {
  NeuralCoreOperationalPresentationEvent,
  NeuralCoreOperationalPresentationPacingConfigInput,
  NeuralCoreOperationalPresentationTimeline,
} from "./neural-core-operational-presentation.types";

export type NeuralCoreOperationalRuntimeStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "recovering";

export interface NeuralCoreOperationalClusterRuntimeState {
  clusterId: string;
  status: "idle" | "processing" | "success" | "warning" | "error" | "recovering";
  activity: number;
  progress: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface NeuralCoreOperationalRuntimeNarrative {
  eventId: string;
  title: string;
  message: string;
  status: NeuralCoreOperationalClusterRuntimeState["status"];
  clusterId?: string;
  routeId?: string;
  sourceClusterId?: string;
  targetClusterId?: string;
  routeStatus?: NeuralCoreOperationalClusterRuntimeState["status"];
  primaryMetric?: NeuralCoreOperationalMetric;
}

export interface NeuralCoreOperationalRetryRuntimeState {
  eventId: string;
  clusterId: string;
  attempt: number;
  maximumAttempts: number;
  status: "scheduled" | "running" | "succeeded" | "failed";
  reason?: string;
}

export interface NeuralCoreOperationalImpactRuntimeState {
  sourceEventId: string;
  sourceClusterId: string;
  level: NeuralCoreOperationalImpactLevel;
  affectedClusterIds: readonly string[];
  affectedRouteIds: readonly string[];
  summary?: string;
}

export interface NeuralCoreOperationalRuntimeSnapshot {
  executionId: string;
  status: NeuralCoreOperationalRuntimeStatus;
  isPaused: boolean;
  totalStageCount: number;
  activeEventId?: string;
  activeRouteEventId?: string;
  activeStageId?: string;
  activeClusterId?: string;
  activeRouteId?: string;
  activeRouteStatus?: NeuralCoreTopologyStatus;
  nextClusterId?: string;
  completedStageIds: readonly string[];
  completedClusterIds: readonly string[];
  clusterStates: Readonly<Record<string, NeuralCoreOperationalClusterRuntimeState>>;
  metricsByClusterId: Readonly<Record<string, readonly NeuralCoreOperationalMetric[]>>;
  narrative?: NeuralCoreOperationalRuntimeNarrative;
  retry?: NeuralCoreOperationalRetryRuntimeState;
  impact?: NeuralCoreOperationalImpactRuntimeState;
  outcome?: NeuralCoreOperationalOutcome;
}

export interface NeuralCoreOperationalRuntimeConfig {
  enabled: boolean;
  autoStart: boolean;
  playbackRate: number;
  eventEmphasisDurationMs: number;
  autoFollowInPresentation: boolean;
  presentationPacing?: NeuralCoreOperationalPresentationPacingConfigInput;
}

export type NeuralCoreOperationalRuntimeConfigInput = Partial<
NeuralCoreOperationalRuntimeConfig
>;

export interface NeuralCoreOperationalRuntimeController {
  snapshot: NeuralCoreOperationalRuntimeSnapshot;
  run: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
}

export interface NeuralCoreOperationalRuntimeProgressRefs {
  progressBarRef: RefObject<HTMLDivElement | null>;
  progressLabelRef: RefObject<HTMLOutputElement | null>;
  elapsedMsRef: NeuralCoreOperationalRuntimeValueRef;
  progressRef: NeuralCoreOperationalRuntimeValueRef;
  activeRouteProgressRef: NeuralCoreOperationalRuntimeValueRef;
}

export interface NeuralCoreOperationalRuntimeValueRef {
  current: number;
}

export interface NeuralCoreOperationalEventBoundary {
  atMs: number;
  enteringEventIndexes: readonly number[];
  exitingEventIndexes: readonly number[];
}

export interface NeuralCoreOperationalRouteIndex {
  route: NeuralCoreSynapse;
  sourceStage?: NeuralCoreOperationalStage;
  targetStage?: NeuralCoreOperationalStage;
}

export interface NeuralCoreOperationalExecutionIndex {
  execution: NeuralCoreOperationalExecution;
  events: readonly NeuralCoreOperationalEvent[];
  eventsById: ReadonlyMap<string, NeuralCoreOperationalEvent>;
  eventIndexById: ReadonlyMap<string, number>;
  stagesById: ReadonlyMap<string, NeuralCoreOperationalStage>;
  clustersById: ReadonlyMap<string, NeuralCoreCluster>;
  routesById: ReadonlyMap<string, NeuralCoreOperationalRouteIndex>;
  eventsByStageId: ReadonlyMap<string, readonly NeuralCoreOperationalEvent[]>;
  eventsByClusterId: ReadonlyMap<string, readonly NeuralCoreOperationalEvent[]>;
  eventsByRouteId: ReadonlyMap<string, readonly NeuralCoreOperationalEvent[]>;
  resolvedClusterIdByEventIndex: readonly (string | undefined)[];
  resolvedRouteIdByEventIndex: readonly (string | undefined)[];
  presentationEventByEventIndex: readonly NeuralCoreOperationalPresentationEvent[];
  impactByEventIndex: readonly (NeuralCoreOperationalImpactRuntimeState | undefined)[];
  narrativeByEventIndex: readonly NeuralCoreOperationalRuntimeNarrative[];
  publishesNarrativeByEventIndex: readonly boolean[];
  boundaries: readonly NeuralCoreOperationalEventBoundary[];
  totalDurationMs: number;
  operationalDurationMs: number;
  presentationTimeline: NeuralCoreOperationalPresentationTimeline;
}

export interface NeuralCoreOperationalEventCursor {
  nextBoundaryIndex: number;
  nextEventIndex: number;
  activeTimedEventIndexes: number[];
  lastElapsedMs: number;
}
