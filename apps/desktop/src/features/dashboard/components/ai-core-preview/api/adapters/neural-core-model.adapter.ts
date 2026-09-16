import type {
  NeuralCoreEntity as InternalNeuralCoreEntity,
  NeuralCoreEntityKind as InternalNeuralCoreEntityKind,
  NeuralCoreGroup as InternalNeuralCoreGroup,
  NeuralCoreMetadata as InternalNeuralCoreMetadata,
  NeuralCoreMetadataValue as InternalNeuralCoreMetadataValue,
  NeuralCoreMode as InternalNeuralCoreMode,
  NeuralCoreSignal as InternalNeuralCoreSignal,
  NeuralCoreSignalKind as InternalNeuralCoreSignalKind,
  NeuralCoreState as InternalNeuralCoreState,
  NeuralCoreStatus as InternalNeuralCoreStatus,
} from "../../domain/contract/neural-core-contract.types";
import { createNeuralCoreTopologyFromState } from "../../domain/topology/neural-core-topology.mapper";
import type { NeuralCoreTopology as InternalNeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type {
  NeuralCoreBuiltInRelationKind,
  NeuralCoreEntity,
  NeuralCoreMetadata,
  NeuralCoreMetadataValue,
  NeuralCoreModel,
  NeuralCoreOperationalStatus,
  NeuralCoreRelationKind,
  NeuralCoreRoute,
  NeuralCoreRouteEndpoint,
  NeuralCoreSemanticKind,
} from "../core/neural-core-model.types";

const isMetadataArray = (
  value: NeuralCoreMetadataValue,
): value is readonly NeuralCoreMetadataValue[] => Array.isArray(value);

const isCustomSemanticKind = (
  kind: NeuralCoreSemanticKind,
): kind is `custom:${string}` => kind.startsWith("custom:");

const isCustomRelationKind = (
  relation: NeuralCoreRelationKind,
): relation is `custom:${string}` => relation.startsWith("custom:");

export interface NeuralCoreModelAdapterResult {
  readonly modelId: string;
  readonly state: InternalNeuralCoreState;
  readonly topology: InternalNeuralCoreTopology;
  readonly internalClusterIdByEntityId: ReadonlyMap<string, string>;
  readonly publicClusterIdByInternalClusterId: ReadonlyMap<string, string>;
}

const mapMetadataValue = (
  value: NeuralCoreMetadataValue,
): InternalNeuralCoreMetadataValue => {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }
  if (isMetadataArray(value)) {
    return value.map(mapMetadataValue);
  }
  const result: InternalNeuralCoreMetadata = {};
  Object.keys(value).sort().forEach((key) => {
    result[key] = mapMetadataValue(value[key]);
  });
  return result;
};

const mapMetadata = (metadata: NeuralCoreMetadata): InternalNeuralCoreMetadata => {
  const result: InternalNeuralCoreMetadata = {};
  Object.keys(metadata).sort().forEach((key) => {
    result[key] = mapMetadataValue(metadata[key]);
  });
  return result;
};

const mapSemanticKind = (
  kind: NeuralCoreSemanticKind,
): InternalNeuralCoreEntityKind => isCustomSemanticKind(kind) ? "custom" : kind;

const mapEntityStatus = (
  status: NeuralCoreOperationalStatus,
): InternalNeuralCoreStatus => {
  switch (status) {
    case "idle": return "neutral";
    case "active":
    case "processing":
    case "recovering": return "active";
    case "success": return "success";
    case "warning": return "warning";
    case "error": return "error";
    case "disabled": return "disabled";
  }
};

const mapRelationToSignalKind = (
  relation: NeuralCoreRelationKind,
): InternalNeuralCoreSignalKind => {
  if (isCustomRelationKind(relation)) return "route";
  const builtInRelation: NeuralCoreBuiltInRelationKind = relation;
  switch (builtInRelation) {
    case "dependency": return "resolve";
    case "data-flow": return "transfer";
    case "request":
    case "event": return "emit";
    case "response": return "receive";
    case "control": return "execute";
    case "association": return "route";
  }
};

const mapRelationToSynapseKind = (
  relation: NeuralCoreRelationKind,
): "excitatory" | "inhibitory" | "modulatory" | "bidirectional" | "relay" => {
  if (isCustomRelationKind(relation)) return "relay";
  switch (relation) {
    case "dependency": return "inhibitory";
    case "data-flow": return "excitatory";
    case "request":
    case "response": return "relay";
    case "event":
    case "control": return "modulatory";
    case "association": return "bidirectional";
  }
};

const mapEndpointId = (endpoint: NeuralCoreRouteEndpoint): string => (
  endpoint.kind === "entity" ? endpoint.entityId : endpoint.clusterId
);

const mapEndpointMetadata = (
  endpoint: NeuralCoreRouteEndpoint,
): InternalNeuralCoreMetadataValue => endpoint.kind === "entity"
  ? { kind: "entity", entityId: endpoint.entityId }
  : { kind: "cluster", clusterId: endpoint.clusterId };

const mapEntity = (
  entity: NeuralCoreEntity,
  model: NeuralCoreModel,
): InternalNeuralCoreEntity => {
  const matchingCluster = model.clusters.find((cluster) => String(cluster.id) === String(entity.id));
  return {
    id: entity.id,
    label: entity.label,
    kind: mapSemanticKind(matchingCluster?.kind ?? entity.kind),
    status: mapEntityStatus(entity.status),
    activity: entity.activity,
    importance: matchingCluster?.importance ?? entity.activity,
    groupId: entity.clusterId !== undefined
      && String(entity.clusterId) === String(entity.id)
      ? undefined
      : entity.clusterId,
    metadata: {
      ...(matchingCluster === undefined ? {} : mapMetadata(matchingCluster.metadata)),
      ...mapMetadata(entity.metadata),
      ...(matchingCluster?.description === undefined
        ? {}
        : { description: matchingCluster.description }),
      ...(matchingCluster?.tags.length ? { tags: [...matchingCluster.tags] } : {}),
      ...(entity.description === undefined ? {} : { description: entity.description }),
    },
  };
};

const mapRouteToSignal = (route: NeuralCoreRoute): InternalNeuralCoreSignal => ({
  id: route.id,
  from: mapEndpointId(route.source),
  to: mapEndpointId(route.target),
  kind: mapRelationToSignalKind(route.relation),
  status: mapEntityStatus(route.status),
  intensity: route.strength,
  progress: 0,
  speed: route.strength,
  metadata: {
    ...mapMetadata(route.metadata),
    synapseId: route.id,
    synapseKind: route.direction === "bidirectional"
      ? "bidirectional"
      : mapRelationToSynapseKind(route.relation),
    weight: route.strength,
    conductivity: route.strength,
    plasticity: 0.5,
    direction: route.direction === "bidirectional" ? "bidirectional" : "forward",
    transmissionDirection: "forward",
    relation: route.relation,
    source: mapEndpointMetadata(route.source),
    target: mapEndpointMetadata(route.target),
    ...(route.label === undefined ? {} : { label: route.label }),
    ...(route.description === undefined ? {} : { description: route.description }),
  },
});

const mapStateMode = (model: NeuralCoreModel): InternalNeuralCoreMode => {
  const statuses = [
    ...model.clusters.map((cluster) => cluster.status),
    ...model.entities.map((entity) => entity.status),
  ];
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warning")) return "warning";
  if (statuses.includes("processing") || statuses.includes("recovering")) return "processing";
  if (statuses.includes("success")) return "success";
  if (statuses.includes("active")) return "observing";
  return "idle";
};

const averageActivity = (model: NeuralCoreModel): number => {
  const values = model.entities.length > 0
    ? model.entities.map((entity) => entity.activity)
    : model.clusters.map((cluster) => cluster.activity);
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
};

export const adaptNeuralCoreModel = (
  model: NeuralCoreModel,
): NeuralCoreModelAdapterResult => {
  const internalClusterIdByEntityId = new Map<string, string>();
  const publicClusterIdByInternalClusterId = new Map<string, string>();
  model.clusters.forEach((cluster) => {
    publicClusterIdByInternalClusterId.set(cluster.id, cluster.id);
  });
  model.entities.forEach((entity) => {
    internalClusterIdByEntityId.set(entity.id, entity.id);
    if (entity.clusterId !== undefined) {
      publicClusterIdByInternalClusterId.set(entity.id, entity.clusterId);
    }
  });

  const entityIds = new Set<string>(model.entities.map((entity) => entity.id));
  const groups: InternalNeuralCoreGroup[] = model.clusters
    .filter((cluster) => !entityIds.has(cluster.id))
    .map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    kind: cluster.kind,
    status: mapEntityStatus(cluster.status),
    activity: cluster.activity,
    metadata: {
      ...mapMetadata(cluster.metadata),
      ...(cluster.description === undefined ? {} : { description: cluster.description }),
      ...(cluster.tags.length === 0 ? {} : { tags: [...cluster.tags] }),
    },
    }));
  const state: InternalNeuralCoreState = {
    mode: mapStateMode(model),
    entities: model.entities.map((entity) => mapEntity(entity, model)),
    signals: model.routes.map(mapRouteToSignal),
    groups,
    globalActivity: averageActivity(model),
    metadata: {
      ...mapMetadata(model.metadata),
      __neuralCorePathways: model.pathways.map((pathway) => ({
        id: pathway.id,
        ...(pathway.label === undefined ? {} : { label: pathway.label }),
        clusterIds: [...pathway.clusterIds],
        synapseIds: [...pathway.routeIds],
        status: pathway.status,
        activity: averageActivity(model),
        metadata: mapMetadata(pathway.metadata),
      })),
    },
  };
  const topology = createNeuralCoreTopologyFromState(state);
  state.topology = topology;

  return Object.freeze({
    modelId: model.id,
    state,
    topology,
    internalClusterIdByEntityId,
    publicClusterIdByInternalClusterId,
  });
};
