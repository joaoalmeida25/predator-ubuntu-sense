import type { CSSProperties } from "react";
import type {
  NeuralCoreMetricTrend,
  NeuralCoreImpactLevel,
} from "../../domain/semantic/neural-core-semantic-context.types";
import type { NeuralCoreTopologyStatus } from "../../domain/topology/neural-core-topology.types";

export interface NeuralCoreContextPanelMetricModel {
  id: string;
  label: string;
  value: string;
  trend?: NeuralCoreMetricTrend;
  status?: NeuralCoreTopologyStatus;
  statusLabel?: string;
}

export interface NeuralCoreContextPanelModel {
  activeRouteLabel?: string;
  aggregatedConnectionCount?: number;
  activityLabel?: string;
  description?: string;
  impact?: {
    affectedLabels: readonly string[];
    level: NeuralCoreImpactLevel;
    summary?: string;
  };
  metrics: readonly NeuralCoreContextPanelMetricModel[];
  retry?: {
    attempt: number;
    maximumAttempts: number;
    reason?: string;
    status: "scheduled" | "running" | "succeeded" | "failed";
  };
  name: string;
  incomingRoutes: readonly string[];
  outgoingRoutes: readonly string[];
  pathways: readonly string[];
  relatedClusters: readonly string[];
  status: NeuralCoreTopologyStatus;
  statusLabel: string;
  synapses: readonly string[];
  typeLabel: string;
}

export interface NeuralCoreContextPanelViewProps {
  isClosing: boolean;
  model: NeuralCoreContextPanelModel;
  onClose: () => void;
  widthPx: number;
  compactWidthPx: number;
}

export type NeuralCoreContextPanelStyle = CSSProperties & {
  "--neural-core-context-panel-width": string;
  "--neural-core-context-panel-compact-width": string;
};
