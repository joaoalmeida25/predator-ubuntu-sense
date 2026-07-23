import type {
  NeuralCoreGraph,
  NeuralCoreNode,
  NeuralCoreVector3,
} from "../graph/neural-core-graph.types";
import type {
  NeuralCoreCluster,
  NeuralCoreSynapse,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import { normalizeNeuralCoreTopology } from "../../domain/topology/neural-core-topology.utils";
import {
  DEFAULT_NEURAL_CORE_TOPOLOGY_VISUAL_CONFIG,
  EMPTY_NEURAL_CORE_TOPOLOGY_VISUAL_STATE,
  NEURAL_CORE_SYNAPSE_KIND_COLORS,
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "./neural-core-topology-visual.constants";
import type {
  NeuralCoreClusterVisualRegion,
  NeuralCorePathwayVisualRoute,
  NeuralCoreSynapseVisualRoute,
  NeuralCoreTopologyVisualConfig,
  NeuralCoreTopologyVisualConfigInput,
  NeuralCoreTopologyVisualState,
} from "./neural-core-topology-visual.types";
import {
  clampNeuralCoreTopologyVisualValue,
  getNeuralCoreTopologyVisualDistance,
  hashNeuralCoreTopologyVisualId,
  mixNeuralCoreTopologyVisualVector,
} from "./neural-core-topology-visual.utils";
import type {
  NeuralCoreClusterSpatialAnchor,
  NeuralCoreSpatialMap,
} from "../spatial/neural-core-spatial-map.types";

export interface MapNeuralCoreTopologyToVisualStateParams {
  config?: NeuralCoreTopologyVisualConfigInput;
  topology?: NeuralCoreTopology;
  graph: NeuralCoreGraph;
  spatialMap: NeuralCoreSpatialMap;
}

interface NeuralCoreClusterAllocationEntry {
  cluster: NeuralCoreCluster;
  originalIndex: number;
  priority: number;
  anchor: NeuralCoreClusterSpatialAnchor;
}

interface NeuralCoreScoredNode {
  graphIndex: number;
  node: NeuralCoreNode;
  score: number;
}

const MINIMUM_CLUSTER_NODE_COUNT = 18;
const MAXIMUM_CLUSTER_NODE_COUNT = 40;

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

const resolveTopologyVisualConfig = (
  input?: NeuralCoreTopologyVisualConfigInput,
): NeuralCoreTopologyVisualConfig => {
  return {
    maximumClusterOverlapRatio: finiteInRange(
      input?.maximumClusterOverlapRatio,
      DEFAULT_NEURAL_CORE_TOPOLOGY_VISUAL_CONFIG.maximumClusterOverlapRatio,
      0,
      1,
    ),
    minimumClusterSeparation: finiteInRange(
      input?.minimumClusterSeparation,
      DEFAULT_NEURAL_CORE_TOPOLOGY_VISUAL_CONFIG.minimumClusterSeparation,
      0,
      1.4,
    ),
  };
};

const getStatusColor = (
  status: NeuralCoreTopologyStatus,
  fallbackColor: string,
): string => status === "idle" ? fallbackColor : NEURAL_CORE_TOPOLOGY_STATUS_COLORS[status];


const getClusterTargetNodeCount = (cluster: NeuralCoreCluster): number => {
  const targetCount = Math.round(
    MINIMUM_CLUSTER_NODE_COUNT
    + clampNeuralCoreTopologyVisualValue(cluster.activity) * 12
    + clampNeuralCoreTopologyVisualValue(cluster.importance) * 10,
  );
  return Math.min(MAXIMUM_CLUSTER_NODE_COUNT, Math.max(MINIMUM_CLUSTER_NODE_COUNT, targetCount));
};

const createScoredNodeCandidates = (
  cluster: NeuralCoreCluster,
  graph: NeuralCoreGraph,
  targetCenter: NeuralCoreVector3,
): NeuralCoreScoredNode[] => {
  const hash = hashNeuralCoreTopologyVisualId(cluster.id);
  return graph.nodes
    .map((node, graphIndex) => {
      const deterministicTiebreaker = (((hash + node.id * 97) & 255) / 255) * 0.08;
      const hubAffinity = node.kind === "hub" || node.kind === "core" ? -0.035 : 0;
      return {
        graphIndex,
        node,
        score: getNeuralCoreTopologyVisualDistance(node.position, targetCenter)
          + deterministicTiebreaker
          + hubAffinity,
      };
    })
    .sort((left, right) => {
      const scoreDifference = left.score - right.score;
      return scoreDifference === 0 ? left.node.id - right.node.id : scoreDifference;
    });
};

const selectNodesForCluster = (
  cluster: NeuralCoreCluster,
  graph: NeuralCoreGraph,
  targetCenter: NeuralCoreVector3,
  occupiedNodeIds: Uint8Array,
  maximumOverlapRatio: number,
): NeuralCoreNode[] => {
  const targetCount = Math.min(graph.nodes.length, getClusterTargetNodeCount(cluster));
  const maximumOverlapCount = Math.floor(targetCount * maximumOverlapRatio);
  const minimumUniqueCount = targetCount - maximumOverlapCount;
  const candidates = createScoredNodeCandidates(cluster, graph, targetCenter);
  const selectedGraphIndices = new Set<number>();
  const selectedNodes: NeuralCoreNode[] = [];

  for (const candidate of candidates) {
    if (selectedNodes.length >= minimumUniqueCount) {
      break;
    }
    if (occupiedNodeIds[candidate.graphIndex] !== 0) {
      continue;
    }

    selectedGraphIndices.add(candidate.graphIndex);
    selectedNodes.push(candidate.node);
  }

  let overlapCount = 0;
  for (const candidate of candidates) {
    if (selectedNodes.length >= targetCount) {
      break;
    }
    if (selectedGraphIndices.has(candidate.graphIndex)) {
      continue;
    }

    const isOverlapping = occupiedNodeIds[candidate.graphIndex] !== 0;
    if (isOverlapping && overlapCount >= maximumOverlapCount) {
      continue;
    }

    selectedGraphIndices.add(candidate.graphIndex);
    selectedNodes.push(candidate.node);
    if (isOverlapping) {
      overlapCount += 1;
    }
  }

  for (const graphIndex of selectedGraphIndices) {
    occupiedNodeIds[graphIndex] = Math.min(255, occupiedNodeIds[graphIndex] + 1);
  }

  return selectedNodes;
};

const mapClusterToVisualRegion = (
  cluster: NeuralCoreCluster,
  graph: NeuralCoreGraph,
  occupiedNodeIds: Uint8Array,
  anchor: NeuralCoreClusterSpatialAnchor,
  config: NeuralCoreTopologyVisualConfig,
): NeuralCoreClusterVisualRegion => {
  const targetCenter = anchor.normalizedPosition;
  const selectedNodes = selectNodesForCluster(
    cluster,
    graph,
    targetCenter,
    occupiedNodeIds,
    config.maximumClusterOverlapRatio,
  );
  const center: NeuralCoreVector3 = [...targetCenter];
  let radius = 0.24;
  for (const node of selectedNodes) {
    radius = Math.max(
      radius,
      getNeuralCoreTopologyVisualDistance(node.position, center),
    );
  }
  return {
    clusterId: cluster.id,
    center,
    radius: Math.min(0.62, Math.max(anchor.radius, radius)),
    nodeIndices: selectedNodes
      .filter(({ kind }) => kind !== "hub" && kind !== "core")
      .map(({ id }) => id),
    hubIndices: selectedNodes
      .filter(({ kind }) => kind === "hub" || kind === "core")
      .map(({ id }) => id),
  };
};

const createClusterAllocationOrder = (
  clusters: readonly NeuralCoreCluster[],
  anchorsByClusterId: Readonly<Record<string, NeuralCoreClusterSpatialAnchor>>,
): NeuralCoreClusterAllocationEntry[] => {
  return clusters
    .map((cluster, originalIndex) => {
      const anchor = anchorsByClusterId[cluster.id];
      return anchor ? {
        cluster,
        originalIndex,
        priority: anchor.priority,
        anchor,
      } : undefined;
    })
    .filter((entry): entry is NeuralCoreClusterAllocationEntry => entry !== undefined)
    .sort((left, right) => {
      const priorityDifference = right.priority - left.priority;
      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const idDifference = left.cluster.id.localeCompare(right.cluster.id);
      return idDifference === 0 ? left.originalIndex - right.originalIndex : idDifference;
    });
};

const createRouteControlPoints = (
  start: NeuralCoreVector3,
  end: NeuralCoreVector3,
  synapseId: string,
): NeuralCoreVector3[] => {
  const midpoint = mixNeuralCoreTopologyVisualVector(start, end, 0.5);
  const hash = hashNeuralCoreTopologyVisualId(synapseId);
  const arcLift = 0.1 + ((hash & 63) / 63) * 0.18;
  const lateral = ((((hash >> 8) & 127) / 127) - 0.5) * 0.22;
  return [[midpoint[0] + lateral, midpoint[1] + arcLift, midpoint[2] - lateral * 0.42]];
};

const mapSynapseToVisualRoute = (
  synapse: NeuralCoreSynapse,
  regionsByClusterId: ReadonlyMap<string, NeuralCoreClusterVisualRegion>,
  topologyStatus?: NeuralCoreTopologyStatus,
): NeuralCoreSynapseVisualRoute | undefined => {
  const fromRegion = regionsByClusterId.get(synapse.fromClusterId);
  const toRegion = regionsByClusterId.get(synapse.toClusterId);
  if (!fromRegion || !toRegion) {
    return undefined;
  }
  const status = synapse.status ?? topologyStatus ?? "idle";
  return {
    synapseId: synapse.id,
    fromClusterId: synapse.fromClusterId,
    toClusterId: synapse.toClusterId,
    start: fromRegion.center,
    end: toRegion.center,
    controlPoints: createRouteControlPoints(fromRegion.center, toRegion.center, synapse.id),
    color: getStatusColor(status, NEURAL_CORE_SYNAPSE_KIND_COLORS[synapse.kind]),
  };
};

const createPathwayVisualRoutes = (
  topology: NeuralCoreTopology,
  regionsByClusterId: ReadonlyMap<string, NeuralCoreClusterVisualRegion>,
  routesBySynapseId: ReadonlyMap<string, NeuralCoreSynapseVisualRoute>,
): NeuralCorePathwayVisualRoute[] => {
  return (topology.pathways ?? []).map((pathway) => ({
    pathwayId: pathway.id,
    clusterIds: pathway.clusterIds.filter((clusterId) => regionsByClusterId.has(clusterId)),
    synapseIds: pathway.synapseIds.filter((synapseId) => routesBySynapseId.has(synapseId)),
  }));
};

const createTopologyVisualLookups = (
  clusterRegions: readonly NeuralCoreClusterVisualRegion[],
  synapseRoutes: readonly NeuralCoreSynapseVisualRoute[],
  pathwayRoutes: readonly NeuralCorePathwayVisualRoute[],
): NeuralCoreTopologyVisualState["lookups"] => {
  const clusterRegionById: Record<string, NeuralCoreClusterVisualRegion> = {};
  const neighborClusterIdsByClusterId: Record<string, string[]> = {};
  const pathwayRouteById: Record<string, NeuralCorePathwayVisualRoute> = {};
  const synapseIdsByClusterId: Record<string, string[]> = {};
  const synapseRouteById: Record<string, NeuralCoreSynapseVisualRoute> = {};
  for (const region of clusterRegions) {
    clusterRegionById[region.clusterId] = region;
    neighborClusterIdsByClusterId[region.clusterId] = [];
    synapseIdsByClusterId[region.clusterId] = [];
  }
  for (const route of synapseRoutes) {
    synapseRouteById[route.synapseId] = route;
    synapseIdsByClusterId[route.fromClusterId]?.push(route.synapseId);
    synapseIdsByClusterId[route.toClusterId]?.push(route.synapseId);
    const fromNeighbors = neighborClusterIdsByClusterId[route.fromClusterId];
    const toNeighbors = neighborClusterIdsByClusterId[route.toClusterId];
    if (fromNeighbors && !fromNeighbors.includes(route.toClusterId)) {
      fromNeighbors.push(route.toClusterId);
    }
    if (toNeighbors && !toNeighbors.includes(route.fromClusterId)) {
      toNeighbors.push(route.fromClusterId);
    }
  }
  for (const pathway of pathwayRoutes) {
    pathwayRouteById[pathway.pathwayId] = pathway;
  }
  return {
    clusterRegionById,
    neighborClusterIdsByClusterId,
    pathwayRouteById,
    synapseIdsByClusterId,
    synapseRouteById,
  };
};

export const mapNeuralCoreTopologyToVisualState = ({
  config: configInput,
  topology,
  graph,
  spatialMap,
}: MapNeuralCoreTopologyToVisualStateParams): NeuralCoreTopologyVisualState => {
  const normalized = normalizeNeuralCoreTopology(topology);
  if (normalized.clusters.length === 0 || graph.nodes.length === 0) {
    return EMPTY_NEURAL_CORE_TOPOLOGY_VISUAL_STATE;
  }
  const config = resolveTopologyVisualConfig(configInput);
  const occupiedNodeIds = new Uint8Array(graph.nodes.length);
  const clusterRegions = new Array<NeuralCoreClusterVisualRegion>(normalized.clusters.length);
  const anchorsByClusterId: Record<string, NeuralCoreClusterSpatialAnchor> = {};
  for (const anchor of spatialMap.anchors) {
    anchorsByClusterId[anchor.clusterId] = anchor;
  }

  for (const allocation of createClusterAllocationOrder(normalized.clusters, anchorsByClusterId)) {
    const region = mapClusterToVisualRegion(
      allocation.cluster,
      graph,
      occupiedNodeIds,
      allocation.anchor,
      config,
    );
    clusterRegions[allocation.originalIndex] = region;
  }

  const regionsByClusterId = new Map(
    clusterRegions.map((region) => [region.clusterId, region]),
  );
  const synapseRoutes = normalized.synapses
    .map((synapse) => mapSynapseToVisualRoute(synapse, regionsByClusterId, normalized.status))
    .filter((route): route is NeuralCoreSynapseVisualRoute => route !== undefined);
  const routesBySynapseId = new Map(
    synapseRoutes.map((route) => [route.synapseId, route]),
  );
  const pathwayRoutes = createPathwayVisualRoutes(
    normalized,
    regionsByClusterId,
    routesBySynapseId,
  );
  return {
    clusterRegions,
    synapseRoutes,
    pathwayRoutes,
    lookups: createTopologyVisualLookups(clusterRegions, synapseRoutes, pathwayRoutes),
  };
};
