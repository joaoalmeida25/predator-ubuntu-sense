import type {
  NeuralCoreDemoOption,
  NeuralCoreDemoScenario,
} from "./neural-core-demo-state.types";

export const DEFAULT_NEURAL_CORE_DEMO_SCENARIO: NeuralCoreDemoScenario = "none";

export const NEURAL_CORE_DEMO_OPTIONS: readonly NeuralCoreDemoOption[] = [
  {
    scenario: "none",
    label: "Default",
    description: "Base neural visualization without semantic propagation.",
  },
  {
    scenario: "data-flow",
    label: "Data Flow",
    description: "Signal flow across input, data, and output clusters.",
  },
  {
    scenario: "function-execution",
    label: "Function Execution",
    shortLabel: "Function",
    description: "Function activation with incoming data and propagated results.",
  },
  {
    scenario: "memory-sync",
    label: "Memory Sync",
    shortLabel: "Memory",
    description: "Bidirectional synchronization between processing and memory clusters.",
  },
  {
    scenario: "process-pipeline",
    label: "Process Pipeline",
    shortLabel: "Pipeline",
    description: "Sequential propagation through multiple functional clusters.",
  },
  {
    scenario: "warning-state",
    label: "Warning",
    description: "Controlled instability while the signal path remains operational.",
  },
  {
    scenario: "error-state",
    label: "Error",
    description: "A perceptible propagation failure at the processing destination.",
  },
  {
    scenario: "success-state",
    label: "Success",
    description: "Completed propagation with a stabilized output destination.",
  },
  {
    scenario: "operational-flow",
    label: "Operational Flow",
    shortLabel: "Operational",
    description: "A complete request-processing flow with success, degraded, and failure-recovery executions.",
  },
];
