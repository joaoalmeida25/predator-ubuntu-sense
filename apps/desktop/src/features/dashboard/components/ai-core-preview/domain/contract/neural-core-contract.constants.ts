import type { NeuralCoreState } from "./neural-core-contract.types";
import { EMPTY_NEURAL_CORE_TOPOLOGY } from "../topology/neural-core-topology.constants";

export const DEFAULT_NEURAL_CORE_STATE: NeuralCoreState = {
  mode: "idle",
  entities: [],
  signals: [],
  topology: EMPTY_NEURAL_CORE_TOPOLOGY,
  globalActivity: 0,
  complexity: 0,
  accentColor: "cyan",
};
