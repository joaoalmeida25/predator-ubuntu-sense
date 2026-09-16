import type {
  NeuralCoreClusterId,
  NeuralCoreEntityId,
  NeuralCoreModelId,
  NeuralCorePathwayId,
  NeuralCoreRouteId,
} from "./neural-core-id.types";

export type NeuralCoreMetadataPrimitive = string | number | boolean | null;

export type NeuralCoreMetadataValue =
  | NeuralCoreMetadataPrimitive
  | readonly NeuralCoreMetadataValue[]
  | { readonly [key: string]: NeuralCoreMetadataValue };

export type NeuralCoreMetadata = {
  readonly [key: string]: NeuralCoreMetadataValue;
};

export type NeuralCoreOperationalStatus =
  | "idle"
  | "active"
  | "processing"
  | "success"
  | "warning"
  | "error"
  | "recovering"
  | "disabled";

export type NeuralCoreBuiltInSemanticKind =
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
  | "external-service";

export type NeuralCoreSemanticKind =
  | NeuralCoreBuiltInSemanticKind
  | `custom:${string}`;

export type NeuralCoreBuiltInRelationKind =
  | "dependency"
  | "data-flow"
  | "request"
  | "response"
  | "event"
  | "control"
  | "association";

export type NeuralCoreRelationKind =
  | NeuralCoreBuiltInRelationKind
  | `custom:${string}`;

export type NeuralCoreRouteDirection = "directed" | "bidirectional";

export interface NeuralCoreEntityInput {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly clusterId?: string;
  readonly kind?: NeuralCoreSemanticKind;
  readonly status?: NeuralCoreOperationalStatus;
  readonly activity?: number;
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreEntity {
  readonly id: NeuralCoreEntityId;
  readonly label: string;
  readonly description?: string;
  readonly clusterId?: NeuralCoreClusterId;
  readonly kind: NeuralCoreSemanticKind;
  readonly status: NeuralCoreOperationalStatus;
  readonly activity: number;
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreClusterInput {
  readonly id: string;
  readonly label?: string;
  readonly description?: string;
  readonly kind: NeuralCoreSemanticKind;
  readonly status?: NeuralCoreOperationalStatus;
  readonly activity?: number;
  readonly importance?: number;
  readonly tags?: readonly string[];
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreCluster {
  readonly id: NeuralCoreClusterId;
  readonly label?: string;
  readonly description?: string;
  readonly kind: NeuralCoreSemanticKind;
  readonly status: NeuralCoreOperationalStatus;
  readonly activity: number;
  readonly importance: number;
  readonly tags: readonly string[];
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreRouteInput {
  readonly id: string;
  readonly source: NeuralCoreRouteEndpointInput;
  readonly target: NeuralCoreRouteEndpointInput;
  readonly relation?: NeuralCoreRelationKind;
  readonly direction?: NeuralCoreRouteDirection;
  readonly status?: NeuralCoreOperationalStatus;
  readonly strength?: number;
  readonly label?: string;
  readonly description?: string;
  readonly metadata?: NeuralCoreMetadata;
}

export type NeuralCoreRouteEndpointInput =
  | {
      readonly kind: "entity";
      readonly entityId: string;
    }
  | {
      readonly kind: "cluster";
      readonly clusterId: string;
    };

export type NeuralCoreRouteEndpoint =
  | {
      readonly kind: "entity";
      readonly entityId: NeuralCoreEntityId;
    }
  | {
      readonly kind: "cluster";
      readonly clusterId: NeuralCoreClusterId;
    };

export interface NeuralCoreRoute {
  readonly id: NeuralCoreRouteId;
  readonly source: NeuralCoreRouteEndpoint;
  readonly target: NeuralCoreRouteEndpoint;
  readonly relation: NeuralCoreRelationKind;
  readonly direction: NeuralCoreRouteDirection;
  readonly status: NeuralCoreOperationalStatus;
  readonly strength: number;
  readonly label?: string;
  readonly description?: string;
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCorePathwayInput {
  readonly id: string;
  readonly label?: string;
  readonly clusterIds?: readonly string[];
  readonly routeIds: readonly string[];
  readonly status?: NeuralCoreOperationalStatus;
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCorePathway {
  readonly id: NeuralCorePathwayId;
  readonly label?: string;
  readonly clusterIds: readonly NeuralCoreClusterId[];
  readonly routeIds: readonly NeuralCoreRouteId[];
  readonly status: NeuralCoreOperationalStatus;
  readonly metadata: NeuralCoreMetadata;
}

export interface NeuralCoreModelInput {
  readonly id: string;
  readonly name?: string;
  readonly entities: readonly NeuralCoreEntityInput[];
  readonly clusters?: readonly NeuralCoreClusterInput[];
  readonly routes: readonly NeuralCoreRouteInput[];
  readonly pathways?: readonly NeuralCorePathwayInput[];
  readonly metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreModel {
  readonly id: NeuralCoreModelId;
  readonly name?: string;
  readonly entities: readonly NeuralCoreEntity[];
  readonly clusters: readonly NeuralCoreCluster[];
  readonly routes: readonly NeuralCoreRoute[];
  readonly pathways: readonly NeuralCorePathway[];
  readonly metadata: NeuralCoreMetadata;
}
