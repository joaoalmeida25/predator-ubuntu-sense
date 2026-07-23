import type {
  NeuralCoreInspectionVisibilityRole,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  NeuralCoreCameraRenderingProfile,
} from "./neural-core-camera-rendering.types";
import type {
  NeuralCoreInspectionVisibilityState,
  NeuralCoreInspectionVisualElementKind,
} from "./neural-core-inspection-visibility.types";

export interface NeuralCoreElementVisualComposition {
  opacity: number;
  brightness: number;
  scale: number;
  thickness: number;
}

export interface NeuralCoreElementVisualCompositionParams {
  role: NeuralCoreInspectionVisibilityRole;
  elementKind: NeuralCoreInspectionVisualElementKind;
  baseOpacity: number;
  baseBrightness: number;
  baseScale: number;
  baseThickness: number;
  semanticWeight: number;
  directionWeight: number;
  propagationWeight: number;
  statusWeight: number;
  cameraProfile: NeuralCoreCameraRenderingProfile;
  inspectionVisibility: NeuralCoreInspectionVisibilityState;
}
