import type { NeuralCoreTopology } from "../topology/neural-core-topology.types";

export type NeuralCoreMode =
  | "idle"
  | "observing"
  | "thinking"
  | "processing"
  | "learning"
  | "synchronizing"
  | "success"
  | "warning"
  | "error";

export type NeuralCoreEntityKind =
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

export type NeuralCoreSignalKind =
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

export type NeuralCoreStatus =
  | "neutral"
  | "active"
  | "success"
  | "warning"
  | "error"
  | "disabled";

export type NeuralCoreAccentColor =
  | "cyan"
  | "blue"
  | "violet"
  | "magenta"
  | "green"
  | "orange"
  | "red";

export type NeuralCoreMetadataPrimitive = string | number | boolean | null;

export type NeuralCoreMetadataValue =
  | NeuralCoreMetadataPrimitive
  | NeuralCoreMetadataValue[]
  | { [key: string]: NeuralCoreMetadataValue };

export type NeuralCoreMetadata = Record<string, NeuralCoreMetadataValue>;

export interface NeuralCoreEntity {
  id: string;
  label?: string;
  kind: NeuralCoreEntityKind;
  status?: NeuralCoreStatus;
  /** Normalized visual activity, expected between 0 and 1. */
  activity?: number;
  /** Normalized visual priority, expected between 0 and 1. */
  importance?: number;
  /** Normalized availability or quality signal, expected between 0 and 1. */
  health?: number;
  groupId?: string;
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreSignal {
  id: string;
  /** References the id of the source NeuralCoreEntity. */
  from: string;
  /** References the id of the target NeuralCoreEntity. */
  to: string;
  kind: NeuralCoreSignalKind;
  status?: NeuralCoreStatus;
  /** Normalized visual strength, expected between 0 and 1 when applicable. */
  intensity?: number;
  /** Normalized completion value, expected between 0 and 1 when applicable. */
  progress?: number;
  /** Normalized flow speed, expected between 0 and 1 when applicable. */
  speed?: number;
  startedAt?: number;
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreGroup {
  id: string;
  label?: string;
  kind?: string;
  status?: NeuralCoreStatus;
  /** Normalized group activity, expected between 0 and 1. */
  activity?: number;
  metadata?: NeuralCoreMetadata;
}

export interface NeuralCoreState {
  mode: NeuralCoreMode;
  entities: NeuralCoreEntity[];
  signals: NeuralCoreSignal[];
  groups?: NeuralCoreGroup[];
  topology?: NeuralCoreTopology;
  /** Normalized whole-network activity, expected between 0 and 1. */
  globalActivity?: number;
  /** Normalized network detail level, expected between 0 and 1. */
  complexity?: number;
  focusEntityId?: string;
  accentColor?: NeuralCoreAccentColor;
  metadata?: NeuralCoreMetadata;
}
