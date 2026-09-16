export type NeuralCoreDiagnosticCode =
  | "empty-model-id"
  | "empty-entity-id"
  | "empty-cluster-id"
  | "empty-route-id"
  | "empty-pathway-id"
  | "empty-execution-id"
  | "empty-runtime-event-id"
  | "empty-metric-id"
  | "empty-required-field"
  | "duplicate-cluster-id"
  | "duplicate-entity-id"
  | "duplicate-route-id"
  | "duplicate-pathway-id"
  | "duplicate-runtime-event-id"
  | "duplicate-metric-id"
  | "unknown-entity-cluster"
  | "unknown-route-source"
  | "unknown-route-target"
  | "unsupported-self-reference"
  | "unknown-pathway-cluster"
  | "unknown-pathway-route"
  | "invalid-number"
  | "invalid-runtime-reference"
  | "invalid-interaction-selection"
  | "invalid-runtime-timing"
  | "invalid-retry-attempt"
  | "invalid-retry-maximum-attempts"
  | "retry-attempt-exceeds-maximum"
  | "invalid-metadata-value"
  | "invalid-metadata-number"
  | "invalid-metadata-object"
  | "cyclic-metadata"
  | "model-has-no-entities";

export type NeuralCoreDiagnosticSeverity = "warning" | "error";

export interface NeuralCoreDiagnostic {
  readonly code: NeuralCoreDiagnosticCode;
  readonly severity: NeuralCoreDiagnosticSeverity;
  readonly message: string;
  readonly path?: readonly (string | number)[];
  readonly relatedIds?: readonly string[];
}

export type NeuralCoreValidationResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly diagnostics: readonly NeuralCoreDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly NeuralCoreDiagnostic[];
    };
