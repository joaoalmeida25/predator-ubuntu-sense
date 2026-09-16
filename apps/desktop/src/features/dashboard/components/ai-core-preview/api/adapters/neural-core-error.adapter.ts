import type {
  NeuralCoreInputError,
  NeuralCoreRuntimeError,
} from "../core/neural-core-error.types";
import type { NeuralCoreDiagnostic } from "../validation/neural-core-validation.types";

export const adaptModelDiagnosticsToPublicError = (
  diagnostics: readonly NeuralCoreDiagnostic[],
): NeuralCoreInputError => Object.freeze({
  kind: "input",
  message: "The neural core model is invalid and cannot be rendered.",
  diagnostics,
});

export const adaptInteractionDiagnosticToPublicError = (
  diagnostic: NeuralCoreDiagnostic,
): NeuralCoreInputError => Object.freeze({
  kind: "input",
  message: "The neural core interaction state contains an invalid selection.",
  diagnostics: Object.freeze([diagnostic]),
});

export const adaptRuntimeDiagnosticsToPublicError = (
  diagnostics: readonly NeuralCoreDiagnostic[],
): NeuralCoreRuntimeError => Object.freeze({
  kind: "runtime",
  code: "invalid-runtime",
  message: "The neural core runtime is invalid and was not started.",
  diagnostics,
});
