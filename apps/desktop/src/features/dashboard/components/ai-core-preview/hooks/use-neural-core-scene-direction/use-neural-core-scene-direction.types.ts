import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionState,
  NeuralCoreSceneDirectionTimeline,
} from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreTopologyVisualState } from "../../visualization/topology/neural-core-topology-visual.types";

export interface UseNeuralCoreSceneDirectionParams {
  config: NeuralCoreSceneDirectionConfig;
  resetKey?: string;
  timeline?: NeuralCoreSceneDirectionTimeline;
  topologyVisualState: NeuralCoreTopologyVisualState;
}

export interface UseNeuralCoreSceneDirectionResult {
  advance: (deltaSeconds: number) => NeuralCoreSceneDirectionState;
  reset: () => void;
}
