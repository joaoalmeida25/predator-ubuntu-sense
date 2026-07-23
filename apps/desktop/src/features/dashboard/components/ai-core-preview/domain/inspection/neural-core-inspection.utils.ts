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
  const cameraRenderingNear = finiteInRange(
    input?.cameraRendering?.distance?.near,
    Math.max(minimumDistance, defaults.cameraRendering.distance.near),
    minimumDistance,
    maximumDistance,
  );
  const cameraRenderingFar = Math.max(
    cameraRenderingNear + 0.1,
    finiteInRange(
      input?.cameraRendering?.distance?.far,
      Math.min(maximumDistance, defaults.cameraRendering.distance.far),
      cameraRenderingNear,
      maximumDistance,
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
      visibility: {
        selected: {
          minimumNodeOpacity: finiteInRange(
            input?.visualDensity?.visibility?.selected?.minimumNodeOpacity,
            defaults.visualDensity.visibility.selected.minimumNodeOpacity,
            0.72,
            1,
          ),
          minimumConnectionOpacity: finiteInRange(
            input?.visualDensity?.visibility?.selected?.minimumConnectionOpacity,
            defaults.visualDensity.visibility.selected.minimumConnectionOpacity,
            0.3,
            0.9,
          ),
          minimumInternalConnectionOpacity: finiteInRange(
            input?.visualDensity?.visibility?.selected?.minimumInternalConnectionOpacity,
            defaults.visualDensity.visibility.selected.minimumInternalConnectionOpacity,
            0.35,
            0.95,
          ),
          minimumPulseOpacity: finiteInRange(
            input?.visualDensity?.visibility?.selected?.minimumPulseOpacity,
            defaults.visualDensity.visibility.selected.minimumPulseOpacity,
            0.7,
            1,
          ),
          emphasis: finiteInRange(
            input?.visualDensity?.visibility?.selected?.emphasis,
            defaults.visualDensity.visibility.selected.emphasis,
            1,
            1.35,
          ),
        },
        related: {
          minimumNodeOpacity: finiteInRange(
            input?.visualDensity?.visibility?.related?.minimumNodeOpacity,
            defaults.visualDensity.visibility.related.minimumNodeOpacity,
            0.3,
            0.8,
          ),
          minimumConnectionOpacity: finiteInRange(
            input?.visualDensity?.visibility?.related?.minimumConnectionOpacity,
            defaults.visualDensity.visibility.related.minimumConnectionOpacity,
            0.24,
            0.75,
          ),
          minimumPulseOpacity: finiteInRange(
            input?.visualDensity?.visibility?.related?.minimumPulseOpacity,
            defaults.visualDensity.visibility.related.minimumPulseOpacity,
            0.35,
            0.82,
          ),
          emphasis: finiteInRange(
            input?.visualDensity?.visibility?.related?.emphasis,
            defaults.visualDensity.visibility.related.emphasis,
            1,
            1.25,
          ),
        },
        context: {
          minimumNodeOpacity: finiteInRange(
            input?.visualDensity?.visibility?.context?.minimumNodeOpacity,
            defaults.visualDensity.visibility.context.minimumNodeOpacity,
            0.08,
            0.35,
          ),
          minimumConnectionOpacity: finiteInRange(
            input?.visualDensity?.visibility?.context?.minimumConnectionOpacity,
            defaults.visualDensity.visibility.context.minimumConnectionOpacity,
            0.05,
            0.3,
          ),
        },
        ambient: {
          minimumOpacity: finiteInRange(
            input?.visualDensity?.visibility?.ambient?.minimumOpacity,
            defaults.visualDensity.visibility.ambient.minimumOpacity,
            0.01,
            0.2,
          ),
          microOpacity: finiteInRange(
            input?.visualDensity?.visibility?.ambient?.microOpacity,
            defaults.visualDensity.visibility.ambient.microOpacity,
            0.02,
            0.2,
          ),
        },
        decorative: {
          minimumOpacity: finiteInRange(
            input?.visualDensity?.visibility?.decorative?.minimumOpacity,
            defaults.visualDensity.visibility.decorative.minimumOpacity,
            0.01,
            0.16,
          ),
          microOpacity: finiteInRange(
            input?.visualDensity?.visibility?.decorative?.microOpacity,
            defaults.visualDensity.visibility.decorative.microOpacity,
            0.015,
            0.16,
          ),
        },
      },
      relatedConnections: {
        minimumOpacity: finiteInRange(
          input?.visualDensity?.relatedConnections?.minimumOpacity,
          defaults.visualDensity.relatedConnections.minimumOpacity,
          0.2,
          0.8,
        ),
        minimumThickness: finiteInRange(
          input?.visualDensity?.relatedConnections?.minimumThickness,
          defaults.visualDensity.relatedConnections.minimumThickness,
          0.4,
          2.4,
        ),
        protagonistThicknessMultiplier: finiteInRange(
          input?.visualDensity?.relatedConnections?.protagonistThicknessMultiplier,
          defaults.visualDensity.relatedConnections.protagonistThicknessMultiplier,
          1,
          1.5,
        ),
        relatedThicknessMultiplier: finiteInRange(
          input?.visualDensity?.relatedConnections?.relatedThicknessMultiplier,
          defaults.visualDensity.relatedConnections.relatedThicknessMultiplier,
          1,
          1.3,
        ),
      },
      selectedClusterEnvelope: {
        enabled: input?.visualDensity?.selectedClusterEnvelope?.enabled
          ?? defaults.visualDensity.selectedClusterEnvelope.enabled,
        maximumOpacity: finiteInRange(
          input?.visualDensity?.selectedClusterEnvelope?.maximumOpacity,
          defaults.visualDensity.selectedClusterEnvelope.maximumOpacity,
          0,
          0.08,
        ),
        scaleMultiplier: finiteInRange(
          input?.visualDensity?.selectedClusterEnvelope?.scaleMultiplier,
          defaults.visualDensity.selectedClusterEnvelope.scaleMultiplier,
          1.02,
          1.25,
        ),
        edgeSoftness: finiteInRange(
          input?.visualDensity?.selectedClusterEnvelope?.edgeSoftness,
          defaults.visualDensity.selectedClusterEnvelope.edgeSoftness,
          0.15,
          0.95,
        ),
        pulseInfluence: finiteInRange(
          input?.visualDensity?.selectedClusterEnvelope?.pulseInfluence,
          defaults.visualDensity.selectedClusterEnvelope.pulseInfluence,
          0,
          0.5,
        ),
      },
      decoration: {
        microArcOpacity: finiteInRange(
          input?.visualDensity?.decoration?.microArcOpacity,
          defaults.visualDensity.decoration.microArcOpacity,
          0.01,
          0.3,
        ),
        microBaseOpacity: finiteInRange(
          input?.visualDensity?.decoration?.microBaseOpacity,
          defaults.visualDensity.decoration.microBaseOpacity,
          0.01,
          0.3,
        ),
        microGlobalGlowOpacity: finiteInRange(
          input?.visualDensity?.decoration?.microGlobalGlowOpacity,
          defaults.visualDensity.decoration.microGlobalGlowOpacity,
          0.01,
          0.35,
        ),
      },
      transitionDamping: finiteInRange(
        input?.visualDensity?.transitionDamping,
        defaults.visualDensity.transitionDamping,
        0.1,
        40,
      ),
    },
    cameraRendering: {
      enabled: input?.cameraRendering?.enabled ?? defaults.cameraRendering.enabled,
      distance: {
        near: cameraRenderingNear,
        far: Math.min(maximumDistance, cameraRenderingFar),
      },
      nodes: {
        minimumScreenSize: finiteInRange(
          input?.cameraRendering?.nodes?.minimumScreenSize,
          defaults.cameraRendering.nodes.minimumScreenSize,
          0.5,
          4,
        ),
        maximumScreenSize: finiteInRange(
          input?.cameraRendering?.nodes?.maximumScreenSize,
          defaults.cameraRendering.nodes.maximumScreenSize,
          4,
          18,
        ),
        selectedMaximumScreenSize: finiteInRange(
          input?.cameraRendering?.nodes?.selectedMaximumScreenSize,
          defaults.cameraRendering.nodes.selectedMaximumScreenSize,
          4,
          20,
        ),
        nearDistanceScale: finiteInRange(
          input?.cameraRendering?.nodes?.nearDistanceScale,
          defaults.cameraRendering.nodes.nearDistanceScale,
          0.5,
          1.2,
        ),
        farDistanceScale: finiteInRange(
          input?.cameraRendering?.nodes?.farDistanceScale,
          defaults.cameraRendering.nodes.farDistanceScale,
          0.8,
          1.6,
        ),
        nearExposureCompensation: finiteInRange(
          input?.cameraRendering?.nodes?.nearExposureCompensation,
          defaults.cameraRendering.nodes.nearExposureCompensation,
          0.35,
          1.1,
        ),
        farExposureCompensation: finiteInRange(
          input?.cameraRendering?.nodes?.farExposureCompensation,
          defaults.cameraRendering.nodes.farExposureCompensation,
          0.8,
          1.5,
        ),
        additiveCompensation: finiteInRange(
          input?.cameraRendering?.nodes?.additiveCompensation,
          defaults.cameraRendering.nodes.additiveCompensation,
          0.5,
          1,
        ),
      },
      connections: {
        minimumNearOpacity: finiteInRange(
          input?.cameraRendering?.connections?.minimumNearOpacity,
          defaults.cameraRendering.connections.minimumNearOpacity,
          0,
          0.2,
        ),
        minimumFarOpacity: finiteInRange(
          input?.cameraRendering?.connections?.minimumFarOpacity,
          defaults.cameraRendering.connections.minimumFarOpacity,
          0,
          0.25,
        ),
        minimumNearThickness: finiteInRange(
          input?.cameraRendering?.connections?.minimumNearThickness,
          defaults.cameraRendering.connections.minimumNearThickness,
          0.35,
          1.5,
        ),
        minimumFarThickness: finiteInRange(
          input?.cameraRendering?.connections?.minimumFarThickness,
          defaults.cameraRendering.connections.minimumFarThickness,
          0.35,
          1.8,
        ),
        selectedThicknessMultiplier: finiteInRange(
          input?.cameraRendering?.connections?.selectedThicknessMultiplier,
          defaults.cameraRendering.connections.selectedThicknessMultiplier,
          1,
          1.25,
        ),
        relatedThicknessMultiplier: finiteInRange(
          input?.cameraRendering?.connections?.relatedThicknessMultiplier,
          defaults.cameraRendering.connections.relatedThicknessMultiplier,
          1,
          1.2,
        ),
        farContrastBoost: finiteInRange(
          input?.cameraRendering?.connections?.farContrastBoost,
          defaults.cameraRendering.connections.farContrastBoost,
          1,
          1.4,
        ),
      },
      pulses: {
        minimumOpacity: finiteInRange(
          input?.cameraRendering?.pulses?.minimumOpacity,
          defaults.cameraRendering.pulses.minimumOpacity,
          0.03,
          0.4,
        ),
        nearDistanceScale: finiteInRange(
          input?.cameraRendering?.pulses?.nearDistanceScale,
          defaults.cameraRendering.pulses.nearDistanceScale,
          0.55,
          1.2,
        ),
        farDistanceScale: finiteInRange(
          input?.cameraRendering?.pulses?.farDistanceScale,
          defaults.cameraRendering.pulses.farDistanceScale,
          0.8,
          1.5,
        ),
        nearExposureCompensation: finiteInRange(
          input?.cameraRendering?.pulses?.nearExposureCompensation,
          defaults.cameraRendering.pulses.nearExposureCompensation,
          0.4,
          1.1,
        ),
        farExposureCompensation: finiteInRange(
          input?.cameraRendering?.pulses?.farExposureCompensation,
          defaults.cameraRendering.pulses.farExposureCompensation,
          0.8,
          1.4,
        ),
      },
      fog: {
        preserveFunctionalTopology: input?.cameraRendering?.fog?.preserveFunctionalTopology
          ?? defaults.cameraRendering.fog.preserveFunctionalTopology,
        dynamicEnvironmentFog: input?.cameraRendering?.fog?.dynamicEnvironmentFog
          ?? defaults.cameraRendering.fog.dynamicEnvironmentFog,
        farMargin: finiteInRange(
          input?.cameraRendering?.fog?.farMargin,
          defaults.cameraRendering.fog.farMargin,
          0.5,
          8,
        ),
      },
      transitionDamping: finiteInRange(
        input?.cameraRendering?.transitionDamping,
        defaults.cameraRendering.transitionDamping,
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
