import type {
  NeuralCoreChoreography,
  NeuralCoreChoreographyEvaluation,
} from "../../domain/choreography/neural-core-choreography.types";
import type { NeuralCoreSemanticVisualizationConfig } from "../../visualization/semantic/neural-core-semantic-visual.types";

export interface UseNeuralCoreChoreographyParams {
  choreography?: NeuralCoreChoreography;
  config: NeuralCoreSemanticVisualizationConfig;
  resetKey?: string;
}

export interface UseNeuralCoreChoreographyResult {
  advance: (deltaSeconds: number) => NeuralCoreChoreographyEvaluation;
  reset: () => void;
}
