import type {
  NeuralCoreClusterDepth,
  NeuralCoreClusterHemisphere,
  NeuralCoreClusterRegion,
  NeuralCoreClusterKind,
  NeuralCoreClusterPositionHint,
} from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

export type NeuralCoreClusterSpatialAnchorSource =
  | "explicit"
  | "previous-map"
  | "position-hint"
  | "kind-profile"
  | "deterministic-fallback";

export interface NeuralCoreClusterSpatialAnchorInput {
  clusterId: string;
  normalizedPosition: NeuralCoreVector3;
  radius?: number;
  region?: NeuralCoreClusterRegion;
  hemisphere?: NeuralCoreClusterHemisphere;
  depth?: NeuralCoreClusterDepth;
  priority?: number;
}

export interface NeuralCoreClusterSpatialAnchor {
  clusterId: string;
  normalizedPosition: NeuralCoreVector3;
  radius: number;
  region?: NeuralCoreClusterRegion;
  hemisphere?: NeuralCoreClusterHemisphere;
  depth?: NeuralCoreClusterDepth;
  priority: number;
  source: NeuralCoreClusterSpatialAnchorSource;
}

export interface NeuralCoreSpatialMap {
  version: number;
  identityKey: string;
  anchors: readonly NeuralCoreClusterSpatialAnchor[];
  diagnostics: NeuralCoreSpatialMapDiagnostics;
}

export interface NeuralCoreSpatialMapInput {
  version?: number;
  anchors: readonly NeuralCoreClusterSpatialAnchorInput[];
}

export interface NormalizedNeuralCoreSpatialMapInput {
  version: number;
  anchors: readonly NeuralCoreClusterSpatialAnchor[];
}

export type NeuralCoreSpatialConflictReason =
  | "authoritative-overlap"
  | "minimum-separation-unresolved"
  | "bounds-exhausted";

export interface NeuralCoreSpatialConflict {
  clusterId: string;
  conflictingClusterId: string;
  reason: NeuralCoreSpatialConflictReason;
  actualDistance: number;
  requiredDistance: number;
}

export interface NeuralCoreSpatialMapDiagnostics {
  conflicts: readonly NeuralCoreSpatialConflict[];
  hasUnresolvedConflicts: boolean;
}

export interface NeuralCoreSpatialCollisionResolutionConfig {
  maximumAttempts: number;
  searchStep: number;
  depthStep: number;
}

export interface NeuralCoreSpatialLayoutConfig {
  deterministicSeed: number;
  minimumClusterSeparation: number;
  maximumClusterOverlapRatio: number;
  defaultClusterRadius: number;
  minimumClusterRadius: number;
  maximumClusterRadius: number;
  reusePreviousAnchors: boolean;
  collisionResolution: NeuralCoreSpatialCollisionResolutionConfig;
}

export type NeuralCoreSpatialLayoutConfigInput = Omit<
  Partial<NeuralCoreSpatialLayoutConfig>,
  "collisionResolution"
> & {
  collisionResolution?: Partial<NeuralCoreSpatialCollisionResolutionConfig>;
};

export interface NeuralCoreClusterKindSpatialProfile {
  center: NeuralCoreVector3;
  hint: NeuralCoreClusterPositionHint;
}

export type NeuralCoreClusterKindSpatialProfiles = Record<
  NeuralCoreClusterKind,
  NeuralCoreClusterKindSpatialProfile
>;
