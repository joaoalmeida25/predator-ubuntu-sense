import type {
  NeuralCoreSemanticFocusLensConfig,
} from "./neural-core-semantic-focus-lens.types";

export const DEFAULT_NEURAL_CORE_SEMANTIC_FOCUS_LENS_CONFIG:
NeuralCoreSemanticFocusLensConfig = {
  enabled: false,
  brainContext: {
    minimumShellOpacity: 0.36,
    minimumNearbyNodeOpacity: 0.68,
    minimumNearbyConnectionOpacity: 0.62,
    minimumDistantNodeOpacity: 0.3,
    minimumDistantConnectionOpacity: 0.26,
  },
  territory: {
    embeddedMode: true,
    boundaryMaximumOpacity: 0.1,
    boundaryIrregularity: 0.38,
    hubScale: 0.78,
    hubMaximumBrightness: 0.7,
  },
  detailReveal: {
    mesoInternalNodeVisibility: 0.68,
    mesoInternalConnectionVisibility: 0.62,
    microInternalNodeVisibility: 1,
    microInternalConnectionVisibility: 0.94,
  },
  routes: {
    macroMaximumOpacity: 0.32,
    macroMaximumThickness: 0.78,
    mesoRelatedOpacity: 0.48,
    microAggregatedOpacity: 0.12,
    microDetailedSynapseOpacity: 0.96,
  },
  transitionDamping: 6.2,
};
