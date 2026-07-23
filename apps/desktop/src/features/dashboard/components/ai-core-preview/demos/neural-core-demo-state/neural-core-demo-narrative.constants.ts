import type {
  NeuralCoreClusterVisualBehaviorConfig,
  NeuralCoreNarrative,
  NeuralCoreNarrativePhase,
} from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreDemoScenario } from "./neural-core-demo-state.types";

const BURST_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "burst",
  nodeScale: 1.14,
  hubScale: 1.24,
  internalConnectionEmphasis: 0.72,
  pulseFrequency: 2.8,
  pulseVariance: 0.42,
  persistence: 0.08,
  synchronization: 0.28,
};

const PERSISTENT_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "persistent",
  nodeScale: 1.18,
  hubScale: 1.26,
  internalConnectionEmphasis: 0.86,
  pulseFrequency: 0.72,
  pulseVariance: 0.08,
  persistence: 0.92,
  synchronization: 0.68,
};

const SEQUENTIAL_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "sequential",
  nodeScale: 1.1,
  hubScale: 1.18,
  internalConnectionEmphasis: 0.58,
  pulseFrequency: 1.45,
  pulseVariance: 0.16,
  persistence: 0.24,
  synchronization: 0.46,
};

const UNSTABLE_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "unstable",
  nodeScale: 1.06,
  hubScale: 1.12,
  internalConnectionEmphasis: 0.42,
  pulseFrequency: 0.68,
  pulseVariance: 0.62,
  persistence: 0.18,
  synchronization: 0.16,
};

const DEGRADING_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "degrading",
  nodeScale: 0.82,
  hubScale: 0.88,
  internalConnectionEmphasis: 0.18,
  pulseFrequency: 0.32,
  pulseVariance: 0.48,
  persistence: 0.72,
  synchronization: 0.08,
};

const SYNCHRONIZED_BEHAVIOR: NeuralCoreClusterVisualBehaviorConfig = {
  behavior: "synchronized",
  nodeScale: 1.08,
  hubScale: 1.16,
  internalConnectionEmphasis: 0.64,
  pulseFrequency: 0.58,
  pulseVariance: 0.02,
  persistence: 0.62,
  synchronization: 0.94,
};

const emphasis = (
  cluster: number,
  route: number,
  contextDim: number,
  internalActivity: number,
): NonNullable<NeuralCoreNarrativePhase["emphasis"]> => ({
  cluster,
  route,
  contextDim,
  internalActivity,
});

const phase = (
  value: NeuralCoreNarrativePhase,
): NeuralCoreNarrativePhase => value;

const pipelineProgress = (
  current: number,
): NonNullable<NeuralCoreNarrativePhase["progress"]> => ({
  current,
  total: 7,
  label: "Pipeline",
});

export const NEURAL_CORE_DEMO_NARRATIVES: Record<
  Exclude<NeuralCoreDemoScenario, "none">,
  NeuralCoreNarrative
> = {
  "data-flow": {
    id: "narrative:data-flow",
    durationSeconds: 6.8,
    loop: true,
    phases: [
      phase({
        id: "data-receiving",
        kind: "receiving",
        label: "Receiving input",
        description: "Capturing a new data signal",
        startSeconds: 0,
        durationSeconds: 1.55,
        clusterIds: ["data-input"],
        emphasis: emphasis(0.82, 0.34, 0.36, 0.38),
        clusterBehavior: SEQUENTIAL_BEHAVIOR,
      }),
      phase({
        id: "data-transmitting",
        kind: "transmitting",
        label: "Transmitting data",
        description: "Moving information through the buffer",
        startSeconds: 1.55,
        durationSeconds: 1.75,
        clusterIds: ["data-buffer"],
        synapseIds: ["synapse:data-ingest"],
        emphasis: emphasis(0.76, 0.94, 0.48, 0.42),
        clusterBehavior: SEQUENTIAL_BEHAVIOR,
        arrivalReaction: 0.78,
      }),
      phase({
        id: "data-delivering",
        kind: "completing",
        label: "Delivering output",
        description: "The transformed signal reached its destination",
        startSeconds: 3.3,
        durationSeconds: 1.7,
        clusterIds: ["data-output"],
        synapseIds: ["synapse:data-emit"],
        emphasis: emphasis(0.88, 0.92, 0.42, 0.48),
        clusterBehavior: SYNCHRONIZED_BEHAVIOR,
        arrivalReaction: 0.9,
      }),
      phase({
        id: "data-stable",
        kind: "synchronizing",
        label: "Data flow stable",
        description: "Input and output are synchronized",
        startSeconds: 5,
        durationSeconds: 1.8,
        pathwayIds: ["data-flow-pathway"],
        emphasis: emphasis(0.3, 0.5, 0.12, 0.34),
      }),
    ],
  },
  "function-execution": {
    id: "narrative:function-execution",
    durationSeconds: 7.8,
    loop: true,
    phases: [
      phase({
        id: "function-receiving",
        kind: "receiving",
        label: "Receiving input",
        description: "A new request is entering the function",
        startSeconds: 0.65,
        durationSeconds: 1.05,
        clusterIds: ["function-input"],
        emphasis: emphasis(0.82, 0.3, 0.38, 0.34),
        clusterBehavior: SEQUENTIAL_BEHAVIOR,
      }),
      phase({
        id: "function-call-transmitting",
        kind: "transmitting",
        label: "Routing function call",
        description: "The request is moving to the execution region",
        startSeconds: 1.7,
        durationSeconds: 0.75,
        clusterIds: ["function-core"],
        synapseIds: ["synapse:function-call"],
        emphasis: emphasis(0.58, 1, 0.58, 0.3),
        arrivalReaction: 0.86,
      }),
      phase({
        id: "function-executing",
        kind: "executing",
        label: "Executing function",
        description: "Internal hubs are processing the request",
        startSeconds: 2.45,
        durationSeconds: 2.05,
        clusterIds: ["function-core"],
        emphasis: emphasis(1, 0.34, 0.68, 1),
        clusterBehavior: BURST_BEHAVIOR,
      }),
      phase({
        id: "function-producing",
        kind: "transmitting",
        label: "Producing output",
        description: "The result is leaving the execution region",
        startSeconds: 4.5,
        durationSeconds: 0.8,
        clusterIds: ["function-output"],
        synapseIds: ["synapse:function-result"],
        emphasis: emphasis(0.62, 1, 0.54, 0.34),
        arrivalReaction: 0.9,
      }),
      phase({
        id: "function-complete",
        kind: "completing",
        label: "Output delivered",
        description: "Function execution completed successfully",
        startSeconds: 5.3,
        durationSeconds: 1.05,
        clusterIds: ["function-output"],
        emphasis: emphasis(0.86, 0.38, 0.32, 0.48),
        clusterBehavior: SYNCHRONIZED_BEHAVIOR,
      }),
    ],
  },
  "memory-sync": {
    id: "narrative:memory-sync",
    durationSeconds: 11.5,
    loop: true,
    phases: [
      phase({
        id: "memory-reading",
        kind: "reading",
        label: "Reading memory",
        description: "Retrieving data from the memory region",
        startSeconds: 0.75,
        durationSeconds: 1.65,
        clusterIds: ["memory-process", "memory-store"],
        synapseIds: ["synapse:memory-link"],
        emphasis: emphasis(0.72, 0.92, 0.54, 0.4),
        arrivalReaction: 0.72,
      }),
      phase({
        id: "memory-consolidating",
        kind: "consolidating",
        label: "Memory consolidation",
        description: "Reinforcing internal neural connections",
        startSeconds: 2.4,
        durationSeconds: 4.75,
        clusterIds: ["memory-store"],
        emphasis: emphasis(1, 0.28, 0.74, 0.92),
        clusterBehavior: PERSISTENT_BEHAVIOR,
      }),
      phase({
        id: "memory-writing",
        kind: "writing",
        label: "Writing memory",
        description: "Committing consolidated data",
        startSeconds: 7.15,
        durationSeconds: 0.9,
        clusterIds: ["memory-sync"],
        synapseIds: ["synapse:memory-commit"],
        emphasis: emphasis(0.66, 0.94, 0.52, 0.5),
        arrivalReaction: 0.8,
      }),
      phase({
        id: "memory-synchronizing",
        kind: "synchronizing",
        label: "Synchronizing memory",
        description: "Aligning the committed memory state",
        startSeconds: 8.05,
        durationSeconds: 1.1,
        clusterIds: ["memory-store", "memory-sync"],
        emphasis: emphasis(0.84, 0.48, 0.36, 0.74),
        clusterBehavior: SYNCHRONIZED_BEHAVIOR,
      }),
    ],
  },
  "process-pipeline": {
    id: "narrative:process-pipeline",
    durationSeconds: 11.5,
    loop: true,
    phases: [
      phase({ id: "pipeline-receiving", kind: "receiving", label: "Receiving input", description: "Accepting the first pipeline payload", startSeconds: 0.55, durationSeconds: 1, clusterIds: ["pipeline-input"], emphasis: emphasis(0.9, 0.26, 0.42, 0.38), clusterBehavior: SEQUENTIAL_BEHAVIOR, progress: pipelineProgress(1) }),
      phase({ id: "pipeline-normalizing", kind: "transmitting", label: "Normalizing data", description: "Preparing data for execution", startSeconds: 1.55, durationSeconds: 1, clusterIds: ["pipeline-data"], synapseIds: ["synapse:pipeline-ingest"], emphasis: emphasis(0.86, 0.84, 0.46, 0.48), clusterBehavior: SEQUENTIAL_BEHAVIOR, arrivalReaction: 0.64, progress: pipelineProgress(2) }),
      phase({ id: "pipeline-executing", kind: "executing", label: "Executing function", description: "Applying the pipeline transformation", startSeconds: 2.55, durationSeconds: 1, clusterIds: ["pipeline-function"], synapseIds: ["synapse:pipeline-transfer"], emphasis: emphasis(0.94, 0.76, 0.48, 0.82), clusterBehavior: BURST_BEHAVIOR, arrivalReaction: 0.68, progress: pipelineProgress(3) }),
      phase({ id: "pipeline-processing", kind: "executing", label: "Processing result", description: "Combining intermediate output", startSeconds: 3.55, durationSeconds: 1, clusterIds: ["pipeline-process"], synapseIds: ["synapse:pipeline-execute"], emphasis: emphasis(0.94, 0.76, 0.48, 0.76), clusterBehavior: SEQUENTIAL_BEHAVIOR, arrivalReaction: 0.66, progress: pipelineProgress(4) }),
      phase({ id: "pipeline-writing", kind: "writing", label: "Writing memory", description: "Persisting the processed result", startSeconds: 4.55, durationSeconds: 1, clusterIds: ["pipeline-memory"], synapseIds: ["synapse:pipeline-store"], emphasis: emphasis(0.94, 0.78, 0.52, 0.8), clusterBehavior: PERSISTENT_BEHAVIOR, arrivalReaction: 0.72, progress: pipelineProgress(5) }),
      phase({ id: "pipeline-deciding", kind: "deciding", label: "Resolving decision", description: "Selecting the final result path", startSeconds: 5.55, durationSeconds: 1, clusterIds: ["pipeline-decision"], synapseIds: ["synapse:pipeline-resolve"], emphasis: emphasis(0.94, 0.8, 0.5, 0.68), clusterBehavior: SEQUENTIAL_BEHAVIOR, arrivalReaction: 0.7, progress: pipelineProgress(6) }),
      phase({ id: "pipeline-output", kind: "completing", label: "Producing output", description: "Delivering the completed pipeline result", startSeconds: 6.55, durationSeconds: 1, clusterIds: ["pipeline-output"], synapseIds: ["synapse:pipeline-emit"], emphasis: emphasis(1, 0.9, 0.48, 0.62), clusterBehavior: SYNCHRONIZED_BEHAVIOR, arrivalReaction: 0.9, progress: pipelineProgress(7) }),
      phase({ id: "pipeline-complete", kind: "synchronizing", label: "Pipeline complete", description: "All pipeline stages are coherent", startSeconds: 7.55, durationSeconds: 1.8, pathwayIds: ["pipeline-pathway"], emphasis: emphasis(0.38, 0.82, 0.18, 0.46), progress: pipelineProgress(7) }),
    ],
  },
  "warning-state": {
    id: "narrative:warning-state",
    durationSeconds: 9.5,
    loop: true,
    phases: [
      phase({ id: "warning-delayed", kind: "warning", label: "Processing delayed", description: "The operation continues with increased latency", startSeconds: 1, durationSeconds: 2.3, clusterIds: ["warning-service"], synapseIds: ["synapse:warning-route"], emphasis: emphasis(0.78, 0.64, 0.42, 0.48), clusterBehavior: UNSTABLE_BEHAVIOR }),
      phase({ id: "warning-degraded", kind: "warning", label: "Degraded connection", description: "Signal continuity is temporarily reduced", startSeconds: 3.3, durationSeconds: 3.4, clusterIds: ["warning-service", "warning-output"], synapseIds: ["synapse:warning-output-route"], emphasis: emphasis(0.82, 0.76, 0.5, 0.54), clusterBehavior: UNSTABLE_BEHAVIOR, arrivalReaction: 0.44 }),
      phase({ id: "warning-recovering", kind: "recovering", label: "Partial recovery", description: "The affected route is regaining stability", startSeconds: 6.7, durationSeconds: 2.8, clusterIds: ["warning-service"], synapseIds: ["synapse:warning-output-route"], emphasis: emphasis(0.58, 0.48, 0.28, 0.4), clusterBehavior: SEQUENTIAL_BEHAVIOR }),
    ],
  },
  "error-state": {
    id: "narrative:error-state",
    durationSeconds: 8.8,
    loop: false,
    phases: [
      phase({ id: "error-failure", kind: "failing", label: "Critical failure", description: "The operation can no longer complete normally", startSeconds: 1, durationSeconds: 2, clusterIds: ["error-service"], synapseIds: ["synapse:error-route"], emphasis: emphasis(0.82, 0.72, 0.54, 0.42), clusterBehavior: UNSTABLE_BEHAVIOR }),
      phase({ id: "error-connection-lost", kind: "failing", label: "Connection lost", description: "The output route has lost continuity", startSeconds: 3, durationSeconds: 2.1, clusterIds: ["error-service"], synapseIds: ["synapse:error-output-route"], emphasis: emphasis(0.88, 0.84, 0.66, 0.32), clusterBehavior: DEGRADING_BEHAVIOR }),
      phase({ id: "error-region-degraded", kind: "failing", label: "Neural region degraded", description: "The critical region remains isolated", startSeconds: 5.1, durationSeconds: 3.7, clusterIds: ["error-service"], emphasis: emphasis(1, 0.42, 0.76, 0.24), clusterBehavior: DEGRADING_BEHAVIOR, holdAtEnd: true }),
    ],
  },
  "success-state": {
    id: "narrative:success-state",
    durationSeconds: 8,
    loop: false,
    phases: [
      phase({ id: "success-completed", kind: "completing", label: "Process completed", description: "The final transmission reached its destination", startSeconds: 0, durationSeconds: 1.2, clusterIds: ["success-output"], synapseIds: ["synapse:success-emit"], emphasis: emphasis(0.9, 0.92, 0.34, 0.6), clusterBehavior: SYNCHRONIZED_BEHAVIOR, arrivalReaction: 1 }),
      phase({ id: "success-synchronizing", kind: "synchronizing", label: "Synchronizing network", description: "Relevant regions are aligning their state", startSeconds: 1.2, durationSeconds: 2.6, clusterIds: ["success-decision", "success-output"], pathwayIds: ["success-pathway"], emphasis: emphasis(0.76, 0.76, 0.22, 0.72), clusterBehavior: SYNCHRONIZED_BEHAVIOR }),
      phase({ id: "success-stable", kind: "completing", label: "System stable", description: "The network returned to a coherent overview", startSeconds: 3.8, durationSeconds: 4.2, clusterIds: ["success-decision", "success-output"], pathwayIds: ["success-pathway"], emphasis: emphasis(0.46, 0.52, 0.08, 0.48), clusterBehavior: SYNCHRONIZED_BEHAVIOR, holdAtEnd: true }),
    ],
  },
};
