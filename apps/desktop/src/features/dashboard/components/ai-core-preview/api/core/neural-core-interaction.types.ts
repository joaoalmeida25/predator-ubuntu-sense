export type NeuralCoreInteractionMode = "presentation" | "inspection";

export interface NeuralCoreInteractionStateInput {
  readonly mode?: NeuralCoreInteractionMode;
  readonly selectedClusterId?: string;
  readonly paused?: boolean;
}

export interface NeuralCoreInteractionState {
  readonly mode: NeuralCoreInteractionMode;
  readonly selectedClusterId?: string;
  readonly paused: boolean;
}

export type NeuralCoreInteractionChangeReason =
  | "mode-changed"
  | "cluster-selected"
  | "cluster-selection-cleared"
  | "paused"
  | "resumed"
  | "reset";

export type NeuralCoreInteractionStateChangeHandler = (
  state: NeuralCoreInteractionState,
  reason: NeuralCoreInteractionChangeReason,
) => void;

export interface NeuralCoreControlledInteractionBinding {
  readonly interactionState: NeuralCoreInteractionState;
  readonly defaultInteractionState?: never;
  readonly onInteractionStateChange: NeuralCoreInteractionStateChangeHandler;
}

export interface NeuralCoreUncontrolledInteractionBinding {
  readonly interactionState?: never;
  readonly defaultInteractionState?: NeuralCoreInteractionStateInput;
  readonly onInteractionStateChange?: NeuralCoreInteractionStateChangeHandler;
}

export type NeuralCoreInteractionBinding =
  | NeuralCoreControlledInteractionBinding
  | NeuralCoreUncontrolledInteractionBinding;
