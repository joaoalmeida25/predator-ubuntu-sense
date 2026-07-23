import type { NeuralCoreTopology } from "./neural-core-topology.types";

export const EMPTY_NEURAL_CORE_TOPOLOGY: NeuralCoreTopology = {
  clusters: [],
  synapses: [],
  transmissions: [],
  pathways: [],
  globalActivity: 0,
  status: "idle",
};
