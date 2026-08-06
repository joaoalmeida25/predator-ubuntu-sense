import type { NeuralCoreOperationalExecution } from "../domain/neural-core-operational-execution.types";
import type { NeuralCoreOperationalEvent } from "../domain/neural-core-operational-event.types";
import type { NeuralCoreOperationalScenario } from "../domain/neural-core-operational-scenario.types";
import type {
  NeuralCoreOperationalRuntimeConfigInput,
  NeuralCoreOperationalRuntimeController,
  NeuralCoreOperationalRuntimeProgressRefs,
  NeuralCoreOperationalRouteIndex,
} from "../runtime/neural-core-operational-runtime.types";
import type {
  NeuralCoreOperationalPresentationEvent,
  NeuralCoreOperationalPresentationTimeline,
} from "../runtime/neural-core-operational-presentation.types";

export interface UseNeuralCoreOperationalRuntimeParams {
  execution: NeuralCoreOperationalExecution;
  scenario: NeuralCoreOperationalScenario;
  config?: NeuralCoreOperationalRuntimeConfigInput;
  suspended?: boolean;
  resetKey?: string;
}

export interface UseNeuralCoreOperationalRuntimeResult
  extends NeuralCoreOperationalRuntimeController,
  NeuralCoreOperationalRuntimeProgressRefs {
  autoFollowInPresentation: boolean;
  activeRouteEvent?: NeuralCoreOperationalEvent;
  activeRoutePresentationEvent?: NeuralCoreOperationalPresentationEvent;
  activeRoute?: NeuralCoreOperationalRouteIndex["route"];
  presentationTimeline: NeuralCoreOperationalPresentationTimeline;
}
