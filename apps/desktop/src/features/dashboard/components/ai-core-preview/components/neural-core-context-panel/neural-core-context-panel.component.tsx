import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import type { NeuralCoreInspectionConfig } from "../../domain/inspection/neural-core-inspection.types";
import { getNeuralCoreClusterDisplayName } from "../../domain/semantic/neural-core-semantic-context.utils";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreInspectionFocusState } from "../../visualization/inspection/neural-core-inspection-focus.types";
import type { NeuralCoreMetric } from "../../domain/semantic/neural-core-semantic-context.types";
import type {
  NeuralCoreOperationalClusterVisualState,
} from "../../domain/operational-runtime/mappers/neural-core-operational-visual-state.mapper";
import type {
  NeuralCoreOperationalImpactRuntimeState,
  NeuralCoreOperationalRetryRuntimeState,
} from "../../domain/operational-runtime/runtime/neural-core-operational-runtime.types";
import {
  formatNeuralCoreActivity,
  formatNeuralCoreClusterKind,
  formatNeuralCoreMetricValue,
  formatNeuralCoreTopologyStatus,
} from "../../visualization/labels/neural-core-cluster-label.utils";
import { NeuralCoreContextPanelView } from "./neural-core-context-panel-view.component";
import type { NeuralCoreContextPanelModel } from "./neural-core-context-panel-view.types";

export interface NeuralCoreContextPanelProps {
  clusterGrammarEnabled?: boolean;
  config: NeuralCoreInspectionConfig["panel"];
  focus: NeuralCoreInspectionFocusState;
  clusterVisualState?: NeuralCoreOperationalClusterVisualState;
  metricOverrides?: readonly NeuralCoreMetric[];
  operationalRouteId?: string;
  operationalImpact?: NeuralCoreOperationalImpactRuntimeState;
  operationalRetry?: NeuralCoreOperationalRetryRuntimeState;
  onClose: () => void;
  topology: NeuralCoreTopology;
}

const NeuralCoreContextPanelComponent = ({
  config,
  clusterGrammarEnabled = false,
  focus,
  clusterVisualState,
  metricOverrides,
  operationalRouteId,
  operationalImpact,
  operationalRetry,
  onClose,
  topology,
}: NeuralCoreContextPanelProps): ReactElement | null => {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    setIsClosing(false);
    window.clearTimeout(closeTimeoutRef.current);
    return (): void => window.clearTimeout(closeTimeoutRef.current);
  }, [focus.selectedClusterId]);
  const handleClose = useCallback((): void => {
    if (isClosing) {
      return;
    }
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(onClose, 145);
  }, [isClosing, onClose]);
  const cluster = topology.clusters.find(({ id }) => id === focus.selectedClusterId);
  if (!cluster) {
    return null;
  }
  const clusterNameById = new Map(topology.clusters.map((candidate) => [
    candidate.id,
    getNeuralCoreClusterDisplayName(candidate),
  ]));
  const pathwayById = new Map((topology.pathways ?? []).map((pathway) => [pathway.id, pathway]));
  const semanticContext = cluster.semanticContext;
  const resolvedActivity = clusterVisualState?.activity ?? cluster.activity;
  const pathwayLabel = (pathwayId: string): string | undefined => {
    const pathway = pathwayById.get(pathwayId);
    if (!pathway) {
      return undefined;
    }
    return pathway.label?.trim()
      || pathway.clusterIds
        .map((clusterId) => clusterNameById.get(clusterId))
        .filter((value): value is string => value !== undefined)
        .join(" → ");
  };
  const activeOperationalImpact = operationalImpact
    && (
      operationalImpact.sourceClusterId === cluster.id
      || operationalImpact.affectedClusterIds.includes(cluster.id)
    )
    ? operationalImpact
    : undefined;
  const affectedLabels = [
    ...(activeOperationalImpact?.affectedClusterIds
      ?? semanticContext?.impact?.affectedClusterIds
      ?? [])
      .filter((clusterId) => clusterId !== cluster.id)
      .map((clusterId) => clusterNameById.get(clusterId)),
    ...(semanticContext?.impact?.affectedPathwayIds ?? []).map(pathwayLabel),
  ].filter((value): value is string => Boolean(value));
  const aggregatedRouteById = new Map<string, {
    sourceClusterId: string;
    targetClusterId: string;
  }>();
  for (const synapse of topology.synapses) {
    if (!clusterGrammarEnabled) {
      break;
    }
    if (
      synapse.fromClusterId !== cluster.id
      && synapse.toClusterId !== cluster.id
    ) {
      continue;
    }
    const direction = synapse.direction
      ?? (synapse.kind === "bidirectional" ? "bidirectional" : "forward");
    const routeId = [
      synapse.fromClusterId,
      synapse.toClusterId,
      direction,
      synapse.kind,
    ].join(":");
    aggregatedRouteById.set(routeId, {
      sourceClusterId: synapse.fromClusterId,
      targetClusterId: synapse.toClusterId,
    });
  }
  const incomingRoutes: string[] = [];
  const outgoingRoutes: string[] = [];
  for (const route of aggregatedRouteById.values()) {
    const source = clusterNameById.get(route.sourceClusterId);
    const target = clusterNameById.get(route.targetClusterId);
    if (!source || !target) {
      continue;
    }
    const label = `${source} → ${target}`;
    if (route.targetClusterId === cluster.id) {
      incomingRoutes.push(label);
    }
    if (route.sourceClusterId === cluster.id) {
      outgoingRoutes.push(label);
    }
  }
  const operationalRoute = operationalRouteId
    ? topology.synapses.find(({ id }) => id === operationalRouteId)
    : undefined;
  const operationalRouteTouchesCluster = operationalRoute
    && (
      operationalRoute.fromClusterId === cluster.id
      || operationalRoute.toClusterId === cluster.id
    );
  const operationalRouteSourceName = operationalRouteTouchesCluster
    ? clusterNameById.get(operationalRoute.fromClusterId)
    : undefined;
  const operationalRouteTargetName = operationalRouteTouchesCluster
    ? clusterNameById.get(operationalRoute.toClusterId)
    : undefined;
  const model: NeuralCoreContextPanelModel = {
    ...(operationalRouteSourceName && operationalRouteTargetName
      ? { activeRouteLabel: `${operationalRouteSourceName} → ${operationalRouteTargetName}` }
      : {}),
    ...(clusterGrammarEnabled
      ? { aggregatedConnectionCount: aggregatedRouteById.size }
      : {}),
    name: getNeuralCoreClusterDisplayName(cluster),
    incomingRoutes,
    outgoingRoutes,
    typeLabel: formatNeuralCoreClusterKind(cluster.kind),
    status: clusterVisualState?.status ?? cluster.status ?? topology.status ?? "idle",
    statusLabel: clusterVisualState?.operationalStatus === "recovering"
      ? "Recovering"
      : formatNeuralCoreTopologyStatus(
        clusterVisualState?.status ?? cluster.status ?? topology.status ?? "idle",
      ),
    ...(typeof resolvedActivity === "number" && Number.isFinite(resolvedActivity)
      ? { activityLabel: formatNeuralCoreActivity(resolvedActivity) }
      : {}),
    metrics: (metricOverrides ?? semanticContext?.metrics ?? [])
      .slice(0, config.maximumMetrics)
      .map((metric) => ({
        id: metric.id,
        label: metric.label,
        value: formatNeuralCoreMetricValue(metric),
        ...(metric.trend ? { trend: metric.trend } : {}),
        ...(metric.status ? { status: metric.status } : {}),
        ...(metric.status ? { statusLabel: formatNeuralCoreTopologyStatus(metric.status) } : {}),
      })),
    ...(config.showDescription && semanticContext?.description
      ? { description: semanticContext.description }
      : {}),
    ...(config.showImpact && (activeOperationalImpact ?? semanticContext?.impact)
      ? {
        impact: {
          level: activeOperationalImpact?.level ?? semanticContext?.impact?.level ?? "none",
          ...((activeOperationalImpact?.summary ?? semanticContext?.impact?.summary)
            ? { summary: activeOperationalImpact?.summary ?? semanticContext?.impact?.summary }
            : {}),
          affectedLabels,
        },
      }
      : {}),
    ...(operationalRetry?.clusterId === cluster.id
      ? {
        retry: {
          attempt: operationalRetry.attempt,
          maximumAttempts: operationalRetry.maximumAttempts,
          status: operationalRetry.status,
          ...(operationalRetry.reason ? { reason: operationalRetry.reason } : {}),
        },
      }
      : {}),
    relatedClusters: config.showRelationships
      ? focus.relatedClusterIds
        .map((clusterId) => clusterNameById.get(clusterId))
        .filter((value): value is string => value !== undefined)
      : [],
    synapses: config.showRelationships
      ? focus.relatedSynapseIds.flatMap((synapseId) => {
        const synapse = topology.synapses.find(({ id }) => id === synapseId);
        if (!synapse) {
          return [];
        }
        const from = clusterNameById.get(synapse.fromClusterId);
        const to = clusterNameById.get(synapse.toClusterId);
        return from && to ? [`${from} → ${to}`] : [];
      })
      : [],
    pathways: config.showRelationships
      ? focus.relatedPathwayIds
        .map(pathwayLabel)
        .filter((value): value is string => Boolean(value))
      : [],
  };
  return (
    <NeuralCoreContextPanelView
      model={model}
      onClose={handleClose}
      isClosing={isClosing}
      widthPx={config.widthPx}
      compactWidthPx={config.compactWidthPx}
    />
  );
};

export const NeuralCoreContextPanel = memo(NeuralCoreContextPanelComponent);
