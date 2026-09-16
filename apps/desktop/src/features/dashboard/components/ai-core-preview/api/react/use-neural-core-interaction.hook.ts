import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  adaptNeuralCoreInteractionState,
} from "../adapters/neural-core-interaction.adapter";
import { adaptInteractionDiagnosticToPublicError } from "../adapters/neural-core-error.adapter";
import {
  createNeuralCoreClusterSelectedEvent,
  createNeuralCoreClusterSelectionClearedEvent,
  createNeuralCoreInteractionModeChangedEvent,
} from "../adapters/neural-core-event.adapter";
import type { NeuralCoreEvent } from "../core/neural-core-event.types";
import type {
  NeuralCoreInteractionBinding,
  NeuralCoreInteractionChangeReason,
  NeuralCoreInteractionMode,
  NeuralCoreInteractionState,
} from "../core/neural-core-interaction.types";
import type { NeuralCoreModel } from "../core/neural-core-model.types";
import type { NeuralCoreExecutionId } from "../core/neural-core-id.types";
import { createNeuralCoreInteractionState } from "../defaults/neural-core-interaction.defaults";

interface UseNeuralCoreInteractionParams {
  readonly binding: NeuralCoreInteractionBinding;
  readonly emitEvent: (event: NeuralCoreEvent) => void;
  readonly executionId?: NeuralCoreExecutionId;
  readonly model?: NeuralCoreModel;
  readonly reportInteractionError: (identity: string, message: ReturnType<
    typeof adaptInteractionDiagnosticToPublicError
  >) => void;
}

interface UseNeuralCoreInteractionResult {
  readonly state: NeuralCoreInteractionState;
  readonly requestMode: (mode: NeuralCoreInteractionMode) => void;
  readonly requestPaused: (paused: boolean) => void;
  readonly requestSelection: (
    clusterId: string | undefined,
    reason?: "user-action" | "reset",
  ) => void;
}

const interactionStatesEqual = (
  left: NeuralCoreInteractionState,
  right: NeuralCoreInteractionState,
): boolean => left.mode === right.mode
  && left.selectedClusterId === right.selectedClusterId
  && left.paused === right.paused;

export const useNeuralCoreInteraction = ({
  binding,
  emitEvent,
  executionId,
  model,
  reportInteractionError,
}: UseNeuralCoreInteractionParams): UseNeuralCoreInteractionResult => {
  const controlled = binding.interactionState !== undefined;
  const [uncontrolledState, setUncontrolledState] = useState<NeuralCoreInteractionState>(() => (
    createNeuralCoreInteractionState(binding.defaultInteractionState)
  ));
  const sourceState = binding.interactionState ?? uncontrolledState;
  const sourceStateRef = useRef(sourceState);
  const callbackRef = useRef(binding.onInteractionStateChange);
  sourceStateRef.current = sourceState;
  callbackRef.current = binding.onInteractionStateChange;

  const adapted = useMemo(() => (
    model === undefined ? undefined : adaptNeuralCoreInteractionState(sourceState, model)
  ), [model, sourceState]);
  const renderState = useMemo<NeuralCoreInteractionState>(() => ({
    mode: sourceState.mode,
    ...(adapted?.state.selectedClusterId === undefined
      ? {}
      : { selectedClusterId: String(adapted.state.selectedClusterId) }),
    paused: sourceState.paused,
  }), [adapted?.state.selectedClusterId, sourceState.mode, sourceState.paused]);

  const previousModelIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const previousModelId = previousModelIdRef.current;
    previousModelIdRef.current = model?.id;
    const diagnostic = adapted?.diagnostic;
    if (diagnostic === undefined || model === undefined) {
      return;
    }
    const identity = `${model.id}:${diagnostic.code}:${sourceState.selectedClusterId ?? "none"}`;
    if (controlled) {
      reportInteractionError(identity, adaptInteractionDiagnosticToPublicError(diagnostic));
      return;
    }

    const nextState: NeuralCoreInteractionState = Object.freeze({
      mode: sourceState.mode,
      paused: sourceState.paused,
    });
    setUncontrolledState(nextState);
    callbackRef.current?.(nextState, "cluster-selection-cleared");
    emitEvent(createNeuralCoreClusterSelectionClearedEvent(
      sourceState.selectedClusterId,
      previousModelId !== undefined && previousModelId !== model.id
        ? "model-changed"
        : "invalid-selection",
    ));
  }, [
    adapted?.diagnostic,
    controlled,
    emitEvent,
    model,
    reportInteractionError,
    sourceState.mode,
    sourceState.paused,
    sourceState.selectedClusterId,
  ]);

  const commitState = useCallback((
    nextState: NeuralCoreInteractionState,
    reason: NeuralCoreInteractionChangeReason,
  ): void => {
    const currentState = sourceStateRef.current;
    if (interactionStatesEqual(currentState, nextState)) {
      return;
    }
    if (!controlled) {
      setUncontrolledState(nextState);
    }
    callbackRef.current?.(nextState, reason);
  }, [controlled]);

  const requestMode = useCallback((mode: NeuralCoreInteractionMode): void => {
    const current = sourceStateRef.current;
    if (current.mode === mode) return;
    commitState(Object.freeze({ ...current, mode }), "mode-changed");
    emitEvent(createNeuralCoreInteractionModeChangedEvent(current.mode, mode));
  }, [commitState, emitEvent]);

  const requestPaused = useCallback((paused: boolean): void => {
    const current = sourceStateRef.current;
    if (current.paused === paused) return;
    commitState(Object.freeze({ ...current, paused }), paused ? "paused" : "resumed");
    if (executionId !== undefined) {
      emitEvent(Object.freeze({
        type: paused ? "execution-paused" : "execution-resumed",
        executionId,
      }));
    }
  }, [commitState, emitEvent, executionId]);

  const requestSelection = useCallback((
    clusterId: string | undefined,
    reason: "user-action" | "reset" = "user-action",
  ): void => {
    const current = sourceStateRef.current;
    if (current.selectedClusterId === clusterId) return;
    const nextState = Object.freeze({
      mode: current.mode,
      ...(clusterId === undefined ? {} : { selectedClusterId: clusterId }),
      paused: current.paused,
    });
    commitState(
      nextState,
      clusterId === undefined ? "cluster-selection-cleared" : "cluster-selected",
    );
    emitEvent(clusterId === undefined
      ? createNeuralCoreClusterSelectionClearedEvent(current.selectedClusterId, reason)
      : createNeuralCoreClusterSelectedEvent(clusterId));
  }, [commitState, emitEvent]);

  return { state: renderState, requestMode, requestPaused, requestSelection };
};
