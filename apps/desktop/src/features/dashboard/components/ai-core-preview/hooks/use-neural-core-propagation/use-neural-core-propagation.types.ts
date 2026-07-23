import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationEvent,
  NeuralCorePropagationPlan,
} from "../../domain/propagation/neural-core-propagation.types";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCorePropagationVisualState } from "../../visualization/propagation/neural-core-propagation-visual.types";

export interface UseNeuralCorePropagationParams {
  config: NeuralCorePropagationConfig;
  onPropagationEvent?: (event: NeuralCorePropagationEvent) => void;
  resetKey?: string;
  topology?: NeuralCoreTopology;
}

export interface UseNeuralCorePropagationResult {
  advance: (deltaSeconds: number) => NeuralCorePropagationVisualState;
  config: NeuralCorePropagationConfig;
  plan?: NeuralCorePropagationPlan;
  reset: () => void;
}
