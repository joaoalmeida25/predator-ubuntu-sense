import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { NeuralCoreConfigAdapterResult } from "../../api/adapters/neural-core-config.adapter";
import type { NeuralCoreModelAdapterResult } from "../../api/adapters/neural-core-model.adapter";
import type { NeuralCoreInternalRuntime } from "../../api/adapters/neural-core-runtime.adapter";
import type {
  NeuralCoreInteractionMode,
  NeuralCoreInteractionState,
} from "../../api/core/neural-core-interaction.types";
import type { NeuralCoreRuntimeBinding } from "../neural-core-runtime/neural-core-runtime-binding.context";
import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCorePresentationBinding } from "../../domain/presentation/neural-core-presentation-binding.types";
import type { NeuralCoreInspectionBinding } from "./neural-core-inspection-binding.context";

export interface NeuralCoreRendererInteractionController {
  readonly state: NeuralCoreInteractionState;
  readonly requestMode: (mode: NeuralCoreInteractionMode) => void;
  readonly requestPaused: (paused: boolean) => void;
  readonly requestSelection: (
    clusterId: string | undefined,
    reason?: "user-action" | "reset",
  ) => void;
}

export interface NeuralCoreRendererProps {
  readonly config: NeuralCoreConfigAdapterResult;
  readonly interaction: NeuralCoreRendererInteractionController;
  readonly inspectionBinding?: NeuralCoreInspectionBinding;
  readonly model: NeuralCoreModelAdapterResult;
  readonly onReady?: () => void;
  readonly onNarrativeStateChange?: (state: NeuralCoreNarrativeState) => void;
  readonly onRuntimeCompleted?: () => void;
  readonly onRuntimeEventObserved?: (eventId: string) => void;
  readonly onRuntimeStarted?: () => void;
  readonly presentationBinding?: NeuralCorePresentationBinding;
  readonly runtime?: NeuralCoreInternalRuntime;
  readonly runtimeBinding?: NeuralCoreRuntimeBinding;
}

export interface NeuralCoreRendererViewState {
  readonly cameraResetRevision: number;
  readonly handleKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}
