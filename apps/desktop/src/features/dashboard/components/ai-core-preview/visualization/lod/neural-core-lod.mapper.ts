import type {
  NeuralCoreCluster,
  NeuralCoreTopology,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import type { NeuralCoreSpatialMap } from "../spatial/neural-core-spatial-map.types";
import { getNeuralCoreSpatialDistance } from "../spatial/neural-core-spatial-map.utils";
import {
  EMPTY_NEURAL_CORE_LOD_STATE,
  NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL,
} from "./neural-core-lod.constants";
import type {
  NeuralCoreClusterLodState,
  NeuralCoreDetailLevel,
  NeuralCoreLodConfigInput,
  NeuralCoreLodState,
} from "./neural-core-lod.types";
import {
  calculateNeuralCoreClusterLodPriority,
  isNeuralCoreClusterCritical,
  resolveNeuralCoreLodConfig,
} from "./neural-core-lod.utils";

export interface MapNeuralCoreLodStateParams {
  topology: NeuralCoreTopology;
  spatialMap: NeuralCoreSpatialMap;
  /**
   * Camera position expressed in the same normalized local coordinate space
   * used by NeuralCoreSpatialMap anchors.
   */
  cameraLocalPosition: NeuralCoreVector3;
  focusedClusterIds?: readonly string[];
  protagonistClusterId?: string;
  config?: NeuralCoreLodConfigInput;
}

export interface ApplyNeuralCoreLodLimitsParams {
  lodState: NeuralCoreLodState;
  protagonistClusterId?: string;
  config?: NeuralCoreLodConfigInput;
}

interface NeuralCoreLodCandidate {
  cluster: NeuralCoreCluster;
  distanceToCamera: number;
  isFocused: boolean;
  isCritical: boolean;
  priority: number;
  requestedLevel: NeuralCoreDetailLevel;
}

const compareLodPriority = (
  left: NeuralCoreClusterLodState,
  right: NeuralCoreClusterLodState,
  protagonistClusterId?: string,
): number => {
  const focusedDifference = Number(right.isFocused) - Number(left.isFocused);
  if (focusedDifference !== 0) {
    return focusedDifference;
  }
  const criticalDifference = Number(right.isCritical) - Number(left.isCritical);
  if (criticalDifference !== 0) {
    return criticalDifference;
  }
  const protagonistDifference = Number(right.clusterId === protagonistClusterId)
    - Number(left.clusterId === protagonistClusterId);
  if (protagonistDifference !== 0) {
    return protagonistDifference;
  }
  const priorityDifference = right.priority - left.priority;
  return priorityDifference !== 0
    ? priorityDifference
    : left.clusterId.localeCompare(right.clusterId);
};

export const applyNeuralCoreLodLimits = ({
  lodState,
  protagonistClusterId,
  config: configInput,
}: ApplyNeuralCoreLodLimitsParams): NeuralCoreLodState => {
  const config = resolveNeuralCoreLodConfig(configInput);
  if (!lodState.enabled || !config.enabled) {
    return EMPTY_NEURAL_CORE_LOD_STATE;
  }
  const ordered = [...lodState.clusters].sort((left, right) => {
    return compareLodPriority(left, right, protagonistClusterId);
  });
  let detailCount = 0;
  let summaryCount = 0;
  let overviewCount = 0;
  const clusters: NeuralCoreClusterLodState[] = [];
  const visibleClusterIds: string[] = [];
  for (const cluster of ordered) {
    let level = cluster.level;
    let visible = true;
    if (level === "detail") {
      if (detailCount >= config.limits.maximumDetailClusters) {
        level = "summary";
      } else {
        detailCount += 1;
      }
    }
    if (level === "summary") {
      if (summaryCount >= config.limits.maximumSummaryClusters) {
        level = "overview";
      } else {
        summaryCount += 1;
      }
    }
    if (level === "overview") {
      visible = overviewCount < config.limits.maximumOverviewClusters;
      if (visible) {
        overviewCount += 1;
      }
    }
    clusters.push({
      ...cluster,
      level,
      visibility: { ...NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL[level] },
    });
    if (visible) {
      visibleClusterIds.push(cluster.clusterId);
    }
  }
  clusters.sort((left, right) => left.clusterId.localeCompare(right.clusterId));
  visibleClusterIds.sort((left, right) => left.localeCompare(right));
  return { enabled: true, clusters, visibleClusterIds };
};

export const mapNeuralCoreLodState = ({
  topology,
  spatialMap,
  cameraLocalPosition,
  focusedClusterIds = [],
  protagonistClusterId,
  config: configInput,
}: MapNeuralCoreLodStateParams): NeuralCoreLodState => {
  const config = resolveNeuralCoreLodConfig(configInput);
  if (!config.enabled) {
    return EMPTY_NEURAL_CORE_LOD_STATE;
  }
  if (topology.clusters.length === 0 || spatialMap.anchors.length === 0) {
    return { enabled: true, clusters: [], visibleClusterIds: [] };
  }
  const focusedById: Record<string, true> = {};
  const anchorById: Record<string, NeuralCoreSpatialMap["anchors"][number]> = {};
  const candidateClusterIds: Record<string, true> = {};
  for (const id of focusedClusterIds) {
    focusedById[id] = true;
  }
  for (const anchor of spatialMap.anchors) {
    anchorById[anchor.clusterId] = anchor;
  }
  const candidates: NeuralCoreLodCandidate[] = [];
  for (const cluster of topology.clusters) {
    if (candidateClusterIds[cluster.id]) {
      continue;
    }
    candidateClusterIds[cluster.id] = true;
    const anchor = anchorById[cluster.id];
    if (!anchor) {
      continue;
    }
    const distanceToCamera = getNeuralCoreSpatialDistance(
      anchor.normalizedPosition,
      cameraLocalPosition,
    );
    const isFocused = focusedById[cluster.id] === true;
    const isCritical = isNeuralCoreClusterCritical(cluster);
    const isProtagonist = cluster.id === protagonistClusterId;
    const requestedLevel: NeuralCoreDetailLevel = isFocused || isProtagonist
      || distanceToCamera <= config.distance.detailMaximum
      ? "detail"
      : distanceToCamera <= config.distance.summaryMaximum ? "summary" : "overview";
    candidates.push({
      cluster,
      distanceToCamera,
      isFocused,
      isCritical,
      priority: calculateNeuralCoreClusterLodPriority(
        cluster,
        { isFocused, distanceToCamera },
        config,
      ),
      requestedLevel,
    });
  }
  const clusters: NeuralCoreClusterLodState[] = [];
  for (const candidate of candidates) {
    const state: NeuralCoreClusterLodState = {
      clusterId: candidate.cluster.id,
      level: candidate.requestedLevel,
      priority: candidate.priority,
      distanceToCamera: candidate.distanceToCamera,
      isFocused: candidate.isFocused,
      isCritical: candidate.isCritical,
      visibility: { ...NEURAL_CORE_LOD_VISIBILITY_BY_LEVEL[candidate.requestedLevel] },
    };
    clusters.push(state);
  }
  clusters.sort((left, right) => left.clusterId.localeCompare(right.clusterId));
  return applyNeuralCoreLodLimits({
    lodState: { enabled: true, clusters, visibleClusterIds: [] },
    protagonistClusterId,
    config,
  });
};
