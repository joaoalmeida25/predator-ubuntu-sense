import type { NeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.types";
import type { NeuralCoreState } from "../../domain/contract/neural-core-contract.types";
import type { NeuralCoreSceneDirectionTimeline } from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreNarrative } from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreOperationalDemoMetadata } from "../../domain/operational-runtime/types/neural-core-operational-scenario.types";

export type NeuralCoreDemoScenario =
  | "none"
  | "data-flow"
  | "function-execution"
  | "memory-sync"
  | "process-pipeline"
  | "warning-state"
  | "error-state"
  | "success-state"
  | "operational-flow";

export type NeuralCoreAnimatedDemoScenario = Exclude<
  NeuralCoreDemoScenario,
  "none" | "operational-flow"
>;

export interface NeuralCoreDemoOption {
  scenario: NeuralCoreDemoScenario;
  label: string;
  shortLabel?: string;
  description: string;
}

export interface NeuralCoreDemoDefinition {
  scenario: NeuralCoreDemoScenario;
  state?: NeuralCoreState;
  choreography?: NeuralCoreChoreography;
  sceneDirection?: NeuralCoreSceneDirectionTimeline;
  narrative?: NeuralCoreNarrative;
  operational?: NeuralCoreOperationalDemoMetadata;
}
