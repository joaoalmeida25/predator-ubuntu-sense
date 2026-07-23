import { hashNeuralCoreSpatialId } from "../spatial/neural-core-spatial-map.utils";
import {
  NEURAL_CORE_CLUSTER_LABEL_HEIGHT_BY_LEVEL,
  NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS,
  NEURAL_CORE_CLUSTER_LABEL_WIDTH_BY_LEVEL,
  type NeuralCoreClusterLabelPositionId,
} from "./neural-core-label-layout.constants";
import type {
  NeuralCoreClusterLabelModel,
} from "./neural-core-cluster-label.types";
import type {
  NeuralCoreClusterLabelLeaderLine,
  NeuralCoreLabelRect,
} from "./neural-core-label-layout.types";

export const getNeuralCoreClusterLabelDimensions = (
  model: NeuralCoreClusterLabelModel,
  viewportWidth: number,
): { width: number; height: number } => {
  if (model.isCompact) {
    return {
      width: Math.min(176, Math.max(112, model.title.length * 6.4 + 58)),
      height: 42,
    };
  }
  const limits = NEURAL_CORE_CLUSTER_LABEL_WIDTH_BY_LEVEL[model.level];
  const characterWidth = model.level === "overview" ? 6.2 : 6.7;
  const desiredWidth = model.level === "overview"
    ? model.title.length * characterWidth + 34
    : limits.maximum;
  const responsiveMaximum = Math.max(82, Math.min(limits.maximum, viewportWidth * 0.42));
  return {
    width: Math.min(responsiveMaximum, Math.max(limits.minimum, desiredWidth)),
    height: NEURAL_CORE_CLUSTER_LABEL_HEIGHT_BY_LEVEL[model.level],
  };
};

export const doNeuralCoreLabelRectsOverlap = (
  left: NeuralCoreLabelRect,
  right: NeuralCoreLabelRect,
  padding = 0,
): boolean => {
  return left.x < right.x + right.width + padding
    && left.x + left.width + padding > right.x
    && left.y < right.y + right.height + padding
    && left.y + left.height + padding > right.y;
};

export const isNeuralCoreLabelRectInsideViewport = (
  rect: NeuralCoreLabelRect,
  viewport: { width: number; height: number },
  padding: number,
): boolean => {
  return rect.x >= padding
    && rect.y >= padding
    && rect.x + rect.width <= viewport.width - padding
    && rect.y + rect.height <= viewport.height - padding;
};

export const clampNeuralCoreLabelRectToViewport = (
  rect: NeuralCoreLabelRect,
  viewport: { width: number; height: number },
  padding: number,
): NeuralCoreLabelRect => {
  return {
    ...rect,
    x: Math.min(
      Math.max(padding, viewport.width - padding - rect.width),
      Math.max(padding, rect.x),
    ),
    y: Math.min(
      Math.max(padding, viewport.height - padding - rect.height),
      Math.max(padding, rect.y),
    ),
  };
};

export const getNeuralCoreLabelCandidateOrder = (
  clusterId: string,
  anchorX: number,
  anchorY: number,
  viewport: { width: number; height: number },
): readonly NeuralCoreClusterLabelPositionId[] => {
  const horizontal = anchorX < viewport.width * 0.5 ? "west" : "east";
  const vertical = anchorY < viewport.height * 0.5 ? "north" : "south";
  const outward = `${vertical}-${horizontal}` as NeuralCoreClusterLabelPositionId;
  const horizontalFirst = horizontal as NeuralCoreClusterLabelPositionId;
  const verticalFirst = vertical as NeuralCoreClusterLabelPositionId;
  const hashOffset = hashNeuralCoreSpatialId(clusterId, 7919)
    % NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS.length;
  const rotated = [
    ...NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS.slice(hashOffset),
    ...NEURAL_CORE_CLUSTER_LABEL_POSITION_IDS.slice(0, hashOffset),
  ];
  return [outward, horizontalFirst, verticalFirst, ...rotated]
    .filter((value, index, values) => values.indexOf(value) === index);
};

export const getNeuralCoreLeaderLine = (
  anchorX: number,
  anchorY: number,
  rect: NeuralCoreLabelRect,
): NeuralCoreClusterLabelLeaderLine => {
  const endX = Math.min(rect.x + rect.width, Math.max(rect.x, anchorX));
  const endY = Math.min(rect.y + rect.height, Math.max(rect.y, anchorY));
  return { startX: anchorX, startY: anchorY, endX, endY };
};
