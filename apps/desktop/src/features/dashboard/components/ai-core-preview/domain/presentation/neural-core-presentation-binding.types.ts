import type { NeuralCoreChoreography } from "../choreography/neural-core-choreography.types";
import type { NeuralCoreNarrative } from "../narrative/neural-core-narrative.types";
import type { NeuralCoreSceneDirectionTimeline } from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreSemanticFocusLensConfigInput } from "../../visualization/focus-lens/neural-core-semantic-focus-lens.types";

export interface NeuralCorePresentationBinding {
  readonly choreography?: NeuralCoreChoreography;
  readonly narrative?: NeuralCoreNarrative;
  readonly presentationKey: string;
  readonly sceneDirection?: NeuralCoreSceneDirectionTimeline;
  readonly semanticFocusLensConfig?: NeuralCoreSemanticFocusLensConfigInput;
}
