import type {
  NeuralCoreVisualDensityRuntime,
} from "./neural-core-visual-density.types";
import type {
  NeuralCoreInspectionVisualDensityConfig,
  NeuralCoreInteractionMode,
} from "../../domain/inspection/neural-core-inspection.types";

const smoothStep = (minimum: number, maximum: number, value: number): number => {
  if (maximum <= minimum) {
    return value >= maximum ? 1 : 0;
  }
  const amount = Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
  return amount * amount * (3 - 2 * amount);
};

const damp = (current: number, target: number, response: number, deltaSeconds: number): number => {
  return target + (current - target) * Math.exp(-response * Math.max(0, deltaSeconds));
};

export const createNeuralCoreVisualDensityRuntime = (): NeuralCoreVisualDensityRuntime => ({
  enabled: false,
  level: "macro",
  macroWeight: 1,
  mesoWeight: 0,
  microWeight: 0,
  baseConnectionOpacity: 1,
  ambientParticleOpacity: 1,
  unrelatedNodeOpacity: 1,
  relatedConnectionEmphasis: 1,
  internalConnectionEmphasis: 1,
});

export const updateNeuralCoreVisualDensityRuntime = (
  runtime: NeuralCoreVisualDensityRuntime,
  config: NeuralCoreInspectionVisualDensityConfig,
  cameraDistance: number,
  deltaSeconds: number,
  interactionMode: NeuralCoreInteractionMode,
  hasSelectedCluster: boolean,
): NeuralCoreVisualDensityRuntime => {
  if (!config.enabled || interactionMode !== "inspection") {
    runtime.enabled = false;
    runtime.level = "macro";
    runtime.macroWeight = 1;
    runtime.mesoWeight = 0;
    runtime.microWeight = 0;
    runtime.baseConnectionOpacity = 1;
    runtime.ambientParticleOpacity = 1;
    runtime.unrelatedNodeOpacity = 1;
    runtime.relatedConnectionEmphasis = 1;
    runtime.internalConnectionEmphasis = 1;
    return runtime;
  }

  runtime.enabled = true;
  const transitionWidth = Math.max(
    0.12,
    Math.min(0.45, (config.distance.mesoMaximum - config.distance.microMaximum) * 0.22),
  );
  let targetMicroWeight = 1 - smoothStep(
    config.distance.microMaximum - transitionWidth,
    config.distance.microMaximum + transitionWidth,
    cameraDistance,
  );
  let targetMacroWeight = smoothStep(
    config.distance.mesoMaximum - transitionWidth,
    config.distance.mesoMaximum + transitionWidth,
    cameraDistance,
  );
  if (hasSelectedCluster) {
    targetMicroWeight = Math.max(targetMicroWeight, 0.7);
    targetMacroWeight *= 1 - targetMicroWeight;
  }
  const targetMesoWeight = Math.max(0, 1 - targetMicroWeight - targetMacroWeight);
  const totalWeight = Math.max(0.0001, targetMicroWeight + targetMesoWeight + targetMacroWeight);
  targetMicroWeight /= totalWeight;
  targetMacroWeight /= totalWeight;
  const normalizedMesoWeight = targetMesoWeight / totalWeight;
  const response = config.transitionDamping;
  runtime.macroWeight = damp(runtime.macroWeight, targetMacroWeight, response, deltaSeconds);
  runtime.mesoWeight = damp(runtime.mesoWeight, normalizedMesoWeight, response, deltaSeconds);
  runtime.microWeight = damp(runtime.microWeight, targetMicroWeight, response, deltaSeconds);
  const runtimeWeight = Math.max(
    0.0001,
    runtime.macroWeight + runtime.mesoWeight + runtime.microWeight,
  );
  runtime.macroWeight /= runtimeWeight;
  runtime.mesoWeight /= runtimeWeight;
  runtime.microWeight /= runtimeWeight;
  runtime.level = runtime.microWeight >= runtime.mesoWeight
    && runtime.microWeight >= runtime.macroWeight
    ? "micro"
    : runtime.mesoWeight >= runtime.macroWeight ? "meso" : "macro";
  runtime.baseConnectionOpacity = config.macro.baseConnectionOpacity * runtime.macroWeight
    + config.meso.baseConnectionOpacity * runtime.mesoWeight
    + config.micro.baseConnectionOpacity * runtime.microWeight;
  runtime.ambientParticleOpacity = config.macro.ambientParticleOpacity * runtime.macroWeight
    + config.meso.ambientParticleOpacity * runtime.mesoWeight
    + config.micro.ambientParticleOpacity * runtime.microWeight;
  runtime.unrelatedNodeOpacity = config.macro.unrelatedNodeOpacity * runtime.macroWeight
    + config.meso.unrelatedNodeOpacity * runtime.mesoWeight
    + config.micro.unrelatedNodeOpacity * runtime.microWeight;
  runtime.relatedConnectionEmphasis = 1
    + (config.micro.relatedConnectionEmphasis - 1) * runtime.microWeight;
  runtime.internalConnectionEmphasis = 1
    + (config.micro.internalConnectionEmphasis - 1) * runtime.microWeight;
  return runtime;
};
