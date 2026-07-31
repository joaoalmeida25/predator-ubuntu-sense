import {
  DEFAULT_NEURAL_CORE_SEMANTIC_FOCUS_LENS_CONFIG,
} from "./neural-core-semantic-focus-lens.constants";
import type {
  NeuralCoreSemanticFocusLensConfig,
  NeuralCoreSemanticFocusLensConfigInput,
  NeuralCoreSemanticFocusLensState,
} from "./neural-core-semantic-focus-lens.types";

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => typeof value === "number" && Number.isFinite(value)
  ? Math.min(maximum, Math.max(minimum, value))
  : fallback;

export const clampNeuralCoreSemanticFocusLensValue = (
  value: number,
): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export const resolveNeuralCoreSemanticFocusLensConfig = (
  input?: NeuralCoreSemanticFocusLensConfigInput,
): NeuralCoreSemanticFocusLensConfig => {
  const defaults = DEFAULT_NEURAL_CORE_SEMANTIC_FOCUS_LENS_CONFIG;
  return {
    enabled: input?.enabled ?? defaults.enabled,
    brainContext: {
      minimumShellOpacity: finiteInRange(
        input?.brainContext?.minimumShellOpacity,
        defaults.brainContext.minimumShellOpacity,
        0.05,
        1,
      ),
      minimumNearbyNodeOpacity: finiteInRange(
        input?.brainContext?.minimumNearbyNodeOpacity,
        defaults.brainContext.minimumNearbyNodeOpacity,
        0.03,
        1,
      ),
      minimumNearbyConnectionOpacity: finiteInRange(
        input?.brainContext?.minimumNearbyConnectionOpacity,
        defaults.brainContext.minimumNearbyConnectionOpacity,
        0.01,
        1,
      ),
      minimumDistantNodeOpacity: finiteInRange(
        input?.brainContext?.minimumDistantNodeOpacity,
        defaults.brainContext.minimumDistantNodeOpacity,
        0.02,
        1,
      ),
      minimumDistantConnectionOpacity: finiteInRange(
        input?.brainContext?.minimumDistantConnectionOpacity,
        defaults.brainContext.minimumDistantConnectionOpacity,
        0.005,
        1,
      ),
    },
    territory: {
      embeddedMode: input?.territory?.embeddedMode ?? defaults.territory.embeddedMode,
      boundaryMaximumOpacity: finiteInRange(
        input?.territory?.boundaryMaximumOpacity,
        defaults.territory.boundaryMaximumOpacity,
        0.01,
        0.3,
      ),
      boundaryIrregularity: finiteInRange(
        input?.territory?.boundaryIrregularity,
        defaults.territory.boundaryIrregularity,
        0,
        1,
      ),
      hubScale: finiteInRange(
        input?.territory?.hubScale,
        defaults.territory.hubScale,
        0.25,
        1.2,
      ),
      hubMaximumBrightness: finiteInRange(
        input?.territory?.hubMaximumBrightness,
        defaults.territory.hubMaximumBrightness,
        0.1,
        1,
      ),
    },
    detailReveal: {
      mesoInternalNodeVisibility: finiteInRange(
        input?.detailReveal?.mesoInternalNodeVisibility,
        defaults.detailReveal.mesoInternalNodeVisibility,
        0,
        1,
      ),
      mesoInternalConnectionVisibility: finiteInRange(
        input?.detailReveal?.mesoInternalConnectionVisibility,
        defaults.detailReveal.mesoInternalConnectionVisibility,
        0,
        1,
      ),
      microInternalNodeVisibility: finiteInRange(
        input?.detailReveal?.microInternalNodeVisibility,
        defaults.detailReveal.microInternalNodeVisibility,
        0,
        1,
      ),
      microInternalConnectionVisibility: finiteInRange(
        input?.detailReveal?.microInternalConnectionVisibility,
        defaults.detailReveal.microInternalConnectionVisibility,
        0,
        1,
      ),
    },
    routes: {
      macroMaximumOpacity: finiteInRange(
        input?.routes?.macroMaximumOpacity,
        defaults.routes.macroMaximumOpacity,
        0.01,
        0.5,
      ),
      macroMaximumThickness: finiteInRange(
        input?.routes?.macroMaximumThickness,
        defaults.routes.macroMaximumThickness,
        0.05,
        1,
      ),
      mesoRelatedOpacity: finiteInRange(
        input?.routes?.mesoRelatedOpacity,
        defaults.routes.mesoRelatedOpacity,
        0.01,
        0.7,
      ),
      microAggregatedOpacity: finiteInRange(
        input?.routes?.microAggregatedOpacity,
        defaults.routes.microAggregatedOpacity,
        0,
        0.4,
      ),
      microDetailedSynapseOpacity: finiteInRange(
        input?.routes?.microDetailedSynapseOpacity,
        defaults.routes.microDetailedSynapseOpacity,
        0,
        1,
      ),
    },
    transitionDamping: finiteInRange(
      input?.transitionDamping,
      defaults.transitionDamping,
      0.5,
      20,
    ),
  };
};

const damp = (
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number => target + (current - target)
  * Math.exp(-damping * Math.max(0, Math.min(0.1, deltaSeconds)));

const FOCUS_LENS_STATE_KEYS = [
  "focusProgress",
  "contextProgress",
  "detailProgress",
  "selectedRegionWeight",
  "relatedRegionWeight",
  "nearbyContextWeight",
  "distantContextWeight",
  "brainShellWeight",
  "aggregatedRouteWeight",
  "detailedSynapseWeight",
  "territoryRepresentationWeight",
  "internalNodeDetailWeight",
  "internalConnectionDetailWeight",
  "aggregatedActivityWeight",
  "realActivityWeight",
  "aggregatedRouteThickness",
  "detailedSynapseThickness",
] as const;

const BRAIN_CONTEXT_STATE_KEYS = [
  "shellOpacity",
  "baseNodeOpacity",
  "baseConnectionOpacity",
  "ambientOpacity",
  "selectedRegionEmphasis",
  "relatedRegionEmphasis",
] as const;

export const updateNeuralCoreSemanticFocusLensRuntime = (
  runtime: NeuralCoreSemanticFocusLensState,
  target: NeuralCoreSemanticFocusLensState,
  config: NeuralCoreSemanticFocusLensConfig,
  deltaSeconds: number,
): void => {
  runtime.enabled = target.enabled;
  runtime.selectedClusterId = target.selectedClusterId;
  for (const key of FOCUS_LENS_STATE_KEYS) {
    runtime[key] = damp(
      runtime[key],
      target[key],
      config.transitionDamping,
      deltaSeconds,
    );
  }
  for (const key of BRAIN_CONTEXT_STATE_KEYS) {
    runtime.brainContext[key] = damp(
      runtime.brainContext[key],
      target.brainContext[key],
      config.transitionDamping,
      deltaSeconds,
    );
  }
};
