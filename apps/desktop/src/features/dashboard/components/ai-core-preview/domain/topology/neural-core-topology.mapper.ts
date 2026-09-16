import type {
  NeuralCoreEntity,
  NeuralCoreEntityKind,
  NeuralCoreGroup,
  NeuralCoreMetadata,
  NeuralCoreMetadataValue,
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

const isMetadataRecord = (
  value: NeuralCoreMetadataValue | undefined,
): value is NeuralCoreMetadata => value !== null
  && typeof value === "object"
  && !Array.isArray(value);

const getMetadataNumber = (
  metadata: NeuralCoreMetadata | undefined,
  key: string,
): number | undefined => {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const getMetadataString = (
  metadata: NeuralCoreMetadata | undefined,
  key: string,
): string | undefined => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
};

const getMetadataStringArray = (
  metadata: NeuralCoreMetadata | undefined,
  key: string,
): string[] | undefined => {
  const value = metadata?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;
};

const getPositionHint = (
  metadata: NeuralCoreMetadata | undefined,
): NeuralCoreCluster["positionHint"] => {
  const value = metadata?.__neuralCorePositionHint;
  if (!isMetadataRecord(value)) return undefined;
  const region = getMetadataString(value, "region");
  const hemisphere = getMetadataString(value, "hemisphere");
  const depth = getMetadataString(value, "depth");
  const priority = getMetadataNumber(value, "priority");
  return {
    ...(region === "frontal" || region === "parietal" || region === "temporal"
      || region === "occipital" || region === "central" || region === "inner"
      || region === "outer" || region === "left" || region === "right"
      || region === "lower" || region === "upper" || region === "custom"
      ? { region }
      : {}),
    ...(hemisphere === "left" || hemisphere === "right" || hemisphere === "center"
      ? { hemisphere }
      : {}),
    ...(depth === "surface" || depth === "middle" || depth === "deep" ? { depth } : {}),
    ...(priority === undefined ? {} : { priority }),
  };
};

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

const getSignalMetadataString = (
  signal: NeuralCoreSignal,
  key: string,
): string | undefined => {
  const value = signal.metadata?.[key];
  return typeof value === "string" ? value : undefined;
};

const getSignalSynapseId = (signal: NeuralCoreSignal): string => (
  getSignalMetadataString(signal, "synapseId") ?? `synapse:${signal.id}`
);

const createClusterFromEntity = (entity: NeuralCoreEntity): NeuralCoreCluster => {
  return {
    id: entity.id,
    label: entity.label,
    kind: mapEntityKindToClusterKind(entity.kind),
    status: mapStatusToTopologyStatus(entity.status),
    activity: entity.activity,
    importance: entity.importance,
    stability: entity.health ?? getMetadataNumber(entity.metadata, "__neuralCoreStability"),
    plasticity: getMetadataNumber(entity.metadata, "__neuralCorePlasticity"),
    positionHint: getPositionHint(entity.metadata),
    semanticContext: {
      name: entity.label ?? entity.id,
      description: getMetadataString(entity.metadata, "description"),
      tags: getMetadataStringArray(entity.metadata, "tags"),
    },
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
    stability: getMetadataNumber(group.metadata, "__neuralCoreStability"),
    plasticity: getMetadataNumber(group.metadata, "__neuralCorePlasticity"),
    positionHint: getPositionHint(group.metadata),
    semanticContext: {
      name: group.label ?? group.id,
      description: getMetadataString(group.metadata, "description"),
      tags: getMetadataStringArray(group.metadata, "tags"),
    },
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
    id: getSignalSynapseId(signal),
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
    synapseId: getSignalSynapseId(signal),
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
    synapseIds: activeSignals.map(getSignalSynapseId),
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
        .map(getSignalSynapseId);

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

const getConfiguredPathways = (state: NeuralCoreState): NeuralCorePathway[] | undefined => {
  const value = state.metadata?.__neuralCorePathways;
  if (!Array.isArray(value)) return undefined;
  const pathways = value.flatMap((candidate): NeuralCorePathway[] => {
    if (!isMetadataRecord(candidate)) return [];
    const id = getMetadataString(candidate, "id");
    const clusterIds = getMetadataStringArray(candidate, "clusterIds");
    const synapseIds = getMetadataStringArray(candidate, "synapseIds");
    if (id === undefined || clusterIds === undefined || synapseIds === undefined) return [];
    const configuredStatus = getMetadataString(candidate, "status");
    const status: NeuralCoreTopologyStatus = configuredStatus === "recovering"
      ? "processing"
      : configuredStatus === "idle" || configuredStatus === "active"
        || configuredStatus === "processing" || configuredStatus === "success"
        || configuredStatus === "warning" || configuredStatus === "error"
        || configuredStatus === "disabled"
        ? configuredStatus
        : mapModeToTopologyStatus(state.mode);
    return [{
      id,
      label: getMetadataString(candidate, "label"),
      status,
      clusterIds,
      synapseIds,
      activity: getMetadataNumber(candidate, "activity"),
      metadata: isMetadataRecord(candidate.metadata) ? candidate.metadata : undefined,
    }];
  });
  return pathways.length > 0 ? pathways : undefined;
};

export const createNeuralCoreTopologyFromState = (
  state: NeuralCoreState,
): NeuralCoreTopology => {
  const groups = state.groups ?? [];
  const synapses = state.signals.map(createSynapseFromSignal);
  const signalPathway = createSignalPathway(state.signals, state);
  const pathways = getConfiguredPathways(state) ?? (signalPathway
    ? [signalPathway]
    : createGroupPathways(groups, state.entities, state.signals));

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
