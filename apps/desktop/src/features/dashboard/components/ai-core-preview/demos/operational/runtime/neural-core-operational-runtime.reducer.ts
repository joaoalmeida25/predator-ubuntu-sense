import type { NeuralCoreOperationalRuntimeSnapshot } from "./neural-core-operational-runtime.types";

export type NeuralCoreOperationalRuntimeAction = {
  type: "replace";
  snapshot: NeuralCoreOperationalRuntimeSnapshot;
};

export const neuralCoreOperationalRuntimeReducer = (
  _snapshot: NeuralCoreOperationalRuntimeSnapshot,
  action: NeuralCoreOperationalRuntimeAction,
): NeuralCoreOperationalRuntimeSnapshot => action.snapshot;
