import type { NeuralCoreOperationalExecution } from "../../../domain/operational-runtime/types/neural-core-operational-execution.types";
import { normalizeNeuralCoreOperationalExecution } from "../mappers/neural-core-operational-scenario.mapper";
import {
  NEURAL_CORE_OPERATIONAL_CLUSTER_IDS as CLUSTER,
  NEURAL_CORE_OPERATIONAL_ROUTE_IDS as ROUTE,
  NEURAL_CORE_OPERATIONAL_STAGE_IDS as STAGE,
} from "../mappers/neural-core-operational-topology.mapper";

export const NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID = "execution:request-success";

export const NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION:
NeuralCoreOperationalExecution = normalizeNeuralCoreOperationalExecution({
  id: NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID,
  name: "Request Success",
  shortName: "Success",
  kind: "success",
  description: "Authenticated request resolved through a cache hit and successful external enrichment.",
  events: [
    { id: "success:001:execution-started", type: "execution-started", status: "processing", atMs: 0, durationMs: 0, title: "Execution started", metadata: { correlationId: "req-success-001" } },
    { id: "success:002:request-received", type: "request-received", status: "processing", atMs: 4, durationMs: 0, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Client request received", metrics: [{ id: "payload-size", name: "Payload size", value: 18.4, unit: "KB", status: "neutral", trend: "stable" }] },
    { id: "success:003:client-entered", type: "stage-entered", status: "processing", atMs: 5, durationMs: 3, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Request accepted" },
    { id: "success:004:client-completed", type: "stage-completed", status: "success", atMs: 8, durationMs: 0, stageId: STAGE.clientRequest, clusterId: CLUSTER.clientRequest, title: "Request prepared" },
    { id: "success:005:route-gateway", type: "route-transmission", status: "processing", atMs: 10, durationMs: 2, routeId: ROUTE.clientToGateway, title: "Request transmitted to gateway" },
    { id: "success:006:gateway-entered", type: "stage-entered", status: "processing", atMs: 12, durationMs: 12, stageId: STAGE.apiGateway, clusterId: CLUSTER.apiGateway, title: "Gateway routing request" },
    { id: "success:007:gateway-metric", type: "metric-updated", status: "success", atMs: 23, durationMs: 0, stageId: STAGE.apiGateway, clusterId: CLUSTER.apiGateway, title: "Gateway latency measured", metrics: [{ id: "gateway-latency", name: "Gateway latency", value: 12, unit: "ms", status: "success", trend: "stable" }] },
    { id: "success:008:gateway-completed", type: "stage-completed", status: "success", atMs: 24, durationMs: 0, stageId: STAGE.apiGateway, clusterId: CLUSTER.apiGateway, title: "Gateway checks completed" },
    { id: "success:009:route-auth", type: "route-transmission", status: "processing", atMs: 26, durationMs: 2, routeId: ROUTE.gatewayToAuthentication, title: "Request transmitted to authentication" },
    { id: "success:010:auth-entered", type: "stage-entered", status: "processing", atMs: 28, durationMs: 38, stageId: STAGE.authentication, clusterId: CLUSTER.authentication, title: "Validating identity" },
    { id: "success:011:auth-completed", type: "stage-completed", status: "success", atMs: 66, durationMs: 0, stageId: STAGE.authentication, clusterId: CLUSTER.authentication, title: "Authentication approved", metrics: [{ id: "authentication-latency", name: "Authentication latency", value: 38, unit: "ms", status: "success", trend: "stable" }, { id: "token-valid", name: "Token valid", value: true, status: "success", trend: "stable" }] },
    { id: "success:012:route-core", type: "route-transmission", status: "processing", atMs: 68, durationMs: 2, routeId: ROUTE.authenticationToCore, title: "Authenticated request transmitted to core" },
    { id: "success:013:core-entered", type: "stage-entered", status: "processing", atMs: 70, durationMs: 12, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Core service evaluating request" },
    { id: "success:014:core-processing", type: "stage-processing", status: "processing", atMs: 75, durationMs: 7, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Selecting cache path" },
    { id: "success:015:route-cache", type: "route-transmission", status: "processing", atMs: 82, durationMs: 2, routeId: ROUTE.coreToCache, title: "Cache lookup requested" },
    { id: "success:016:cache-entered", type: "stage-entered", status: "processing", atMs: 84, durationMs: 8, stageId: STAGE.cache, clusterId: CLUSTER.cache, title: "Reading cache" },
    { id: "success:017:cache-completed", type: "stage-completed", status: "success", atMs: 92, durationMs: 0, stageId: STAGE.cache, clusterId: CLUSTER.cache, title: "Cache hit", metrics: [{ id: "cache-hit", name: "Cache hit", value: true, status: "success", trend: "stable" }, { id: "cache-latency", name: "Cache latency", value: 8, unit: "ms", status: "success", trend: "stable" }] },
    { id: "success:018:route-cache-core", type: "route-transmission", status: "processing", atMs: 94, durationMs: 2, routeId: ROUTE.cacheToCore, title: "Cached context returned to core" },
    { id: "success:019:core-enrichment", type: "stage-processing", status: "processing", atMs: 98, durationMs: 2, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Preparing external enrichment" },
    { id: "success:020:route-external", type: "route-transmission", status: "processing", atMs: 100, durationMs: 2, routeId: ROUTE.coreToExternal, title: "Request transmitted to external AI service" },
    { id: "success:021:external-entered", type: "stage-entered", status: "processing", atMs: 102, durationMs: 320, stageId: STAGE.externalAiApi, clusterId: CLUSTER.externalAiApi, title: "External inference processing" },
    { id: "success:022:external-completed", type: "stage-completed", status: "success", atMs: 422, durationMs: 0, stageId: STAGE.externalAiApi, clusterId: CLUSTER.externalAiApi, title: "External inference completed", metrics: [{ id: "external-latency", name: "External service latency", value: 320, unit: "ms", status: "success", trend: "stable" }] },
    { id: "success:023:route-external-core", type: "route-transmission", status: "success", atMs: 423, durationMs: 1, routeId: ROUTE.externalToCore, title: "Enriched result returned to core" },
    { id: "success:024:core-completed", type: "stage-completed", status: "success", atMs: 425, durationMs: 0, stageId: STAGE.coreService, clusterId: CLUSTER.coreService, title: "Core processing completed" },
    { id: "success:025:route-response", type: "route-transmission", status: "processing", atMs: 426, durationMs: 1, routeId: ROUTE.coreToResponse, title: "Result transmitted to response" },
    { id: "success:026:response-entered", type: "stage-entered", status: "processing", atMs: 427, durationMs: 2, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Assembling response" },
    { id: "success:027:response-sent", type: "response-sent", status: "success", atMs: 429, durationMs: 0, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Response sent", metrics: [{ id: "status-code", name: "Status code", value: 200, status: "success", trend: "stable" }, { id: "total-latency", name: "Total latency", value: 430, unit: "ms", status: "success", trend: "stable" }] },
    { id: "success:028:response-completed", type: "stage-completed", status: "success", atMs: 429.5, durationMs: 0, stageId: STAGE.response, clusterId: CLUSTER.response, title: "Response delivery completed" },
    { id: "success:029:execution-completed", type: "execution-completed", status: "success", atMs: 430, durationMs: 0, title: "Execution completed" },
  ],
  outcome: {
    status: "success",
    totalDurationMs: 430,
    processedStageCount: 7,
    warningCount: 0,
    failureCount: 0,
    retryCount: 0,
    summary: "Request authenticated, resolved through cache, enriched externally, and returned with HTTP 200.",
    metrics: [
      { id: "total-latency", name: "Total latency", value: 430, unit: "ms", status: "success", trend: "stable" },
      { id: "status-code", name: "Status code", value: 200, status: "success", trend: "stable" },
      { id: "cache-hit", name: "Cache hit", value: true, status: "success", trend: "stable" },
    ],
  },
  playback: { recommendedDurationMs: 3600, minimumSpeed: 0.5, maximumSpeed: 2 },
});
