import type { NeuralCoreClusterLabelPositionId } from "./neural-core-label-layout.constants";
import type {
  MapNeuralCoreClusterLabelLayoutParams,
  NeuralCoreClusterLabelPlacement,
  NeuralCoreClusterLabelScreenCandidate,
  NeuralCoreLabelRect,
} from "./neural-core-label-layout.types";
import {
  clampNeuralCoreLabelRectToViewport,
  doNeuralCoreLabelRectsOverlap,
  getNeuralCoreLabelCandidateOrder,
  getNeuralCoreLeaderLine,
  isNeuralCoreLabelRectInsideViewport,
} from "./neural-core-label-layout.utils";

const compareCandidates = (
  left: NeuralCoreClusterLabelScreenCandidate,
  right: NeuralCoreClusterLabelScreenCandidate,
): number => {
  const booleanKeys: readonly (keyof Pick<
    NeuralCoreClusterLabelScreenCandidate,
    "isFocused" | "isCritical" | "isActive" | "isWarning"
  >)[] = ["isFocused", "isCritical", "isActive", "isWarning"];
  for (const key of booleanKeys) {
    const difference = Number(right[key]) - Number(left[key]);
    if (difference !== 0) {
      return difference;
    }
  }
  const priorityDifference = right.priority - left.priority;
  if (priorityDifference !== 0) {
    return priorityDifference;
  }
  const importanceDifference = right.importance - left.importance;
  if (importanceDifference !== 0) {
    return importanceDifference;
  }
  const activityDifference = right.activity - left.activity;
  if (activityDifference !== 0) {
    return activityDifference;
  }
  const distanceDifference = left.distanceToCamera - right.distanceToCamera;
  return distanceDifference !== 0
    ? distanceDifference
    : left.clusterId.localeCompare(right.clusterId);
};

const createRect = (
  candidate: NeuralCoreClusterLabelScreenCandidate,
  position: NeuralCoreClusterLabelPositionId,
  offset: number,
): NeuralCoreLabelRect => {
  const { anchorX, anchorY, width, height } = candidate;
  switch (position) {
    case "north-east":
      return { x: anchorX + offset, y: anchorY - height - offset, width, height };
    case "north-west":
      return { x: anchorX - width - offset, y: anchorY - height - offset, width, height };
    case "south-east":
      return { x: anchorX + offset, y: anchorY + offset, width, height };
    case "south-west":
      return { x: anchorX - width - offset, y: anchorY + offset, width, height };
    case "north":
      return { x: anchorX - width * 0.5, y: anchorY - height - offset, width, height };
    case "south":
      return { x: anchorX - width * 0.5, y: anchorY + offset, width, height };
    case "east":
      return { x: anchorX + offset, y: anchorY - height * 0.5, width, height };
    case "west":
      return { x: anchorX - width - offset, y: anchorY - height * 0.5, width, height };
  }
};

const isPlacementAvailable = (
  rect: NeuralCoreLabelRect,
  accepted: readonly NeuralCoreLabelRect[],
  exclusions: readonly NeuralCoreLabelRect[],
  collisionPaddingPx: number,
): boolean => {
  return !accepted.some((other) => {
    return doNeuralCoreLabelRectsOverlap(rect, other, collisionPaddingPx);
  }) && !exclusions.some((exclusion) => {
    return doNeuralCoreLabelRectsOverlap(rect, exclusion, collisionPaddingPx);
  });
};

const hiddenPlacement = (
  candidate: NeuralCoreClusterLabelScreenCandidate,
): NeuralCoreClusterLabelPlacement => ({
  clusterId: candidate.clusterId,
  x: candidate.anchorX,
  y: candidate.anchorY,
  anchorX: candidate.anchorX,
  anchorY: candidate.anchorY,
  width: candidate.width,
  height: candidate.height,
  visible: false,
  displaced: false,
  opacity: 0,
});

const findFocusedFallback = (
  candidate: NeuralCoreClusterLabelScreenCandidate,
  viewport: { width: number; height: number },
  accepted: readonly NeuralCoreLabelRect[],
  exclusions: readonly NeuralCoreLabelRect[],
  viewportPaddingPx: number,
  collisionPaddingPx: number,
): NeuralCoreLabelRect | undefined => {
  const horizontalStep = Math.max(12, Math.min(28, candidate.width * 0.12));
  const verticalStep = Math.max(10, Math.min(24, candidate.height * 0.18));
  const candidates: NeuralCoreLabelRect[] = [];
  for (
    let y = viewportPaddingPx;
    y + candidate.height <= viewport.height - viewportPaddingPx;
    y += verticalStep
  ) {
    for (
      let x = viewportPaddingPx;
      x + candidate.width <= viewport.width - viewportPaddingPx;
      x += horizontalStep
    ) {
      candidates.push({ x, y, width: candidate.width, height: candidate.height });
    }
  }
  candidates.sort((left, right) => {
    const leftDistance = Math.hypot(
      left.x + left.width * 0.5 - candidate.anchorX,
      left.y + left.height * 0.5 - candidate.anchorY,
    );
    const rightDistance = Math.hypot(
      right.x + right.width * 0.5 - candidate.anchorX,
      right.y + right.height * 0.5 - candidate.anchorY,
    );
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return left.y !== right.y ? left.y - right.y : left.x - right.x;
  });
  return candidates.find((rect) => {
    return isPlacementAvailable(rect, accepted, exclusions, collisionPaddingPx);
  });
};

export const mapNeuralCoreClusterLabelLayout = ({
  candidates,
  viewport,
  exclusions = [],
  previousPlacements = {},
  config,
}: MapNeuralCoreClusterLabelLayoutParams): readonly NeuralCoreClusterLabelPlacement[] => {
  const safeViewport = {
    width: Number.isFinite(viewport.width) ? Math.max(1, viewport.width) : 1,
    height: Number.isFinite(viewport.height) ? Math.max(1, viewport.height) : 1,
  };
  const acceptedRects: NeuralCoreLabelRect[] = [];
  const placements: NeuralCoreClusterLabelPlacement[] = [];
  const ordered = [...candidates].sort(compareCandidates);
  for (const candidate of ordered) {
    const hasFiniteCoordinates = Number.isFinite(candidate.anchorX)
      && Number.isFinite(candidate.anchorY)
      && Number.isFinite(candidate.depth)
      && Number.isFinite(candidate.width)
      && Number.isFinite(candidate.height);
    const shouldHide = !hasFiniteCoordinates
      || (!candidate.isFocused && !candidate.isAnchorOnScreen)
      || (config.hideRearFacingLabels
        && candidate.isRearFacing
        && !candidate.isFocused
        && !candidate.isCritical);
    if (shouldHide) {
      placements.push(hiddenPlacement(candidate));
      continue;
    }
    const previous = previousPlacements[candidate.clusterId];
    let selected: NeuralCoreLabelRect | undefined;
    let selectedPlacementKey: string | undefined;
    if (previous?.visible) {
      const previousOffsetX = previous.x - previous.anchorX;
      const previousOffsetY = previous.y - previous.anchorY;
      const retained = {
        x: candidate.anchorX + previousOffsetX,
        y: candidate.anchorY + previousOffsetY,
        width: candidate.width,
        height: candidate.height,
      };
      const retainedDistance = Math.hypot(previousOffsetX, previousOffsetY);
      if (
        retainedDistance <= config.preferredOffsetPx
          + config.maximumDisplacementPx
        && isNeuralCoreLabelRectInsideViewport(
          retained,
          safeViewport,
          config.viewportPaddingPx,
        )
        && isPlacementAvailable(
          retained,
          acceptedRects,
          exclusions,
          config.collisionPaddingPx,
        )
      ) {
        selected = retained;
        selectedPlacementKey = previous.placementKey;
      }
    }
    const directions = getNeuralCoreLabelCandidateOrder(
      candidate.clusterId,
      candidate.anchorX,
      candidate.anchorY,
      safeViewport,
    );
    const displacementStep = Math.max(8, Math.min(20, config.maximumDisplacementPx / 3));
    const shifts = [0, displacementStep, -displacementStep, displacementStep * 2, -displacementStep * 2]
      .filter((shift) => Math.abs(shift) <= config.maximumDisplacementPx);
    const retainedPreviousPlacement = selected !== undefined;
    let bestCandidateScore = Number.POSITIVE_INFINITY;
    for (
      let directionIndex = 0;
      !retainedPreviousPlacement && directionIndex < directions.length;
      directionIndex += 1
    ) {
      const direction = directions[directionIndex];
      const base = createRect(candidate, direction, config.preferredOffsetPx);
      for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
        const shift = shifts[shiftIndex];
        const horizontalDirection = direction === "east" || direction === "west";
        const raw = {
          ...base,
          x: base.x + (horizontalDirection ? 0 : shift),
          y: base.y + (horizontalDirection ? shift : 0),
        };
        const compacted = clampNeuralCoreLabelRectToViewport(
          raw,
          safeViewport,
          config.viewportPaddingPx,
        );
        const compactionDistance = Math.hypot(compacted.x - raw.x, compacted.y - raw.y);
        if (
          compactionDistance > config.maximumDisplacementPx
          || !isNeuralCoreLabelRectInsideViewport(
            compacted,
            safeViewport,
            config.viewportPaddingPx,
          )
          || !isPlacementAvailable(
            compacted,
            acceptedRects,
            exclusions,
            config.collisionPaddingPx,
          )
        ) {
          continue;
        }
        const placementKey = `${direction}:${shiftIndex}`;
        const displacementScore = Math.hypot(
          compacted.x + compacted.width * 0.5 - candidate.anchorX,
          compacted.y + compacted.height * 0.5 - candidate.anchorY,
        );
        const placementChangePenalty = previous?.placementKey
          && previous.placementKey !== placementKey
          ? config.placementChangePenalty
          : 0;
        const candidateScore = compactionDistance * 2
          + displacementScore * 0.08
          + placementChangePenalty
          + directionIndex * 0.001
          + shiftIndex * 0.0001;
        if (candidateScore < bestCandidateScore) {
          bestCandidateScore = candidateScore;
          selected = compacted;
          selectedPlacementKey = placementKey;
        }
      }
    }
    if (!selected && candidate.isFocused) {
      selected = findFocusedFallback(
        candidate,
        safeViewport,
        acceptedRects,
        exclusions,
        config.viewportPaddingPx,
        config.collisionPaddingPx,
      );
      selectedPlacementKey = selected ? "focused-fallback" : undefined;
    }
    if (!selected) {
      placements.push(hiddenPlacement(candidate));
      continue;
    }
    acceptedRects.push(selected);
    const leaderLine = getNeuralCoreLeaderLine(
      candidate.anchorX,
      candidate.anchorY,
      selected,
    );
    const lineLength = Math.hypot(
      leaderLine.endX - leaderLine.startX,
      leaderLine.endY - leaderLine.startY,
    );
    const displaced = lineLength > config.leaderLineThresholdPx;
    placements.push({
      clusterId: candidate.clusterId,
      x: selected.x,
      y: selected.y,
      anchorX: candidate.anchorX,
      anchorY: candidate.anchorY,
      width: selected.width,
      height: selected.height,
      visible: true,
      displaced,
      opacity: candidate.isRearFacing && !candidate.isCritical ? 0.68 : 1,
      placementKey: selectedPlacementKey,
      ...(displaced ? { leaderLine } : {}),
    });
  }
  return placements.sort((left, right) => left.clusterId.localeCompare(right.clusterId));
};
