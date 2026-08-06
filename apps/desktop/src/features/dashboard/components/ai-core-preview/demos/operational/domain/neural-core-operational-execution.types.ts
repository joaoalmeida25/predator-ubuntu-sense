import type { NeuralCoreOperationalEvent } from "./neural-core-operational-event.types";
import type { NeuralCoreOperationalOutcome } from "./neural-core-operational-outcome.types";

export type NeuralCoreOperationalExecutionKind =
  | "success"
  | "degraded"
  | "failure-recovery";

export interface NeuralCoreOperationalExecution {
  id: string;
  name: string;
  shortName: string;
  kind: NeuralCoreOperationalExecutionKind;
  description: string;
  events: readonly NeuralCoreOperationalEvent[];
  outcome: NeuralCoreOperationalOutcome;
  playback?: {
    recommendedDurationMs: number;
    minimumSpeed: number;
    maximumSpeed: number;
  };
}
