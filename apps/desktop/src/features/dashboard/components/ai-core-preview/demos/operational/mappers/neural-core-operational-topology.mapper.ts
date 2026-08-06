import type {
  NeuralCoreClusterSemanticContext,
  NeuralCoreMetric,
} from "../../../domain/semantic/neural-core-semantic-context.types";
import type {
  NeuralCoreCluster,
  NeuralCoreClusterPositionHint,
  NeuralCoreSynapse,
  NeuralCoreTopology,
} from "../../../domain/topology/neural-core-topology.types";

export const NEURAL_CORE_OPERATIONAL_CLUSTER_IDS = {
  clientRequest: "client-request",
  apiGateway: "api-gateway",
  authentication: "authentication",
  coreService: "core-service",
  cache: "cache",
  database: "database",
  externalAiApi: "external-ai-api",
  response: "response",
} as const;

export const NEURAL_CORE_OPERATIONAL_ROUTE_IDS = {
  clientToGateway: "route:client-request:api-gateway",
  gatewayToAuthentication: "route:api-gateway:authentication",
  authenticationToCore: "route:authentication:core-service",
  coreToCache: "route:core-service:cache",
  cacheToCore: "route:cache:core-service",
  coreToDatabase: "route:core-service:database",
  databaseToCore: "route:database:core-service",
  coreToExternal: "route:core-service:external-ai-api",
  externalToCore: "route:external-ai-api:core-service",
  coreToResponse: "route:core-service:response",
} as const;

export const NEURAL_CORE_OPERATIONAL_PATHWAY_ID = "pathway:operational-request";

export const NEURAL_CORE_OPERATIONAL_STAGE_IDS = {
  clientRequest: "stage:client-request",
  apiGateway: "stage:api-gateway",
  authentication: "stage:authentication",
  coreService: "stage:core-service",
  cache: "stage:cache",
  database: "stage:database",
  externalAiApi: "stage:external-ai-api",
  response: "stage:response",
} as const;

const metric = (
  id: string,
  label: string,
  value: NeuralCoreMetric["value"],
  unit?: string,
  status: NeuralCoreMetric["status"] = "idle",
): NeuralCoreMetric => ({
  id,
  label,
  value,
  ...(unit ? { unit } : {}),
  trend: "stable",
  status,
});

const semanticContext = (
  name: string,
  shortName: string,
  description: string,
  metrics: readonly NeuralCoreMetric[],
  relatedClusterIds: readonly string[],
  relatedSynapseIds: readonly string[],
  tags: readonly string[],
): NeuralCoreClusterSemanticContext => ({
  name,
  shortName,
  description,
  metrics,
  impact: {
    level: "none",
    summary: "No active operational impact in the base topology.",
    affectedClusterIds: [],
    affectedPathwayIds: [NEURAL_CORE_OPERATIONAL_PATHWAY_ID],
  },
  relatedClusterIds,
  relatedSynapseIds,
  relatedPathwayIds: [NEURAL_CORE_OPERATIONAL_PATHWAY_ID],
  tags,
});

const cluster = (
  id: string,
  label: string,
  kind: NeuralCoreCluster["kind"],
  activity: number,
  importance: number,
  positionHint: NeuralCoreClusterPositionHint,
  context: NeuralCoreClusterSemanticContext,
): NeuralCoreCluster => ({
  id,
  label,
  kind,
  status: "idle",
  activity,
  importance,
  stability: 0.96,
  plasticity: 0.42,
  positionHint,
  semanticContext: context,
  entityIds: [id],
});

const synapse = (
  id: string,
  fromClusterId: string,
  toClusterId: string,
  weight: number,
): NeuralCoreSynapse => ({
  id,
  fromClusterId,
  toClusterId,
  kind: "relay",
  status: "idle",
  weight,
  conductivity: 0.84,
  plasticity: 0.38,
  direction: "forward",
});

export const mapNeuralCoreOperationalTopology = (): NeuralCoreTopology => {
  const clusters: NeuralCoreCluster[] = [
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.clientRequest,
      "Client Request",
      "input",
      0.34,
      0.72,
      { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.94 },
      semanticContext(
        "Client Request",
        "Request",
        "Represents the incoming request payload and its processing origin.",
        [
          metric("payload-size", "Payload size", 18.4, "KB"),
          metric("request-priority", "Request priority", "normal"),
          metric("client-connected", "Client connected", true),
        ],
        [NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.apiGateway],
        [NEURAL_CORE_OPERATIONAL_ROUTE_IDS.clientToGateway],
        ["request", "payload", "entry"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.apiGateway,
      "API Gateway",
      "gateway",
      0.42,
      0.88,
      { region: "upper", hemisphere: "left", depth: "surface", priority: 0.98 },
      semanticContext(
        "API Gateway",
        "Gateway",
        "Accepts, correlates, rate-limits, and routes requests into the system.",
        [
          metric("requests-per-second", "Requests per second", 1240, "req/s"),
          metric("gateway-latency", "Latency", 12, "ms"),
          metric("gateway-error-rate", "Error rate", 0.08, "%"),
        ],
        [
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.clientRequest,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.authentication,
        ],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.clientToGateway,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.gatewayToAuthentication,
        ],
        ["gateway", "routing", "rate-limiting", "correlation"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.authentication,
      "Authentication",
      "service",
      0.4,
      0.9,
      { region: "frontal", hemisphere: "left", depth: "middle", priority: 1 },
      semanticContext(
        "Authentication",
        "Auth",
        "Validates identity, token integrity, and request authorization.",
        [
          metric("validation-latency", "Validation latency", 38, "ms"),
          metric("token-valid", "Token valid", true),
          metric("denied-requests", "Denied requests", 0.12, "%"),
        ],
        [
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.apiGateway,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService,
        ],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.gatewayToAuthentication,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.authenticationToCore,
        ],
        ["identity", "token", "authorization"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService,
      "Core Service",
      "process",
      0.56,
      1,
      { region: "central", hemisphere: "center", depth: "middle", priority: 1 },
      semanticContext(
        "Core Service",
        "Core",
        "Coordinates business rules, cache decisions, persistence, and external enrichment.",
        [
          metric("processing-time", "Processing time", 44, "ms"),
          metric("active-requests", "Active requests", 36, "requests"),
          metric("success-rate", "Success rate", 99.72, "%"),
        ],
        [
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.authentication,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.cache,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.database,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.externalAiApi,
          NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.response,
        ],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.authenticationToCore,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToCache,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.cacheToCore,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToDatabase,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.databaseToCore,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToExternal,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.externalToCore,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToResponse,
        ],
        ["business-rules", "orchestration", "decision"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.cache,
      "Cache",
      "cache",
      0.38,
      0.82,
      { region: "parietal", hemisphere: "left", depth: "deep", priority: 0.96 },
      semanticContext(
        "Cache",
        "Cache",
        "Provides fast reads, cache-hit resolution, and result storage.",
        [
          metric("cache-hit-rate", "Hit rate", 91.6, "%"),
          metric("cache-read-latency", "Read latency", 8, "ms"),
          metric("cache-entries", "Entries", 42840, "entries"),
        ],
        [NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToCache,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.cacheToCore,
        ],
        ["cache", "fast-read", "result-store"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.database,
      "Database",
      "database",
      0.36,
      0.86,
      { region: "inner", hemisphere: "center", depth: "deep", priority: 0.98 },
      semanticContext(
        "Database",
        "Database",
        "Loads durable context and provides persistence when cache data is unavailable.",
        [
          metric("query-latency", "Query latency", 42, "ms"),
          metric("active-connections", "Active connections", 18, "connections"),
          metric("database-availability", "Availability", 99.99, "%"),
        ],
        [NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToDatabase,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.databaseToCore,
        ],
        ["persistence", "context", "fallback"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.externalAiApi,
      "External AI/API",
      "external-service",
      0.44,
      0.92,
      { region: "frontal", hemisphere: "right", depth: "surface", priority: 1 },
      semanticContext(
        "External AI/API",
        "External AI",
        "Provides external inference and enrichment with a localized timeout boundary.",
        [
          metric("external-response-latency", "Response latency", 320, "ms"),
          metric("external-timeout-rate", "Timeout rate", 0.4, "%"),
          metric("external-availability", "Availability", 99.8, "%"),
        ],
        [NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService],
        [
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToExternal,
          NEURAL_CORE_OPERATIONAL_ROUTE_IDS.externalToCore,
        ],
        ["external-service", "inference", "enrichment", "timeout-boundary"],
      ),
    ),
    cluster(
      NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.response,
      "Response",
      "output",
      0.34,
      0.84,
      { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.98 },
      semanticContext(
        "Response",
        "Response",
        "Assembles and returns the final status and payload to the client.",
        [
          metric("total-latency", "Total latency", 430, "ms"),
          metric("status-code", "Status code", 200),
          metric("response-payload-size", "Payload size", 26.8, "KB"),
        ],
        [NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService],
        [NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToResponse],
        ["response", "delivery", "status"],
      ),
    ),
  ];

  const synapses: NeuralCoreSynapse[] = [
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.clientToGateway, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.clientRequest, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.apiGateway, 0.82),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.gatewayToAuthentication, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.apiGateway, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.authentication, 0.84),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.authenticationToCore, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.authentication, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, 0.9),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToCache, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.cache, 0.82),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.cacheToCore, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.cache, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, 0.84),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToDatabase, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.database, 0.76),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.databaseToCore, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.database, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, 0.8),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToExternal, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.externalAiApi, 0.9),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.externalToCore, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.externalAiApi, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, 0.88),
    synapse(NEURAL_CORE_OPERATIONAL_ROUTE_IDS.coreToResponse, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.coreService, NEURAL_CORE_OPERATIONAL_CLUSTER_IDS.response, 0.92),
  ];

  return {
    clusters,
    synapses,
    transmissions: [],
    pathways: [{
      id: NEURAL_CORE_OPERATIONAL_PATHWAY_ID,
      label: "Operational request pathway",
      status: "idle",
      clusterIds: clusters.map(({ id }) => id),
      synapseIds: synapses.map(({ id }) => id),
      activity: 0.42,
      metadata: { executionModel: "deterministic" },
    }],
    status: "idle",
    globalActivity: 0.42,
    metadata: {
      domain: "operational-request-processing",
      runtimeEnabled: false,
    },
  };
};
