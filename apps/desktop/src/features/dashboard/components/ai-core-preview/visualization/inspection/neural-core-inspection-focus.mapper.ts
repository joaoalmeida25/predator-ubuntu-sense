import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreTopologyVisualState } from "../topology/neural-core-topology-visual.types";
import type {
  NeuralCoreInspectionDirectionState,
  NeuralCoreInspectionFocusState,
} from "./neural-core-inspection-focus.types";

export interface MapNeuralCoreInspectionFocusParams {
  topology: NeuralCoreTopology;
  selectedClusterId?: string;
}

const EMPTY_FOCUS: NeuralCoreInspectionFocusState = {
  relatedClusterIds: [],
  relatedSynapseIds: [],
  relatedPathwayIds: [],
};

export const mapNeuralCoreInspectionFocus = ({
  topology,
  selectedClusterId,
}: MapNeuralCoreInspectionFocusParams): NeuralCoreInspectionFocusState => {
  const selected = topology.clusters.find((cluster) => cluster.id === selectedClusterId);
  if (!selected) {
    return EMPTY_FOCUS;
  }
  const clusterIds = new Set(topology.clusters.map((cluster) => cluster.id));
  const synapseById = new Map(topology.synapses.map((synapse) => [synapse.id, synapse]));
  const pathwayById = new Map((topology.pathways ?? []).map((pathway) => [pathway.id, pathway]));
  const relatedClusterIds = new Set<string>();
  const relatedSynapseIds = new Set<string>();
  const relatedPathwayIds = new Set<string>();
  const addCluster = (clusterId: string): void => {
    if (clusterId !== selected.id && clusterIds.has(clusterId)) {
      relatedClusterIds.add(clusterId);
    }
  };
  const addSynapse = (synapseId: string): void => {
    const synapse = synapseById.get(synapseId);
    if (!synapse) {
      return;
    }
    relatedSynapseIds.add(synapse.id);
    addCluster(synapse.fromClusterId);
    addCluster(synapse.toClusterId);
  };
  const addPathway = (pathwayId: string): void => {
    const pathway = pathwayById.get(pathwayId);
    if (!pathway) {
      return;
    }
    relatedPathwayIds.add(pathway.id);
    for (const clusterId of pathway.clusterIds) {
      addCluster(clusterId);
    }
    for (const synapseId of pathway.synapseIds) {
      addSynapse(synapseId);
    }
  };
  for (const clusterId of selected.semanticContext?.relatedClusterIds ?? []) {
    addCluster(clusterId);
  }
  for (const synapseId of selected.semanticContext?.relatedSynapseIds ?? []) {
    addSynapse(synapseId);
  }
  for (const pathwayId of selected.semanticContext?.relatedPathwayIds ?? []) {
    addPathway(pathwayId);
  }
  for (const synapse of topology.synapses) {
    if (synapse.fromClusterId === selected.id || synapse.toClusterId === selected.id) {
      addSynapse(synapse.id);
    }
  }
  for (const pathway of topology.pathways ?? []) {
    if (pathway.clusterIds.includes(selected.id)) {
      addPathway(pathway.id);
    }
  }
  return {
    selectedClusterId: selected.id,
    relatedClusterIds: [...relatedClusterIds].sort((left, right) => left.localeCompare(right)),
    relatedSynapseIds: [...relatedSynapseIds].sort((left, right) => left.localeCompare(right)),
    relatedPathwayIds: [...relatedPathwayIds].sort((left, right) => left.localeCompare(right)),
  };
};

export interface MapNeuralCoreInspectionDirectionStateParams {
  focus: NeuralCoreInspectionFocusState;
  topologyVisualState: NeuralCoreTopologyVisualState;
  dimUnrelatedContext: boolean;
  highlightRelatedConnections: boolean;
}

export const mapNeuralCoreInspectionDirectionState = ({
  focus,
  topologyVisualState,
  dimUnrelatedContext,
  highlightRelatedConnections,
}: MapNeuralCoreInspectionDirectionStateParams): NeuralCoreInspectionDirectionState => {
  const region = focus.selectedClusterId
    ? topologyVisualState.lookups.clusterRegionById[focus.selectedClusterId]
    : undefined;
  const target: [number, number, number] = region
    ? [region.center[0], region.center[1], region.center[2]]
    : [0, 0, 0];
  const relatedSynapseIds = highlightRelatedConnections ? focus.relatedSynapseIds : [];
  const relatedPathwayIds = highlightRelatedConnections ? focus.relatedPathwayIds : [];
  return {
    target,
    cameraPosition: [target[0], target[1], target[2] + 4.35],
    cameraDistance: 4.35,
    focusTargetType: region ? "cluster" : "overview",
    focusTargetId: region?.clusterId,
    targetClusterIds: region ? [region.clusterId] : [],
    neighborClusterIds: focus.relatedClusterIds,
    targetSynapseIds: relatedSynapseIds,
    relatedSynapseIds,
    targetPathwayIds: relatedPathwayIds,
    targetEmphasis: region ? 1.2 : 0,
    contextDim: region && dimUnrelatedContext ? 0.58 : 0,
    routeEmphasis: region && highlightRelatedConnections ? 0.92 : 0,
    clusterFillEmphasis: region ? 0.82 : 0,
    peripheralOpacity: region && dimUnrelatedContext ? 0.62 : 1,
    haloIntensity: region ? 1 : 0,
    rotationMultiplier: 0,
    transitionProgress: 1,
    isOverview: !region,
  };
};
