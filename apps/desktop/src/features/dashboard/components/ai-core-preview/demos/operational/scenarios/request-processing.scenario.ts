import type { NeuralCoreOperationalExecution } from "../domain/neural-core-operational-execution.types";
import type {
  NeuralCoreOperationalScenario,
  NeuralCoreOperationalStage,
} from "../domain/neural-core-operational-scenario.types";
import {
  NEURAL_CORE_OPERATIONAL_DEGRADED_EXECUTION,
} from "../executions/request-degraded.execution";
import {
  NEURAL_CORE_OPERATIONAL_RECOVERY_EXECUTION,
} from "../executions/request-recovery.execution";
import {
  NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION,
  NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID,
} from "../executions/request-success.execution";
import { normalizeNeuralCoreOperationalScenario } from "../mappers/neural-core-operational-scenario.mapper";
import {
  mapNeuralCoreOperationalTopology,
  NEURAL_CORE_OPERATIONAL_CLUSTER_IDS as CLUSTER,
  NEURAL_CORE_OPERATIONAL_ROUTE_IDS as ROUTE,
  NEURAL_CORE_OPERATIONAL_STAGE_IDS as STAGE,
} from "../mappers/neural-core-operational-topology.mapper";

const OPERATIONAL_STAGES: readonly NeuralCoreOperationalStage[] = [
  {
    id: STAGE.clientRequest,
    name: "Client Request",
    shortName: "Request",
    clusterId: CLUSTER.clientRequest,
    order: 1,
    role: "entry",
    description: "Receives the request payload and establishes its processing origin.",
    incomingRouteIds: [],
    outgoingRouteIds: [ROUTE.clientToGateway],
  },
  {
    id: STAGE.apiGateway,
    name: "API Gateway",
    shortName: "Gateway",
    clusterId: CLUSTER.apiGateway,
    order: 2,
    role: "gateway",
    description: "Applies entry controls, correlation, and request routing.",
    incomingRouteIds: [ROUTE.clientToGateway],
    outgoingRouteIds: [ROUTE.gatewayToAuthentication],
  },
  {
    id: STAGE.authentication,
    name: "Authentication",
    shortName: "Auth",
    clusterId: CLUSTER.authentication,
    order: 3,
    role: "authentication",
    description: "Validates token integrity, identity, and authorization.",
    incomingRouteIds: [ROUTE.gatewayToAuthentication],
    outgoingRouteIds: [ROUTE.authenticationToCore],
  },
  {
    id: STAGE.coreService,
    name: "Core Service",
    shortName: "Core",
    clusterId: CLUSTER.coreService,
    order: 4,
    role: "processing",
    description: "Orchestrates business logic, cache, persistence, and external enrichment.",
    incomingRouteIds: [
      ROUTE.authenticationToCore,
      ROUTE.cacheToCore,
      ROUTE.databaseToCore,
      ROUTE.externalToCore,
    ],
    outgoingRouteIds: [
      ROUTE.coreToCache,
      ROUTE.coreToDatabase,
      ROUTE.coreToExternal,
      ROUTE.coreToResponse,
    ],
  },
  {
    id: STAGE.cache,
    name: "Cache",
    shortName: "Cache",
    clusterId: CLUSTER.cache,
    order: 5,
    role: "cache",
    description: "Resolves cached context or returns a deterministic cache miss.",
    incomingRouteIds: [ROUTE.coreToCache],
    outgoingRouteIds: [ROUTE.cacheToCore],
  },
  {
    id: STAGE.database,
    name: "Database",
    shortName: "Database",
    clusterId: CLUSTER.database,
    order: 6,
    role: "persistence",
    description: "Loads persistent context when cache data is unavailable.",
    incomingRouteIds: [ROUTE.coreToDatabase],
    outgoingRouteIds: [ROUTE.databaseToCore],
  },
  {
    id: STAGE.externalAiApi,
    name: "External AI/API",
    shortName: "External AI",
    clusterId: CLUSTER.externalAiApi,
    order: 7,
    role: "external",
    description: "Performs external inference and enrichment behind a localized timeout boundary.",
    incomingRouteIds: [ROUTE.coreToExternal],
    outgoingRouteIds: [ROUTE.externalToCore],
  },
  {
    id: STAGE.response,
    name: "Response",
    shortName: "Response",
    clusterId: CLUSTER.response,
    order: 8,
    role: "response",
    description: "Assembles and returns the final response to the client.",
    incomingRouteIds: [ROUTE.coreToResponse],
    outgoingRouteIds: [],
  },
];

const REQUEST_PROCESSING_SCENARIO = normalizeNeuralCoreOperationalScenario({
  id: "operational-request-processing",
  name: "Operational Request Processing",
  shortName: "Operational Flow",
  description: "A complete request-processing flow with success, degraded, and failure-recovery executions.",
  topology: mapNeuralCoreOperationalTopology(),
  stages: OPERATIONAL_STAGES,
  executions: [
    NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION,
    NEURAL_CORE_OPERATIONAL_DEGRADED_EXECUTION,
    NEURAL_CORE_OPERATIONAL_RECOVERY_EXECUTION,
  ],
  defaultExecutionId: NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID,
  tags: ["operational", "request-processing", "deterministic", "commercial-demo"],
});

export const getNeuralCoreOperationalScenario = (): NeuralCoreOperationalScenario => (
  REQUEST_PROCESSING_SCENARIO
);

export const getNeuralCoreOperationalExecutions = (
): readonly NeuralCoreOperationalExecution[] => REQUEST_PROCESSING_SCENARIO.executions;

export const getNeuralCoreOperationalExecutionById = (
  executionId: string,
): NeuralCoreOperationalExecution | undefined => (
  REQUEST_PROCESSING_SCENARIO.executions.find(({ id }) => id === executionId)
);
