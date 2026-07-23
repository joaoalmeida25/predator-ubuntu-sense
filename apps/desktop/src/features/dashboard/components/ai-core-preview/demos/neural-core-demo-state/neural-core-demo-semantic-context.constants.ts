import type {
  NeuralCoreClusterSemanticContext,
  NeuralCoreMetric,
  NeuralCoreOperationalImpact,
} from "../../domain/semantic/neural-core-semantic-context.types";

const metric = (
  id: string,
  label: string,
  value: NeuralCoreMetric["value"],
  unit?: string,
  trend: NeuralCoreMetric["trend"] = "stable",
): NeuralCoreMetric => ({ id, label, value, ...(unit ? { unit } : {}), trend });

const context = (
  name: string,
  shortName: string,
  description: string,
  metrics: readonly NeuralCoreMetric[],
  relations: {
    clusters?: readonly string[];
    synapses?: readonly string[];
    pathways?: readonly string[];
  },
  impact?: NeuralCoreOperationalImpact,
): NeuralCoreClusterSemanticContext => ({
  name,
  shortName,
  description,
  metrics,
  ...(impact ? { impact } : {}),
  ...(relations.clusters ? { relatedClusterIds: relations.clusters } : {}),
  ...(relations.synapses ? { relatedSynapseIds: relations.synapses } : {}),
  ...(relations.pathways ? { relatedPathwayIds: relations.pathways } : {}),
});

export const NEURAL_CORE_DEMO_CLUSTER_SEMANTIC_CONTEXTS: Readonly<
Record<string, NeuralCoreClusterSemanticContext>
> = {
  "data-input": context(
    "Input Gateway", "Input", "Receives data for the demonstration flow.",
    [metric("throughput", "Throughput", 860, "events/s"), metric("latency", "Latency", 12, "ms")],
    { clusters: ["data-buffer"], synapses: ["synapse:data-ingest"], pathways: ["data-flow-pathway"] },
  ),
  "data-buffer": context(
    "Data Normalizer", "Data", "Buffers and normalizes incoming data before delivery.",
    [metric("queue-depth", "Queue depth", 18, "events"), metric("throughput", "Throughput", 824, "events/s")],
    { clusters: ["data-input", "data-output"], synapses: ["synapse:data-ingest", "synapse:data-emit"], pathways: ["data-flow-pathway"] },
  ),
  "data-output": context(
    "Response Output", "Output", "Publishes the normalized result.",
    [metric("delivery-rate", "Delivery rate", 99.4, "%"), metric("latency", "Latency", 9, "ms")],
    { clusters: ["data-buffer"], synapses: ["synapse:data-emit"], pathways: ["data-flow-pathway"] },
  ),
  "function-input": context(
    "Input Gateway", "Input", "Receives calls for function execution.",
    [metric("requests", "Requests", 420, "req/s"), metric("latency", "Latency", 14, "ms")],
    { clusters: ["function-core"], synapses: ["synapse:function-call"], pathways: ["function-pathway"] },
  ),
  "function-core": context(
    "Function Executor", "Function", "Executes the requested operation and produces a result.",
    [metric("execution-time", "Execution time", 38, "ms"), metric("success-rate", "Success rate", 99.2, "%")],
    { clusters: ["function-input", "function-output"], synapses: ["synapse:function-call", "synapse:function-result"], pathways: ["function-pathway"] },
  ),
  "function-output": context(
    "Response Output", "Output", "Delivers the completed function result.",
    [metric("throughput", "Throughput", 414, "responses/s"), metric("error-rate", "Error rate", 0.8, "%")],
    { clusters: ["function-core"], synapses: ["synapse:function-result"], pathways: ["function-pathway"] },
  ),
  "memory-process": context(
    "Processing Service", "Process", "Prepares values for memory access and synchronization.",
    [metric("operations", "Operations", 286, "ops/s"), metric("latency", "Latency", 21, "ms")],
    { clusters: ["memory-store"], synapses: ["synapse:memory-link"], pathways: ["memory-pathway"] },
  ),
  "memory-store": context(
    "Memory Store", "Memory", "Consolidates persistent working values and internal associations.",
    [metric("usage", "Memory usage", 68, "%"), metric("hit-rate", "Hit rate", 96.4, "%")],
    { clusters: ["memory-process", "memory-sync"], synapses: ["synapse:memory-link", "synapse:memory-commit"], pathways: ["memory-pathway"] },
  ),
  "memory-sync": context(
    "Synchronization Output", "Sync", "Commits consolidated memory changes to downstream consumers.",
    [metric("sync-rate", "Sync rate", 124, "ops/s"), metric("lag", "Synchronization lag", 34, "ms")],
    { clusters: ["memory-store"], synapses: ["synapse:memory-commit"], pathways: ["memory-pathway"] },
  ),
  "pipeline-input": context(
    "Input Gateway", "Input", "Accepts work entering the processing pipeline.",
    [metric("requests", "Requests", 730, "req/s"), metric("latency", "Latency", 11, "ms")],
    { clusters: ["pipeline-data"], synapses: ["synapse:pipeline-ingest"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-data": context(
    "Data Normalizer", "Data", "Validates and normalizes pipeline input.",
    [metric("throughput", "Throughput", 712, "items/s"), metric("rejected", "Rejected", 1.1, "%")],
    { clusters: ["pipeline-input", "pipeline-function"], synapses: ["synapse:pipeline-ingest", "synapse:pipeline-transfer"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-function": context(
    "Function Executor", "Function", "Applies the pipeline transformation.",
    [metric("execution-time", "Execution time", 31, "ms"), metric("success-rate", "Success rate", 98.9, "%")],
    { clusters: ["pipeline-data", "pipeline-process"], synapses: ["synapse:pipeline-transfer", "synapse:pipeline-execute"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-process": context(
    "Processing Service", "Process", "Coordinates the main pipeline operation.",
    [metric("throughput", "Throughput", 690, "items/s"), metric("latency", "Latency", 48, "ms")],
    { clusters: ["pipeline-function", "pipeline-memory"], synapses: ["synapse:pipeline-execute", "synapse:pipeline-store"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-memory": context(
    "Memory Store", "Memory", "Persists intermediate pipeline state.",
    [metric("write-rate", "Write rate", 675, "ops/s"), metric("usage", "Memory usage", 63, "%")],
    { clusters: ["pipeline-process", "pipeline-decision"], synapses: ["synapse:pipeline-store", "synapse:pipeline-resolve"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-decision": context(
    "Decision Engine", "Decision", "Resolves the final pipeline outcome.",
    [metric("decisions", "Decisions", 668, "ops/s"), metric("confidence", "Confidence", 94.8, "%")],
    { clusters: ["pipeline-memory", "pipeline-output"], synapses: ["synapse:pipeline-resolve", "synapse:pipeline-emit"], pathways: ["pipeline-pathway"] },
  ),
  "pipeline-output": context(
    "Response Output", "Output", "Publishes the completed pipeline response.",
    [metric("delivery-rate", "Delivery rate", 98.7, "%"), metric("latency", "Latency", 10, "ms")],
    { clusters: ["pipeline-decision"], synapses: ["synapse:pipeline-emit"], pathways: ["pipeline-pathway"] },
  ),
  "warning-input": context(
    "Input Gateway", "Input", "Feeds the service while degraded operation is observed.",
    [metric("requests", "Requests", 360, "req/s"), metric("latency", "Latency", 18, "ms", "up")],
    { clusters: ["warning-service"], synapses: ["synapse:warning-route"], pathways: ["warning-pathway"] },
  ),
  "warning-service": context(
    "Delayed Processing Service", "Delayed", "Continues processing with elevated latency and reduced capacity.",
    [metric("latency", "Latency", 780, "ms", "up"), metric("health", "Health score", 68, "%", "down")],
    { clusters: ["warning-input", "warning-output"], synapses: ["synapse:warning-route", "synapse:warning-output-route"], pathways: ["warning-pathway"] },
    { level: "medium", summary: "Response delivery is delayed.", affectedClusterIds: ["warning-output"], affectedPathwayIds: ["warning-pathway"] },
  ),
  "warning-output": context(
    "Partial Response Output", "Output", "Delivers available responses at reduced throughput.",
    [metric("delivery-rate", "Delivery rate", 82.6, "%", "down"), metric("latency", "Latency", 410, "ms", "up")],
    { clusters: ["warning-service"], synapses: ["synapse:warning-output-route"], pathways: ["warning-pathway"] },
    { level: "low", summary: "Some responses arrive late.", affectedPathwayIds: ["warning-pathway"] },
  ),
  "error-input": context(
    "Input Gateway", "Input", "Receives requests before the localized failure.",
    [metric("requests", "Requests", 310, "req/s"), metric("queue-depth", "Queue depth", 42, "requests", "up")],
    { clusters: ["error-service"], synapses: ["synapse:error-route"], pathways: ["error-pathway"] },
  ),
  "error-service": context(
    "Affected Processing Service", "Failure", "A critical service region has lost reliable connectivity.",
    [metric("error-rate", "Error rate", 67.8, "%", "up"), metric("health", "Health score", 40, "%", "down")],
    { clusters: ["error-input", "error-output"], synapses: ["synapse:error-route", "synapse:error-output-route"], pathways: ["error-pathway"] },
    { level: "critical", summary: "Output delivery is blocked or incomplete.", affectedClusterIds: ["error-output"], affectedPathwayIds: ["error-pathway"] },
  ),
  "error-output": context(
    "Response Output", "Output", "Exposes the reduced result of the failed operation.",
    [metric("delivery-rate", "Delivery rate", 31.2, "%", "down"), metric("error-rate", "Error rate", 68.8, "%", "up")],
    { clusters: ["error-service"], synapses: ["synapse:error-output-route"], pathways: ["error-pathway"] },
    { level: "high", summary: "Most responses cannot be delivered.", affectedPathwayIds: ["error-pathway"] },
  ),
  "success-process": context(
    "Processing Service", "Process", "Completes the operation before final resolution.",
    [metric("throughput", "Throughput", 540, "ops/s"), metric("error-rate", "Error rate", 0.2, "%")],
    { clusters: ["success-decision"], synapses: ["synapse:success-resolve"], pathways: ["success-pathway"] },
  ),
  "success-decision": context(
    "Decision Engine", "Decision", "Confirms the successful operational result.",
    [metric("confidence", "Confidence", 98.6, "%"), metric("latency", "Latency", 19, "ms")],
    { clusters: ["success-process", "success-output"], synapses: ["synapse:success-resolve", "synapse:success-emit"], pathways: ["success-pathway"] },
  ),
  "success-output": context(
    "Response Output", "Output", "Publishes the completed and synchronized response.",
    [metric("delivery-rate", "Delivery rate", 99.8, "%"), metric("latency", "Latency", 8, "ms")],
    { clusters: ["success-decision"], synapses: ["synapse:success-emit"], pathways: ["success-pathway"] },
    { level: "none", summary: "The operation completed normally.", affectedPathwayIds: ["success-pathway"] },
  ),
};
