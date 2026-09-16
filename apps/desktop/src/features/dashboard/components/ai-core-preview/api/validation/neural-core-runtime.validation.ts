import type {
  NeuralCoreExecution,
  NeuralCoreExecutionInput,
  NeuralCoreExecutionOutcome,
  NeuralCoreMetric,
  NeuralCoreMetricInput,
  NeuralCoreRuntime,
  NeuralCoreRuntimeEventInput,
  NeuralCoreRuntimeEvent,
  NeuralCoreRuntimeImpact,
  NeuralCoreRuntimeInput,
  NeuralCoreRuntimeRetry,
} from "../core/neural-core-runtime.types";
import type {
  NeuralCoreMetadata,
  NeuralCoreModel,
} from "../core/neural-core-model.types";
import {
  toNeuralCoreIdAfterValidation,
} from "./neural-core-identifiers";
import { validateNeuralCoreMetadata } from "./neural-core-metadata.validation";
import type {
  NeuralCoreDiagnostic,
  NeuralCoreDiagnosticCode,
  NeuralCoreValidationResult,
} from "./neural-core-validation.types";

const EMPTY_METADATA: NeuralCoreMetadata = Object.freeze({});

const preserveMetadata = (metadata?: NeuralCoreMetadata): NeuralCoreMetadata => {
  return metadata ?? EMPTY_METADATA;
};

const normalizeId = (value: string): string => value.trim();

const validateFiniteNonNegativeNumber = (
  diagnostics: NeuralCoreDiagnostic[],
  value: number,
  path: readonly (string | number)[],
  code: "invalid-number" | "invalid-runtime-timing" = "invalid-number",
): void => {
  if (!Number.isFinite(value) || value < 0) {
    diagnostics.push({
      code,
      severity: "error",
      message: "Expected a finite, non-negative number.",
      path,
    });
  }
};

const validateFiniteNumber = (
  diagnostics: NeuralCoreDiagnostic[],
  value: number,
  path: readonly (string | number)[],
): void => {
  if (!Number.isFinite(value)) {
    diagnostics.push({
      code: "invalid-number",
      severity: "error",
      message: "Expected a finite number.",
      path,
    });
  }
};

const validateRequiredId = (
  diagnostics: NeuralCoreDiagnostic[],
  value: string,
  code: NeuralCoreDiagnosticCode,
  label: string,
  path: readonly (string | number)[],
): void => {
  if (normalizeId(value).length === 0) {
    diagnostics.push({
      code,
      severity: "error",
      message: `${label} must not be empty.`,
      path,
    });
  }
};

const validateRequiredText = (
  diagnostics: NeuralCoreDiagnostic[],
  value: string,
  label: string,
  path: readonly (string | number)[],
): void => {
  if (value.trim().length === 0) {
    diagnostics.push({
      code: "empty-required-field",
      severity: "error",
      message: `${label} must not be empty.`,
      path,
    });
  }
};

const validateUniqueIds = (
  diagnostics: NeuralCoreDiagnostic[],
  ids: readonly string[],
  code: NeuralCoreDiagnosticCode,
  label: string,
  path: readonly (string | number)[],
): void => {
  const seenIds = new Set<string>();
  ids.forEach((value, index) => {
    const id = normalizeId(value);
    if (id.length === 0) {
      return;
    }
    if (seenIds.has(id)) {
      diagnostics.push({
        code,
        severity: "error",
        message: `${label} id "${id}" is duplicated.`,
        path: [...path, index, "id"],
        relatedIds: Object.freeze([id]),
      });
      return;
    }
    seenIds.add(id);
  });
};

const validateMetrics = (
  metrics: readonly NeuralCoreMetricInput[],
  diagnostics: NeuralCoreDiagnostic[],
  path: readonly (string | number)[],
): void => {
  metrics.forEach((metric, index) => {
    validateRequiredId(
      diagnostics,
      metric.id,
      "empty-metric-id",
      "Metric id",
      [...path, index, "id"],
    );
    validateRequiredText(
      diagnostics,
      metric.name,
      "Metric name",
      [...path, index, "name"],
    );
    if (typeof metric.value === "number") {
      validateFiniteNumber(diagnostics, metric.value, [...path, index, "value"]);
    }
  });
  validateUniqueIds(
    diagnostics,
    metrics.map((metric) => metric.id),
    "duplicate-metric-id",
    "Metric",
    path,
  );
};

const addUnknownRuntimeReference = (
  diagnostics: NeuralCoreDiagnostic[],
  id: string,
  referenceKind: "entity" | "cluster" | "route" | "pathway",
  path: readonly (string | number)[],
): void => {
  diagnostics.push({
    code: "invalid-runtime-reference",
    severity: "error",
    message: `Runtime references unknown ${referenceKind} "${id}".`,
    path,
    relatedIds: Object.freeze([id]),
  });
};

const validateRuntimeEventReferences = (
  event: NeuralCoreRuntimeEventInput,
  eventIndex: number,
  model: NeuralCoreModel,
  diagnostics: NeuralCoreDiagnostic[],
): void => {
  const clusterIds = new Set<string>(model.clusters.map((cluster) => cluster.id));
  const entityIds = new Set<string>(model.entities.map((entity) => entity.id));
  const routeIds = new Set<string>(model.routes.map((route) => route.id));
  const pathwayIds = new Set<string>(model.pathways.map((pathway) => pathway.id));

  if (event.entityId !== undefined && !entityIds.has(normalizeId(event.entityId))) {
    addUnknownRuntimeReference(
      diagnostics,
      normalizeId(event.entityId),
      "entity",
      ["execution", "events", eventIndex, "entityId"],
    );
  }
  if (event.clusterId !== undefined && !clusterIds.has(normalizeId(event.clusterId))) {
    addUnknownRuntimeReference(
      diagnostics,
      normalizeId(event.clusterId),
      "cluster",
      ["execution", "events", eventIndex, "clusterId"],
    );
  }
  if (event.routeId !== undefined && !routeIds.has(normalizeId(event.routeId))) {
    addUnknownRuntimeReference(
      diagnostics,
      normalizeId(event.routeId),
      "route",
      ["execution", "events", eventIndex, "routeId"],
    );
  }
  if (event.pathwayId !== undefined && !pathwayIds.has(normalizeId(event.pathwayId))) {
    addUnknownRuntimeReference(
      diagnostics,
      normalizeId(event.pathwayId),
      "pathway",
      ["execution", "events", eventIndex, "pathwayId"],
    );
  }

  event.impact?.affectedClusterIds?.forEach((clusterId, index) => {
    const normalizedId = normalizeId(clusterId);
    if (!clusterIds.has(normalizedId)) {
      addUnknownRuntimeReference(
        diagnostics,
        normalizedId,
        "cluster",
        ["execution", "events", eventIndex, "impact", "affectedClusterIds", index],
      );
    }
  });
  event.impact?.affectedEntityIds?.forEach((entityId, index) => {
    const normalizedId = normalizeId(entityId);
    if (!entityIds.has(normalizedId)) {
      addUnknownRuntimeReference(
        diagnostics,
        normalizedId,
        "entity",
        ["execution", "events", eventIndex, "impact", "affectedEntityIds", index],
      );
    }
  });
  event.impact?.affectedRouteIds?.forEach((routeId, index) => {
    const normalizedId = normalizeId(routeId);
    if (!routeIds.has(normalizedId)) {
      addUnknownRuntimeReference(
        diagnostics,
        normalizedId,
        "route",
        ["execution", "events", eventIndex, "impact", "affectedRouteIds", index],
      );
    }
  });
  event.impact?.affectedPathwayIds?.forEach((pathwayId, index) => {
    const normalizedId = normalizeId(pathwayId);
    if (!pathwayIds.has(normalizedId)) {
      addUnknownRuntimeReference(
        diagnostics,
        normalizedId,
        "pathway",
        ["execution", "events", eventIndex, "impact", "affectedPathwayIds", index],
      );
    }
  });
};

export const validateNeuralCoreRuntime = (
  input: NeuralCoreRuntimeInput,
  model: NeuralCoreModel,
): readonly NeuralCoreDiagnostic[] => {
  const diagnostics: NeuralCoreDiagnostic[] = [];
  const { execution } = input;

  validateRequiredId(
    diagnostics,
    execution.id,
    "empty-execution-id",
    "Execution id",
    ["execution", "id"],
  );
  validateRequiredText(
    diagnostics,
    execution.name,
    "Execution name",
    ["execution", "name"],
  );
  validateRequiredText(
    diagnostics,
    execution.outcome.summary,
    "Execution outcome summary",
    ["execution", "outcome", "summary"],
  );
  validateFiniteNonNegativeNumber(
    diagnostics,
    execution.outcome.totalDurationMs,
    ["execution", "outcome", "totalDurationMs"],
    "invalid-runtime-timing",
  );

  execution.events.forEach((event, index) => {
    validateRequiredId(
      diagnostics,
      event.id,
      "empty-runtime-event-id",
      "Runtime event id",
      ["execution", "events", index, "id"],
    );
    validateRequiredText(
      diagnostics,
      event.title,
      "Runtime event title",
      ["execution", "events", index, "title"],
    );
    validateFiniteNonNegativeNumber(
      diagnostics,
      event.atMs,
      ["execution", "events", index, "atMs"],
      "invalid-runtime-timing",
    );
    if (event.durationMs !== undefined) {
      validateFiniteNonNegativeNumber(
        diagnostics,
        event.durationMs,
        ["execution", "events", index, "durationMs"],
        "invalid-runtime-timing",
      );
    }
    if (
      Number.isFinite(event.atMs)
      && Number.isFinite(event.durationMs ?? 0)
      && Number.isFinite(execution.outcome.totalDurationMs)
      && event.atMs + (event.durationMs ?? 0) > execution.outcome.totalDurationMs
    ) {
      diagnostics.push({
        code: "invalid-runtime-timing",
        severity: "error",
        message: "Runtime event extends beyond the execution duration.",
        path: ["execution", "events", index],
        relatedIds: Object.freeze([normalizeId(event.id)]),
      });
    }
    if (event.retry !== undefined) {
      const retryPath = ["execution", "events", index, "retry"] as const;
      if (!Number.isInteger(event.retry.attempt) || event.retry.attempt < 1) {
        diagnostics.push({
          code: "invalid-retry-attempt",
          severity: "error",
          message: "Retry attempt must be an integer greater than or equal to 1.",
          path: [...retryPath, "attempt"],
        });
      }
      if (!Number.isInteger(event.retry.maximumAttempts) || event.retry.maximumAttempts < 1) {
        diagnostics.push({
          code: "invalid-retry-maximum-attempts",
          severity: "error",
          message: "Retry maximumAttempts must be an integer greater than or equal to 1.",
          path: [...retryPath, "maximumAttempts"],
        });
      }
      if (
        Number.isInteger(event.retry.attempt)
        && Number.isInteger(event.retry.maximumAttempts)
        && event.retry.attempt > event.retry.maximumAttempts
      ) {
        diagnostics.push({
          code: "retry-attempt-exceeds-maximum",
          severity: "error",
          message: "Retry attempt must not exceed maximumAttempts.",
          path: retryPath,
        });
      }
      validateFiniteNonNegativeNumber(
        diagnostics,
        event.retry.delayMs,
        ["execution", "events", index, "retry", "delayMs"],
        "invalid-runtime-timing",
      );
    }
    validateMetrics(
      event.metrics ?? [],
      diagnostics,
      ["execution", "events", index, "metrics"],
    );
    validateRuntimeEventReferences(event, index, model, diagnostics);
    diagnostics.push(...validateNeuralCoreMetadata(
      event.metadata,
      ["execution", "events", index, "metadata"],
    ));
  });

  validateUniqueIds(
    diagnostics,
    execution.events.map((event) => event.id),
    "duplicate-runtime-event-id",
    "Runtime event",
    ["execution", "events"],
  );
  validateMetrics(
    execution.outcome.metrics ?? [],
    diagnostics,
    ["execution", "outcome", "metrics"],
  );
  diagnostics.push(...validateNeuralCoreMetadata(
    execution.metadata,
    ["execution", "metadata"],
  ));
  diagnostics.push(...validateNeuralCoreMetadata(
    execution.outcome.metadata,
    ["execution", "outcome", "metadata"],
  ));

  return Object.freeze(diagnostics);
};

const normalizeMetric = (input: NeuralCoreMetricInput): NeuralCoreMetric => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"metric">(input.id),
    name: input.name,
    value: input.value,
    unit: input.unit,
    status: input.status ?? "idle",
    trend: input.trend ?? "unknown",
  });
};

const normalizeImpact = (
  input: NonNullable<NeuralCoreRuntimeEventInput["impact"]>,
): NeuralCoreRuntimeImpact => {
  return Object.freeze({
    level: input.level,
    summary: input.summary,
    affectedClusterIds: Object.freeze(
      (input.affectedClusterIds ?? []).map((clusterId) => (
        toNeuralCoreIdAfterValidation<"cluster">(clusterId)
      )),
    ),
    affectedEntityIds: Object.freeze(
      (input.affectedEntityIds ?? []).map((entityId) => (
        toNeuralCoreIdAfterValidation<"entity">(entityId)
      )),
    ),
    affectedRouteIds: Object.freeze(
      (input.affectedRouteIds ?? []).map((routeId) => (
        toNeuralCoreIdAfterValidation<"route">(routeId)
      )),
    ),
    affectedPathwayIds: Object.freeze(
      (input.affectedPathwayIds ?? []).map((pathwayId) => (
        toNeuralCoreIdAfterValidation<"pathway">(pathwayId)
      )),
    ),
  });
};

const normalizeRetry = (
  input: NonNullable<NeuralCoreRuntimeEventInput["retry"]>,
): NeuralCoreRuntimeRetry => {
  return Object.freeze({
    attempt: input.attempt,
    maximumAttempts: input.maximumAttempts,
    delayMs: input.delayMs,
    reason: input.reason,
  });
};

const normalizeRuntimeEvent = (
  input: NeuralCoreRuntimeEventInput,
): NeuralCoreRuntimeEvent => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"runtime-event">(input.id),
    kind: input.kind,
    status: input.status,
    atMs: input.atMs,
    durationMs: input.durationMs ?? 0,
    entityId: input.entityId === undefined
      ? undefined
      : toNeuralCoreIdAfterValidation<"entity">(input.entityId),
    clusterId: input.clusterId === undefined
      ? undefined
      : toNeuralCoreIdAfterValidation<"cluster">(input.clusterId),
    routeId: input.routeId === undefined
      ? undefined
      : toNeuralCoreIdAfterValidation<"route">(input.routeId),
    pathwayId: input.pathwayId === undefined
      ? undefined
      : toNeuralCoreIdAfterValidation<"pathway">(input.pathwayId),
    title: input.title,
    message: input.message,
    metrics: Object.freeze((input.metrics ?? []).map(normalizeMetric)),
    impact: input.impact === undefined ? undefined : normalizeImpact(input.impact),
    retry: input.retry === undefined ? undefined : normalizeRetry(input.retry),
    metadata: preserveMetadata(input.metadata),
  });
};

const normalizeOutcome = (
  input: NeuralCoreExecutionInput["outcome"],
): NeuralCoreExecutionOutcome => {
  return Object.freeze({
    status: input.status,
    summary: input.summary,
    totalDurationMs: input.totalDurationMs,
    metrics: Object.freeze((input.metrics ?? []).map(normalizeMetric)),
    metadata: preserveMetadata(input.metadata),
  });
};

const normalizeExecution = (input: NeuralCoreExecutionInput): NeuralCoreExecution => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"execution">(input.id),
    name: input.name,
    description: input.description,
    events: Object.freeze(input.events.map(normalizeRuntimeEvent)),
    outcome: normalizeOutcome(input.outcome),
    metadata: preserveMetadata(input.metadata),
  });
};

export const createNeuralCoreRuntime = (
  input: NeuralCoreRuntimeInput,
  model: NeuralCoreModel,
): NeuralCoreValidationResult<NeuralCoreRuntime> => {
  const diagnostics = validateNeuralCoreRuntime(input, model);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    value: Object.freeze({
      kind: "execution",
      execution: normalizeExecution(input.execution),
      autoStart: input.autoStart ?? false,
    }),
    diagnostics,
  };
};
