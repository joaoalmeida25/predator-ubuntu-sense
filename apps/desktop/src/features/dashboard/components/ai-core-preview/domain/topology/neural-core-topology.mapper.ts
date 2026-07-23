import type {
  NeuralCoreEntity,
  NeuralCoreEntityKind,
  NeuralCoreGroup,
  NeuralCoreSignal,
  NeuralCoreSignalKind,
  NeuralCoreState,
  NeuralCoreStatus,
} from "../contract/neural-core-contract.types";
import type {
  NeuralCoreCluster,
  NeuralCoreClusterKind,
  NeuralCorePathway,
  NeuralCoreSynapse,
  NeuralCoreSynapseKind,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
  NeuralCoreTransmission,
  NeuralCoreTransmissionKind,
} from "./neural-core-topology.types";
import {
  clampNeuralCoreTopologyValue,
  normalizeNeuralCoreTopology,
} from "./neural-core-topology.utils";

const mapStatusToTopologyStatus = (
  status?: NeuralCoreStatus,
): NeuralCoreTopologyStatus | undefined => {
  switch (status) {
    case "active":
      return "active";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "disabled":
      return "disabled";
    case "neutral":
      return "idle";
    case undefined:
      return undefined;
  }
};

const mapModeToTopologyStatus = (
  mode: NeuralCoreState["mode"],
): NeuralCoreTopologyStatus => {
  switch (mode) {
    case "idle":
      return "idle";
    case "processing":
    case "thinking":
    case "learning":
    case "synchronizing":
      return "processing";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "observing":
      return "active";
  }
};

const mapEntityKindToClusterKind = (
  kind: NeuralCoreEntityKind,
): NeuralCoreClusterKind => {
  return kind;
};

const mapSignalKindToTransmissionKind = (
  kind: NeuralCoreSignalKind,
): NeuralCoreTransmissionKind => {
  return kind;
};

const mapSignalToSynapseKind = (
  signal: NeuralCoreSignal,
): NeuralCoreSynapseKind => {
  const configuredKind = signal.metadata?.synapseKind;
  if (
    configuredKind === "excitatory"
    || configuredKind === "inhibitory"
    || configuredKind === "modulatory"
    || configuredKind === "bidirectional"
    || configuredKind === "relay"
  ) {
    return configuredKind;
  }

  if (signal.status === "warning" || signal.kind === "warning") {
    return "modulatory";
  }

  if (signal.status === "error" || signal.kind === "error") {
    return "inhibitory";
  }

  if (signal.from === signal.to) {
    return "relay";
  }

  return "excitatory";
};

const getSignalMetadataNumber = (
  signal: NeuralCoreSignal,
  key: string,
  fallback: number,
): number => {
  const value = signal.metadata?.[key];
  return typeof value === "number" ? clampNeuralCoreTopologyValue(value) : fallback;
};

const getSignalDirection = (
  signal: NeuralCoreSignal,
): NeuralCoreSynapse["direction"] => {
  const direction = signal.metadata?.direction;
  return direction === "forward" || direction === "backward" || direction === "bidirectional"
    ? direction
    : "forward";
};

const createClusterFromEntity = (entity: NeuralCoreEntity): NeuralCoreCluster => {
  return {
    id: entity.id,
    label: entity.label,
    kind: mapEntityKindToClusterKind(entity.kind),
    status: mapStatusToTopologyStatus(entity.status),
    activity: entity.activity,
    importance: entity.importance,
    stability: entity.health,
    entityIds: [entity.id],
    metadata: entity.metadata,
  };
};

const createClusterFromGroup = (
  group: NeuralCoreGroup,
  entities: NeuralCoreEntity[],
): NeuralCoreCluster => {
  return {
    id: group.id,
    label: group.label,
    kind: "custom",
    status: mapStatusToTopologyStatus(group.status),
    activity: group.activity,
    importance: group.activity,
    entityIds: entities
      .filter((entity) => entity.groupId === group.id)
      .map((entity) => entity.id),
    metadata: group.metadata,
  };
};

const createSynapseFromSignal = (signal: NeuralCoreSignal): NeuralCoreSynapse => {
  const intensity = clampNeuralCoreTopologyValue(signal.intensity);
  const speed = clampNeuralCoreTopologyValue(signal.speed);

  return {
    id: `synapse:${signal.id}`,
    fromClusterId: signal.from,
    toClusterId: signal.to,
    kind: mapSignalToSynapseKind(signal),
    status: mapStatusToTopologyStatus(signal.status),
    weight: getSignalMetadataNumber(signal, "weight", intensity),
    conductivity: getSignalMetadataNumber(signal, "conductivity", speed),
    plasticity: getSignalMetadataNumber(
      signal,
      "plasticity",
      clampNeuralCoreTopologyValue((intensity + speed) / 2),
    ),
    direction: getSignalDirection(signal),
    metadata: signal.metadata,
  };
};

const createTransmissionFromSignal = (signal: NeuralCoreSignal): NeuralCoreTransmission => {
  const configuredDirection = signal.metadata?.transmissionDirection;
  return {
    id: signal.id,
    synapseId: `synapse:${signal.id}`,
    kind: mapSignalKindToTransmissionKind(signal.kind),
    status: mapStatusToTopologyStatus(signal.status),
    intensity: signal.intensity,
    progress: signal.progress,
    speed: signal.speed,
    direction: configuredDirection === "forward" || configuredDirection === "backward"
      ? configuredDirection
      : undefined,
    startedAt: signal.startedAt,
    metadata: signal.metadata,
  };
};

const getOrderedClusterIdsFromSignals = (signals: NeuralCoreSignal[]): string[] => {
  return signals.reduce<string[]>((clusterIds, signal) => {
    if (!clusterIds.includes(signal.from)) {
      clusterIds.push(signal.from);
    }

    if (!clusterIds.includes(signal.to)) {
      clusterIds.push(signal.to);
    }

    return clusterIds;
  }, []);
};

const createSignalPathway = (
  signals: NeuralCoreSignal[],
  state: NeuralCoreState,
): NeuralCorePathway | undefined => {
  const activeSignals = signals.filter((signal) => {
    return signal.status === "active"
      || signal.status === "success"
      || signal.status === "warning"
      || signal.status === "error";
  });

  if (activeSignals.length === 0) {
    return undefined;
  }

  return {
    id: "signal-pathway",
    label: "Signal Pathway",
    status: mapModeToTopologyStatus(state.mode),
    clusterIds: getOrderedClusterIdsFromSignals(activeSignals),
    synapseIds: activeSignals.map((signal) => `synapse:${signal.id}`),
    activity: state.globalActivity,
  };
};

const createGroupPathways = (
  groups: NeuralCoreGroup[],
  entities: NeuralCoreEntity[],
  signals: NeuralCoreSignal[],
): NeuralCorePathway[] => {
  return groups
    .map((group): NeuralCorePathway | undefined => {
      const groupEntityIds = entities
        .filter((entity) => entity.groupId === group.id)
        .map((entity) => entity.id);
      const groupSignalIds = signals
        .filter((signal) => groupEntityIds.includes(signal.from) && groupEntityIds.includes(signal.to))
        .map((signal) => `synapse:${signal.id}`);

      if (groupEntityIds.length === 0 || groupSignalIds.length === 0) {
        return undefined;
      }

      return {
        id: `pathway:${group.id}`,
        label: group.label,
        status: mapStatusToTopologyStatus(group.status),
        clusterIds: groupEntityIds,
        synapseIds: groupSignalIds,
        activity: group.activity,
        metadata: group.metadata,
      };
    })
    .filter((pathway): pathway is NeuralCorePathway => pathway !== undefined);
};

export const createNeuralCoreTopologyFromState = (
  state: NeuralCoreState,
): NeuralCoreTopology => {
  const groups = state.groups ?? [];
  const synapses = state.signals.map(createSynapseFromSignal);
  const signalPathway = createSignalPathway(state.signals, state);
  const pathways = signalPathway
    ? [signalPathway]
    : createGroupPathways(groups, state.entities, state.signals);

  return normalizeNeuralCoreTopology({
    clusters: [
      ...groups.map((group) => createClusterFromGroup(group, state.entities)),
      ...state.entities.map(createClusterFromEntity),
    ],
    synapses,
    transmissions: state.signals.map(createTransmissionFromSignal),
    pathways,
    status: mapModeToTopologyStatus(state.mode),
    globalActivity: state.globalActivity,
    metadata: state.metadata,
  });
};
