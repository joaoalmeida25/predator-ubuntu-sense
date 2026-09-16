import type {
  NeuralCoreInteractionState,
  NeuralCoreInteractionStateInput,
} from "../core/neural-core-interaction.types";

export const DEFAULT_NEURAL_CORE_INTERACTION_STATE = {
  mode: "presentation",
  paused: false,
} as const satisfies NeuralCoreInteractionState;

Object.freeze(DEFAULT_NEURAL_CORE_INTERACTION_STATE);

export const createNeuralCoreInteractionState = (
  input: NeuralCoreInteractionStateInput = {},
): NeuralCoreInteractionState => {
  return Object.freeze({
    mode: input.mode ?? DEFAULT_NEURAL_CORE_INTERACTION_STATE.mode,
    ...(input.selectedClusterId === undefined
      ? {}
      : { selectedClusterId: input.selectedClusterId }),
    paused: input.paused ?? DEFAULT_NEURAL_CORE_INTERACTION_STATE.paused,
  });
};
