import type {
  NeuralCoreConfigInput,
} from "../core/neural-core-config.types";
import type {
  NeuralCoreErrorHandler,
} from "../core/neural-core-error.types";
import type {
  NeuralCoreEventHandler,
} from "../core/neural-core-event.types";
import type {
  NeuralCoreInteractionBinding,
} from "../core/neural-core-interaction.types";
import type {
  NeuralCoreModelInput,
} from "../core/neural-core-model.types";
import type {
  NeuralCoreRuntimeInput,
} from "../core/neural-core-runtime.types";

export interface NeuralCoreBaseProps {
  readonly model: NeuralCoreModelInput;
  readonly config?: NeuralCoreConfigInput;
  readonly runtime?: NeuralCoreRuntimeInput;
  readonly onEvent?: NeuralCoreEventHandler;
  readonly onError?: NeuralCoreErrorHandler;
  readonly className?: string;
  readonly ariaLabel?: string;
}

export type NeuralCoreProps = NeuralCoreBaseProps & NeuralCoreInteractionBinding;
