import { useCallback, useState, type ReactElement } from "react";

import {
  NeuralCore,
  type NeuralCoreEvent,
  type NeuralCoreModelInput,
  type NeuralCorePublicError,
  type NeuralCoreRuntimeInput,
} from "../index";

const model: NeuralCoreModelInput = {
  id: "checkout-runtime",
  entities: [
    {
      id: "checkout-api",
      label: "Checkout API",
      clusterId: "checkout",
      kind: "api",
    },
    {
      id: "payment-service",
      label: "Payment service",
      clusterId: "payments",
      kind: "service",
    },
  ],
  clusters: [
    { id: "checkout", label: "Checkout", kind: "process" },
    { id: "payments", label: "Payments", kind: "service" },
  ],
  routes: [
    {
      id: "submit-payment",
      source: { kind: "entity", entityId: "checkout-api" },
      target: { kind: "entity", entityId: "payment-service" },
      relation: "request",
    },
  ],
  pathways: [
    {
      id: "checkout-path",
      clusterIds: ["checkout", "payments"],
      routeIds: ["submit-payment"],
    },
  ],
};

const runtime: NeuralCoreRuntimeInput = {
  kind: "execution",
  autoStart: true,
  execution: {
    id: "checkout-request-42",
    name: "Checkout request",
    events: [
      {
        id: "payment-started",
        kind: "stage-processing",
        status: "processing",
        atMs: 0,
        durationMs: 900,
        entityId: "checkout-api",
        clusterId: "checkout",
        routeId: "submit-payment",
        pathwayId: "checkout-path",
        title: "Submitting payment",
        metrics: [
          {
            id: "request-latency",
            name: "Request latency",
            value: 42,
            unit: "ms",
            trend: "stable",
          },
        ],
      },
      {
        id: "payment-completed",
        kind: "execution-completed",
        status: "success",
        atMs: 900,
        entityId: "payment-service",
        clusterId: "payments",
        title: "Payment completed",
      },
    ],
    outcome: {
      status: "success",
      summary: "Payment completed successfully.",
      totalDurationMs: 900,
      metrics: [
        {
          id: "total-latency",
          name: "Total latency",
          value: 900,
          unit: "ms",
          status: "success",
        },
      ],
    },
  },
};

export const OperationalNeuralCoreExample = (): ReactElement => {
  const [message, setMessage] = useState("Waiting for execution");
  const handleEvent = useCallback((event: NeuralCoreEvent): void => {
    if (event.type === "runtime-event-observed") {
      setMessage(event.event.title);
    }
    if (event.type === "execution-completed") {
      setMessage(event.outcome.summary);
    }
  }, []);
  const handleError = useCallback((error: NeuralCorePublicError): void => {
    setMessage(error.message);
  }, []);

  return (
    <div>
      <output>{message}</output>
      <NeuralCore
        model={model}
        config={{ preset: "operational" }}
        runtime={runtime}
        onEvent={handleEvent}
        onError={handleError}
      />
    </div>
  );
};
