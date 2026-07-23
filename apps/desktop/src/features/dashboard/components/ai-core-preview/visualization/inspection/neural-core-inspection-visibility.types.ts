import type {
  NeuralCoreInteractionMode,
} from "../../domain/inspection/neural-core-inspection.types";

export type NeuralCoreInspectionVisualElementKind =
  | "node"
  | "connection"
  | "internal-connection"
  | "pulse"
  | "ambient"
  | "decorative";

export interface NeuralCoreInspectionVisibilityState {
  enabled: boolean;
  isNeutral: boolean;
  hasSelection: boolean;
  isContextPanelOpen: boolean;
  selectedClusterIds: readonly string[];
  relatedClusterIds: readonly string[];
  relatedSynapseIds: readonly string[];
  relatedPathwayIds: readonly string[];
  selectedWeight: number;
  relatedWeight: number;
  contextWeight: number;
  contextConnectionWeight: number;
  ambientWeight: number;
  decorativeWeight: number;
  arcWeight: number;
  baseWeight: number;
  globalGlowWeight: number;
  selectedConnectionWeight: number;
  selectedInternalConnectionWeight: number;
  relatedConnectionWeight: number;
  relatedConnectionMinimumThickness: number;
  protagonistThicknessMultiplier: number;
  relatedThicknessMultiplier: number;
  protagonistPulseWeight: number;
  relatedPulseWeight: number;
  selectedEmphasis: number;
  relatedEmphasis: number;
  selectedMinimumNodeOpacity: number;
  selectedMinimumConnectionOpacity: number;
  selectedMinimumInternalConnectionOpacity: number;
  selectedMinimumPulseOpacity: number;
  relatedMinimumNodeOpacity: number;
  relatedMinimumConnectionOpacity: number;
  relatedMinimumPulseOpacity: number;
  contextMinimumNodeOpacity: number;
  contextMinimumConnectionOpacity: number;
  macroWeight: number;
  mesoWeight: number;
  microWeight: number;
}

export type NeuralCoreInspectionVisibilityInteractionMode = NeuralCoreInteractionMode;
