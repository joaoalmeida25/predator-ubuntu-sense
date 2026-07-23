import type {
  NeuralCoreCluster,
  NeuralCoreClusterPositionHint,
  NeuralCoreTopology,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import {
  NEURAL_CORE_CLUSTER_KIND_SPATIAL_PROFILES,
} from "./neural-core-spatial-map.constants";
import type {
  NeuralCoreClusterSpatialAnchor,
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialLayoutConfigInput,
  NeuralCoreSpatialMap,
  NeuralCoreSpatialMapInput,
} from "./neural-core-spatial-map.types";
import {
  clampNeuralCoreSpatialPosition,
  getNeuralCoreSpatialDistance,
  getNeuralCoreSpatialRequiredDistance,
  hashNeuralCoreSpatialId,
  isNeuralCoreSpatialAnchorAuthoritative,
  normalizeNeuralCoreSpatialAnchor,
  normalizeNeuralCoreSpatialMapInput,
  resolveNeuralCoreSpatialLayoutConfig,
  validateNeuralCoreSpatialMapSeparation,
} from "./neural-core-spatial-map.utils";

interface CreateNeuralCoreSpatialMapParams {
  topology: NeuralCoreTopology;
  config?: NeuralCoreSpatialLayoutConfigInput;
  explicitMap?: NeuralCoreSpatialMapInput;
  previousMap?: NeuralCoreSpatialMap;
}

const getHashOffset = (
  clusterId: string,
  seed: number,
  scale: number,
): NeuralCoreVector3 => {
  const hash = hashNeuralCoreSpatialId(clusterId, seed);
  return [
    (((hash & 255) / 255) - 0.5) * scale,
    ((((hash >>> 8) & 255) / 255) - 0.5) * scale * 0.72,
    ((((hash >>> 16) & 255) / 255) - 0.5) * scale * 0.62,
  ];
};

const applyPositionHint = (
  center: NeuralCoreVector3,
  hint: NeuralCoreClusterPositionHint,
): NeuralCoreVector3 => {
  const hemisphereOffset = hint.hemisphere === "left"
    ? -0.24
    : hint.hemisphere === "right" ? 0.24 : 0;
  const depthOffset = hint.depth === "surface" ? 0.16 : hint.depth === "deep" ? -0.18 : 0;
  const verticalOffset = hint.region === "upper"
    || hint.region === "frontal"
    || hint.region === "outer"
    ? 0.12
    : hint.region === "lower" ? -0.16 : 0;
  return [
    center[0] + hemisphereOffset,
    center[1] + verticalOffset,
    center[2] + depthOffset,
  ];
};

const constrainDepth = (
  position: NeuralCoreVector3,
  hint: NeuralCoreClusterPositionHint,
): NeuralCoreVector3 => {
  if (hint.depth === "deep") {
    return [position[0], position[1], Math.min(-0.2, position[2])];
  }
  if (hint.depth === "surface") {
    return [position[0], position[1], Math.max(0.04, position[2])];
  }
  return position;
};

const createStructuralAnchor = (
  cluster: NeuralCoreCluster,
  config: NeuralCoreSpatialLayoutConfig,
): NeuralCoreClusterSpatialAnchor => {
  const profile = NEURAL_CORE_CLUSTER_KIND_SPATIAL_PROFILES[cluster.kind];
  const hasPositionHint = cluster.positionHint !== undefined;
  const hint = { ...profile.hint, ...cluster.positionHint };
  const offsetScale = cluster.kind === "custom" ? 0.86 : 0.22;
  const offset = getHashOffset(cluster.id, config.deterministicSeed, offsetScale);
  const hinted = applyPositionHint(profile.center, hint);
  const position = constrainDepth(clampNeuralCoreSpatialPosition([
    hinted[0] + offset[0],
    hinted[1] + offset[1],
    hinted[2] + offset[2],
  ]), hint);
  return {
    clusterId: cluster.id,
    normalizedPosition: clampNeuralCoreSpatialPosition(position),
    radius: config.defaultClusterRadius,
    ...(hint.region ? { region: hint.region } : {}),
    ...(hint.hemisphere ? { hemisphere: hint.hemisphere } : {}),
    ...(hint.depth ? { depth: hint.depth } : {}),
    priority: Math.min(1, Math.max(0, cluster.positionHint?.priority ?? 0.5)),
    source: cluster.kind === "custom" && !hasPositionHint
      ? "deterministic-fallback"
      : hasPositionHint ? "position-hint" : "kind-profile",
  };
};

interface NeuralCoreSpatialCandidateSearchResult {
  anchor: NeuralCoreClusterSpatialAnchor;
  boundsExhausted: boolean;
}

const getCandidatePosition = (
  anchor: NeuralCoreClusterSpatialAnchor,
  attempt: number,
  config: NeuralCoreSpatialLayoutConfig,
): NeuralCoreVector3 => {
  if (attempt === 0) {
    return [...anchor.normalizedPosition];
  }
  const hash = hashNeuralCoreSpatialId(anchor.clusterId, config.deterministicSeed);
  const phase = ((hash & 65535) / 65535) * Math.PI * 2;
  const shell = Math.ceil(attempt / 8);
  const radius = config.collisionResolution.searchStep * shell;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = phase + attempt * goldenAngle;
  const depthAmplitude = Math.min(
    radius * 0.55,
    config.collisionResolution.depthStep * shell,
  );
  return clampNeuralCoreSpatialPosition([
    anchor.normalizedPosition[0] + Math.cos(angle) * radius,
    anchor.normalizedPosition[1] + Math.sin(angle) * radius * 0.72,
    anchor.normalizedPosition[2]
      + Math.sin(angle * 0.61803398875 + phase) * depthAmplitude,
  ]);
};

const getCandidateClearance = (
  anchor: NeuralCoreClusterSpatialAnchor,
  position: NeuralCoreVector3,
  occupied: readonly NeuralCoreClusterSpatialAnchor[],
  config: NeuralCoreSpatialLayoutConfig,
): number => {
  let minimumClearance = Number.POSITIVE_INFINITY;
  for (const existing of occupied) {
    const distance = getNeuralCoreSpatialDistance(position, existing.normalizedPosition);
    const requiredDistance = getNeuralCoreSpatialRequiredDistance(anchor, existing, config);
    minimumClearance = Math.min(minimumClearance, distance - requiredDistance);
  }
  return minimumClearance;
};

const resolveAnchorPosition = (
  anchor: NeuralCoreClusterSpatialAnchor,
  occupied: readonly NeuralCoreClusterSpatialAnchor[],
  config: NeuralCoreSpatialLayoutConfig,
): NeuralCoreSpatialCandidateSearchResult => {
  if (occupied.length === 0 || isNeuralCoreSpatialAnchorAuthoritative(anchor)) {
    return { anchor, boundsExhausted: false };
  }
  let bestPosition: NeuralCoreVector3 = [...anchor.normalizedPosition];
  let bestClearance = Number.NEGATIVE_INFINITY;
  for (
    let attempt = 0;
    attempt < config.collisionResolution.maximumAttempts;
    attempt += 1
  ) {
    const position = getCandidatePosition(anchor, attempt, config);
    const clearance = getCandidateClearance(anchor, position, occupied, config);
    if (clearance > bestClearance) {
      bestClearance = clearance;
      bestPosition = position;
    }
    if (clearance >= 0) {
      return {
        anchor: { ...anchor, normalizedPosition: position },
        boundsExhausted: false,
      };
    }
  }
  return {
    anchor: { ...anchor, normalizedPosition: bestPosition },
    boundsExhausted: true,
  };
};

const createResolvedAnchorRecord = (
  anchors: readonly NeuralCoreClusterSpatialAnchor[] | undefined,
  config: NeuralCoreSpatialLayoutConfig,
  source: NeuralCoreClusterSpatialAnchor["source"],
): Record<string, NeuralCoreClusterSpatialAnchor> => {
  const record: Record<string, NeuralCoreClusterSpatialAnchor> = {};
  const normalizedAnchors = (anchors ?? [])
    .map((anchor) => normalizeNeuralCoreSpatialAnchor(anchor, config, source))
    .filter((anchor) => anchor.clusterId.length > 0)
    .sort((left, right) => {
      const idDifference = left.clusterId.localeCompare(right.clusterId);
      return idDifference !== 0
        ? idDifference
        : JSON.stringify(left).localeCompare(JSON.stringify(right));
    });
  for (const normalized of normalizedAnchors) {
    if (normalized.clusterId && record[normalized.clusterId] === undefined) {
      record[normalized.clusterId] = normalized;
    }
  }
  return record;
};

export const createNeuralCoreSpatialIdentityKey = (
  topology: NeuralCoreTopology,
  config: NeuralCoreSpatialLayoutConfig,
  explicitMap?: NeuralCoreSpatialMapInput,
): string => {
  const normalizedExplicitMap = normalizeNeuralCoreSpatialMapInput(explicitMap, config);
  const clusters = topology.clusters
    .map((cluster) => ({
      id: cluster.id,
      kind: cluster.kind,
      positionHint: cluster.positionHint
        ? {
          region: cluster.positionHint.region,
          hemisphere: cluster.positionHint.hemisphere,
          depth: cluster.positionHint.depth,
          priority: cluster.positionHint.priority,
        }
        : undefined,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const explicitAnchors = normalizedExplicitMap.anchors
    .map((anchor) => ({
      clusterId: anchor.clusterId,
      normalizedPosition: anchor.normalizedPosition,
      radius: anchor.radius,
      region: anchor.region,
      hemisphere: anchor.hemisphere,
      depth: anchor.depth,
      priority: anchor.priority,
    }))
    .sort((left, right) => {
      const idDifference = left.clusterId.localeCompare(right.clusterId);
      return idDifference !== 0
        ? idDifference
        : JSON.stringify(left).localeCompare(JSON.stringify(right));
    });
  return JSON.stringify({
    version: normalizedExplicitMap.version,
    clusters,
    explicitAnchors,
    config,
  });
};

export const createNeuralCoreSpatialMap = ({
  topology,
  config: configInput,
  explicitMap,
  previousMap,
}: CreateNeuralCoreSpatialMapParams): NeuralCoreSpatialMap => {
  const config = resolveNeuralCoreSpatialLayoutConfig(configInput);
  const normalizedExplicitMap = normalizeNeuralCoreSpatialMapInput(explicitMap, config);
  const explicitById: Record<string, NeuralCoreClusterSpatialAnchor> = {};
  for (const anchor of normalizedExplicitMap.anchors) {
    explicitById[anchor.clusterId] = anchor;
  }
  const previousById = config.reusePreviousAnchors
    ? createResolvedAnchorRecord(previousMap?.anchors, config, "previous-map")
    : {};
  const candidates = topology.clusters.map((cluster) => {
    return explicitById[cluster.id]
      ?? previousById[cluster.id]
      ?? createStructuralAnchor(cluster, config);
  });
  candidates.sort((left, right) => {
    const pinnedDifference = Number(right.source === "explicit" || right.source === "previous-map")
      - Number(left.source === "explicit" || left.source === "previous-map");
    if (pinnedDifference !== 0) {
      return pinnedDifference;
    }
    const priorityDifference = right.priority - left.priority;
    return priorityDifference !== 0
      ? priorityDifference
      : left.clusterId.localeCompare(right.clusterId);
  });
  const allocated: NeuralCoreClusterSpatialAnchor[] = [];
  const boundsExhaustedByClusterId: Record<string, true> = {};
  for (const candidate of candidates) {
    const result = resolveAnchorPosition(candidate, allocated, config);
    allocated.push(result.anchor);
    if (result.boundsExhausted) {
      boundsExhaustedByClusterId[result.anchor.clusterId] = true;
    }
  }
  allocated.sort((left, right) => left.clusterId.localeCompare(right.clusterId));
  const validatedDiagnostics = validateNeuralCoreSpatialMapSeparation(allocated, config);
  const conflicts = validatedDiagnostics.conflicts.map((conflict) => {
    const boundsExhausted = boundsExhaustedByClusterId[conflict.clusterId]
      || boundsExhaustedByClusterId[conflict.conflictingClusterId];
    return boundsExhausted && conflict.reason !== "authoritative-overlap"
      ? { ...conflict, reason: "bounds-exhausted" as const }
      : conflict;
  });
  return {
    version: normalizedExplicitMap.version,
    identityKey: createNeuralCoreSpatialIdentityKey(topology, config, explicitMap),
    anchors: allocated,
    diagnostics: {
      conflicts,
      hasUnresolvedConflicts: conflicts.length > 0,
    },
  };
};
