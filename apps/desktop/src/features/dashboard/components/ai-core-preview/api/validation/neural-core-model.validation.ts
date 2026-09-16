import type {
  NeuralCoreCluster,
  NeuralCoreEntity,
  NeuralCoreMetadata,
  NeuralCoreModel,
  NeuralCoreModelInput,
  NeuralCorePathway,
  NeuralCoreRoute,
  NeuralCoreRouteEndpoint,
  NeuralCoreRouteEndpointInput,
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
const normalizeId = (value: string): string => value.trim();

const preserveMetadata = (metadata?: NeuralCoreMetadata): NeuralCoreMetadata => {
  return metadata ?? EMPTY_METADATA;
};

const addEmptyTextDiagnostic = (
  diagnostics: NeuralCoreDiagnostic[],
  value: string,
  code: NeuralCoreDiagnosticCode,
  label: string,
  path: readonly (string | number)[],
): void => {
  if (normalizeId(value).length === 0) {
    diagnostics.push({ code, severity: "error", message: `${label} must not be empty.`, path });
  }
};

const addDuplicateIdDiagnostics = (
  diagnostics: NeuralCoreDiagnostic[],
  values: readonly string[],
  code: NeuralCoreDiagnosticCode,
  label: string,
  collectionPath: string,
): void => {
  const firstIndexById = new Map<string, number>();
  values.forEach((value, index) => {
    const id = normalizeId(value);
    if (id.length === 0) {
      return;
    }
    if (!firstIndexById.has(id)) {
      firstIndexById.set(id, index);
      return;
    }
    diagnostics.push({
      code,
      severity: "error",
      message: `${label} id "${id}" is duplicated.`,
      path: [collectionPath, index, "id"],
      relatedIds: Object.freeze([id]),
    });
  });
};

const addNormalizedNumberDiagnostic = (
  diagnostics: NeuralCoreDiagnostic[],
  value: number | undefined,
  path: readonly (string | number)[],
): void => {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) {
    diagnostics.push({
      code: "invalid-number",
      severity: "error",
      message: "Expected a finite number between 0 and 1.",
      path,
    });
  }
};

const getEndpointId = (endpoint: NeuralCoreRouteEndpointInput): string => {
  switch (endpoint.kind) {
    case "entity":
      return normalizeId(endpoint.entityId);
    case "cluster":
      return normalizeId(endpoint.clusterId);
  }
};

const endpointsAreEqual = (
  source: NeuralCoreRouteEndpointInput,
  target: NeuralCoreRouteEndpointInput,
): boolean => source.kind === target.kind && getEndpointId(source) === getEndpointId(target);

interface EndpointValidationContext {
  readonly clusterIds: ReadonlySet<string>;
  readonly entityIds: ReadonlySet<string>;
  readonly routeId: string;
  readonly routeIndex: number;
  readonly role: "source" | "target";
}

const validateEndpoint = (
  endpoint: NeuralCoreRouteEndpointInput,
  context: EndpointValidationContext,
  diagnostics: NeuralCoreDiagnostic[],
): void => {
  const id = getEndpointId(endpoint);
  const exists = endpoint.kind === "entity"
    ? context.entityIds.has(id)
    : context.clusterIds.has(id);
  if (exists) {
    return;
  }
  diagnostics.push({
    code: context.role === "source" ? "unknown-route-source" : "unknown-route-target",
    severity: "error",
    message: `Route "${context.routeId}" references unknown ${endpoint.kind} ${context.role} "${id}".`,
    path: ["routes", context.routeIndex, context.role, `${endpoint.kind}Id`],
    relatedIds: Object.freeze([context.routeId, id]),
  });
};

const validateModelMetadata = (
  input: NeuralCoreModelInput,
  diagnostics: NeuralCoreDiagnostic[],
): void => {
  diagnostics.push(...validateNeuralCoreMetadata(input.metadata, ["metadata"]));
  input.entities.forEach((entity, index) => {
    diagnostics.push(...validateNeuralCoreMetadata(
      entity.metadata,
      ["entities", index, "metadata"],
    ));
  });
  (input.clusters ?? []).forEach((cluster, index) => {
    diagnostics.push(...validateNeuralCoreMetadata(
      cluster.metadata,
      ["clusters", index, "metadata"],
    ));
  });
  input.routes.forEach((route, index) => {
    diagnostics.push(...validateNeuralCoreMetadata(
      route.metadata,
      ["routes", index, "metadata"],
    ));
  });
  (input.pathways ?? []).forEach((pathway, index) => {
    diagnostics.push(...validateNeuralCoreMetadata(
      pathway.metadata,
      ["pathways", index, "metadata"],
    ));
  });
};

export const validateNeuralCoreModel = (
  input: NeuralCoreModelInput,
): readonly NeuralCoreDiagnostic[] => {
  const diagnostics: NeuralCoreDiagnostic[] = [];
  const clusters = input.clusters ?? [];
  addEmptyTextDiagnostic(diagnostics, input.id, "empty-model-id", "Model id", ["id"]);

  if (input.entities.length === 0) {
    diagnostics.push({
      code: "model-has-no-entities",
      severity: "warning",
      message: "The model has no entities and will render only structural clusters.",
      path: ["entities"],
    });
  }

  const clusterIds = new Set(clusters.map((cluster) => normalizeId(cluster.id)));
  const entityIds = new Set(input.entities.map((entity) => normalizeId(entity.id)));
  const routeIds = new Set(input.routes.map((route) => normalizeId(route.id)));

  input.entities.forEach((entity, index) => {
    addEmptyTextDiagnostic(
      diagnostics,
      entity.id,
      "empty-entity-id",
      "Entity id",
      ["entities", index, "id"],
    );
    addEmptyTextDiagnostic(
      diagnostics,
      entity.label,
      "empty-required-field",
      "Entity label",
      ["entities", index, "label"],
    );
    addNormalizedNumberDiagnostic(diagnostics, entity.activity, ["entities", index, "activity"]);
    if (entity.clusterId !== undefined && !clusterIds.has(normalizeId(entity.clusterId))) {
      diagnostics.push({
        code: "unknown-entity-cluster",
        severity: "error",
        message: `Entity "${normalizeId(entity.id)}" references unknown cluster "${normalizeId(entity.clusterId)}".`,
        path: ["entities", index, "clusterId"],
        relatedIds: Object.freeze([normalizeId(entity.id), normalizeId(entity.clusterId)]),
      });
    }
  });

  clusters.forEach((cluster, index) => {
    addEmptyTextDiagnostic(
      diagnostics,
      cluster.id,
      "empty-cluster-id",
      "Cluster id",
      ["clusters", index, "id"],
    );
    addNormalizedNumberDiagnostic(diagnostics, cluster.activity, ["clusters", index, "activity"]);
    addNormalizedNumberDiagnostic(
      diagnostics,
      cluster.importance,
      ["clusters", index, "importance"],
    );
  });

  input.routes.forEach((route, index) => {
    const routeId = normalizeId(route.id);
    addEmptyTextDiagnostic(
      diagnostics,
      route.id,
      "empty-route-id",
      "Route id",
      ["routes", index, "id"],
    );
    validateEndpoint(route.source, {
      clusterIds,
      entityIds,
      routeId,
      routeIndex: index,
      role: "source",
    }, diagnostics);
    validateEndpoint(route.target, {
      clusterIds,
      entityIds,
      routeId,
      routeIndex: index,
      role: "target",
    }, diagnostics);
    if ((route.relation ?? "association") !== "association"
      && endpointsAreEqual(route.source, route.target)) {
      diagnostics.push({
        code: "unsupported-self-reference",
        severity: "error",
        message: `Relation "${route.relation}" does not support a self-reference.`,
        path: ["routes", index],
        relatedIds: Object.freeze([routeId, getEndpointId(route.source)]),
      });
    }
    addNormalizedNumberDiagnostic(diagnostics, route.strength, ["routes", index, "strength"]);
  });

  (input.pathways ?? []).forEach((pathway, index) => {
    addEmptyTextDiagnostic(
      diagnostics,
      pathway.id,
      "empty-pathway-id",
      "Pathway id",
      ["pathways", index, "id"],
    );
    (pathway.clusterIds ?? []).forEach((clusterId, clusterIndex) => {
      if (!clusterIds.has(normalizeId(clusterId))) {
        diagnostics.push({
          code: "unknown-pathway-cluster",
          severity: "error",
          message: `Pathway "${normalizeId(pathway.id)}" references unknown cluster "${normalizeId(clusterId)}".`,
          path: ["pathways", index, "clusterIds", clusterIndex],
          relatedIds: Object.freeze([normalizeId(pathway.id), normalizeId(clusterId)]),
        });
      }
    });
    pathway.routeIds.forEach((routeId, routeIndex) => {
      if (!routeIds.has(normalizeId(routeId))) {
        diagnostics.push({
          code: "unknown-pathway-route",
          severity: "error",
          message: `Pathway "${normalizeId(pathway.id)}" references unknown route "${normalizeId(routeId)}".`,
          path: ["pathways", index, "routeIds", routeIndex],
          relatedIds: Object.freeze([normalizeId(pathway.id), normalizeId(routeId)]),
        });
      }
    });
  });

  addDuplicateIdDiagnostics(
    diagnostics,
    input.entities.map((entity) => entity.id),
    "duplicate-entity-id",
    "Entity",
    "entities",
  );
  addDuplicateIdDiagnostics(
    diagnostics,
    clusters.map((cluster) => cluster.id),
    "duplicate-cluster-id",
    "Cluster",
    "clusters",
  );
  addDuplicateIdDiagnostics(
    diagnostics,
    input.routes.map((route) => route.id),
    "duplicate-route-id",
    "Route",
    "routes",
  );
  addDuplicateIdDiagnostics(
    diagnostics,
    (input.pathways ?? []).map((pathway) => pathway.id),
    "duplicate-pathway-id",
    "Pathway",
    "pathways",
  );
  validateModelMetadata(input, diagnostics);
  return Object.freeze(diagnostics);
};

const normalizeEntity = (input: NeuralCoreModelInput["entities"][number]): NeuralCoreEntity => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"entity">(input.id),
    label: input.label,
    description: input.description,
    clusterId: input.clusterId === undefined
      ? undefined
      : toNeuralCoreIdAfterValidation<"cluster">(input.clusterId),
    kind: input.kind ?? "service",
    status: input.status ?? "idle",
    activity: input.activity ?? 0,
    metadata: preserveMetadata(input.metadata),
  });
};

const normalizeCluster = (
  input: NonNullable<NeuralCoreModelInput["clusters"]>[number],
): NeuralCoreCluster => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"cluster">(input.id),
    label: input.label,
    description: input.description,
    kind: input.kind,
    status: input.status ?? "idle",
    activity: input.activity ?? 0,
    importance: input.importance ?? 0.5,
    tags: Object.freeze([...(input.tags ?? [])]),
    metadata: preserveMetadata(input.metadata),
  });
};

const normalizeEndpoint = (input: NeuralCoreRouteEndpointInput): NeuralCoreRouteEndpoint => {
  switch (input.kind) {
    case "entity":
      return Object.freeze({
        kind: "entity",
        entityId: toNeuralCoreIdAfterValidation<"entity">(input.entityId),
      });
    case "cluster":
      return Object.freeze({
        kind: "cluster",
        clusterId: toNeuralCoreIdAfterValidation<"cluster">(input.clusterId),
      });
  }
};

const normalizeRoute = (input: NeuralCoreModelInput["routes"][number]): NeuralCoreRoute => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"route">(input.id),
    source: normalizeEndpoint(input.source),
    target: normalizeEndpoint(input.target),
    relation: input.relation ?? "association",
    direction: input.direction ?? "directed",
    status: input.status ?? "idle",
    strength: input.strength ?? 1,
    label: input.label,
    description: input.description,
    metadata: preserveMetadata(input.metadata),
  });
};

const normalizePathway = (
  input: NonNullable<NeuralCoreModelInput["pathways"]>[number],
): NeuralCorePathway => {
  return Object.freeze({
    id: toNeuralCoreIdAfterValidation<"pathway">(input.id),
    label: input.label,
    clusterIds: Object.freeze((input.clusterIds ?? []).map((clusterId) => (
      toNeuralCoreIdAfterValidation<"cluster">(clusterId)
    ))),
    routeIds: Object.freeze(input.routeIds.map((routeId) => (
      toNeuralCoreIdAfterValidation<"route">(routeId)
    ))),
    status: input.status ?? "idle",
    metadata: preserveMetadata(input.metadata),
  });
};

export const createNeuralCoreModel = (
  input: NeuralCoreModelInput,
): NeuralCoreValidationResult<NeuralCoreModel> => {
  const diagnostics = validateNeuralCoreModel(input);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    value: Object.freeze({
      id: toNeuralCoreIdAfterValidation<"model">(input.id),
      name: input.name,
      entities: Object.freeze(input.entities.map(normalizeEntity)),
      clusters: Object.freeze((input.clusters ?? []).map(normalizeCluster)),
      routes: Object.freeze(input.routes.map(normalizeRoute)),
      pathways: Object.freeze((input.pathways ?? []).map(normalizePathway)),
      metadata: preserveMetadata(input.metadata),
    }),
    diagnostics,
  };
};
