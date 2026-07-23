import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export const clampNeuralCoreTopologyVisualValue = (value?: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
};

export const hashNeuralCoreTopologyVisualId = (value: string): number => {
  return value.split("").reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 2166136261);
};

export const getNeuralCoreTopologyVisualDistance = (
  from: NeuralCoreVector3,
  to: NeuralCoreVector3,
): number => {
  const deltaX = from[0] - to[0];
  const deltaY = from[1] - to[1];
  const deltaZ = from[2] - to[2];

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
};

export const mixNeuralCoreTopologyVisualVector = (
  from: NeuralCoreVector3,
  to: NeuralCoreVector3,
  amount: number,
): NeuralCoreVector3 => {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
};

export const getNeuralCoreTopologyVisualAverageVector = (
  vectors: NeuralCoreVector3[],
  fallback: NeuralCoreVector3,
): NeuralCoreVector3 => {
  if (vectors.length === 0) {
    return fallback;
  }

  const sum = vectors.reduce<NeuralCoreVector3>(
    (current, vector) => [
      current[0] + vector[0],
      current[1] + vector[1],
      current[2] + vector[2],
    ],
    [0, 0, 0],
  );

  return [
    sum[0] / vectors.length,
    sum[1] / vectors.length,
    sum[2] / vectors.length,
  ];
};
