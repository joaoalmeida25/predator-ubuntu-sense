import { DEFAULT_NEURAL_CORE_INSPECTION_CONFIG } from "../../domain/inspection/neural-core-inspection.constants";
import type {
  NeuralCoreInspectionCameraRenderingConfig,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  MapNeuralCoreCameraRenderingProfileParams,
  NeuralCoreCameraRenderingProfile,
} from "./neural-core-camera-rendering.types";

const finiteClamp = (value: number, minimum: number, maximum: number): number => {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
};

const smoothStep = (minimum: number, maximum: number, value: number): number => {
  if (maximum <= minimum) {
    return value >= maximum ? 1 : 0;
  }
  const amount = finiteClamp((value - minimum) / (maximum - minimum), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

const blendDistanceValue = (
  nearValue: number,
  mediumValue: number,
  farValue: number,
  profile: NeuralCoreCameraRenderingProfile,
): number => {
  return nearValue * profile.nearWeight
    + mediumValue * profile.mediumWeight
    + farValue * profile.farWeight;
};

export const createNeuralCoreCameraRenderingProfile = (
): NeuralCoreCameraRenderingProfile => ({
  enabled: false,
  distanceToTarget: 0,
  normalizedDistance: 0.5,
  nearWeight: 0,
  mediumWeight: 1,
  farWeight: 0,
  nodeScreenScale: 1,
  nodeMinimumScreenSize: 1,
  nodeMaximumScreenSize: 12,
  selectedNodeMaximumScreenSize: 12,
  connectionVisibility: 1,
  connectionMinimumOpacity: 0,
  connectionMinimumThickness: 0,
  pulseScreenScale: 1,
  pulseMinimumOpacity: 0,
  pulseExposureCompensation: 1,
  additiveExposureCompensation: 1,
  fogInfluence: 1,
});

export const resetNeuralCoreCameraRenderingProfile = (
  profile: NeuralCoreCameraRenderingProfile,
  cameraDistance: number,
): NeuralCoreCameraRenderingProfile => {
  profile.enabled = false;
  profile.distanceToTarget = Number.isFinite(cameraDistance)
    ? Math.max(0, cameraDistance)
    : 0;
  profile.normalizedDistance = 0.5;
  profile.nearWeight = 0;
  profile.mediumWeight = 1;
  profile.farWeight = 0;
  profile.nodeScreenScale = 1;
  profile.nodeMinimumScreenSize = 1;
  profile.nodeMaximumScreenSize = 12;
  profile.selectedNodeMaximumScreenSize = 12;
  profile.connectionVisibility = 1;
  profile.connectionMinimumOpacity = 0;
  profile.connectionMinimumThickness = 0;
  profile.pulseScreenScale = 1;
  profile.pulseMinimumOpacity = 0;
  profile.pulseExposureCompensation = 1;
  profile.additiveExposureCompensation = 1;
  profile.fogInfluence = 1;
  return profile;
};

export const updateNeuralCoreCameraRenderingProfile = (
  profile: NeuralCoreCameraRenderingProfile,
  cameraDistance: number,
  minimumDistance: number,
  maximumDistance: number,
  config: NeuralCoreInspectionCameraRenderingConfig,
  active = true,
): NeuralCoreCameraRenderingProfile => {
  const safeMinimum = Number.isFinite(minimumDistance)
    ? Math.max(0, minimumDistance)
    : 0;
  const safeMaximum = Number.isFinite(maximumDistance)
    ? Math.max(safeMinimum + 0.0001, maximumDistance)
    : safeMinimum + 1;
  const safeDistance = Number.isFinite(cameraDistance)
    ? finiteClamp(cameraDistance, safeMinimum, safeMaximum)
    : (safeMinimum + safeMaximum) * 0.5;
  if (!active || !config.enabled) {
    return resetNeuralCoreCameraRenderingProfile(profile, safeDistance);
  }

  profile.enabled = true;
  profile.distanceToTarget = safeDistance;
  profile.normalizedDistance = finiteClamp(
    (safeDistance - safeMinimum) / (safeMaximum - safeMinimum),
    0,
    1,
  );
  const normalizedNear = finiteClamp(
    (config.distance.near - safeMinimum) / (safeMaximum - safeMinimum),
    0,
    1,
  );
  const normalizedFar = Math.max(
    normalizedNear + 0.0001,
    finiteClamp(
      (config.distance.far - safeMinimum) / (safeMaximum - safeMinimum),
      0,
      1,
    ),
  );
  const normalizedMedium = (normalizedNear + normalizedFar) * 0.5;
  profile.nearWeight = 1 - smoothStep(
    normalizedNear,
    normalizedMedium,
    profile.normalizedDistance,
  );
  profile.farWeight = smoothStep(
    normalizedMedium,
    normalizedFar,
    profile.normalizedDistance,
  );
  profile.mediumWeight = Math.max(0, 1 - profile.nearWeight - profile.farWeight);
  profile.nodeScreenScale = blendDistanceValue(
    config.nodes.nearDistanceScale,
    1,
    config.nodes.farDistanceScale,
    profile,
  );
  profile.nodeMinimumScreenSize = blendDistanceValue(
    1,
    1,
    config.nodes.minimumScreenSize,
    profile,
  );
  profile.nodeMaximumScreenSize = config.nodes.maximumScreenSize;
  profile.selectedNodeMaximumScreenSize = Math.max(
    config.nodes.maximumScreenSize,
    config.nodes.selectedMaximumScreenSize,
  );
  profile.connectionVisibility = blendDistanceValue(
    1,
    1,
    config.connections.farContrastBoost,
    profile,
  );
  profile.connectionMinimumOpacity = blendDistanceValue(
    config.connections.minimumNearOpacity,
    0,
    config.connections.minimumFarOpacity,
    profile,
  );
  profile.connectionMinimumThickness = blendDistanceValue(
    config.connections.minimumNearThickness,
    0,
    config.connections.minimumFarThickness,
    profile,
  );
  profile.pulseScreenScale = blendDistanceValue(
    config.pulses.nearDistanceScale,
    1,
    config.pulses.farDistanceScale,
    profile,
  );
  profile.pulseMinimumOpacity = config.pulses.minimumOpacity
    * (profile.nearWeight + profile.farWeight);
  profile.pulseExposureCompensation = blendDistanceValue(
    config.pulses.nearExposureCompensation,
    1,
    config.pulses.farExposureCompensation,
    profile,
  );
  const nodeExposure = blendDistanceValue(
    config.nodes.nearExposureCompensation,
    1,
    config.nodes.farExposureCompensation,
    profile,
  );
  profile.additiveExposureCompensation = 1
    + (nodeExposure - 1) * config.nodes.additiveCompensation;
  profile.fogInfluence = blendDistanceValue(1, 1, 0, profile);
  return profile;
};

export const mapNeuralCoreCameraRenderingProfile = ({
  cameraDistance,
  minimumDistance,
  maximumDistance,
  config = DEFAULT_NEURAL_CORE_INSPECTION_CONFIG.cameraRendering,
}: MapNeuralCoreCameraRenderingProfileParams): NeuralCoreCameraRenderingProfile => {
  return updateNeuralCoreCameraRenderingProfile(
    createNeuralCoreCameraRenderingProfile(),
    cameraDistance,
    minimumDistance,
    maximumDistance,
    config,
  );
};
