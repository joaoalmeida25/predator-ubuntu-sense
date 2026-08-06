import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export type NeuralCoreOperationalRouteVisualMode = "aggregated" | "detailed";

export type NeuralCoreOperationalRouteVisualStatus =
  | "processing"
  | "success"
  | "warning"
  | "error"
  | "recovering";

export interface NeuralCoreOperationalRouteVisualChannel {
  id: string;
  executionId: string;
  eventId: string;
  routeId: string;
  mode: NeuralCoreOperationalRouteVisualMode;
  sourceClusterId: string;
  targetClusterId: string;
  direction: "forward" | "backward" | "bidirectional";
  geometryId: string;
  controlPoints: readonly NeuralCoreVector3[];
  relatedSynapseIds: readonly string[];
  relatedPathwayIds: readonly string[];
  status: NeuralCoreOperationalRouteVisualStatus;
}
