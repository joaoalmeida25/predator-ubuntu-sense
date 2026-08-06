import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativePhaseKind,
} from "../../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreOperationalRuntimeSnapshot } from "../runtime/neural-core-operational-runtime.types";

const formatPrimaryMetric = (
  snapshot: NeuralCoreOperationalRuntimeSnapshot,
): string | undefined => {
  const metric = snapshot.narrative?.primaryMetric;
  if (!metric) {
    return undefined;
  }
  const value = typeof metric.value === "boolean"
    ? metric.value ? "Yes" : "No"
    : String(metric.value);
  return `${metric.name}: ${value}${metric.unit ? ` ${metric.unit}` : ""}.`;
};

const mapNarrativeKind = (
  snapshot: NeuralCoreOperationalRuntimeSnapshot,
): NeuralCoreNarrativePhaseKind => {
  if (snapshot.status === "completed") {
    return "completing";
  }
  if (snapshot.status === "failed") return "failing";
  if (snapshot.status === "recovering") return "recovering";
  if (snapshot.narrative?.status === "warning") return "warning";
  if (snapshot.narrative?.status === "error") return "failing";
  if (snapshot.narrative?.status === "recovering") return "recovering";
  if (snapshot.activeRouteId) return "transmitting";
  switch (snapshot.narrative?.status) {
    case "success": return "completing";
    case "processing": return "executing";
    case "idle": return "idle";
    default: return snapshot.activeRouteId ? "transmitting" : "custom";
  }
};

export const mapOperationalRuntimeToNeuralCoreNarrative = (
  snapshot: NeuralCoreOperationalRuntimeSnapshot,
): NeuralCoreNarrative | undefined => {
  const narrative = snapshot.narrative;
  if (snapshot.status === "idle" || !narrative) {
    return undefined;
  }
  const clusterIds = [
    snapshot.activeClusterId,
    snapshot.nextClusterId,
    ...(snapshot.impact?.affectedClusterIds.slice(0, 2) ?? []),
  ]
    .filter((value, index, values): value is string => (
      value !== undefined && values.indexOf(value) === index
    ));
  const label = snapshot.status === "completed"
    ? "Execution completed"
    : narrative.title;
  const baseDescription = snapshot.status === "completed"
    ? snapshot.outcome?.summary ?? narrative.message
    : narrative.message;
  const primaryMetric = formatPrimaryMetric(snapshot);
  const description = primaryMetric && !baseDescription.includes(primaryMetric)
    ? `${baseDescription} ${primaryMetric}`
    : baseDescription;
  return {
    id: `narrative:operational:${snapshot.executionId}:${narrative.eventId}:${snapshot.status}`,
    durationSeconds: 3600,
    loop: false,
    phases: [{
      id: `operational:${narrative.eventId}`,
      kind: mapNarrativeKind(snapshot),
      label,
      description,
      startSeconds: 0,
      durationSeconds: 3600,
      clusterIds,
      ...(snapshot.activeRouteId ? { synapseIds: [snapshot.activeRouteId] } : {}),
      emphasis: {
        cluster: snapshot.status === "completed" ? 0.62 : 0.94,
        route: snapshot.activeRouteId ? 1 : 0.24,
        contextDim: snapshot.status === "completed" ? 0.18 : 0.48,
        internalActivity: snapshot.status === "completed" ? 0.32 : 0.9,
      },
      progress: {
        current: snapshot.completedStageIds.length,
        total: snapshot.totalStageCount,
        label: snapshot.status === "completed" ? "Complete" : "Stages",
      },
      holdAtEnd: true,
    }],
  };
};
