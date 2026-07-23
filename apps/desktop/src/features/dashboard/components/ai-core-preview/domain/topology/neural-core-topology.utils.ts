import { EMPTY_NEURAL_CORE_TOPOLOGY } from "./neural-core-topology.constants";
import { normalizeNeuralCoreClusterSemanticContext } from "../semantic/neural-core-semantic-context.utils";
import type {
  NeuralCoreCluster,
  NeuralCoreClusterPositionHint,
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreTopology,
  NeuralCoreTransmission,
} from "./neural-core-topology.types";

export const clampNeuralCoreTopologyValue = (value?: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
};

const normalizeOptionalNeuralCoreTopologyValue = (value?: number): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return clampNeuralCoreTopologyValue(value);
};

const normalizePositionHint = (
  positionHint?: NeuralCoreClusterPositionHint,
): NeuralCoreClusterPositionHint | undefined => {
  if (!positionHint) {
    return undefined;
  }

  return {
    ...positionHint,
    priority: normalizeOptionalNeuralCoreTopologyValue(positionHint.priority),
  };
};

const normalizeCluster = (cluster: NeuralCoreCluster): NeuralCoreCluster => {
  return {
    ...cluster,
    activity: normalizeOptionalNeuralCoreTopologyValue(cluster.activity),
    importance: normalizeOptionalNeuralCoreTopologyValue(cluster.importance),
    stability: normalizeOptionalNeuralCoreTopologyValue(cluster.stability),
    plasticity: normalizeOptionalNeuralCoreTopologyValue(cluster.plasticity),
    positionHint: normalizePositionHint(cluster.positionHint),
    semanticContext: cluster.semanticContext
      ? normalizeNeuralCoreClusterSemanticContext(cluster.semanticContext)
      : undefined,
  };
};

const normalizeSynapse = (synapse: NeuralCoreSynapse): NeuralCoreSynapse => {
  return {
    ...synapse,
    weight: normalizeOptionalNeuralCoreTopologyValue(synapse.weight),
    conductivity: normalizeOptionalNeuralCoreTopologyValue(synapse.conductivity),
    plasticity: normalizeOptionalNeuralCoreTopologyValue(synapse.plasticity),
  };
};

const normalizeTransmission = (transmission: NeuralCoreTransmission): NeuralCoreTransmission => {
  return {
    ...transmission,
    intensity: normalizeOptionalNeuralCoreTopologyValue(transmission.intensity),
    progress: normalizeOptionalNeuralCoreTopologyValue(transmission.progress),
    speed: normalizeOptionalNeuralCoreTopologyValue(transmission.speed),
  };
};

const normalizePathway = (pathway: NeuralCorePathway): NeuralCorePathway => {
  return {
    ...pathway,
    activity: normalizeOptionalNeuralCoreTopologyValue(pathway.activity),
  };
};

export const normalizeNeuralCoreTopology = (
  topology?: NeuralCoreTopology,
): NeuralCoreTopology => {
  const sourceTopology = topology ?? EMPTY_NEURAL_CORE_TOPOLOGY;

  return {
    ...EMPTY_NEURAL_CORE_TOPOLOGY,
    ...sourceTopology,
    clusters: sourceTopology.clusters.map(normalizeCluster),
    synapses: sourceTopology.synapses.map(normalizeSynapse),
    transmissions: sourceTopology.transmissions.map(normalizeTransmission),
    pathways: sourceTopology.pathways?.map(normalizePathway) ?? [],
    globalActivity: normalizeOptionalNeuralCoreTopologyValue(sourceTopology.globalActivity),
  };
};
