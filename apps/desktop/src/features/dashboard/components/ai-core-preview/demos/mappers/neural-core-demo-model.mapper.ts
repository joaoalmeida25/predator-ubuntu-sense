import type {
  NeuralCoreClusterInput,
  NeuralCoreEntityInput,
  NeuralCoreModelInput,
  NeuralCoreOperationalStatus,
  NeuralCoreRelationKind,
  NeuralCoreRouteEndpointInput,
  NeuralCoreRouteInput,
  NeuralCoreSemanticKind,
} from "../../api";
import type { NeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.types";
import type { NeuralCoreNarrative } from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreState } from "../../domain/contract/neural-core-contract.types";
import type {
  NeuralCoreClusterKind,
  NeuralCoreSynapseKind,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreSceneDirectionTimeline } from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCorePresentationBinding } from "../../domain/presentation/neural-core-presentation-binding.types";
import type { NeuralCoreTopologyCompatibilityData } from "../../domain/topology/neural-core-topology-compatibility.types";

const mapStatus = (
  status: NeuralCoreTopologyStatus | undefined,
): NeuralCoreOperationalStatus => status ?? "idle";

const mapEntityStatus = (
  status: NeuralCoreState["entities"][number]["status"],
): NeuralCoreOperationalStatus => {
  switch (status) {
    case "neutral":
    case undefined:
      return "idle";
    case "active":
      return "active";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "disabled":
      return "disabled";
  }
};

const mapSemanticKind = (
  kind: NeuralCoreClusterKind,
): NeuralCoreSemanticKind => kind === "custom" ? "custom:internal" : kind;

const mapRelation = (kind: NeuralCoreSynapseKind): NeuralCoreRelationKind => {
  switch (kind) {
    case "excitatory":
      return "data-flow";
    case "inhibitory":
      return "dependency";
    case "modulatory":
      return "control";
    case "relay":
      return "request";
    case "bidirectional":
      return "association";
  }
};

const findEntityClusterId = (
  entityId: string,
  topology: NeuralCoreTopology | undefined,
): string | undefined => topology?.clusters.find((cluster) => (
  cluster.entityIds?.includes(entityId)
))?.id;

const mapEntity = (
  entity: NeuralCoreState["entities"][number],
  topology: NeuralCoreTopology | undefined,
): NeuralCoreEntityInput => ({
  id: entity.id,
  label: entity.label ?? entity.id,
  clusterId: entity.groupId ?? findEntityClusterId(entity.id, topology),
  kind: entity.kind === "custom" ? "custom:internal" : entity.kind,
  status: mapEntityStatus(entity.status),
  activity: entity.activity,
  metadata: entity.metadata,
});

const mapCluster = (
  cluster: NeuralCoreTopology["clusters"][number],
): NeuralCoreClusterInput => ({
  id: cluster.id,
  label: cluster.label,
  description: cluster.semanticContext?.description,
  kind: mapSemanticKind(cluster.kind),
  status: mapStatus(cluster.status),
  activity: cluster.activity,
  importance: cluster.importance,
  tags: cluster.semanticContext?.tags,
  metadata: cluster.metadata,
});

const mapDemoRouteEndpoint = (
  id: string,
  entityIds: ReadonlySet<string>,
  clusterIds: ReadonlySet<string>,
  sourceKind: "entity" | "cluster",
): NeuralCoreRouteEndpointInput => {
  if (sourceKind === "entity" && entityIds.has(id)) {
    return { kind: "entity", entityId: id };
  }
  if (sourceKind === "cluster" && clusterIds.has(id)) {
    return { kind: "cluster", clusterId: id };
  }
  if (entityIds.has(id) && !clusterIds.has(id)) {
    return { kind: "entity", entityId: id };
  }
  return { kind: "cluster", clusterId: id };
};

const mapRoute = (
  route: NeuralCoreTopology["synapses"][number],
  entityIds: ReadonlySet<string>,
  clusterIds: ReadonlySet<string>,
  signal?: NeuralCoreState["signals"][number],
): NeuralCoreRouteInput => ({
  id: route.id,
  source: mapDemoRouteEndpoint(
    signal?.from ?? route.fromClusterId,
    entityIds,
    clusterIds,
    signal === undefined ? "cluster" : "entity",
  ),
  target: mapDemoRouteEndpoint(
    signal?.to ?? route.toClusterId,
    entityIds,
    clusterIds,
    signal === undefined ? "cluster" : "entity",
  ),
  relation: mapRelation(route.kind),
  direction: route.direction === "bidirectional" ? "bidirectional" : "directed",
  status: mapStatus(route.status),
  strength: route.weight,
  metadata: route.metadata,
});

interface MapNeuralCoreDemoModelParams {
  readonly choreography?: NeuralCoreChoreography;
  readonly id: string;
  readonly narrative?: NeuralCoreNarrative;
  readonly presentationKey: string;
  readonly sceneDirection?: NeuralCoreSceneDirectionTimeline;
  readonly state?: NeuralCoreState;
  readonly topology?: NeuralCoreTopology;
}

export interface NeuralCoreDemoModelMapping {
  readonly compatibility: NeuralCoreTopologyCompatibilityData;
  readonly model: NeuralCoreModelInput;
  readonly presentation: NeuralCorePresentationBinding;
}

export const mapNeuralCoreDemoModel = ({
  choreography,
  id,
  narrative,
  presentationKey,
  sceneDirection,
  state,
  topology,
}: MapNeuralCoreDemoModelParams): NeuralCoreDemoModelMapping => {
  const entityIds = new Set(state?.entities.map((entity) => entity.id) ?? []);
  const clusterIds = new Set(topology?.clusters.map((cluster) => cluster.id) ?? []);
  const signalById = new Map(state?.signals.map((signal) => [signal.id, signal]) ?? []);
  const signalBySynapseId = new Map<string, NeuralCoreState["signals"][number]>();
  state?.signals.forEach((signal) => {
    const explicitSynapseId = signal.metadata?.synapseId;
    signalBySynapseId.set(
      typeof explicitSynapseId === "string" ? explicitSynapseId : `synapse:${signal.id}`,
      signal,
    );
  });
  topology?.transmissions.forEach((transmission) => {
    const signal = signalById.get(transmission.id);
    if (signal !== undefined) {
      signalBySynapseId.set(transmission.synapseId, signal);
    }
  });

  return {
    compatibility: {
      clusterDataById: new Map(topology?.clusters.map((cluster) => [
        cluster.id,
        {
          plasticity: cluster.plasticity,
          positionHint: cluster.positionHint,
          stability: cluster.stability,
        },
      ]) ?? []),
    },
    model: {
      id,
      entities: state?.entities.map((entity) => mapEntity(entity, topology)) ?? [],
      clusters: topology?.clusters.map(mapCluster) ?? [],
      routes: topology?.synapses.map((route) => {
        return mapRoute(route, entityIds, clusterIds, signalBySynapseId.get(route.id));
      }) ?? [],
      pathways: topology?.pathways?.map((pathway) => ({
        id: pathway.id,
        label: pathway.label,
        clusterIds: pathway.clusterIds,
        routeIds: pathway.synapseIds,
        status: mapStatus(pathway.status),
        metadata: pathway.metadata,
      })) ?? [],
      metadata: state?.metadata ?? {},
    },
    presentation: {
      choreography,
      narrative,
      presentationKey,
      sceneDirection,
    },
  };
};
