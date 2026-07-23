import type {
  NeuralCoreInspectionVisibilityRole,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  NeuralCoreElementVisualComposition,
  NeuralCoreElementVisualCompositionParams,
} from "./neural-core-element-visual-composition.types";
import type {
  NeuralCoreInspectionVisibilityState,
  NeuralCoreInspectionVisualElementKind,
} from "./neural-core-inspection-visibility.types";
import type {
  NeuralCoreCameraRenderingProfile,
} from "./neural-core-camera-rendering.types";

const finiteClamp = (value: number, minimum: number, maximum: number): number => {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
};

const getRoleMinimumOpacity = (
  role: NeuralCoreInspectionVisibilityRole,
  elementKind: NeuralCoreInspectionVisualElementKind,
  visibility: NeuralCoreInspectionVisibilityState,
): number => {
  if (role === "selected") {
    if (elementKind === "pulse") {
      return visibility.selectedMinimumPulseOpacity;
    }
    if (elementKind === "internal-connection") {
      return visibility.selectedMinimumInternalConnectionOpacity;
    }
    if (elementKind === "connection") {
      return visibility.selectedMinimumConnectionOpacity;
    }
    return visibility.selectedMinimumNodeOpacity;
  }
  if (role === "related") {
    if (elementKind === "pulse") {
      return visibility.relatedMinimumPulseOpacity;
    }
    if (elementKind === "connection" || elementKind === "internal-connection") {
      return visibility.relatedMinimumConnectionOpacity;
    }
    return visibility.relatedMinimumNodeOpacity;
  }
  if (role === "context") {
    return elementKind === "connection" || elementKind === "internal-connection"
      ? visibility.contextMinimumConnectionOpacity
      : visibility.contextMinimumNodeOpacity;
  }
  return 0;
};

const getRoleOpacityMultiplier = (
  role: NeuralCoreInspectionVisibilityRole,
  elementKind: NeuralCoreInspectionVisualElementKind,
  visibility: NeuralCoreInspectionVisibilityState,
): number => {
  if (role === "selected") {
    return visibility.selectedWeight;
  }
  if (role === "related") {
    return elementKind === "connection" || elementKind === "internal-connection"
      ? visibility.relatedConnectionWeight
      : elementKind === "pulse"
        ? visibility.relatedPulseWeight
        : visibility.relatedWeight;
  }
  if (role === "context") {
    return elementKind === "connection" || elementKind === "internal-connection"
      ? visibility.contextConnectionWeight
      : visibility.contextWeight;
  }
  return role === "ambient"
    ? visibility.ambientWeight
    : visibility.decorativeWeight;
};

export const writeNeuralCoreElementVisualComposition = (
  target: NeuralCoreElementVisualComposition,
  role: NeuralCoreInspectionVisibilityRole,
  elementKind: NeuralCoreInspectionVisualElementKind,
  baseOpacityInput: number,
  baseBrightnessInput: number,
  baseScaleInput: number,
  baseThicknessInput: number,
  semanticWeightInput: number,
  directionWeightInput: number,
  propagationWeightInput: number,
  statusWeightInput: number,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  visibility: NeuralCoreInspectionVisibilityState,
): NeuralCoreElementVisualComposition => {
  const baseOpacity = finiteClamp(baseOpacityInput, 0, 1);
  const baseBrightness = finiteClamp(baseBrightnessInput, 0, 2);
  const baseScale = finiteClamp(baseScaleInput, 0.05, 4);
  const baseThickness = finiteClamp(baseThicknessInput, 0.05, 4);
  const semanticWeight = finiteClamp(semanticWeightInput, 0, 1.5);
  const directionWeight = finiteClamp(directionWeightInput, 0, 1.5);
  const propagationWeight = finiteClamp(propagationWeightInput, 0, 1.5);
  const statusWeight = finiteClamp(statusWeightInput, 0, 1.5);
  const signalWeight = finiteClamp(
    semanticWeight * directionWeight * propagationWeight * statusWeight,
    0,
    1.5,
  );
  let opacity = baseOpacity * signalWeight;
  let brightness = baseBrightness * semanticWeight * directionWeight * statusWeight;
  let scale = baseScale;
  let thickness = baseThickness;

  if (visibility.enabled) {
    const roleMultiplier = getRoleOpacityMultiplier(
      role,
      elementKind,
      visibility,
    );
    const minimumOpacity = getRoleMinimumOpacity(
      role,
      elementKind,
      visibility,
    );
    if (role === "selected") {
      opacity = Math.max(opacity, minimumOpacity)
        * visibility.selectedEmphasis;
      brightness *= visibility.selectedEmphasis;
      scale *= 1 + (visibility.selectedEmphasis - 1) * 0.32;
    } else if (role === "related") {
      opacity = Math.max(opacity * roleMultiplier, minimumOpacity);
      brightness *= visibility.relatedEmphasis;
      scale *= 1 + (visibility.relatedEmphasis - 1) * 0.18;
    } else if (role === "context") {
      opacity = Math.max(opacity * roleMultiplier, minimumOpacity);
      brightness *= Math.sqrt(finiteClamp(roleMultiplier, 0, 1));
    } else {
      opacity *= roleMultiplier;
      brightness *= Math.sqrt(finiteClamp(roleMultiplier, 0, 1));
    }
    if (role === "selected") {
      thickness *= visibility.protagonistThicknessMultiplier;
    } else if (role === "related") {
      thickness *= visibility.relatedThicknessMultiplier;
    }
  }

  if (cameraProfile.enabled) {
    if (elementKind === "node") {
      opacity *= cameraProfile.additiveExposureCompensation;
      brightness *= cameraProfile.additiveExposureCompensation;
      scale *= cameraProfile.nodeScreenScale;
    } else if (elementKind === "pulse") {
      if (baseOpacity > 0.001) {
        opacity = Math.max(
          opacity * cameraProfile.pulseExposureCompensation,
          cameraProfile.pulseMinimumOpacity,
        );
      } else {
        opacity = 0;
      }
      brightness *= cameraProfile.pulseExposureCompensation;
      scale *= cameraProfile.pulseScreenScale;
    } else if (
      elementKind === "connection"
      || elementKind === "internal-connection"
    ) {
      if (baseOpacity > 0.001) {
        opacity = Math.max(
          opacity * cameraProfile.connectionVisibility,
          cameraProfile.connectionMinimumOpacity,
        );
      }
      thickness = Math.max(thickness, cameraProfile.connectionMinimumThickness);
    }
  }

  target.opacity = finiteClamp(opacity, 0, 1);
  target.brightness = finiteClamp(brightness, 0, 2);
  target.scale = finiteClamp(scale, 0.25, 4);
  target.thickness = finiteClamp(thickness, 0.1, 4);
  return target;
};

export const updateNeuralCoreElementVisualComposition = (
  target: NeuralCoreElementVisualComposition,
  params: NeuralCoreElementVisualCompositionParams,
): NeuralCoreElementVisualComposition => {
  return writeNeuralCoreElementVisualComposition(
    target,
    params.role,
    params.elementKind,
    params.baseOpacity,
    params.baseBrightness,
    params.baseScale,
    params.baseThickness,
    params.semanticWeight,
    params.directionWeight,
    params.propagationWeight,
    params.statusWeight,
    params.cameraProfile,
    params.inspectionVisibility,
  );
};

export const resolveNeuralCoreElementVisualComposition = (
  params: NeuralCoreElementVisualCompositionParams,
): NeuralCoreElementVisualComposition => {
  return updateNeuralCoreElementVisualComposition(
    { opacity: 0, brightness: 0, scale: 1, thickness: 1 },
    params,
  );
};
