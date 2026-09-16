import type { ReactElement } from "react";

import {
  NeuralCore,
  type NeuralCoreModelInput,
} from "../index";

const model: NeuralCoreModelInput = {
  id: "service-overview",
  entities: [
    {
      id: "gateway-service",
      label: "Gateway",
      clusterId: "edge",
      kind: "gateway",
    },
    {
      id: "catalog-service",
      label: "Catalog",
      clusterId: "application",
      kind: "service",
    },
    {
      id: "audit-stream",
      label: "Audit stream",
      kind: "event",
    },
  ],
  clusters: [
    { id: "edge", label: "Edge", kind: "gateway" },
    { id: "application", label: "Application", kind: "service" },
  ],
  routes: [
    {
      id: "gateway-to-catalog",
      source: { kind: "entity", entityId: "gateway-service" },
      target: { kind: "entity", entityId: "catalog-service" },
      relation: "request",
    },
  ],
};

export const MinimalNeuralCoreExample = (): ReactElement => (
  <NeuralCore model={model} />
);
