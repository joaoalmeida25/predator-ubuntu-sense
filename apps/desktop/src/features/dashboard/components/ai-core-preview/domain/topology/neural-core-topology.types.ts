import type { NeuralCoreMetadata } from "../contract/neural-core-contract.types";
import type { NeuralCoreClusterSemanticContext } from "../semantic/neural-core-semantic-context.types";

export type NeuralCoreClusterKind =
  | "data"
  | "memory"
  | "function"
  | "process"
  | "service"
  | "decision"
  | "input"
  | "output"
  | "event"
  | "model"
  | "agent"
  | "storage"
  | "api"
  | "gateway"
  | "queue"
  | "cache"
  | "database"
  | "external-service"
  | "custom";

export type NeuralCoreSynapseKind =
  | "excitatory"
  | "inhibitory"
  | "modulatory"
  | "bidirectional"
  | "relay";

export type NeuralCoreTransmissionKind =
  | "read"
  | "write"
  | "execute"
  | "transfer"
  | "process"
  | "emit"
  | "receive"
  | "route"
  | "cache"
  | "resolve"
  | "success"
  | "warning"
  | "error";

export type NeuralCoreTopologyStatus =
  | "idle"
  | "active"
  | "processing"
  | "success"
  | "warning"
  | "error"
  | "disabled";

export type NeuralCoreClusterRegion =
  | "frontal"
  | "temporal"
  | "parietal"
  | "occipital"
  | "central"
  | "inner"
  | "outer"
  | "left"
  | "right"
  | "lower"
  | "upper"
  | "custom";

export type NeuralCoreClusterHemisphere = "left" | "right" | "center";

export type NeuralCoreClusterDepth = "surface" | "middle" | "deep";

export interface NeuralCoreClusterPositionHint {
  region?: NeuralCoreClusterRegion;
  hemisphere?: NeuralCoreClusterHemisphere;
  depth?: NeuralCoreClusterDepth;
  priority?: number;
}

export interface NeuralCoreCluster {
  id: string;
  label?: string;
  kind: NeuralCoreClusterKind;
  status?: NeuralCoreTopologyStatus;
  activity?: number;
  importance?: number;
  stability?: number;
  plasticity?: number;
  positionHint?: NeuralCoreClusterPositionHint;
  semanticContext?: NeuralCoreClusterSemanticContext;
  entityIds?: string[];
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreSynapse {
  id: string;
  fromClusterId: string;
  toClusterId: string;
  kind: NeuralCoreSynapseKind;
  status?: NeuralCoreTopologyStatus;
  weight?: number;
  conductivity?: number;
  plasticity?: number;
  direction?: "forward" | "backward" | "bidirectional";
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreTransmission {
  id: string;
  synapseId: string;
  kind: NeuralCoreTransmissionKind;
  status?: NeuralCoreTopologyStatus;
  intensity?: number;
  progress?: number;
  speed?: number;
  direction?: "forward" | "backward";
  startedAt?: number;
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCorePathway {
  id: string;
  label?: string;
  status?: NeuralCoreTopologyStatus;
  clusterIds: string[];
  synapseIds: string[];
  activity?: number;
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreTopology {
  clusters: NeuralCoreCluster[];
  synapses: NeuralCoreSynapse[];
  transmissions: NeuralCoreTransmission[];
  pathways?: NeuralCorePathway[];
  status?: NeuralCoreTopologyStatus;
  globalActivity?: number;
  metadata?: NeuralCoreMetadata;
}
