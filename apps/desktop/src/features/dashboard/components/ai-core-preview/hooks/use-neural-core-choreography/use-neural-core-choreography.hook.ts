import { useCallback, useRef } from "react";

import { evaluateNeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.engine";
import type { NeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.types";
import type {
  UseNeuralCoreChoreographyParams,
  UseNeuralCoreChoreographyResult,
} from "./use-neural-core-choreography.types";

const createChoreographyKey = (choreography?: NeuralCoreChoreography): string => {
  return choreography ? JSON.stringify(choreography) : "none";
};

export const useNeuralCoreChoreography = ({
  choreography,
  config,
  resetKey = "none",
}: UseNeuralCoreChoreographyParams): UseNeuralCoreChoreographyResult => {
  const choreographyKey = createChoreographyKey(choreography);
  const identityKey = `${resetKey}:${choreographyKey}`;
  const choreographyRef = useRef(choreography);
  choreographyRef.current = choreography;
  const configRef = useRef(config);
  configRef.current = config;
  const elapsedSecondsRef = useRef(0);
  const identityKeyRef = useRef(identityKey);
  if (identityKeyRef.current !== identityKey) {
    identityKeyRef.current = identityKey;
    elapsedSecondsRef.current = 0;
  }

  const reset = useCallback((): void => {
    elapsedSecondsRef.current = 0;
  }, []);

  const advance = useCallback((deltaSeconds: number): ReturnType<typeof evaluateNeuralCoreChoreography> => {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, Math.min(0.25, deltaSeconds))
      : 0;
    elapsedSecondsRef.current += safeDeltaSeconds;
    const currentConfig = configRef.current;
    const currentChoreography = choreographyRef.current;
    const effectiveChoreography = currentChoreography && currentChoreography.loop !== undefined
      ? currentChoreography
      : currentChoreography
        ? {
          ...currentChoreography,
          loop: currentConfig.choreography.loopDemoChoreographies,
        }
        : undefined;

    return evaluateNeuralCoreChoreography({
      choreography: effectiveChoreography,
      elapsedSeconds: elapsedSecondsRef.current,
      defaultTransitionSeconds: currentConfig.choreography.defaultTransitionSeconds,
      maximumActivePhases: currentConfig.choreography.maximumActivePhases,
    });
  }, []);

  return { advance, reset };
};
