import { useCallback, useRef } from "react";

import { evaluateNeuralCoreNarrative } from "../../domain/narrative/neural-core-narrative.engine";
import type { NeuralCoreNarrative } from "../../domain/narrative/neural-core-narrative.types";
import type {
  UseNeuralCoreNarrativeParams,
  UseNeuralCoreNarrativeResult,
} from "./use-neural-core-narrative.types";

const createNarrativeKey = (narrative?: NeuralCoreNarrative): string => {
  return narrative
    ? `${narrative.id}:${narrative.durationSeconds}:${narrative.phases.map(({ id }) => id).join("|")}`
    : "none";
};

export const useNeuralCoreNarrative = ({
  narrative,
  resetKey = "none",
}: UseNeuralCoreNarrativeParams): UseNeuralCoreNarrativeResult => {
  const narrativeRef = useRef(narrative);
  narrativeRef.current = narrative;
  const identityKey = `${resetKey}:${createNarrativeKey(narrative)}`;
  const identityKeyRef = useRef(identityKey);
  const elapsedSecondsRef = useRef(0);
  if (identityKeyRef.current !== identityKey) {
    identityKeyRef.current = identityKey;
    elapsedSecondsRef.current = 0;
  }

  const reset = useCallback((): void => {
    elapsedSecondsRef.current = 0;
  }, []);

  const advance = useCallback((
    deltaSeconds: number,
    synchronizedElapsedSeconds?: number,
  ) => {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.min(0.1, Math.max(0, deltaSeconds))
      : 0;
    elapsedSecondsRef.current = typeof synchronizedElapsedSeconds === "number"
      && Number.isFinite(synchronizedElapsedSeconds)
      ? Math.max(0, synchronizedElapsedSeconds)
      : elapsedSecondsRef.current + safeDeltaSeconds;
    return evaluateNeuralCoreNarrative({
      narrative: narrativeRef.current,
      elapsedSeconds: elapsedSecondsRef.current,
    });
  }, []);

  return { advance, reset };
};
