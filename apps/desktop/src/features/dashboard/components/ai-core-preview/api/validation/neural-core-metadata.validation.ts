import type { NeuralCoreDiagnostic } from "./neural-core-validation.types";

const isPlainObject = (value: object): value is Record<string, unknown> => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const validateMetadataValue = (
  value: unknown,
  path: readonly (string | number)[],
  activeObjects: WeakSet<object>,
  diagnostics: NeuralCoreDiagnostic[],
): void => {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      diagnostics.push({
        code: "invalid-metadata-number",
        severity: "error",
        message: "Metadata numbers must be finite.",
        path,
      });
    }
    return;
  }

  if (typeof value !== "object") {
    diagnostics.push({
      code: "invalid-metadata-value",
      severity: "error",
      message: "Metadata values must be serializable primitives, arrays, or plain objects.",
      path,
    });
    return;
  }

  if (activeObjects.has(value)) {
    diagnostics.push({
      code: "cyclic-metadata",
      severity: "error",
      message: "Metadata must not contain cyclic references.",
      path,
    });
    return;
  }

  if (!Array.isArray(value) && !isPlainObject(value)) {
    diagnostics.push({
      code: "invalid-metadata-object",
      severity: "error",
      message: "Metadata objects must use Object or null prototypes.",
      path,
    });
    return;
  }

  activeObjects.add(value);
  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      diagnostics.push({
        code: "invalid-metadata-value",
        severity: "error",
        message: "Metadata arrays must not contain symbol keys.",
        path,
      });
    }
    const customPropertyNames = Object.getOwnPropertyNames(value).filter((key) => {
      if (key === "length") {
        return false;
      }
      const index = Number(key);
      return !Number.isInteger(index)
        || index < 0
        || index >= value.length
        || String(index) !== key;
    });
    customPropertyNames.sort().forEach((key) => {
      diagnostics.push({
        code: "invalid-metadata-object",
        severity: "error",
        message: "Metadata arrays must not contain custom properties.",
        path: [...path, key],
      });
    });
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !("value" in descriptor)) {
        diagnostics.push({
          code: "invalid-metadata-value",
          severity: "error",
          message: "Metadata arrays must contain serializable values at every index.",
          path: [...path, index],
        });
        continue;
      }
      validateMetadataValue(descriptor.value, [...path, index], activeObjects, diagnostics);
    }
  } else {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      diagnostics.push({
        code: "invalid-metadata-value",
        severity: "error",
        message: "Metadata objects must not contain symbol keys.",
        path,
      });
    }
    Object.getOwnPropertyNames(value).sort().forEach((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) {
        diagnostics.push({
          code: "invalid-metadata-object",
          severity: "error",
          message: "Metadata objects must contain data properties only.",
          path: [...path, key],
        });
        return;
      }
      validateMetadataValue(descriptor.value, [...path, key], activeObjects, diagnostics);
    });
  }
  activeObjects.delete(value);
};

export const validateNeuralCoreMetadata = (
  value: unknown,
  path: readonly (string | number)[] = ["metadata"],
): readonly NeuralCoreDiagnostic[] => {
  const diagnostics: NeuralCoreDiagnostic[] = [];

  if (value === undefined) {
    return Object.freeze(diagnostics);
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    diagnostics.push({
      code: "invalid-metadata-object",
      severity: "error",
      message: "Metadata must be a plain object.",
      path,
    });
    return Object.freeze(diagnostics);
  }

  validateMetadataValue(value, path, new WeakSet<object>(), diagnostics);
  return Object.freeze(diagnostics);
};
