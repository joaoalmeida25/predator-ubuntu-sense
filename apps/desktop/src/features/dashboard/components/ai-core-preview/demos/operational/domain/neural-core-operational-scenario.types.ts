import type { NeuralCoreTopology } from "../../../domain/topology/neural-core-topology.types";
import type { NeuralCoreOperationalExecution } from "./neural-core-operational-execution.types";

export type NeuralCoreOperationalStageRole =
  | "entry"
  | "gateway"
  | "authentication"
  | "processing"
  | "cache"
  | "persistence"
  | "external"
  | "response";

export interface NeuralCoreOperationalStage {
  id: string;
  name: string;
  shortName: string;
  clusterId: string;
  order: number;
  role: NeuralCoreOperationalStageRole;
  description?: string;
  incomingRouteIds: readonly string[];
  outgoingRouteIds: readonly string[];
}

export interface NeuralCoreOperationalScenario {
  id: string;
  name: string;
  shortName: string;
  description: string;
  topology: NeuralCoreTopology;
  stages: readonly NeuralCoreOperationalStage[];
  executions: readonly NeuralCoreOperationalExecution[];
  defaultExecutionId: string;
  tags?: readonly string[];
}

export interface NeuralCoreOperationalDiagnostic {
  code: string;
  severity: "warning" | "error";
  message: string;
  executionId?: string;
  eventId?: string;
  stageId?: string;
  clusterId?: string;
  routeId?: string;
}

export interface NeuralCoreOperationalValidationResult {
  valid: boolean;
  diagnostics: readonly NeuralCoreOperationalDiagnostic[];
}

export interface NeuralCoreOperationalDemoMetadata {
  scenarioId: string;
  defaultExecutionId: string;
  stages: readonly NeuralCoreOperationalStage[];
  executions: readonly NeuralCoreOperationalExecution[];
  diagnostics: readonly NeuralCoreOperationalDiagnostic[];
}
