import type {
  NeuralCoreInspectionCameraRenderingConfig,
} from "../../domain/inspection/neural-core-inspection.types";

export interface NeuralCoreCameraRenderingProfile {
  enabled: boolean;
  distanceToTarget: number;
  normalizedDistance: number;
  nearWeight: number;
  mediumWeight: number;
  farWeight: number;
  nodeScreenScale: number;
  nodeMinimumScreenSize: number;
  nodeMaximumScreenSize: number;
  selectedNodeMaximumScreenSize: number;
  connectionVisibility: number;
  connectionMinimumOpacity: number;
  connectionMinimumThickness: number;
  pulseScreenScale: number;
  pulseMinimumOpacity: number;
  pulseExposureCompensation: number;
  additiveExposureCompensation: number;
  fogInfluence: number;
}

export interface MapNeuralCoreCameraRenderingProfileParams {
  cameraDistance: number;
  minimumDistance: number;
  maximumDistance: number;
  config?: NeuralCoreInspectionCameraRenderingConfig;
}
