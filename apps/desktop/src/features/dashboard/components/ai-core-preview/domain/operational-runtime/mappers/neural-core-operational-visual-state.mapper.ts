import type {
  NeuralCoreMetric,
} from "../../semantic/neural-core-semantic-context.types";
import type {
  NeuralCoreCluster,
  NeuralCoreTopology,
  NeuralCoreTopologyStatus,
} from "../../topology/neural-core-topology.types";
import type {
  NeuralCoreOperationalClusterRuntimeState,
  NeuralCoreOperationalImpactRuntimeState,
  NeuralCoreOperationalRetryRuntimeState,
  NeuralCoreOperationalRuntimeSnapshot,
} from "../runtime/neural-core-operational-runtime.types";
import { mergeNeuralCoreOperationalMetrics } from "./neural-core-operational-metrics.mapper";

export interface NeuralCoreOperationalClusterVisualState {
  clusterId: string;
  status: NeuralCoreTopologyStatus;
  activity: number;
  importance: number;
  progress: number;
  isActive: boolean;
  isCompleted: boolean;
  operationalStatus: NeuralCoreOperationalClusterRuntimeState["status"];
}

export interface NeuralCoreOperationalVisualOverlay {
  executionId: string;
  activeClusterId?: string;
  activeRouteId?: string;
  nextClusterId?: string;
  clusterStateById: Readonly<Record<string, NeuralCoreOperationalClusterVisualState>>;
  metricsByClusterId: Readonly<Record<string, readonly NeuralCoreMetric[]>>;
  routeStatusById: Readonly<Record<string, NeuralCoreTopologyStatus>>;
  impact?: NeuralCoreOperationalImpactRuntimeState;
  retry?: NeuralCoreOperationalRetryRuntimeState;
}

export interface MapOperationalRuntimeToNeuralCoreVisualOverlayParams {
  baseTopology: NeuralCoreTopology;
  snapshot: NeuralCoreOperationalRuntimeSnapshot;
}

const clusterVisualStateCache = new WeakMap<
NeuralCoreOperationalClusterRuntimeState,
WeakMap<NeuralCoreCluster, NeuralCoreOperationalClusterVisualState>
>();

const mapClusterStatus = (
  status: NeuralCoreOperationalClusterRuntimeState["status"],
): NeuralCoreTopologyStatus => status === "recovering" ? "warning" : status;

const mapClusterVisualState = (
  runtimeState: NeuralCoreOperationalClusterRuntimeState,
  cluster: NeuralCoreCluster,
): NeuralCoreOperationalClusterVisualState => {
  let byCluster = clusterVisualStateCache.get(runtimeState);
  if (!byCluster) {
    byCluster = new WeakMap();
    clusterVisualStateCache.set(runtimeState, byCluster);
  }
  const cached = byCluster.get(cluster);
  if (cached) {
    return cached;
  }
  const mapped: NeuralCoreOperationalClusterVisualState = {
    clusterId: runtimeState.clusterId,
    status: mapClusterStatus(runtimeState.status),
    activity: runtimeState.activity > 0
      ? runtimeState.activity
      : cluster.activity ?? 0,
    importance: runtimeState.isActive
      ? 1
      : runtimeState.activity === 0.28
        ? Math.max(0.9, cluster.importance ?? 0)
        : cluster.importance ?? 0,
    progress: runtimeState.progress,
    isActive: runtimeState.isActive,
    isCompleted: runtimeState.isCompleted,
    operationalStatus: runtimeState.status,
  };
  byCluster.set(cluster, mapped);
  return mapped;
};

export const mapOperationalRuntimeToNeuralCoreVisualOverlay = ({
  baseTopology,
  snapshot,
}: MapOperationalRuntimeToNeuralCoreVisualOverlayParams): NeuralCoreOperationalVisualOverlay
| undefined => {
  if (snapshot.status === "idle") {
    return undefined;
  }
  const clusterStateById: Record<string, NeuralCoreOperationalClusterVisualState> = {};
  const metricsByClusterId: Record<string, readonly NeuralCoreMetric[]> = {};
  const routeStatusById: Record<string, NeuralCoreTopologyStatus> = {};
  for (const cluster of baseTopology.clusters) {
    const runtimeState = snapshot.clusterStates[cluster.id];
    if (runtimeState) {
      clusterStateById[cluster.id] = mapClusterVisualState(runtimeState, cluster);
    }
    metricsByClusterId[cluster.id] = mergeNeuralCoreOperationalMetrics(
      cluster.semanticContext?.metrics,
      snapshot.metricsByClusterId[cluster.id],
    );
  }
  for (const routeId of snapshot.impact?.affectedRouteIds ?? []) {
    routeStatusById[routeId] = "warning";
  }
  if (snapshot.activeRouteId && snapshot.activeRouteStatus) {
    routeStatusById[snapshot.activeRouteId] = snapshot.activeRouteStatus;
  }
  return {
    executionId: snapshot.executionId,
    ...(snapshot.activeClusterId ? { activeClusterId: snapshot.activeClusterId } : {}),
    ...(snapshot.activeRouteId ? { activeRouteId: snapshot.activeRouteId } : {}),
    ...(snapshot.nextClusterId ? { nextClusterId: snapshot.nextClusterId } : {}),
    clusterStateById,
    metricsByClusterId,
    routeStatusById,
    ...(snapshot.impact ? { impact: snapshot.impact } : {}),
    ...(snapshot.retry ? { retry: snapshot.retry } : {}),
  };
};
