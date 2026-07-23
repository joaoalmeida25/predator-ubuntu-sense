import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationPlan,
  NeuralCorePropagationRuntimeState,
  NeuralCoreSynapticPropagation,
} from "../../domain/propagation/neural-core-propagation.types";
import {
  clampPropagationValue,
  getEffectiveSynapseRouteIntensity,
} from "../../domain/propagation/neural-core-propagation.utils";
import type { NeuralCoreSynapse } from "../../domain/topology/neural-core-topology.types";
import {
  NEURAL_CORE_SYNAPSE_KIND_COLORS,
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "../topology/neural-core-topology-visual.constants";
import type {
  NeuralCoreClusterVisualActivation,
  NeuralCorePathwayVisualActivation,
  NeuralCorePropagationVisualPulse,
  NeuralCorePropagationVisualState,
  NeuralCoreSynapseVisualActivation,
} from "./neural-core-propagation-visual.types";

interface MapNeuralCorePropagationToVisualStateParams {
  runtime: NeuralCorePropagationRuntimeState;
  plan: NeuralCorePropagationPlan;
  config: NeuralCorePropagationConfig;
  visualRuntime: NeuralCorePropagationVisualRuntime;
}

interface NeuralCoreClusterVisualPlan {
  clusterId: string;
  activation: NeuralCoreClusterVisualActivation;
}

interface NeuralCoreSynapseVisualPlan {
  synapse: NeuralCoreSynapse;
  activation: NeuralCoreSynapseVisualActivation;
}

interface NeuralCorePathwayVisualPlan {
  pathwayId: string;
  synapseIndices: number[];
  highlight: NeuralCorePathwayVisualActivation;
}

export interface NeuralCorePropagationVisualRuntime {
  state: NeuralCorePropagationVisualState;
  clusterPlans: NeuralCoreClusterVisualPlan[];
  synapsePlans: NeuralCoreSynapseVisualPlan[];
  pathwayPlans: NeuralCorePathwayVisualPlan[];
  synapseIndexById: Record<string, number>;
  pathwayPlanIndexById: Record<string, number>;
  pathwayIntensityBySynapseIndex: number[];
  pathwaySynapseIndices: number[];
  synapseActivationFrameByIndex: number[];
  pulsePool: NeuralCorePropagationVisualPulse[];
  frame: number;
  pathwaySynapseCount: number;
  synapseActivationCount: number;
  pulseCount: number;
}

export const EMPTY_NEURAL_CORE_PROPAGATION_VISUAL_STATE: NeuralCorePropagationVisualState = {
  clusterActivations: [],
  synapseActivations: [],
  pulses: [],
  pathwayHighlights: [],
};

const createIndexRecord = (): Record<string, number> => {
  return Object.create(null) as Record<string, number>;
};

const createPulse = (): NeuralCorePropagationVisualPulse => ({
  synapseId: "",
  progress: 0,
  intensity: 0,
  opacity: 0,
  size: 0,
  trailLength: 0,
  color: "#000000",
  direction: "forward",
});

const getMaximumVisiblePropagationCount = (
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
): number => {
  if (!config.enabled || config.runtime.maximumConcurrentTransmissions <= 0) {
    return 0;
  }

  let maximumRunnableLifecycleCount = plan.topology.transmissions.length;
  for (const pathwayPlan of plan.pathwayPlans) {
    maximumRunnableLifecycleCount += pathwayPlan.runnableStageCount;
  }
  const maximumConcurrentCount = Math.min(
    config.runtime.maximumConcurrentTransmissions,
    maximumRunnableLifecycleCount,
  );
  const maximumRetainedCycles = Math.ceil(
    config.runtime.completedPropagationRetentionSeconds
      / config.timing.minimumTransmissionDurationSeconds,
  );

  // Standalone transmissions may start with non-zero progress, so include all of
  // them in addition to the duration-based bound used by repeating pathways.
  return plan.topology.transmissions.length
    + maximumConcurrentCount * (maximumRetainedCycles + 2);
};

export const createNeuralCorePropagationVisualRuntime = (
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
): NeuralCorePropagationVisualRuntime => {
  const synapseIndexById = createIndexRecord();
  const synapsePlans: NeuralCoreSynapseVisualPlan[] = plan.topology.synapses.map(
    (synapse, index) => {
      synapseIndexById[synapse.id] = index;
      return {
        synapse,
        activation: {
          synapseId: synapse.id,
          opacity: 0,
          color: NEURAL_CORE_SYNAPSE_KIND_COLORS[synapse.kind],
        },
      };
    },
  );

  // Runtime activation records enumerate integer-like IDs first. Compile that
  // ordering once so unusual topology IDs retain the previous output order.
  const clusterOrderRecord: Record<string, true> = {};
  for (const cluster of plan.topology.clusters) {
    clusterOrderRecord[cluster.id] = true;
  }
  const clusterPlans: NeuralCoreClusterVisualPlan[] = Object.keys(clusterOrderRecord).map(
    (clusterId) => ({
      clusterId,
      activation: {
        clusterId,
        intensity: 0,
        opacity: 0,
        size: 0,
        color: "#000000",
      },
    }),
  );

  const pathwayPlanIndexById = createIndexRecord();
  const pathwayPlans: NeuralCorePathwayVisualPlan[] = plan.pathwayPlans.map((pathwayPlan, index) => {
    pathwayPlanIndexById[pathwayPlan.pathway.id] = index;
    const synapseIds: string[] = [];
    const synapseIndices: number[] = [];
    for (const stage of pathwayPlan.stages) {
      if (!stage.runnable) {
        continue;
      }
      const synapseIndex = synapseIndexById[stage.synapseId];
      if (synapseIndex === undefined) {
        continue;
      }
      synapseIds.push(stage.synapseId);
      synapseIndices.push(synapseIndex);
    }
    return {
      pathwayId: pathwayPlan.pathway.id,
      synapseIndices,
      highlight: {
        synapseIds,
        progress: 0,
        intensity: 0,
      },
    };
  });

  const pulsePool = Array.from(
    { length: getMaximumVisiblePropagationCount(plan, config) },
    createPulse,
  );
  return {
    state: {
      clusterActivations: [],
      synapseActivations: [],
      pulses: [],
      pathwayHighlights: [],
    },
    clusterPlans,
    synapsePlans,
    pathwayPlans,
    synapseIndexById,
    pathwayPlanIndexById,
    pathwayIntensityBySynapseIndex: new Array<number>(synapsePlans.length).fill(0),
    pathwaySynapseIndices: new Array<number>(synapsePlans.length),
    synapseActivationFrameByIndex: new Array<number>(synapsePlans.length).fill(0),
    pulsePool,
    frame: 0,
    pathwaySynapseCount: 0,
    synapseActivationCount: 0,
    pulseCount: 0,
  };
};

const clearVisualState = (
  visualRuntime: NeuralCorePropagationVisualRuntime,
): NeuralCorePropagationVisualState => {
  visualRuntime.state.clusterActivations.length = 0;
  visualRuntime.state.synapseActivations.length = 0;
  visualRuntime.state.pulses.length = 0;
  visualRuntime.state.pathwayHighlights.length = 0;
  return visualRuntime.state;
};

const getPulseFade = (
  propagation: NeuralCoreSynapticPropagation,
  runtime: NeuralCorePropagationRuntimeState,
  config: NeuralCorePropagationConfig,
): number => {
  if (propagation.phase === "completed") {
    const retention = config.runtime.completedPropagationRetentionSeconds;
    if (retention <= 0) {
      return 0;
    }
    return clampPropagationValue(
      1 - (runtime.elapsedSeconds - (propagation.completedAtSeconds ?? runtime.elapsedSeconds)) / retention,
    );
  }
  const fadeIn = config.pulse.fadeInFraction <= 0
    ? 1
    : propagation.progress / config.pulse.fadeInFraction;
  const fadeOut = config.pulse.fadeOutFraction <= 0
    ? 1
    : (1 - propagation.progress) / config.pulse.fadeOutFraction;
  return clampPropagationValue(Math.min(fadeIn, fadeOut));
};

const compileClusterActivations = (
  visualRuntime: NeuralCorePropagationVisualRuntime,
  runtime: NeuralCorePropagationRuntimeState,
  config: NeuralCorePropagationConfig,
): void => {
  let activationCount = 0;
  for (const clusterPlan of visualRuntime.clusterPlans) {
    const runtimeActivation = runtime.clusterActivations[clusterPlan.clusterId];
    if (!runtimeActivation) {
      continue;
    }
    const intensity = clampPropagationValue(
      Math.max(
        runtimeActivation.currentIntensity,
        Math.abs(runtimeActivation.receivedStimulus)
          * (0.82 + config.pulse.arrivalBurstIntensity),
      ),
    );
    if (intensity <= 0.001) {
      continue;
    }

    const activation = clusterPlan.activation;
    activation.intensity = intensity;
    activation.opacity = clampPropagationValue(0.28 + intensity * 0.72);
    activation.size = Math.min(
      config.visual.maximumPulseSize,
      Math.max(config.visual.minimumPulseSize, config.pulse.baseSize * (1.05 + intensity * 0.48)),
    );
    activation.color = runtimeActivation.effectKind
      ? NEURAL_CORE_SYNAPSE_KIND_COLORS[runtimeActivation.effectKind]
      : NEURAL_CORE_TOPOLOGY_STATUS_COLORS[runtimeActivation.status];
    visualRuntime.state.clusterActivations[activationCount] = activation;
    activationCount += 1;
  }
  visualRuntime.state.clusterActivations.length = activationCount;
};

const compilePathwayHighlights = (
  visualRuntime: NeuralCorePropagationVisualRuntime,
  runtime: NeuralCorePropagationRuntimeState,
): void => {
  visualRuntime.pathwayIntensityBySynapseIndex.fill(0);
  let highlightCount = 0;
  let pathwaySynapseCount = 0;
  for (const pathwayRuntime of runtime.pathwayRuntimes) {
    const pathwayPlanIndex = visualRuntime.pathwayPlanIndexById[pathwayRuntime.pathwayId];
    const pathwayPlan = pathwayPlanIndex === undefined
      ? undefined
      : visualRuntime.pathwayPlans[pathwayPlanIndex];
    if (!pathwayPlan) {
      continue;
    }
    if (pathwayRuntime.progress <= 0) {
      continue;
    }

    const highlight = pathwayPlan.highlight;
    highlight.progress = pathwayRuntime.progress;
    highlight.intensity = 0.35 + pathwayRuntime.progress * 0.5;
    visualRuntime.state.pathwayHighlights[highlightCount] = highlight;
    highlightCount += 1;

    for (const synapseIndex of pathwayPlan.synapseIndices) {
      const previousIntensity = visualRuntime.pathwayIntensityBySynapseIndex[synapseIndex];
      if (previousIntensity === 0) {
        visualRuntime.pathwaySynapseIndices[pathwaySynapseCount] = synapseIndex;
        pathwaySynapseCount += 1;
      }
      visualRuntime.pathwayIntensityBySynapseIndex[synapseIndex] = Math.max(
        previousIntensity,
        highlight.intensity,
      );
    }
  }
  visualRuntime.state.pathwayHighlights.length = highlightCount;
  visualRuntime.pathwaySynapseCount = pathwaySynapseCount;
};

const beginVisualFrame = (
  visualRuntime: NeuralCorePropagationVisualRuntime,
): number => {
  if (visualRuntime.frame >= Number.MAX_SAFE_INTEGER) {
    visualRuntime.synapseActivationFrameByIndex.fill(0);
    visualRuntime.frame = 0;
  }
  visualRuntime.frame += 1;
  visualRuntime.state.synapseActivations.length = 0;
  visualRuntime.state.pulses.length = 0;
  visualRuntime.synapseActivationCount = 0;
  visualRuntime.pulseCount = 0;
  return visualRuntime.frame;
};

const compileVisiblePropagations = (
  propagations: readonly NeuralCoreSynapticPropagation[],
  visualRuntime: NeuralCorePropagationVisualRuntime,
  runtime: NeuralCorePropagationRuntimeState,
  config: NeuralCorePropagationConfig,
  frame: number,
): void => {
  for (const propagation of propagations) {
    if (propagation.phase === "cancelled") {
      continue;
    }
    const synapseIndex = visualRuntime.synapseIndexById[propagation.synapseId];
    const synapsePlan = synapseIndex === undefined
      ? undefined
      : visualRuntime.synapsePlans[synapseIndex];
    if (!synapsePlan) {
      continue;
    }

    const fade = getPulseFade(propagation, runtime, config);
    const pathwayIntensity = visualRuntime.pathwayIntensityBySynapseIndex[synapseIndex];
    const routeOpacity = clampPropagationValue(Math.max(
      getEffectiveSynapseRouteIntensity(
        propagation.intensity * fade,
        synapsePlan.synapse,
        config,
      ),
      config.synapse.inactiveRouteOpacity
        + pathwayIntensity * config.synapse.activeRouteOpacity,
    ));
    const routeActivation = synapsePlan.activation;
    if (visualRuntime.synapseActivationFrameByIndex[synapseIndex] !== frame) {
      visualRuntime.synapseActivationFrameByIndex[synapseIndex] = frame;
      routeActivation.opacity = routeOpacity;
      visualRuntime.state.synapseActivations[
        visualRuntime.synapseActivationCount
      ] = routeActivation;
      visualRuntime.synapseActivationCount += 1;
    } else if (routeOpacity > routeActivation.opacity) {
      routeActivation.opacity = routeOpacity;
    }

    const pulse = visualRuntime.pulsePool[visualRuntime.pulseCount];
    if (!pulse) {
      continue;
    }
    const destinationBoostStart = 1 - config.pulse.destinationBoostFraction;
    const destinationBoost = config.pulse.destinationBoostFraction <= 0
      ? 0
      : clampPropagationValue(
        (propagation.progress - destinationBoostStart) / config.pulse.destinationBoostFraction,
      );
    const intensity = clampPropagationValue(
      propagation.intensity * config.pulse.intensityMultiplier * (1 + destinationBoost * 0.3),
    );
    pulse.synapseId = propagation.synapseId;
    pulse.progress = propagation.progress;
    pulse.intensity = intensity;
    pulse.opacity = clampPropagationValue(intensity * fade);
    pulse.size = Math.min(
      config.visual.maximumPulseSize,
      Math.max(config.visual.minimumPulseSize, config.pulse.baseSize * (0.8 + intensity * 0.6)),
    );
    pulse.trailLength = config.pulse.trailLength;
    pulse.color = NEURAL_CORE_SYNAPSE_KIND_COLORS[synapsePlan.synapse.kind];
    pulse.direction = propagation.direction;
    visualRuntime.state.pulses[visualRuntime.pulseCount] = pulse;
    visualRuntime.pulseCount += 1;
  }
};

const appendPathwayOnlySynapseActivations = (
  visualRuntime: NeuralCorePropagationVisualRuntime,
  config: NeuralCorePropagationConfig,
  frame: number,
): void => {
  for (let index = 0; index < visualRuntime.pathwaySynapseCount; index += 1) {
    const synapseIndex = visualRuntime.pathwaySynapseIndices[index];
    if (
      synapseIndex === undefined
      || visualRuntime.synapseActivationFrameByIndex[synapseIndex] === frame
    ) {
      continue;
    }
    const synapsePlan = visualRuntime.synapsePlans[synapseIndex];
    if (!synapsePlan) {
      continue;
    }
    visualRuntime.synapseActivationFrameByIndex[synapseIndex] = frame;
    synapsePlan.activation.opacity = clampPropagationValue(
      config.synapse.inactiveRouteOpacity
        + visualRuntime.pathwayIntensityBySynapseIndex[synapseIndex]
          * config.synapse.activeRouteOpacity,
    );
    visualRuntime.state.synapseActivations[
      visualRuntime.synapseActivationCount
    ] = synapsePlan.activation;
    visualRuntime.synapseActivationCount += 1;
  }
};

export const mapNeuralCorePropagationToVisualState = ({
  runtime,
  config,
  visualRuntime,
}: MapNeuralCorePropagationToVisualStateParams): NeuralCorePropagationVisualState => {
  if (!config.enabled || visualRuntime.clusterPlans.length === 0) {
    return clearVisualState(visualRuntime);
  }

  compileClusterActivations(visualRuntime, runtime, config);
  compilePathwayHighlights(visualRuntime, runtime);
  const frame = beginVisualFrame(visualRuntime);
  compileVisiblePropagations(
    runtime.activePropagations,
    visualRuntime,
    runtime,
    config,
    frame,
  );
  compileVisiblePropagations(
    runtime.completedPropagations,
    visualRuntime,
    runtime,
    config,
    frame,
  );
  appendPathwayOnlySynapseActivations(
    visualRuntime,
    config,
    frame,
  );
  visualRuntime.state.synapseActivations.length = visualRuntime.synapseActivationCount;
  visualRuntime.state.pulses.length = visualRuntime.pulseCount;
  return visualRuntime.state;
};
