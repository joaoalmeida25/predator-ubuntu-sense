import { DEFAULT_NEURAL_CORE_STATE } from "../../domain/contract/neural-core-contract.constants";
import type {
  NeuralCoreAccentColor,
  NeuralCoreEntity,
  NeuralCoreEntityKind,
  NeuralCoreMode,
  NeuralCoreSignal,
  NeuralCoreSignalKind,
  NeuralCoreState,
  NeuralCoreStatus,
} from "../../domain/contract/neural-core-contract.types";
import type {
  NeuralCoreCluster,
  NeuralCoreClusterPositionHint,
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreSynapseKind,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
  NeuralCoreTransmission,
} from "../../domain/topology/neural-core-topology.types";
import { NEURAL_CORE_DEMO_CHOREOGRAPHIES } from "./neural-core-demo-choreography.constants";
import { NEURAL_CORE_DEMO_SCENE_DIRECTIONS } from "./neural-core-demo-scene-direction.constants";
import { NEURAL_CORE_DEMO_NARRATIVES } from "./neural-core-demo-narrative.constants";
import { DEFAULT_NEURAL_CORE_DEMO_SCENARIO } from "./neural-core-demo-state.constants";
import { NEURAL_CORE_DEMO_CLUSTER_SEMANTIC_CONTEXTS } from "./neural-core-demo-semantic-context.constants";
import type {
  NeuralCoreDemoDefinition,
  NeuralCoreDemoScenario,
} from "./neural-core-demo-state.types";

interface NeuralCoreDemoClusterDefinition {
  id: string;
  label: string;
  kind: NeuralCoreEntityKind;
  status?: NeuralCoreStatus;
  activity: number;
  importance: number;
  health?: number;
  plasticity?: number;
  positionHint: NeuralCoreClusterPositionHint;
}

interface NeuralCoreDemoRouteDefinition {
  id: string;
  from: string;
  to: string;
  kind: NeuralCoreSignalKind;
  synapseKind?: NeuralCoreSynapseKind;
  status?: NeuralCoreStatus;
  intensity: number;
  progress: number;
  speed: number;
  weight?: number;
  conductivity?: number;
  plasticity?: number;
  direction?: NeuralCoreSynapse["direction"];
  transmissionDirection?: NeuralCoreTransmission["direction"];
}

interface NeuralCoreDemoStateDefinition {
  scenario: Exclude<NeuralCoreDemoScenario, "none">;
  mode: NeuralCoreMode;
  accentColor: NeuralCoreAccentColor;
  globalActivity: number;
  complexity: number;
  focusEntityId: string;
  pathwayId: string;
  clusters: readonly NeuralCoreDemoClusterDefinition[];
  routes: readonly NeuralCoreDemoRouteDefinition[];
}

const mapStatus = (status: NeuralCoreStatus = "active"): NeuralCoreTopologyStatus => {
  return status === "neutral" ? "idle" : status;
};

const mapMode = (mode: NeuralCoreMode): NeuralCoreTopologyStatus => {
  switch (mode) {
    case "idle":
      return "idle";
    case "observing":
      return "active";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "thinking":
    case "processing":
    case "learning":
    case "synchronizing":
      return "processing";
  }
};

const createEntity = (
  definition: NeuralCoreDemoClusterDefinition,
): NeuralCoreEntity => {
  const status = definition.status ?? "active";
  return {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    status,
    activity: definition.activity,
    importance: definition.importance,
    health: definition.health
      ?? (status === "error" ? 0.34 : status === "warning" ? 0.64 : 0.94),
  };
};

const createCluster = (
  definition: NeuralCoreDemoClusterDefinition,
): NeuralCoreCluster => {
  const entity = createEntity(definition);
  return {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    status: mapStatus(definition.status),
    activity: definition.activity,
    importance: definition.importance,
    stability: entity.health,
    plasticity: definition.plasticity,
    positionHint: definition.positionHint,
    semanticContext: NEURAL_CORE_DEMO_CLUSTER_SEMANTIC_CONTEXTS[definition.id],
    entityIds: [definition.id],
  };
};

const createSignal = (
  definition: NeuralCoreDemoRouteDefinition,
): NeuralCoreSignal => {
  return {
    id: definition.id,
    from: definition.from,
    to: definition.to,
    kind: definition.kind,
    status: definition.status ?? "active",
    intensity: definition.intensity,
    progress: definition.progress,
    speed: definition.speed,
    metadata: {
      synapseKind: definition.synapseKind ?? "excitatory",
      direction: definition.direction ?? "forward",
      weight: definition.weight ?? definition.intensity,
      conductivity: definition.conductivity ?? definition.speed,
      plasticity: definition.plasticity ?? 0.5,
      ...(definition.transmissionDirection
        ? { transmissionDirection: definition.transmissionDirection }
        : {}),
    },
  };
};

const createSynapse = (
  definition: NeuralCoreDemoRouteDefinition,
): NeuralCoreSynapse => {
  return {
    id: `synapse:${definition.id}`,
    fromClusterId: definition.from,
    toClusterId: definition.to,
    kind: definition.synapseKind ?? "excitatory",
    status: mapStatus(definition.status),
    weight: definition.weight ?? definition.intensity,
    conductivity: definition.conductivity ?? definition.speed,
    plasticity: definition.plasticity ?? 0.5,
    direction: definition.direction ?? "forward",
  };
};

const createTransmission = (
  definition: NeuralCoreDemoRouteDefinition,
): NeuralCoreTransmission => {
  return {
    id: definition.id,
    synapseId: `synapse:${definition.id}`,
    kind: definition.kind,
    status: mapStatus(definition.status),
    intensity: definition.intensity,
    progress: definition.progress,
    speed: definition.speed,
    direction: definition.transmissionDirection,
  };
};

const createPathway = (
  definition: NeuralCoreDemoStateDefinition,
): NeuralCorePathway => {
  const clusterIds = definition.routes.reduce<string[]>((ids, route) => {
    if (!ids.includes(route.from)) {
      ids.push(route.from);
    }
    if (!ids.includes(route.to)) {
      ids.push(route.to);
    }
    return ids;
  }, []);
  return {
    id: definition.pathwayId,
    label: `${definition.scenario} pathway`,
    status: mapMode(definition.mode),
    clusterIds,
    synapseIds: definition.routes.map(({ id }) => `synapse:${id}`),
    activity: definition.globalActivity,
  };
};

const createDemoState = (
  definition: NeuralCoreDemoStateDefinition,
): NeuralCoreState => {
  const entities = definition.clusters.map(createEntity);
  const signals = definition.routes.map(createSignal);
  const topology: NeuralCoreTopology = {
    clusters: definition.clusters.map(createCluster),
    synapses: definition.routes.map(createSynapse),
    transmissions: definition.routes.map(createTransmission),
    pathways: [createPathway(definition)],
    status: mapMode(definition.mode),
    globalActivity: definition.globalActivity,
  };
  return {
    mode: definition.mode,
    entities,
    signals,
    topology,
    globalActivity: definition.globalActivity,
    complexity: definition.complexity,
    focusEntityId: definition.focusEntityId,
    accentColor: definition.accentColor,
  };
};

const createDefinition = (
  definition: NeuralCoreDemoStateDefinition,
): NeuralCoreDemoDefinition => {
  return {
    scenario: definition.scenario,
    state: createDemoState(definition),
    choreography: NEURAL_CORE_DEMO_CHOREOGRAPHIES[definition.scenario],
    sceneDirection: NEURAL_CORE_DEMO_SCENE_DIRECTIONS[definition.scenario],
    narrative: NEURAL_CORE_DEMO_NARRATIVES[definition.scenario],
  };
};

export const createDataFlowDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "data-flow",
    mode: "synchronizing",
    accentColor: "blue",
    globalActivity: 0.68,
    complexity: 0.5,
    focusEntityId: "data-buffer",
    pathwayId: "data-flow-pathway",
    clusters: [
      {
        id: "data-input",
        label: "Input",
        kind: "input",
        activity: 0.52,
        importance: 0.68,
        positionHint: { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.9 },
      },
      {
        id: "data-buffer",
        label: "Data",
        kind: "data",
        activity: 0.6,
        importance: 0.82,
        positionHint: { region: "central", hemisphere: "left", depth: "middle", priority: 1 },
      },
      {
        id: "data-output",
        label: "Output",
        kind: "output",
        activity: 0.46,
        importance: 0.72,
        positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.95 },
      },
    ],
    routes: [
      {
        id: "data-ingest",
        from: "data-input",
        to: "data-buffer",
        kind: "receive",
        intensity: 0.82,
        progress: 0.12,
        speed: 0.78,
        weight: 0.76,
        conductivity: 0.9,
      },
      {
        id: "data-emit",
        from: "data-buffer",
        to: "data-output",
        kind: "transfer",
        intensity: 0.88,
        progress: 0,
        speed: 0.82,
        weight: 0.82,
        conductivity: 0.92,
      },
    ],
  });
};

export const createFunctionExecutionDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "function-execution",
    mode: "processing",
    accentColor: "violet",
    globalActivity: 0.76,
    complexity: 0.66,
    focusEntityId: "function-core",
    pathwayId: "function-pathway",
    clusters: [
      {
        id: "function-input",
        label: "Input",
        kind: "input",
        activity: 0.46,
        importance: 0.62,
        positionHint: { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.9 },
      },
      {
        id: "function-core",
        label: "Function",
        kind: "function",
        activity: 0.72,
        importance: 1,
        plasticity: 0.78,
        positionHint: { region: "frontal", hemisphere: "center", depth: "middle", priority: 1 },
      },
      {
        id: "function-output",
        label: "Output",
        kind: "output",
        activity: 0.42,
        importance: 0.7,
        positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.95 },
      },
    ],
    routes: [
      {
        id: "function-call",
        from: "function-input",
        to: "function-core",
        kind: "execute",
        synapseKind: "relay",
        intensity: 0.86,
        progress: 0.08,
        speed: 0.08,
        weight: 0.82,
        conductivity: 0.08,
        plasticity: 0.32,
      },
      {
        id: "function-result",
        from: "function-core",
        to: "function-output",
        kind: "emit",
        intensity: 0.94,
        progress: 0,
        speed: 0.9,
        weight: 0.88,
        conductivity: 0.96,
      },
    ],
  });
};

export const createMemorySyncDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "memory-sync",
    mode: "synchronizing",
    accentColor: "violet",
    globalActivity: 0.62,
    complexity: 0.72,
    focusEntityId: "memory-store",
    pathwayId: "memory-pathway",
    clusters: [
      {
        id: "memory-process",
        label: "Process",
        kind: "process",
        activity: 0.52,
        importance: 0.72,
        positionHint: { region: "parietal", hemisphere: "left", depth: "middle", priority: 0.88 },
      },
      {
        id: "memory-store",
        label: "Memory",
        kind: "memory",
        activity: 0.76,
        importance: 1,
        plasticity: 0.94,
        positionHint: { region: "inner", hemisphere: "center", depth: "deep", priority: 1 },
      },
      {
        id: "memory-sync",
        label: "Sync",
        kind: "service",
        activity: 0.5,
        importance: 0.74,
        positionHint: { region: "frontal", hemisphere: "right", depth: "surface", priority: 0.92 },
      },
    ],
    routes: [
      {
        id: "memory-link",
        from: "memory-process",
        to: "memory-store",
        kind: "cache",
        synapseKind: "bidirectional",
        direction: "bidirectional",
        intensity: 0.84,
        progress: 0.14,
        speed: 0.22,
        weight: 0.72,
        conductivity: 0.18,
        plasticity: 0.96,
      },
      {
        id: "memory-commit",
        from: "memory-store",
        to: "memory-sync",
        kind: "write",
        synapseKind: "modulatory",
        intensity: 0.78,
        progress: 0,
        speed: 0.5,
        weight: 0.7,
        conductivity: 0.62,
        plasticity: 0.88,
      },
    ],
  });
};

export const createProcessPipelineDemoDefinition = (): NeuralCoreDemoDefinition => {
  const clusters: readonly NeuralCoreDemoClusterDefinition[] = [
    {
      id: "pipeline-input",
      label: "Input",
      kind: "input",
      activity: 0.42,
      importance: 0.62,
      positionHint: { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.94 },
    },
    {
      id: "pipeline-data",
      label: "Data",
      kind: "data",
      activity: 0.46,
      importance: 0.68,
      positionHint: { region: "upper", hemisphere: "left", depth: "middle", priority: 0.9 },
    },
    {
      id: "pipeline-function",
      label: "Function",
      kind: "function",
      activity: 0.5,
      importance: 0.76,
      positionHint: { region: "frontal", hemisphere: "center", depth: "middle", priority: 0.96 },
    },
    {
      id: "pipeline-process",
      label: "Process",
      kind: "process",
      activity: 0.54,
      importance: 0.84,
      positionHint: { region: "central", hemisphere: "center", depth: "middle", priority: 1 },
    },
    {
      id: "pipeline-memory",
      label: "Memory",
      kind: "memory",
      activity: 0.48,
      importance: 0.82,
      plasticity: 0.9,
      positionHint: { region: "inner", hemisphere: "center", depth: "deep", priority: 1 },
    },
    {
      id: "pipeline-decision",
      label: "Decision",
      kind: "decision",
      activity: 0.44,
      importance: 0.76,
      positionHint: { region: "parietal", hemisphere: "right", depth: "middle", priority: 0.94 },
    },
    {
      id: "pipeline-output",
      label: "Output",
      kind: "output",
      activity: 0.4,
      importance: 0.7,
      positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.96 },
    },
  ];
  const routePairs = [
    ["pipeline-ingest", "pipeline-input", "pipeline-data", "receive"],
    ["pipeline-transfer", "pipeline-data", "pipeline-function", "transfer"],
    ["pipeline-execute", "pipeline-function", "pipeline-process", "execute"],
    ["pipeline-store", "pipeline-process", "pipeline-memory", "write"],
    ["pipeline-resolve", "pipeline-memory", "pipeline-decision", "resolve"],
    ["pipeline-emit", "pipeline-decision", "pipeline-output", "emit"],
  ] as const;
  const routes: readonly NeuralCoreDemoRouteDefinition[] = routePairs.map(
    ([id, from, to, kind], index) => ({
      id,
      from,
      to,
      kind,
      synapseKind: index === 2 ? "relay" : index === 4 ? "modulatory" : "excitatory",
      intensity: 0.78 + (index % 2) * 0.08,
      progress: 0,
      speed: 0.66 + (index % 3) * 0.08,
      weight: 0.72 + (index % 2) * 0.1,
      conductivity: 0.8,
      plasticity: index === 4 ? 0.9 : 0.5,
    }),
  );
  return createDefinition({
    scenario: "process-pipeline",
    mode: "processing",
    accentColor: "cyan",
    globalActivity: 0.74,
    complexity: 0.84,
    focusEntityId: "pipeline-process",
    pathwayId: "pipeline-pathway",
    clusters,
    routes,
  });
};

export const createWarningDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "warning-state",
    mode: "warning",
    accentColor: "orange",
    globalActivity: 0.58,
    complexity: 0.5,
    focusEntityId: "warning-service",
    pathwayId: "warning-pathway",
    clusters: [
      {
        id: "warning-input",
        label: "Input",
        kind: "input",
        activity: 0.48,
        importance: 0.58,
        positionHint: { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.9 },
      },
      {
        id: "warning-service",
        label: "Delayed Service",
        kind: "service",
        status: "warning",
        activity: 0.54,
        importance: 0.94,
        health: 0.68,
        positionHint: { region: "central", hemisphere: "center", depth: "middle", priority: 1 },
      },
      {
        id: "warning-output",
        label: "Partial Output",
        kind: "output",
        activity: 0.38,
        importance: 0.66,
        positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.92 },
      },
    ],
    routes: [
      {
        id: "warning-route",
        from: "warning-input",
        to: "warning-service",
        kind: "route",
        intensity: 0.7,
        progress: 0.1,
        speed: 0.58,
        weight: 0.7,
        conductivity: 0.62,
      },
      {
        id: "warning-output-route",
        from: "warning-service",
        to: "warning-output",
        kind: "warning",
        synapseKind: "modulatory",
        status: "warning",
        intensity: 0.58,
        progress: 0,
        speed: 0.42,
        weight: 0.58,
        conductivity: 0.48,
        plasticity: 0.72,
      },
    ],
  });
};

export const createErrorDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "error-state",
    mode: "error",
    accentColor: "red",
    globalActivity: 0.48,
    complexity: 0.46,
    focusEntityId: "error-service",
    pathwayId: "error-pathway",
    clusters: [
      {
        id: "error-input",
        label: "Input",
        kind: "input",
        activity: 0.46,
        importance: 0.58,
        positionHint: { region: "temporal", hemisphere: "left", depth: "surface", priority: 0.88 },
      },
      {
        id: "error-service",
        label: "Affected Service",
        kind: "service",
        status: "error",
        activity: 0.42,
        importance: 1,
        health: 0.4,
        positionHint: { region: "central", hemisphere: "center", depth: "middle", priority: 1 },
      },
      {
        id: "error-output",
        label: "Output",
        kind: "output",
        activity: 0.28,
        importance: 0.62,
        positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.9 },
      },
    ],
    routes: [
      {
        id: "error-route",
        from: "error-input",
        to: "error-service",
        kind: "route",
        intensity: 0.72,
        progress: 0.08,
        speed: 0.62,
        weight: 0.72,
        conductivity: 0.68,
      },
      {
        id: "error-output-route",
        from: "error-service",
        to: "error-output",
        kind: "error",
        synapseKind: "inhibitory",
        intensity: 0.42,
        progress: 0,
        speed: 0.34,
        weight: 0.48,
        conductivity: 0.32,
        plasticity: 0.2,
      },
    ],
  });
};

export const createSuccessDemoDefinition = (): NeuralCoreDemoDefinition => {
  return createDefinition({
    scenario: "success-state",
    mode: "success",
    accentColor: "green",
    globalActivity: 0.54,
    complexity: 0.48,
    focusEntityId: "success-output",
    pathwayId: "success-pathway",
    clusters: [
      {
        id: "success-process",
        label: "Process",
        kind: "process",
        activity: 0.48,
        importance: 0.68,
        positionHint: { region: "central", hemisphere: "left", depth: "middle", priority: 0.88 },
      },
      {
        id: "success-decision",
        label: "Decision",
        kind: "decision",
        status: "success",
        activity: 0.54,
        importance: 0.84,
        positionHint: { region: "parietal", hemisphere: "center", depth: "middle", priority: 1 },
      },
      {
        id: "success-output",
        label: "Output",
        kind: "output",
        status: "success",
        activity: 0.58,
        importance: 0.94,
        positionHint: { region: "occipital", hemisphere: "right", depth: "surface", priority: 0.98 },
      },
    ],
    routes: [
      {
        id: "success-resolve",
        from: "success-process",
        to: "success-decision",
        kind: "resolve",
        intensity: 0.78,
        progress: 0.12,
        speed: 0.64,
        weight: 0.78,
        conductivity: 0.82,
      },
      {
        id: "success-emit",
        from: "success-decision",
        to: "success-output",
        kind: "success",
        intensity: 0.86,
        progress: 0,
        speed: 0.68,
        weight: 0.84,
        conductivity: 0.88,
      },
    ],
  });
};

export const createNeuralCoreDemoDefinition = (
  scenario: NeuralCoreDemoScenario,
): NeuralCoreDemoDefinition => {
  switch (scenario) {
    case "data-flow":
      return createDataFlowDemoDefinition();
    case "function-execution":
      return createFunctionExecutionDemoDefinition();
    case "memory-sync":
      return createMemorySyncDemoDefinition();
    case "process-pipeline":
      return createProcessPipelineDemoDefinition();
    case "warning-state":
      return createWarningDemoDefinition();
    case "error-state":
      return createErrorDemoDefinition();
    case "success-state":
      return createSuccessDemoDefinition();
    case "none":
      return { scenario };
  }
};

export const createNeuralCoreDemoState = (
  scenario: NeuralCoreDemoScenario = DEFAULT_NEURAL_CORE_DEMO_SCENARIO,
): NeuralCoreState => {
  return createNeuralCoreDemoDefinition(scenario).state ?? DEFAULT_NEURAL_CORE_STATE;
};
