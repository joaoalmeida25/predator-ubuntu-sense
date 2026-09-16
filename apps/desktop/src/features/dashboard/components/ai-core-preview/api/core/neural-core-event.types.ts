import type {
  NeuralCoreExecutionId,
  NeuralCoreModelId,
} from "./neural-core-id.types";
import type { NeuralCoreInteractionMode } from "./neural-core-interaction.types";
import type {
  NeuralCoreExecutionOutcome,
  NeuralCoreRuntimeEvent,
} from "./neural-core-runtime.types";

export interface NeuralCoreReadyEvent {
  readonly type: "ready";
  readonly modelId: NeuralCoreModelId;
}

export interface NeuralCoreClusterSelectedEvent {
  readonly type: "cluster-selected";
  readonly clusterId: string;
}

export interface NeuralCoreClusterSelectionClearedEvent {
  readonly type: "cluster-selection-cleared";
  readonly previousClusterId?: string;
  readonly reason:
    | "user-action"
    | "mode-changed"
    | "model-changed"
    | "invalid-selection"
    | "reset";
}

export interface NeuralCoreInteractionModeChangedEvent {
  readonly type: "interaction-mode-changed";
  readonly previousMode: NeuralCoreInteractionMode;
  readonly mode: NeuralCoreInteractionMode;
}

export interface NeuralCoreExecutionStartedEvent {
  readonly type: "execution-started";
  readonly executionId: NeuralCoreExecutionId;
}

export interface NeuralCoreRuntimeEventObservedEvent {
  readonly type: "runtime-event-observed";
  readonly executionId: NeuralCoreExecutionId;
  readonly event: NeuralCoreRuntimeEvent;
}

export interface NeuralCoreExecutionPausedEvent {
  readonly type: "execution-paused";
  readonly executionId: NeuralCoreExecutionId;
}

export interface NeuralCoreExecutionResumedEvent {
  readonly type: "execution-resumed";
  readonly executionId: NeuralCoreExecutionId;
}

export interface NeuralCoreExecutionCompletedEvent {
  readonly type: "execution-completed";
  readonly executionId: NeuralCoreExecutionId;
  readonly outcome: NeuralCoreExecutionOutcome;
}

export type NeuralCoreEvent =
  | NeuralCoreReadyEvent
  | NeuralCoreClusterSelectedEvent
  | NeuralCoreClusterSelectionClearedEvent
  | NeuralCoreInteractionModeChangedEvent
  | NeuralCoreExecutionStartedEvent
  | NeuralCoreRuntimeEventObservedEvent
  | NeuralCoreExecutionPausedEvent
  | NeuralCoreExecutionResumedEvent
  | NeuralCoreExecutionCompletedEvent;

export type NeuralCoreEventHandler = (event: NeuralCoreEvent) => void;
