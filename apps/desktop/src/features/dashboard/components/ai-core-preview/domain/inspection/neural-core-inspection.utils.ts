import { DEFAULT_NEURAL_CORE_INSPECTION_CONFIG } from "./neural-core-inspection.constants";
import type {
  NeuralCoreInspectionConfig,
  NeuralCoreInspectionConfigInput,
  NeuralCoreInteractionMode,
} from "./neural-core-inspection.types";

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
};

export const resolveNeuralCoreInteractionMode = (
  value: NeuralCoreInteractionMode | undefined,
): NeuralCoreInteractionMode => value === "inspection" ? "inspection" : "presentation";

export const resolveNeuralCoreInspectionConfig = (
  input?: NeuralCoreInspectionConfigInput,
): NeuralCoreInspectionConfig => {
  const defaults = DEFAULT_NEURAL_CORE_INSPECTION_CONFIG;
  const minimumDistance = finiteInRange(
    input?.camera?.minimumDistance,
    defaults.camera.minimumDistance,
    0.5,
    20,
  );
  const maximumDistance = Math.max(
    minimumDistance,
    finiteInRange(
      input?.camera?.maximumDistance,
      defaults.camera.maximumDistance,
      0.5,
      30,
    ),
  );
  const minimumPolarAngle = finiteInRange(
    input?.camera?.minimumPolarAngle,
    defaults.camera.minimumPolarAngle,
    0.01,
    Math.PI - 0.02,
  );
  const microMaximum = finiteInRange(
    input?.visualDensity?.distance?.microMaximum,
    defaults.visualDensity.distance.microMaximum,
    minimumDistance,
    Math.max(minimumDistance, maximumDistance - 0.1),
  );
  const mesoMaximum = Math.min(
    maximumDistance,
    Math.max(
      microMaximum + 0.1,
    finiteInRange(
      input?.visualDensity?.distance?.mesoMaximum,
      defaults.visualDensity.distance.mesoMaximum,
      minimumDistance,
      maximumDistance,
    ),
    ),
  );
  return {
    enabled: input?.enabled ?? defaults.enabled,
    camera: {
      allowRotate: input?.camera?.allowRotate ?? defaults.camera.allowRotate,
      allowZoom: input?.camera?.allowZoom ?? defaults.camera.allowZoom,
      allowPan: input?.camera?.allowPan ?? defaults.camera.allowPan,
      minimumDistance,
      maximumDistance,
      minimumPolarAngle,
      maximumPolarAngle: Math.max(
        minimumPolarAngle,
        finiteInRange(
          input?.camera?.maximumPolarAngle,
          defaults.camera.maximumPolarAngle,
          0.02,
          Math.PI - 0.01,
        ),
      ),
      maximumPanDistance: finiteInRange(
        input?.camera?.maximumPanDistance,
        defaults.camera.maximumPanDistance,
        0,
        4,
      ),
      dampingFactor: finiteInRange(
        input?.camera?.dampingFactor,
        defaults.camera.dampingFactor,
        0.01,
        0.5,
      ),
      focusDistance: finiteInRange(
        input?.camera?.focusDistance,
        defaults.camera.focusDistance,
        minimumDistance,
        maximumDistance,
      ),
      focusTransitionSeconds: finiteInRange(
        input?.camera?.focusTransitionSeconds,
        defaults.camera.focusTransitionSeconds,
        0.05,
        3,
      ),
    },
    behavior: {
      pauseOnEnter: input?.behavior?.pauseOnEnter ?? defaults.behavior.pauseOnEnter,
      clearSelectionOnExit: input?.behavior?.clearSelectionOnExit
        ?? defaults.behavior.clearSelectionOnExit,
      focusSelectedCluster: input?.behavior?.focusSelectedCluster
        ?? defaults.behavior.focusSelectedCluster,
      dimUnrelatedContext: input?.behavior?.dimUnrelatedContext
        ?? defaults.behavior.dimUnrelatedContext,
      highlightRelatedConnections: input?.behavior?.highlightRelatedConnections
        ?? defaults.behavior.highlightRelatedConnections,
    },
    panel: {
      enabled: input?.panel?.enabled ?? defaults.panel.enabled,
      widthPx: finiteInRange(
        input?.panel?.widthPx,
        defaults.panel.widthPx,
        240,
        420,
      ),
      compactWidthPx: finiteInRange(
        input?.panel?.compactWidthPx,
        defaults.panel.compactWidthPx,
        220,
        380,
      ),
      maximumMetrics: Math.trunc(finiteInRange(
        input?.panel?.maximumMetrics,
        defaults.panel.maximumMetrics,
        0,
        12,
      )),
      showDescription: input?.panel?.showDescription ?? defaults.panel.showDescription,
      showImpact: input?.panel?.showImpact ?? defaults.panel.showImpact,
      showRelationships: input?.panel?.showRelationships
        ?? defaults.panel.showRelationships,
    },
    visualDensity: {
      enabled: input?.visualDensity?.enabled ?? defaults.visualDensity.enabled,
      distance: { microMaximum, mesoMaximum },
      macro: {
        baseConnectionOpacity: finiteInRange(
          input?.visualDensity?.macro?.baseConnectionOpacity,
          defaults.visualDensity.macro.baseConnectionOpacity,
          0,
          1,
        ),
        ambientParticleOpacity: finiteInRange(
          input?.visualDensity?.macro?.ambientParticleOpacity,
          defaults.visualDensity.macro.ambientParticleOpacity,
          0,
          1,
        ),
        unrelatedNodeOpacity: finiteInRange(
          input?.visualDensity?.macro?.unrelatedNodeOpacity,
          defaults.visualDensity.macro.unrelatedNodeOpacity,
          0,
          1,
        ),
      },
      meso: {
        baseConnectionOpacity: finiteInRange(
          input?.visualDensity?.meso?.baseConnectionOpacity,
          defaults.visualDensity.meso.baseConnectionOpacity,
          0,
          1,
        ),
        ambientParticleOpacity: finiteInRange(
          input?.visualDensity?.meso?.ambientParticleOpacity,
          defaults.visualDensity.meso.ambientParticleOpacity,
          0,
          1,
        ),
        unrelatedNodeOpacity: finiteInRange(
          input?.visualDensity?.meso?.unrelatedNodeOpacity,
          defaults.visualDensity.meso.unrelatedNodeOpacity,
          0,
          1,
        ),
      },
      micro: {
        baseConnectionOpacity: finiteInRange(
          input?.visualDensity?.micro?.baseConnectionOpacity,
          defaults.visualDensity.micro.baseConnectionOpacity,
          0,
          1,
        ),
        ambientParticleOpacity: finiteInRange(
          input?.visualDensity?.micro?.ambientParticleOpacity,
          defaults.visualDensity.micro.ambientParticleOpacity,
          0,
          1,
        ),
        unrelatedNodeOpacity: finiteInRange(
          input?.visualDensity?.micro?.unrelatedNodeOpacity,
          defaults.visualDensity.micro.unrelatedNodeOpacity,
          0,
          1,
        ),
        relatedConnectionEmphasis: finiteInRange(
          input?.visualDensity?.micro?.relatedConnectionEmphasis,
          defaults.visualDensity.micro.relatedConnectionEmphasis,
          1,
          2,
        ),
        internalConnectionEmphasis: finiteInRange(
          input?.visualDensity?.micro?.internalConnectionEmphasis,
          defaults.visualDensity.micro.internalConnectionEmphasis,
          1,
          2,
        ),
      },
      transitionDamping: finiteInRange(
        input?.visualDensity?.transitionDamping,
        defaults.visualDensity.transitionDamping,
        0.1,
        40,
      ),
    },
  };
};

export const resolveNeuralCoreControlledValue = <TValue>(
  controlledValue: TValue | undefined,
  internalValue: TValue,
): TValue => controlledValue === undefined ? internalValue : controlledValue;

export interface NeuralCoreControlledUpdate<TValue> {
  changed: boolean;
  nextInternalValue: TValue;
  resolvedValue: TValue;
  shouldUpdateInternal: boolean;
}

export const resolveNeuralCoreControlledUpdate = <TValue>(
  controlledValue: TValue | undefined,
  currentValue: TValue,
  nextValue: TValue,
): NeuralCoreControlledUpdate<TValue> => {
  const changed = !Object.is(currentValue, nextValue);
  return {
    changed,
    nextInternalValue: nextValue,
    resolvedValue: controlledValue === undefined ? nextValue : controlledValue,
    shouldUpdateInternal: changed && controlledValue === undefined,
  };
};

export const resolveNeuralCoreSimulationDelta = (
  deltaSeconds: number,
  paused: boolean,
): number => {
  if (paused || !Number.isFinite(deltaSeconds)) {
    return 0;
  }
  return Math.max(0, Math.min(0.1, deltaSeconds));
};
