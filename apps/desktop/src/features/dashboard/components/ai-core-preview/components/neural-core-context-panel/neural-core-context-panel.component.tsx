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
import {
  formatNeuralCoreActivity,
  formatNeuralCoreClusterKind,
  formatNeuralCoreMetricValue,
  formatNeuralCoreTopologyStatus,
} from "../../visualization/labels/neural-core-cluster-label.utils";
import { NeuralCoreContextPanelView } from "./neural-core-context-panel-view.component";
import type { NeuralCoreContextPanelModel } from "./neural-core-context-panel-view.types";

export interface NeuralCoreContextPanelProps {
  config: NeuralCoreInspectionConfig["panel"];
  focus: NeuralCoreInspectionFocusState;
  onClose: () => void;
  topology: NeuralCoreTopology;
}

const NeuralCoreContextPanelComponent = ({
  config,
  focus,
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
  const affectedLabels = [
    ...(semanticContext?.impact?.affectedClusterIds ?? [])
      .map((clusterId) => clusterNameById.get(clusterId)),
    ...(semanticContext?.impact?.affectedPathwayIds ?? []).map(pathwayLabel),
  ].filter((value): value is string => Boolean(value));
  const model: NeuralCoreContextPanelModel = {
    name: getNeuralCoreClusterDisplayName(cluster),
    typeLabel: formatNeuralCoreClusterKind(cluster.kind),
    status: cluster.status ?? topology.status ?? "idle",
    statusLabel: formatNeuralCoreTopologyStatus(cluster.status ?? topology.status ?? "idle"),
    ...(typeof cluster.activity === "number" && Number.isFinite(cluster.activity)
      ? { activityLabel: formatNeuralCoreActivity(cluster.activity) }
      : {}),
    metrics: (semanticContext?.metrics ?? [])
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
    ...(config.showImpact && semanticContext?.impact
      ? {
        impact: {
          level: semanticContext.impact.level,
          ...(semanticContext.impact.summary ? { summary: semanticContext.impact.summary } : {}),
          affectedLabels,
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
