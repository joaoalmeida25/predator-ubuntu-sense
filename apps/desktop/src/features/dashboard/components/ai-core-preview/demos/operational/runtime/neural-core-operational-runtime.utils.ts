import type { NeuralCoreOperationalEvent } from "../domain/neural-core-operational-event.types";
import { DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG } from "./neural-core-operational-runtime.constants";
import type {
  NeuralCoreOperationalRuntimeConfig,
  NeuralCoreOperationalRuntimeConfigInput,
} from "./neural-core-operational-runtime.types";

export const clampNeuralCoreOperationalRuntimeValue = (
  value: number,
  minimum = 0,
  maximum = 1,
): number => Math.min(
  maximum,
  Math.max(minimum, Number.isFinite(value) ? value : minimum),
);

const finitePositive = (value: number | undefined, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback
);

export const resolveNeuralCoreOperationalRuntimeConfig = (
  input?: NeuralCoreOperationalRuntimeConfigInput,
): Readonly<NeuralCoreOperationalRuntimeConfig> => Object.freeze({
  enabled: input?.enabled ?? DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG.enabled,
  autoStart: input?.autoStart ?? DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG.autoStart,
  playbackRate: finitePositive(
    input?.playbackRate,
    DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG.playbackRate,
  ),
  eventEmphasisDurationMs: finitePositive(
    input?.eventEmphasisDurationMs,
    DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG.eventEmphasisDurationMs,
  ),
  autoFollowInPresentation: input?.autoFollowInPresentation
    ?? DEFAULT_NEURAL_CORE_OPERATIONAL_RUNTIME_CONFIG.autoFollowInPresentation,
  ...(input?.presentationPacing
    ? { presentationPacing: input.presentationPacing }
    : {}),
});

export const getNeuralCoreOperationalEventEndMs = (
  event: NeuralCoreOperationalEvent,
  eventEmphasisDurationMs: number,
): number => event.atMs + (
  typeof event.durationMs === "number" && event.durationMs > 0
    ? event.durationMs
    : eventEmphasisDurationMs
);

export const getNeuralCoreOperationalEventProgress = (
  event: NeuralCoreOperationalEvent,
  elapsedMs: number,
  eventEmphasisDurationMs: number,
): number => clampNeuralCoreOperationalRuntimeValue(
  (elapsedMs - event.atMs) / Math.max(
    0.001,
    typeof event.durationMs === "number" && event.durationMs > 0
      ? event.durationMs
      : eventEmphasisDurationMs,
  ),
);

export const isNeuralCoreOperationalEventActive = (
  event: NeuralCoreOperationalEvent,
  elapsedMs: number,
  eventEmphasisDurationMs: number,
): boolean => elapsedMs >= event.atMs
  && elapsedMs < getNeuralCoreOperationalEventEndMs(event, eventEmphasisDurationMs);
