import type {
  MapNeuralCoreSemanticFocusLensStateParams,
  NeuralCoreSemanticFocusLensConfig,
  NeuralCoreSemanticFocusLensState,
  WriteNeuralCoreSemanticFocusLensTargetParams,
} from "./neural-core-semantic-focus-lens.types";
import {
  clampNeuralCoreSemanticFocusLensValue,
  resolveNeuralCoreSemanticFocusLensConfig,
} from "./neural-core-semantic-focus-lens.utils";

const smoothStep = (minimum: number, maximum: number, value: number): number => {
  if (maximum <= minimum) {
    return value >= maximum ? 1 : 0;
  }
  const amount = clampNeuralCoreSemanticFocusLensValue(
    (value - minimum) / (maximum - minimum),
  );
  return amount * amount * (3 - 2 * amount);
};

const finiteDistance = (value: number | undefined, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback
);

const createNeutralState = (): NeuralCoreSemanticFocusLensState => ({
  enabled: false,
  focusProgress: 0,
  contextProgress: 0,
  detailProgress: 0,
  selectedRegionWeight: 1,
  relatedRegionWeight: 1,
  nearbyContextWeight: 1,
  distantContextWeight: 1,
  brainShellWeight: 1,
  aggregatedRouteWeight: 1,
  detailedSynapseWeight: 1,
  territoryRepresentationWeight: 1,
  internalNodeDetailWeight: 1,
  internalConnectionDetailWeight: 1,
  aggregatedActivityWeight: 1,
  realActivityWeight: 1,
  aggregatedRouteThickness: 1,
  detailedSynapseThickness: 1,
  brainContext: {
    shellOpacity: 1,
    baseNodeOpacity: 1,
    baseConnectionOpacity: 1,
    ambientOpacity: 1,
    selectedRegionEmphasis: 1,
    relatedRegionEmphasis: 1,
  },
});

export const writeNeuralCoreSemanticFocusLensTarget = (
  target: NeuralCoreSemanticFocusLensState,
  params: WriteNeuralCoreSemanticFocusLensTargetParams,
  config: NeuralCoreSemanticFocusLensConfig,
): void => {
  if (!config.enabled) {
    target.enabled = false;
    target.selectedClusterId = undefined;
    target.focusProgress = 0;
    target.contextProgress = 0;
    target.detailProgress = 0;
    target.selectedRegionWeight = 1;
    target.relatedRegionWeight = 1;
    target.nearbyContextWeight = 1;
    target.distantContextWeight = 1;
    target.brainShellWeight = 1;
    target.aggregatedRouteWeight = 1;
    target.detailedSynapseWeight = 1;
    target.territoryRepresentationWeight = 1;
    target.internalNodeDetailWeight = 1;
    target.internalConnectionDetailWeight = 1;
    target.aggregatedActivityWeight = 1;
    target.realActivityWeight = 1;
    target.aggregatedRouteThickness = 1;
    target.detailedSynapseThickness = 1;
    target.brainContext.shellOpacity = 1;
    target.brainContext.baseNodeOpacity = 1;
    target.brainContext.baseConnectionOpacity = 1;
    target.brainContext.ambientOpacity = 1;
    target.brainContext.selectedRegionEmphasis = 1;
    target.brainContext.relatedRegionEmphasis = 1;
    return;
  }
  const hasSelection = params.interactionMode === "inspection"
    && params.selectedClusterId !== undefined;
  const macro = clampNeuralCoreSemanticFocusLensValue(params.densityWeights.macroWeight);
  const meso = clampNeuralCoreSemanticFocusLensValue(params.densityWeights.mesoWeight);
  const micro = clampNeuralCoreSemanticFocusLensValue(params.densityWeights.microWeight);
  const brainDistance = Math.max(0.0001, finiteDistance(params.cameraDistanceToBrain, 1));
  const selectedDistance = finiteDistance(params.cameraDistanceToSelected, brainDistance);
  const proximity = hasSelection
    ? 1 - smoothStep(0.42, 1.08, selectedDistance / brainDistance)
    : 0;
  const detailProgress = hasSelection
    ? clampNeuralCoreSemanticFocusLensValue(meso * 0.52 + micro + proximity * 0.12)
    : 0;
  const focusProgress = hasSelection
    ? clampNeuralCoreSemanticFocusLensValue(
      0.48 + meso * 0.28 + micro * 0.46 + proximity * 0.16,
    )
    : 0;
  const contextProgress = clampNeuralCoreSemanticFocusLensValue(
    focusProgress * (0.42 + detailProgress * 0.42),
  );
  const nearbyNodeFloor = config.brainContext.minimumNearbyNodeOpacity;
  const nearbyConnectionFloor = config.brainContext.minimumNearbyConnectionOpacity;
  const distantNodeFloor = config.brainContext.minimumDistantNodeOpacity;
  const distantConnectionFloor = config.brainContext.minimumDistantConnectionOpacity;
  target.enabled = true;
  target.selectedClusterId = hasSelection ? params.selectedClusterId : undefined;
  target.focusProgress = focusProgress;
  target.contextProgress = contextProgress;
  target.detailProgress = detailProgress;
  target.selectedRegionWeight = 0.82 + detailProgress * 0.18;
  target.relatedRegionWeight = 0.68 + (1 - contextProgress) * 0.18;
  target.nearbyContextWeight = Math.max(nearbyNodeFloor, 0.58 - contextProgress * 0.16);
  target.distantContextWeight = Math.max(distantNodeFloor, 0.34 - contextProgress * 0.2);
  target.brainShellWeight = Math.max(
    config.brainContext.minimumShellOpacity,
    1 - contextProgress * 0.42,
  );
  target.aggregatedRouteWeight = hasSelection
    ? config.routes.mesoRelatedOpacity * meso
      + config.routes.microAggregatedOpacity * micro
      + config.routes.macroMaximumOpacity * macro
    : config.routes.macroMaximumOpacity;
  target.detailedSynapseWeight = hasSelection
    ? Math.max(
      distantConnectionFloor,
      config.routes.microDetailedSynapseOpacity * detailProgress,
    )
    : Math.max(distantConnectionFloor, config.routes.macroMaximumOpacity * 0.42);
  target.territoryRepresentationWeight = 1 - detailProgress * 0.7;
  target.internalNodeDetailWeight = hasSelection
    ? config.detailReveal.mesoInternalNodeVisibility * meso
      + config.detailReveal.microInternalNodeVisibility * micro
    : 0;
  target.internalConnectionDetailWeight = hasSelection
    ? config.detailReveal.mesoInternalConnectionVisibility * meso
      + config.detailReveal.microInternalConnectionVisibility * micro
    : 0;
  target.aggregatedActivityWeight = 1 - detailProgress * 0.72;
  target.realActivityWeight = hasSelection ? 0.18 + detailProgress * 0.82 : 0.44;
  target.aggregatedRouteThickness = hasSelection
    ? config.routes.macroMaximumThickness * macro
      + config.routes.macroMaximumThickness * 0.72 * meso
      + config.routes.macroMaximumThickness * 0.34 * micro
    : config.routes.macroMaximumThickness;
  target.detailedSynapseThickness = hasSelection ? 0.36 + detailProgress * 0.64 : 0.68;
  target.brainContext.shellOpacity = target.brainShellWeight;
  target.brainContext.baseNodeOpacity = hasSelection
    ? Math.max(
      distantNodeFloor,
      0.38 * macro + 0.24 * meso + distantNodeFloor * micro,
    )
    : 0.38;
  target.brainContext.baseConnectionOpacity = hasSelection
    ? Math.max(
      distantConnectionFloor,
      0.18 * macro + 0.1 * meso + distantConnectionFloor * micro,
    )
    : 0.18;
  target.brainContext.ambientOpacity = hasSelection
    ? Math.max(0.32, 0.72 - contextProgress * 0.3)
    : 0.72;
  target.brainContext.selectedRegionEmphasis = hasSelection
    ? 0.86 + detailProgress * 0.14
    : 1;
  target.brainContext.relatedRegionEmphasis = hasSelection
    ? Math.max(nearbyConnectionFloor, 0.68 - contextProgress * 0.12)
    : 1;
};

export const mapNeuralCoreSemanticFocusLensState = ({
  config: configInput,
  ...params
}: MapNeuralCoreSemanticFocusLensStateParams): NeuralCoreSemanticFocusLensState => {
  const config = resolveNeuralCoreSemanticFocusLensConfig(configInput);
  const state = createNeutralState();
  writeNeuralCoreSemanticFocusLensTarget(state, params, config);
  return state;
};

export const createNeuralCoreSemanticFocusLensRuntime = (
  config: NeuralCoreSemanticFocusLensConfig,
): NeuralCoreSemanticFocusLensState => {
  const state = createNeutralState();
  writeNeuralCoreSemanticFocusLensTarget(
    state,
    {
      interactionMode: "presentation",
      cameraDistanceToBrain: 1,
      densityWeights: { macroWeight: 1, mesoWeight: 0, microWeight: 0 },
    },
    config,
  );
  return state;
};
