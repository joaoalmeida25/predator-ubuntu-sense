import type { NeuralCoreClusterId } from "../core/neural-core-id.types";
import type {
  NeuralCoreInteractionState,
} from "../core/neural-core-interaction.types";
import type { NeuralCoreModel } from "../core/neural-core-model.types";
import { toNeuralCoreIdAfterValidation } from "../validation/neural-core-identifiers";
import type { NeuralCoreDiagnostic } from "../validation/neural-core-validation.types";

export interface NeuralCoreResolvedInteractionState {
  readonly mode: NeuralCoreInteractionState["mode"];
  readonly selectedClusterId?: NeuralCoreClusterId;
  readonly paused: boolean;
}

export interface NeuralCoreInteractionAdapterResult {
  readonly state: NeuralCoreResolvedInteractionState;
  readonly diagnostic?: NeuralCoreDiagnostic;
}

export const adaptNeuralCoreInteractionState = (
  state: NeuralCoreInteractionState,
  model: NeuralCoreModel,
): NeuralCoreInteractionAdapterResult => {
  if (state.selectedClusterId === undefined) {
    return Object.freeze({
      state: Object.freeze({ mode: state.mode, paused: state.paused }),
    });
  }

  const normalizedId = state.selectedClusterId.trim();
  const clusterExists = model.clusters.some((cluster) => cluster.id === normalizedId);
  if (!clusterExists) {
    return Object.freeze({
      state: Object.freeze({ mode: state.mode, paused: state.paused }),
      diagnostic: Object.freeze({
        code: "invalid-interaction-selection",
        severity: "error",
        message: `Selected cluster "${state.selectedClusterId}" does not exist in the model.`,
        path: Object.freeze(["interactionState", "selectedClusterId"]),
        relatedIds: Object.freeze([state.selectedClusterId]),
      }),
    });
  }

  return Object.freeze({
    state: Object.freeze({
      mode: state.mode,
      selectedClusterId: toNeuralCoreIdAfterValidation<"cluster">(normalizedId),
      paused: state.paused,
    }),
  });
};

export const adaptResolvedNeuralCoreInteractionState = (
  state: NeuralCoreResolvedInteractionState,
): NeuralCoreInteractionState => {
  return Object.freeze({
    mode: state.mode,
    ...(state.selectedClusterId === undefined
      ? {}
      : { selectedClusterId: String(state.selectedClusterId) }),
    paused: state.paused,
  });
};
