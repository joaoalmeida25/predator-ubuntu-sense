import { useCallback, useRef } from "react";

import type { NeuralCorePublicError } from "../core/neural-core-error.types";
import type { NeuralCoreEvent } from "../core/neural-core-event.types";

interface UseNeuralCorePublicEventsParams {
  readonly onError?: (error: NeuralCorePublicError) => void;
  readonly onEvent?: (event: NeuralCoreEvent) => void;
}

interface UseNeuralCorePublicEventsResult {
  readonly emitEvent: (event: NeuralCoreEvent) => void;
  readonly reportErrorOnce: (identity: string, error: NeuralCorePublicError) => void;
}

export const useNeuralCorePublicEvents = ({
  onError,
  onEvent,
}: UseNeuralCorePublicEventsParams): UseNeuralCorePublicEventsResult => {
  const errorCallbackRef = useRef(onError);
  const eventCallbackRef = useRef(onEvent);
  const reportedErrorIdentitiesRef = useRef(new Set<string>());
  errorCallbackRef.current = onError;
  eventCallbackRef.current = onEvent;

  const emitEvent = useCallback((event: NeuralCoreEvent): void => {
    eventCallbackRef.current?.(event);
  }, []);

  const reportErrorOnce = useCallback((
    identity: string,
    error: NeuralCorePublicError,
  ): void => {
    if (reportedErrorIdentitiesRef.current.has(identity)) {
      return;
    }
    reportedErrorIdentitiesRef.current.add(identity);
    errorCallbackRef.current?.(error);
  }, []);

  return { emitEvent, reportErrorOnce };
};
