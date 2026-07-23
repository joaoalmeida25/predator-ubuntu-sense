import type { NeuralCoreDetailLevel } from "../lod/neural-core-lod.types";

export const NEURAL_CORE_CLUSTER_LABEL_HEIGHT_BY_LEVEL: Record<
  NeuralCoreDetailLevel,
  number
> = {
  overview: 28,
  summary: 68,
  detail: 112,
};

export const NEURAL_CORE_CLUSTER_LABEL_WIDTH_BY_LEVEL: Record<
  NeuralCoreDetailLevel,
  { minimum: number; maximum: number }
> = {
  overview: { minimum: 82, maximum: 148 },
  summary: { minimum: 160, maximum: 176 },
  detail: { minimum: 198, maximum: 214 },
};

export const NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS = [
  "north-east",
  "north-west",
  "south-east",
  "south-west",
  "north",
  "south",
  "east",
  "west",
] as const;

export type NeuralCoreClusterLabelPositionId =
  typeof NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS[number];
