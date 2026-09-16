import type {
  NeuralCoreClusterSelectionClearedEvent,
  NeuralCoreClusterSelectedEvent,
  NeuralCoreEvent,
} from "../core/neural-core-event.types";
import type { NeuralCoreInteractionMode } from "../core/neural-core-interaction.types";
import type { NeuralCoreModelId } from "../core/neural-core-id.types";
import type {
  NeuralCoreExecution,
  NeuralCoreRuntimeEvent,
} from "../core/neural-core-runtime.types";

export const createNeuralCoreReadyEvent = (
  modelId: NeuralCoreModelId,
): NeuralCoreEvent => Object.freeze({ type: "ready", modelId });

export const createNeuralCoreClusterSelectedEvent = (
  clusterId: string,
): NeuralCoreClusterSelectedEvent => Object.freeze({
  type: "cluster-selected",
  clusterId,
});

export const createNeuralCoreClusterSelectionClearedEvent = (
  previousClusterId: string | undefined,
  reason: NeuralCoreClusterSelectionClearedEvent["reason"],
): NeuralCoreClusterSelectionClearedEvent => Object.freeze({
  type: "cluster-selection-cleared",
  previousClusterId,
  reason,
});

export const createNeuralCoreInteractionModeChangedEvent = (
  previousMode: NeuralCoreInteractionMode,
  mode: NeuralCoreInteractionMode,
): NeuralCoreEvent => Object.freeze({
  type: "interaction-mode-changed",
  previousMode,
  mode,
});

export const createNeuralCoreExecutionStartedEvent = (
  execution: NeuralCoreExecution,
): NeuralCoreEvent => Object.freeze({
  type: "execution-started",
  executionId: execution.id,
});

export const createNeuralCoreRuntimeEventObservedEvent = (
  execution: NeuralCoreExecution,
  event: NeuralCoreRuntimeEvent,
): NeuralCoreEvent => Object.freeze({
  type: "runtime-event-observed",
  executionId: execution.id,
  event,
});

export const createNeuralCoreExecutionPausedEvent = (
  execution: NeuralCoreExecution,
): NeuralCoreEvent => Object.freeze({
  type: "execution-paused",
  executionId: execution.id,
});

export const createNeuralCoreExecutionResumedEvent = (
  execution: NeuralCoreExecution,
): NeuralCoreEvent => Object.freeze({
  type: "execution-resumed",
  executionId: execution.id,
});

export const createNeuralCoreExecutionCompletedEvent = (
  execution: NeuralCoreExecution,
): NeuralCoreEvent => Object.freeze({
  type: "execution-completed",
  executionId: execution.id,
  outcome: execution.outcome,
});
