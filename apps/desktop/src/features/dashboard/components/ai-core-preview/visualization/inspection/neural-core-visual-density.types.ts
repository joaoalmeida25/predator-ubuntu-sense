import type { NeuralCoreVisualDensityLevel } from "../../domain/inspection/neural-core-inspection.types";

export interface NeuralCoreVisualDensityWeights {
  macroWeight: number;
  mesoWeight: number;
  microWeight: number;
}

export interface NeuralCoreVisualDensityRuntime extends NeuralCoreVisualDensityWeights {
  enabled: boolean;
  level: NeuralCoreVisualDensityLevel;
  /** @deprecated Compatibility-only. Visibility is resolved by the visual compositor. */
  baseConnectionOpacity: number;
  /** @deprecated Compatibility-only. Visibility is resolved by the visual compositor. */
  ambientParticleOpacity: number;
  /** @deprecated Compatibility-only. Visibility is resolved by the visual compositor. */
  unrelatedNodeOpacity: number;
  /** @deprecated Compatibility-only. Visibility is resolved by the visual compositor. */
  relatedConnectionEmphasis: number;
  /** @deprecated Compatibility-only. Visibility is resolved by the visual compositor. */
  internalConnectionEmphasis: number;
}
