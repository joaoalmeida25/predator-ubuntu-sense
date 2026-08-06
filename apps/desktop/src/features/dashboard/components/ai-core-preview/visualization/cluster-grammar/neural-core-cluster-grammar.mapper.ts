import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type {
  NeuralCoreTopologyVisualState,
} from "../topology/neural-core-topology-visual.types";
import type { NeuralCoreGraph } from "../graph/neural-core-graph.types";
import { EMPTY_NEURAL_CORE_CLUSTER_GRAMMAR_STATE } from "./neural-core-cluster-grammar.constants";
import { mapNeuralCoreAggregatedRoutes } from "./neural-core-aggregated-route.mapper";
import { mapNeuralCoreClusterTerritories } from "./neural-core-cluster-territory.mapper";
import type {
  NeuralCoreClusterGrammarConfig,
  NeuralCoreClusterGrammarState,
} from "./neural-core-cluster-grammar.types";

export interface MapNeuralCoreClusterGrammarParams {
  config: NeuralCoreClusterGrammarConfig;
  topology: NeuralCoreTopology;
  topologyVisualState: NeuralCoreTopologyVisualState;
  graph: NeuralCoreGraph;
}

export const mapNeuralCoreClusterGrammar = ({
  config,
  topology,
  topologyVisualState,
  graph,
}: MapNeuralCoreClusterGrammarParams): NeuralCoreClusterGrammarState => {
  if (!config.enabled || topology.clusters.length === 0) {
    return EMPTY_NEURAL_CORE_CLUSTER_GRAMMAR_STATE;
  }
  const territories = mapNeuralCoreClusterTerritories(topology, topologyVisualState, graph);
  const routes = mapNeuralCoreAggregatedRoutes(topology, topologyVisualState);
  const territoryIndexByClusterId: Record<string, number> = {};
  const routeIndicesByClusterId: Record<string, number[]> = {};
  const routeIndexById: Record<string, number> = {};
  const routeIndexBySynapseId: Record<string, number> = {};
  territories.forEach((territory, index): void => {
    territoryIndexByClusterId[territory.clusterId] = index;
    routeIndicesByClusterId[territory.clusterId] = [];
  });
  routes.forEach((route, index): void => {
    routeIndexById[route.id] = index;
    routeIndicesByClusterId[route.sourceClusterId]?.push(index);
    routeIndicesByClusterId[route.targetClusterId]?.push(index);
    for (const synapseId of route.synapseIds) {
      routeIndexBySynapseId[synapseId] = index;
    }
  });
  return {
    enabled: true,
    territories,
    routes,
    lookups: {
      routeIndicesByClusterId,
      routeIndexById,
      routeIndexBySynapseId,
      territoryIndexByClusterId,
    },
  };
};
