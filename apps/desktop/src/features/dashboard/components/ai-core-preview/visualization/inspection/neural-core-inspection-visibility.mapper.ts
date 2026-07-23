import type {
  NeuralCoreInspectionVisualDensityConfig,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  NeuralCoreInspectionVisibilityState,
} from "./neural-core-inspection-visibility.types";

export interface MapNeuralCoreInspectionVisibilityStateParams {
  inspectionMode: boolean;
  selectedClusterId?: string;
  relatedClusterIds: readonly string[];
  relatedSynapseIds: readonly string[];
  relatedPathwayIds: readonly string[];
  cameraDistance: number;
  isContextPanelOpen?: boolean;
  config: NeuralCoreInspectionVisualDensityConfig;
}

export const mapNeuralCoreInspectionVisibilityState = ({
  inspectionMode,
  selectedClusterId,
  relatedClusterIds,
  relatedSynapseIds,
  relatedPathwayIds,
  isContextPanelOpen = false,
  config,
}: MapNeuralCoreInspectionVisibilityStateParams): NeuralCoreInspectionVisibilityState => {
  const densityWeights = { macroWeight: 1, mesoWeight: 0, microWeight: 0 };
  const selectedClusterIds = selectedClusterId ? [selectedClusterId] : [];
  const hasSelection = selectedClusterIds.length > 0;

  return {
    enabled: config.enabled && inspectionMode && hasSelection,
    isNeutral: inspectionMode && !hasSelection,
    hasSelection,
    isContextPanelOpen,
    selectedClusterIds,
    relatedClusterIds,
    relatedSynapseIds,
    relatedPathwayIds,
    selectedWeight: 1,
    relatedWeight: 1,
    contextWeight: 1,
    contextConnectionWeight: 1,
    ambientWeight: 1,
    decorativeWeight: 1,
    arcWeight: 1,
    baseWeight: 1,
    globalGlowWeight: 1,
    selectedConnectionWeight: 1,
    selectedInternalConnectionWeight: 1,
    relatedConnectionWeight: 1,
    relatedConnectionMinimumThickness: config.relatedConnections.minimumThickness,
    protagonistThicknessMultiplier: 1,
    relatedThicknessMultiplier: 1,
    protagonistPulseWeight: 1,
    relatedPulseWeight: 1,
    selectedEmphasis: 1,
    relatedEmphasis: 1,
    selectedMinimumNodeOpacity: config.visibility.selected.minimumNodeOpacity,
    selectedMinimumConnectionOpacity: config.visibility.selected.minimumConnectionOpacity,
    selectedMinimumInternalConnectionOpacity:
      config.visibility.selected.minimumInternalConnectionOpacity,
    selectedMinimumPulseOpacity: config.visibility.selected.minimumPulseOpacity,
    relatedMinimumNodeOpacity: config.visibility.related.minimumNodeOpacity,
    relatedMinimumConnectionOpacity: config.visibility.related.minimumConnectionOpacity,
    relatedMinimumPulseOpacity: config.visibility.related.minimumPulseOpacity,
    contextMinimumNodeOpacity: config.visibility.context.minimumNodeOpacity,
    contextMinimumConnectionOpacity: config.visibility.context.minimumConnectionOpacity,
    ...densityWeights,
  };
};
