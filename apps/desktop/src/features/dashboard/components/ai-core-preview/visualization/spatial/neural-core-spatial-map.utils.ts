import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import {
  DEFAULT_NEURAL_CORE_SPATIAL_LAYOUT_CONFIG,
  NEURAL_CORE_SPATIAL_MAP_VERSION,
  NEURAL_CORE_SPATIAL_POSITION_LIMITS,
  NEURAL_CORE_SPATIAL_SEPARATION_EPSILON,
} from "./neural-core-spatial-map.constants";
import type {
  NeuralCoreClusterSpatialAnchor,
  NeuralCoreClusterSpatialAnchorInput,
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialLayoutConfigInput,
  NeuralCoreSpatialMapDiagnostics,
  NeuralCoreSpatialMapInput,
  NormalizedNeuralCoreSpatialMapInput,
} from "./neural-core-spatial-map.types";

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

const integerInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => Math.trunc(finiteInRange(value, fallback, minimum, maximum));

export const resolveNeuralCoreSpatialLayoutConfig = (
  input?: NeuralCoreSpatialLayoutConfigInput,
): NeuralCoreSpatialLayoutConfig => {
  const defaults = DEFAULT_NEURAL_CORE_SPATIAL_LAYOUT_CONFIG;
  const minimumRadius = finiteInRange(
    input?.minimumClusterRadius,
    defaults.minimumClusterRadius,
    0.08,
    0.8,
  );
  const maximumRadius = Math.max(
    minimumRadius,
    finiteInRange(input?.maximumClusterRadius, defaults.maximumClusterRadius, 0.08, 1),
  );
  return {
    deterministicSeed: Math.trunc(finiteInRange(
      input?.deterministicSeed,
      defaults.deterministicSeed,
      -2147483648,
      2147483647,
    )),
    minimumClusterSeparation: finiteInRange(
      input?.minimumClusterSeparation,
      defaults.minimumClusterSeparation,
      0,
      1.4,
    ),
    maximumClusterOverlapRatio: finiteInRange(
      input?.maximumClusterOverlapRatio,
      defaults.maximumClusterOverlapRatio,
      0,
      1,
    ),
    defaultClusterRadius: finiteInRange(
      input?.defaultClusterRadius,
      defaults.defaultClusterRadius,
      minimumRadius,
      maximumRadius,
    ),
    minimumClusterRadius: minimumRadius,
    maximumClusterRadius: maximumRadius,
    reusePreviousAnchors: input?.reusePreviousAnchors ?? defaults.reusePreviousAnchors,
    collisionResolution: {
      maximumAttempts: integerInRange(
        input?.collisionResolution?.maximumAttempts,
        defaults.collisionResolution.maximumAttempts,
        1,
        256,
      ),
      searchStep: finiteInRange(
        input?.collisionResolution?.searchStep,
        defaults.collisionResolution.searchStep,
        0.01,
        0.8,
      ),
      depthStep: finiteInRange(
        input?.collisionResolution?.depthStep,
        defaults.collisionResolution.depthStep,
        0,
        0.5,
      ),
    },
  };
};

export const hashNeuralCoreSpatialId = (value: string, seed: number): number => {
  let hash = (2166136261 ^ seed) >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619) >>> 0;
  }
  return hash;
};

export const clampNeuralCoreSpatialPosition = (
  position: NeuralCoreVector3,
): NeuralCoreVector3 => {
  return [
    finiteInRange(position[0], 0, -NEURAL_CORE_SPATIAL_POSITION_LIMITS.x, NEURAL_CORE_SPATIAL_POSITION_LIMITS.x),
    finiteInRange(position[1], 0, -NEURAL_CORE_SPATIAL_POSITION_LIMITS.y, NEURAL_CORE_SPATIAL_POSITION_LIMITS.y),
    finiteInRange(position[2], 0, -NEURAL_CORE_SPATIAL_POSITION_LIMITS.z, NEURAL_CORE_SPATIAL_POSITION_LIMITS.z),
  ];
};

export const getNeuralCoreSpatialDistance = (
  left: NeuralCoreVector3,
  right: NeuralCoreVector3,
): number => {
  const leftX = Number.isFinite(left[0]) ? left[0] : 0;
  const leftY = Number.isFinite(left[1]) ? left[1] : 0;
  const leftZ = Number.isFinite(left[2]) ? left[2] : 0;
  const rightX = Number.isFinite(right[0]) ? right[0] : 0;
  const rightY = Number.isFinite(right[1]) ? right[1] : 0;
  const rightZ = Number.isFinite(right[2]) ? right[2] : 0;
  return Math.hypot(leftX - rightX, leftY - rightY, leftZ - rightZ);
};

export const isNeuralCoreSpatialAnchorAuthoritative = (
  anchor: NeuralCoreClusterSpatialAnchor,
): boolean => anchor.source === "explicit" || anchor.source === "previous-map";

export const getNeuralCoreSpatialRequiredDistance = (
  left: NeuralCoreClusterSpatialAnchor,
  right: NeuralCoreClusterSpatialAnchor,
  config: NeuralCoreSpatialLayoutConfig,
): number => {
  const radiusDistance = (left.radius + right.radius)
    * (1 - config.maximumClusterOverlapRatio);
  return Math.max(config.minimumClusterSeparation, radiusDistance);
};

export const normalizeNeuralCoreSpatialAnchor = (
  anchor: NeuralCoreClusterSpatialAnchor,
  config: NeuralCoreSpatialLayoutConfig,
  source: NeuralCoreClusterSpatialAnchor["source"] = anchor.source,
): NeuralCoreClusterSpatialAnchor => {
  return {
    clusterId: anchor.clusterId.trim(),
    normalizedPosition: clampNeuralCoreSpatialPosition(anchor.normalizedPosition),
    radius: finiteInRange(
      anchor.radius,
      config.defaultClusterRadius,
      config.minimumClusterRadius,
      config.maximumClusterRadius,
    ),
    ...(anchor.region ? { region: anchor.region } : {}),
    ...(anchor.hemisphere ? { hemisphere: anchor.hemisphere } : {}),
    ...(anchor.depth ? { depth: anchor.depth } : {}),
    priority: finiteInRange(anchor.priority, 0.5, 0, 1),
    source,
  };
};

const isValidAnchorInput = (
  anchor: NeuralCoreClusterSpatialAnchorInput,
): boolean => {
  return typeof anchor.clusterId === "string"
    && anchor.clusterId.trim().length > 0
    && Array.isArray(anchor.normalizedPosition)
    && anchor.normalizedPosition.length >= 3
    && anchor.normalizedPosition.every((coordinate) => {
      return typeof coordinate === "number" && Number.isFinite(coordinate);
    });
};

/**
 * Normalizes public anchors with a first-valid-occurrence-wins duplicate policy.
 */
export const normalizeNeuralCoreSpatialMapInput = (
  input?: NeuralCoreSpatialMapInput,
  configInput?: NeuralCoreSpatialLayoutConfig,
): NormalizedNeuralCoreSpatialMapInput => {
  const config = resolveNeuralCoreSpatialLayoutConfig(configInput);
  const anchorsByClusterId: Record<string, NeuralCoreClusterSpatialAnchor> = {};
  for (const anchor of input?.anchors ?? []) {
    if (!isValidAnchorInput(anchor)) {
      continue;
    }
    const clusterId = anchor.clusterId.trim();
    if (anchorsByClusterId[clusterId]) {
      continue;
    }
    anchorsByClusterId[clusterId] = normalizeNeuralCoreSpatialAnchor({
      clusterId,
      normalizedPosition: anchor.normalizedPosition,
      radius: anchor.radius ?? config.defaultClusterRadius,
      ...(anchor.region ? { region: anchor.region } : {}),
      ...(anchor.hemisphere ? { hemisphere: anchor.hemisphere } : {}),
      ...(anchor.depth ? { depth: anchor.depth } : {}),
      priority: anchor.priority ?? 0.5,
      source: "explicit",
    }, config, "explicit");
  }
  const version = integerInRange(
    input?.version,
    NEURAL_CORE_SPATIAL_MAP_VERSION,
    1,
    2147483647,
  );
  return {
    version,
    anchors: Object.values(anchorsByClusterId)
      .sort((left, right) => left.clusterId.localeCompare(right.clusterId)),
  };
};

export const validateNeuralCoreSpatialMapSeparation = (
  anchors: readonly NeuralCoreClusterSpatialAnchor[],
  config: NeuralCoreSpatialLayoutConfig,
): NeuralCoreSpatialMapDiagnostics => {
  const sortedAnchors = [...anchors]
    .sort((left, right) => left.clusterId.localeCompare(right.clusterId));
  const conflicts: NeuralCoreSpatialMapDiagnostics["conflicts"][number][] = [];
  const seenPairs: Record<string, true> = {};
  for (let leftIndex = 0; leftIndex < sortedAnchors.length; leftIndex += 1) {
    const left = sortedAnchors[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < sortedAnchors.length; rightIndex += 1) {
      const right = sortedAnchors[rightIndex];
      if (left.clusterId === right.clusterId) {
        continue;
      }
      const pairKey = `${left.clusterId}\u0000${right.clusterId}`;
      if (seenPairs[pairKey]) {
        continue;
      }
      seenPairs[pairKey] = true;
      const actualDistance = getNeuralCoreSpatialDistance(
        left.normalizedPosition,
        right.normalizedPosition,
      );
      const requiredDistance = getNeuralCoreSpatialRequiredDistance(left, right, config);
      if (actualDistance + NEURAL_CORE_SPATIAL_SEPARATION_EPSILON >= requiredDistance) {
        continue;
      }
      conflicts.push({
        clusterId: left.clusterId,
        conflictingClusterId: right.clusterId,
        reason: isNeuralCoreSpatialAnchorAuthoritative(left)
          && isNeuralCoreSpatialAnchorAuthoritative(right)
          ? "authoritative-overlap"
          : "minimum-separation-unresolved",
        actualDistance,
        requiredDistance,
      });
    }
  }
  return {
    conflicts,
    hasUnresolvedConflicts: conflicts.length > 0,
  };
};
