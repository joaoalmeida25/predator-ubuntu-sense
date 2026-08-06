import type {
  NeuralCoreChoreographyEvaluation,
  NeuralCoreClusterSemanticEffects,
  NeuralCoreGlobalSemanticEffects,
  NeuralCorePathwaySemanticEffects,
  NeuralCoreSynapseSemanticEffects,
} from "../../domain/choreography/neural-core-choreography.types";
import type {
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
} from "../../domain/topology/neural-core-topology.types";
import type {
  NeuralCoreClusterVisualActivation,
  NeuralCorePropagationVisualState,
  NeuralCoreSynapseVisualActivation,
} from "../propagation/neural-core-propagation-visual.types";
import type { NeuralCoreTopologyVisualState } from "../topology/neural-core-topology-visual.types";
import type {
  NeuralCoreOperationalVisualOverlay,
} from "../../demos/operational/mappers/neural-core-operational-visual-state.mapper";
import {
  EMPTY_NEURAL_CORE_CLUSTER_SEMANTIC_EFFECTS,
  EMPTY_NEURAL_CORE_GLOBAL_SEMANTIC_EFFECTS,
  EMPTY_NEURAL_CORE_PATHWAY_SEMANTIC_EFFECTS,
  EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE,
  EMPTY_NEURAL_CORE_SYNAPSE_SEMANTIC_EFFECTS,
} from "./neural-core-semantic-visual.constants";
import type {
  NeuralCoreClusterSemanticVisualState,
  NeuralCorePathwaySemanticVisualState,
  NeuralCoreSemanticVisualizationConfig,
  NeuralCoreSemanticVisualState,
  NeuralCoreSynapseSemanticVisualState,
} from "./neural-core-semantic-visual.types";

export interface MapNeuralCoreSemanticVisualStateParams {
  topology: NeuralCoreTopology;
  topologyVisualState: NeuralCoreTopologyVisualState;
  propagationVisualState: NeuralCorePropagationVisualState;
  choreographyEvaluation?: NeuralCoreChoreographyEvaluation;
  config: NeuralCoreSemanticVisualizationConfig;
  operationalOverlay?: NeuralCoreOperationalVisualOverlay;
}

export interface NeuralCoreSemanticVisualRuntime {
  choreographyClusterEffects: NeuralCoreClusterSemanticEffects[];
  choreographyPathwayEffects: NeuralCorePathwaySemanticEffects[];
  choreographySynapseEffects: NeuralCoreSynapseSemanticEffects[];
  clusterIndexById: Readonly<Record<string, number>>;
  clusterPropagationByIndex: Array<NeuralCoreClusterVisualActivation | undefined>;
  pathwayIndexBySynapseId: Readonly<Record<string, readonly number[]>>;
  pathwayPropagationIntensity: Float32Array;
  pathwayPropagationProgress: Float32Array;
  state: NeuralCoreSemanticVisualState;
  synapseIndexById: Readonly<Record<string, number>>;
  synapsePropagationByIndex: Array<NeuralCoreSynapseVisualActivation | undefined>;
  topology: NeuralCoreTopology;
}

const clamp = (value?: number): number => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
};

const mix = (base?: number, choreography?: number, global = 0): number => {
  return clamp(Math.max(base ?? 0, choreography ?? 0, global));
};

const getStatusColorScore = (status: NeuralCoreTopologyStatus | undefined): number => {
  return status === "error" || status === "warning" || status === "success" ? 0.45 : 0;
};

const selectSemanticColor = (
  active: number,
  memory: number,
  warning: number,
  error: number,
  success: number,
  config: NeuralCoreSemanticVisualizationConfig,
): string => {
  let strongestScore = active;
  let color = config.color.active;
  if (memory > strongestScore) {
    strongestScore = memory;
    color = config.color.memory;
  }
  if (warning > strongestScore) {
    strongestScore = warning;
    color = config.color.warning;
  }
  if (error > strongestScore) {
    strongestScore = error;
    color = config.color.error;
  }
  if (success > strongestScore) {
    strongestScore = success;
    color = config.color.success;
  }
  return strongestScore > 0.01 ? color : config.color.neutral;
};

const resetClusterEffects = (effects: NeuralCoreClusterSemanticEffects): void => {
  effects.activity = 0;
  effects.density = 0;
  effects.cohesion = 0;
  effects.internalConnectivity = 0;
  effects.persistence = 0;
  effects.synchronization = 0;
  effects.instability = 0;
  effects.jitter = 0;
  effects.fragmentation = 0;
  effects.nodeDecay = 0;
  effects.fillIntensity = 0;
  effects.pulseFrequency = 0;
  effects.pulseAmplitude = 0;
  effects.colorInfluence = 0;
};

const mergeClusterEffects = (
  current: NeuralCoreClusterSemanticEffects,
  incoming: Partial<NeuralCoreClusterSemanticEffects>,
): void => {
  current.activity = Math.max(current.activity, clamp(incoming.activity));
  current.density = Math.max(current.density, clamp(incoming.density));
  current.cohesion = Math.max(current.cohesion, clamp(incoming.cohesion));
  current.internalConnectivity = Math.max(current.internalConnectivity, clamp(incoming.internalConnectivity));
  current.persistence = Math.max(current.persistence, clamp(incoming.persistence));
  current.synchronization = Math.max(current.synchronization, clamp(incoming.synchronization));
  current.instability = Math.max(current.instability, clamp(incoming.instability));
  current.jitter = Math.max(current.jitter, clamp(incoming.jitter));
  current.fragmentation = Math.max(current.fragmentation, clamp(incoming.fragmentation));
  current.nodeDecay = Math.max(current.nodeDecay, clamp(incoming.nodeDecay));
  current.fillIntensity = Math.max(current.fillIntensity, clamp(incoming.fillIntensity));
  current.pulseFrequency = Math.max(current.pulseFrequency, clamp(incoming.pulseFrequency));
  current.pulseAmplitude = Math.max(current.pulseAmplitude, clamp(incoming.pulseAmplitude));
  current.colorInfluence = Math.max(current.colorInfluence, clamp(incoming.colorInfluence));
};

const resetSynapseEffects = (effects: NeuralCoreSynapseSemanticEffects): void => {
  effects.activity = 0;
  effects.emphasis = 0;
  effects.thickness = 0;
  effects.conductivity = 0;
  effects.persistence = 0;
  effects.instability = 0;
  effects.fragmentation = 0;
  effects.interruption = 0;
  effects.pulseFrequency = 0;
  effects.pulseIntensity = 0;
  effects.colorInfluence = 0;
};

const mergeSynapseEffects = (
  current: NeuralCoreSynapseSemanticEffects,
  incoming: Partial<NeuralCoreSynapseSemanticEffects>,
): void => {
  current.activity = Math.max(current.activity, clamp(incoming.activity));
  current.emphasis = Math.max(current.emphasis, clamp(incoming.emphasis));
  current.thickness = Math.max(current.thickness, clamp(incoming.thickness));
  current.conductivity = Math.max(current.conductivity, clamp(incoming.conductivity));
  current.persistence = Math.max(current.persistence, clamp(incoming.persistence));
  current.instability = Math.max(current.instability, clamp(incoming.instability));
  current.fragmentation = Math.max(current.fragmentation, clamp(incoming.fragmentation));
  current.interruption = Math.max(current.interruption, clamp(incoming.interruption));
  current.pulseFrequency = Math.max(current.pulseFrequency, clamp(incoming.pulseFrequency));
  current.pulseIntensity = Math.max(current.pulseIntensity, clamp(incoming.pulseIntensity));
  current.colorInfluence = Math.max(current.colorInfluence, clamp(incoming.colorInfluence));
};

const resetPathwayEffects = (effects: NeuralCorePathwaySemanticEffects): void => {
  effects.activity = 0;
  effects.sequentialEmphasis = 0;
  effects.synchronization = 0;
  effects.instability = 0;
  effects.completion = 0;
};

const mergePathwayEffects = (
  current: NeuralCorePathwaySemanticEffects,
  incoming: Partial<NeuralCorePathwaySemanticEffects>,
): void => {
  current.activity = Math.max(current.activity, clamp(incoming.activity));
  current.sequentialEmphasis = Math.max(current.sequentialEmphasis, clamp(incoming.sequentialEmphasis));
  current.synchronization = Math.max(current.synchronization, clamp(incoming.synchronization));
  current.instability = Math.max(current.instability, clamp(incoming.instability));
  current.completion = Math.max(current.completion, clamp(incoming.completion));
};

const createClusterState = (
  topology: NeuralCoreTopology,
  topologyVisualState: NeuralCoreTopologyVisualState,
  clusterIndex: number,
  neutralColor: string,
): NeuralCoreClusterSemanticVisualState => {
  const cluster = topology.clusters[clusterIndex];
  const region = topologyVisualState.clusterRegions[clusterIndex];
  return {
    ...EMPTY_NEURAL_CORE_CLUSTER_SEMANTIC_EFFECTS,
    clusterId: cluster.id,
    nodeIndices: region?.nodeIndices ?? [],
    hubIndices: region?.hubIndices ?? [],
    color: neutralColor,
  };
};

const createSynapseState = (
  synapse: NeuralCoreSynapse,
  neutralColor: string,
): NeuralCoreSynapseSemanticVisualState => {
  return {
    ...EMPTY_NEURAL_CORE_SYNAPSE_SEMANTIC_EFFECTS,
    synapseId: synapse.id,
    color: neutralColor,
  };
};

const createPathwayState = (
  pathway: NeuralCorePathway,
): NeuralCorePathwaySemanticVisualState => {
  return {
    ...EMPTY_NEURAL_CORE_PATHWAY_SEMANTIC_EFFECTS,
    pathwayId: pathway.id,
    synapseIds: pathway.synapseIds,
  };
};

export const createNeuralCoreSemanticVisualRuntime = (
  topology: NeuralCoreTopology,
  topologyVisualState: NeuralCoreTopologyVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
): NeuralCoreSemanticVisualRuntime => {
  const clusterIndexById: Record<string, number> = {};
  const synapseIndexById: Record<string, number> = {};
  const pathwayIndexBySynapseId: Record<string, number[]> = {};
  topology.clusters.forEach((cluster, index): void => {
    clusterIndexById[cluster.id] = index;
  });
  topology.synapses.forEach((synapse, index): void => {
    synapseIndexById[synapse.id] = index;
  });
  const pathways = topology.pathways ?? [];
  pathways.forEach((pathway, pathwayIndex): void => {
    for (const synapseId of pathway.synapseIds) {
      const indices = pathwayIndexBySynapseId[synapseId] ?? [];
      indices.push(pathwayIndex);
      pathwayIndexBySynapseId[synapseId] = indices;
    }
  });
  const clusterEffects = topology.clusters.map((_, index) => {
    return createClusterState(topology, topologyVisualState, index, config.color.neutral);
  });
  const synapseEffects = topology.synapses.map((synapse) => {
    return createSynapseState(synapse, config.color.neutral);
  });
  const pathwayEffects = pathways.map(createPathwayState);
  const state: NeuralCoreSemanticVisualState = {
    clusterEffects,
    synapseEffects,
    pathwayEffects,
    globalEffects: {
      ...EMPTY_NEURAL_CORE_GLOBAL_SEMANTIC_EFFECTS,
      color: config.color.neutral,
    },
  };

  return {
    choreographyClusterEffects: topology.clusters.map(() => ({
      ...EMPTY_NEURAL_CORE_CLUSTER_SEMANTIC_EFFECTS,
    })),
    choreographyPathwayEffects: pathways.map(() => ({
      ...EMPTY_NEURAL_CORE_PATHWAY_SEMANTIC_EFFECTS,
    })),
    choreographySynapseEffects: topology.synapses.map(() => ({
      ...EMPTY_NEURAL_CORE_SYNAPSE_SEMANTIC_EFFECTS,
    })),
    clusterIndexById,
    clusterPropagationByIndex: topology.clusters.map(() => undefined),
    pathwayIndexBySynapseId,
    pathwayPropagationIntensity: new Float32Array(pathways.length),
    pathwayPropagationProgress: new Float32Array(pathways.length),
    state,
    synapseIndexById,
    synapsePropagationByIndex: topology.synapses.map(() => undefined),
    topology,
  };
};

const compileChoreographyEffects = (
  runtime: NeuralCoreSemanticVisualRuntime,
  evaluation?: NeuralCoreChoreographyEvaluation,
): void => {
  for (const effects of runtime.choreographyClusterEffects) {
    resetClusterEffects(effects);
  }
  for (const effects of runtime.choreographySynapseEffects) {
    resetSynapseEffects(effects);
  }
  for (const effects of runtime.choreographyPathwayEffects) {
    resetPathwayEffects(effects);
  }
  if (!evaluation) {
    return;
  }

  for (const entry of evaluation.clusterEffects) {
    if (entry.targetId === undefined) {
      for (const effects of runtime.choreographyClusterEffects) {
        mergeClusterEffects(effects, entry.effects);
      }
      continue;
    }
    const index = runtime.clusterIndexById[entry.targetId];
    if (index !== undefined) {
      mergeClusterEffects(runtime.choreographyClusterEffects[index], entry.effects);
    }
  }
  for (const entry of evaluation.synapseEffects) {
    if (entry.targetId === undefined) {
      for (const effects of runtime.choreographySynapseEffects) {
        mergeSynapseEffects(effects, entry.effects);
      }
      continue;
    }
    const index = runtime.synapseIndexById[entry.targetId];
    if (index !== undefined) {
      mergeSynapseEffects(runtime.choreographySynapseEffects[index], entry.effects);
    }
  }
  for (const entry of evaluation.pathwayEffects) {
    if (entry.targetId === undefined) {
      for (const effects of runtime.choreographyPathwayEffects) {
        mergePathwayEffects(effects, entry.effects);
      }
      continue;
    }
    const pathways = runtime.topology.pathways ?? [];
    for (let index = 0; index < pathways.length; index += 1) {
      if (pathways[index].id === entry.targetId) {
        mergePathwayEffects(runtime.choreographyPathwayEffects[index], entry.effects);
        break;
      }
    }
  }
};

const compilePropagationEffects = (
  runtime: NeuralCoreSemanticVisualRuntime,
  visualState: NeuralCorePropagationVisualState,
): void => {
  runtime.clusterPropagationByIndex.fill(undefined);
  runtime.synapsePropagationByIndex.fill(undefined);
  runtime.pathwayPropagationIntensity.fill(0);
  runtime.pathwayPropagationProgress.fill(0);

  for (const activation of visualState.clusterActivations) {
    const index = runtime.clusterIndexById[activation.clusterId];
    if (index !== undefined) {
      runtime.clusterPropagationByIndex[index] = activation;
    }
  }
  for (const activation of visualState.synapseActivations) {
    const index = runtime.synapseIndexById[activation.synapseId];
    if (index !== undefined) {
      runtime.synapsePropagationByIndex[index] = activation;
    }
  }
  for (const highlight of visualState.pathwayHighlights) {
    for (const synapseId of highlight.synapseIds) {
      const pathwayIndices = runtime.pathwayIndexBySynapseId[synapseId];
      if (!pathwayIndices) {
        continue;
      }
      for (const pathwayIndex of pathwayIndices) {
        runtime.pathwayPropagationIntensity[pathwayIndex] = Math.max(
          runtime.pathwayPropagationIntensity[pathwayIndex],
          highlight.intensity,
        );
        runtime.pathwayPropagationProgress[pathwayIndex] = Math.max(
          runtime.pathwayPropagationProgress[pathwayIndex],
          highlight.progress,
        );
      }
    }
  }
};

const updateClusterState = (
  runtime: NeuralCoreSemanticVisualRuntime,
  clusterIndex: number,
  global: Partial<NeuralCoreGlobalSemanticEffects>,
  config: NeuralCoreSemanticVisualizationConfig,
  operationalOverlay?: NeuralCoreOperationalVisualOverlay,
): void => {
  const cluster = runtime.topology.clusters[clusterIndex];
  const operationalState = operationalOverlay?.clusterStateById[cluster.id];
  const clusterStatus = operationalState?.status ?? cluster.status;
  const state = runtime.state.clusterEffects[clusterIndex];
  const propagation = runtime.clusterPropagationByIndex[clusterIndex];
  const effects = runtime.choreographyClusterEffects[clusterIndex];
  const activity = mix(
    Math.max(operationalState?.activity ?? cluster.activity ?? 0, propagation?.intensity ?? 0),
    effects.activity,
    global.activity,
  );
  const cohesion = mix(cluster.stability, effects.cohesion, global.stability);
  const synchronization = mix(0, effects.synchronization, global.synchronization);
  const instability = mix(cluster.stability === undefined ? 0 : 1 - cluster.stability, effects.instability, global.instability);
  const jitter = mix(0, effects.jitter, global.jitter) * (1 - synchronization * 0.7);
  const fragmentation = mix(0, effects.fragmentation, global.fragmentation) * (1 - cohesion * 0.35);
  const nodeDecay = mix(0, effects.nodeDecay, global.nodeDecay);
  const density = mix(0, effects.density);
  const internalConnectivity = mix(0, effects.internalConnectivity);
  const colorInfluence = mix(
    getStatusColorScore(clusterStatus),
    effects.colorInfluence,
    global.colorInfluence,
  );
  const statusError = clusterStatus === "error" ? colorInfluence : 0;
  const statusWarning = clusterStatus === "warning" ? colorInfluence : 0;
  const statusSuccess = clusterStatus === "success" ? colorInfluence : 0;

  state.activity = activity;
  state.density = density;
  state.cohesion = cohesion;
  state.internalConnectivity = internalConnectivity;
  state.persistence = mix(0, effects.persistence);
  state.synchronization = synchronization;
  state.instability = instability;
  state.jitter = jitter;
  state.fragmentation = fragmentation;
  state.nodeDecay = nodeDecay;
  state.fillIntensity = mix(0, effects.fillIntensity);
  state.pulseFrequency = mix(0, effects.pulseFrequency);
  state.pulseAmplitude = mix(0, effects.pulseAmplitude);
  state.colorInfluence = colorInfluence;
  state.color = selectSemanticColor(
    activity * (0.35 + colorInfluence * 0.65),
    density * internalConnectivity * colorInfluence * 1.14,
    Math.max(statusWarning, instability * colorInfluence) * (1 - fragmentation * 0.6) * 1.12,
    Math.max(statusError, fragmentation, nodeDecay) * colorInfluence * 1.28,
    Math.max(statusSuccess, synchronization * cohesion) * colorInfluence * 1.16,
    config,
  );
};

const updateSynapseState = (
  runtime: NeuralCoreSemanticVisualRuntime,
  synapseIndex: number,
  global: Partial<NeuralCoreGlobalSemanticEffects>,
  config: NeuralCoreSemanticVisualizationConfig,
  operationalOverlay?: NeuralCoreOperationalVisualOverlay,
): void => {
  const synapse = runtime.topology.synapses[synapseIndex];
  const synapseStatus = operationalOverlay?.routeStatusById[synapse.id]
    ?? synapse.status;
  const state = runtime.state.synapseEffects[synapseIndex];
  const propagation = runtime.synapsePropagationByIndex[synapseIndex];
  const effects = runtime.choreographySynapseEffects[synapseIndex];
  const activity = mix(propagation?.opacity, effects.activity, global.activity);
  const instability = mix(0, effects.instability, global.instability);
  const fragmentation = mix(0, effects.fragmentation, global.fragmentation);
  const colorInfluence = mix(getStatusColorScore(synapseStatus), effects.colorInfluence, global.colorInfluence);
  const statusWarning = synapseStatus === "warning" ? colorInfluence : 0;
  const statusError = synapseStatus === "error" ? colorInfluence : 0;
  const statusSuccess = synapseStatus === "success" ? colorInfluence : 0;
  const color = selectSemanticColor(
    activity * colorInfluence * (1 - Math.max(statusWarning, statusError) * 0.72),
    Math.max(effects.thickness, effects.persistence) * colorInfluence * 1.14,
    Math.max(statusWarning, instability * colorInfluence)
      * (1 - fragmentation * 0.5) * 1.12,
    Math.max(
      statusError,
      fragmentation * colorInfluence,
      effects.interruption * colorInfluence,
    ) * 1.28,
    Math.max(
      statusSuccess,
      (global.synchronization ?? 0) * colorInfluence,
    ) * 1.16,
    config,
  );

  state.activity = activity;
  state.emphasis = mix(propagation?.opacity, effects.emphasis);
  state.thickness = mix(0, effects.thickness);
  state.conductivity = mix(synapse.conductivity, effects.conductivity);
  state.persistence = mix(0, effects.persistence);
  state.instability = instability;
  state.fragmentation = fragmentation;
  state.interruption = mix(0, effects.interruption);
  state.pulseFrequency = mix(0, effects.pulseFrequency);
  state.pulseIntensity = mix(0, effects.pulseIntensity);
  state.colorInfluence = colorInfluence;
  state.color = colorInfluence > 0.05 ? color : propagation?.color ?? color;
};

const updatePathwayState = (
  runtime: NeuralCoreSemanticVisualRuntime,
  pathwayIndex: number,
): void => {
  const state = runtime.state.pathwayEffects[pathwayIndex];
  const effects = runtime.choreographyPathwayEffects[pathwayIndex];
  state.activity = mix(runtime.pathwayPropagationIntensity[pathwayIndex], effects.activity);
  state.sequentialEmphasis = mix(runtime.pathwayPropagationProgress[pathwayIndex], effects.sequentialEmphasis);
  state.synchronization = mix(0, effects.synchronization);
  state.instability = mix(0, effects.instability);
  state.completion = mix(0, effects.completion);
};

const updateGlobalState = (
  runtime: NeuralCoreSemanticVisualRuntime,
  global: Partial<NeuralCoreGlobalSemanticEffects>,
  config: NeuralCoreSemanticVisualizationConfig,
): void => {
  let activity = clamp(global.activity);
  let synchronization = clamp(global.synchronization);
  let instability = clamp(global.instability);
  let jitter = clamp(global.jitter);
  let fragmentation = clamp(global.fragmentation);
  let nodeDecay = clamp(global.nodeDecay);
  let colorInfluence = clamp(global.colorInfluence);
  for (const cluster of runtime.state.clusterEffects) {
    activity = Math.max(activity, cluster.activity);
    synchronization = Math.max(synchronization, cluster.synchronization);
    instability = Math.max(instability, cluster.instability);
    jitter = Math.max(jitter, cluster.jitter);
    fragmentation = Math.max(fragmentation, cluster.fragmentation);
    nodeDecay = Math.max(nodeDecay, cluster.nodeDecay);
    colorInfluence = Math.max(colorInfluence, cluster.colorInfluence);
  }
  const state = runtime.state.globalEffects;
  state.activity = activity;
  state.synchronization = synchronization;
  state.stability = clamp(global.stability);
  state.instability = instability;
  state.jitter = jitter;
  state.fragmentation = fragmentation;
  state.nodeDecay = nodeDecay;
  state.colorInfluence = colorInfluence;
  state.color = selectSemanticColor(
    activity * colorInfluence,
    0,
    instability * colorInfluence,
    Math.max(fragmentation, nodeDecay) * colorInfluence,
    synchronization * colorInfluence,
    config,
  );
};

export const updateNeuralCoreSemanticVisualRuntime = (
  runtime: NeuralCoreSemanticVisualRuntime,
  propagationVisualState: NeuralCorePropagationVisualState,
  choreographyEvaluation: NeuralCoreChoreographyEvaluation | undefined,
  config: NeuralCoreSemanticVisualizationConfig,
  operationalOverlay?: NeuralCoreOperationalVisualOverlay,
): NeuralCoreSemanticVisualState => {
  if (!config.enabled || runtime.topology.clusters.length === 0) {
    return EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE;
  }
  compileChoreographyEffects(runtime, choreographyEvaluation);
  compilePropagationEffects(runtime, propagationVisualState);
  const global = choreographyEvaluation?.globalEffects
    ?? EMPTY_NEURAL_CORE_GLOBAL_SEMANTIC_EFFECTS;
  for (let index = 0; index < runtime.topology.clusters.length; index += 1) {
    updateClusterState(runtime, index, global, config, operationalOverlay);
  }
  for (let index = 0; index < runtime.topology.synapses.length; index += 1) {
    updateSynapseState(runtime, index, global, config, operationalOverlay);
  }
  const pathways = runtime.topology.pathways ?? [];
  for (let index = 0; index < pathways.length; index += 1) {
    updatePathwayState(runtime, index);
  }
  updateGlobalState(runtime, global, config);
  return runtime.state;
};

export const mapNeuralCoreSemanticVisualState = ({
  topology,
  topologyVisualState,
  propagationVisualState,
  choreographyEvaluation,
  config,
  operationalOverlay,
}: MapNeuralCoreSemanticVisualStateParams): NeuralCoreSemanticVisualState => {
  if (!config.enabled || topology.clusters.length === 0) {
    return EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE;
  }
  const runtime = createNeuralCoreSemanticVisualRuntime(
    topology,
    topologyVisualState,
    config,
  );
  return updateNeuralCoreSemanticVisualRuntime(
    runtime,
    propagationVisualState,
    choreographyEvaluation,
    config,
    operationalOverlay,
  );
};
