import type {
  NeuralCoreInteractionMode,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  NeuralCoreVisualDensityWeights,
} from "../inspection/neural-core-visual-density.types";

export interface NeuralCoreBrainContextState {
  shellOpacity: number;
  baseNodeOpacity: number;
  baseConnectionOpacity: number;
  ambientOpacity: number;
  selectedRegionEmphasis: number;
  relatedRegionEmphasis: number;
}

export interface NeuralCoreSemanticFocusLensState {
  enabled: boolean;
  selectedClusterId?: string;
  focusProgress: number;
  contextProgress: number;
  detailProgress: number;
  selectedRegionWeight: number;
  relatedRegionWeight: number;
  nearbyContextWeight: number;
  distantContextWeight: number;
  brainShellWeight: number;
  aggregatedRouteWeight: number;
  detailedSynapseWeight: number;
  territoryRepresentationWeight: number;
  internalNodeDetailWeight: number;
  internalConnectionDetailWeight: number;
  aggregatedActivityWeight: number;
  realActivityWeight: number;
  aggregatedRouteThickness: number;
  detailedSynapseThickness: number;
  brainContext: NeuralCoreBrainContextState;
}

export interface NeuralCoreSemanticFocusLensConfig {
  enabled: boolean;
  brainContext: {
    minimumShellOpacity: number;
    minimumNearbyNodeOpacity: number;
    minimumNearbyConnectionOpacity: number;
    minimumDistantNodeOpacity: number;
    minimumDistantConnectionOpacity: number;
  };
  territory: {
    embeddedMode: boolean;
    boundaryMaximumOpacity: number;
    boundaryIrregularity: number;
    hubScale: number;
    hubMaximumBrightness: number;
  };
  detailReveal: {
    mesoInternalNodeVisibility: number;
    mesoInternalConnectionVisibility: number;
    microInternalNodeVisibility: number;
    microInternalConnectionVisibility: number;
  };
  routes: {
    macroMaximumOpacity: number;
    macroMaximumThickness: number;
    mesoRelatedOpacity: number;
    microAggregatedOpacity: number;
    microDetailedSynapseOpacity: number;
  };
  transitionDamping: number;
}

export interface NeuralCoreSemanticFocusLensConfigInput {
  enabled?: boolean;
  brainContext?: Partial<NeuralCoreSemanticFocusLensConfig["brainContext"]>;
  territory?: Partial<NeuralCoreSemanticFocusLensConfig["territory"]>;
  detailReveal?: Partial<NeuralCoreSemanticFocusLensConfig["detailReveal"]>;
  routes?: Partial<NeuralCoreSemanticFocusLensConfig["routes"]>;
  transitionDamping?: number;
}

export interface MapNeuralCoreSemanticFocusLensStateParams {
  interactionMode: NeuralCoreInteractionMode;
  selectedClusterId?: string;
  runtimeFocusedClusterId?: string;
  cameraDistanceToSelected?: number;
  cameraDistanceToBrain: number;
  densityWeights: NeuralCoreVisualDensityWeights;
  config?: NeuralCoreSemanticFocusLensConfigInput;
}

export interface WriteNeuralCoreSemanticFocusLensTargetParams {
  interactionMode: NeuralCoreInteractionMode;
  selectedClusterId?: string;
  runtimeFocusedClusterId?: string;
  cameraDistanceToSelected?: number;
  cameraDistanceToBrain: number;
  densityWeights: NeuralCoreVisualDensityWeights;
}
