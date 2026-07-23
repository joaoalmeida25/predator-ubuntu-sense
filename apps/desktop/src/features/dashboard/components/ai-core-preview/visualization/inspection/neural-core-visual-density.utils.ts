import type {
  NeuralCoreVisualDensityRuntime,
  NeuralCoreVisualDensityWeights,
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

export const normalizeNeuralCoreVisualDensityWeights = (
  weights: NeuralCoreVisualDensityWeights,
): NeuralCoreVisualDensityWeights => {
  const macroWeight = Number.isFinite(weights.macroWeight)
    ? Math.max(0, weights.macroWeight)
    : 0;
  const mesoWeight = Number.isFinite(weights.mesoWeight)
    ? Math.max(0, weights.mesoWeight)
    : 0;
  const microWeight = Number.isFinite(weights.microWeight)
    ? Math.max(0, weights.microWeight)
    : 0;
  const total = macroWeight + mesoWeight + microWeight;
  if (total <= 0.0001) {
    return { macroWeight: 1, mesoWeight: 0, microWeight: 0 };
  }
  return {
    macroWeight: macroWeight / total,
    mesoWeight: mesoWeight / total,
    microWeight: microWeight / total,
  };
};

export const mapNeuralCoreVisualDensityWeights = (
  config: NeuralCoreInspectionVisualDensityConfig,
  cameraDistance: number,
): NeuralCoreVisualDensityWeights => {
  const safeCameraDistance = Number.isFinite(cameraDistance)
    ? Math.max(0, cameraDistance)
    : config.distance.mesoMaximum;
  const transitionWidth = Math.max(
    0.12,
    Math.min(0.45, (config.distance.mesoMaximum - config.distance.microMaximum) * 0.22),
  );
  const microWeight = 1 - smoothStep(
    config.distance.microMaximum - transitionWidth,
    config.distance.microMaximum + transitionWidth,
    safeCameraDistance,
  );
  const macroWeight = smoothStep(
    config.distance.mesoMaximum - transitionWidth,
    config.distance.mesoMaximum + transitionWidth,
    safeCameraDistance,
  );
  return normalizeNeuralCoreVisualDensityWeights({
    macroWeight,
    mesoWeight: Math.max(0, 1 - microWeight - macroWeight),
    microWeight,
  });
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
  const safeCameraDistance = Number.isFinite(cameraDistance)
    ? Math.max(0, cameraDistance)
    : config.distance.mesoMaximum;
  const transitionWidth = Math.max(
    0.12,
    Math.min(0.45, (config.distance.mesoMaximum - config.distance.microMaximum) * 0.22),
  );
  const targetMicroWeight = 1 - smoothStep(
    config.distance.microMaximum - transitionWidth,
    config.distance.microMaximum + transitionWidth,
    safeCameraDistance,
  );
  const targetMacroWeight = smoothStep(
    config.distance.mesoMaximum - transitionWidth,
    config.distance.mesoMaximum + transitionWidth,
    safeCameraDistance,
  );
  const targetMesoWeight = Math.max(0, 1 - targetMicroWeight - targetMacroWeight);
  const targetTotal = Math.max(
    0.0001,
    targetMacroWeight + targetMesoWeight + targetMicroWeight,
  );
  const response = config.transitionDamping;
  runtime.macroWeight = damp(
    runtime.macroWeight,
    targetMacroWeight / targetTotal,
    response,
    deltaSeconds,
  );
  runtime.mesoWeight = damp(
    runtime.mesoWeight,
    targetMesoWeight / targetTotal,
    response,
    deltaSeconds,
  );
  runtime.microWeight = damp(
    runtime.microWeight,
    targetMicroWeight / targetTotal,
    response,
    deltaSeconds,
  );
  const runtimeTotal = Math.max(
    0.0001,
    runtime.macroWeight + runtime.mesoWeight + runtime.microWeight,
  );
  runtime.macroWeight /= runtimeTotal;
  runtime.mesoWeight /= runtimeTotal;
  runtime.microWeight /= runtimeTotal;
  runtime.level = runtime.microWeight >= runtime.mesoWeight
    && runtime.microWeight >= runtime.macroWeight
    ? "micro"
    : runtime.mesoWeight >= runtime.macroWeight ? "meso" : "macro";
  // Compatibility fields remain neutral. Distance only resolves macro/meso/micro.
  runtime.baseConnectionOpacity = 1;
  runtime.ambientParticleOpacity = 1;
  runtime.unrelatedNodeOpacity = 1;
  runtime.relatedConnectionEmphasis = 1;
  runtime.internalConnectionEmphasis = 1;
  return runtime;
};
