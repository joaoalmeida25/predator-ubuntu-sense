import type { CSSProperties } from "react";

import type {
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeState,
} from "../../domain/narrative/neural-core-narrative.types";

export interface NeuralCoreNarrativeOverlayProps {
  config: NeuralCoreNarrativeConfig;
  state: NeuralCoreNarrativeState;
}

export interface NeuralCoreNarrativeOverlayViewProps {
  description?: string;
  label: string;
  phaseKey: string;
  progressLabel?: string;
  style: CSSProperties;
}
