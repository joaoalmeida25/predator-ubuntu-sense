import type {
  NeuralCoreCluster,
  NeuralCoreTopology,
} from "../../domain/topology/neural-core-topology.types";
import {
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "../topology/neural-core-topology-visual.constants";
import type {
  NeuralCoreClusterVisualRegion,
  NeuralCoreTopologyVisualState,
} from "../topology/neural-core-topology-visual.types";
import { hashNeuralCoreTopologyVisualId } from "../topology/neural-core-topology-visual.utils";
import type {
  NeuralCoreGraph,
  NeuralCoreNode,
  NeuralCoreVector3,
} from "../graph/neural-core-graph.types";
import type {
  NeuralCoreClusterTerritory,
} from "./neural-core-cluster-grammar.types";

const normalizedValue = (value: number | undefined): number => (
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0
);

const getTerritoryColor = (
  cluster: NeuralCoreCluster,
  status: NonNullable<NeuralCoreCluster["status"]>,
): string => {
  if (status !== "idle") {
    return NEURAL_CORE_TOPOLOGY_STATUS_COLORS[status];
  }
  switch (cluster.kind) {
    case "memory":
    case "storage":
    case "database":
    case "cache":
      return "#8a6dff";
    case "input":
    case "gateway":
    case "api":
    case "queue":
      return "#26d9ff";
    case "output":
    case "event":
      return "#48dfa0";
    case "decision":
    case "model":
    case "agent":
      return "#b184ff";
    case "external-service":
      return "#f3ad42";
    default:
      return "#4d8dff";
  }
};

const clampExtent = (value: number, regionRadius: number): number => {
  return Math.min(regionRadius * 1.04, Math.max(regionRadius * 0.34, value * 1.08));
};

const createBoundaryPoints = (
  clusterId: string,
): { points: Float32Array; seeds: Float32Array } => {
  const maximumPointCount = 52;
  const includedIndices: number[] = [];
  for (let index = 0; index < maximumPointCount; index += 1) {
    const hash = hashNeuralCoreTopologyVisualId(`${clusterId}:boundary:${index}`);
    if ((hash & 255) / 255 > 0.24) {
      includedIndices.push(index);
    }
  }
  const points = new Float32Array(includedIndices.length * 3);
  const seeds = new Float32Array(includedIndices.length);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  includedIndices.forEach((sampleIndex, pointIndex): void => {
    const normalized = (sampleIndex + 0.5) / maximumPointCount;
    const vertical = 1 - normalized * 2;
    const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    const angle = sampleIndex * goldenAngle;
    const offset = pointIndex * 3;
    points[offset] = Math.cos(angle) * radial;
    points[offset + 1] = vertical;
    points[offset + 2] = Math.sin(angle) * radial;
    seeds[pointIndex] = hashNeuralCoreTopologyVisualId(
      `${clusterId}:boundary-seed:${sampleIndex}`,
    ) / 4294967295;
  });
  return { points, seeds };
};

const createHubFilamentPositions = (
  center: NeuralCoreVector3,
  nodes: readonly NeuralCoreNode[],
): Float32Array => {
  const filamentCount = Math.min(7, nodes.length);
  const positions = new Float32Array(filamentCount * 6);
  for (let index = 0; index < filamentCount; index += 1) {
    const node = nodes[Math.floor(index * nodes.length / filamentCount)];
    const offset = index * 6;
    positions[offset] = 0;
    positions[offset + 1] = 0;
    positions[offset + 2] = 0;
    positions[offset + 3] = (node.position[0] - center[0]) * 0.62;
    positions[offset + 4] = (node.position[1] - center[1]) * 0.62;
    positions[offset + 5] = (node.position[2] - center[2]) * 0.62;
  }
  return positions;
};

const mapClusterToTerritory = (
  cluster: NeuralCoreCluster,
  region: NeuralCoreClusterVisualRegion,
  topology: NeuralCoreTopology,
  nodeById: ReadonlyMap<number, NeuralCoreNode>,
): NeuralCoreClusterTerritory => {
  const hash = hashNeuralCoreTopologyVisualId(cluster.id);
  const clusterNodes = [...region.nodeIndices, ...region.hubIndices]
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is NeuralCoreNode => node !== undefined);
  let extentX = region.radius * 0.34;
  let extentY = region.radius * 0.34;
  let extentZ = region.radius * 0.34;
  for (const node of clusterNodes) {
    extentX = Math.max(extentX, Math.abs(node.position[0] - region.center[0]));
    extentY = Math.max(extentY, Math.abs(node.position[1] - region.center[1]));
    extentZ = Math.max(extentZ, Math.abs(node.position[2] - region.center[2]));
  }
  const horizontalVariation = 0.94 + ((hash & 255) / 255) * 0.12;
  const verticalVariation = 0.9 + (((hash >> 8) & 255) / 255) * 0.1;
  const depthVariation = 0.92 + (((hash >> 16) & 255) / 255) * 0.1;
  const boundary = createBoundaryPoints(cluster.id);
  const activity = normalizedValue(cluster.activity);
  const status = cluster.status ?? topology.status ?? "idle";
  return {
    clusterId: cluster.id,
    center: [...region.center],
    boundaryScale: [
      clampExtent(extentX, region.radius) * horizontalVariation,
      clampExtent(extentY, region.radius) * verticalVariation,
      clampExtent(extentZ, region.radius) * depthVariation,
    ],
    legacyBoundaryScale: [
      region.radius * (0.88 + ((hash & 255) / 255) * 0.24),
      region.radius * (0.72 + (((hash >> 8) & 255) / 255) * 0.2),
      region.radius * (0.82 + (((hash >> 16) & 255) / 255) * 0.2),
    ],
    boundaryPoints: boundary.points,
    boundarySeeds: boundary.seeds,
    hubFilamentPositions: createHubFilamentPositions(region.center, clusterNodes),
    radius: region.radius,
    color: getTerritoryColor(cluster, status),
    status,
    activity,
    priority: normalizedValue(cluster.importance) * 2
      + normalizedValue(cluster.positionHint?.priority)
      + activity,
    nodeIds: [...region.nodeIndices],
    hubNodeIds: [...region.hubIndices],
  };
};

export const mapNeuralCoreClusterTerritories = (
  topology: NeuralCoreTopology,
  topologyVisualState: NeuralCoreTopologyVisualState,
  graph: NeuralCoreGraph,
): NeuralCoreClusterTerritory[] => {
  const clusterById = new Map(topology.clusters.map((cluster) => [cluster.id, cluster]));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return topologyVisualState.clusterRegions
    .flatMap((region) => {
      const cluster = clusterById.get(region.clusterId);
      return cluster ? [mapClusterToTerritory(cluster, region, topology, nodeById)] : [];
    })
    .sort((left, right) => left.clusterId.localeCompare(right.clusterId));
};
