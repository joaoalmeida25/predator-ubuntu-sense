import type { NeuralCoreOperationalExecution } from "../domain/neural-core-operational-execution.types";
import { normalizeNeuralCoreOperationalExecution } from "../mappers/neural-core-operational-scenario.mapper";
import {
  NEURAL_CORE_OPERATIONAL_CLUSTER_IDS as CLUSTER,
  NEURAL_CORE_OPERATIONAL_ROUTE_IDS as ROUTE,
  NEURAL_CORE_OPERATIONAL_STAGE_IDS as STAGE,
} from "../mappers/neural-core-operational-topology.mapper";

export const NEURAL_CORE_OPERATIONAL_DEGRADED_EXECUTION_ID = "execution:request-degraded";

export const NEURAL_CORE_OPERATIONAL_DEGRADED_EXECUTION:
NeuralCoreOperationalExecution = normalizeNeuralCoreOperationalExecution({
  id: NEURAL_CORE_OPERATIONAL_DEGRADED_EXECUTION_ID,
  name: "Request Degraded",
  shortName: "Degraded",
  kind: "degraded",
  description: "Request completes after a cache miss, database fallback, and elevated external latency.",
  events: [
    { id: "degraded:001:execution-started", type: "execution-started", status: "processing", atMs: 0, durationMs: 0, title: "Execution started", metadata: { correlationId: "req-degraded-001" } },
    { id: "degraded:002:request-received", type: "request-received", status: "processing", atMs: 4, durationMs: 0, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Client request received" },
    { id: "degraded:003:client-entered", type: "stage-entered", status: "processing", atMs: 5, durationMs: 3, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Request accepted" },
    { id: "degraded:004:client-completed", type: "stage-completed", status: "success", atMs: 8, durationMs: 0, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Request prepared" },
    { id: "degraded:005:route-gateway", type: "route-transmission", status: "processing", atMs: 10, durationMs: 2, routeId: ROUTE.clientToGateway, title: "Request transmitted to gateway" },
    { id: "degraded:006:gateway-entered", type: "stage-entered", status: "processing", atMs: 12, durationMs: 12, stageId: STAGE.apiGateway, clusterId: CLUSTER.apiGateway, title: "Gateway routing request" },
    { id: "degraded:007:gateway-completed", type: "stage-completed", status: "success", atMs: 24, durationMs: 0, stageId: STAGE.apiGateway, clusterId: CLUSTER.apiGateway, title: "Gateway checks completed", metrics: [{ id: "gateway-latency", name: "Gateway latency", value: 12, unit: "ms", status: "success", trend: "stable" }] },
    { id: "degraded:008:route-auth", type: "route-transmission", status: "processing", atMs: 26, durationMs: 2, routeId: ROUTE.gatewayToAuthentication, title: "Request transmitted to authentication" },
    { id: "degraded:009:auth-entered", type: "stage-entered", status: "processing", atMs: 28, durationMs: 38, stageId: STAGE.authentication, clusterId: CLUSTER.authentication, title: "Validating identity" },
    { id: "degraded:010:auth-completed", type: "stage-completed", status: "success", atMs: 66, durationMs: 0, stageId: STAGE.authentication, clusterId: CLUSTER.authentication, title: "Authentication approved", metrics: [{ id: "authentication-latency", name: "Authentication latency", value: 38, unit: "ms", status: "success", trend: "stable" }] },
    { id: "degraded:011:route-core", type: "route-transmission", status: "processing", atMs: 68, durationMs: 2, routeId: ROUTE.authenticationToCore, title: "Authenticated request transmitted to core" },
    { id: "degraded:012:core-entered", type: "stage-entered", status: "processing", atMs: 70, durationMs: 12, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Core service evaluating request" },
    { id: "degraded:013:route-cache", type: "route-transmission", status: "processing", atMs: 82, durationMs: 2, routeId: ROUTE.coreToCache, title: "Cache lookup requested" },
    { id: "degraded:014:cache-entered", type: "stage-entered", status: "processing", atMs: 84, durationMs: 8, stageId: STAGE.cache, clusterId: CLUSTER.cache, title: "Reading cache" },
    { id: "degraded:015:cache-completed", type: "stage-completed", status: "warning", atMs: 92, durationMs: 0, stageId: STAGE.cache, clusterId: CLUSTER.cache, title: "Cache miss", metrics: [{ id: "cache-hit", name: "Cache hit", value: false, status: "warning", trend: "down" }, { id: "cache-latency", name: "Cache latency", value: 8, unit: "ms", status: "neutral", trend: "stable" }] },
    { id: "degraded:016:route-cache-core", type: "route-transmission", status: "processing", atMs: 94, durationMs: 2, routeId: ROUTE.cacheToCore, title: "Cache miss returned to core" },
    { id: "degraded:017:route-database", type: "route-transmission", status: "processing", atMs: 96, durationMs: 2, routeId: ROUTE.coreToDatabase, title: "Database fallback requested" },
    { id: "degraded:018:database-entered", type: "stage-entered", status: "processing", atMs: 98, durationMs: 180, stageId: STAGE.database, clusterId: CLUSTER.database, title: "Loading persistent context" },
    { id: "degraded:019:database-completed", type: "stage-completed", status: "success", atMs: 278, durationMs: 0, stageId: STAGE.database, clusterId: CLUSTER.database, title: "Persistent context loaded", metrics: [{ id: "database-latency", name: "Database latency", value: 180, unit: "ms", status: "neutral", trend: "up" }] },
    { id: "degraded:020:route-database-core", type: "route-transmission", status: "processing", atMs: 280, durationMs: 2, routeId: ROUTE.databaseToCore, title: "Database context returned to core" },
    { id: "degraded:021:core-processing", type: "stage-processing", status: "processing", atMs: 282, durationMs: 6, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Preparing external enrichment" },
    { id: "degraded:022:route-external", type: "route-transmission", status: "processing", atMs: 288, durationMs: 2, routeId: ROUTE.coreToExternal, title: "Request transmitted to external AI service" },
    { id: "degraded:023:external-entered", type: "stage-entered", status: "processing", atMs: 290, durationMs: 850, stageId: STAGE.externalAiApi, clusterId: CLUSTER.externalAiApi, title: "External inference processing" },
    { id: "degraded:024:latency-warning", type: "warning-raised", status: "warning", atMs: 1140, durationMs: 0, stageId: STAGE.externalAiApi, clusterId: CLUSTER.externalAiApi, title: "External response latency elevated", message: "Response latency exceeded the expected threshold without failing the request.", metrics: [{ id: "external-latency", name: "External service latency", value: 850, unit: "ms", status: "warning", trend: "up" }], impact: { level: "medium", affectedClusterIds: [CLUSTER.externalAiApi, CLUSTER.response], summary: "Final response is delayed but remains available." } },
    { id: "degraded:025:external-completed", type: "stage-completed", status: "warning", atMs: 1141, durationMs: 0, stageId: STAGE.externalAiApi, clusterId: CLUSTER.externalAiApi, title: "External inference completed with high latency" },
    { id: "degraded:026:route-external-core", type: "route-transmission", status: "success", atMs: 1142, durationMs: 1, routeId: ROUTE.externalToCore, title: "Enriched result returned to core" },
    { id: "degraded:027:core-completed", type: "stage-completed", status: "success", atMs: 1143, durationMs: 0, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Core processing completed" },
    { id: "degraded:028:route-response", type: "route-transmission", status: "processing", atMs: 1144, durationMs: 1, routeId: ROUTE.coreToResponse, title: "Result transmitted to response" },
    { id: "degraded:029:response-entered", type: "stage-entered", status: "processing", atMs: 1145, durationMs: 2, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Assembling response" },
    { id: "degraded:030:response-sent", type: "response-sent", status: "success", atMs: 1147, durationMs: 0, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Response sent", metrics: [{ id: "status-code", name: "Status code", value: 200, status: "success", trend: "stable" }, { id: "total-latency", name: "Total latency", value: 1148, unit: "ms", status: "warning", trend: "up" }] },
    { id: "degraded:031:response-completed", type: "stage-completed", status: "success", atMs: 1147.5, durationMs: 0, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Response delivery completed" },
    { id: "degraded:032:execution-completed", type: "execution-completed", status: "warning", atMs: 1148, durationMs: 0, title: "Execution completed in degraded state" },
  ],
  outcome: {
    status: "degraded-success",
    totalDurationMs: 1148,
    processedStageCount: 8,
    warningCount: 1,
    failureCount: 0,
    retryCount: 0,
    summary: "Request completed with HTTP 200 after database fallback and elevated external latency.",
    metrics: [
      { id: "total-latency", name: "Total latency", value: 1148, unit: "ms", status: "warning", trend: "up" },
      { id: "database-latency", name: "Database latency", value: 180, unit: "ms", status: "neutral", trend: "up" },
      { id: "external-latency", name: "External service latency", value: 850, unit: "ms", status: "warning", trend: "up" },
      { id: "status-code", name: "Status code", value: 200, status: "success", trend: "stable" },
    ],
  },
  playback: { recommendedDurationMs: 5600, minimumSpeed: 0.5, maximumSpeed: 2 },
});
