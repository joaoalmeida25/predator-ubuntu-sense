import type {
  NeuralCoreOperationalProtagonistMarkerConfig,
} from "./neural-core-propagation-buffer.types";

export const NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG = Object.freeze<
  NeuralCoreOperationalProtagonistMarkerConfig
>({
  markerScaleMultiplier: 1.46,
  pointScale: 340,
  minimumScreenLength: 15,
  maximumScreenLength: 30,
  distanceScaleInfluence: 0.58,
  tangentProbeLength: 0.045,
  aspectRatio: 2.9,
  headPosition: 0.27,
  headRadius: 0.155,
  tailLength: 0.72,
  tailMaximumWidth: 0.15,
  tailFalloff: 1.45,
  minimumOpacity: 0.96,
  semanticColorInfluence: 0.42,
  activeRouteOpacityMultiplier: 0.8,
  activeRouteThicknessMultiplier: 0.92,
  backgroundAmbientPulseMultiplier: 0.23,
  backgroundAggregatedPulseMultiplier: 0.24,
  sourceReactionProgressFraction: 0.05,
  destinationReactionProgressFraction: 0.05,
  arrivalReactionProgressFraction: 0.015,
  sourceReactionIntensity: 0.62,
  destinationReactionIntensity: 0.84,
  destinationAnticipationIntensityRatio: 0.34,
});
