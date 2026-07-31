import type {
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";
import {
  NEURAL_CORE_SYNAPSE_KIND_COLORS,
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "../topology/neural-core-topology-visual.constants";
import type {
  NeuralCoreTopologyVisualState,
} from "../topology/neural-core-topology-visual.types";
import { hashNeuralCoreTopologyVisualId } from "../topology/neural-core-topology-visual.utils";
import type {
  NeuralCoreAggregatedRoute,
  NeuralCoreAggregatedRouteDirection,
} from "./neural-core-cluster-grammar.types";

interface NeuralCoreAggregatedRouteGroup {
  id: string;
  sourceClusterId: string;
  targetClusterId: string;
  direction: NeuralCoreAggregatedRouteDirection;
  synapses: NeuralCoreSynapse[];
  pathwayIds: string[];
}

const STATUS_PRIORITY: Record<NeuralCoreTopologyStatus, number> = {
  disabled: 0,
  idle: 1,
  success: 2,
  active: 3,
  processing: 4,
  warning: 5,
  error: 6,
};

const normalizedValue = (value: number | undefined): number => (
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0
);

const resolveDirection = (
  synapse: NeuralCoreSynapse,
): NeuralCoreAggregatedRouteDirection => synapse.direction
  ?? (synapse.kind === "bidirectional" ? "bidirectional" : "forward");

const getRouteGroupId = (synapse: NeuralCoreSynapse): string => {
  return [
    synapse.fromClusterId,
    synapse.toClusterId,
    resolveDirection(synapse),
    synapse.kind,
  ].join(":");
};

const getDominantStatus = (
  group: NeuralCoreAggregatedRouteGroup,
  pathwayById: ReadonlyMap<string, NeuralCorePathway>,
  fallback: NeuralCoreTopologyStatus,
): NeuralCoreTopologyStatus => {
  let status = fallback;
  let priority = STATUS_PRIORITY[status];
  for (const synapse of group.synapses) {
    const candidate = synapse.status ?? fallback;
    if (STATUS_PRIORITY[candidate] > priority) {
      status = candidate;
      priority = STATUS_PRIORITY[candidate];
    }
  }
  for (const pathwayId of group.pathwayIds) {
    const candidate = pathwayById.get(pathwayId)?.status;
    if (candidate && STATUS_PRIORITY[candidate] > priority) {
      status = candidate;
      priority = STATUS_PRIORITY[candidate];
    }
  }
  return status;
};

const normalizeVector = (vector: NeuralCoreVector3): NeuralCoreVector3 => {
  const length = Math.max(0.0001, Math.hypot(vector[0], vector[1], vector[2]));
  return [vector[0] / length, vector[1] / length, vector[2] / length];
};

const createControlPoints = (
  groupId: string,
  sourceCenter: NeuralCoreVector3,
  targetCenter: NeuralCoreVector3,
  sourceRadius: number,
  targetRadius: number,
  globalCenter: NeuralCoreVector3,
): readonly NeuralCoreVector3[] => {
  const direction = normalizeVector([
    targetCenter[0] - sourceCenter[0],
    targetCenter[1] - sourceCenter[1],
    targetCenter[2] - sourceCenter[2],
  ]);
  const sourceAnchor: NeuralCoreVector3 = [...sourceCenter];
  const targetAnchor: NeuralCoreVector3 = [...targetCenter];
  const hash = hashNeuralCoreTopologyVisualId(groupId);
  const stableSide = (((hash >> 7) & 255) / 255 - 0.5) * 0.22;
  const stableLift = 0.1 + ((hash & 127) / 127) * 0.14;
  const midpoint: NeuralCoreVector3 = [
    (sourceCenter[0] + targetCenter[0]) * 0.5,
    (sourceCenter[1] + targetCenter[1]) * 0.5,
    (sourceCenter[2] + targetCenter[2]) * 0.5,
  ];
  const outward = normalizeVector([
    midpoint[0] - globalCenter[0] + stableSide,
    midpoint[1] - globalCenter[1] + stableLift,
    midpoint[2] - globalCenter[2] - stableSide * 0.5,
  ]);
  const distance = Math.hypot(
    targetCenter[0] - sourceCenter[0],
    targetCenter[1] - sourceCenter[1],
    targetCenter[2] - sourceCenter[2],
  );
  const corridorOffset = Math.min(0.42, 0.1 + distance * 0.13);
  return [
    sourceAnchor,
    [
      sourceAnchor[0] + direction[0] * sourceRadius * 0.72 + outward[0] * 0.05,
      sourceAnchor[1] + direction[1] * sourceRadius * 0.72 + outward[1] * 0.05,
      sourceAnchor[2] + direction[2] * sourceRadius * 0.72 + outward[2] * 0.05,
    ],
    [
      midpoint[0] + outward[0] * corridorOffset,
      midpoint[1] + outward[1] * corridorOffset,
      midpoint[2] + outward[2] * corridorOffset,
    ],
    [
      targetAnchor[0] - direction[0] * targetRadius * 0.72 + outward[0] * 0.05,
      targetAnchor[1] - direction[1] * targetRadius * 0.72 + outward[1] * 0.05,
      targetAnchor[2] - direction[2] * targetRadius * 0.72 + outward[2] * 0.05,
    ],
    targetAnchor,
  ];
};

const createGroups = (topology: NeuralCoreTopology): NeuralCoreAggregatedRouteGroup[] => {
  const pathwayIdsBySynapseId = new Map<string, string[]>();
  for (const pathway of topology.pathways ?? []) {
    for (const synapseId of pathway.synapseIds) {
      const pathwayIds = pathwayIdsBySynapseId.get(synapseId) ?? [];
      pathwayIds.push(pathway.id);
      pathwayIdsBySynapseId.set(synapseId, pathwayIds);
    }
  }
  const groupById = new Map<string, NeuralCoreAggregatedRouteGroup>();
  for (const synapse of topology.synapses) {
    if (synapse.fromClusterId === synapse.toClusterId) {
      continue;
    }
    const id = getRouteGroupId(synapse);
    let group = groupById.get(id);
    if (!group) {
      group = {
        id,
        sourceClusterId: synapse.fromClusterId,
        targetClusterId: synapse.toClusterId,
        direction: resolveDirection(synapse),
        synapses: [],
        pathwayIds: [],
      };
      groupById.set(id, group);
    }
    group.synapses.push(synapse);
    for (const pathwayId of pathwayIdsBySynapseId.get(synapse.id) ?? []) {
      if (!group.pathwayIds.includes(pathwayId)) {
        group.pathwayIds.push(pathwayId);
      }
    }
  }
  return [...groupById.values()].sort((left, right) => left.id.localeCompare(right.id));
};

export const mapNeuralCoreAggregatedRoutes = (
  topology: NeuralCoreTopology,
  topologyVisualState: NeuralCoreTopologyVisualState,
): NeuralCoreAggregatedRoute[] => {
  if (topologyVisualState.clusterRegions.length === 0) {
    return [];
  }
  const globalCenter: NeuralCoreVector3 = [0, 0, 0];
  for (const region of topologyVisualState.clusterRegions) {
    globalCenter[0] += region.center[0];
    globalCenter[1] += region.center[1];
    globalCenter[2] += region.center[2];
  }
  globalCenter[0] /= topologyVisualState.clusterRegions.length;
  globalCenter[1] /= topologyVisualState.clusterRegions.length;
  globalCenter[2] /= topologyVisualState.clusterRegions.length;
  const pathwayById = new Map((topology.pathways ?? []).map((pathway) => [
    pathway.id,
    pathway,
  ]));
  const clusterById = new Map(topology.clusters.map((cluster) => [cluster.id, cluster]));
  return createGroups(topology).flatMap((group) => {
    const source = topologyVisualState.lookups.clusterRegionById[group.sourceClusterId];
    const target = topologyVisualState.lookups.clusterRegionById[group.targetClusterId];
    if (!source || !target) {
      return [];
    }
    const controlPoints = createControlPoints(
      group.id,
      source.center,
      target.center,
      source.radius,
      target.radius,
      globalCenter,
    );
    let activity = 0;
    let communicationWeight = 0;
    for (const synapse of group.synapses) {
      activity = Math.max(
        activity,
        normalizedValue(synapse.conductivity),
        normalizedValue(synapse.weight),
      );
      communicationWeight += 0.6
        + normalizedValue(synapse.weight)
        + normalizedValue(synapse.conductivity);
    }
    for (const pathwayId of group.pathwayIds) {
      activity = Math.max(activity, normalizedValue(pathwayById.get(pathwayId)?.activity));
    }
    activity = Math.max(
      activity,
      normalizedValue(clusterById.get(group.sourceClusterId)?.activity) * 0.7,
      normalizedValue(clusterById.get(group.targetClusterId)?.activity) * 0.7,
    );
    const status = getDominantStatus(group, pathwayById, topology.status ?? "idle");
    const firstSynapse = group.synapses[0];
    return [{
      id: group.id,
      sourceClusterId: group.sourceClusterId,
      targetClusterId: group.targetClusterId,
      synapseIds: group.synapses.map((synapse) => synapse.id).sort(),
      pathwayIds: [...group.pathwayIds].sort(),
      activity,
      status,
      direction: group.direction,
      sourceAnchor: [...controlPoints[0]],
      targetAnchor: [...controlPoints[controlPoints.length - 1]],
      controlPoints,
      color: status === "idle"
        ? NEURAL_CORE_SYNAPSE_KIND_COLORS[firstSynapse.kind]
        : NEURAL_CORE_TOPOLOGY_STATUS_COLORS[status],
      communicationWeight,
    }];
  });
};
