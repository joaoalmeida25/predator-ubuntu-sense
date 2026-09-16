import type {
  NeuralCoreClusterId,
  NeuralCoreEntityId,
  NeuralCoreExecutionId,
  NeuralCoreId,
  NeuralCoreMetricId,
  NeuralCoreModelId,
  NeuralCorePathwayId,
  NeuralCoreRouteId,
  NeuralCoreRuntimeEventId,
} from "../core/neural-core-id.types";
import type {
  NeuralCoreDiagnostic,
  NeuralCoreDiagnosticCode,
  NeuralCoreValidationResult,
} from "./neural-core-validation.types";

interface NeuralCoreIdDefinition<TKind extends string> {
  readonly kind: TKind;
  readonly emptyCode: NeuralCoreDiagnosticCode;
  readonly label: string;
}

const brandNeuralCoreId = <TKind extends string>(value: string): NeuralCoreId<TKind> => {
  return value as NeuralCoreId<TKind>;
};

const createNeuralCoreId = <TKind extends string>(
  value: string,
  definition: NeuralCoreIdDefinition<TKind>,
): NeuralCoreValidationResult<NeuralCoreId<TKind>> => {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    const diagnostic: NeuralCoreDiagnostic = {
      code: definition.emptyCode,
      severity: "error",
      message: `${definition.label} must not be empty.`,
    };

    return { ok: false, diagnostics: Object.freeze([diagnostic]) };
  }

  return {
    ok: true,
    value: brandNeuralCoreId<TKind>(normalizedValue),
    diagnostics: Object.freeze([]),
  };
};

export const createNeuralCoreModelId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreModelId> => {
  return createNeuralCoreId(value, {
    kind: "model",
    emptyCode: "empty-model-id",
    label: "Model id",
  });
};

export const createNeuralCoreClusterId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreClusterId> => {
  return createNeuralCoreId(value, {
    kind: "cluster",
    emptyCode: "empty-cluster-id",
    label: "Cluster id",
  });
};

export const createNeuralCoreEntityId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreEntityId> => {
  return createNeuralCoreId(value, {
    kind: "entity",
    emptyCode: "empty-entity-id",
    label: "Entity id",
  });
};

export const createNeuralCoreRouteId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreRouteId> => {
  return createNeuralCoreId(value, {
    kind: "route",
    emptyCode: "empty-route-id",
    label: "Route id",
  });
};

export const createNeuralCorePathwayId = (
  value: string,
): NeuralCoreValidationResult<NeuralCorePathwayId> => {
  return createNeuralCoreId(value, {
    kind: "pathway",
    emptyCode: "empty-pathway-id",
    label: "Pathway id",
  });
};

export const createNeuralCoreExecutionId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreExecutionId> => {
  return createNeuralCoreId(value, {
    kind: "execution",
    emptyCode: "empty-execution-id",
    label: "Execution id",
  });
};

export const createNeuralCoreRuntimeEventId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreRuntimeEventId> => {
  return createNeuralCoreId(value, {
    kind: "runtime-event",
    emptyCode: "empty-runtime-event-id",
    label: "Runtime event id",
  });
};

export const createNeuralCoreMetricId = (
  value: string,
): NeuralCoreValidationResult<NeuralCoreMetricId> => {
  return createNeuralCoreId(value, {
    kind: "metric",
    emptyCode: "empty-metric-id",
    label: "Metric id",
  });
};

export const toNeuralCoreIdAfterValidation = <TKind extends string>(
  value: string,
): NeuralCoreId<TKind> => {
  return brandNeuralCoreId<TKind>(value.trim());
};
