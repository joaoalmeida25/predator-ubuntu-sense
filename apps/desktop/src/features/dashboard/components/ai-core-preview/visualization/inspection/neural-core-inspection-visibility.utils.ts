import type {
  NeuralCoreInspectionVisualDensityConfig,
  NeuralCoreInspectionVisibilityRole,
} from "../../domain/inspection/neural-core-inspection.types";
import type {
  NeuralCoreInspectionVisibilityState,
  NeuralCoreInspectionVisibilityInteractionMode,
} from "./neural-core-inspection-visibility.types";

const finiteClamp = (value: number, minimum = 0, maximum = 1): number => {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
};

const blendDensityValue = (
  macroValue: number,
  mesoValue: number,
  microValue: number,
  state: NeuralCoreInspectionVisibilityState,
): number => {
  return finiteClamp(
    macroValue * state.macroWeight
      + mesoValue * state.mesoWeight
      + microValue * state.microWeight,
  );
};

const resetNeutralVisibility = (
  state: NeuralCoreInspectionVisibilityState,
  config: NeuralCoreInspectionVisualDensityConfig,
): void => {
  state.selectedWeight = 1;
  state.relatedWeight = 1;
  state.contextWeight = 1;
  state.contextConnectionWeight = 1;
  state.ambientWeight = 1;
  state.decorativeWeight = 1;
  state.arcWeight = 1;
  state.baseWeight = 1;
  state.globalGlowWeight = 1;
  state.selectedConnectionWeight = 1;
  state.selectedInternalConnectionWeight = 1;
  state.relatedConnectionWeight = 1;
  state.relatedConnectionMinimumThickness = config.relatedConnections.minimumThickness;
  state.protagonistThicknessMultiplier = 1;
  state.relatedThicknessMultiplier = 1;
  state.protagonistPulseWeight = 1;
  state.relatedPulseWeight = 1;
  state.selectedEmphasis = 1;
  state.relatedEmphasis = 1;
};

export const resolveNeuralCoreInspectionVisibilityRole = (
  focusLevel: number,
): NeuralCoreInspectionVisibilityRole => {
  if (focusLevel >= 2) {
    return "selected";
  }
  return focusLevel >= 1 ? "related" : "context";
};

export const updateNeuralCoreInspectionVisibilityState = (
  state: NeuralCoreInspectionVisibilityState,
  config: NeuralCoreInspectionVisualDensityConfig,
  interactionMode: NeuralCoreInspectionVisibilityInteractionMode,
  isContextPanelOpen: boolean,
  macroDensityWeight: number,
  mesoDensityWeight: number,
  microDensityWeight: number,
): NeuralCoreInspectionVisibilityState => {
  const inspectionMode = interactionMode === "inspection";
  const enabled = config.enabled && inspectionMode && state.hasSelection;
  const macroWeight = inspectionMode && Number.isFinite(macroDensityWeight)
    ? Math.max(0, macroDensityWeight)
    : 1;
  const mesoWeight = inspectionMode && Number.isFinite(mesoDensityWeight)
    ? Math.max(0, mesoDensityWeight)
    : 0;
  const microWeight = inspectionMode && Number.isFinite(microDensityWeight)
    ? Math.max(0, microDensityWeight)
    : 0;
  const densityTotal = Math.max(0.0001, macroWeight + mesoWeight + microWeight);
  const visibility = config.visibility;

  state.enabled = enabled;
  state.isNeutral = inspectionMode && !state.hasSelection;
  state.isContextPanelOpen = isContextPanelOpen;
  state.macroWeight = macroWeight / densityTotal;
  state.mesoWeight = mesoWeight / densityTotal;
  state.microWeight = microWeight / densityTotal;
  state.selectedMinimumNodeOpacity = visibility.selected.minimumNodeOpacity;
  state.selectedMinimumConnectionOpacity = visibility.selected.minimumConnectionOpacity;
  state.selectedMinimumInternalConnectionOpacity =
    visibility.selected.minimumInternalConnectionOpacity;
  state.selectedMinimumPulseOpacity = visibility.selected.minimumPulseOpacity;
  state.relatedMinimumNodeOpacity = visibility.related.minimumNodeOpacity;
  state.relatedMinimumConnectionOpacity = visibility.related.minimumConnectionOpacity;
  state.relatedMinimumPulseOpacity = visibility.related.minimumPulseOpacity;
  state.contextMinimumNodeOpacity = visibility.context.minimumNodeOpacity;
  state.contextMinimumConnectionOpacity = visibility.context.minimumConnectionOpacity;

  if (!enabled) {
    resetNeutralVisibility(state, config);
    return state;
  }

  const panelContextMultiplier = isContextPanelOpen
    ? 1 - state.microWeight * 0.06
    : 1;
  state.selectedWeight = 1;
  state.relatedWeight = blendDensityValue(0.94, 0.91, 0.88, state);
  state.contextWeight = Math.max(
    visibility.context.minimumNodeOpacity,
    blendDensityValue(
      Math.min(config.macro.unrelatedNodeOpacity, 0.76),
      Math.min(config.meso.unrelatedNodeOpacity, 0.66),
      Math.min(config.micro.unrelatedNodeOpacity, 0.54),
      state,
    ) * panelContextMultiplier,
  );
  state.contextConnectionWeight = Math.max(
    visibility.context.minimumConnectionOpacity,
    blendDensityValue(
      Math.min(config.macro.baseConnectionOpacity, 0.74),
      Math.min(config.meso.baseConnectionOpacity, 0.64),
      Math.min(config.micro.baseConnectionOpacity, 0.52),
      state,
    ) * panelContextMultiplier,
  );
  state.ambientWeight = Math.max(
    visibility.ambient.minimumOpacity,
    blendDensityValue(
      0.72,
      Math.min(config.meso.ambientParticleOpacity, 0.5),
      visibility.ambient.microOpacity,
      state,
    ),
  );
  state.decorativeWeight = Math.max(
    visibility.decorative.minimumOpacity,
    blendDensityValue(0.68, 0.44, visibility.decorative.microOpacity, state),
  );
  state.arcWeight = blendDensityValue(0.72, 0.4, config.decoration.microArcOpacity, state);
  state.baseWeight = blendDensityValue(0.78, 0.48, config.decoration.microBaseOpacity, state);
  state.globalGlowWeight = blendDensityValue(
    0.72,
    0.42,
    config.decoration.microGlobalGlowOpacity,
    state,
  );
  state.selectedConnectionWeight = 1;
  state.selectedInternalConnectionWeight = 1;
  state.relatedConnectionWeight = blendDensityValue(0.96, 0.93, 0.9, state);
  state.relatedConnectionMinimumThickness = config.relatedConnections.minimumThickness;
  state.protagonistThicknessMultiplier = config.relatedConnections
    .protagonistThicknessMultiplier;
  state.relatedThicknessMultiplier = config.relatedConnections.relatedThicknessMultiplier;
  state.protagonistPulseWeight = 1;
  state.relatedPulseWeight = blendDensityValue(0.94, 0.91, 0.88, state);
  state.selectedEmphasis = visibility.selected.emphasis;
  state.relatedEmphasis = visibility.related.emphasis;
  return state;
};
