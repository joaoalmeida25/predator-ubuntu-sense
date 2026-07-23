import type { NeuralCoreVisualDensityLevel } from "../../domain/inspection/neural-core-inspection.types";

export interface NeuralCoreVisualDensityRuntime {
  enabled: boolean;
  level: NeuralCoreVisualDensityLevel;
  macroWeight: number;
  mesoWeight: number;
  microWeight: number;
  baseConnectionOpacity: number;
  ambientParticleOpacity: number;
  unrelatedNodeOpacity: number;
  relatedConnectionEmphasis: number;
  internalConnectionEmphasis: number;
}
