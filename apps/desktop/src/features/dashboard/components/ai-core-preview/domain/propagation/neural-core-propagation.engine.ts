import { resolveNeuralCorePropagationConfig } from "./neural-core-propagation.config";
import type {
  NeuralCoreClusterActivation,
  NeuralCorePathwayExecutionPlan,
  NeuralCorePathwayRuntime,
  NeuralCorePropagationConfig,
  NeuralCorePropagationConfigInput,
  NeuralCorePropagationEvent,
  NeuralCorePropagationEventType,
  NeuralCorePropagationPlan,
  NeuralCorePropagationRuntimeState,
  NeuralCorePropagationStepResult,
  NeuralCoreQueuedPropagation,
  NeuralCoreSynapticPropagation,
} from "./neural-core-propagation.types";
import {
  calculateExecutablePathwayProgress,
  canStartPathwayStage,
  clampPropagationValue,
  getEffectiveClusterStimulus,
  getEffectiveTransmissionDuration,
  getEffectiveTransmissionIntensity,
  getFirstRunnablePathwayStage,
  getNextRunnablePathwayStage,
} from "./neural-core-propagation.utils";
import type {
  NeuralCoreSynapse,
  NeuralCoreTopologyStatus,
  NeuralCoreTransmission,
} from "../topology/neural-core-topology.types";

interface CreateNeuralCorePropagationRuntimeParams {
  plan?: NeuralCorePropagationPlan;
  config?: NeuralCorePropagationConfigInput | NeuralCorePropagationConfig;
}

interface AdvanceNeuralCorePropagationParams {
  runtime: NeuralCorePropagationRuntimeState;
  plan: NeuralCorePropagationPlan;
  deltaSeconds: number;
  config: NeuralCorePropagationConfig;
}

const isRunnableStatus = (status?: NeuralCoreTopologyStatus): boolean => {
  return status !== "disabled" && status !== "idle";
};

const isTransmissionRunnable = (transmission: NeuralCoreTransmission): boolean => {
  if (transmission.status !== undefined) {
    return isRunnableStatus(transmission.status);
  }

  const progress = clampPropagationValue(transmission.progress ?? 0);
  return clampPropagationValue(transmission.intensity ?? 0) > 0
    || clampPropagationValue(transmission.speed ?? 0) > 0
    || (progress > 0 && progress < 1);
};

const createEvent = (
  type: NeuralCorePropagationEventType,
  timestampSeconds: number,
  lifecycleId: string,
  values: Omit<NeuralCorePropagationEvent, "id" | "type" | "timestampSeconds">,
): NeuralCorePropagationEvent => ({
  id: `${type}:${lifecycleId}`,
  type,
  timestampSeconds,
  ...values,
});

const hashDirection = (value: string, seed: number): "forward" | "backward" => {
  let hash = seed;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? "forward" : "backward";
};

export const getNeuralCorePropagationDirection = (
  synapse: NeuralCoreSynapse,
  transmission: NeuralCoreTransmission,
  config: NeuralCorePropagationConfig,
): "forward" | "backward" => {
  if (transmission.direction) {
    return transmission.direction;
  }
  if (synapse.direction === "forward" || synapse.direction === "backward") {
    return synapse.direction;
  }
  return hashDirection(`${transmission.id}:${synapse.id}`, config.runtime.deterministicSeed);
};

const compareQueuedPropagations = (
  left: NeuralCoreQueuedPropagation,
  right: NeuralCoreQueuedPropagation,
): number => {
  const identityOrder = left.queueId < right.queueId
    ? -1
    : left.queueId > right.queueId ? 1 : 0;
  return right.priority - left.priority
    || left.enqueuedAtSeconds - right.enqueuedAtSeconds
    || identityOrder;
};

const createSyntheticPathwayTransmission = (
  queued: NeuralCoreQueuedPropagation,
  pathwayPlan: NeuralCorePathwayExecutionPlan,
  plan: NeuralCorePropagationPlan,
): NeuralCoreTransmission => ({
  id: queued.transmissionId,
  synapseId: queued.synapseId,
  kind: "process",
  status: pathwayPlan.pathway.status ?? plan.topology.status ?? "active",
  intensity: pathwayPlan.pathway.activity ?? plan.topology.globalActivity ?? 0.7,
  progress: 0,
  speed: 0.5,
});

const resolveQueuedTransmission = (
  queued: NeuralCoreQueuedPropagation,
  plan: NeuralCorePropagationPlan,
): NeuralCoreTransmission | undefined => {
  const transmission = plan.transmissionsById.get(queued.transmissionId);
  if (transmission) {
    return transmission;
  }
  const pathwayPlan = queued.pathwayId
    ? plan.pathwayPlansById.get(queued.pathwayId)
    : undefined;
  return pathwayPlan
    ? createSyntheticPathwayTransmission(queued, pathwayPlan, plan)
    : undefined;
};

const createPropagation = (
  queued: NeuralCoreQueuedPropagation,
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
): NeuralCoreSynapticPropagation | undefined => {
  const synapse = plan.synapsesById.get(queued.synapseId);
  const transmission = resolveQueuedTransmission(queued, plan);
  if (!synapse || synapse.status === "disabled" || !transmission || transmission.status === "disabled") {
    return undefined;
  }

  const direction = getNeuralCorePropagationDirection(synapse, transmission, config);
  const durationSeconds = getEffectiveTransmissionDuration(transmission, synapse, config);
  const progress = queued.pathwayId ? 0 : clampPropagationValue(transmission.progress ?? 0);
  return {
    propagationId: queued.queueId,
    transmissionId: transmission.id,
    synapseId: synapse.id,
    pathwayId: queued.pathwayId,
    pathwayStageIndex: queued.pathwayStageIndex,
    pathwayLoopCount: queued.pathwayLoopCount,
    fromClusterId: direction === "forward" ? synapse.fromClusterId : synapse.toClusterId,
    toClusterId: direction === "forward" ? synapse.toClusterId : synapse.fromClusterId,
    direction,
    phase: "queued",
    progress,
    elapsedSeconds: progress * durationSeconds,
    durationSeconds,
    intensity: getEffectiveTransmissionIntensity(transmission, synapse, config),
    effectiveSpeed: 1 / Math.max(0.001, durationSeconds),
    effectiveWeight: clampPropagationValue(synapse.weight ?? 0.5),
    status: transmission.status ?? synapse.status ?? "active",
    arrivalEventEmitted: false,
    startedEventEmitted: false,
  };
};

const hasLifecycle = (
  runtime: Pick<
    NeuralCorePropagationRuntimeState,
    "queuedPropagations" | "activePropagations" | "completedPropagations"
  >,
  lifecycleId: string,
): boolean => {
  return runtime.queuedPropagations.some(({ queueId }) => queueId === lifecycleId)
    || runtime.activePropagations.some(({ propagationId }) => propagationId === lifecycleId)
    || runtime.completedPropagations.some(({ propagationId }) => propagationId === lifecycleId);
};

const enqueue = (
  runtime: NeuralCorePropagationRuntimeState,
  queued: NeuralCoreQueuedPropagation,
): void => {
  if (!hasLifecycle(runtime, queued.queueId)) {
    runtime.queuedPropagations.push(queued);
    runtime.queuedPropagations.sort(compareQueuedPropagations);
  }
};

const fillAvailableSlots = (
  runtime: NeuralCorePropagationRuntimeState,
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
): void => {
  while (
    runtime.activePropagations.length < config.runtime.maximumConcurrentTransmissions
    && runtime.queuedPropagations.length > 0
  ) {
    const queued = runtime.queuedPropagations.shift();
    if (!queued) {
      break;
    }
    const propagation = createPropagation(queued, plan, config);
    if (propagation) {
      runtime.activePropagations.push(propagation);
    }
  }
};

const createPathwayRuntime = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
  topologyStatus?: NeuralCoreTopologyStatus,
): NeuralCorePathwayRuntime => ({
  pathwayId: pathwayPlan.pathway.id,
  currentStageIndex: -1,
  startedStageIndices: [],
  completedStageIndices: [],
  status: pathwayPlan.runnableStageCount === 0
    ? "disabled"
    : pathwayPlan.pathway.status ?? topologyStatus ?? "idle",
  progress: 0,
  loopCount: 0,
});

const createPathwayQueueItem = (
  pathwayPlan: NeuralCorePathwayExecutionPlan,
  stageIndex: number,
  loopCount: number,
  elapsedSeconds: number,
  plan: NeuralCorePropagationPlan,
): NeuralCoreQueuedPropagation => {
  const stage = pathwayPlan.stages.find(({ originalStageIndex }) => {
    return originalStageIndex === stageIndex;
  });
  if (!stage) {
    throw new Error(`Missing pathway stage ${stageIndex}`);
  }
  const transmissionId = stage.transmissionId
    ?? `${pathwayPlan.pathway.id}:transmission:${stage.originalStageIndex}`;
  const transmission = plan.transmissionsById.get(transmissionId);
  return {
    queueId: `${pathwayPlan.pathway.id}:loop:${loopCount}:stage:${stage.originalStageIndex}`,
    transmissionId,
    synapseId: stage.synapseId,
    pathwayId: pathwayPlan.pathway.id,
    pathwayStageIndex: stage.originalStageIndex,
    pathwayLoopCount: loopCount,
    priority: 100 + clampPropagationValue(
      transmission?.intensity ?? pathwayPlan.pathway.activity ?? 0.7,
    ),
    enqueuedAtSeconds: elapsedSeconds,
  };
};

export const createNeuralCorePropagationRuntime = ({
  plan,
  config: input,
}: CreateNeuralCorePropagationRuntimeParams): NeuralCorePropagationRuntimeState => {
  const config = resolveNeuralCorePropagationConfig(input);
  const clusterActivations: Record<string, NeuralCoreClusterActivation> = {};
  for (const cluster of plan?.topology.clusters ?? []) {
    clusterActivations[cluster.id] = {
      clusterId: cluster.id,
      currentIntensity: 0,
      targetIntensity: 0,
      decayPerSecond: config.activation.activationDecayPerSecond,
      receivedStimulus: 0,
      lastUpdatedAt: 0,
      status: cluster.status ?? "idle",
    };
  }

  const runtime: NeuralCorePropagationRuntimeState = {
    elapsedSeconds: 0,
    clusterActivations,
    queuedPropagations: [],
    activePropagations: [],
    completedPropagations: [],
    pathwayRuntimes: (plan?.pathwayPlans ?? []).map((pathwayPlan) => {
      return createPathwayRuntime(pathwayPlan, plan?.topology.status);
    }),
  };
  if (!config.enabled || !plan) {
    return runtime;
  }

  const claimedTransmissionIds = new Set(
    plan.pathwayPlans
      .filter(({ pathway, runnableStageCount }) => {
        return runnableStageCount > 0
          && isRunnableStatus(pathway.status ?? plan.topology.status);
      })
      .flatMap(({ stages }) => stages
        .filter(({ runnable, transmissionId }) => runnable && transmissionId !== undefined)
        .flatMap(({ transmissionId }) => transmissionId === undefined ? [] : [transmissionId])),
  );
  for (const transmission of plan.topology.transmissions) {
    const synapse = plan.synapsesById.get(transmission.synapseId);
    if (
      !claimedTransmissionIds.has(transmission.id)
      && isTransmissionRunnable(transmission)
      && synapse
      && synapse.status !== "disabled"
    ) {
      enqueue(runtime, {
        queueId: `transmission:${transmission.id}:lifecycle:0`,
        transmissionId: transmission.id,
        synapseId: transmission.synapseId,
        priority: clampPropagationValue(transmission.intensity ?? 0.5),
        enqueuedAtSeconds: 0,
      });
    }
  }

  for (const [index, pathwayPlan] of plan.pathwayPlans.entries()) {
    const pathwayRuntime = runtime.pathwayRuntimes[index];
    const firstStage = getFirstRunnablePathwayStage(pathwayPlan);
    if (
      firstStage
      && pathwayRuntime
      && isRunnableStatus(pathwayPlan.pathway.status ?? plan.topology.status)
    ) {
      enqueue(runtime, createPathwayQueueItem(
        pathwayPlan,
        firstStage.originalStageIndex,
        0,
        0,
        plan,
      ));
      pathwayRuntime.currentStageIndex = firstStage.originalStageIndex;
      pathwayRuntime.startedStageIndices = [firstStage.originalStageIndex];
    }
  }
  fillAvailableSlots(runtime, plan, config);
  return runtime;
};

const decayClusterActivation = (
  activation: NeuralCoreClusterActivation,
  deltaSeconds: number,
  elapsedSeconds: number,
): NeuralCoreClusterActivation => {
  const targetIntensity = Math.max(
    0,
    activation.targetIntensity - activation.decayPerSecond * deltaSeconds,
  );
  const responseFraction = 1 - Math.exp(-8 * deltaSeconds);
  const approachedIntensity = activation.currentIntensity
    + (targetIntensity - activation.currentIntensity) * responseFraction;
  const currentIntensity = activation.currentIntensity > targetIntensity
    ? Math.max(targetIntensity, activation.currentIntensity - activation.decayPerSecond * deltaSeconds)
    : approachedIntensity;
  const stimulusDecay = Math.max(
    0,
    Math.abs(activation.receivedStimulus) - activation.decayPerSecond * deltaSeconds,
  );
  return {
    ...activation,
    currentIntensity,
    targetIntensity,
    receivedStimulus: Math.sign(activation.receivedStimulus) * stimulusDecay,
    lastUpdatedAt: elapsedSeconds,
  };
};

const activateSourceCluster = (
  activation: NeuralCoreClusterActivation | undefined,
  propagation: NeuralCoreSynapticPropagation,
  config: NeuralCorePropagationConfig,
): void => {
  if (!activation) {
    return;
  }
  const stimulus = propagation.intensity * config.activation.sourceActivationGain;
  activation.targetIntensity = clampPropagationValue(
    Math.max(activation.targetIntensity, stimulus),
    0,
    config.activation.maximumClusterActivation,
  );
  activation.currentIntensity = Math.max(activation.currentIntensity, activation.targetIntensity * 0.44);
  activation.receivedStimulus = Math.max(activation.receivedStimulus, stimulus * 0.5);
  activation.status = propagation.status;
};

const stimulateDestinationCluster = (
  activation: NeuralCoreClusterActivation | undefined,
  propagation: NeuralCoreSynapticPropagation,
  synapse: NeuralCoreSynapse,
  config: NeuralCorePropagationConfig,
): number => {
  if (!activation) {
    return 0;
  }
  const stimulus = getEffectiveClusterStimulus(propagation.intensity, synapse, config);
  const plasticity = clampPropagationValue(synapse.plasticity ?? 0.5);
  activation.receivedStimulus = stimulus;
  activation.effectKind = synapse.kind;
  activation.status = propagation.status;
  if (synapse.kind === "inhibitory") {
    activation.targetIntensity = Math.max(0, activation.targetIntensity + stimulus);
    activation.currentIntensity = Math.max(0, activation.currentIntensity + stimulus * 0.62);
    activation.decayPerSecond = config.activation.activationDecayPerSecond
      * config.activation.inhibitoryDecayMultiplier;
    return stimulus;
  }
  const persistence = synapse.kind === "modulatory"
    ? config.activation.modulatoryPersistenceMultiplier
    : 1;
  activation.targetIntensity = clampPropagationValue(
    activation.targetIntensity + stimulus,
    0,
    config.activation.maximumClusterActivation,
  );
  activation.currentIntensity = Math.max(
    activation.currentIntensity,
    activation.targetIntensity * (synapse.kind === "relay" ? 0.72 : 0.58),
  );
  activation.decayPerSecond = config.activation.activationDecayPerSecond
    / Math.max(0.1, persistence * (1 + plasticity * config.synapse.plasticityInfluence));
  return stimulus;
};

const getPropagationPhase = (
  progress: number,
  threshold: number,
): NeuralCoreSynapticPropagation["phase"] => {
  if (progress >= 1) {
    return "completed";
  }
  if (progress >= threshold) {
    return "arriving";
  }
  return progress < 0.12 ? "departing" : "traveling";
};

const processActivePropagation = (
  propagation: NeuralCoreSynapticPropagation,
  runtime: NeuralCorePropagationRuntimeState,
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
  delta: number,
  elapsedSeconds: number,
  events: NeuralCorePropagationEvent[],
): NeuralCoreSynapticPropagation => {
  const synapse = plan.synapsesById.get(propagation.synapseId);
  if (!synapse || synapse.status === "disabled") {
    return { ...propagation, phase: "cancelled", completedAtSeconds: elapsedSeconds };
  }
  if (!propagation.startedEventEmitted) {
    activateSourceCluster(runtime.clusterActivations[propagation.fromClusterId], propagation, config);
    if (propagation.pathwayId && propagation.pathwayStageIndex !== undefined) {
      events.push(createEvent("pathway-stage-started", elapsedSeconds, propagation.propagationId, {
        pathwayId: propagation.pathwayId,
        pathwayStageIndex: propagation.pathwayStageIndex,
        synapseId: propagation.synapseId,
        transmissionId: propagation.transmissionId,
        clusterId: propagation.fromClusterId,
        intensity: propagation.intensity,
        status: propagation.status,
      }));
    }
    events.push(createEvent("transmission-started", elapsedSeconds, propagation.propagationId, {
      pathwayId: propagation.pathwayId,
      pathwayStageIndex: propagation.pathwayStageIndex,
      synapseId: propagation.synapseId,
      transmissionId: propagation.transmissionId,
      clusterId: propagation.fromClusterId,
      intensity: propagation.intensity,
      status: propagation.status,
    }));
  }

  const previousProgress = propagation.progress;
  const progress = clampPropagationValue(previousProgress + delta / propagation.durationSeconds);
  const phase = getPropagationPhase(progress, config.timing.destinationActivationThreshold);
  const destinationActivation = runtime.clusterActivations[propagation.toClusterId];
  const threshold = config.timing.destinationActivationThreshold;
  if (destinationActivation && progress >= Math.max(0, threshold - 0.16) && progress < threshold) {
    destinationActivation.targetIntensity = Math.max(
      destinationActivation.targetIntensity,
      propagation.intensity * config.activation.destinationActivationGain * 0.14,
    );
  }

  let arrivalEventEmitted = propagation.arrivalEventEmitted;
  if (!arrivalEventEmitted && progress >= threshold) {
    const stimulus = stimulateDestinationCluster(destinationActivation, propagation, synapse, config);
    events.push(createEvent("transmission-arriving", elapsedSeconds, propagation.propagationId, {
      pathwayId: propagation.pathwayId,
      pathwayStageIndex: propagation.pathwayStageIndex,
      synapseId: propagation.synapseId,
      transmissionId: propagation.transmissionId,
      clusterId: propagation.toClusterId,
      intensity: propagation.intensity,
      status: propagation.status,
    }));
    events.push(createEvent(
      synapse.kind === "inhibitory" ? "cluster-inhibited" : "cluster-activated",
      elapsedSeconds,
      propagation.propagationId,
      {
        pathwayId: propagation.pathwayId,
        pathwayStageIndex: propagation.pathwayStageIndex,
        synapseId: propagation.synapseId,
        transmissionId: propagation.transmissionId,
        clusterId: propagation.toClusterId,
        intensity: Math.abs(stimulus),
        status: propagation.status,
      },
    ));
    arrivalEventEmitted = true;
  }

  if (phase === "completed") {
    events.push(createEvent("transmission-completed", elapsedSeconds, propagation.propagationId, {
      pathwayId: propagation.pathwayId,
      pathwayStageIndex: propagation.pathwayStageIndex,
      synapseId: propagation.synapseId,
      transmissionId: propagation.transmissionId,
      clusterId: propagation.toClusterId,
      intensity: propagation.intensity,
      status: propagation.status,
    }));
  }
  return {
    ...propagation,
    phase,
    progress,
    elapsedSeconds: propagation.elapsedSeconds + delta,
    arrivalEventEmitted,
    startedEventEmitted: true,
    completedAtSeconds: phase === "completed" ? elapsedSeconds : undefined,
  };
};

const updatePathways = (
  runtime: NeuralCorePropagationRuntimeState,
  plan: NeuralCorePropagationPlan,
  config: NeuralCorePropagationConfig,
  events: NeuralCorePropagationEvent[],
): void => {
  for (const pathwayRuntime of runtime.pathwayRuntimes) {
    const pathwayPlan = plan.pathwayPlansById.get(pathwayRuntime.pathwayId);
    if (!pathwayPlan || pathwayPlan.runnableStageCount === 0) {
      continue;
    }
    const lifecyclePropagations = [
      ...runtime.activePropagations,
      ...runtime.completedPropagations,
    ].filter((propagation) => {
      return propagation.pathwayId === pathwayRuntime.pathwayId
        && propagation.pathwayLoopCount === pathwayRuntime.loopCount;
    });
    const completedStageIndices = [...new Set([
      ...pathwayRuntime.completedStageIndices,
      ...lifecyclePropagations
        .filter(({ phase }) => phase === "completed")
        .flatMap(({ pathwayStageIndex }) => pathwayStageIndex === undefined ? [] : [pathwayStageIndex]),
    ])];
    const progressByStageIndex = new Map<number, number>();
    for (const propagation of lifecyclePropagations) {
      if (propagation.pathwayStageIndex !== undefined) {
        progressByStageIndex.set(propagation.pathwayStageIndex, propagation.progress);
      }
    }
    pathwayRuntime.completedStageIndices = completedStageIndices;
    pathwayRuntime.progress = calculateExecutablePathwayProgress(
      pathwayPlan,
      completedStageIndices,
      progressByStageIndex,
    );

    const currentPropagation = lifecyclePropagations.find(({ pathwayStageIndex }) => {
      return pathwayStageIndex === pathwayRuntime.currentStageIndex;
    });
    const nextStage = getNextRunnablePathwayStage(
      pathwayPlan,
      pathwayRuntime.currentStageIndex,
    );
    if (
      nextStage
      && canStartPathwayStage(
        nextStage.originalStageIndex,
        pathwayRuntime.startedStageIndices,
        currentPropagation?.progress ?? 0,
        config,
      )
    ) {
      enqueue(runtime, createPathwayQueueItem(
        pathwayPlan,
        nextStage.originalStageIndex,
        pathwayRuntime.loopCount,
        runtime.elapsedSeconds,
        plan,
      ));
      pathwayRuntime.currentStageIndex = nextStage.originalStageIndex;
      pathwayRuntime.startedStageIndices.push(nextStage.originalStageIndex);
    }

    const isComplete = completedStageIndices.length === pathwayPlan.runnableStageCount;
    if (!isComplete) {
      continue;
    }

    const completionId = `${pathwayRuntime.pathwayId}:loop:${pathwayRuntime.loopCount}`;
    if (pathwayRuntime.lastCompletedLoopCount !== pathwayRuntime.loopCount) {
      events.push(createEvent("pathway-completed", runtime.elapsedSeconds, completionId, {
        pathwayId: pathwayRuntime.pathwayId,
        intensity: pathwayPlan.pathway.activity,
        status: pathwayPlan.pathway.status ?? plan.topology.status,
      }));
      pathwayRuntime.lastCompletedLoopCount = pathwayRuntime.loopCount;
    }
    if (
      config.runtime.loopActivePathways
      && isRunnableStatus(pathwayPlan.pathway.status ?? plan.topology.status)
    ) {
      pathwayRuntime.loopCount += 1;
      pathwayRuntime.currentStageIndex = -1;
      pathwayRuntime.startedStageIndices = [];
      pathwayRuntime.completedStageIndices = [];
      pathwayRuntime.progress = 0;
      const firstStage = getFirstRunnablePathwayStage(pathwayPlan);
      if (firstStage) {
        enqueue(runtime, createPathwayQueueItem(
          pathwayPlan,
          firstStage.originalStageIndex,
          pathwayRuntime.loopCount,
          runtime.elapsedSeconds,
          plan,
        ));
        pathwayRuntime.currentStageIndex = firstStage.originalStageIndex;
        pathwayRuntime.startedStageIndices = [firstStage.originalStageIndex];
      }
    } else {
      pathwayRuntime.progress = 1;
    }
  }
};

const advanceStep = (
  runtime: NeuralCorePropagationRuntimeState,
  plan: NeuralCorePropagationPlan,
  delta: number,
  config: NeuralCorePropagationConfig,
): NeuralCorePropagationStepResult => {
  const elapsedSeconds = runtime.elapsedSeconds + delta;
  const events: NeuralCorePropagationEvent[] = [];
  const nextRuntime: NeuralCorePropagationRuntimeState = {
    elapsedSeconds,
    clusterActivations: Object.fromEntries(
      Object.entries(runtime.clusterActivations).map(([clusterId, activation]) => {
        return [clusterId, decayClusterActivation(activation, delta, elapsedSeconds)];
      }),
    ),
    queuedPropagations: runtime.queuedPropagations.map((queued) => ({ ...queued })),
    activePropagations: [],
    completedPropagations: runtime.completedPropagations
      .filter(({ completedAtSeconds }) => {
        return elapsedSeconds - (completedAtSeconds ?? elapsedSeconds)
          <= config.runtime.completedPropagationRetentionSeconds;
      })
      .map((propagation) => ({ ...propagation })),
    pathwayRuntimes: runtime.pathwayRuntimes.map((pathwayRuntime) => ({
      ...pathwayRuntime,
      startedStageIndices: [...pathwayRuntime.startedStageIndices],
      completedStageIndices: [...pathwayRuntime.completedStageIndices],
    })),
  };
  for (const propagation of runtime.activePropagations) {
    const updated = processActivePropagation(
      propagation,
      nextRuntime,
      plan,
      config,
      delta,
      elapsedSeconds,
      events,
    );
    if (updated.phase === "completed" || updated.phase === "cancelled") {
      nextRuntime.completedPropagations.push(updated);
    } else {
      nextRuntime.activePropagations.push(updated);
    }
  }
  updatePathways(nextRuntime, plan, config, events);
  fillAvailableSlots(nextRuntime, plan, config);
  return { runtime: nextRuntime, events };
};

export const advanceNeuralCorePropagation = ({
  runtime,
  plan,
  deltaSeconds,
  config,
}: AdvanceNeuralCorePropagationParams): NeuralCorePropagationStepResult => {
  if (!config.enabled || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return { runtime, events: [] };
  }
  let nextRuntime = runtime;
  const events: NeuralCorePropagationEvent[] = [];
  let remainingSeconds = Math.min(
    deltaSeconds,
    config.timing.maximumCatchUpSeconds,
  );
  for (
    let substepIndex = 0;
    substepIndex < config.timing.maximumSubstepsPerAdvance
      && remainingSeconds > 0.0000001;
    substepIndex += 1
  ) {
    const delta = Math.min(remainingSeconds, config.timing.maximumDeltaSeconds);
    const step = advanceStep(nextRuntime, plan, delta, config);
    nextRuntime = step.runtime;
    events.push(...step.events);
    remainingSeconds -= delta;
  }
  return { runtime: nextRuntime, events };
};
