import type { NeuralCoreDiagnostic } from "../validation/neural-core-validation.types";

export type NeuralCoreRuntimeErrorCode =
  | "invalid-runtime"
  | "execution-failed"
  | "runtime-interrupted";

export interface NeuralCoreInputError {
  readonly kind: "input";
  readonly message: string;
  readonly diagnostics: readonly NeuralCoreDiagnostic[];
}

export interface NeuralCoreRuntimeError {
  readonly kind: "runtime";
  readonly code: NeuralCoreRuntimeErrorCode;
  readonly message: string;
  readonly diagnostics?: readonly NeuralCoreDiagnostic[];
}

export type NeuralCorePublicError =
  | NeuralCoreInputError
  | NeuralCoreRuntimeError;

export type NeuralCoreErrorHandler = (error: NeuralCorePublicError) => void;
